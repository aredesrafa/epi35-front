/**
 * Utilitário para Detecção e Correção de Inconsistências de Estoque
 * 
 * Problema: Seeds scripts que inserem dados diretamente no Read Model (tabela de estoque)
 * sem gerar eventos correspondentes no Event Log, causando desincronização.
 * 
 * Solução: Detectar inconsistências comparando estoque atual vs kardex e corrigir
 * usando o endpoint POST /api/estoque/ajuste-direto do backend.
 */

import { api } from '../services/core/apiClient';
import { kardexAdapter } from '../services/entity/kardexAdapter';
import { inventoryCommandAdapter } from '../services/inventory/inventoryCommandAdapter';
import type { ItemEstoqueDTO } from '../types/serviceTypes';
import type { KardexData } from '../services/entity/kardexAdapter';

export interface InconsistencyReport {
  item: ItemEstoqueDTO;
  estoqueAtual: number;
  saldoKardex: number;
  diferenca: number;
  tipo: 'read_model_maior' | 'event_log_maior';
  severidade: 'critica' | 'alta' | 'media' | 'baixa';
  recomendacao: string;
}

export interface FixResult {
  success: boolean;
  itemId: string;
  nomeEquipamento: string;
  valorAnterior: number;
  valorCorrigido: number;
  ajusteId?: string;
  error?: string;
}

class StockConsistencyFixer {
  
  /**
   * Detecta todas as inconsistências de estoque no sistema
   */
  async detectInconsistencies(): Promise<InconsistencyReport[]> {
    console.log('🔍 INICIANDO: Detecção de inconsistências de estoque...');
    
    const inconsistencies: InconsistencyReport[] = [];
    
    try {
      // Buscar todos os itens de estoque (sem filtros)
      const response = await inventoryCommandAdapter.getInventoryItems({
        pageSize: 1000, // Buscar o máximo possível
        includeExpanded: true
      });
      
      console.log(`📦 ESTOQUE: ${response.data.length} itens encontrados para verificação`);
      
      // Verificar cada item individualmente
      for (const item of response.data) {
        try {
          await this.checkItemConsistency(item, inconsistencies);
          
          // Pequeno delay para não sobrecarregar o backend
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error: any) {
          console.warn(`⚠️ Erro ao verificar item ${item.id}:`, error);
          continue;
        }
      }
      
      console.log(`🚨 RESULTADO: ${inconsistencies.length} inconsistências detectadas`);
      
      // Ordenar por severidade (crítica primeiro)
      inconsistencies.sort((a, b) => {
        const severityOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
        return severityOrder[a.severidade] - severityOrder[b.severidade];
      });
      
      return inconsistencies;
      
    } catch (error: any) {
      console.error('❌ Erro fatal na detecção de inconsistências:', error);
      throw error;
    }
  }
  
  /**
   * Verifica consistência de um item específico
   */
  private async checkItemConsistency(
    item: ItemEstoqueDTO, 
    inconsistencies: InconsistencyReport[]
  ): Promise<void> {
    
    // Verificar se temos os IDs necessários
    const almoxarifadoId = item.almoxarifadoId || item.almoxarifado?.id;
    const tipoEpiId = item.tipoEPIId || item.tipoEpiId || item.tipoEPI?.id;
    
    if (!almoxarifadoId || !tipoEpiId) {
      console.warn(`⚠️ SKIP: Item ${item.id} sem IDs necessários`, { almoxarifadoId, tipoEpiId });
      return;
    }
    
    try {
      // Buscar kardex do item
      const kardexData = await kardexAdapter.obterKardex({
        almoxarifadoId,
        tipoEpiId
      });
      
      const estoqueAtual = item.quantidade;
      const saldoKardex = kardexData.saldoFinal;
      const diferenca = estoqueAtual - saldoKardex;
      
      // Se houver diferença, registrar inconsistência
      if (diferenca !== 0) {
        const inconsistency: InconsistencyReport = {
          item,
          estoqueAtual,
          saldoKardex,
          diferenca,
          tipo: diferenca > 0 ? 'read_model_maior' : 'event_log_maior',
          severidade: this.calculateSeverity(Math.abs(diferenca), estoqueAtual),
          recomendacao: this.generateRecommendation(diferenca, item)
        };
        
        inconsistencies.push(inconsistency);
        
        console.log(`🚨 INCONSISTÊNCIA: ${item.tipoEPI?.nomeEquipamento}`, {
          atual: estoqueAtual,
          kardex: saldoKardex,
          diferenca,
          tipo: inconsistency.tipo
        });
      }
      
    } catch (error: any) {
      console.warn(`⚠️ Erro ao buscar kardex para item ${item.id}:`, error);
    }
  }
  
  /**
   * Calcula severidade da inconsistência
   */
  private calculateSeverity(
    diferencaAbs: number, 
    estoqueAtual: number
  ): 'critica' | 'alta' | 'media' | 'baixa' {
    
    const percentual = estoqueAtual > 0 ? (diferencaAbs / estoqueAtual) * 100 : 100;
    
    if (estoqueAtual === 0 || percentual >= 100) return 'critica';
    if (percentual >= 50) return 'alta';
    if (percentual >= 20) return 'media';
    return 'baixa';
  }
  
  /**
   * Gera recomendação para correção
   */
  private generateRecommendation(diferenca: number, item: ItemEstoqueDTO): string {
    if (diferenca > 0) {
      return `Aplicar ajuste de -${diferenca} unidades (Read Model tem ${diferenca} a mais que Event Log)`;
    } else {
      return `Aplicar ajuste de +${Math.abs(diferenca)} unidades (Event Log tem ${Math.abs(diferenca)} a mais que Read Model)`;
    }
  }
  
  /**
   * Corrige uma inconsistência específica usando o endpoint ajuste-direto
   */
  async fixInconsistency(inconsistency: InconsistencyReport): Promise<FixResult> {
    const { item, saldoKardex, estoqueAtual } = inconsistency;
    
    console.log(`🔧 CORRIGINDO: ${item.tipoEPI?.nomeEquipamento || item.id}`);
    
    try {
      // Preparar payload para ajuste direto
      const ajustePayload = {
        almoxarifadoId: item.almoxarifadoId || item.almoxarifado?.id!,
        tipoEpiId: item.tipoEPIId || item.tipoEpiId || item.tipoEPI?.id!,
        novaQuantidade: saldoKardex, // Corrigir para o valor do kardex (source of truth)
        motivo: `Correção automática de inconsistência: estoque estava ${estoqueAtual}, kardex indica ${saldoKardex}. Causa provável: importação de dados seed sem geração de eventos.`,
        validarPermissao: true
      };
      
      console.log('📤 PAYLOAD ajuste-direto:', ajustePayload);
      
      // Chamar endpoint de ajuste direto
      const response = await api.post('/estoque/ajuste-direto', ajustePayload);
      
      const result: FixResult = {
        success: true,
        itemId: item.id,
        nomeEquipamento: item.tipoEPI?.nomeEquipamento || 'N/A',
        valorAnterior: estoqueAtual,
        valorCorrigido: saldoKardex,
        ajusteId: response.id || response.data?.id
      };
      
      console.log(`✅ CORRIGIDO: ${result.nomeEquipamento}`, {
        de: estoqueAtual,
        para: saldoKardex,
        ajusteId: result.ajusteId
      });
      
      return result;
      
    } catch (error: any) {
      console.error(`❌ ERRO na correção de ${item.tipoEPI?.nomeEquipamento}:`, error);
      
      return {
        success: false,
        itemId: item.id,
        nomeEquipamento: item.tipoEPI?.nomeEquipamento || 'N/A',
        valorAnterior: estoqueAtual,
        valorCorrigido: saldoKardex,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Corrige todas as inconsistências automaticamente
   */
  async fixAllInconsistencies(
    inconsistencies: InconsistencyReport[],
    options: {
      confirmarCriticas?: boolean;
      maxCorrecoesSimultaneas?: number;
      delayEntreCorrecoes?: number;
    } = {}
  ): Promise<FixResult[]> {
    
    const {
      confirmarCriticas = true,
      maxCorrecoesSimultaneas = 5,
      delayEntreCorrecoes = 1000
    } = options;
    
    console.log(`🔧 CORREÇÃO EM MASSA: ${inconsistencies.length} inconsistências`);
    
    const results: FixResult[] = [];
    
    // Filtrar inconsistências críticas se necessário
    let toFix = inconsistencies;
    if (confirmarCriticas) {
      const criticas = inconsistencies.filter(i => i.severidade === 'critica');
      if (criticas.length > 0) {
        console.warn(`⚠️ ${criticas.length} inconsistências CRÍTICAS detectadas. Avalie manualmente antes de corrigir automaticamente.`);
        toFix = inconsistencies.filter(i => i.severidade !== 'critica');
      }
    }
    
    // Processar em lotes para não sobrecarregar o backend
    for (let i = 0; i < toFix.length; i += maxCorrecoesSimultaneas) {
      const lote = toFix.slice(i, i + maxCorrecoesSimultaneas);
      
      console.log(`📦 Processando lote ${Math.floor(i / maxCorrecoesSimultaneas) + 1}/${Math.ceil(toFix.length / maxCorrecoesSimultaneas)}`);
      
      // Processar lote em paralelo
      const lotePromises = lote.map(inconsistency => this.fixInconsistency(inconsistency));
      const loteResults = await Promise.allSettled(lotePromises);
      
      // Processar resultados
      for (const result of loteResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('❌ Erro no lote:', result.reason);
        }
      }
      
      // Delay entre lotes
      if (i + maxCorrecoesSimultaneas < toFix.length) {
        await new Promise(resolve => setTimeout(resolve, delayEntreCorrecoes));
      }
    }
    
    const sucessos = results.filter(r => r.success).length;
    const falhas = results.filter(r => !r.success).length;
    
    console.log(`🎯 RESULTADO FINAL: ${sucessos} sucessos, ${falhas} falhas`);
    
    return results;
  }
  
  /**
   * Gera relatório detalhado de inconsistências
   */
  generateReport(inconsistencies: InconsistencyReport[]): string {
    if (inconsistencies.length === 0) {
      return '✅ Nenhuma inconsistência detectada. Sistema está íntegro.';
    }
    
    const bySevaridade = inconsistencies.reduce((acc, inc) => {
      acc[inc.severidade] = (acc[inc.severidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let report = `🚨 RELATÓRIO DE INCONSISTÊNCIAS DE ESTOQUE\n`;
    report += `==========================================\n`;
    report += `Total: ${inconsistencies.length} inconsistências\n`;
    report += `- Críticas: ${bySevaridade.critica || 0}\n`;
    report += `- Altas: ${bySevaridade.alta || 0}\n`;
    report += `- Médias: ${bySevaridade.media || 0}\n`;
    report += `- Baixas: ${bySevaridade.baixa || 0}\n\n`;
    
    report += `DETALHES:\n`;
    report += `----------\n`;
    
    for (const inc of inconsistencies) {
      report += `🔸 ${inc.item.tipoEPI?.nomeEquipamento || 'N/A'}\n`;
      report += `   ID do Item: ${inc.item.id}\n`;
      report += `   CA: ${inc.item.tipoEPI?.numeroCA || 'N/A'}\n`;
      report += `   Almoxarifado ID: ${inc.item.almoxarifadoId || inc.item.almoxarifado?.id || 'N/A'}\n`;
      report += `   Tipo EPI ID: ${inc.item.tipoEPIId || inc.item.tipoEpiId || inc.item.tipoEPI?.id || 'N/A'}\n`;
      report += `   Estoque Atual: ${inc.estoqueAtual}\n`;
      report += `   Saldo Kardex: ${inc.saldoKardex}\n`;
      report += `   Diferença: ${inc.diferenca}\n`;
      report += `   Severidade: ${inc.severidade.toUpperCase()}\n`;
      report += `   Recomendação: ${inc.recomendacao}\n\n`;
    }
    
    return report;
  }
}

export const stockConsistencyFixer = new StockConsistencyFixer();

/**
 * Função utilitária para executar verificação completa
 */
export async function runFullConsistencyCheck(
  autoFix: boolean = false
): Promise<{
  inconsistencies: InconsistencyReport[];
  fixes?: FixResult[];
  report: string;
}> {
  
  console.log('🚀 INICIANDO: Verificação completa de consistência de estoque');
  
  // Detectar inconsistências
  const inconsistencies = await stockConsistencyFixer.detectInconsistencies();
  
  // Gerar relatório
  const report = stockConsistencyFixer.generateReport(inconsistencies);
  console.log(report);
  
  let fixes: FixResult[] | undefined;
  
  // Corrigir automaticamente se solicitado
  if (autoFix && inconsistencies.length > 0) {
    console.log('🔧 Aplicando correções automáticas...');
    fixes = await stockConsistencyFixer.fixAllInconsistencies(inconsistencies, {
      confirmarCriticas: true, // Pular críticas por segurança
      maxCorrecoesSimultaneas: 3,
      delayEntreCorrecoes: 2000
    });
  }
  
  return {
    inconsistencies,
    fixes,
    report
  };
}
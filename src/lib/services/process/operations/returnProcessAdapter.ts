/**
 * Return Process Adapter - Processamento de Devoluções Simplificado
 * 
 * Responsabilidade: Devoluções com processamento em lote pelo backend.
 * Backend atualiza estoque, gera histórico e processa todas as devoluções.
 */

import { api } from '../../core/apiClient';

// ==================== INTERFACES ====================

export interface ReturnItem {
  equipamentoId: string;
  motivo: 'devolução padrão' | 'danificado' | 'troca' | 'outros';
  observacoes?: string;
}

export interface ReturnBatchPayload {
  devolucoes: ReturnItem[];
}

export interface ReturnBatchResult {
  success: boolean;
  data: {
    processadas: number;
    erros: Array<{
      equipamentoId: string;
      erro: string;
    }>;
    fichasAtualizadas: string[];
    estoqueAtualizado: boolean;
  };
}

export interface ReturnValidationResult {
  podeDevolver: boolean;
  motivo?: string;
  detalhes?: {
    equipamento: string;
    dataEntrega: string;
    diasEmPosse: number;
  };
}

// ==================== ADAPTER CLASS ====================

class ReturnProcessAdapter {
  
  /**
   * Processar devoluções em lote
   * Backend: processa todas, atualiza estoque, gera histórico
   */
  async processReturns(payload: ReturnBatchPayload): Promise<ReturnBatchResult> {
    console.log('🔄 ReturnProcessAdapter: Processando devoluções em lote:', payload);
    console.log(`  - Total de itens: ${payload.devolucoes.length}`);
    
    try {
      const response = await api.post<ReturnBatchResult>('/devolucoes/process-batch', payload);
      
      console.log('✅ Devoluções processadas:');
      console.log(`  - Processadas: ${response.data.processadas}`);
      console.log(`  - Erros: ${response.data.erros.length}`);
      console.log(`  - Fichas atualizadas: ${response.data.fichasAtualizadas.length}`);
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao processar devoluções:', error);
      throw error;
    }
  }

  /**
   * Validar se um equipamento pode ser devolvido
   * Lógica simplificada - dados de validação vêm do backend
   */
  async validateReturn(equipamentoId: string): Promise<ReturnValidationResult> {
    console.log('🔍 ReturnProcessAdapter: Validando devolução:', equipamentoId);
    
    try {
      const response = await api.get<ReturnValidationResult>(`/devolucoes/validate/${equipamentoId}`);
      
      if (response.podeDevolver) {
        console.log('✅ Equipamento pode ser devolvido');
      } else {
        console.log('⚠️ Equipamento não pode ser devolvido:', response.motivo);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao validar devolução:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de devoluções de uma ficha
   */
  async getReturnHistory(fichaId: string): Promise<any[]> {
    console.log('📋 ReturnProcessAdapter: Buscando histórico de devoluções:', fichaId);
    
    try {
      const response = await api.get(`/devolucoes/historico/${fichaId}`);
      console.log('✅ Histórico de devoluções carregado');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de devoluções:', error);
      throw error;
    }
  }

  /**
   * Cancelar uma devolução (se permitido)
   */
  async cancelReturn(devolucaoId: string, motivo: string): Promise<void> {
    console.log('❌ ReturnProcessAdapter: Cancelando devolução:', devolucaoId);
    
    try {
      await api.post(`/devolucoes/${devolucaoId}/cancel`, { motivo });
      console.log('✅ Devolução cancelada');
    } catch (error) {
      console.error('❌ Erro ao cancelar devolução:', error);
      throw error;
    }
  }
}

// ==================== EXPORT ====================

export const returnProcessAdapter = new ReturnProcessAdapter();
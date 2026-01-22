/**
 * Kardex Service Adapter
 * 
 * Adapter para buscar dados do kardex (histórico de movimentações) de itens do estoque
 * Conecta ao endpoint /api/estoque/kardex do backend
 */

import { api } from '../core/apiClient';

// ==================== TYPES ====================

export interface KardexMovimentacao {
  data: string;
  documento: string;
  tipoMovimentacao: string;
  entrada: number;
  saida: number;
  saldo: number;
  observacoes: string | null;
}

export interface KardexData {
  movimentacoes: KardexMovimentacao[];
  saldoInicial: number;
  saldoFinal: number;
  totalEntradas: number;
  totalSaidas: number;
}

export interface KardexParams {
  almoxarifadoId: string;
  tipoEpiId: string;
  dataInicio?: string;
  dataFim?: string;
}

// ==================== ADAPTER ====================

class KardexAdapter {
  /**
   * Busca histórico de movimentações (kardex) de um item específico
   */
  async obterKardex(params: KardexParams): Promise<KardexData> {
    try {
      console.log('📊 Buscando kardex:', params);

      const { almoxarifadoId, tipoEpiId, dataInicio, dataFim } = params;

      // Construir URL com parâmetros de query
      const queryParams = new URLSearchParams();
      if (dataInicio) queryParams.append('dataInicio', dataInicio);
      if (dataFim) queryParams.append('dataFim', dataFim);
      
      const queryString = queryParams.toString();
      const url = `/estoque/kardex/${almoxarifadoId}/${tipoEpiId}${queryString ? `?${queryString}` : ''}`;

      console.log('📡 Chamando endpoint:', url);

      const response = await api.get<{ success: boolean; data: KardexData }>(url);

      if (response.success && response.data) {
        const kardexData = response.data;
        
        // Validar e normalizar dados
        const normalizedData: KardexData = {
          movimentacoes: kardexData.movimentacoes || [],
          saldoInicial: kardexData.saldoInicial || 0,
          saldoFinal: kardexData.saldoFinal || 0,
          totalEntradas: kardexData.totalEntradas || 0,
          totalSaidas: kardexData.totalSaidas || 0
        };

        // Ordenar movimentações por data (mais recentes primeiro)
        normalizedData.movimentacoes.sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        );

        console.log('✅ Kardex carregado:', {
          movimentacoes: normalizedData.movimentacoes.length,
          saldoInicial: normalizedData.saldoInicial,
          saldoFinal: normalizedData.saldoFinal,
          totalEntradas: normalizedData.totalEntradas,
          totalSaidas: normalizedData.totalSaidas
        });

        return normalizedData;
      }

      throw new Error('Dados de kardex não encontrados');
    } catch (error: any) {
      console.error('❌ Erro ao buscar kardex:', error);
      
      // Para desenvolvimento, retornar dados mockados
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Retornando dados mockados para desenvolvimento');
        return this.getMockKardexData();
      }
      
      throw error;
    }
  }

  /**
   * Busca kardex com filtro por período pré-definido
   */
  async obterKardexPorPeriodo(
    almoxarifadoId: string, 
    tipoEpiId: string, 
    dias: number
  ): Promise<KardexData> {
    const dataFim = new Date().toISOString().split('T')[0];
    const dataInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.obterKardex({
      almoxarifadoId,
      tipoEpiId,
      dataInicio,
      dataFim
    });
  }

  // ==================== MOCK DATA ====================

  private getMockKardexData(): KardexData {
    return {
      movimentacoes: [
        {
          data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          documento: 'E4U302',
          tipoMovimentacao: 'SAIDA_ENTREGA',
          entrada: 0,
          saida: 2,
          saldo: 78,
          observacoes: 'Entrega para João Silva'
        },
        {
          data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          documento: 'ENT-2025-000123',
          tipoMovimentacao: 'ENTRADA_NOTA',
          entrada: 50,
          saida: 0,
          saldo: 80,
          observacoes: 'Compra de EPIs'
        },
        {
          data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          documento: 'DEV-2025-000045',
          tipoMovimentacao: 'ENTRADA_DEVOLUCAO',
          entrada: 3,
          saida: 0,
          saldo: 30,
          observacoes: 'Devolução de Maria Santos'
        },
        {
          data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          documento: 'TRF-2025-000012',
          tipoMovimentacao: 'SAIDA_TRANSFERENCIA',
          entrada: 0,
          saida: 5,
          saldo: 27,
          observacoes: 'Transferência para Almoxarifado Central'
        },
        {
          data: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          documento: 'AJU-2025-000003',
          tipoMovimentacao: 'AJUSTE_POSITIVO',
          entrada: 2,
          saida: 0,
          saldo: 32,
          observacoes: 'Ajuste de inventário'
        }
      ],
      saldoInicial: 30,
      saldoFinal: 78,
      totalEntradas: 55,
      totalSaidas: 7
    };
  }
}

// Singleton para reutilização
export const kardexAdapter = new KardexAdapter();
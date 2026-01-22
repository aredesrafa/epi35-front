/**
 * Ficha Detail Adapter - Detalhes Completos
 * Responsabilidade: Buscar dados completos de uma ficha específica
 */

import { api } from "../../../core/apiClient";
import { fichaTransformAdapter } from './fichaTransformAdapter';
import type { FichaCompleteResponse } from '../types';

export class FichaDetailAdapter {
  /**
   * Busca dados completos de uma ficha específica
   */
  async getFichaComplete(fichaId: string): Promise<FichaCompleteResponse> {
    if (!fichaId) {
      throw new Error('ID da ficha é obrigatório');
    }

    try {
      const [ficha, entregas, devolucoes] = await Promise.all([
        this.getFichaBasic(fichaId),
        this.getEntregas(fichaId),
        this.getDevolucoes(fichaId)
      ]);

      return {
        success: true,
        data: {
          ficha,
          entregas,
          devolucoes,
          equipamentosEmPosse: [],
          historico: [],
          estatisticas: {}
        }
      };
    } catch (error: any) {
      console.error(`Erro ao buscar ficha completa ${fichaId}:`, error);
      throw error;
    }
  }

  /**
   * Busca apenas os dados básicos da ficha
   */
  private async getFichaBasic(fichaId: string) {
    const response = await api.get(`/fichas-epi/${fichaId}`) as any;
    
    if (!response.success || !response.data) {
      throw new Error(`Ficha ${fichaId} não encontrada`);
    }

    return fichaTransformAdapter.transformFichaBasica(response.data);
  }

  /**
   * Busca entregas de uma ficha específica
   */
  private async getEntregas(fichaId: string) {
    try {
      const response = await api.get(`/fichas-epi/${fichaId}/entregas`) as any;
      
      if (!response.success || !response.data) {
        return [];
      }

      return this.transformEntregas(response.data);
    } catch (error: any) {
      console.error(`Erro ao buscar entregas da ficha ${fichaId}:`, error);
      return [];
    }
  }

  /**
   * Busca devoluções de uma ficha específica
   */
  private async getDevolucoes(fichaId: string) {
    try {
      const response = await api.get(`/fichas-epi/${fichaId}/devolucoes`) as any;
      
      if (!response.success || !response.data) {
        return [];
      }

      return this.transformDevolucoes(response.data);
    } catch (error: any) {
      console.error(`Erro ao buscar devoluções da ficha ${fichaId}:`, error);
      return [];
    }
  }

  /**
   * Transforma dados de entregas para formato padronizado
   */
  private transformEntregas(rawEntregas: any[]) {
    if (!Array.isArray(rawEntregas)) {
      return [];
    }

    return rawEntregas.map(entrega => ({
      id: entrega.id,
      dataEntrega: entrega.dataEntrega,
      responsavel: entrega.responsavel,
      status: entrega.status,
      itens: entrega.itens || [],
      observacoes: entrega.observacoes || '',
      assinada: entrega.assinada || false
    }));
  }

  /**
   * Transforma dados de devoluções para formato padronizado
   */
  private transformDevolucoes(rawDevolucoes: any[]) {
    if (!Array.isArray(rawDevolucoes)) {
      return [];
    }

    return rawDevolucoes.map(devolucao => ({
      id: devolucao.id,
      dataDevolucao: devolucao.dataDevolucao,
      responsavel: devolucao.responsavel,
      motivo: devolucao.motivo,
      itens: devolucao.itens || [],
      observacoes: devolucao.observacoes || ''
    }));
  }

  /**
   * Busca histórico de movimentações de uma ficha
   */
  async getHistoricoMovimentacoes(fichaId: string) {
    try {
      const response = await api.get(`/fichas-epi/${fichaId}/historico`) as any;
      
      if (!response.success || !response.data) {
        return [];
      }

      return response.data.map((movimento: any) => ({
        id: movimento.id,
        tipo: movimento.tipo,
        data: movimento.data,
        descricao: movimento.descricao,
        responsavel: movimento.responsavel,
        detalhes: movimento.detalhes || {}
      }));
    } catch (error: any) {
      console.error(`Erro ao buscar histórico da ficha ${fichaId}:`, error);
      return [];
    }
  }
}

export const fichaDetailAdapter = new FichaDetailAdapter();
/**
 * Ficha Transform Adapter - Transformações de Dados
 * Responsabilidade: Transformar dados da API para formato frontend
 */

import type { 
  FichaBasica, 
  PaginatedFichaResponse,
  FichaCompleteResponse 
} from '../types';
import type { FichaEPIDTO } from '$lib/types/serviceTypes';

export class FichaTransformAdapter {
  /**
   * Transforma lista de fichas do backend para frontend
   */
  transformFichasList(rawData: any): PaginatedFichaResponse {
    if (!rawData?.data?.items) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      };
    }

    return {
      items: rawData.data.items.map(this.transformFichaBasica),
      total: rawData.data.total || 0,
      page: rawData.data.page || 1,
      pageSize: rawData.data.pageSize || 10,
      totalPages: rawData.data.totalPages || 0
    };
  }

  /**
   * Transforma resultados de busca
   */
  transformSearchResults(rawData: any): FichaBasica[] {
    if (!rawData?.data?.items) {
      return [];
    }

    return rawData.data.items.map(this.transformFichaBasica);
  }

  /**
   * Transforma uma ficha individual para formato básico
   */
  private transformFichaBasica = (rawFicha: any): FichaBasica => {
    return {
      id: rawFicha.id || '',
      status: rawFicha.status || 'inativa',
      statusDisplay: this.transformStatusDisplay(rawFicha.status),
      colaborador: {
        nome: rawFicha.colaborador?.nome || '',
        cpf: rawFicha.colaborador?.cpf || '',
        cpfDisplay: this.formatCPF(rawFicha.colaborador?.cpf || ''),
        matricula: rawFicha.colaborador?.matricula || '',
        cargo: rawFicha.colaborador?.cargo || '',
        empresa: rawFicha.contratada?.nome || rawFicha.colaborador?.empresa || '',
        iniciais: this.extractInitials(rawFicha.colaborador?.nome || '')
      },
      estatisticas: {
        totalEntregas: rawFicha.estatisticas?.totalEntregas || 0,
        itensAtivos: rawFicha.estatisticas?.itensAtivos || 0,
        devolucoesPendentes: rawFicha.estatisticas?.devolucoesPendentes || 0
      },
      dataAtualizacao: rawFicha.dataAtualizacao || new Date().toISOString()
    };
  };

  /**
   * Transforma status para display
   */
  private transformStatusDisplay(status: string): { cor: string; label: string } {
    const statusMap = {
      'ativa': { cor: 'green', label: 'Ativa' },
      'inativa': { cor: 'gray', label: 'Inativa' },
      'vencida': { cor: 'red', label: 'Vencida' },
      'pendente_devolucao': { cor: 'yellow', label: 'Pendente Devolução' }
    };

    return statusMap[status as keyof typeof statusMap] || { cor: 'gray', label: 'Indefinido' };
  }

  /**
   * Formata CPF para exibição
   */
  private formatCPF(cpf: string): string {
    if (!cpf) return '';
    
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return cpf;
    
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Extrai iniciais do nome
   */
  private extractInitials(nome: string): string {
    if (!nome) return '';
    
    return nome
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Transforma resposta completa de ficha
   */
  transformFichaComplete(rawData: any): FichaCompleteResponse {
    if (!rawData?.success || !rawData?.data) {
      throw new Error('Dados de ficha completa inválidos');
    }

    return {
      success: true,
      data: {
        ficha: this.transformFichaBasica(rawData.data.ficha),
        entregas: rawData.data.entregas || [],
        devolucoes: rawData.data.devolucoes || []
      }
    };
  }
}

export const fichaTransformAdapter = new FichaTransformAdapter();
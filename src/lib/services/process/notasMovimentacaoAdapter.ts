/**
 * Notas Movimentacao Adapter - Conectado ao Backend Real
 * 
 * Adapter especializado para notas de movimentação baseado na estrutura real
 * do backend PostgreSQL (tabela notas_movimentacao)
 */

import { api, createUrlWithParams } from '../core/apiClient';
import type { PaginatedResponse, PaginationParams } from '$lib/stores/paginatedStore';

// ==================== INTERFACES E TIPOS ====================

// Enums do backend
export type TipoNotaEnum = 'ENTRADA' | 'TRANSFERENCIA' | 'DESCARTE' | 'ENTRADA_AJUSTE' | 'SAIDA_AJUSTE';
export type StatusNotaEnum = 'RASCUNHO' | 'CONCLUIDA' | 'CANCELADA';

// Item da nota de movimentação
export interface NotaMovimentacaoItem {
  id: string;
  nota_movimentacao_id: string;
  quantidade: number;
  estoque_item_id?: string; // Para saídas/transferências
  tipo_epi_id?: string; // Para entradas
  custo_unitario?: number;
  // Campos derivados para exibição
  equipamento_nome?: string;
  equipamento_ca?: string;
  categoria?: string;
}

// Nota de movimentação principal
export interface NotaMovimentacao {
  id: string;
  almoxarifado_id: string;
  almoxarifado_destino_id?: string; // Obrigatório apenas para TRANSFERENCIA
  responsavel_id: string;
  tipo_nota: TipoNotaEnum;
  status: StatusNotaEnum;
  numero_documento?: string;
  data_documento: string;
  observacoes?: string;
  created_at: string;
  // Relacionamentos expandidos
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  almoxarifado?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  almoxarifado_destino?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  itens?: NotaMovimentacaoItem[];
  // Campos derivados
  total_itens?: number;
  valor_total?: number;
}

// Parâmetros de filtro para listagem
export interface NotasMovimentacaoFilterParams extends PaginationParams {
  dataInicio?: string;
  dataFim?: string;
  status?: StatusNotaEnum;
  tipo?: TipoNotaEnum;
  numero?: string;
  responsavel_id?: string;
  almoxarifado_id?: string;
}

// Dados para criar nota
export interface CriarNotaMovimentacaoRequest {
  tipo_nota: TipoNotaEnum;
  almoxarifado_id: string;
  almoxarifado_destino_id?: string; // Apenas para TRANSFERENCIA
  numero_documento?: string;
  data_documento?: string; // Default: current_date
  observacoes?: string;
}

// Dados para atualizar nota (apenas RASCUNHO)
export interface AtualizarNotaMovimentacaoRequest {
  numero_documento?: string;
  data_documento?: string;
  observacoes?: string;
}

// Dados para adicionar item à nota
export interface AdicionarItemNotaRequest {
  tipo_epi_id?: string; // Para ENTRADA
  estoque_item_id?: string; // Para SAIDA/TRANSFERENCIA
  quantidade: number;
  custo_unitario?: number;
}

// Response de criação de nota
export interface CriarNotaResponse {
  success: boolean;
  data: {
    id: string;
    numero: string;
    tipo: TipoNotaEnum;
    status: StatusNotaEnum;
  };
}

// Response de conclusão de nota
export interface ConcluirNotaResponse {
  success: boolean;
  data: {
    movimentacoes_criadas: number;
    nota_id: string;
    status: StatusNotaEnum;
  };
}

// Validação de cancelamento
export interface ValidacaoCancelamento {
  pode_cancelar: boolean;
  motivo?: string;
  impactos?: string[];
}

// Opções para filtros
export interface NotasFilterOptions {
  responsaveis: Array<{ value: string; label: string }>;
  almoxarifados: Array<{ value: string; label: string }>;
  tipos: Array<{ value: TipoNotaEnum; label: string }>;
  status: Array<{ value: StatusNotaEnum; label: string }>;
}

// ==================== ADAPTER CLASS ====================

class NotasMovimentacaoAdapter {
  private baseEndpoint = '/notas-movimentacao';

  // ==================== CONSULTAS ====================

  /**
   * Lista notas de movimentação com filtros e paginação
   */
  async listarNotas(params: NotasMovimentacaoFilterParams = {}): Promise<PaginatedResponse<NotaMovimentacao>> {
    console.log('📋 NotasMovimentacaoAdapter: Listando notas', params);

    try {
      const url = createUrlWithParams(this.baseEndpoint, {
        page: params.page?.toString(),
        limit: params.limit?.toString(),
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
        status: params.status,
        tipo: params.tipo,
        numero: params.numero,
        responsavel_id: params.responsavel_id,
        almoxarifado_id: params.almoxarifado_id,
        search: params.search
      });

      const response = await api.get<{
        success: boolean;
        data: {
          items: NotaMovimentacao[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }>(url);

      console.log('✅ Notas listadas com sucesso:', response.data.pagination);

      return {
        data: response.data.items,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages
      };
    } catch (error) {
      console.error('❌ Erro ao listar notas:', error);
      throw new Error('Não foi possível carregar as notas de movimentação');
    }
  }

  /**
   * Busca uma nota específica por ID
   */
  async obterNota(id: string): Promise<NotaMovimentacao> {
    console.log('🔍 NotasMovimentacaoAdapter: Buscando nota', id);

    try {
      const response = await api.get<{
        success: boolean;
        data: NotaMovimentacao;
      }>(`${this.baseEndpoint}/${id}`);

      console.log('✅ Nota encontrada:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar nota:', error);
      throw new Error('Não foi possível encontrar a nota');
    }
  }

  /**
   * Lista apenas rascunhos do usuário atual
   */
  async listarRascunhos(): Promise<NotaMovimentacao[]> {
    console.log('📝 NotasMovimentacaoAdapter: Listando rascunhos');

    try {
      const response = await api.get<{
        success: boolean;
        data: NotaMovimentacao[];
      }>(`${this.baseEndpoint}/rascunhos`);

      console.log('✅ Rascunhos listados:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar rascunhos:', error);
      throw new Error('Não foi possível carregar os rascunhos');
    }
  }

  // ==================== COMANDOS ====================

  /**
   * Cria uma nova nota de movimentação
   */
  async criarNota(data: CriarNotaMovimentacaoRequest): Promise<CriarNotaResponse> {
    console.log('➕ NotasMovimentacaoAdapter: Criando nota', data);

    try {
      const response = await api.post<CriarNotaResponse>(this.baseEndpoint, data);

      console.log('✅ Nota criada com sucesso:', response.data.id);
      return response;
    } catch (error) {
      console.error('❌ Erro ao criar nota:', error);
      throw new Error('Não foi possível criar a nota de movimentação');
    }
  }

  /**
   * Atualiza uma nota em RASCUNHO
   */
  async atualizarNota(id: string, data: AtualizarNotaMovimentacaoRequest): Promise<NotaMovimentacao> {
    console.log('📝 NotasMovimentacaoAdapter: Atualizando nota', id, data);

    try {
      const response = await api.put<{
        success: boolean;
        data: NotaMovimentacao;
      }>(`${this.baseEndpoint}/${id}`, data);

      console.log('✅ Nota atualizada com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar nota:', error);
      throw new Error('Não foi possível atualizar a nota');
    }
  }

  /**
   * Exclui uma nota em RASCUNHO
   */
  async excluirNota(id: string): Promise<void> {
    console.log('🗑️ NotasMovimentacaoAdapter: Excluindo nota', id);

    try {
      await api.delete(`${this.baseEndpoint}/${id}`);
      console.log('✅ Nota excluída com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
      throw new Error('Não foi possível excluir a nota');
    }
  }

  // ==================== GERENCIAMENTO DE ITENS ====================

  /**
   * Adiciona item à nota
   */
  async adicionarItem(notaId: string, item: AdicionarItemNotaRequest): Promise<NotaMovimentacaoItem> {
    console.log('➕ NotasMovimentacaoAdapter: Adicionando item', notaId, item);

    try {
      const response = await api.post<{
        success: boolean;
        data: NotaMovimentacaoItem;
      }>(`${this.baseEndpoint}/${notaId}/itens`, item);

      console.log('✅ Item adicionado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar item:', error);
      throw new Error('Não foi possível adicionar o item à nota');
    }
  }

  /**
   * Atualiza quantidade de um item
   */
  async atualizarQuantidade(notaId: string, tipoEpiId: string, quantidade: number): Promise<void> {
    console.log('📝 NotasMovimentacaoAdapter: Atualizando quantidade', notaId, tipoEpiId, quantidade);

    try {
      await api.put(`${this.baseEndpoint}/${notaId}/itens/${tipoEpiId}`, { quantidade });
      console.log('✅ Quantidade atualizada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error);
      throw new Error('Não foi possível atualizar a quantidade');
    }
  }

  /**
   * Remove item da nota
   */
  async removerItem(notaId: string, itemId: string): Promise<void> {
    console.log('🗑️ NotasMovimentacaoAdapter: Removendo item', notaId, itemId);

    try {
      await api.delete(`${this.baseEndpoint}/${notaId}/itens/${itemId}`);
      console.log('✅ Item removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover item:', error);
      throw new Error('Não foi possível remover o item');
    }
  }

  // ==================== OPERAÇÕES DE ESTADO ====================

  /**
   * Conclui uma nota (marca como CONCLUIDA e gera movimentações)
   */
  async concluirNota(id: string): Promise<ConcluirNotaResponse> {
    console.log('⚡ NotasMovimentacaoAdapter: Concluindo nota', id);

    try {
      const response = await api.post<ConcluirNotaResponse>(`${this.baseEndpoint}/${id}/concluir`);

      console.log('✅ Nota concluída com sucesso:', response.data.movimentacoes_criadas);
      return response;
    } catch (error) {
      console.error('❌ Erro ao concluir nota:', error);
      throw new Error('Não foi possível concluir a nota');
    }
  }

  /**
   * Cancela uma nota
   */
  async cancelarNota(id: string): Promise<void> {
    console.log('❌ NotasMovimentacaoAdapter: Cancelando nota', id);

    try {
      await api.post(`${this.baseEndpoint}/${id}/cancelar`);
      console.log('✅ Nota cancelada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao cancelar nota:', error);
      throw new Error('Não foi possível cancelar a nota');
    }
  }

  /**
   * Valida se uma nota pode ser cancelada
   */
  async validarCancelamento(id: string): Promise<ValidacaoCancelamento> {
    console.log('🔍 NotasMovimentacaoAdapter: Validando cancelamento', id);

    try {
      const response = await api.get<{
        success: boolean;
        data: ValidacaoCancelamento;
      }>(`${this.baseEndpoint}/${id}/validar-cancelamento`);

      console.log('✅ Validação realizada:', response.data.pode_cancelar);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao validar cancelamento:', error);
      throw new Error('Não foi possível validar o cancelamento');
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Obtém opções para filtros extraindo dados únicos
   */
  async obterOpcoesFilters(): Promise<NotasFilterOptions> {
    console.log('🔧 NotasMovimentacaoAdapter: Carregando opções de filtros');

    try {
      // Para extrair opções, fazer uma busca com limite máximo permitido
      const data = await this.listarNotas({ page: 1, limit: 100 });

      // Extrair responsáveis únicos
      const responsaveis = [...new Set(
        data.data
          .filter(nota => nota.responsavel?.nome)
          .map(nota => nota.responsavel!.nome)
      )]
        .sort()
        .map(nome => ({ value: nome, label: nome }));

      // Extrair almoxarifados únicos
      const almoxarifados = [...new Set(
        data.data
          .filter(nota => nota.almoxarifado?.nome)
          .map(nota => nota.almoxarifado!.nome)
      )]
        .sort()
        .map(nome => ({ value: nome, label: nome }));

      // Tipos fixos do enum
      const tipos: Array<{ value: TipoNotaEnum; label: string }> = [
        { value: 'ENTRADA', label: 'Entrada' },
        { value: 'TRANSFERENCIA', label: 'Transferência' },
        { value: 'DESCARTE', label: 'Descarte' },
        { value: 'ENTRADA_AJUSTE', label: 'Entrada (Ajuste)' },
        { value: 'SAIDA_AJUSTE', label: 'Saída (Ajuste)' }
      ];

      // Status fixos do enum
      const status: Array<{ value: StatusNotaEnum; label: string }> = [
        { value: 'RASCUNHO', label: 'Rascunho' },
        { value: 'CONCLUIDA', label: 'Concluída' },
        { value: 'CANCELADA', label: 'Cancelada' }
      ];

      console.log('✅ Opções de filtros carregadas');
      return { responsaveis, almoxarifados, tipos, status };
    } catch (error) {
      console.error('❌ Erro ao carregar opções de filtros:', error);
      
      // Retornar opções básicas em caso de erro
      return {
        responsaveis: [],
        almoxarifados: [],
        tipos: [
          { value: 'ENTRADA', label: 'Entrada' },
          { value: 'TRANSFERENCIA', label: 'Transferência' },
          { value: 'DESCARTE', label: 'Descarte' },
          { value: 'ENTRADA_AJUSTE', label: 'Entrada (Ajuste)' },
          { value: 'SAIDA_AJUSTE', label: 'Saída (Ajuste)' }
        ],
        status: [
          { value: 'RASCUNHO', label: 'Rascunho' },
          { value: 'CONCLUIDA', label: 'Concluída' },
          { value: 'CANCELADA', label: 'Cancelada' }
        ]
      };
    }
  }

  /**
   * Obtém label amigável para tipo de nota
   */
  getTipoNotaLabel(tipo: TipoNotaEnum): string {
    const labels: Record<TipoNotaEnum, string> = {
      'ENTRADA': 'Entrada',
      'TRANSFERENCIA': 'Transferência',
      'DESCARTE': 'Descarte',
      'ENTRADA_AJUSTE': 'Entrada (Ajuste)',
      'SAIDA_AJUSTE': 'Saída (Ajuste)'
    };
    return labels[tipo] || tipo;
  }

  /**
   * Obtém label amigável para status
   */
  getStatusNotaLabel(status: StatusNotaEnum): string {
    const labels: Record<StatusNotaEnum, string> = {
      'RASCUNHO': 'Rascunho',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    };
    return labels[status] || status;
  }

  /**
   * Obtém cor do badge para status
   */
  getStatusBadgeColor(status: StatusNotaEnum): 'gray' | 'green' | 'red' | 'yellow' {
    const colors: Record<StatusNotaEnum, 'gray' | 'green' | 'red' | 'yellow'> = {
      'RASCUNHO': 'yellow',
      'CONCLUIDA': 'green',
      'CANCELADA': 'red'
    };
    return colors[status] || 'gray';
  }
}

// ==================== EXPORT ====================

export const notasMovimentacaoAdapter = new NotasMovimentacaoAdapter();
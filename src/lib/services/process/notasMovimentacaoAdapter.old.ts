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

// Nota de movimentação principal (estrutura do backend real)
export interface NotaMovimentacao {
  id: string;
  numero: string;
  tipo: TipoNotaEnum;
  almoxarifadoOrigemId?: string; // Para TRANSFERENCIA e DESCARTE
  almoxarifadoDestinoId?: string; // Para ENTRADA e TRANSFERENCIA
  usuarioId: string;
  observacoes?: string;
  _status: StatusNotaEnum;
  createdAt: string;
  _itens?: NotaMovimentacaoItem[];
  
  // Campos para compatibilidade com frontend legacy
  almoxarifado_id?: string; // Mapping de almoxarifadoOrigemId
  almoxarifado_destino_id?: string; // Mapping de almoxarifadoDestinoId
  responsavel_id?: string; // Mapping de usuarioId
  tipo_nota?: TipoNotaEnum; // Mapping de tipo
  status?: StatusNotaEnum; // Mapping de _status
  numero_documento?: string; // Mapping de numero
  data_documento?: string; // Mapping de createdAt
  created_at?: string; // Mapping de createdAt
  itens?: NotaMovimentacaoItem[]; // Mapping de _itens
  
  // Relacionamentos expandidos (quando incluídos)
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
  almoxarifado_origem_id?: string; // Para TRANSFERENCIA e DESCARTE
  almoxarifado_destino_id?: string; // Para ENTRADA e TRANSFERENCIA
  responsavel_id?: string; // ID do usuário responsável (será obtido automaticamente se não fornecido)
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
  tipo_epi_id?: string; // Para ENTRADA (frontend format)
  estoque_item_id?: string; // Para SAIDA/TRANSFERENCIA (frontend format)
  quantidade: number;
  custo_unitario?: number;
  
  // Backend format (for direct API calls)
  tipoEpiId?: string; // Backend expects camelCase
  estoqueItemId?: string; // Backend expects camelCase
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
      // Primeiro tenta filtrar no backend
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

      const response = await api.get<any>(url, { 
        timeout: 30000,
        retries: 2 
      });

      console.log('✅ Notas listadas com sucesso:', response);

      // Handle different response structures from backend
      let rawItems: any[] = [];
      let pagination = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      if (response.data) {
        rawItems = Array.isArray(response.data) ? response.data : (response.data.items || response.data || []);
        
        if (response.pagination) {
          pagination = {
            total: response.pagination.total || 0,
            page: response.pagination.page || 1,
            limit: response.pagination.limit || 10,
            totalPages: response.pagination.totalPages || 1
          };
        } else {
          // If no pagination info, assume single page
          pagination = {
            total: rawItems.length,
            page: 1,
            limit: rawItems.length,
            totalPages: 1
          };
        }
      } else if (Array.isArray(response)) {
        rawItems = response;
        pagination = {
          total: rawItems.length,
          page: 1,
          limit: rawItems.length,
          totalPages: 1
        };
      }

      // Normalize all items to ensure compatibility
      const items: NotaMovimentacao[] = rawItems.map(item => this.normalizeNotaData(item));

      return {
        data: items,
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.limit,
        totalPages: pagination.totalPages
      };
    } catch (error) {
      console.error('❌ Erro ao listar notas:', error);
      
      // Se for timeout, usar dados de fallback temporariamente
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        console.warn('⚠️ Backend indisponível, usando dados de fallback para notas');
        const fallbackData = this.getFallbackNotas();
        return {
          data: fallbackData,
          total: fallbackData.length,
          page: 1,
          pageSize: fallbackData.length,
          totalPages: 1
        };
      }
      
      throw new Error('Não foi possível carregar as notas de movimentação');
    }
  }

  /**
   * Busca uma nota específica por ID
   */
  async obterNota(id: string): Promise<NotaMovimentacao> {
    console.log('🔍 NotasMovimentacaoAdapter: Buscando nota', id);

    try {
      const response = await api.get<any>(`${this.baseEndpoint}/${id}`);

      // Handle different response structures
      const rawData = response.data || response;
      const normalizedData = this.normalizeNotaData(rawData);

      console.log('✅ Nota encontrada:', normalizedData.id);
      return normalizedData;
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
      const response = await api.get<any>(`${this.baseEndpoint}/rascunhos`);

      // Handle different response structures
      const rawData = response.data || response;
      const rawItems = Array.isArray(rawData) ? rawData : (rawData.items || []);
      
      // Normalize all items
      const items = rawItems.map((item: any) => this.normalizeNotaData(item));

      console.log('✅ Rascunhos listados:', items.length);
      return items;
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
      // Get default almoxarifado if needed
      let defaultAlmoxarifadoId = '';
      if (!data.almoxarifado_origem_id && !data.almoxarifado_destino_id) {
        console.log('🔍 Buscando almoxarifado padrão...');
        try {
          const estoque = await api.get<{ 
            success: boolean; 
            data: { 
              items: Array<{ 
                almoxarifadoId: string; 
                almoxarifado: { id: string; nome: string } 
              }> 
            } 
          }>('/estoque/itens?limit=1');
          
          if (estoque.data.items.length > 0) {
            defaultAlmoxarifadoId = estoque.data.items[0].almoxarifadoId;
            console.log('✅ Almoxarifado padrão encontrado:', estoque.data.items[0].almoxarifado.nome);
          }
        } catch (estoqueError) {
          console.error('❌ Erro ao buscar almoxarifado padrão:', estoqueError);
        }
      }

      // Transform frontend request to match backend expectations
      const backendRequest: any = {
        tipo: data.tipo_nota // Backend expects 'tipo'
      };
      
      // Configure almoxarifados based on note type
      switch (data.tipo_nota) {
        case 'ENTRADA':
          // ENTRADA: almoxarifadoOrigemId = null, almoxarifadoDestinoId required
          backendRequest.almoxarifadoDestinoId = data.almoxarifado_destino_id || defaultAlmoxarifadoId;
          console.log('📥 ENTRADA: almoxarifadoDestinoId =', backendRequest.almoxarifadoDestinoId);
          break;
          
        case 'TRANSFERENCIA':
          // TRANSFERENCIA: Both almoxarifados required and must be different
          backendRequest.almoxarifadoOrigemId = data.almoxarifado_origem_id || defaultAlmoxarifadoId;
          backendRequest.almoxarifadoDestinoId = data.almoxarifado_destino_id;
          
          // If destination not provided, find a different almoxarifado
          if (!backendRequest.almoxarifadoDestinoId) {
            try {
              const estoque = await api.get<{ 
                success: boolean; 
                data: { 
                  items: Array<{ 
                    almoxarifadoId: string; 
                    almoxarifado: { id: string; nome: string } 
                  }> 
                } 
              }>('/estoque/itens?limit=10');
              
              const differentAlmoxarifado = estoque.data.items.find(
                item => item.almoxarifadoId !== backendRequest.almoxarifadoOrigemId
              );
              
              if (differentAlmoxarifado) {
                backendRequest.almoxarifadoDestinoId = differentAlmoxarifado.almoxarifadoId;
                console.log('🔄 Almoxarifado destino automático:', differentAlmoxarifado.almoxarifado.nome);
              } else {
                throw new Error('Não foi possível encontrar almoxarifado de destino diferente');
              }
            } catch (destError) {
              throw new Error('Almoxarifado de destino é obrigatório para transferências');
            }
          }
          console.log('🔄 TRANSFERENCIA: origem =', backendRequest.almoxarifadoOrigemId, 'destino =', backendRequest.almoxarifadoDestinoId);
          break;
          
        case 'DESCARTE':
        case 'SAIDA_AJUSTE':
          // DESCARTE/SAIDA: Only almoxarifadoOrigemId required
          backendRequest.almoxarifadoOrigemId = data.almoxarifado_origem_id || defaultAlmoxarifadoId;
          console.log('📤 DESCARTE/SAIDA: almoxarifadoOrigemId =', backendRequest.almoxarifadoOrigemId);
          break;
          
        case 'ENTRADA_AJUSTE':
          // ENTRADA_AJUSTE: Similar to ENTRADA
          backendRequest.almoxarifadoDestinoId = data.almoxarifado_destino_id || defaultAlmoxarifadoId;
          console.log('📥 ENTRADA_AJUSTE: almoxarifadoDestinoId =', backendRequest.almoxarifadoDestinoId);
          break;
      }
      
      // Add responsavel_id - always required for note creation
      if (data.responsavel_id) {
        backendRequest.responsavel_id = data.responsavel_id;
      } else {
        // Get first available user as default - REQUIRED for backend
        try {
          const usuarios = await api.get<{ items: Array<{ id: string; nome: string }> }>('/usuarios?limit=1');
          if (usuarios.items && usuarios.items.length > 0) {
            backendRequest.responsavel_id = usuarios.items[0].id;
            console.log('🔄 Usando usuário padrão para nota:', usuarios.items[0].nome);
          } else {
            throw new Error('Nenhum usuário disponível para criar a nota');
          }
        } catch (userError) {
          console.error('❌ Erro ao obter usuário padrão:', userError);
          throw new Error('Não foi possível obter usuário responsável pela nota');
        }
      }
      
      // Add optional fields
      if (data.numero_documento) {
        backendRequest.numero_documento = data.numero_documento;
      }
      
      if (data.data_documento) {
        backendRequest.data_documento = data.data_documento;
      }
      
      if (data.observacoes) {
        backendRequest.observacoes = data.observacoes;
      }
      
      console.log('🔄 Request final para backend:', backendRequest);

      // Create the note
      const response = await api.post<CriarNotaResponse>(this.baseEndpoint, backendRequest);
      console.log('✅ Nota criada com sucesso:', response.data?.id || response.id);
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao criar nota:', error);
      
      // Enhanced error reporting
      if (error.response?.data?.message) {
        console.error('❌ Erro detalhado do backend:', error.response.data.message);
        throw new Error(`Erro do servidor: ${error.response.data.message}`);
      }
      
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
      // Transform frontend request to backend format
      const backendRequest: any = {
        quantidade: item.quantidade
      };
      
      // Map tipoEpiId - required for ENTRADA
      if (item.tipo_epi_id || item.tipoEpiId) {
        backendRequest.tipoEpiId = item.tipoEpiId || item.tipo_epi_id;
        console.log('📦 Adicionando tipo EPI:', backendRequest.tipoEpiId);
      }
      
      // Map estoqueItemId - required for SAIDA/TRANSFERENCIA  
      if (item.estoque_item_id || item.estoqueItemId) {
        backendRequest.estoqueItemId = item.estoqueItemId || item.estoque_item_id;
        console.log('📦 Adicionando item de estoque:', backendRequest.estoqueItemId);
      }
      
      // Add optional cost - ensure it's a number
      if (item.custo_unitario) {
        const custo = typeof item.custo_unitario === 'string' 
          ? parseFloat(item.custo_unitario) 
          : item.custo_unitario;
        
        if (!isNaN(custo) && custo > 0) {
          backendRequest.custoUnitario = custo;
        }
      }
      
      console.log('🔄 Request item para backend:', backendRequest);

      const response = await api.post<{
        success: boolean;
        data: NotaMovimentacaoItem;
      }>(`${this.baseEndpoint}/${notaId}/itens`, backendRequest);

      console.log('✅ Item adicionado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar item:', error);
      
      if (error.response?.data?.message) {
        console.error('❌ Detalhes do erro:', error.response.data);
        throw new Error(`Erro do servidor: ${error.response.data.message}`);
      }
      
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

      const successData = response.data || response;
      const movimentacoes = successData.movimentacoesCriadas?.length || 
                           successData.data?.movimentacoesCriadas?.length || 
                           'dados não disponíveis';
      
      console.log('✅ Nota concluída com sucesso:', movimentacoes);
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

  /**
   * Obtém nota com todos os dados relacionados (itens, almoxarifados, responsável)
   */
  async obterNotaCompleta(id: string): Promise<NotaMovimentacao> {
    console.log('📋 NotasMovimentacaoAdapter: Obtendo nota completa', id);

    try {
      const response = await api.get<{
        success: boolean;
        data: NotaMovimentacao & {
          itens: NotaMovimentacaoItem[];
          almoxarifado: { id: string; nome: string };
          almoxarifado_destino?: { id: string; nome: string };
          responsavel: { id: string; nome: string; email: string };
        };
      }>(`${this.baseEndpoint}/${id}?include=itens,almoxarifado,responsavel`);

      console.log('✅ Nota completa encontrada:', response.data.id, 'com', response.data.itens?.length || 0, 'itens');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar nota completa:', error);
      throw new Error('Não foi possível carregar os dados completos da nota');
    }
  }

  /**
   * Valida se a nota pode ser concluída (validação local sem chamar backend)
   */
  async validarNotaAntesConcluir(id: string): Promise<{
    pode_concluir: boolean;
    erros: string[];
    avisos?: string[];
    total_itens_processados?: number;
    movimentacoes_previstas?: number;
  }> {
    console.log('🔍 NotasMovimentacaoAdapter: Validação local da nota', id);

    try {
      // Buscar nota e fazer validação básica local
      const nota = await this.obterNota(id);
      
      const erros: string[] = [];
      const avisos: string[] = [];
      
      // Verificar se tem itens
      if (!nota.itens || nota.itens.length === 0) {
        erros.push('Nota deve ter pelo menos um item');
      }
      
      // Verificar se já está concluída
      if (nota.status === 'CONCLUIDA' || nota._status === 'CONCLUIDA') {
        erros.push('Nota já foi concluída anteriormente');
      }
      
      // Verificar se está cancelada
      if (nota.status === 'CANCELADA' || nota._status === 'CANCELADA') {
        erros.push('Nota cancelada não pode ser concluída');
      }
      
      const podeConfirmar = erros.length === 0;
      
      if (podeConfirmar) {
        avisos.push('Validação local aprovada');
      }
      
      console.log('✅ Validação local concluída:', { podeConfirmar, erros: erros.length, itens: nota.itens?.length });
      
      return {
        pode_concluir: podeConfirmar,
        erros,
        avisos,
        total_itens_processados: nota.itens?.length || 0,
        movimentacoes_previstas: nota.itens?.length || 0
      };
    } catch (error) {
      console.error('❌ Erro na validação local:', error);
      return {
        pode_concluir: false,
        erros: ['Não foi possível carregar dados da nota para validação'],
        avisos: ['Erro na validação local']
      };
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Normaliza dados do backend para compatibilidade com frontend
   */
  private normalizeNotaData(nota: any): NotaMovimentacao {
    return {
      // Campos reais do backend
      id: nota.id,
      numero: nota.numero,
      tipo: nota.tipo,
      almoxarifadoOrigemId: nota.almoxarifadoOrigemId,
      almoxarifadoDestinoId: nota.almoxarifadoDestinoId,
      usuarioId: nota.usuarioId,
      observacoes: nota.observacoes,
      _status: nota._status,
      createdAt: nota.createdAt,
      _itens: nota._itens || [],
      
      // Mapeamentos para compatibilidade legacy
      almoxarifado_id: nota.almoxarifadoOrigemId || nota.almoxarifado_id,
      almoxarifado_destino_id: nota.almoxarifadoDestinoId || nota.almoxarifado_destino_id,
      responsavel_id: nota.usuarioId || nota.responsavel_id,
      tipo_nota: nota.tipo || nota.tipo_nota,
      status: nota._status || nota.status,
      numero_documento: nota.numero || nota.numero_documento,
      data_documento: nota.createdAt || nota.data_documento,
      created_at: nota.createdAt || nota.created_at,
      itens: nota._itens || nota.itens || [],
      
      // Relacionamentos (se presentes)
      responsavel: nota.responsavel,
      almoxarifado: nota.almoxarifado,
      almoxarifado_destino: nota.almoxarifado_destino,
      
      // Campos derivados
      total_itens: nota._itens?.length || nota.itens?.length || 0,
      valor_total: nota.valor_total || 0
    };
  }

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
  getStatusBadgeColor(status: StatusNotaEnum): 'green' | 'red' | 'yellow' | 'primary' | 'blue' | 'dark' | 'purple' | 'indigo' | 'pink' | 'none' {
    const colors: Record<StatusNotaEnum, 'green' | 'red' | 'yellow' | 'primary' | 'blue' | 'dark' | 'purple' | 'indigo' | 'pink' | 'none'> = {
      'RASCUNHO': 'yellow',
      'CONCLUIDA': 'green',
      'CANCELADA': 'red'
    };
    return colors[status] || 'dark';
  }

  /**
   * Dados de fallback quando backend está indisponível
   */
  private getFallbackNotas(): NotaMovimentacao[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'fallback-1',
        almoxarifado_id: 'fallback-1',
        responsavel_id: 'user-1',
        tipo_nota: 'ENTRADA',
        status: 'RASCUNHO',
        numero_documento: 'NF-001-DEMO',
        data_documento: today,
        observacoes: 'Nota de demonstração - Backend indisponível',
        created_at: new Date().toISOString(),
        responsavel: {
          id: 'user-1',
          nome: 'Demo User',
          email: 'demo@example.com'
        },
        almoxarifado: {
          id: 'fallback-1',
          nome: 'Almoxarifado Central (Demo)',
          descricao: 'Almoxarifado principal'
        },
        total_itens: 3,
        valor_total: 125.50
      },
      {
        id: 'fallback-2',
        almoxarifado_id: 'fallback-2',
        responsavel_id: 'user-1',
        tipo_nota: 'TRANSFERENCIA',
        status: 'CONCLUIDA',
        numero_documento: 'TRANS-002-DEMO',
        data_documento: today,
        observacoes: 'Transferência de demonstração',
        created_at: new Date().toISOString(),
        almoxarifado_destino_id: 'fallback-1',
        responsavel: {
          id: 'user-1',
          nome: 'Demo User',
          email: 'demo@example.com'
        },
        almoxarifado: {
          id: 'fallback-2',
          nome: 'Almoxarifado Obra (Demo)',
          descricao: 'Almoxarifado da obra'
        },
        almoxarifado_destino: {
          id: 'fallback-1',
          nome: 'Almoxarifado Central (Demo)',
          descricao: 'Almoxarifado principal'
        },
        total_itens: 5,
        valor_total: 89.75
      }
    ];
  }
}

// ==================== EXPORT ====================

export const notasMovimentacaoAdapter = new NotasMovimentacaoAdapter();
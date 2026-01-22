/**
 * Ficha Query Adapter - Queries Básicas Refatorado
 * Responsabilidade: Buscar listas de fichas com filtros e paginação
 */

import { api } from "../../core/apiClient";
import { fichaTransformAdapter } from './adapters/fichaTransformAdapter';
import type { FichaQueryParams, PaginatedFichaResponse, FichaBasica } from './types';
import type { 
  EPIDisponivel, 
  Usuario, 
  EPIsDisponiveisResponse, 
  UsuariosResponse 
} from '$lib/types';

export class FichaQueryAdapter {
  /**
   * Busca detalhes completos de uma ficha EPI
   * 🔧 CORREÇÃO: Agrega dados de múltiplos endpoints pois /complete não retorna entregas/histórico
   */
  async getFichaComplete(fichaId: string): Promise<any> {
    try {
      console.log('🔍 Carregando ficha completa:', fichaId);
      
      // Fazer todas as consultas em paralelo para melhor performance
      const [fichaCompleteResponse, entregasResponse, historicoResponse] = await Promise.all([
        api.get(`/fichas-epi/${fichaId}/complete`) as Promise<any>,
        api.get(`/fichas-epi/${fichaId}/entregas`) as Promise<any>,
        api.get(`/fichas-epi/${fichaId}/historico`) as Promise<any>
      ]);

      console.log('✅ Dados básicos carregados');
      console.log('📦 Entregas encontradas:', entregasResponse?.data?.length || 0);
      console.log('📝 Eventos de histórico:', historicoResponse?.data?.historico?.length || 0);

      // Combinar os dados
      const combinedData = {
        ...fichaCompleteResponse,
        data: {
          ...fichaCompleteResponse.data,
          // ✅ CORREÇÃO: Adicionar entregas e histórico dos endpoints específicos
          entregas: entregasResponse?.data || [],
          historico: historicoResponse?.data?.historico || [],
          // Manter outros dados do endpoint /complete
          devolucoes: fichaCompleteResponse.data?.devolucoes || [],
          equipamentosEmPosse: fichaCompleteResponse.data?.equipamentosEmPosse || [],
          estatisticas: fichaCompleteResponse.data?.estatisticas || {}
        }
      };

      return fichaTransformAdapter.transformFichaComplete(combinedData);
    } catch (error: any) {
      console.error('❌ Erro ao buscar ficha completa:', error);
      throw error;
    }
  }

  /**
   * Busca lista de fichas com filtros e paginação
   */
  async getFichasList(params: FichaQueryParams = {}): Promise<PaginatedFichaResponse> {
    try {
      const queryParams = this.buildQueryParams(params);
      // 🔧 CORREÇÃO: Usar endpoint list-enhanced que existe na API v3.5
      const endpoint = `/fichas-epi/list-enhanced${queryParams}`;

      console.log('🔍 Chamando endpoint:', endpoint);
      const response = await api.get(endpoint) as any;
      return fichaTransformAdapter.transformFichasList(response);
    } catch (error: any) {
      console.error('Erro ao buscar lista de fichas:', error);
      
      // Retorna resposta vazia em caso de erro
      return {
        items: [],
        total: 0,
        page: params.page || 1,
        pageSize: params.limit || 10,
        totalPages: 0
      };
    }
  }

  /**
   * Busca fichas por termo de pesquisa
   */
  async searchFichas(searchTerm: string, limit = 20): Promise<FichaBasica[]> {
    try {
      if (!searchTerm?.trim()) {
        return [];
      }

      const response = await api.get(`/fichas-epi/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`) as any;
      return fichaTransformAdapter.transformSearchResults(response);
    } catch (error: any) {
      console.error('Erro ao buscar fichas:', error);
      return [];
    }
  }

  /**
   * Busca fichas de uma empresa específica
   */
  async getFichasByEmpresa(empresaId: string, params: Omit<FichaQueryParams, 'empresaId'> = {}): Promise<PaginatedFichaResponse> {
    return this.getFichasList({
      ...params,
      empresaId
    });
  }

  /**
   * Busca fichas por status
   */
  async getFichasByStatus(status: string, params: Omit<FichaQueryParams, 'status'> = {}): Promise<PaginatedFichaResponse> {
    return this.getFichasList({
      ...params,
      status
    });
  }

  /**
   * Busca fichas com devolução pendente
   */
  async getFichasComDevolucaoPendente(params: Omit<FichaQueryParams, 'devolucaoPendente'> = {}): Promise<PaginatedFichaResponse> {
    return this.getFichasList({
      ...params,
      devolucaoPendente: true
    });
  }

  /**
   * Constrói string de query parameters para a API
   */
  private buildQueryParams(params: FichaQueryParams): string {
    const searchParams = new URLSearchParams();

    // Parâmetros de busca
    if (params.search?.trim()) {
      searchParams.set('search', params.search.trim());
    }

    // Filtros
    if (params.empresaId) {
      searchParams.set('empresaId', params.empresaId);
    }
    
    if (params.empresa?.trim()) {
      searchParams.set('empresa', params.empresa.trim());
    }

    if (params.cargo?.trim()) {
      searchParams.set('cargo', params.cargo.trim());
    }

    if (params.status) {
      searchParams.set('status', params.status);
    }

    if (params.devolucaoPendente !== undefined) {
      searchParams.set('devolucaoPendente', params.devolucaoPendente.toString());
    }

    // Paginação
    if (params.page && params.page > 0) {
      searchParams.set('page', params.page.toString());
    }

    if (params.limit && params.limit > 0) {
      searchParams.set('limit', params.limit.toString());
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * MÉTODO TRANSITÓRIO: getFichasWithColaboradores 
   * Mantém compatibilidade com código legado
   */
  async getFichasWithColaboradores(params: any): Promise<any> {
    console.log('📋 FichaQueryAdapter: Método transitório - getFichasWithColaboradores');

    // Converter parâmetros do formato antigo para o novo
    const newParams: FichaQueryParams = {
      page: params.page,
      limit: params.limit,
      search: params.searchTerm,
      empresa: params.empresaFilter,
      cargo: params.cargoFilter,
      status: params.statusFilter,
      devolucaoPendente: params.devolucaoPendente,
    };

    try {
      const response = await this.getFichasList(newParams);

      // Converter resposta para formato antigo
      return {
        fichas: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
      };
    } catch (error: any) {
      console.error('❌ Erro no método transitório:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas gerais de fichas
   */
  async getEstatisticasGerais(): Promise<{
    total: number;
    ativas: number;
    inativas: number;
    pendenteDevolucao: number;
  }> {
    try {
      const response = await api.get('/fichas-epi/estatisticas') as any;
      
      if (!response.success || !response.data) {
        return { total: 0, ativas: 0, inativas: 0, pendenteDevolucao: 0 };
      }

      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, ativas: 0, inativas: 0, pendenteDevolucao: 0 };
    }
  }

  /**
   * Busca EPIs disponíveis para entrega
   */
  async getEPIsDisponiveis(): Promise<EPIDisponivel[]> {
    try {
      const response = await api.get('/estoque/itens?apenasDisponiveis=true&apenasComSaldo=true') as EPIsDisponiveisResponse as any;
      if (!response.success || !Array.isArray(response.data.items)) {
        return [];
      }
      // Mapear para o formato EPIDisponivel
      return response.data.items.map((item: { 
        id: string; 
        tipoEpi: { 
          id: string; 
          nomeEquipamento: string; 
          numeroCa: string; 
          categoriaEpi: string; 
        }; 
        quantidade: number; 
        status: string; 
        almoxarifadoId: string; 
      }) => ({
        id: item.id,
        nomeEquipamento: item.tipoEpi.nomeEquipamento,
        numeroCA: item.tipoEpi.numeroCa,
        categoria: item.tipoEpi.categoriaEpi,
        quantidadeDisponivel: item.quantidade,
        disponivel: item.status === 'DISPONIVEL' && item.quantidade > 0,
        registroCA: item.tipoEpi.numeroCa, // Assumindo que registroCA é o mesmo que numeroCa
        estoqueItemId: item.id,
        tipoEpiId: item.tipoEpi.id,
        posicaoEstoqueId: item.almoxarifadoId, // Assumindo que almoxarifadoId é o id da posição de estoque
      }));
    } catch (error: any) {
      console.error('Erro ao buscar EPIs disponíveis:', error);
      return [];
    }
  }

  /**
   * Busca ficha por ID
   */
  async getFichaById(fichaId: string): Promise<any> {
    try {
      const response = await api.get(`/fichas-epi/${fichaId}`) as any;
      if (!response.success) {
        return null;
      }
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar ficha por ID:', error);
      return null;
    }
  }

  /**
   * Busca usuários para seleção de responsável
   */
  async getUsuarios(): Promise<Usuario[]> {
    try {
      const response = await api.get('/usuarios') as any;
      console.log('🔍 Resposta da API /usuarios:', response);
      
      // A API retorna { items: [...], pagination: {...} }
      if (!response.items || !Array.isArray(response.items)) {
        console.log('❌ Response não tem items ou items não é array:', response);
        return [];
      }
      
      console.log('✅ Encontrado', response.items.length, 'usuários');
      
      return response.items.map((user: { 
        id: string; 
        nome: string; 
        email: string; 
        perfil?: string; 
        ativo?: boolean; 
        createdAt: string; 
        updatedAt?: string; 
      }) => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil || 'usuario', // Default se não tiver perfil
        ativo: user.ativo !== false, // Default true se não especificado
        createdAt: user.createdAt,
        updatedAt: user.updatedAt || user.createdAt
      }));
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuários:', error);
      return [];
    }
  }
}

export const fichaQueryAdapter = new FichaQueryAdapter();
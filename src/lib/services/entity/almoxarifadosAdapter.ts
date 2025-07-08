/**
 * Almoxarifados Adapter - Backend Integration
 * 
 * Adapter especializado para almoxarifados do sistema EPI
 * Conectado ao endpoint real do backend PostgreSQL
 */

import { api } from '../core/apiClient';
import type { PaginatedResponse } from '$lib/stores/paginatedStore';

// ==================== INTERFACES ====================

export interface Almoxarifado {
  id: string;
  nome: string;
  unidade_negocio_id: string;
  is_principal: boolean;
  created_at: string;
  unidade_negocio?: {
    id: string;
    nome: string;
    codigo: string;
  };
}

export interface AlmoxarifadoSelectOption {
  value: string;
  label: string;
  isPrincipal?: boolean;
  unidadeNegocio?: string;
}

// ==================== ADAPTER CLASS ====================

class AlmoxarifadosAdapter {
  private baseEndpoint = '/estoque/almoxarifados';

  /**
   * Lista todos os almoxarifados disponíveis
   * 
   * Como o endpoint direto de almoxarifados não existe, 
   * extraímos os dados dos itens de estoque
   */
  async listarAlmoxarifados(): Promise<Almoxarifado[]> {
    console.log('🏪 AlmoxarifadosAdapter: Listando almoxarifados via estoque');

    try {
      // Primeiro, tentar endpoint direto (se existir)
      try {
        const response = await api.get<{
          success: boolean;
          data: Almoxarifado[];
        }>(this.baseEndpoint, { 
          timeout: 15000,
          retries: 1 
        });

        let items: Almoxarifado[] = [];
        
        if (response.data) {
          items = Array.isArray(response.data) ? response.data : (response.data.items || []);
        } else if (Array.isArray(response)) {
          items = response;
        }

        console.log('✅ Almoxarifados listados via endpoint direto:', items.length);
        return items;
      } catch (directError) {
        console.log('⚠️ Endpoint direto não disponível, extraindo de estoque...');
        
        // Buscar almoxarifados através dos itens de estoque
        const estoqueResponse = await api.get<{
          success: boolean;
          data: {
            items: Array<{
              almoxarifadoId: string;
              almoxarifado: {
                id: string;
                nome: string;
                unidadeNegocioId: string;
                unidadeNegocio: {
                  id: string;
                  nome: string;
                  codigo: string;
                };
              };
            }>;
          };
        }>('/estoque/itens?limit=100');

        // Extrair almoxarifados únicos
        const almoxarifadosMap = new Map<string, Almoxarifado>();
        
        estoqueResponse.data.items.forEach(item => {
          const alm = item.almoxarifado;
          if (alm && !almoxarifadosMap.has(alm.id)) {
            almoxarifadosMap.set(alm.id, {
              id: alm.id,
              nome: alm.nome,
              unidade_negocio_id: alm.unidadeNegocioId,
              is_principal: alm.nome.toLowerCase().includes('central'), // Heurística
              created_at: new Date().toISOString(),
              unidade_negocio: {
                id: alm.unidadeNegocio.id,
                nome: alm.unidadeNegocio.nome,
                codigo: alm.unidadeNegocio.codigo
              }
            });
          }
        });

        const items = Array.from(almoxarifadosMap.values());
        console.log('✅ Almoxarifados extraídos do estoque:', items.length);
        return items;
      }
    } catch (error) {
      console.error('❌ Erro ao listar almoxarifados:', error);
      
      // Se for timeout, usar dados de fallback temporariamente
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        console.warn('⚠️ Backend indisponível, usando dados de fallback');
        return this.getFallbackAlmoxarifados();
      }
      
      throw new Error('Não foi possível carregar os almoxarifados');
    }
  }

  /**
   * Lista almoxarifados com paginação (se necessário)
   */
  async listarAlmoxarifadosPaginados(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Almoxarifado>> {
    console.log('🏪 AlmoxarifadosAdapter: Listando almoxarifados com paginação', params);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);

      const url = `${this.baseEndpoint}?${queryParams.toString()}`;
      
      const response = await api.get<{
        success: boolean;
        data: {
          items: Almoxarifado[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }>(url);

      console.log('✅ Almoxarifados paginados listados:', response.data.pagination);

      return {
        data: response.data.items,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages
      };
    } catch (error) {
      console.error('❌ Erro ao listar almoxarifados paginados:', error);
      throw new Error('Não foi possível carregar os almoxarifados');
    }
  }

  /**
   * Obtém um almoxarifado específico por ID
   */
  async obterAlmoxarifado(id: string): Promise<Almoxarifado> {
    console.log('🔍 AlmoxarifadosAdapter: Buscando almoxarifado', id);

    try {
      const response = await api.get<{
        success: boolean;
        data: Almoxarifado;
      }>(`${this.baseEndpoint}/${id}`);

      console.log('✅ Almoxarifado encontrado:', response.data.nome);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar almoxarifado:', error);
      throw new Error('Não foi possível encontrar o almoxarifado');
    }
  }

  /**
   * Converte almoxarifados em opções para componentes Select
   */
  async obterOpcoesSelect(): Promise<AlmoxarifadoSelectOption[]> {
    console.log('🔧 AlmoxarifadosAdapter: Carregando opções para select');

    try {
      const almoxarifados = await this.listarAlmoxarifados();
      
      const opcoes = almoxarifados.map(alm => ({
        value: alm.id,
        label: alm.nome,
        isPrincipal: alm.is_principal,
        unidadeNegocio: alm.unidade_negocio?.nome
      }));

      // Ordenar: principais primeiro, depois alfabético
      opcoes.sort((a, b) => {
        if (a.isPrincipal && !b.isPrincipal) return -1;
        if (!a.isPrincipal && b.isPrincipal) return 1;
        return a.label.localeCompare(b.label);
      });

      console.log('✅ Opções de select criadas:', opcoes.length);
      return opcoes;
    } catch (error) {
      console.error('❌ Erro ao criar opções de select:', error);
      
      // Retornar lista vazia em caso de erro para não quebrar a UI
      return [];
    }
  }

  /**
   * Cache para otimizar performance em chamadas frequentes
   */
  private selectOptionsCache: {
    data: AlmoxarifadoSelectOption[];
    timestamp: number;
  } | null = null;

  /**
   * Obtém opções para select com cache (TTL 5 minutos)
   */
  async obterOpcoesSelectComCache(): Promise<AlmoxarifadoSelectOption[]> {
    const TTL = 5 * 60 * 1000; // 5 minutos
    const now = Date.now();

    // Verificar cache
    if (this.selectOptionsCache && (now - this.selectOptionsCache.timestamp) < TTL) {
      console.log('💾 AlmoxarifadosAdapter: Usando cache para opções select');
      return this.selectOptionsCache.data;
    }

    // Cache expirado ou inexistente, buscar dados frescos
    const freshData = await this.obterOpcoesSelect();
    
    // Salvar no cache
    this.selectOptionsCache = {
      data: freshData,
      timestamp: now
    };

    return freshData;
  }

  /**
   * Limpa o cache (útil quando dados são modificados)
   */
  limparCache(): void {
    this.selectOptionsCache = null;
    console.log('🗑️ AlmoxarifadosAdapter: Cache limpo');
  }

  /**
   * Alias para compatibilidade com service index
   */
  clearCache(): void {
    this.limparCache();
  }

  /**
   * Valida se um almoxarifado existe
   */
  async validarExistencia(id: string): Promise<boolean> {
    try {
      await this.obterAlmoxarifado(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtém almoxarifados principais (is_principal = true)
   */
  async obterAlmoxarifadosPrincipais(): Promise<Almoxarifado[]> {
    console.log('🏆 AlmoxarifadosAdapter: Buscando almoxarifados principais');

    try {
      const todos = await this.listarAlmoxarifados();
      const principais = todos.filter(alm => alm.is_principal);
      
      console.log('✅ Almoxarifados principais encontrados:', principais.length);
      return principais;
    } catch (error) {
      console.error('❌ Erro ao buscar almoxarifados principais:', error);
      throw new Error('Não foi possível carregar os almoxarifados principais');
    }
  }

  /**
   * Dados de fallback quando backend está indisponível
   * Baseados na estrutura real do backend
   */
  private getFallbackAlmoxarifados(): Almoxarifado[] {
    return [
      {
        id: '567a1885-0763-4a13-b9f6-157daa39ddc3',
        nome: 'Almoxarifado Central SP',
        unidade_negocio_id: 'd42d0657-4671-4026-ae34-61b74806ad9d',
        is_principal: true,
        created_at: new Date().toISOString(),
        unidade_negocio: {
          id: 'd42d0657-4671-4026-ae34-61b74806ad9d',
          nome: 'Matriz São Paulo',
          codigo: 'SP001'
        }
      },
      {
        id: 'fallback-2',
        nome: 'Almoxarifado Obra (Demo)',
        unidade_negocio_id: 'unidade-2',
        is_principal: false,
        created_at: new Date().toISOString(),
        unidade_negocio: {
          id: 'unidade-2',
          nome: 'Obra A',
          codigo: 'OA01'
        }
      }
    ];
  }
}

// ==================== EXPORT ====================

export const almoxarifadosAdapter = new AlmoxarifadosAdapter();
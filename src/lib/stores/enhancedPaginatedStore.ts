/**
 * Enhanced Paginated Store - Solução Definitiva para Paginação e Filtros
 * 
 * Esta é uma versão avançada do paginatedStore que resolve problemas de:
 * - Performance com grandes volumes de dados
 * - Cache inteligente para opções de filtros
 * - Debounce automático para busca
 * - Endpoints otimizados para filtros
 * - Unificação entre catálogo e estoque
 */

import { writable, derived, type Readable } from 'svelte/store';
import { api, createUrlWithParams } from '$lib/services/core/apiClient';

// ==================== INTERFACES ====================

export interface EnhancedPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterMetadata {
  [key: string]: FilterOption[];
}

export interface FilterOptionsResponse {
  categorias: FilterOption[];
  status: FilterOption[];
  almoxarifados: FilterOption[];
}

export interface EnhancedStoreState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: Record<string, any>;
  search: string;
  filterMetadata: FilterMetadata;
  lastUpdate: number;
}

export interface StoreConfig {
  baseEndpoint: string;
  defaultPageSize: number;
  debounceDelay: number;
  cacheTimeout: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  filterEndpoints?: Record<string, string>; // Para endpoints específicos de filtros
  customFetch?: (params: any) => Promise<any>; // Função customizada de fetch
}

// ==================== CACHE UNIFICADO ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class UnifiedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 50; // Limitar tamanho para evitar vazamentos de memória

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Eviction policy simples - remove mais antigo se exceder limite
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

const globalCache = new UnifiedCache();

// ==================== ENHANCED PAGINATED STORE ====================

export function createEnhancedPaginatedStore<T>(config: StoreConfig) {
  const initialState: EnhancedStoreState<T> = {
    items: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: config.defaultPageSize,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    },
    filters: {},
    search: '',
    filterMetadata: {},
    lastUpdate: 0
  };

  const { subscribe, set, update } = writable(initialState);

  // Debounce para busca
  let searchTimeout: NodeJS.Timeout | null = null;
  let filterTimeout: NodeJS.Timeout | null = null;

  // Auto-refresh
  let refreshInterval: NodeJS.Timeout | null = null;

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Formata labels de categoria do backend (remove underscores, capitaliza)
   */
  function formatCategoryLabel(categoria: string): string {
    if (!categoria) return categoria;
    
    return categoria
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // ==================== MÉTODOS PRINCIPAIS ====================

  /**
   * Carrega dados com paginação e filtros
   */
  async function loadData(params: EnhancedPaginationParams = {}): Promise<void> {
    const currentState = getCurrentState();
    
    const finalParams = {
      page: params.page ?? currentState.pagination.page,
      limit: params.limit ?? currentState.pagination.limit,
      search: params.search ?? currentState.search,
      ...params.filters,
      ...currentState.filters,
      ...params
    };

    const cacheKey = `data-${config.baseEndpoint}-${JSON.stringify(finalParams)}`;
    const cached = globalCache.get<PaginatedResult<T>>(cacheKey);

    update(state => ({ ...state, loading: true, error: null }));

    try {
      let result: PaginatedResult<T>;

      if (cached) {
        console.log('💾 Cache hit para dados:', cacheKey);
        result = cached;
      } else {
        console.log('🌐 Carregando dados do backend:', finalParams);
        
        if (config.customFetch) {
          // Usar função customizada de fetch
          result = await config.customFetch(finalParams);
        } else {
          // Usar fetch padrão da API
          const url = createUrlWithParams(config.baseEndpoint, finalParams);
          const response = await api.get(url);
          
          result = {
            data: response.data.items || response.data,
            pagination: response.data.pagination || {
              page: finalParams.page || 1,
              limit: finalParams.limit || config.defaultPageSize,
              total: response.data.total || response.data.length || 0,
              totalPages: response.data.totalPages || Math.ceil((response.data.total || 0) / (finalParams.limit || config.defaultPageSize)),
              hasNextPage: response.data.hasNextPage || false,
              hasPreviousPage: response.data.hasPreviousPage || false
            }
          };
        }

        globalCache.set(cacheKey, result, config.cacheTimeout);
      }

      update(state => ({
        ...state,
        items: result.data,
        pagination: result.pagination,
        loading: false,
        lastUpdate: Date.now(),
        search: finalParams.search || '',
        filters: { ...state.filters, ...params.filters }
      }));

      console.log('✅ Dados carregados:', result.data.length, 'itens');

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }

  /**
   * Carrega opções de filtros de forma otimizada com fallback
   */
  async function loadFilterMetadata(): Promise<void> {
    if (!config.filterEndpoints) return;

    const cacheKey = `filters-${config.baseEndpoint}`;
    const cached = globalCache.get<FilterMetadata>(cacheKey);

    if (cached) {
      console.log('💾 Cache hit para filtros:', cacheKey);
      update(state => ({ ...state, filterMetadata: cached }));
      return;
    }

    try {
      console.log('🌐 Carregando opções de filtros...');
      const metadata: FilterMetadata = {};

      // Carregar opções de cada filtro configurado com fallback
      const promises = Object.entries(config.filterEndpoints).map(async ([filterKey, endpoint]) => {
        // Se endpoint é "extract-from-data", ir direto para fallback
        if (endpoint === 'extract-from-data') {
          console.log(`📊 Extraindo opções de ${filterKey} dos dados principais...`);
          
          if (filterKey === 'categorias') {
            metadata[filterKey] = await extractCategoriesFromData();
          } else {
            metadata[filterKey] = [];
          }
          return;
        }

        try {
          const response = await api.get(endpoint);
          
          // Formato esperado: { data: [{ value, label, count? }] }
          if (response.data && Array.isArray(response.data)) {
            metadata[filterKey] = response.data;
          } else {
            console.warn(`⚠️ Formato inesperado para filtro ${filterKey}:`, response);
            metadata[filterKey] = [];
          }
        } catch (error) {
          console.warn(`⚠️ Endpoint ${endpoint} não disponível, usando fallback para ${filterKey}`);
          
          // Fallback: extrair opções dos dados existentes
          if (filterKey === 'categorias') {
            metadata[filterKey] = await extractCategoriesFromData();
          } else {
            metadata[filterKey] = [];
          }
        }
      });

      await Promise.all(promises);

      globalCache.set(cacheKey, metadata, config.cacheTimeout * 2); // Cache de filtros dura mais
      
      update(state => ({ ...state, filterMetadata: metadata }));
      console.log('✅ Opções de filtros carregadas:', Object.keys(metadata));

    } catch (error) {
      console.error('❌ Erro ao carregar filtros:', error);
    }
  }

  /**
   * Fallback: extrai categorias dos dados existentes
   */
  async function extractCategoriesFromData(): Promise<FilterOption[]> {
    try {
      const response = await api.get(createUrlWithParams(config.baseEndpoint, { limit: 100 }));
      const items = response.data.items || response.data || [];
      
      console.log('📊 Extraindo categorias de', items.length, 'itens');
      
      const categoryCount = new Map<string, number>();
      items.forEach((item: any) => {
        if (item.categoria) {
          const current = categoryCount.get(item.categoria) || 0;
          categoryCount.set(item.categoria, current + 1);
        }
      });
      
      const categories = Array.from(categoryCount.entries()).map(([categoria, count]) => ({
        value: categoria,
        label: formatCategoryLabel(categoria),
        count
      }));
      
      console.log('✅ Categorias extraídas:', categories);
      return categories;
    } catch (error) {
      console.warn('⚠️ Não foi possível extrair categorias:', error);
      return [];
    }
  }


  /**
   * Aplica busca com debounce
   */
  function search(term: string): void {
    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
      loadData({ search: term, page: 1 });
    }, config.debounceDelay);
  }

  /**
   * Aplica filtros com debounce
   */
  function applyFilters(filters: Record<string, any>): void {
    if (filterTimeout) clearTimeout(filterTimeout);
    
    filterTimeout = setTimeout(() => {
      loadData({ filters, page: 1 });
    }, config.debounceDelay);
  }

  /**
   * Vai para página específica
   */
  function goToPage(page: number): void {
    loadData({ page });
  }

  /**
   * Limpa todos os filtros
   */
  function clearFilters(): void {
    update(state => ({ ...state, filters: {}, search: '' }));
    loadData({ filters: {}, search: '', page: 1 });
  }

  /**
   * Recarrega dados
   */
  function reload(): void {
    // Limpar cache relacionado
    const currentState = getCurrentState();
    const params = {
      page: currentState.pagination.page,
      search: currentState.search,
      ...currentState.filters
    };
    const cacheKey = `data-${config.baseEndpoint}-${JSON.stringify(params)}`;
    globalCache.delete(cacheKey);
    
    loadData();
  }

  /**
   * Obtém estado atual
   */
  function getCurrentState(): EnhancedStoreState<T> {
    let currentState: EnhancedStoreState<T>;
    subscribe(state => { currentState = state; })();
    return currentState!;
  }

  /**
   * Inicializa o store
   */
  async function initialize(): Promise<void> {
    console.log('🚀 Inicializando Enhanced Paginated Store:', config.baseEndpoint);
    
    // Carregar filtros e dados em paralelo
    await Promise.all([
      loadFilterMetadata(),
      loadData()
    ]);

    // Configurar auto-refresh se habilitado
    if (config.autoRefresh && config.refreshInterval) {
      if (refreshInterval) clearInterval(refreshInterval);
      refreshInterval = setInterval(reload, config.refreshInterval);
    }

    console.log('✅ Enhanced Paginated Store inicializado');
  }

  /**
   * Cleanup
   */
  function destroy(): void {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (filterTimeout) clearTimeout(filterTimeout);
    if (refreshInterval) clearInterval(refreshInterval);
  }

  // ==================== DERIVED STORES ====================

  const hasFilters = derived({ subscribe }, state => 
    Object.keys(state.filters).length > 0 || state.search.length > 0
  );

  const isEmpty = derived({ subscribe }, state => 
    state.items.length === 0 && !state.loading
  );

  const isFirstPage = derived({ subscribe }, state => 
    state.pagination.page === 1
  );

  const isLastPage = derived({ subscribe }, state => 
    state.pagination.page >= state.pagination.totalPages
  );

  // ==================== INTERFACE PÚBLICA ====================

  return {
    // Core store
    subscribe,
    
    // Actions
    initialize,
    loadData,
    search,
    applyFilters,
    goToPage,
    clearFilters,
    reload,
    destroy,
    
    // Derived stores
    hasFilters,
    isEmpty,
    isFirstPage,
    isLastPage,
    
    // Utilities
    getCurrentState,
    getCacheStats: () => globalCache.getStats()
  };
}
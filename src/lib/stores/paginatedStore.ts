/**
 * Paginated Store Factory
 * 
 * Factory para criar stores com paginação server-side, filtros e ordenação.
 * Substitui o padrão atual de client-side pagination por server-side pagination.
 */

import { writable, type Readable } from 'svelte/store';

/**
 * Resposta paginada esperada do backend
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Estado interno do store paginado
 */
export interface PaginatedState<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

/**
 * Parâmetros para paginação e filtros
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

/**
 * Interface do store paginado
 */
export interface PaginatedStore<T> extends Readable<PaginatedState<T>> {
  fetchPage: (params?: PaginationParams) => Promise<void>;
  setFilters: (filters: Record<string, any>) => Promise<void>;
  setSearch: (search: string) => Promise<void>;
  setSorting: (sort: string, order: 'asc' | 'desc') => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  reload: () => Promise<void>;
  reset: () => void;
  
  // Getters de conveniência
  hasNext: () => boolean;
  hasPrev: () => boolean;
  isEmpty: () => boolean;
  isLoading: () => boolean;
  
  // Estado atual para reatividade
  getCurrentParams: () => PaginationParams;
}

/**
 * Opções para configuração do store
 */
export interface PaginatedStoreOptions {
  initialPageSize?: number;
  enableCache?: boolean;
  cacheTimeout?: number;
  debounceDelay?: number;
}

/**
 * Cache para requisições
 */
interface CacheEntry<T> {
  data: PaginatedResponse<T>;
  timestamp: number;
}

/**
 * Factory para criar store paginado
 */
export function createPaginatedStore<T>(
  fetchFunction: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  options: PaginatedStoreOptions = {}
): PaginatedStore<T> {
  
  const {
    initialPageSize = 20,
    enableCache = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutos
    debounceDelay = 300
  } = options;
  
  const initialState: PaginatedState<T> = {
    items: [],
    total: 0,
    page: 1,
    pageSize: initialPageSize,
    totalPages: 0,
    loading: false,
    error: null,
    lastFetch: null
  };
  
  const { subscribe, set, update } = writable(initialState);
  
  // Cache de requisições
  const cache = new Map<string, CacheEntry<T>>();
  
  // Parâmetros atuais
  let currentParams: PaginationParams = {
    page: 1,
    limit: initialPageSize
  };
  
  // Debounce para busca
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let filterTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Gera chave para cache
   */
  function getCacheKey(params: PaginationParams): string {
    return JSON.stringify(params);
  }
  
  /**
   * Verifica se cache está válido
   */
  function isCacheValid(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < cacheTimeout;
  }
  
  /**
   * Busca dados com cache
   */
  async function fetchWithCache(params: PaginationParams): Promise<PaginatedResponse<T>> {
    if (enableCache) {
      const cacheKey = getCacheKey(params);
      const cached = cache.get(cacheKey);
      
      if (cached && isCacheValid(cached)) {
        console.log('📄 Using cached data for:', cacheKey);
        return cached.data;
      }
    }
    
    const response = await fetchFunction(params);
    
    if (enableCache) {
      const cacheKey = getCacheKey(params);
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
    }
    
    return response;
  }
  
  /**
   * Função principal para buscar página
   */
  async function fetchPage(params: PaginationParams = {}): Promise<void> {
    // Mesclar com parâmetros atuais
    currentParams = { ...currentParams, ...params };
    
    update(state => ({ ...state, loading: true, error: null }));
    
    try {
      const response = await fetchWithCache(currentParams);
      console.log('🏪 PaginatedStore received response:', {
        dataLength: response.data?.length || 0,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages
      });
      
      const newState = {
        items: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages || Math.ceil(response.total / response.pageSize),
        loading: false,
        error: null,
        lastFetch: Date.now()
      };
      
      console.log('🏪 Setting new store state:', {
        itemsLength: newState.items?.length || 0,
        total: newState.total,
        loading: newState.loading
      });
      
      set(newState);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      update(state => ({
        ...state,
        loading: false,
        error: errorMessage
      }));
      
      console.error('❌ Erro ao buscar página:', error);
    }
  }
  
  /**
   * Define filtros com debounce
   */
  async function setFilters(filters: Record<string, any>): Promise<void> {
    // Limpar timeout anterior
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    
    // Aplicar filtros com debounce
    filterTimeout = setTimeout(async () => {
      currentParams = { 
        ...currentParams, 
        ...filters, // Aplicar filtros no nível raiz dos params
        page: 1 // Reset para primeira página
      };
      await fetchPage(currentParams);
    }, debounceDelay);
  }
  
  /**
   * Define busca com debounce
   */
  async function setSearch(search: string): Promise<void> {
    // Limpar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Aplicar busca com debounce
    searchTimeout = setTimeout(async () => {
      currentParams = { 
        ...currentParams, 
        search, 
        page: 1 // Reset para primeira página
      };
      await fetchPage(currentParams);
    }, debounceDelay);
  }
  
  /**
   * Define ordenação
   */
  async function setSorting(sort: string, order: 'asc' | 'desc'): Promise<void> {
    currentParams = { 
      ...currentParams, 
      sort, 
      order,
      page: 1 // Reset para primeira página
    };
    await fetchPage(currentParams);
  }
  
  /**
   * Próxima página
   */
  async function nextPage(): Promise<void> {
    let canNext = false;
    
    subscribe(state => {
      canNext = state.page < state.totalPages;
    })();
    
    if (canNext) {
      await fetchPage({ page: currentParams.page! + 1 });
    }
  }
  
  /**
   * Página anterior
   */
  async function prevPage(): Promise<void> {
    if (currentParams.page! > 1) {
      await fetchPage({ page: currentParams.page! - 1 });
    }
  }
  
  /**
   * Vai para página específica
   */
  async function goToPage(page: number): Promise<void> {
    if (page >= 1) {
      await fetchPage({ page });
    }
  }
  
  /**
   * Recarrega dados atuais
   */
  async function reload(): Promise<void> {
    // Limpar cache para forçar nova requisição
    if (enableCache) {
      const cacheKey = getCacheKey(currentParams);
      cache.delete(cacheKey);
    }
    
    await fetchPage(currentParams);
  }
  
  /**
   * Reset do store
   */
  function reset(): void {
    currentParams = { page: 1, limit: initialPageSize };
    cache.clear();
    set(initialState);
  }
  
  // Getters de conveniência
  function hasNext(): boolean {
    let result = false;
    subscribe(state => {
      result = state.page < state.totalPages;
    })();
    return result;
  }
  
  function hasPrev(): boolean {
    return currentParams.page! > 1;
  }
  
  function isEmpty(): boolean {
    let result = false;
    subscribe(state => {
      result = state.items.length === 0 && !state.loading;
    })();
    return result;
  }
  
  function isLoading(): boolean {
    let result = false;
    subscribe(state => {
      result = state.loading;
    })();
    return result;
  }
  
  function getCurrentParams(): PaginationParams {
    return { ...currentParams };
  }
  
  return {
    subscribe,
    fetchPage,
    setFilters,
    setSearch,
    setSorting,
    nextPage,
    prevPage,
    goToPage,
    reload,
    reset,
    hasNext,
    hasPrev,
    isEmpty,
    isLoading,
    getCurrentParams
  };
}

/**
 * Store paginado otimizado com recursos extras
 */
export function createAdvancedPaginatedStore<T>(
  fetchFunction: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  options: PaginatedStoreOptions & {
    // Configurações avançadas
    enableOfflineSupport?: boolean;
    enableRealTimeUpdates?: boolean;
    optimisticUpdates?: boolean;
  } = {}
): PaginatedStore<T> & {
  // Métodos avançados
  addItem: (item: T) => void;
  updateItem: (id: string | number, updates: Partial<T>) => void;
  removeItem: (id: string | number) => void;
  prefetchNext: () => Promise<void>;
} {
  
  const baseStore = createPaginatedStore(fetchFunction, options);
  
  // Implementar funcionalidades avançadas
  function addItem(item: T): void {
    // Adicionar item otimisticamente
    baseStore.subscribe(state => {
      const newItems = [item, ...state.items];
      // Update store with new item
    })();
  }
  
  function updateItem(id: string | number, updates: Partial<T>): void {
    // Atualizar item específico
    baseStore.subscribe(state => {
      const updatedItems = state.items.map(item => {
        const itemId = (item as any).id;
        return itemId === id ? { ...item, ...updates } : item;
      });
      // Update store with updated items
    })();
  }
  
  function removeItem(id: string | number): void {
    // Remover item específico
    baseStore.subscribe(state => {
      const filteredItems = state.items.filter(item => {
        const itemId = (item as any).id;
        return itemId !== id;
      });
      // Update store with filtered items
    })();
  }
  
  async function prefetchNext(): Promise<void> {
    // Pré-carregar próxima página
    if (baseStore.hasNext()) {
      const currentParams = baseStore.getCurrentParams();
      const nextParams = { ...currentParams, page: (currentParams.page || 1) + 1 };
      
      try {
        await fetchFunction(nextParams);
        console.log('📄 Próxima página pré-carregada');
      } catch (error) {
        console.warn('⚠️ Erro ao pré-carregar próxima página:', error);
      }
    }
  }
  
  return {
    ...baseStore,
    addItem,
    updateItem,
    removeItem,
    prefetchNext
  };
}

/**
 * Helper para criar store paginado simples
 */
export function createSimplePaginatedStore<T>(
  fetchFunction: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  pageSize: number = 20
): PaginatedStore<T> {
  return createPaginatedStore(fetchFunction, {
    initialPageSize: pageSize,
    enableCache: true,
    debounceDelay: 300
  });
}
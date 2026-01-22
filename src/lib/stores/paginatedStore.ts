/**
 * Paginated Store Factory
 *
 * Factory para criar stores com paginação server-side, filtros e ordenação.
 * Substitui o padrão atual de client-side pagination por server-side pagination.
 */

import { writable, type Readable } from "svelte/store";
import type { PaginationState, FilterState } from "$lib/types";
import { isValidCPF, isValidCNPJ } from "$lib/utils/validation";
import { api } from "$lib/services/core/apiClient";

/**
 * Resposta padrão da API com sucesso
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Resposta de API com lista paginada
 */
export interface ApiListResponse<T = any> {
  success: boolean;
  data: {
    contratadas?: T[];
    colaboradores?: T[];
    total?: number;
  } | T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

/**
 * Resposta paginada esperada do backend
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  // Propriedades faltantes para compatibilidade
  items?: T[];
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
  order?: "asc" | "desc";
  filters?: Record<string, any>;
  search?: string;
  // Propriedades específicas para diferentes contextos
  ativo?: boolean | string;
  contratadaId?: string;
  // Propriedades faltantes identificadas nos erros TS
  empresa?: string;
  cargo?: string;
  status?: string;
  devolucaoPendente?: boolean;
  [key: string]: any; // Para permitir outros filtros específicos
}

// Alias para compatibilidade com types/index.ts
export type { UnifiedPaginatedResponse } from "../types/index";

/**
 * Interface do store paginado
 */
export interface PaginatedStore<T> extends Readable<PaginatedState<T>> {
  fetchPage: (params?: PaginationParams) => Promise<void>;
  setFilters: (filters: Record<string, any>) => Promise<void>;
  setSearch: (search: string) => Promise<void>;
  setSorting: (sort: string, order: "asc" | "desc") => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  reload: () => Promise<void>;
  reset: () => void;
  // Propriedade faltante identificada nos erros TS
  loadPage: (page: number) => Promise<void>;

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
  options: PaginatedStoreOptions = {},
): PaginatedStore<T> {
  const {
    initialPageSize = 20,
    enableCache = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutos
    debounceDelay = 300,
  } = options;

  const initialState: PaginatedState<T> = {
    items: [],
    total: 0,
    page: 1,
    pageSize: initialPageSize,
    totalPages: 0,
    loading: false,
    error: null,
    lastFetch: null,
  };

  const { subscribe, set, update } = writable(initialState);

  // Cache de requisições
  const cache = new Map<string, CacheEntry<T>>();

  // Parâmetros atuais
  let currentParams: PaginationParams = {
    page: 1,
    limit: initialPageSize,
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
  async function fetchWithCache(
    params: PaginationParams,
  ): Promise<PaginatedResponse<T>> {
    if (enableCache) {
      const cacheKey = getCacheKey(params);
      const cached = cache.get(cacheKey);

      if (cached && isCacheValid(cached)) {
        console.log("📄 Using cached data for:", cacheKey);
        return cached.data;
      }
    }

    const response = await fetchFunction(params);
    console.log("🔍 fetchWithCache received response:", response);
    console.log("🔍 fetchWithCache response.data:", response.data);
    console.log("🔍 fetchWithCache response.data isArray:", Array.isArray(response.data));

    if (enableCache) {
      const cacheKey = getCacheKey(params);
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });
    }

    return response;
  }

  /**
   * Função principal para buscar página
   */
  async function fetchPage(params: PaginationParams = {}): Promise<void> {
    // ✅ CORREÇÃO SSR: Só fazer requisições no browser
    if (typeof window === 'undefined') {
      console.log('⚠️ PaginatedStore: Ignorando fetchPage durante SSR');
      return;
    }

    // Mesclar com parâmetros atuais
    currentParams = { ...currentParams, ...params };

    update((state) => ({ ...state, loading: true, error: null }));

    try {
      const response = await fetchWithCache(currentParams);
      console.log("🏪 PaginatedStore received response:", {
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
      });
      console.log("🔍 PaginatedStore DEBUG response.data:", response.data);
      console.log("🔍 PaginatedStore DEBUG response.data isArray:", Array.isArray(response.data));
      console.log("🔍 PaginatedStore DEBUG response.data length:", response.data?.length);

      const newState = {
        items: response.data,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages:
          response.totalPages || Math.ceil(response.total / response.pageSize),
        loading: false,
        error: null,
        lastFetch: Date.now(),
      };

      console.log("🏪 Setting new store state:", {
        itemsLength: newState.items?.length || 0,
        total: newState.total,
        loading: newState.loading,
      });

      set(newState);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";

      update((state) => ({
        ...state,
        loading: false,
        error: errorMessage,
      }));

      console.error("❌ Erro ao buscar página:", error);
    }
  }

  /**
   * Define filtros com debounce
   */
  async function setFilters(filters: Record<string, any>): Promise<void> {
    // ✅ CORREÇÃO SSR: Só fazer requisições no browser
    if (typeof window === 'undefined') {
      return;
    }

    // Limpar timeout anterior
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }

    // Aplicar filtros com debounce
    filterTimeout = setTimeout(async () => {
      currentParams = {
        ...currentParams,
        ...filters, // Aplicar filtros no nível raiz dos params
        page: 1, // Reset para primeira página
      };
      await fetchPage(currentParams);
    }, debounceDelay);
  }

  /**
   * Define busca com debounce
   */
  async function setSearch(search: string): Promise<void> {
    // ✅ CORREÇÃO SSR: Só fazer requisições no browser
    if (typeof window === 'undefined') {
      return;
    }

    // Limpar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Aplicar busca com debounce
    searchTimeout = setTimeout(async () => {
      currentParams = {
        ...currentParams,
        search,
        page: 1, // Reset para primeira página
      };
      await fetchPage(currentParams);
    }, debounceDelay);
  }

  /**
   * Define ordenação
   */
  async function setSorting(
    sort: string,
    order: "asc" | "desc",
  ): Promise<void> {
    currentParams = {
      ...currentParams,
      sort,
      order,
      page: 1, // Reset para primeira página
    };
    await fetchPage(currentParams);
  }

  /**
   * Próxima página
   */
  async function nextPage(): Promise<void> {
    let canNext = false;

    subscribe((state) => {
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
    subscribe((state) => {
      result = state.page < state.totalPages;
    })();
    return result;
  }

  function hasPrev(): boolean {
    return currentParams.page! > 1;
  }

  function isEmpty(): boolean {
    let result = false;
    subscribe((state) => {
      result = state.items.length === 0 && !state.loading;
    })();
    return result;
  }

  function isLoading(): boolean {
    let result = false;
    subscribe((state) => {
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
    loadPage: (page: number) => fetchPage({ page }),
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
    getCurrentParams,
  };
}

/**
 * Interface para configuração avançada do store
 */
export interface AdvancedPaginatedStoreConfig {
  baseEndpoint?: string;
  defaultPageSize?: number;
  debounceDelay?: number;
  cacheTimeout?: number;
  autoRefresh?: boolean;
  filterEndpoints?: Record<string, string>;
  enableOfflineSupport?: boolean;
  enableRealTimeUpdates?: boolean;
  optimisticUpdates?: boolean;
}

/**
 * Store paginado otimizado com recursos extras
 */
export function createAdvancedPaginatedStore<T>(
  config: AdvancedPaginatedStoreConfig = {},
): PaginatedStore<T> & {
  // Propriedades de estado adicional
  data: T[];
  pagination: PaginationState;
  filters: FilterState;
  filterOptions: {
    contratadas: any[];
    [key: string]: any[];
  };

  // Métodos avançados
  addItem: (item: T) => void;
  updateItem: (id: string | number, updates: Partial<T>) => void;
  removeItem: (id: string | number) => void;
  prefetchNext: () => Promise<void>;
  loadData: () => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setFilter: (key: string, value: any) => Promise<void>;
  clearFilters: () => Promise<void>;
  refresh: () => Promise<void>;
  setPageSize: (size: number) => Promise<void>;

  // Métodos CRUD específicos
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<boolean>;
} {
  const {
    defaultPageSize = 10,
    debounceDelay = 300,
    cacheTimeout = 5 * 60 * 1000,
  } = config;

  // Função de fallback para contratadas
  function getFallbackContratadas(
    params: PaginationParams,
  ): PaginatedResponse<T> {
    const mockData = [
      {
        id: "1",
        nome: "Empresa ABC Ltda",
        cnpj: "12345678000190",
        cnpjFormatado: "12.345.678/0001-90",
        createdAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        nome: "TechSolutions Corp",
        cnpj: "98765432000198",
        cnpjFormatado: "98.765.432/0001-98",
        createdAt: "2024-01-20T14:30:00Z",
      },
    ];

    // Aplicar filtros
    let filteredData = [...mockData];
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredData = filteredData.filter(
        (item: any) =>
          item.nome?.toLowerCase().includes(searchTerm) ||
          item.cnpj?.includes(searchTerm),
      );
    }

    // Paginação
    const page = params.page || 1;
    const pageSize = params.limit || defaultPageSize;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData as T[],
      total: filteredData.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredData.length / pageSize),
    };
  }

  // Fetch function real ou mock baseada no endpoint
  async function fetchFunction(
    params: PaginationParams,
  ): Promise<PaginatedResponse<T>> {
    // Para contratadas, usar API real
    if (config.baseEndpoint === "/contratadas") {
      try {
        // Construir query string
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("nome", params.search);
        if (params.ativo !== undefined && params.ativo !== "") {
          queryParams.append("ativa", String(params.ativo));
        }

        const endpoint = `/contratadas?${queryParams.toString()}`;
        console.log("🌐 Fetching contratadas from:", `/api${endpoint}`);

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.get(endpoint) as ApiListResponse<T>;
        console.log("📦 Contratadas response:", result);
        console.log("📦 Data array:", result.data);
        console.log("📦 Data length:", Array.isArray(result.data) ? result.data.length : (result.data as any)?.contratadas?.length);

        if (!result.success) {
          throw new Error(result.message || "Erro na resposta da API");
        }

        // Backend retorna: { success: true, data: { contratadas: [...], total: 4 } }
        const contratadas = Array.isArray(result.data) ? result.data : (result.data as any).contratadas || [];
        const total = Array.isArray(result.data) ? result.data.length : (result.data as any).total || 0;

        // Adicionar campo 'ativo' padrão para contratadas que não têm
        const contratadasComStatus = contratadas.map((contratada: any) => ({
          ...contratada,
          ativo: contratada.ativo !== undefined ? contratada.ativo : true,
        }));

        return {
          data: contratadasComStatus as T[],
          total: total,
          page: params.page || 1,
          pageSize: params.limit || 10,
          totalPages: Math.ceil(total / (params.limit || 10)),
        };
      } catch (error: any) {
        console.error("❌ Erro ao buscar contratadas:", error);
        // Fallback para dados mock em caso de erro
        return getFallbackContratadas(params);
      }
    }

    // Para colaboradores, usar API real
    else if (config.baseEndpoint === "/colaboradores") {
      try {
        // Construir query string
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("nome", params.search);
        if (params.contratadaId)
          queryParams.append("contratadaId", params.contratadaId);
        if (params.ativo !== undefined && params.ativo !== "") {
          queryParams.append("ativo", String(params.ativo));
        }

        const endpoint = `/colaboradores?${queryParams.toString()}`;
        console.log("🌐 Fetching colaboradores from:", `/api${endpoint}`);

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.get(endpoint) as ApiListResponse<T>;
        console.log("📦 Colaboradores response:", result);

        if (!result.success) {
          throw new Error(result.message || "Erro na resposta da API");
        }

        // Backend pode retornar: { success: true, data: { colaboradores: [...], total: 10 } } ou { success: true, data: [...] }
        const colaboradores = Array.isArray(result.data) ? result.data : (result.data as any).colaboradores || [];
        const total = Array.isArray(result.data) ? result.data.length : (result.data as any).total || 0;

        // Adicionar campo 'ativo' padrão para colaboradores que não têm
        const colaboradoresComStatus = colaboradores.map(
          (colaborador: any) => ({
            ...colaborador,
            ativo: colaborador.ativo !== undefined ? colaborador.ativo : true,
          }),
        );

        return {
          data: colaboradoresComStatus as T[],
          total: total,
          page: params.page || 1,
          pageSize: params.limit || 10,
          totalPages: Math.ceil(total / (params.limit || 10)),
        };
      } catch (error: any) {
        console.error("❌ Erro ao buscar colaboradores:", error);

        // Fallback para dados mock em caso de erro
        await new Promise((resolve) => setTimeout(resolve, 300));

        const mockData = [
          {
            id: "1",
            nome: "João Silva Santos",
            cpf: "12345678901",
            email: "joao.silva@abc.com.br",
            cargo: "Operador de Máquinas",
            contratada: {
              id: "751c35a3-09dd-42bc-bc96-58ca036525fd",
              nome: "Beta Serviços e Construções S.A.",
            },
            contratadaId: "751c35a3-09dd-42bc-bc96-58ca036525fd",
            dataAdmissao: "2023-01-15",
            ativo: true,
            temFichaAtiva: true,
            createdAt: "2023-01-15T10:00:00Z",
          },
          {
            id: "2",
            nome: "Maria Santos Oliveira",
            cpf: "98765432109",
            email: "maria.santos@techsolutions.com",
            cargo: "Técnica de Segurança",
            contratada: {
              id: "70e382b6-7cdb-41f6-acc8-80dfc4110861",
              nome: "Claude Test Company LTDA",
            },
            contratadaId: "70e382b6-7cdb-41f6-acc8-80dfc4110861",
            dataAdmissao: "2023-03-10",
            ativo: true,
            temFichaAtiva: true,
            createdAt: "2023-03-10T10:00:00Z",
          },
          {
            id: "3",
            nome: "Carlos Pereira Lima",
            cpf: "11122233344",
            email: "carlos.pereira@gamma.com.br",
            cargo: "Engenheiro",
            contratada: {
              id: "fbbcd5fc-2bd8-4a38-a54b-46d90cb696b8",
              nome: "Gamma Engenharia e Consultoria",
            },
            contratadaId: "fbbcd5fc-2bd8-4a38-a54b-46d90cb696b8",
            dataAdmissao: "2023-05-20",
            ativo: true,
            temFichaAtiva: false,
            createdAt: "2023-05-20T10:00:00Z",
          },
        ];

        // Filtros para colaboradores
        let filteredData = [...mockData];

        if (params.search) {
          const searchTerm = params.search.toLowerCase();
          filteredData = filteredData.filter(
            (item: any) =>
              item.nome?.toLowerCase().includes(searchTerm) ||
              item.cpf?.includes(searchTerm) ||
              item.email?.toLowerCase().includes(searchTerm),
          );
        }

        if (params.contratadaId) {
          filteredData = filteredData.filter(
            (item: any) => item.contratadaId === params.contratadaId,
          );
        }

        // Paginação
        const page = params.page || 1;
        const pageSize = params.limit || defaultPageSize;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return {
          data: paginatedData as T[],
          total: filteredData.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredData.length / pageSize),
        };
      }
    }

    // Para outros endpoints, usar mock genérico
    else {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockData = [
        {
          id: "1",
          nome: "Item Mock 1",
          createdAt: "2023-01-15T10:00:00Z",
        },
        {
          id: "2",
          nome: "Item Mock 2",
          createdAt: "2023-03-10T10:00:00Z",
        },
      ];

      return {
        data: mockData as T[],
        total: mockData.length,
        page: params.page || 1,
        pageSize: params.limit || defaultPageSize,
        totalPages: Math.ceil(
          mockData.length / (params.limit || defaultPageSize),
        ),
      };
    }
  }

  const baseStore = createPaginatedStore(fetchFunction, {
    initialPageSize: defaultPageSize,
    enableCache: true,
    debounceDelay,
  });

  // Estado adicional
  let currentFilters: FilterState = {};

  // Implementar funcionalidades avançadas
  function addItem(item: T): void {
    console.log("➕ Adicionando item:", item);
    // TODO: Implementar adição otimística
  }

  function updateItem(id: string | number, updates: Partial<T>): void {
    console.log("✏️ Atualizando item:", id, updates);
    // TODO: Implementar atualização otimística
  }

  function removeItem(id: string | number): void {
    console.log("🗑️ Removendo item:", id);
    // TODO: Implementar remoção otimística
  }

  async function prefetchNext(): Promise<void> {
    if (baseStore.hasNext()) {
      console.log("📄 Pré-carregando próxima página...");
      await baseStore.nextPage();
    }
  }

  async function loadData(): Promise<void> {
    await baseStore.fetchPage();
  }

  async function setPage(page: number): Promise<void> {
    await baseStore.goToPage(page);
  }

  async function setFilter(key: string, value: any): Promise<void> {
    currentFilters[key] = value;
    await baseStore.setFilters(currentFilters);
  }

  async function clearFilters(): Promise<void> {
    currentFilters = {};
    await baseStore.setFilters({});
  }

  async function refresh(): Promise<void> {
    await baseStore.reload();
  }

  async function setPageSize(size: number): Promise<void> {
    await baseStore.fetchPage({ limit: size, page: 1 });
  }

  // Métodos CRUD específicos
  async function create(data: any): Promise<any> {
    if (config.baseEndpoint === "/contratadas") {
      try {
        console.log("🆕 Criando contratada:", data);

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.post('/contratadas', data) as ApiResponse<any>;
        console.log("✅ Contratada criada:", result);

        if (!result.success) {
          throw new Error(result.message || "Erro ao criar contratada");
        }

        // Refresh data after creation
        await refresh();

        return result.data;
      } catch (error: any) {
        console.error("❌ Erro ao criar contratada:", error);
        throw error;
      }
    } else if (config.baseEndpoint === "/colaboradores") {
      try {
        console.log("🆕 Criando colaborador:", data);

        // Validação local antes de enviar
        const colaboradorData = data as any;
        
        // Validar CPF se fornecido
        if (colaboradorData.cpf && !isValidCPF(colaboradorData.cpf)) {
          throw new Error("CPF inválido. Verifique o formato e os dígitos verificadores.");
        }

        // Validar se contratadaId está presente
        if (!colaboradorData.contratadaId) {
          throw new Error("Contratada é obrigatória. Selecione uma contratada válida.");
        }

        // Verificar se contratadaId é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(colaboradorData.contratadaId)) {
          throw new Error("ID da contratada inválido. Selecione uma contratada válida da lista.");
        }

        // Normalizar CPF (remover formatação)
        const payload = {
          ...colaboradorData,
          cpf: colaboradorData.cpf ? colaboradorData.cpf.replace(/\D/g, '') : undefined,
        };

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.post('/colaboradores', payload) as ApiResponse<any>;
        console.log("✅ Colaborador criado:", result);

        if (!result.success) {
          throw new Error(result.message || "Erro ao criar colaborador");
        }

        // Refresh data after creation
        await refresh();

        return result.data;
      } catch (error: any) {
        console.error("❌ Erro ao criar colaborador:", error);
        throw error;
      }
    } else {
      throw new Error("Método create não implementado para este endpoint");
    }
  }

  async function update(id: string, data: any): Promise<any> {
    if (config.baseEndpoint === "/contratadas") {
      try {
        console.log("✏️ Atualizando contratada:", id, data);

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.put(`/contratadas/${id}`, data) as ApiResponse<any>;
        console.log("✅ Contratada atualizada:", result);

        if (!result.success) {
          throw new Error(result.message || "Erro ao atualizar contratada");
        }

        // Refresh data after update
        await refresh();

        return result.data;
      } catch (error: any) {
        console.error("❌ Erro ao atualizar contratada:", error);
        throw error;
      }
    } else if (config.baseEndpoint === "/colaboradores") {
      try {
        console.log("✏️ Atualizando colaborador:", id, data);

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.put(`/colaboradores/${id}`, data) as ApiResponse<any>;
        console.log("✅ Colaborador atualizado:", result);

        if (!result.success) {
          throw new Error(result.message || "Erro ao atualizar colaborador");
        }

        // Refresh data after update
        await refresh();

        return result.data;
      } catch (error: any) {
        console.error("❌ Erro ao atualizar colaborador:", error);
        throw error;
      }
    } else {
      throw new Error("Método update não implementado para este endpoint");
    }
  }

  async function deleteItem(id: string): Promise<boolean> {
    if (config.baseEndpoint === "/contratadas") {
      try {
        console.log("🗑️ Excluindo contratada:", id);

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.delete(`/contratadas/${id}`) as ApiResponse<any>;
        console.log("✅ Contratada excluída:", result);

        if (!result.success) {
          throw new Error(result.message || "Erro ao excluir contratada");
        }

        // Refresh data after deletion
        await refresh();

        return true;
      } catch (error: any) {
        console.error("❌ Erro ao excluir contratada:", error);
        throw error;
      }
    } else if (config.baseEndpoint === "/colaboradores") {
      try {
        console.log("🗑️ Excluindo colaborador:", id);

        // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
        const result = await api.delete(`/colaboradores/${id}`) as ApiResponse<any>;
        console.log("✅ Colaborador excluído:", result);

        if (!result.success) {
          throw new Error(result.message || "Erro ao excluir colaborador");
        }

        // Refresh data after deletion
        await refresh();

        return true;
      } catch (error: any) {
        console.error("❌ Erro ao excluir colaborador:", error);
        throw error;
      }
    } else {
      throw new Error("Método delete não implementado para este endpoint");
    }
  }

  // Função para carregar contratadas reais do backend
  async function loadContratadas(): Promise<any[]> {
    try {
      console.log('🏢 Carregando contratadas do backend...');
      
      // Importar dinamicamente o contratadasAdapter
      const { contratadasAdapter } = await import('../services/entity/contratadasAdapter');
      
      const response = await contratadasAdapter.getContratadas({
        page: 1,
        limit: 100 // Carregar todas as contratadas para filtro
      });
      
      console.log('✅ Contratadas carregadas:', response.contratadas?.length || 0);
      return response.contratadas || [];
    } catch (error: any) {
      console.warn('⚠️ Erro ao carregar contratadas, usando fallback:', error);
      // Fallback para dados mockados em caso de erro
      return [
        {
          id: "751c35a3-09dd-42bc-bc96-58ca036525fd",
          nome: "Beta Serviços e Construções S.A.",
        },
        {
          id: "70e382b6-7cdb-41f6-acc8-80dfc4110861",
          nome: "Claude Test Company LTDA",
        },
        {
          id: "610921f5-2579-4f2a-9a9c-8544f95fdbad",
          nome: "Empresa Contratada Alpha LTDA",
        },
        {
          id: "fbbcd5fc-2bd8-4a38-a54b-46d90cb696b8",
          nome: "Gamma Engenharia e Consultoria",
        },
      ];
    }
  }

  // Inicializar filterOptions com dados reais
  let filterOptions = {
    contratadas: [] as any[],
  };

  // Carregar contratadas quando necessário
  if (config.filterEndpoints?.contratadas) {
    loadContratadas().then(contratadas => {
      filterOptions.contratadas = contratadas;
      // Forçar atualização do estado para componentes que dependem dos filterOptions
      derivedState = {
        ...derivedState,
        filterOptions: { ...filterOptions }
      };
      
      // Notificar mudança para subscribers
      console.log('🔄 FilterOptions atualizadas:', filterOptions);
    });
  }

  // Derivar estado compatível
  let derivedState = {
    data: [] as T[],
    pagination: {
      currentPage: 1,
      itemsPerPage: defaultPageSize,
      totalItems: 0,
      totalPages: 0,
    } as PaginationState,
    filters: currentFilters as FilterState,
    filterOptions: filterOptions,
  };

  // Manter estado sincronizado com baseStore
  baseStore.subscribe((state) => {
    derivedState = {
      data: state.items,
      pagination: {
        currentPage: state.page,
        itemsPerPage: state.pageSize,
        totalItems: state.total,
        totalPages: state.totalPages,
      },
      filters: currentFilters,
      filterOptions: filterOptions,
    };

    console.log("🔄 Store state updated:", {
      itemsLength: state.items?.length || 0,
      total: state.total,
      loading: state.loading,
      error: state.error,
    });
  });

  return {
    ...baseStore,
    get data() {
      return derivedState.data;
    },
    get pagination() {
      return derivedState.pagination;
    },
    get filters() {
      return derivedState.filters;
    },
    get filterOptions() {
      return derivedState.filterOptions;
    },
    addItem,
    updateItem,
    removeItem,
    prefetchNext,
    loadData,
    setPage,
    setFilter,
    clearFilters,
    refresh,
    setPageSize,
    create,
    update,
    delete: deleteItem,
  };
}

/**
 * Helper para criar store paginado simples
 */
export function createSimplePaginatedStore<T>(
  fetchFunction: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  pageSize: number = 20,
): PaginatedStore<T> {
  return createPaginatedStore(fetchFunction, {
    initialPageSize: pageSize,
    enableCache: true,
    debounceDelay: 300,
  });
}

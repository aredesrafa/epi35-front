/**
 * Tipos de Paginação Padronizados
 * 
 * Define uma única fonte da verdade para todos os tipos relacionados à paginação
 * Baseado no formato da API backend documentado
 */

// ==================== TIPOS CORE ====================

/**
 * Parâmetros de paginação para requisições
 * Alinhado com o backend API format
 */
export interface PaginationParams {
  page?: number;          // Número da página (começando em 1)
  limit?: number;         // Número de itens por página
  sort?: string;          // Campo para ordenação
  order?: 'asc' | 'desc'; // Direção da ordenação
}

/**
 * Metadados de paginação retornados pelo backend
 * Formato padrão da API conforme documentação
 */
export interface PaginationMeta {
  page: number;           // Página atual
  limit: number;          // Itens por página
  total: number;          // Total de itens
  totalPages: number;     // Total de páginas
  hasNext: boolean;       // Tem próxima página
  hasPrev: boolean;       // Tem página anterior
}

/**
 * Resposta paginada padrão do backend
 * Formato: { success: boolean, data: T[], pagination: PaginationMeta }
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

/**
 * Estado de paginação para stores frontend
 */
export interface PaginationState {
  currentPage: number;    // Página atual (1-indexed)
  totalPages: number;     // Total de páginas
  itemsPerPage: number;   // Itens por página
  totalItems: number;     // Total de itens
  hasNext: boolean;       // Tem próxima página
  hasPrev: boolean;       // Tem página anterior
}

// ==================== TIPOS PARA FILTROS ====================

/**
 * Filtros base que podem ser aplicados em consultas paginadas
 */
export interface BaseFilters {
  search?: string;        // Busca textual
  status?: string;        // Filtro por status
  dataInicio?: string;    // Data inicial (ISO string)
  dataFim?: string;       // Data final (ISO string)
}

/**
 * Parâmetros completos para consultas paginadas com filtros
 */
export interface PaginatedQueryParams extends PaginationParams {
  filters?: BaseFilters & Record<string, any>;
}

// ==================== UTILITÁRIOS ====================

/**
 * Converte PaginationMeta (backend) para PaginationState (frontend)
 */
function mapPaginationMetaToState(meta: PaginationMeta): PaginationState {
  return {
    currentPage: meta.page,
    totalPages: meta.totalPages,
    itemsPerPage: meta.limit,
    totalItems: meta.total,
    hasNext: meta.hasNext,
    hasPrev: meta.hasPrev,
  };
}

/**
 * Converte PaginationState (frontend) para PaginationParams (backend)
 */
function mapPaginationStateToParams(state: Partial<PaginationState>): PaginationParams {
  return {
    page: state.currentPage,
    limit: state.itemsPerPage,
  };
}

/**
 * Cria estado de paginação inicial
 */
function createInitialPaginationState(itemsPerPage: number = 10): PaginationState {
  return {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  };
}

/**
 * Valida parâmetros de paginação
 */
function validatePaginationParams(params: PaginationParams): PaginationParams {
  return {
    page: Math.max(1, params.page || 1),
    limit: Math.min(100, Math.max(1, params.limit || 10)),
    sort: params.sort,
    order: params.order === 'desc' ? 'desc' : 'asc',
  };
}

/**
 * Cria URL query string a partir de parâmetros de paginação
 */
function createPaginationQuery(params: PaginatedQueryParams): URLSearchParams {
  const query = new URLSearchParams();
  
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.sort) query.set('sort', params.sort);
  if (params.order) query.set('order', params.order);
  
  // Adicionar filtros
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.set(key, value.toString());
      }
    });
  }
  
  return query;
}

// ==================== TIPOS LEGADOS PARA MIGRAÇÃO ====================

/**
 * @deprecated Use PaginationParams instead
 */
export interface LegacyPaginationParams {
  page?: number;
  pageSize?: number;
  currentPage?: number;
  itemsPerPage?: number;
}

/**
 * @deprecated Use PaginatedResponse instead  
 */
export interface LegacyPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Converte tipos legados para novos tipos padronizados
 */
function migrateLegacyPagination(legacy: LegacyPaginationParams): PaginationParams {
  return {
    page: legacy.page || legacy.currentPage,
    limit: legacy.pageSize || legacy.itemsPerPage,
  };
}

// ==================== CONSTANTES ====================

const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_ORDER: 'asc' as const,
} as const;

// ==================== EXPORT CONSOLIDADO ====================

export type {
  // Tipos principais
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  PaginationState,
  
  // Tipos para filtros
  BaseFilters,
  PaginatedQueryParams,
  
  // Tipos legados (deprecated)
  LegacyPaginationParams,
  LegacyPaginatedResponse,
};

export {
  // Utilitários
  mapPaginationMetaToState,
  mapPaginationStateToParams,
  createInitialPaginationState,
  validatePaginationParams,
  createPaginationQuery,
  migrateLegacyPagination,
  
  // Constantes
  PAGINATION_DEFAULTS,
};
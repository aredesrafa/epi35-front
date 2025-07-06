/**
 * API Client Tipado - Integração com Backend EPI v3.5.4
 * 
 * Cliente HTTP tipado que substitui todos os mocks legacy.
 * Usa tipos gerados automaticamente do OpenAPI do backend.
 * 
 * Features:
 * - Type safety completa
 * - Error handling padronizado
 * - Retry automático
 * - Base URL configurável
 * - Headers de autenticação
 */

import type { paths } from './types';

// ==================== CONFIGURAÇÃO ====================

// Base URL do backend (configurável via env)
const BASE_URL = 'https://epi-backend-s14g.onrender.com';

// Configurações de retry
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMs: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};

// ==================== TIPOS AUXILIARES ====================

// Extrair tipos de resposta de sucesso
type ApiResponse<T extends keyof paths, M extends keyof paths[T]> = 
  paths[T][M] extends { responses: { 200: { content: { 'application/json': infer R } } } }
    ? R
    : never;

// Extrair tipos de parâmetros de query
type QueryParams<T extends keyof paths, M extends keyof paths[T]> = 
  paths[T][M] extends { parameters: { query?: infer Q } }
    ? Q
    : never;

// Extrair tipos de request body
type RequestBody<T extends keyof paths, M extends keyof paths[T]> = 
  paths[T][M] extends { requestBody: { content: { 'application/json': infer B } } }
    ? B
    : never;

// Tipo para parâmetros de paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}

// Tipo para resposta paginada
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items?: T[];
    contratadas?: T[]; // Para endpoint de contratadas
    fichas?: T[]; // Para endpoint de fichas
    notas?: T[]; // Para endpoint de notas
    [key: string]: any;
  };
  meta?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== CLASSES DE ERRO ====================

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(`Network Error: ${message}`);
    this.name = 'NetworkError';
  }
}

// ==================== UTILITÁRIOS ====================

/**
 * Sleep utilitário para retry
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Constrói URL com query parameters
 */
function buildUrlWithParams(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Headers padrão para requisições
 */
function getDefaultHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // TODO: Adicionar token de autenticação quando necessário
    // 'Authorization': `Bearer ${getAuthToken()}`
  };
}

// ==================== CLIENTE HTTP BASE ====================

/**
 * Fetch com retry automático e error handling
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getDefaultHeaders(),
        ...options.headers
      }
    });

    // Se resposta foi bem-sucedida, retorna
    if (response.ok) {
      return response;
    }

    // Se erro não é retryable, lança erro imediatamente
    if (!RETRY_CONFIG.retryableStatusCodes.includes(response.status)) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Se ainda pode retry, tenta novamente
    if (retryCount < RETRY_CONFIG.maxRetries) {
      await sleep(RETRY_CONFIG.backoffMs * Math.pow(2, retryCount));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    // Esgotou tentativas
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, errorData);

  } catch (error) {
    // Network errors ou outros erros não-HTTP
    if (error instanceof ApiError) {
      throw error;
    }

    // Retry para network errors
    if (retryCount < RETRY_CONFIG.maxRetries) {
      await sleep(RETRY_CONFIG.backoffMs * Math.pow(2, retryCount));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    throw new NetworkError(error instanceof Error ? error.message : 'Unknown network error');
  }
}

/**
 * Wrapper para GET requests
 */
async function apiGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = buildUrlWithParams(endpoint, params);
  const response = await fetchWithRetry(url, { method: 'GET' });
  return response.json();
}

/**
 * Wrapper para POST requests
 */
async function apiPost<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
  const url = buildUrlWithParams(endpoint, params);
  const response = await fetchWithRetry(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json();
}

/**
 * Wrapper para PUT requests
 */
async function apiPut<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<T> {
  const url = buildUrlWithParams(endpoint, params);
  const response = await fetchWithRetry(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json();
}

/**
 * Wrapper para DELETE requests
 */
async function apiDelete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = buildUrlWithParams(endpoint, params);
  const response = await fetchWithRetry(url, { method: 'DELETE' });
  return response.json();
}

// ==================== API ENDPOINTS TIPADOS ====================

// -------------------- HEALTH CHECK --------------------
export async function checkHealth(): Promise<ApiResponse<'/health', 'get'>> {
  return apiGet('/health');
}

// -------------------- CONFIGURAÇÕES --------------------
export async function getConfiguration(): Promise<any> {
  // ⚠️ BACKEND NÃO POSSUI ENDPOINT DE CONFIGURAÇÃO
  // Configurações são hardcoded conforme documentação v3.5.4
  // Ver backend-modeuleEPI-documentation.md linhas 107-109
  return Promise.resolve({
    success: true,
    data: {
      // Configurações padrão conforme backend documentation
      PERMITIR_ESTOQUE_NEGATIVO: false,
      PERMITIR_AJUSTES_FORCADOS: false,
      ESTOQUE_MINIMO_EQUIPAMENTO: 10,
      
      // Feature flags do frontend
      useV2Routes: false,
      enableAdvancedReports: true,
      
      // Configurações adicionais
      enableRealTimeUpdates: true,
      cacheTimeoutMs: 300000, // 5 minutos
      pageSizeDefault: 20
    }
  });
}

// -------------------- CONTRATADAS --------------------
export async function getContratadas(params?: {
  cnpj?: string;
  nome?: string;
}): Promise<ApiResponse<'/api/contratadas', 'get'>> {
  return apiGet('/api/contratadas', params);
}

export async function createContratada(data: RequestBody<'/api/contratadas', 'post'>): Promise<ApiResponse<'/api/contratadas', 'post'>> {
  return apiPost('/api/contratadas', data);
}

export async function getContratada(id: string): Promise<ApiResponse<'/api/contratadas/{id}', 'get'>> {
  return apiGet(`/api/contratadas/${id}`);
}

export async function updateContratada(id: string, data: RequestBody<'/api/contratadas/{id}', 'put'>): Promise<ApiResponse<'/api/contratadas/{id}', 'put'>> {
  return apiPut(`/api/contratadas/${id}`, data);
}

export async function deleteContratada(id: string): Promise<ApiResponse<'/api/contratadas/{id}', 'delete'>> {
  return apiDelete(`/api/contratadas/${id}`);
}

export async function searchContratadas(nome: string): Promise<ApiResponse<'/api/contratadas/buscar', 'get'>> {
  return apiGet('/api/contratadas/buscar', { nome });
}

export async function getContratadaStats(): Promise<ApiResponse<'/api/contratadas/estatisticas', 'get'>> {
  return apiGet('/api/contratadas/estatisticas');
}

// -------------------- FICHAS EPI --------------------
export async function getFichasEPI(params?: {
  page?: number;
  limit?: number;
  colaboradorId?: string;
  tipoEpiId?: string;
  almoxarifadoId?: string;
  status?: string;
  colaboradorNome?: string;
  tipoEpiNome?: string;
  ativo?: boolean;
  devolucaoPendente?: boolean;
}): Promise<PaginatedResponse<any>> {
  return apiGet('/api/fichas-epi', params);
}

export async function createFichaEPI(data: RequestBody<'/api/fichas-epi', 'post'>): Promise<ApiResponse<'/api/fichas-epi', 'post'>> {
  return apiPost('/api/fichas-epi', data);
}

export async function getFichaEPI(id: string): Promise<ApiResponse<'/api/fichas-epi/{id}', 'get'>> {
  return apiGet(`/api/fichas-epi/${id}`);
}

export async function createEntrega(fichaId: string, data: RequestBody<'/api/fichas-epi/{id}/entregas', 'post'>): Promise<ApiResponse<'/api/fichas-epi/{id}/entregas', 'post'>> {
  return apiPost(`/api/fichas-epi/${fichaId}/entregas`, data);
}

export async function getEntregasFicha(fichaId: string): Promise<ApiResponse<'/api/fichas-epi/{id}/entregas', 'get'>> {
  return apiGet(`/api/fichas-epi/${fichaId}/entregas`);
}

export async function processarDevolucao(entregaId: string, data: RequestBody<'/api/fichas-epi/entregas/{entregaId}/devolucao', 'post'>): Promise<ApiResponse<'/api/fichas-epi/entregas/{entregaId}/devolucao', 'post'>> {
  return apiPost(`/api/fichas-epi/entregas/${entregaId}/devolucao`, data);
}

// -------------------- ESTOQUE --------------------
export async function getPosicaoEstoque(params?: {
  apenasAbaixoMinimo?: boolean;
  apenasComSaldo?: boolean;
  unidadeNegocioId?: string;
  tipoEpiId?: string;
  almoxarifadoId?: string;
}): Promise<ApiResponse<'/api/estoque/posicao', 'get'>> {
  return apiGet('/api/estoque/posicao', params);
}

export async function getKardexEstoque(almoxarifadoId: string, tipoEpiId: string, params?: {
  dataInicio?: string;
  dataFim?: string;
}): Promise<ApiResponse<'/api/estoque/kardex/{almoxarifadoId}/{tipoEpiId}', 'get'>> {
  return apiGet(`/api/estoque/kardex/${almoxarifadoId}/${tipoEpiId}`, params);
}

export async function getResumoEstoque(params?: {
  almoxarifadoId?: string;
  unidadeNegocioId?: string;
}): Promise<ApiResponse<'/api/estoque/resumo', 'get'>> {
  return apiGet('/api/estoque/resumo', params);
}

export async function getAlertasEstoque(params?: {
  almoxarifadoId?: string;
  unidadeNegocioId?: string;
  severidade?: string;
}): Promise<ApiResponse<'/api/estoque/alertas', 'get'>> {
  return apiGet('/api/estoque/alertas', params);
}

export async function realizarAjusteDirecto(data: RequestBody<'/api/estoque/ajuste-direto', 'post'>): Promise<ApiResponse<'/api/estoque/ajuste-direto', 'post'>> {
  return apiPost('/api/estoque/ajuste-direto', data);
}

// -------------------- NOTAS DE MOVIMENTAÇÃO --------------------
export async function getNotasMovimentacao(params?: {
  page?: number;
  limit?: number;
  numero?: string;
  tipo?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}): Promise<PaginatedResponse<any>> {
  return apiGet('/api/notas-movimentacao', params);
}

export async function createNotaMovimentacao(data: RequestBody<'/api/notas-movimentacao', 'post'>): Promise<ApiResponse<'/api/notas-movimentacao', 'post'>> {
  return apiPost('/api/notas-movimentacao', data);
}

export async function getNotaMovimentacao(id: string): Promise<ApiResponse<'/api/notas-movimentacao/{id}', 'get'>> {
  return apiGet(`/api/notas-movimentacao/${id}`);
}

export async function updateNotaMovimentacao(id: string, data: RequestBody<'/api/notas-movimentacao/{id}', 'put'>): Promise<ApiResponse<'/api/notas-movimentacao/{id}', 'put'>> {
  return apiPut(`/api/notas-movimentacao/${id}`, data);
}

export async function deleteNotaMovimentacao(id: string): Promise<ApiResponse<'/api/notas-movimentacao/{id}', 'delete'>> {
  return apiDelete(`/api/notas-movimentacao/${id}`);
}

export async function concluirNota(id: string): Promise<any> {
  return apiPost(`/api/notas-movimentacao/${id}/concluir`);
}

export async function cancelarNota(id: string): Promise<any> {
  return apiPost(`/api/notas-movimentacao/${id}/cancelar`);
}

// ==================== EXPORT CONSOLIDADO ====================

/**
 * Cliente API principal - Export default para facilitar importação
 */
export const apiClient = {
  // Health
  checkHealth,
  
  // Configuration
  getConfiguration,
  
  // Contratadas
  getContratadas,
  createContratada,
  getContratada,
  updateContratada,
  deleteContratada,
  searchContratadas,
  getContratadaStats,
  
  // Fichas EPI
  getFichasEPI,
  createFichaEPI,
  getFichaEPI,
  createEntrega,
  getEntregasFicha,
  processarDevolucao,
  
  // Estoque
  getPosicaoEstoque,
  getKardexEstoque,
  getResumoEstoque,
  getAlertasEstoque,
  realizarAjusteDirecto,
  
  // Notas de Movimentação
  getNotasMovimentacao,
  createNotaMovimentacao,
  getNotaMovimentacao,
  updateNotaMovimentacao,
  deleteNotaMovimentacao,
  concluirNota,
  cancelarNota
};

export default apiClient;

// ==================== TIPOS PARA STORES ====================

// Tipos para facilitar uso nos stores
export type ContratadaData = ApiResponse<'/api/contratadas', 'get'>;
export type FichaEPIData = PaginatedResponse<any>;
export type EstoqueData = ApiResponse<'/api/estoque/posicao', 'get'>;
export type NotaMovimentacaoData = PaginatedResponse<any>;
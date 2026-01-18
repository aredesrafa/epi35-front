/**
 * Cliente HTTP Central
 *
 * Cliente HTTP centralizado com tratamento de erros, timeout, retry e preparação
 * para autenticação futura. Oferece uma interface consistente para todas as
 * chamadas de API do frontend.
 */

import { browser } from "$app/environment";

// Configurações da API - Detectar ambiente corretamente
export const API_BASE_URL = (() => {
  if (typeof window === "undefined") {
    // SSR - usar URL direta sempre
    return "https://epi-backend.onrender.com/api";
  }
  
  const isLocal = window.location.hostname === "localhost" || 
                  window.location.hostname === "127.0.0.1";
  const isGitHubPages = window.location.hostname.includes("github.io");
  
  // TEMPORÁRIO: Usar URL direta sempre até resolver problema do proxy
  // if (isLocal && window.location.port !== "") {
  //   // Desenvolvimento local com porta específica - usar proxy
  //   return "/api";
  // } else {
  //   // Produção, GitHub Pages ou qualquer outro ambiente - URL direta
  //   return "https://epi-backend.onrender.com/api";
  // }
  
  // URL direta sempre (contornando proxy problemático)
  return "https://epi-backend.onrender.com/api";
})();

// Interfaces para request unificado
export interface RequestConfig {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Classe de erro customizada para APIs
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
    public endpoint?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Verifica se é um erro de autenticação
   */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Verifica se é um erro de rede
   */
  get isNetworkError(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  /**
   * Verifica se é um erro do cliente (4xx)
   */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/**
 * Opções para requisições da API
 */
export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Configurações padrão para requisições
 */
const DEFAULT_OPTIONS: ApiRequestOptions = {
  timeout: 30000, // 30 segundos (cold start do backend pode demorar)
  retries: 3,
  retryDelay: 2000, // 2 segundos
};

/**
 * Cliente HTTP principal
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const {
    skipAuth = false,
    timeout,
    retries,
    retryDelay,
    ...fetchOptions
  } = config;

  // Headers padrão com configuração CORS otimizada
  const headers = new Headers(fetchOptions.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  
  // Headers específicos para GitHub Pages
  if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
    headers.set("Origin", window.location.origin);
  }

  // Headers de autenticação serão implementados por outra equipe
  // TODO: Implementar quando a equipe de auth disponibilizar o sistema
  if (!skipAuth) {
    // Placeholder para headers de autenticação
    // const token = getAuthToken();
    // if (token) {
    //   headers.set('Authorization', `Bearer ${token}`);
    // }
  }

  // Função para fazer a requisição com retry
  async function makeRequest(attempt: number = 1): Promise<T> {
    // Durante SSR, retornar dados vazios ou erro para evitar CORS
    if (!browser) {
      throw new ApiError(
        "API calls are only available in browser",
        0,
        null,
        endpoint,
      );
    }

    // Garantir URL absoluta sempre - SvelteKit requer URLs absolutas no SSR
    let url: string;
    if (endpoint.startsWith("http")) {
      url = endpoint;
    } else {
      // Garantir que sempre temos uma URL absoluta
      const cleanEndpoint = endpoint.startsWith("/")
        ? endpoint
        : "/" + endpoint;
      url = `${API_BASE_URL}${cleanEndpoint}`;
    }

    // Em GitHub Pages, fazer preflight check para métodos não-simples
    const isGitHubPages = typeof window !== "undefined" && window.location.hostname.includes("github.io");
    const needsPreflight = ["POST", "PUT", "PATCH", "DELETE"].includes(fetchOptions.method?.toUpperCase() || "GET");
    
    if (isGitHubPages && needsPreflight) {
      console.log(`🚀 GitHub Pages detectado - fazendo preflight para ${fetchOptions.method}`);
      try {
        // Fazer OPTIONS request primeiro
        await fetch(url, {
          method: "OPTIONS",
          mode: "cors",
          credentials: "omit",
          headers: {
            "Access-Control-Request-Method": fetchOptions.method?.toUpperCase() || "POST",
            "Access-Control-Request-Headers": "content-type,accept",
          },
        });
      } catch (preflightError) {
        console.warn("⚠️ Preflight falhou, tentando requisição direta:", preflightError);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {

      console.log(`🌐 Fazendo requisição para: ${url}`);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
        mode: "cors", // Forçar modo CORS
        credentials: "omit", // Não enviar cookies para evitar problemas CORS
      });

      clearTimeout(timeoutId);

      // Tratamento de erros HTTP
      if (!response.ok) {
        let errorData: any = {};
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch {
            // Se não conseguir fazer parse do JSON, usar resposta vazia
          }
        }

        // Tratamento específico para erro 405 em GitHub Pages (geralmente CORS)
        if (response.status === 405 && isGitHubPages) {
          const message = "Erro de CORS no GitHub Pages. Verifique se o backend está configurado corretamente.";
          console.error("❌ Erro 405 detectado no GitHub Pages - provável problema de CORS:", {
            url,
            method: fetchOptions.method,
            status: response.status,
            statusText: response.statusText
          });
          throw new ApiError(message, response.status, errorData, endpoint);
        }

        const message =
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`;

        throw new ApiError(message, response.status, errorData, endpoint);
      }

      // Verificar se há conteúdo para retornar
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0" || response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return (await response.json()) as T;
      }

      // Se não for JSON, retornar como texto
      return (await response.text()) as unknown as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Tratar timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408, null, endpoint);
      }

      // Tratar erros de rede
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError("Network error", 0, null, endpoint);
      }

      // Se já é ApiError, repassar
      if (error instanceof ApiError) {
        // Implementar retry para erros de rede ou 5xx
        if (
          (error.isNetworkError || error.status >= 500) &&
          attempt < (retries || 0)
        ) {
          console.warn(
            `Tentativa ${attempt} falhou, tentando novamente em ${retryDelay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return makeRequest(attempt + 1);
        }
        throw error;
      }

      // Erro genérico
      throw new ApiError(
        error instanceof Error ? error.message : "Unknown error",
        0,
        null,
        endpoint,
      );
    }
  }

  return makeRequest();
}

/**
 * Interface da API com métodos HTTP
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, options?: ApiRequestOptions): Promise<T> =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  /**
   * POST request
   */
  post: <T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions,
  ): Promise<T> =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PUT request
   */
  put: <T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions,
  ): Promise<T> =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * PATCH request
   */
  patch: <T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions,
  ): Promise<T> =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, options?: ApiRequestOptions): Promise<T> =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),

  /**
   * Método unificado de request
   */
  async request<T>(config: RequestConfig): Promise<T> {
    const {
      endpoint,
      method = "GET",
      data,
      params,
      headers = {},
      timeout = 10000,
    } = config;

    const url = createUrlWithParams(endpoint, params || {});
    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    const options: ApiRequestOptions = {
      method,
      headers: requestHeaders,
      timeout,
    };

    if (data && ["POST", "PUT", "PATCH"].includes(method)) {
      options.body = JSON.stringify(data);
    }

    return apiClient<T>(url, options);
  },
};

/**
 * Helper para criar URLs com query parameters
 */
export function createUrlWithParams(
  baseUrl: string,
  params: Record<string, any>,
): string {
  // Se baseUrl não tem protocolo, é um path relativo
  const urlString = baseUrl.startsWith("/") ? baseUrl : "/" + baseUrl;

  const url = new URL(urlString, "http://dummy.com");

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        // Preservar booleans como string "true"/"false" para compatibilidade com APIs
        url.searchParams.set(key, typeof value === 'boolean' ? value.toString() : String(value));
      }
    }
  });

  // Retornar apenas path + search (será combinado com API_BASE_URL no apiClient)
  return url.pathname + url.search;
}

/**
 * Interceptor para logging de requisições (apenas em desenvolvimento)
 */
if (browser && !import.meta.env.PROD) {
  const originalFetch = fetch;
  window.fetch = async (input, init) => {
    const start = performance.now();

    try {
      const response = await originalFetch(input, init);
      const duration = performance.now() - start;

      console.log(
        `🌐 ${init?.method || "GET"} ${input} - ${response.status} (${duration.toFixed(2)}ms)`,
      );

      return response;
    } catch (error: any) {
      const duration = performance.now() - start;
      console.error(
        `❌ ${init?.method || "GET"} ${input} - ERROR (${duration.toFixed(2)}ms)`,
        error,
      );
      throw error;
    }
  };
}

/**
 * Health check para verificar se o backend está ativo
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  message: string;
}> {
  try {
    console.log("🏥 Verificando health do backend...");
    // Health check não usa prefixo /api
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      console.log("✅ Backend está saudável");
      return { healthy: true, message: "Backend operacional" };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    console.warn("⚠️ Backend pode estar iniciando:", error);

    // Tentar endpoint alternativo
    try {
      const docsResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/api/docs`, {
        method: 'GET',
        signal: AbortSignal.timeout(20000),
      });
      
      if (docsResponse.ok) {
        console.log("✅ Backend respondeu via /docs");
        return { healthy: true, message: "Backend operacional (via docs)" };
      } else {
        throw new Error(`HTTP ${docsResponse.status}`);
      }
    } catch {
      return {
        healthy: false,
        message: "Backend indisponível - pode estar fazendo cold start",
      };
    }
  }
}

/**
 * Utilitários para tratamento de erros
 */
export const errorUtils = {
  /**
   * Extrai mensagem de erro legível
   */
  getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Erro desconhecido";
  },

  /**
   * Verifica se deve mostrar retry para o usuário
   */
  shouldShowRetry(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.isNetworkError || error.status >= 500;
    }
    return false;
  },

  /**
   * Formata erro para exibição ao usuário
   */
  formatErrorForUser(error: unknown): { message: string; canRetry: boolean } {
    if (error instanceof ApiError) {
      let message = "";

      if (error.isAuthError) {
        message = "Sessão expirada. Faça login novamente.";
      } else if (error.isNetworkError) {
        message = "Erro de conexão. Verifique sua internet.";
      } else if (error.status === 404) {
        message = "Recurso não encontrado.";
      } else if (error.status === 422) {
        message = error.response?.message || "Dados inválidos.";
      } else {
        message = error.message || "Erro interno do servidor.";
      }

      return {
        message,
        canRetry: this.shouldShowRetry(error),
      };
    }

    return {
      message: "Erro inesperado. Tente novamente.",
      canRetry: true,
    };
  },
};

export default api;

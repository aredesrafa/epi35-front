/**
 * Catalog Adapter - Service Adapter para Catálogo de EPIs
 *
 * Responsável por:
 * - CRUD de tipos de EPI
 * - Filtros e busca
 * - Paginação server-side
 * - Cache otimizado
 */

import { api, createUrlWithParams } from "../core/apiClient";
import type { PaginatedResponse } from "../../stores/paginatedStore";

// ==================== TIPOS ====================

export interface TipoEPI {
  id: string;
  nomeEquipamento: string;
  numeroCa: string;
  numeroCA?: string; // fallback compatibility
  categoria: string;
  status: "ATIVO" | "DESCONTINUADO";
  vidaUtilDias?: number; // em dias
  validadePadrao?: number; // fallback compatibility
  descricao?: string;
  ativo: boolean; // derived from status
  createdAt: string;
  updatedAt?: string;
  dataCriacao?: string; // fallback compatibility
  dataAtualizacao?: string; // fallback compatibility
}

export interface CatalogFilterParams {
  search?: string;
  categoria?: string;
  status?: string;
  ativo?: boolean;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export interface CreateTipoEPIData {
  nomeEquipamento: string;
  numeroCa: string;
  categoria: string;
  vidaUtilDias?: number;
  descricao?: string;
}

export interface UpdateTipoEPIData extends Partial<CreateTipoEPIData> {
  ativo?: boolean;
}

// ==================== CACHE ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CatalogCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
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
}

// ==================== CATALOG ADAPTER ====================

class CatalogAdapter {
  private cache = new CatalogCache();
  private baseUrl = "/tipos-epi";

  // ==================== CONSULTAS ====================

  /**
   * Lista tipos de EPI com paginação e filtros
   */
  async getTiposEPI(
    params: CatalogFilterParams = {},
  ): Promise<PaginatedResponse<TipoEPI>> {
    console.log(
      "📋 CatalogAdapter: Carregando tipos de EPI do backend real",
      params,
    );

    const cacheKey = `tipos-epi-${JSON.stringify(params)}`;
    const cached = this.cache.get<PaginatedResponse<TipoEPI>>(cacheKey);

    if (cached) {
      console.log("💾 Cache hit para tipos EPI");
      return cached;
    }

    try {
      // Chamada para API real
      const queryParams = {
        page: params.page || 1,
        limit: params.pageSize || 10,
        ...(params.search && { search: params.search }),
        ...(params.categoria && { categoria: params.categoria }),
        ...(params.ativo !== undefined && { ativo: params.ativo }),
      };

      const url = createUrlWithParams("/tipos-epi", queryParams);
      const response = await api.get(url) as {
        data: {
          items: any[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      };

      console.log("🔗 Resposta da API tipos-epi:", response);

      // Mapear resposta do backend para o formato esperado
      const mappedItems: TipoEPI[] = response.data.items.map((item: any) => ({
        id: item.id,
        nomeEquipamento: item.nomeEquipamento,
        numeroCa: item.numeroCa,
        numeroCA: item.numeroCa, // compatibility
        categoria: item.categoria,
        status: item.status || "ATIVO",
        vidaUtilDias: item.vidaUtilDias,
        validadePadrao: item.vidaUtilDias, // compatibility
        descricao: item.descricao || "",
        ativo: item.status === "ATIVO",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        dataCriacao: item.createdAt, // compatibility
        dataAtualizacao: item.updatedAt || item.createdAt, // compatibility
      }));

      const paginatedResponse: PaginatedResponse<TipoEPI> = {
        data: mappedItems,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      };

      this.cache.set(cacheKey, paginatedResponse);
      console.log(
        "✅ Tipos EPI carregados do backend real:",
        mappedItems.length,
        "itens",
      );

      return paginatedResponse;
    } catch (error: any) {
      console.error("❌ Erro ao carregar tipos EPI do backend:", error);
      throw new Error(
        "Não foi possível carregar o catálogo de EPIs do backend",
      );
    }
  }

  /**
   * Busca um tipo de EPI específico
   */
  async getTipoEPIById(id: string): Promise<TipoEPI> {
    console.log("🔍 CatalogAdapter: Buscando tipo EPI do backend real", id);

    const cacheKey = `tipo-epi-${id}`;
    const cached = this.cache.get<TipoEPI>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Chamada para API real
      const url = `/tipos-epi/${id}`;
      const response = await api.get(url) as { data: any };

      console.log("🔗 Resposta da API tipo-epi específico:", response);

      // Mapear resposta do backend para o formato esperado
      const item = response.data;
      const tipoEPI: TipoEPI = {
        id: item.id,
        nomeEquipamento: item.nomeEquipamento,
        numeroCa: item.numeroCa,
        numeroCA: item.numeroCa, // compatibility
        categoria: item.categoria,
        status: item.status || "ATIVO",
        vidaUtilDias: item.vidaUtilDias,
        validadePadrao: item.vidaUtilDias, // compatibility
        descricao: item.descricao || "",
        ativo: item.status === "ATIVO",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        dataCriacao: item.createdAt, // compatibility
        dataAtualizacao: item.updatedAt || item.createdAt, // compatibility
      };

      this.cache.set(cacheKey, tipoEPI);
      console.log("✅ Tipo EPI específico carregado do backend real");
      return tipoEPI;
    } catch (error: any) {
      console.error("❌ Erro ao buscar tipo EPI do backend:", error);
      throw new Error("Não foi possível buscar o tipo de EPI do backend");
    }
  }

  // ==================== COMANDOS ====================

  /**
   * Cria um novo tipo de EPI
   */
  async createTipoEPI(data: CreateTipoEPIData): Promise<TipoEPI> {
    console.log("➕ CatalogAdapter: Criando tipo EPI no backend real", data);

    try {
      // Mapear dados para formato do backend
      const backendData = {
        nomeEquipamento: data.nomeEquipamento,
        numeroCa: data.numeroCa,
        categoria: data.categoria,
        vidaUtilDias: data.vidaUtilDias,
        descricao: data.descricao,
        status: "ATIVO",
      };

      const response = await api.post("/tipos-epi", backendData) as { data: any };

      console.log("🔗 Resposta da criação no backend:", response);

      // Mapear resposta de volta para o formato frontend
      const item = response.data;
      const newTipoEPI: TipoEPI = {
        id: item.id,
        nomeEquipamento: item.nomeEquipamento,
        numeroCa: item.numeroCa,
        numeroCA: item.numeroCa, // compatibility
        categoria: item.categoria,
        status: item.status || "ATIVO",
        vidaUtilDias: item.vidaUtilDias,
        validadePadrao: item.vidaUtilDias, // compatibility
        descricao: item.descricao || "",
        ativo: item.status === "ATIVO",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        dataCriacao: item.createdAt, // compatibility
        dataAtualizacao: item.updatedAt || item.createdAt, // compatibility
      };

      // Limpar cache relacionado
      this.cache.clear();

      console.log("✅ Tipo EPI criado com sucesso no backend:", newTipoEPI.id);
      return newTipoEPI;
    } catch (error: any) {
      console.error("❌ Erro ao criar tipo EPI no backend:", error);
      throw new Error("Não foi possível criar o tipo de EPI");
    }
  }

  /**
   * Atualiza um tipo de EPI
   */
  async updateTipoEPI(id: string, data: UpdateTipoEPIData): Promise<TipoEPI> {
    console.log(
      "📝 CatalogAdapter: Atualizando tipo EPI no backend real",
      id,
      data,
    );

    try {
      // Mapear dados para formato do backend
      const backendData: any = {};

      if (data.nomeEquipamento)
        backendData.nomeEquipamento = data.nomeEquipamento;
      if (data.numeroCa) backendData.numeroCa = data.numeroCa;
      if (data.categoria) backendData.categoria = data.categoria;
      if (data.vidaUtilDias) backendData.vidaUtilDias = data.vidaUtilDias;
      if (data.descricao !== undefined) backendData.descricao = data.descricao;
      if (data.ativo !== undefined)
        backendData.status = data.ativo ? "ATIVO" : "DESCONTINUADO";

      const response = await api.put(`/tipos-epi/${id}`, backendData) as { data: any };

      console.log("🔗 Resposta da atualização no backend:", response);

      // Mapear resposta de volta para o formato frontend
      const item = response.data;
      const updatedTipoEPI: TipoEPI = {
        id: item.id,
        nomeEquipamento: item.nomeEquipamento,
        numeroCa: item.numeroCa,
        numeroCA: item.numeroCa, // compatibility
        categoria: item.categoria,
        status: item.status || "ATIVO",
        vidaUtilDias: item.vidaUtilDias,
        validadePadrao: item.vidaUtilDias, // compatibility
        descricao: item.descricao || "",
        ativo: item.status === "ATIVO",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        dataCriacao: item.createdAt, // compatibility
        dataAtualizacao: item.updatedAt || item.createdAt, // compatibility
      };

      // Limpar cache relacionado
      this.cache.delete(`tipo-epi-${id}`);
      this.cache.clear(); // Limpar lista também

      console.log("✅ Tipo EPI atualizado com sucesso no backend");
      return updatedTipoEPI;
    } catch (error: any) {
      console.error("❌ Erro ao atualizar tipo EPI no backend:", error);
      throw new Error("Não foi possível atualizar o tipo de EPI");
    }
  }

  /**
   * Remove um tipo de EPI (soft delete)
   */
  async deleteTipoEPI(id: string): Promise<void> {
    console.log("🗑️ CatalogAdapter: Removendo tipo EPI no backend real", id);

    try {
      // Usar soft delete (atualizar status para INATIVO)
      await this.updateTipoEPI(id, { ativo: false });

      console.log("✅ Tipo EPI removido com sucesso no backend");
    } catch (error: any) {
      console.error("❌ Erro ao remover tipo EPI no backend:", error);
      throw new Error("Não foi possível remover o tipo de EPI");
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Cache do catálogo limpo");
  }

  /**
   * Obtém opções únicas para filtros
   */
  async getFilterOptions(): Promise<{
    categorias: Array<{ value: string; label: string }>;
  }> {
    try {
      // Buscar todos os tipos de EPI (limitado pelo backend a 100, mas isso é suficiente)
      const data = await this.getTiposEPI({ pageSize: 100 });

      // Se há mais de 100 tipos, isso indicaria que precisamos de paginação adicional
      if (data.data && data.data.length >= 100) {
        console.warn(
          "⚠️ Mais de 100 tipos de EPI encontrados. Filtros podem estar incompletos.",
        );
      }

      const categorias = [...new Set(data.data.map((item) => item.categoria))]
        .filter(Boolean)
        .sort()
        .map((cat) => ({ value: cat, label: cat }));

      console.log("✅ Opções de filtros carregadas:", {
        categorias: categorias.length,
      });

      return { categorias };
    } catch (error: any) {
      console.error("❌ Erro ao carregar opções de filtros:", error);
      // Retornar opções vazias em caso de erro
      return { categorias: [] };
    }
  }
}

// ==================== EXPORT ====================

export const catalogAdapter = new CatalogAdapter();

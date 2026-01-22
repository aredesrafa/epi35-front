/**
 * Unified Data Adapter - Solução Definitiva
 *
 * Adapter unificado que resolve problemas de:
 * - Cache fragmentado
 * - Carregamento ineficiente de opções de filtros
 * - Inconsistências entre adapters
 * - Performance para grandes volumes (1000+ itens)
 */

import { api, createUrlWithParams } from "../core/apiClient";
import type { PaginatedResponse, PaginationParams } from "$lib/stores/paginatedStore";

// TODO: Verificar se FilterOptionsResponse existe ou se deve ser criado
interface FilterOptionsResponse {
  [key: string]: any;
}

// ==================== INTERFACES UNIFICADAS ====================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TipoEPIUnified extends BaseEntity {
  nomeEquipamento: string;
  numeroCA: string;
  categoria: string;
  status: "ATIVO" | "DESCONTINUADO";
  validadePadrao?: number;
  descricao?: string;
  ativo: boolean; // Derived from status for compatibility
  // Campos calculados
  totalEstoque?: number;
  estoqueDisponivel?: number;
}

export interface ItemEstoqueUnified extends BaseEntity {
  tipoEPIId: string;
  almoxarifadoId: string;
  quantidade: number;
  localizacao: string;
  status: string;
  lote?: string;
  dataValidade?: string;
  // Expandido
  tipoEPI?: TipoEPIUnified;
  almoxarifado?: AlmoxarifadoUnified;
}

export interface AlmoxarifadoUnified extends BaseEntity {
  nome: string;
  localizacao: string;
  ativo: boolean;
  unidadeNegocioId: string;
}

export interface UnifiedSearchParams extends PaginationParams {
  // Campos de busca comuns
  search?: string;

  // Filtros comuns
  ativo?: boolean;
  categoria?: string;
  status?: string;
  almoxarifadoId?: string;

  // Filtros específicos do estoque
  quantidadeMin?: number;
  quantidadeMax?: number;
  dataValidadeInicio?: string;
  dataValidadeFim?: string;

  // Opções de expansão
  includeExpanded?: boolean;
  includeAggregate?: boolean;
}

// ==================== CACHE UNIFICADO ====================

interface CacheConfig {
  ttl: number;
  maxSize: number;
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  "tipos-epi": { ttl: 10 * 60 * 1000, maxSize: 1000 }, // 10 min - dados menos voláteis
  estoque: { ttl: 2 * 60 * 1000, maxSize: 500 }, // 2 min - dados voláteis
  "filter-options": { ttl: 30 * 60 * 1000, maxSize: 100 }, // 30 min - opções estáticas
  almoxarifados: { ttl: 15 * 60 * 1000, maxSize: 100 }, // 15 min - dados semi-estáticos
};

class UnifiedDataCache {
  private cache = new Map<string, any>();
  private sizes = new Map<string, number>();

  private getCacheConfig(key: string): CacheConfig {
    for (const [pattern, config] of Object.entries(CACHE_CONFIGS)) {
      if (key.includes(pattern)) {
        return config;
      }
    }
    return { ttl: 5 * 60 * 1000, maxSize: 100 }; // Default
  }

  set(key: string, data: any): void {
    const config = this.getCacheConfig(key);
    const timestamp = Date.now();

    this.cache.set(key, { data, timestamp, ttl: config.ttl });

    // Controle de tamanho
    const currentSize = this.sizes.get(key.split("-")[0]) || 0;
    if (currentSize >= config.maxSize) {
      this.evictOldest(key.split("-")[0]);
    }
    this.sizes.set(key.split("-")[0], currentSize + 1);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      const prefix = key.split("-")[0];
      const currentSize = this.sizes.get(prefix) || 0;
      this.sizes.set(prefix, Math.max(0, currentSize - 1));
    }
  }

  private evictOldest(prefix: string): void {
    const keysToCheck = Array.from(this.cache.keys()).filter((k) =>
      k.startsWith(prefix),
    );
    if (keysToCheck.length === 0) return;

    const oldest = keysToCheck.reduce((oldest, current) => {
      const oldestTime = this.cache.get(oldest)?.timestamp || 0;
      const currentTime = this.cache.get(current)?.timestamp || 0;
      return currentTime < oldestTime ? current : oldest;
    });

    this.delete(oldest);
  }

  invalidateByPattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.includes(pattern),
    );
    keysToDelete.forEach((key) => this.delete(key));
  }

  clear(): void {
    this.cache.clear();
    this.sizes.clear();
  }

  getStats(): { totalKeys: number; sizeByType: Record<string, number> } {
    return {
      totalKeys: this.cache.size,
      sizeByType: Object.fromEntries(this.sizes),
    };
  }
}

// ==================== UNIFIED DATA ADAPTER ====================

class UnifiedDataAdapter {
  private cache = new UnifiedDataCache();

  // ==================== TIPOS EPI ====================

  /**
   * Busca tipos de EPI com performance otimizada para grandes volumes
   */
  async getTiposEPI(
    params: UnifiedSearchParams = {},
  ): Promise<PaginatedResponse<TipoEPIUnified>> {
    const cacheKey = `tipos-epi-${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log("📄 Cache hit - tipos EPI");
      return cached;
    }

    try {
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.search && { search: params.search }),
        ...(params.categoria &&
          params.categoria !== "todas" && { categoria: params.categoria }),
        ...(params.status &&
          params.status !== "todos" && { status: params.status }),
        ...(params.ativo !== undefined && { ativo: params.ativo }),
        ...(params.includeAggregate && { includeEstoque: true }),
      };

      const url = createUrlWithParams("/tipos-epi", queryParams);
      const response = await api.get(url) as any;

      // Mapear resposta para formato unificado conforme estrutura real da API
      const mappedItems: TipoEPIUnified[] = response.data.items.map(
        (item: any) => ({
          id: item.id,
          nomeEquipamento: item.nomeEquipamento,
          numeroCA: item.numeroCa,
          categoria: item.categoria,
          status: item.status || "ATIVO",
          validadePadrao: item.vidaUtilDias,
          descricao: item.descricao || "",
          ativo: item.status === "ATIVO", // Derived field for compatibility
          createdAt: item.createdAt,
          updatedAt: item.updatedAt || item.createdAt,
          // Campos agregados se solicitados
          ...(item.totalEstoque && { totalEstoque: item.totalEstoque }),
          ...(item.estoqueDisponivel && {
            estoqueDisponivel: item.estoqueDisponivel,
          }),
        }),
      );

      const result: PaginatedResponse<TipoEPIUnified> = {
        data: mappedItems,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      };

      this.cache.set(cacheKey, result);
      console.log(
        `✅ Tipos EPI carregados: ${mappedItems.length} itens (${result.total} total)`,
      );

      return result;
    } catch (error: any) {
      console.error("❌ Erro ao carregar tipos EPI:", error);
      throw new Error("Não foi possível carregar o catálogo de EPIs");
    }
  }

  // ==================== ESTOQUE ====================

  /**
   * Busca itens de estoque com dados expandidos
   */
  async getEstoqueItems(
    params: UnifiedSearchParams = {},
  ): Promise<PaginatedResponse<ItemEstoqueUnified>> {
    const cacheKey = `estoque-${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log("📄 Cache hit - estoque");
      return cached;
    }

    try {
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        includeExpanded: true, // Sempre incluir dados expandidos
        ...(params.search && { search: params.search }),
        ...(params.status &&
          params.status !== "todos" && { status: params.status }),
        ...(params.categoria &&
          params.categoria !== "todas" && { categoria: params.categoria }),
        ...(params.almoxarifadoId && { almoxarifadoId: params.almoxarifadoId }),
        ...(params.quantidadeMin && { quantidadeMin: params.quantidadeMin }),
        ...(params.quantidadeMax && { quantidadeMax: params.quantidadeMax }),
      };

      const url = createUrlWithParams("/estoque-itens", queryParams);
      const response = await api.get(url) as any;

      // Mapear resposta para formato unificado
      const mappedItems: ItemEstoqueUnified[] = response.data.items.map(
        (item: any) => ({
          id: item.id,
          tipoEPIId: item.tipoEpiId,
          almoxarifadoId: item.almoxarifadoId,
          quantidade: item.quantidade,
          localizacao: item.localizacao || "",
          status: item.status,
          lote: item.lote,
          dataValidade: item.dataValidade,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          // Dados expandidos
          tipoEPI: item.tipoEpi
            ? {
                id: item.tipoEpi.id,
                nomeEquipamento: item.tipoEpi.nomeEquipamento,
                numeroCA: item.tipoEpi.numeroCa,
                categoria: item.tipoEpi.categoria,
                status: item.tipoEpi.status || "ATIVO",
                validadePadrao: item.tipoEpi.vidaUtilDias,
                descricao: item.tipoEpi.descricao || "",
                ativo: item.tipoEpi.status === "ATIVO",
                createdAt: item.tipoEpi.createdAt,
                updatedAt: item.tipoEpi.updatedAt || item.tipoEpi.createdAt,
              }
            : undefined,
          almoxarifado: item.almoxarifado
            ? {
                id: item.almoxarifado.id,
                nome: item.almoxarifado.nome,
                localizacao: item.almoxarifado.localizacao || "",
                ativo: item.almoxarifado.status === "ATIVO",
                unidadeNegocioId: item.almoxarifado.unidadeNegocioId || "",
                createdAt: item.almoxarifado.createdAt,
                updatedAt:
                  item.almoxarifado.updatedAt || item.almoxarifado.createdAt,
              }
            : undefined,
        }),
      );

      const result: PaginatedResponse<ItemEstoqueUnified> = {
        data: mappedItems,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      };

      this.cache.set(cacheKey, result);
      console.log(
        `✅ Estoque carregado: ${mappedItems.length} itens (${result.total} total)`,
      );

      return result;
    } catch (error: any) {
      console.error("❌ Erro ao carregar estoque:", error);
      throw new Error("Não foi possível carregar os dados de estoque");
    }
  }

  // ==================== FILTER OPTIONS ====================

  /**
   * Carrega opções de filtros de forma otimizada
   * Resolve o problema de performance ao buscar opções para 1000+ tipos
   */
  async getFilterOptions(): Promise<FilterOptionsResponse> {
    const cacheKey = "filter-options-unified";
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log("📄 Cache hit - filter options");
      return cached;
    }

    try {
      console.log("🌐 Carregando opções de filtros com fallback...");

      // ✅ STRATEGY FALLBACK: Extrair opções dos dados principais do endpoint
      const [tiposEpiResponse, almoxarifadosResponse] = await Promise.all([
        api.get("/tipos-epi?limit=100"), // Carregar todos os tipos para extrair filtros
        api.get("/almoxarifados?ativo=true&limit=100"), // Almoxarifados ativos
      ]);

      // Extrair categorias únicas dos dados (removido fabricantes - campo inexistente)
      const categorias = new Set<string>();

      tiposEpiResponse.data.items.forEach((item: any) => {
        if (item.categoria) categorias.add(item.categoria);
      });

      const options: FilterOptionsResponse = {
        categorias: [
          { value: "todas", label: "Todas as Categorias" },
          ...Array.from(categorias).map((cat) => ({
            value: cat,
            label: this.formatCategoryLabel(cat),
          })),
        ],
        status: [
          { value: "todos", label: "Todos os Status" },
          { value: "ATIVO", label: "Ativo" },
          { value: "DESCONTINUADO", label: "Descontinuado" },
        ],
        almoxarifados: [
          { value: "", label: "Todos os Almoxarifados" },
          ...almoxarifadosResponse.data.items.map((alm: any) => ({
            value: alm.id,
            label: alm.nome,
          })),
        ],
      };

      this.cache.set(cacheKey, options);
      console.log("✅ Opções de filtros carregadas de forma otimizada");

      return options;
    } catch (error: any) {
      console.error("❌ Erro ao carregar opções de filtros:", error);

      // Fallback com opções vazias
      return {
        categorias: [{ value: "todas", label: "Todas as Categorias" }],
        status: [
          { value: "todos", label: "Todos os Status" },
          { value: "ATIVO", label: "Ativo" },
          { value: "DESCONTINUADO", label: "Descontinuado" },
        ],
        almoxarifados: [{ value: "", label: "Todos os Almoxarifados" }],
      };
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Formata labels de categoria do backend (remove underscores, capitaliza)
   */
  private formatCategoryLabel(categoria: string): string {
    if (!categoria) return categoria;

    return categoria
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // ==================== ALMOXARIFADOS ====================

  /**
   * Busca almoxarifados ativos
   */
  async getAlmoxarifados(): Promise<AlmoxarifadoUnified[]> {
    const cacheKey = "almoxarifados-ativos";
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log("📄 Cache hit - almoxarifados");
      return cached;
    }

    try {
      const response = await api.get("/almoxarifados?ativo=true&limit=100") as any;

      const almoxarifados: AlmoxarifadoUnified[] = response.data.items.map(
        (item: any) => ({
          id: item.id,
          nome: item.nome,
          localizacao: item.localizacao || "",
          ativo: item.status === "ATIVO",
          unidadeNegocioId: item.unidadeNegocioId || "",
          createdAt: item.createdAt,
          updatedAt: item.updatedAt || item.createdAt,
        }),
      );

      this.cache.set(cacheKey, almoxarifados);
      console.log(`✅ Almoxarifados carregados: ${almoxarifados.length} itens`);

      return almoxarifados;
    } catch (error: any) {
      console.error("❌ Erro ao carregar almoxarifados:", error);
      throw new Error("Não foi possível carregar os almoxarifados");
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Formata labels de categoria para exibição
   */
  private formatCategoryLabel(category: string): string {
    const categoryLabels: Record<string, string> = {
      PROTECAO_CABECA: "Proteção da Cabeça",
      PROTECAO_AUDITIVA: "Proteção Auditiva",
      PROTECAO_OCULAR: "Proteção Ocular",
      PROTECAO_RESPIRATORIA: "Proteção Respiratória",
      PROTECAO_MAOS: "Proteção das Mãos",
      PROTECAO_PES: "Proteção dos Pés",
      PROTECAO_CORPO: "Proteção do Corpo",
      PROTECAO_GERAL: "Proteção Geral",
      PROTECAO_ALTURA: "Proteção contra Quedas",
    };

    return (
      categoryLabels[category] ||
      category
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Invalida cache relacionado a uma entidade
   */
  invalidateCache(
    entity: "tipos-epi" | "estoque" | "almoxarifados" | "all",
  ): void {
    if (entity === "all") {
      this.cache.clear();
    } else {
      this.cache.invalidateByPattern(entity);
    }
    console.log(`🗑️ Cache invalidado: ${entity}`);
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): any {
    return this.cache.getStats();
  }

  /**
   * Força limpeza do cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Cache completamente limpo");
  }
}

// ==================== EXPORT ====================

export const unifiedDataAdapter = new UnifiedDataAdapter();
export default unifiedDataAdapter;

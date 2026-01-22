/**
 * Entity Management Adapter
 *
 * Gerencia entidades com hierarquias complexas como CONTRATADAS → COLABORADORES → FICHAS_EPI.
 * Fornece métodos context-aware para buscar dados respeitando as relações hierárquicas.
 */

import { api, createUrlWithParams } from "../core/apiClient";
import type {
  ContratadaDTO,
  ColaboradorDTO,
  TipoEPIDTO,
  AlmoxarifadoDTO,
  EntityParams,
  PaginatedColaboradores,
  PaginatedTiposEPI,
  TiposEPIResponse,
} from "$lib/types/serviceTypes";
import type { PaginatedResponse } from "$lib/stores/paginatedStore";

class EntityManagementAdapter {
  // ==================== CONTRATADAS ====================

  /**
   * Busca todas as contratadas
   */
  async getContratadas(params: EntityParams = {}): Promise<ContratadaDTO[]> {
    const url = createUrlWithParams("/contratadas", {
      ativo: params.ativo,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order,
    });

    return api.get<ContratadaDTO[]>(url);
  }

  /**
   * Busca contratada por ID
   */
  async getContratadaById(id: string): Promise<ContratadaDTO> {
    return api.get<ContratadaDTO>(`/contratadas/${id}`);
  }

  /**
   * Cria nova contratada
   */
  async createContratada(
    data: Omit<ContratadaDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<ContratadaDTO> {
    return api.post<ContratadaDTO>("/contratadas", data);
  }

  /**
   * Atualiza contratada
   */
  async updateContratada(
    id: string,
    data: Partial<ContratadaDTO>,
  ): Promise<ContratadaDTO> {
    return api.put<ContratadaDTO>(`/contratadas/${id}`, data);
  }

  /**
   * Remove contratada (soft delete)
   */
  async deleteContratada(id: string): Promise<void> {
    return api.delete<void>(`/contratadas/${id}`);
  }

  // ==================== COLABORADORES ====================

  /**
   * Busca colaboradores com paginação e filtros
   * Context-aware: pode filtrar por contratada
   */
  async getColaboradores(
    params: EntityParams = {},
  ): Promise<PaginatedColaboradores> {
    const url = createUrlWithParams("/colaboradores", {
      contratadaId: params.contratadaId,
      ativo: params.ativo,
      includeRelations: params.includeRelations,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order,
      search: params.search,
      ...(params.filters || {}),
    });

    return api.get<PaginatedColaboradores>(url);
  }

  /**
   * Busca colaboradores de uma contratada específica
   */
  async getColaboradoresByContratada(
    contratadaId: string,
    params: EntityParams = {},
  ): Promise<ColaboradorDTO[]> {
    const url = createUrlWithParams(`/colaboradores`, {
      contratadaId,
      ativo: params.ativo,
      includeRelations: params.includeRelations,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order,
    });

    // Se não há paginação, retorna array simples
    if (!params.page && !params.limit) {
      return api.get<ColaboradorDTO[]>(url);
    }

    // Se há paginação, retorna apenas os dados da resposta paginada
    const response = await api.get<PaginatedColaboradores>(url) as any;
    return response.data;
  }

  /**
   * Busca colaborador por ID
   */
  async getColaboradorById(
    id: string,
    includeRelations = false,
  ): Promise<ColaboradorDTO> {
    const url = createUrlWithParams(`/colaboradores/${id}`, {
      includeRelations,
    });

    return api.get<ColaboradorDTO>(url);
  }

  /**
   * Cria novo colaborador
   */
  async createColaborador(
    data: Omit<ColaboradorDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<ColaboradorDTO> {
    return api.post<ColaboradorDTO>("/colaboradores", data);
  }

  /**
   * Atualiza colaborador
   */
  async updateColaborador(
    id: string,
    data: Partial<ColaboradorDTO>,
  ): Promise<ColaboradorDTO> {
    return api.put<ColaboradorDTO>(`/colaboradores/${id}`, data);
  }

  /**
   * Remove colaborador (soft delete)
   */
  async deleteColaborador(id: string): Promise<void> {
    return api.delete<void>(`/colaboradores/${id}`);
  }

  // ==================== TIPOS EPI ====================

  /**
   * Busca tipos de EPI com paginação e filtros
   * Conectado ao backend real
   */
  async getTiposEPI(params: EntityParams = {}): Promise<PaginatedTiposEPI> {
    try {
      // Usar backend real
      const response = await api.get<{ data: TiposEPIResponse }>(
        "/tipos-epi",
        params,
      );
      const items = response.data.items || [];

      return {
        data: items,
        total: response.data.total || items.length,
        page: params.page || 1,
        pageSize: params.limit || 50,
        totalPages: Math.ceil(
          (response.data.total || items.length) / (params.limit || 50),
        ),
      };
    } catch (error: any) {
      console.error("❌ Erro ao buscar tipos EPI:", error);
      throw error;
    }
  }

  /**
   * Busca tipos de EPI por categoria
   */
  async getTiposEPIByCategoria(
    categoria?: string,
    params: EntityParams = {},
  ): Promise<TipoEPIDTO[]> {
    const url = createUrlWithParams("/tipos-epi", {
      categoria,
      ativo: params.ativo,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order,
    });

    // Se não há paginação, retorna array simples
    if (!params.page && !params.limit) {
      return api.get<TipoEPIDTO[]>(url);
    }

    // Se há paginação, retorna apenas os dados da resposta paginada
    const response = await api.get<PaginatedTiposEPI>(url) as any;
    return response.data;
  }

  /**
   * Busca tipo EPI por ID
   */
  async getTipoEPIById(id: string): Promise<TipoEPIDTO> {
    return api.get<TipoEPIDTO>(`/tipos-epi/${id}`);
  }

  /**
   * Busca tipos EPI por número CA
   */
  async getTipoEPIByCA(numeroCA: string): Promise<TipoEPIDTO | null> {
    try {
      const url = createUrlWithParams("/tipos-epi/search", { numeroCA });
      return await api.get<TipoEPIDTO>(url);
    } catch (error: any) {
      // Se não encontrar, retorna null ao invés de throw
      return null;
    }
  }

  /**
   * Cria novo tipo EPI
   */
  async createTipoEPI(
    data: Omit<TipoEPIDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<TipoEPIDTO> {
    return api.post<TipoEPIDTO>("/tipos-epi", data);
  }

  /**
   * Atualiza tipo EPI
   */
  async updateTipoEPI(
    id: string,
    data: Partial<TipoEPIDTO>,
  ): Promise<TipoEPIDTO> {
    return api.put<TipoEPIDTO>(`/tipos-epi/${id}`, data);
  }

  /**
   * Remove tipo EPI (soft delete)
   */
  async deleteTipoEPI(id: string): Promise<void> {
    return api.delete<void>(`/tipos-epi/${id}`);
  }

  // ==================== ALMOXARIFADOS ====================

  /**
   * Busca todos os almoxarifados
   * TEMPORÁRIO: Dados mockados até integração com backend
   */
  async getAlmoxarifados(
    params: EntityParams = {},
  ): Promise<AlmoxarifadoDTO[]> {
    try {
      // Dados mockados simples
      const mockAlmoxarifados: AlmoxarifadoDTO[] = [
        {
          id: "1",
          nome: "Almoxarifado Central",
          codigo: "ALM-001",
          localizacao: "Setor A - Galpão 1",
          ativo: true,
          unidadeNegocioId: "1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          nome: "Almoxarifado Secundário",
          codigo: "ALM-002",
          localizacao: "Setor B - Galpão 2",
          ativo: true,
          unidadeNegocioId: "1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          nome: "Almoxarifado Obras",
          codigo: "ALM-003",
          localizacao: "Canteiro - Container 1",
          ativo: true,
          unidadeNegocioId: "1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Aplicar filtros se necessário
      let filteredData = mockAlmoxarifados;

      if (params.ativo !== undefined) {
        filteredData = mockAlmoxarifados.filter(
          (item) => item.ativo === params.ativo,
        );
      }

      return filteredData;
    } catch (error: any) {
      console.error("❌ Erro ao buscar almoxarifados:", error);
      throw error;
    }
  }

  /**
   * Busca almoxarifado por ID
   */
  async getAlmoxarifadoById(id: string): Promise<AlmoxarifadoDTO> {
    return api.get<AlmoxarifadoDTO>(`/almoxarifados/${id}`);
  }

  /**
   * Cria novo almoxarifado
   */
  async createAlmoxarifado(
    data: Omit<AlmoxarifadoDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<AlmoxarifadoDTO> {
    return api.post<AlmoxarifadoDTO>("/almoxarifados", data);
  }

  /**
   * Atualiza almoxarifado
   */
  async updateAlmoxarifado(
    id: string,
    data: Partial<AlmoxarifadoDTO>,
  ): Promise<AlmoxarifadoDTO> {
    return api.put<AlmoxarifadoDTO>(`/almoxarifados/${id}`, data);
  }

  /**
   * Remove almoxarifado (soft delete)
   */
  async deleteAlmoxarifado(id: string): Promise<void> {
    return api.delete<void>(`/almoxarifados/${id}`);
  }

  // ==================== MÉTODOS HIERÁRQUICOS AVANÇADOS ====================

  /**
   * Busca a hierarquia completa: contratada com seus colaboradores
   */
  async getContratadaWithColaboradores(
    contratadaId: string,
  ): Promise<ContratadaDTO & { colaboradores: ColaboradorDTO[] }> {
    const [contratada, colaboradores] = await Promise.all([
      this.getContratadaById(contratadaId),
      this.getColaboradoresByContratada(contratadaId, { ativo: true }),
    ]);

    return {
      ...contratada,
      colaboradores,
    };
  }

  /**
   * Busca contratadas com contagem de colaboradores
   */
  async getContratadasWithStats(): Promise<
    Array<
      ContratadaDTO & {
        totalColaboradores: number;
        colaboradoresAtivos: number;
      }
    >
  > {
    // Esta funcionalidade seria idealmente implementada no backend para performance
    // Por ora, fazemos as chamadas separadamente
    const contratadas = await this.getContratadas({ ativo: true });

    const contratadasWithStats = await Promise.all(
      contratadas.map(async (contratada) => {
        const colaboradores = await this.getColaboradoresByContratada(
          contratada.id,
        );
        const colaboradoresAtivos = colaboradores.filter((c) => c.ativo);

        return {
          ...contratada,
          totalColaboradores: colaboradores.length,
          colaboradoresAtivos: colaboradoresAtivos.length,
        };
      }),
    );

    return contratadasWithStats;
  }

  /**
   * Busca tipos EPI mais utilizados (seria implementado no backend)
   */
  async getTiposEPIMaisUtilizados(
    limit = 10,
  ): Promise<Array<TipoEPIDTO & { utilizacoes: number }>> {
    // Implementação mockada - seria um endpoint específico no backend
    const url = createUrlWithParams("/tipos-epi/mais-utilizados", { limit });
    return api.get<Array<TipoEPIDTO & { utilizacoes: number }>>(url);
  }

  // ==================== MÉTODOS DE CACHE ====================

  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Busca contratadas com cache
   */
  async getContratadasCached(): Promise<ContratadaDTO[]> {
    const cacheKey = "contratadas_ativas";
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.getContratadas({ ativo: true });
    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const entityManagementAdapter = new EntityManagementAdapter();
export default entityManagementAdapter;

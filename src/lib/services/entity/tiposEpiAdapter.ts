/**
 * Tipos EPI Adapter - Backend Integration
 *
 * Adapter especializado para tipos de EPI
 * Focado em fornecer opções para componentes de seleção
 */

import { api } from "../core/apiClient";
import type { PaginatedResponse } from "$lib/stores/paginatedStore";

// ==================== INTERFACES ====================

export interface TipoEpi {
  id: string;
  // Backend response fields (camelCase)
  nomeEquipamento: string;
  numeroCa: string;
  categoria: string;
  descricao?: string;
  vidaUtilDias?: number;
  status: "ATIVO" | "DESCONTINUADO";
  createdAt: string;
  // Legacy fields for compatibility (snake_case)
  nome_equipamento?: string;
  numero_ca?: string;
  custo_unitario?: number;
  data_validade?: string;
  created_at?: string;
  // Propriedades faltantes identificadas nos erros TS
  numeroCA?: string;
  ca?: string;
  category?: string;
  custoUnitario?: number;
  preco?: number;
}

export interface TipoEpiSelectOption {
  value: string;
  label: string;
  categoria: string;
  numeroCA: string;
  custoUnitario?: number;
  status?: string;
  // Propriedade faltante identificada nos erros TS
  custoSugerido?: number;
}

// ==================== ADAPTER CLASS ====================

class TiposEpiAdapter {
  private baseEndpoint = "/tipos-epi";

  /**
   * Lista tipos de EPI disponíveis para seleção
   */
  async listarTiposEpi(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoria?: string;
    status?: "ATIVO" | "DESCONTINUADO" | "todos";
  }): Promise<PaginatedResponse<TipoEpi>> {
    console.log("🛡️ TiposEpiAdapter: Listando tipos de EPI", params);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.categoria) queryParams.append("categoria", params.categoria);
      // Temporarily disable status filter to debug backend compatibility
      // if (params?.status && params.status !== 'todos') {
      //   queryParams.append('status', params.status);
      // }

      const url = `${this.baseEndpoint}?${queryParams.toString()}`;

      const response = await api.get<{
        success: boolean;
        data: {
          items: TipoEpi[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }>(url);

      console.log("✅ Tipos de EPI listados:", response.data.pagination);

      return {
        data: response.data.items,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      };
    } catch (error: any) {
      console.error("❌ Erro ao listar tipos de EPI:", error);

      // Se for timeout, usar dados de fallback temporariamente
      if (error instanceof Error && (error.name === "AbortError" || error.message?.includes("timeout"))) {
        console.warn(
          "⚠️ Backend indisponível, usando dados de fallback para tipos EPI",
        );
        const fallbackData = this.getFallbackTiposEPI();
        return {
          data: fallbackData,
          total: fallbackData.length,
          page: 1,
          pageSize: fallbackData.length,
          totalPages: 1,
        };
      }

      throw new Error("Não foi possível carregar os tipos de EPI");
    }
  }

  /**
   * Obtém um tipo de EPI específico por ID
   */
  async obterTipoEpi(id: string): Promise<TipoEpi> {
    console.log("🔍 TiposEpiAdapter: Buscando tipo de EPI", id);

    try {
      const response = await api.get<{
        success: boolean;
        data: TipoEpi;
      }>(`${this.baseEndpoint}/${id}`);

      console.log("✅ Tipo de EPI encontrado:", response.data.nome_equipamento);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erro ao buscar tipo de EPI:", error);
      throw new Error("Não foi possível encontrar o tipo de EPI");
    }
  }

  /**
   * Converte tipos de EPI em opções para componentes Select
   * Otimizado para criação de notas de entrada
   */
  async obterOpcoesSelect(filtros?: {
    categoria?: string;
    apenasAtivos?: boolean;
    limite?: number;
  }): Promise<TipoEpiSelectOption[]> {
    console.log("🔧 TiposEpiAdapter: Carregando opções para select", filtros);

    try {
      const params: any = {
        page: 1,
        limit: filtros?.limite || 100,
      };

      // Only add optional filters if they have valid values
      if (filtros?.categoria) {
        params.categoria = filtros.categoria;
      }

      // Try without status filter first to see if that's causing the issue
      // if (filtros?.apenasAtivos !== false) {
      //   params.status = 'ATIVO';
      // }

      const response = await this.listarTiposEpi(params);

      // Helper function to validate ID format
      const isValidId = (id: string): boolean => {
        // Check if it's a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        // Check if it's a valid custom ID (6 alphanumeric characters)
        const customIdRegex = /^[A-Z0-9]{6}$/;
        
        return uuidRegex.test(id) || customIdRegex.test(id);
      };

      // Filter out items with invalid IDs first
      const validTipos = response.data.filter(tipo => {
        const valid = isValidId(tipo.id);
        if (!valid) {
          console.warn(`⚠️ Tipo EPI com ID inválido ignorado: ${tipo.id} - ${tipo.nomeEquipamento}`);
        }
        return valid;
      });

      console.log(`🔍 Tipos EPI válidos: ${validTipos.length} de ${response.data.length}`);

      const opcoes = validTipos.map((tipo) => {
        console.log(
          "🔍 Mapeando tipo EPI completo:",
          JSON.stringify(tipo, null, 2),
        );

        // Debug every possible field to understand backend structure
        console.log("🔍 Campos disponíveis:", Object.keys(tipo));
        console.log("🔍 nome_equipamento:", tipo.nome_equipamento);
        console.log("🔍 nomeEquipamento:", tipo.nomeEquipamento);
        console.log("🔍 nome:", (tipo as any).nome);
        console.log("🔍 name:", (tipo as any).name);

        // Backend returns camelCase fields (confirmed via API test)
        const nomeEquipamento =
          tipo.nomeEquipamento ||
          tipo.nome_equipamento ||
          (tipo as any).nome ||
          (tipo as any).name ||
          "Nome não identificado";

        const numeroCA =
          tipo.numeroCa || tipo.numero_ca || tipo.numeroCA || tipo.ca || "N/A";

        const categoria = tipo.categoria || tipo.category || "Sem categoria";

        const opcaoFinal = {
          value: tipo.id,
          label: `${nomeEquipamento} (CA: ${numeroCA})`,
          categoria: categoria,
          numeroCA: numeroCA,
          custoUnitario:
            tipo.custo_unitario || tipo.custoUnitario || tipo.preco || 0,
          status: tipo.status,
        };

        console.log("🎯 Opção final criada:", opcaoFinal);
        return opcaoFinal;
      });

      // Ordenar alfabeticamente por nome do equipamento
      opcoes.sort((a, b) => a.label.localeCompare(b.label));

      console.log("✅ Opções de select criadas:", opcoes.length);
      return opcoes;
    } catch (error: any) {
      console.error("❌ Erro ao criar opções de select:", error);

      // Retornar lista vazia em caso de erro para não quebrar a UI
      return [];
    }
  }

  /**
   * Obtém opções agrupadas por categoria
   */
  async obterOpcoesAgrupadasPorCategoria(): Promise<{
    [categoria: string]: TipoEpiSelectOption[];
  }> {
    console.log("📂 TiposEpiAdapter: Agrupando opções por categoria");

    try {
      const opcoes = await this.obterOpcoesSelect({ apenasAtivos: true });

      const agrupadas: { [categoria: string]: TipoEpiSelectOption[] } = {};

      opcoes.forEach((opcao) => {
        if (!agrupadas[opcao.categoria]) {
          agrupadas[opcao.categoria] = [];
        }
        agrupadas[opcao.categoria].push(opcao);
      });

      // Ordenar itens dentro de cada categoria
      Object.keys(agrupadas).forEach((categoria) => {
        agrupadas[categoria].sort((a, b) => a.label.localeCompare(b.label));
      });

      console.log("✅ Opções agrupadas por categoria:", Object.keys(agrupadas));
      return agrupadas;
    } catch (error: any) {
      console.error("❌ Erro ao agrupar opções por categoria:", error);
      return {};
    }
  }

  /**
   * Cache para opções de seleção
   */
  private selectOptionsCache: {
    data: TipoEpiSelectOption[];
    timestamp: number;
    key: string;
  } | null = null;

  /**
   * Obtém opções para select com cache inteligente
   */
  async obterOpcoesSelectComCache(filtros?: {
    categoria?: string;
    apenasAtivos?: boolean;
    limite?: number;
  }): Promise<TipoEpiSelectOption[]> {
    const TTL = 5 * 60 * 1000; // 5 minutos
    const now = Date.now();
    const cacheKey = JSON.stringify(filtros || {});

    // Verificar cache
    if (
      this.selectOptionsCache &&
      this.selectOptionsCache.key === cacheKey &&
      now - this.selectOptionsCache.timestamp < TTL
    ) {
      console.log("💾 TiposEpiAdapter: Usando cache para opções select");
      return this.selectOptionsCache.data;
    }

    // Cache expirado ou filtros diferentes, buscar dados frescos
    const freshData = await this.obterOpcoesSelect(filtros);

    // Salvar no cache
    this.selectOptionsCache = {
      data: freshData,
      timestamp: now,
      key: cacheKey,
    };

    return freshData;
  }

  /**
   * Busca tipos de EPI por nome ou CA
   */
  async buscarTiposEpi(termo: string): Promise<TipoEpiSelectOption[]> {
    console.log("🔍 TiposEpiAdapter: Buscando tipos de EPI", termo);

    if (!termo || termo.length < 2) {
      return [];
    }

    try {
      const response = await this.listarTiposEpi({
        search: termo,
        limit: 20,
        // Temporarily disable status filter to debug backend compatibility
        // status: 'ATIVO'
      });

      const opcoes = response.data.map((tipo) => {
        // Backend returns camelCase fields (confirmed via API test)
        const nomeEquipamento =
          tipo.nomeEquipamento ||
          tipo.nome_equipamento ||
          (tipo as any).nome ||
          (tipo as any).name ||
          "Nome não identificado";

        const numeroCA =
          tipo.numeroCa || tipo.numero_ca || tipo.numeroCA || tipo.ca || "N/A";

        const categoria = tipo.categoria || tipo.category || "Sem categoria";

        return {
          value: tipo.id,
          label: `${nomeEquipamento} (CA: ${numeroCA})`,
          categoria: categoria,
          numeroCA: numeroCA,
          custoUnitario:
            tipo.custo_unitario || tipo.custoUnitario || tipo.preco || 0,
        };
      });

      console.log("✅ Busca realizada, encontrados:", opcoes.length);
      return opcoes;
    } catch (error: any) {
      console.error("❌ Erro na busca de tipos de EPI:", error);
      return [];
    }
  }

  /**
   * Obtém categorias disponíveis
   */
  async obterCategorias(): Promise<string[]> {
    console.log("📋 TiposEpiAdapter: Carregando categorias");

    try {
      // Buscar uma amostra grande para extrair todas as categorias
      const response = await this.listarTiposEpi({
        limit: 500,
        // Temporarily disable status filter to debug backend compatibility
        // status: 'ATIVO'
      });

      const categorias = [
        ...new Set(response.data.map((tipo) => tipo.categoria)),
      ]
        .filter((categoria) => categoria && categoria.trim() !== "")
        .sort();

      console.log("✅ Categorias encontradas:", categorias);
      return categorias;
    } catch (error: any) {
      console.error("❌ Erro ao carregar categorias:", error);
      return [];
    }
  }

  /**
   * Valida se um tipo de EPI existe e está ativo
   */
  async validarTipoEpiAtivo(id: string): Promise<boolean> {
    try {
      const tipo = await this.obterTipoEpi(id);
      return tipo.status === "ATIVO";
    } catch {
      return false;
    }
  }

  /**
   * Limpa cache
   */
  limparCache(): void {
    this.selectOptionsCache = null;
    console.log("🗑️ TiposEpiAdapter: Cache limpo");
  }

  /**
   * Alias para compatibilidade com service index
   */
  clearCache(): void {
    this.limparCache();
  }

  /**
   * Obtém tipos de EPI mais utilizados (útil para sugestões)
   */
  async obterTiposPopulares(
    limite: number = 10,
  ): Promise<TipoEpiSelectOption[]> {
    console.log("🌟 TiposEpiAdapter: Carregando tipos populares");

    try {
      // Por enquanto, retornamos os primeiros resultados ordenados
      // No futuro, o backend pode implementar um ranking baseado em uso
      const response = await this.listarTiposEpi({
        limit: limite,
        // Temporarily disable status filter to debug backend compatibility
        // status: 'ATIVO'
      });

      const opcoes = response.data.map((tipo) => {
        // Backend returns camelCase fields (confirmed via API test)
        const nomeEquipamento =
          tipo.nomeEquipamento ||
          tipo.nome_equipamento ||
          (tipo as any).nome ||
          (tipo as any).name ||
          "Nome não identificado";

        const numeroCA =
          tipo.numeroCa || tipo.numero_ca || tipo.numeroCA || tipo.ca || "N/A";

        const categoria = tipo.categoria || tipo.category || "Sem categoria";

        return {
          value: tipo.id,
          label: `${nomeEquipamento} (CA: ${numeroCA})`,
          categoria: categoria,
          numeroCA: numeroCA,
          custoUnitario:
            tipo.custo_unitario || tipo.custoUnitario || tipo.preco || 0,
        };
      });

      console.log("✅ Tipos populares carregados:", opcoes.length);
      return opcoes;
    } catch (error: any) {
      console.error("❌ Erro ao carregar tipos populares:", error);
      return [];
    }
  }

  /**
   * Dados de fallback quando backend está indisponível
   */
  private getFallbackTiposEPI(): TipoEpi[] {
    return [
      {
        id: "fallback-1",
        nome_equipamento: "Capacete de Segurança (Demo)",
        numero_ca: "12345",
        categoria: "PROTECAO_CRANIO",
        custo_unitario: 35.5,
        status: "ATIVO",
        created_at: new Date().toISOString(),
      },
      {
        id: "fallback-2",
        nome_equipamento: "Óculos de Proteção (Demo)",
        numero_ca: "67890",
        categoria: "PROTECAO_OLHOS",
        custo_unitario: 28.9,
        status: "ATIVO",
        created_at: new Date().toISOString(),
      },
      {
        id: "fallback-3",
        nome_equipamento: "Luva de Segurança (Demo)",
        numero_ca: "54321",
        categoria: "PROTECAO_MAOS",
        custo_unitario: 15.75,
        status: "ATIVO",
        created_at: new Date().toISOString(),
      },
    ];
  }
}

// ==================== EXPORT ====================

export const tiposEpiAdapter = new TiposEpiAdapter();

/**
 * Estoque Itens Adapter - Backend Integration
 *
 * Adapter especializado para itens de estoque
 * Focado em saídas e transferências
 */

import { api } from "../core/apiClient";
import type { PaginatedResponse } from "$lib/stores/paginatedStore";

// ==================== INTERFACES ====================

export interface EstoqueItem {
  id: string;
  quantidade: number;
  status: "DISPONIVEL" | "BAIXO" | "AGUARDANDO_INSPECAO" | "ZERO" | "QUARENTENA";
  data_validade?: string;
  lote?: string;
  created_at: string;
  tipo_epi: {
    id: string;
    nome_equipamento: string;
    numero_ca: string;
    categoria: string;
    custo_unitario?: number;
  };
  almoxarifado: {
    id: string;
    nome: string;
    is_principal: boolean;
  };
}

export interface EstoqueItemOption {
  value: string;
  label: string;
  quantidade: number;
  equipamento: string;
  categoria: string;
  numeroCA: string;
  almoxarifado: string;
  almoxarifadoId: string;
  quantidadeMaxima: number;
  status: string;
  dataValidade?: string;
  lote?: string;
  // Propriedade faltante identificada nos erros TS
  quantidadeDisponivel: number;
}

// ==================== ADAPTER CLASS ====================

class EstoqueItensAdapter {
  private baseEndpoint = "/estoque/itens";

  /**
   * Lista itens de estoque com filtros
   */
  async listarItensEstoque(params?: {
    page?: number;
    limit?: number;
    search?: string;
    almoxarifado_id?: string;
    tipo_epi_id?: string;
    status?: "DISPONIVEL" | "BAIXO" | "AGUARDANDO_INSPECAO" | "ZERO" | "QUARENTENA" | "todos";
    categoria?: string;
  }): Promise<PaginatedResponse<EstoqueItem>> {
    console.log("📦 EstoqueItensAdapter: Listando itens de estoque", params);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.almoxarifado_id)
        queryParams.append("almoxarifado_id", params.almoxarifado_id);
      if (params?.tipo_epi_id)
        queryParams.append("tipo_epi_id", params.tipo_epi_id);
      if (params?.status && params.status !== "todos") {
        queryParams.append("status", params.status);
      }
      if (params?.categoria) queryParams.append("categoria", params.categoria);

      const url = `${this.baseEndpoint}?${queryParams.toString()}`;

      const response = await api.get<{
        success: boolean;
        data: {
          items: EstoqueItem[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
      }>(url);

      console.log("✅ Itens de estoque listados:", response.data.pagination);

      return {
        data: response.data.items,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        pageSize: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      };
    } catch (error: any) {
      console.error("❌ Erro ao listar itens de estoque:", error);
      throw new Error("Não foi possível carregar os itens de estoque");
    }
  }

  /**
   * Obtém itens disponíveis para saída de um almoxarifado específico
   * Focado em transferências e descartes
   */
  async obterItensDisponiveisParaSaida(
    almoxarifadoId: string,
  ): Promise<EstoqueItemOption[]> {
    console.log(
      "🚚 EstoqueItensAdapter: Buscando itens disponíveis para saída",
      almoxarifadoId,
    );

    try {
      const response = await this.listarItensEstoque({
        almoxarifado_id: almoxarifadoId,
        status: "DISPONIVEL",
        limit: 100, // Limite máximo permitido pela API
      });

      const itensDisponiveis = response.data
        .filter((item) => item.quantidade > 0) // Extra validação
        .map((item) => ({
          value: item.id,
          label: `${item.tipo_epi.nome_equipamento} - ${item.quantidade} disponível`,
          quantidade: item.quantidade,
          equipamento: item.tipo_epi.nome_equipamento,
          categoria: item.tipo_epi.categoria,
          numeroCA: item.tipo_epi.numero_ca,
          almoxarifado: item.almoxarifado.nome,
          almoxarifadoId: item.almoxarifado.id,
          quantidadeMaxima: item.quantidade,
          status: item.status,
          dataValidade: item.data_validade,
          lote: item.lote,
          quantidadeDisponivel: item.quantidade,
        }));

      // Ordenar por nome do equipamento
      itensDisponiveis.sort((a, b) =>
        a.equipamento.localeCompare(b.equipamento),
      );

      console.log("✅ Itens disponíveis para saída:", itensDisponiveis.length);
      return itensDisponiveis;
    } catch (error: any) {
      console.error("❌ Erro ao buscar itens disponíveis para saída:", error);
      return [];
    }
  }

  /**
   * Busca itens de estoque por termo de pesquisa
   */
  async buscarItensEstoque(
    termo: string,
    almoxarifadoId?: string,
  ): Promise<EstoqueItemOption[]> {
    console.log(
      "🔍 EstoqueItensAdapter: Buscando itens de estoque",
      termo,
      almoxarifadoId,
    );

    if (!termo || termo.length < 2) {
      return [];
    }

    try {
      const params = {
        search: termo,
        limit: 20,
        status: "DISPONIVEL",
        almoxarifado_id: almoxarifadoId,
      };

      const response = await this.listarItensEstoque(params);

      const opcoes = response.data.map((item) => ({
        value: item.id,
        label: `${item.tipo_epi.nome_equipamento} (${item.quantidade} disponível)`,
        quantidade: item.quantidade,
        equipamento: item.tipo_epi.nome_equipamento,
        categoria: item.tipo_epi.categoria,
        numeroCA: item.tipo_epi.numero_ca,
        almoxarifado: item.almoxarifado.nome,
        almoxarifadoId: item.almoxarifado.id,
        quantidadeMaxima: item.quantidade,
        status: item.status,
        dataValidade: item.data_validade,
        lote: item.lote,
        quantidadeDisponivel: item.quantidade,
      }));

      console.log("✅ Busca realizada, encontrados:", opcoes.length);
      return opcoes;
    } catch (error: any) {
      console.error("❌ Erro na busca de itens de estoque:", error);
      return [];
    }
  }

  /**
   * Obtém item específico por ID
   */
  async obterItemEstoque(id: string): Promise<EstoqueItem> {
    console.log("🔍 EstoqueItensAdapter: Buscando item de estoque", id);

    try {
      const response = await api.get<{
        success: boolean;
        data: EstoqueItem;
      }>(`${this.baseEndpoint}/${id}`);

      console.log(
        "✅ Item de estoque encontrado:",
        response.data.tipo_epi.nome_equipamento,
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Erro ao buscar item de estoque:", error);
      throw new Error("Não foi possível encontrar o item de estoque");
    }
  }

  /**
   * Valida se uma quantidade pode ser retirada de um item
   */
  async validarQuantidadeDisponivel(
    itemId: string,
    quantidadeDesejada: number,
  ): Promise<{
    valido: boolean;
    quantidadeDisponivel: number;
    motivo?: string;
  }> {
    console.log(
      "✅ EstoqueItensAdapter: Validando quantidade disponível",
      itemId,
      quantidadeDesejada,
    );

    try {
      const item = await this.obterItemEstoque(itemId);

      if (item.status !== "DISPONIVEL") {
        return {
          valido: false,
          quantidadeDisponivel: item.quantidade,
          motivo: `Item não está disponível (status: ${item.status})`,
        };
      }

      if (quantidadeDesejada > item.quantidade) {
        return {
          valido: false,
          quantidadeDisponivel: item.quantidade,
          motivo: `Quantidade desejada (${quantidadeDesejada}) é maior que a disponível (${item.quantidade})`,
        };
      }

      if (quantidadeDesejada <= 0) {
        return {
          valido: false,
          quantidadeDisponivel: item.quantidade,
          motivo: "Quantidade deve ser maior que zero",
        };
      }

      return {
        valido: true,
        quantidadeDisponivel: item.quantidade,
      };
    } catch (error: any) {
      console.error("❌ Erro ao validar quantidade disponível:", error);
      return {
        valido: false,
        quantidadeDisponivel: 0,
        motivo: "Erro ao validar item de estoque",
      };
    }
  }

  /**
   * Obtém itens agrupados por tipo de EPI
   */
  async obterItensAgrupadosPorTipo(almoxarifadoId?: string): Promise<{
    [tipoEpiId: string]: {
      tipo_epi: EstoqueItem["tipo_epi"];
      itens: EstoqueItem[];
      quantidade_total: number;
    };
  }> {
    console.log(
      "📊 EstoqueItensAdapter: Agrupando itens por tipo de EPI",
      almoxarifadoId,
    );

    try {
      const response = await this.listarItensEstoque({
        almoxarifado_id: almoxarifadoId,
        status: "DISPONIVEL",
        limit: 500,
      });

      const agrupados: {
        [tipoEpiId: string]: {
          tipo_epi: EstoqueItem["tipo_epi"];
          itens: EstoqueItem[];
          quantidade_total: number;
        };
      } = {};

      response.data.forEach((item) => {
        const tipoId = item.tipo_epi.id;

        if (!agrupados[tipoId]) {
          agrupados[tipoId] = {
            tipo_epi: item.tipo_epi,
            itens: [],
            quantidade_total: 0,
          };
        }

        agrupados[tipoId].itens.push(item);
        agrupados[tipoId].quantidade_total += item.quantidade;
      });

      console.log(
        "✅ Itens agrupados por tipo:",
        Object.keys(agrupados).length,
      );
      return agrupados;
    } catch (error: any) {
      console.error("❌ Erro ao agrupar itens por tipo:", error);
      return {};
    }
  }

  /**
   * Cache para itens disponíveis por almoxarifado
   */
  private itensDisponiveis: {
    [almoxarifadoId: string]: {
      data: EstoqueItemOption[];
      timestamp: number;
    };
  } = {};

  /**
   * Obtém itens disponíveis com cache (útil para modais que abrem/fecham frequentemente)
   */
  async obterItensDisponiveisComCache(
    almoxarifadoId: string,
  ): Promise<EstoqueItemOption[]> {
    const TTL = 2 * 60 * 1000; // 2 minutos (cache mais curto para dados de estoque)
    const now = Date.now();

    // Verificar cache
    const cached = this.itensDisponiveis[almoxarifadoId];
    if (cached && now - cached.timestamp < TTL) {
      console.log(
        "💾 EstoqueItensAdapter: Usando cache para itens disponíveis",
      );
      return cached.data;
    }

    // Cache expirado, buscar dados frescos
    const freshData = await this.obterItensDisponiveisParaSaida(almoxarifadoId);

    // Salvar no cache
    this.itensDisponiveis[almoxarifadoId] = {
      data: freshData,
      timestamp: now,
    };

    return freshData;
  }

  /**
   * Limpa cache de itens disponíveis
   */
  limparCache(almoxarifadoId?: string): void {
    if (almoxarifadoId) {
      delete this.itensDisponiveis[almoxarifadoId];
      console.log(
        "🗑️ EstoqueItensAdapter: Cache limpo para almoxarifado",
        almoxarifadoId,
      );
    } else {
      this.itensDisponiveis = {};
      console.log("🗑️ EstoqueItensAdapter: Cache completo limpo");
    }
  }

  /**
   * Alias para compatibilidade com service index
   */
  clearCache(): void {
    this.limparCache();
  }

  /**
   * Obtém itens com baixo estoque
   */
  async obterItensBaixoEstoque(
    almoxarifadoId?: string,
  ): Promise<EstoqueItemOption[]> {
    console.log("⚠️ EstoqueItensAdapter: Buscando itens com baixo estoque");

    try {
      const response = await this.listarItensEstoque({
        almoxarifado_id: almoxarifadoId,
        status: "BAIXO",
        limit: 100,
      });

      const opcoes = response.data.map((item) => ({
        value: item.id,
        label: `${item.tipo_epi.nome_equipamento} - ${item.quantidade} restante`,
        quantidade: item.quantidade,
        equipamento: item.tipo_epi.nome_equipamento,
        categoria: item.tipo_epi.categoria,
        numeroCA: item.tipo_epi.numero_ca,
        almoxarifado: item.almoxarifado.nome,
        almoxarifadoId: item.almoxarifado.id,
        quantidadeMaxima: item.quantidade,
        status: item.status,
        dataValidade: item.data_validade,
        lote: item.lote,
        quantidadeDisponivel: item.quantidade,
      }));

      console.log("✅ Itens com baixo estoque:", opcoes.length);
      return opcoes;
    } catch (error: any) {
      console.error("❌ Erro ao buscar itens com baixo estoque:", error);
      return [];
    }
  }

  /**
   * Verifica disponibilidade em tempo real (útil antes de confirmar transferência)
   */
  async verificarDisponibilidadeRealTime(
    verificacoes: {
      itemId: string;
      quantidade: number;
    }[],
  ): Promise<
    {
      itemId: string;
      disponivel: boolean;
      quantidadeAtual: number;
      motivo?: string;
    }[]
  > {
    console.log(
      "🔄 EstoqueItensAdapter: Verificando disponibilidade em tempo real",
    );

    const resultados = await Promise.all(
      verificacoes.map(async (verificacao) => {
        try {
          const validacao = await this.validarQuantidadeDisponivel(
            verificacao.itemId,
            verificacao.quantidade,
          );

          return {
            itemId: verificacao.itemId,
            disponivel: validacao.valido,
            quantidadeAtual: validacao.quantidadeDisponivel,
            motivo: validacao.motivo,
          };
        } catch (error: any) {
          return {
            itemId: verificacao.itemId,
            disponivel: false,
            quantidadeAtual: 0,
            motivo: "Erro ao verificar item",
          };
        }
      }),
    );

    console.log("✅ Verificação concluída:", resultados.length);
    return resultados;
  }
}

// ==================== EXPORT ====================

export const estoqueItensAdapter = new EstoqueItensAdapter();

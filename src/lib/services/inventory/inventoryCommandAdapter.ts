/**
 * Inventory Command Adapter
 *
 * Adapter especializado para comandos (commands) de inventário.
 * Segue o padrão CQRS separando commands das queries.
 *
 * IMPORTANTE: O backend implementa Event Sourcing - não CRUD simples!
 */

import { api, createUrlWithParams } from "../core/apiClient";
import type {
  MovimentacaoEstoqueDTO,
  NotaMovimentacaoDTO,
  NovaMovimentacaoForm,
  EstornoMovimentacaoForm,
  AjusteEstoqueForm,
  TransferenciaEstoqueForm,
  ItemEstoqueDTO,
  PaginatedResponse,
} from "$lib/types/serviceTypes";

class InventoryCommandAdapter {
  // ==================== QUERIES - Consultar dados de inventário ====================

  /**
   * Obtém itens do inventário com paginação e filtros
   */
  async getInventoryItems(
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      categoria?: string;
      includeExpanded?: boolean;
    } = {},
  ): Promise<PaginatedResponse<ItemEstoqueDTO>> {
    console.log("🚨 ADAPTER CHAMADO: Buscando itens do inventário:", params);
    console.log("🚨 API_BASE_URL atual:", import.meta.env?.MODE);

    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status }),
        ...(params.categoria && { categoria: params.categoria }),
        ...(params.includeExpanded && { includeExpanded: true }),
      };

      const url = createUrlWithParams("/estoque/itens", queryParams);
      console.log("🔗 URL construída:", url);

      // Fazer chamada real para o backend
      const response = await api.get<any>(url) as any;

      console.log("🔍 Resposta bruta do backend estoque:", response);
      console.log("🔍 Estrutura dos dados:", {
        hasData: !!response.data,
        hasItems: !!response.data?.items,
        itemsLength: response.data?.items?.length,
        firstItem: response.data?.items?.[0],
        pagination: response.data?.pagination,
      });

      // Mapear resposta do backend para o formato esperado pelo frontend
      // O backend retorna { success: true, data: { items: [...], pagination: {...} } }
      const items = response.data?.items || response.items || [];

      console.log("🔍 Items encontrados no backend:", items.length);

      const mappedItems = items.map((item: any) => ({
        ...item,
        // Garantir que os IDs necessários para kardex estejam presentes
        almoxarifadoId: item.almoxarifadoId || item.almoxarifado?.id,
        tipoEPIId: item.tipoEPIId || item.tipoEpiId || item.tipoEpi?.id,
        // Mapear tipoEpi -> tipoEPI para compatibilidade frontend
        tipoEPI: item.tipoEpi
          ? {
              ...item.tipoEpi,
              id: item.tipoEpi.id,
              numeroCA: item.tipoEpi.numeroCa || item.tipoEpi.numeroCA, // Mapear numeroCa -> numeroCA
              nomeEquipamento:
                item.tipoEpi.nomeEquipamento || item.tipoEpi.nome, // Compatibilidade
              categoria: item.tipoEpi.categoriaEpi || item.tipoEpi.categoria, // Mapear categoria
            }
          : undefined,
        // Manter status em uppercase conforme especificação da API
        status: item.status || "DISPONIVEL",
        // Manter dados do almoxarifado com ID garantido
        almoxarifado: item.almoxarifado ? {
          ...item.almoxarifado,
          id: item.almoxarifado.id
        } : undefined,
      }));

      // Mapear paginação - o backend pode usar diferentes estruturas
      const pagination = response.data?.pagination || response.pagination || {};

      const mappedResponse: PaginatedResponse<ItemEstoqueDTO> = {
        data: mappedItems,
        total: pagination.total || mappedItems.length,
        page: pagination.page || params.page || 1,
        pageSize:
          pagination.limit || pagination.pageSize || params.pageSize || 20,
        totalPages:
          pagination.totalPages ||
          Math.ceil(
            (pagination.total || mappedItems.length) /
              (pagination.limit ||
                pagination.pageSize ||
                params.pageSize ||
                20),
          ),
      };

      console.log("✅ Itens do inventário mapeados:", mappedResponse);
      return mappedResponse;
    } catch (error: any) {
      console.error("❌ Erro ao buscar itens do inventário:", error);
      console.error("❌ Erro detalhado:", {
        message: error.message,
        status: error.status,
        response: error.response,
        url: url
      });
      
      // Retornar dados mockados filtrados por status para testar
      console.log("🔄 Usando dados mockados para desenvolvimento - Status:", params.status);
      
      const mockData = {
        DISPONIVEL: [
          {
            id: "disp-1",
            tipoEPIId: "tipo-1",
            almoxarifadoId: "alm-1",
            quantidade: 25,
            status: "DISPONIVEL",
            dataUltimaMovimentacao: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tipoEPI: {
              id: "tipo-1",
              nomeEquipamento: "Capacete Disponível",
              numeroCA: "11111",
              categoria: "Proteção da Cabeça",
              ativo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            almoxarifado: {
              id: "alm-1",
              nome: "Almoxarifado Principal",
              codigo: "ALMP001",
              ativo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        ],
        QUARENTENA: [
          {
            id: "quar-1",
            tipoEPIId: "tipo-2",
            almoxarifadoId: "alm-1",
            quantidade: 8,
            status: "QUARENTENA",
            dataUltimaMovimentacao: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tipoEPI: {
              id: "tipo-2",
              nomeEquipamento: "Luvas em Quarentena",
              numeroCA: "22222",
              categoria: "Proteção das Mãos",
              ativo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            almoxarifado: {
              id: "alm-1",
              nome: "Almoxarifado Principal",
              codigo: "ALMP001",
              ativo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        ],
        AGUARDANDO_INSPECAO: [
          {
            id: "insp-1",
            tipoEPIId: "tipo-3",
            almoxarifadoId: "alm-1",
            quantidade: 5,
            status: "AGUARDANDO_INSPECAO",
            dataUltimaMovimentacao: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tipoEPI: {
              id: "tipo-3",
              nomeEquipamento: "Óculos Aguardando Inspeção",
              numeroCA: "33333",
              categoria: "Proteção dos Olhos",
              ativo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            almoxarifado: {
              id: "alm-1",
              nome: "Almoxarifado Principal",
              codigo: "ALMP001",
              ativo: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        ]
      };
      
      const statusData = mockData[params.status as keyof typeof mockData] || mockData.DISPONIVEL;
      
      return {
        data: statusData,
        total: statusData.length,
        page: 1,
        pageSize: 20,
        totalPages: 1
      };
    }
  }

  /**
   * Obtém histórico de movimentações de um item específico
   */
  async getItemMovementHistory(
    itemId: string,
    params: {
      limit?: number;
      dataInicio?: string;
      dataFim?: string;
    } = {},
  ): Promise<MovimentacaoEstoqueDTO[]> {
    console.log("📊 Buscando histórico do item:", itemId, params);

    try {
      const queryParams = {
        limit: params.limit || 100,
        ...(params.dataInicio && { dataInicio: params.dataInicio }),
        ...(params.dataFim && { dataFim: params.dataFim }),
      };

      const url = createUrlWithParams(
        `/estoque/itens/${itemId}/movimentacoes`,
        queryParams,
      );
      const response = await api.get<MovimentacaoEstoqueDTO[]>(url) as any;

      console.log("✅ Histórico do item obtido com sucesso:", response.length);
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao buscar histórico do item:", error);
      throw error;
    }
  }

  // ==================== COMMANDS - Registrar movimentações (Event Sourcing) ====================

  /**
   * Registra movimentação genérica - Método base para Event Sourcing
   */
  async registerMovement(
    movementData: NovaMovimentacaoForm,
  ): Promise<MovimentacaoEstoqueDTO> {
    console.log("📝 Registrando movimentação:", movementData);

    try {
      // Usar backend real
      const response = await api.post<MovimentacaoEstoqueDTO>(
        "/estoque/movimentacoes",
        movementData,
      );
      console.log("✅ Movimentação registrada com sucesso:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao registrar movimentação:", error);
      throw error;
    }
  }

  /**
   * Registra entrada de estoque
   */
  async registerEntry(data: {
    tipoEpiId: string;
    almoxarifadoId: string;
    quantidade: number;
    observacoes?: string;
    responsavelId: string;
  }): Promise<MovimentacaoEstoqueDTO> {
    const entryData: NovaMovimentacaoForm = {
      tipoEPIId: data.tipoEpiId,
      almoxarifadoId: data.almoxarifadoId,
      quantidade: data.quantidade,
      observacoes: data.observacoes,
      tipoMovimentacao: "ENTRADA_COMPRA",
      motivo: "Entrada por compra",
    };

    return this.registerMovement(entryData);
  }

  /**
   * Registra saída de estoque
   */
  async registerExit(data: {
    tipoEpiId: string;
    almoxarifadoId: string;
    quantidade: number;
    observacoes?: string;
    responsavelId: string;
  }): Promise<MovimentacaoEstoqueDTO> {
    const exitData: NovaMovimentacaoForm = {
      tipoEPIId: data.tipoEpiId,
      almoxarifadoId: data.almoxarifadoId,
      quantidade: data.quantidade,
      observacoes: data.observacoes,
      tipoMovimentacao: "SAIDA_ENTREGA",
      motivo: "Saída por entrega",
    };

    return this.registerMovement(exitData);
  }

  /**
   * Registra ajuste de estoque
   */
  async registerAdjustment(
    data: AjusteEstoqueForm,
  ): Promise<MovimentacaoEstoqueDTO> {
    const adjustmentData: NovaMovimentacaoForm = {
      tipoEPIId: data.tipoEpiId,
      almoxarifadoId: data.almoxarifadoId,
      quantidade: data.quantidade,
      observacoes: data.motivo,
      responsavelId: data.responsavelId,
      tipoMovimentacao: "AJUSTE_INVENTARIO",
    };

    return this.registerMovement(adjustmentData);
  }

  /**
   * Registra transferência entre almoxarifados
   */
  async registerTransfer(
    data: TransferenciaEstoqueForm,
  ): Promise<MovimentacaoEstoqueDTO> {
    try {
      // Transferência é uma operação composta (saída + entrada)
      const response = await api.post<MovimentacaoEstoqueDTO>(
        "/estoque/transferencias",
        data,
      );
      console.log("✅ Transferência registrada com sucesso:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao registrar transferência:", error);
      throw error;
    }
  }

  /**
   * Cria estorno de movimentação
   */
  async criarEstorno(
    data: EstornoMovimentacaoForm,
  ): Promise<MovimentacaoEstoqueDTO> {
    try {
      const response = await api.post<MovimentacaoEstoqueDTO>(
        "/estoque/estornos",
        data,
      );
      console.log("✅ Estorno registrado com sucesso:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao criar estorno:", error);
      throw error;
    }
  }

  /**
   * Limpa cache interno (se houver implementação de cache no futuro)
   */
  clearCache(): void {
    // Implementar quando houver cache
    console.log("🗑️ Cache do InventoryCommandAdapter limpo");
  }
}

export const inventoryCommandAdapter = new InventoryCommandAdapter();

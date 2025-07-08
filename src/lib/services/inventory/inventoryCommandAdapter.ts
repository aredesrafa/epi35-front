/**
 * Inventory Command Adapter
 * 
 * Adapter especializado para comandos (commands) de inventário.
 * Segue o padrão CQRS separando commands das queries.
 * 
 * IMPORTANTE: O backend implementa Event Sourcing - não CRUD simples!
 */

import { api, createUrlWithParams } from '../core/apiClient';
import type { 
  MovimentacaoEstoqueDTO,
  NotaMovimentacaoDTO,
  NovaMovimentacaoForm,
  EstornoMovimentacaoForm,
  AjusteEstoqueForm,
  TransferenciaEstoqueForm,
  ItemEstoqueDTO,
  PaginatedResponse
} from '$lib/types/serviceTypes';

class InventoryCommandAdapter {
  
  // ==================== QUERIES - Consultar dados de inventário ====================
  
  /**
   * Obtém itens do inventário com paginação e filtros
   */
  async getInventoryItems(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    categoria?: string;
    includeExpanded?: boolean;
  } = {}): Promise<PaginatedResponse<ItemEstoqueDTO>> {
    console.log('🚨 ADAPTER CHAMADO: Buscando itens do inventário:', params);
    console.log('🚨 API_BASE_URL atual:', import.meta.env?.MODE);
    
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        ...(params.search && { search: params.search }),
        ...(params.status && { status: params.status }),
        ...(params.categoria && { categoria: params.categoria }),
        ...(params.includeExpanded && { includeExpanded: true })
      };
      
      const url = createUrlWithParams('/estoque/itens', queryParams);
      console.log('🔗 URL construída:', url);
      
      // TESTE: Usar dados temporários para verificar se o problema está na API ou na UI
      console.log('🧪 TESTE: Usando dados mock temporários');
      const mockResponse = {
        data: {
          items: [
            {
              id: "test-1",
              almoxarifadoId: "alm-1", 
              tipoEpiId: "epi-1",
              quantidade: 10,
              status: "DISPONIVEL",
              createdAt: "2025-01-07T10:00:00Z",
              tipoEpi: {
                id: "epi-1",
                nomeEquipamento: "Capacete de Teste",
                numeroCa: "CA-99999",
                categoriaEpi: "PROTECAO_CABECA"
              },
              almoxarifado: {
                id: "alm-1",
                nome: "Almoxarifado Teste"
              }
            },
            {
              id: "test-2", 
              almoxarifadoId: "alm-1",
              tipoEpiId: "epi-2",
              quantidade: 25,
              status: "DISPONIVEL", 
              createdAt: "2025-01-07T10:00:00Z",
              tipoEpi: {
                id: "epi-2",
                nomeEquipamento: "Luvas de Teste",
                numeroCa: "CA-88888",
                categoriaEpi: "PROTECAO_MAOS"
              },
              almoxarifado: {
                id: "alm-1",
                nome: "Almoxarifado Teste"
              }
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        }
      };
      
      // Comentar a chamada real temporariamente
      // const response = await api.get<any>(url);
      const response = mockResponse;
      
      console.log('🔍 Resposta bruta do backend estoque:', response);
      console.log('🔍 Estrutura dos dados:', {
        hasData: !!response.data,
        hasItems: !!response.data?.items,
        itemsLength: response.data?.items?.length,
        firstItem: response.data?.items?.[0],
        pagination: response.data?.pagination
      });
      
      // Mapear resposta do backend para o formato esperado pelo frontend
      const mappedItems = (response.data?.items || []).map((item: any) => ({
        ...item,
        // Mapear tipoEpi -> tipoEPI para compatibilidade frontend
        tipoEPI: item.tipoEpi ? {
          ...item.tipoEpi,
          numeroCA: item.tipoEpi.numeroCa, // Mapear numeroCa -> numeroCA
          nomeEquipamento: item.tipoEpi.nomeEquipamento || item.tipoEpi.nome // Compatibilidade
        } : undefined,
        // Manter status do backend como está
        status: item.status || 'DISPONIVEL'
      }));
      
      const mappedResponse: PaginatedResponse<ItemEstoqueDTO> = {
        data: mappedItems,
        total: response.data?.pagination?.total || 0,
        page: response.data?.pagination?.page || 1,
        pageSize: response.data?.pagination?.limit || 20,
        totalPages: response.data?.pagination?.totalPages || 1
      };
      
      console.log('✅ Itens do inventário mapeados:', mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error('❌ Erro ao buscar itens do inventário:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de movimentações de um item específico
   */
  async getItemMovementHistory(itemId: string, params: {
    limit?: number;
    dataInicio?: string;
    dataFim?: string;
  } = {}): Promise<MovimentacaoEstoqueDTO[]> {
    console.log('📊 Buscando histórico do item:', itemId, params);
    
    try {
      const queryParams = {
        limit: params.limit || 100,
        ...(params.dataInicio && { dataInicio: params.dataInicio }),
        ...(params.dataFim && { dataFim: params.dataFim })
      };
      
      const url = createUrlWithParams(`/estoque/itens/${itemId}/movimentacoes`, queryParams);
      const response = await api.get<MovimentacaoEstoqueDTO[]>(url);
      
      console.log('✅ Histórico do item obtido com sucesso:', response.length);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico do item:', error);
      throw error;
    }
  }
  
  // ==================== COMMANDS - Registrar movimentações (Event Sourcing) ====================
  
  /**
   * Registra movimentação genérica - Método base para Event Sourcing
   */
  async registerMovement(movementData: NovaMovimentacaoForm): Promise<MovimentacaoEstoqueDTO> {
    console.log('📝 Registrando movimentação:', movementData);
    
    try {
      // Usar backend real
      const response = await api.post<MovimentacaoEstoqueDTO>('/estoque/movimentacoes', movementData);
      console.log('✅ Movimentação registrada com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao registrar movimentação:', error);
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
      ...data,
      tipoMovimentacao: 'ENTRADA_COMPRA'
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
      ...data,
      tipoMovimentacao: 'SAIDA_ENTREGA'
    };
    
    return this.registerMovement(exitData);
  }

  /**
   * Registra ajuste de estoque
   */
  async registerAdjustment(data: AjusteEstoqueForm): Promise<MovimentacaoEstoqueDTO> {
    const adjustmentData: NovaMovimentacaoForm = {
      tipoEpiId: data.tipoEpiId,
      almoxarifadoId: data.almoxarifadoId,
      quantidade: data.quantidade,
      observacoes: data.motivo,
      responsavelId: data.responsavelId,
      tipoMovimentacao: 'AJUSTE_INVENTARIO'
    };
    
    return this.registerMovement(adjustmentData);
  }

  /**
   * Registra transferência entre almoxarifados
   */
  async registerTransfer(data: TransferenciaEstoqueForm): Promise<MovimentacaoEstoqueDTO> {
    try {
      // Transferência é uma operação composta (saída + entrada)
      const response = await api.post<MovimentacaoEstoqueDTO>('/estoque/transferencias', data);
      console.log('✅ Transferência registrada com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao registrar transferência:', error);
      throw error;
    }
  }

  /**
   * Cria estorno de movimentação
   */
  async criarEstorno(data: EstornoMovimentacaoForm): Promise<MovimentacaoEstoqueDTO> {
    try {
      const response = await api.post<MovimentacaoEstoqueDTO>('/estoque/estornos', data);
      console.log('✅ Estorno registrado com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao criar estorno:', error);
      throw error;
    }
  }

  /**
   * Limpa cache interno (se houver implementação de cache no futuro)
   */
  clearCache(): void {
    // Implementar quando houver cache
    console.log('🗑️ Cache do InventoryCommandAdapter limpo');
  }
}

export const inventoryCommandAdapter = new InventoryCommandAdapter();
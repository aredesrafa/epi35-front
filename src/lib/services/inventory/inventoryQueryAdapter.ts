/**
 * Inventory Query Adapter
 *
 * Adapter especializado para consultas (queries) de inventário.
 * Segue o padrão CQRS separando queries dos commands.
 */

import { api, createUrlWithParams } from "../core/apiClient";
import type {
  InventoryItemDTO,
  PaginatedResponse,
  MovementHistoryDTO,
  ConsolidatedStockDTO,
} from "$lib/types/serviceTypes";

export class InventoryQueryAdapter {
  private api = api;

  /**
   * Busca itens de inventário com paginação e filtros
   */
  async getInventoryItems(params?: {
    page?: number;
    limit?: number;
    almoxarifadoId?: string;
    tipoEpiId?: string;
    status?: string;
  }): Promise<PaginatedResponse<InventoryItemDTO>> {
    const url = createUrlWithParams("/estoque/itens", params || {});
    return this.api.get<PaginatedResponse<InventoryItemDTO>>(url);
  }

  /**
   * Busca item de inventário por ID
   */
  async getItemById(id: string): Promise<InventoryItemDTO> {
    return this.api.get<InventoryItemDTO>(`/estoque/itens/${id}`);
  }

  /**
   * Busca histórico de movimentações
   */
  async getMovementHistory(params?: {
    itemId?: string;
    almoxarifadoId?: string;
    tipoEpiId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<MovementHistoryDTO>> {
    const url = createUrlWithParams("/estoque/movimentacoes", params || {});
    return this.api.get<PaginatedResponse<MovementHistoryDTO>>(url);
  }

  /**
   * Busca estoque consolidado por almoxarifado e tipo de EPI
   */
  async getConsolidatedStock(params?: {
    almoxarifadoId?: string;
    tipoEpiId?: string;
  }): Promise<ConsolidatedStockDTO[]> {
    const url = createUrlWithParams("/estoque/consolidado", params || {});
    return this.api.get<ConsolidatedStockDTO[]>(url);
  }

  /**
   * Busca itens com estoque baixo
   */
  async getLowStockItems(params?: {
    threshold?: number;
    almoxarifadoId?: string;
  }): Promise<InventoryItemDTO[]> {
    const url = createUrlWithParams("/estoque/baixo", params || {});
    return this.api.get<InventoryItemDTO[]>(url);
  }

  /**
   * Busca itens próximos do vencimento
   */
  async getExpiringItems(params?: {
    diasAntecedencia?: number;
    almoxarifadoId?: string;
  }): Promise<InventoryItemDTO[]> {
    const url = createUrlWithParams("/estoque/vencendo", params || {});
    return this.api.get<InventoryItemDTO[]>(url);
  }

  /**
   * Limpa cache interno (se houver implementação de cache no futuro)
   */
  clearCache(): void {
    // Implementar quando houver cache
    console.log("🗑️ Cache do InventoryQueryAdapter limpo");
  }
}

export const inventoryQueryAdapter = new InventoryQueryAdapter();

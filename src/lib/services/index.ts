/**
 * Service Adapters Index
 *
 * Exporta todos os service adapters especializados para uso em componentes.
 * Cada adapter implementa uma responsabilidade específica do domínio.
 */

// Core services
export {
  api,
  apiClient,
  ApiError,
  createUrlWithParams,
  errorUtils,
} from "./core/apiClient";
export {
  configurationService,
  type BusinessConfiguration,
  type BusinessConfigurationItem,
} from "./core/configurationService";

// Entity Management Adapter - Para entidades com hierarquia
export { entityManagementAdapter } from "./entity/entityManagementAdapter";
import { entityManagementAdapter } from "./entity/entityManagementAdapter";

// Inventory Adapters - Separação CQRS
export { inventoryQueryAdapter } from "./inventory/inventoryQueryAdapter";
export { inventoryCommandAdapter } from "./inventory/inventoryCommandAdapter";
import { inventoryQueryAdapter } from "./inventory/inventoryQueryAdapter";
import { inventoryCommandAdapter } from "./inventory/inventoryCommandAdapter";
export { estoqueConfigAdapter } from "./inventory/estoqueConfigAdapter";

// Process Lifecycle Adapter - Para workflows complexos
export { processLifecycleAdapter } from "./process/processLifecycleAdapter";
import { processLifecycleAdapter } from "./process/processLifecycleAdapter";

// 🚀 NOVOS: Process adapters especializados (substituindo fichaProcessAdapter)
export * from "./process";

// Notas Movimentacao Adapter - Para notas de movimentação
export { notasMovimentacaoAdapter } from "./process/notasMovimentacaoAdapter";

// Reporting Query Adapter - Para consultas especializadas
export { reportingQueryAdapter } from "./reporting/reportingQueryAdapter";
import { reportingQueryAdapter } from "./reporting/reportingQueryAdapter";

// Nuevos adapters para notas
export { almoxarifadosAdapter } from "./entity/almoxarifadosAdapter";
export { tiposEpiAdapter } from "./entity/tiposEpiAdapter";
export { estoqueItensAdapter } from "./entity/estoqueItensAdapter";

// Imports para uso em getServiceAdapters
import { almoxarifadosAdapter } from "./entity/almoxarifadosAdapter";
import { tiposEpiAdapter } from "./entity/tiposEpiAdapter";
import { estoqueItensAdapter } from "./entity/estoqueItensAdapter";
import { notasMovimentacaoAdapter } from "./process/notasMovimentacaoAdapter";

// Business Configuration Stores
export {
  businessConfigStore,
  tiposMovimentacaoStore,
  categoriasEPIStore,
  statusEntregaStore,
  statusFichaStore,
  statusEstoqueStore,
  tiposNotaStore,
  configReadyStore,
  tiposMovimentacaoOptions,
  categoriasEPIOptions,
  statusEntregaOptions,
  statusEstoqueOptions,
  initializeBusinessConfig,
  configToOptions,
} from "../stores/businessConfigStore";

// Helper functions para facilitar importações
export function getServiceAdapters() {
  return {
    entity: entityManagementAdapter,
    inventoryQuery: inventoryQueryAdapter,
    inventoryCommand: inventoryCommandAdapter,
    process: processLifecycleAdapter,
    // ficha: fichaProcessAdapter, // ✅ REMOVIDO: Usar novos adapters especializados
    reporting: reportingQueryAdapter,
    // Novos adapters para notas
    notas: notasMovimentacaoAdapter,
    almoxarifados: almoxarifadosAdapter,
    tiposEpi: tiposEpiAdapter,
    estoqueItens: estoqueItensAdapter,
  };
}

// Types
export type * from "../types/serviceTypes";

/**
 * Inicializa todos os services
 * Pode ser chamado no +layout.svelte para setup inicial
 */
export async function initializeServices(): Promise<void> {
  console.log("🚀 Inicializando service adapters...");

  try {
    // Configurações de negócio já são carregadas pelo businessConfigStore
    // Aqui podemos fazer outras inicializações se necessário

    console.log("✅ Service adapters inicializados com sucesso");
  } catch (error: any) {
    console.error("❌ Erro ao inicializar service adapters:", error);
  }
}

/**
 * Limpa cache de todos os services
 */
export function clearAllServiceCaches(): void {
  try {
    entityManagementAdapter.clearCache();
    inventoryQueryAdapter.clearCache();
    inventoryCommandAdapter.clearCache();
    reportingQueryAdapter.clearCache();

    // Novos adapters para notas
    almoxarifadosAdapter.clearCache();
    tiposEpiAdapter.clearCache();
    estoqueItensAdapter.clearCache();
    // notasMovimentacaoAdapter não tem cache (adapter de processo)

    console.log("🗑️ Cache de todos os services limpo");
  } catch (error: any) {
    console.warn("⚠️ Erro ao limpar cache dos services:", error);
  }
}

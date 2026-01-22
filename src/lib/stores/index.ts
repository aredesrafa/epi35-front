// Re-export all stores for easy importing

// Theme store
export { themeStore } from "./themeStore";

// Business configuration store
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
  getConfigByCode,
  configToOptions,
} from "./businessConfigStore";

// API-related stores
export {
  createApiStore,
  createCachedApiStore,
  globalLoading,
  notifications,
  notify,
} from "./apiStore";

// Filter stores
export {
  createFiltersStore,
  createCustomFilters,
  epiFilters,
  estoqueFilters,
  fichasFilters,
  type EPIFilters,
  type EstoqueFilters,
  type FichasFilters,
} from "./filtersStore";

// Entity stores
export {
  tiposEPIStore,
  estoqueStore,
  fichasStore,
  colaboradoresStore,
  empresasStore,
  entregasStore,
  notificacoesStore,
  // Derived stores
  estoqueDisponivel,
  estoqueComBaixoEstoque,
  fichasVencidas,
  colaboradoresAtivos,
  notificacoesNaoLidas,
  countNotificacoesNaoLidas,
  dashboardStats,
} from "./entitiesStore";

// Modal stores
export {
  createModalStore,
  epiModal,
  colaboradorModal,
  fichaModal,
  entregaModal,
  estoqueModal,
  movimentacaoModal,
  assinaturaModal,
  devolucaoModal,
  confirmationModal,
  confirmActions,
  modalLoading,
  withModalLoading,
} from "./modalStore";

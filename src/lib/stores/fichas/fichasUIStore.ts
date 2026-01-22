/**
 * Fichas UI Store - Estado da Interface
 * Responsabilidade: Gerenciar estado da interface (modais, drawers, seleções)
 */

import { writable, derived } from 'svelte/store';

// ==================== INTERFACES ====================

interface UIState {
  // Seleção
  selectedFichaId: string | null;
  selectedFichaIds: string[];
  
  // Modais
  showNovaFichaModal: boolean;
  showDeleteConfirmModal: boolean;
  
  // Drawers
  showDetail: boolean;
  showFilters: boolean;
  
  // Table
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  
  // Layout
  tableView: 'grid' | 'list';
  density: 'comfortable' | 'compact';
  
  // Loading states
  bulkActionLoading: boolean;
  exportLoading: boolean;
}

interface UIActions {
  // Seleção
  selectFicha: (fichaId: string) => void;
  selectMultipleFichas: (fichaIds: string[]) => void;
  toggleFichaSelection: (fichaId: string) => void;
  clearSelection: () => void;
  selectAll: (fichaIds: string[]) => void;
  
  // Modais
  openNovaFichaModal: () => void;
  closeNovaFichaModal: () => void;
  openDeleteConfirmModal: () => void;
  closeDeleteConfirmModal: () => void;
  
  // Drawers
  openDetail: (fichaId?: string) => void;
  closeDetail: () => void;
  toggleFilters: () => void;
  
  // Table
  setSorting: (sortBy: string, direction?: 'asc' | 'desc') => void;
  toggleSortDirection: () => void;
  
  // Layout
  setTableView: (view: 'grid' | 'list') => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
  
  // Loading
  setBulkActionLoading: (loading: boolean) => void;
  setExportLoading: (loading: boolean) => void;
  
  // Reset
  resetUI: () => void;
}

// ==================== INITIAL STATE ====================

const initialState: UIState = {
  selectedFichaId: null,
  selectedFichaIds: [],
  showNovaFichaModal: false,
  showDeleteConfirmModal: false,
  showDetail: false,
  showFilters: false,
  sortBy: 'nome',
  sortDirection: 'asc',
  tableView: 'list',
  density: 'comfortable',
  bulkActionLoading: false,
  exportLoading: false
};

// ==================== STORE IMPLEMENTATION ====================

function createFichasUIStore() {
  const { subscribe, set, update } = writable<UIState>(initialState);

  const actions: UIActions = {
    // ===== SELEÇÃO =====
    selectFicha(fichaId: string) {
      update(state => ({
        ...state,
        selectedFichaId: fichaId,
        selectedFichaIds: [fichaId]
      }));
    },

    selectMultipleFichas(fichaIds: string[]) {
      update(state => ({
        ...state,
        selectedFichaId: fichaIds[0] || null,
        selectedFichaIds: fichaIds
      }));
    },

    toggleFichaSelection(fichaId: string) {
      update(state => {
        const isSelected = state.selectedFichaIds.includes(fichaId);
        const newSelectedIds = isSelected
          ? state.selectedFichaIds.filter(id => id !== fichaId)
          : [...state.selectedFichaIds, fichaId];

        return {
          ...state,
          selectedFichaId: newSelectedIds[0] || null,
          selectedFichaIds: newSelectedIds
        };
      });
    },

    clearSelection() {
      update(state => ({
        ...state,
        selectedFichaId: null,
        selectedFichaIds: []
      }));
    },

    selectAll(fichaIds: string[]) {
      update(state => ({
        ...state,
        selectedFichaId: fichaIds[0] || null,
        selectedFichaIds: fichaIds
      }));
    },

    // ===== MODAIS =====
    openNovaFichaModal() {
      update(state => ({ ...state, showNovaFichaModal: true }));
    },

    closeNovaFichaModal() {
      update(state => ({ ...state, showNovaFichaModal: false }));
    },

    openDeleteConfirmModal() {
      update(state => ({ ...state, showDeleteConfirmModal: true }));
    },

    closeDeleteConfirmModal() {
      update(state => ({ ...state, showDeleteConfirmModal: false }));
    },

    // ===== DRAWERS =====
    openDetail(fichaId?: string) {
      update(state => ({
        ...state,
        showDetail: true,
        selectedFichaId: fichaId || state.selectedFichaId
      }));
    },

    closeDetail() {
      update(state => ({ ...state, showDetail: false }));
    },

    toggleFilters() {
      update(state => ({ ...state, showFilters: !state.showFilters }));
    },

    // ===== TABLE =====
    setSorting(sortBy: string, direction: 'asc' | 'desc' = 'asc') {
      update(state => ({ ...state, sortBy, sortDirection: direction }));
    },

    toggleSortDirection() {
      update(state => ({
        ...state,
        sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc'
      }));
    },

    // ===== LAYOUT =====
    setTableView(tableView: 'grid' | 'list') {
      update(state => ({ ...state, tableView }));
    },

    setDensity(density: 'comfortable' | 'compact') {
      update(state => ({ ...state, density }));
    },

    // ===== LOADING =====
    setBulkActionLoading(bulkActionLoading: boolean) {
      update(state => ({ ...state, bulkActionLoading }));
    },

    setExportLoading(exportLoading: boolean) {
      update(state => ({ ...state, exportLoading }));
    },

    // ===== RESET =====
    resetUI() {
      set(initialState);
    }
  };

  return {
    subscribe,
    ...actions
  };
}

// ==================== DERIVED STORES ====================

export const fichasUIStore = createFichasUIStore();

// Store derivado para verificar se há seleção
export const hasSelection = derived(
  fichasUIStore,
  $ui => $ui.selectedFichaIds.length > 0
);

// Store derivado para verificar se há seleção múltipla
export const hasMultipleSelection = derived(
  fichasUIStore,
  $ui => $ui.selectedFichaIds.length > 1
);

// Store derivado para contar itens selecionados
export const selectedCount = derived(
  fichasUIStore,
  $ui => $ui.selectedFichaIds.length
);

// Store derivado para verificar se algum modal está aberto
export const hasOpenModal = derived(
  fichasUIStore,
  $ui => $ui.showNovaFichaModal || $ui.showDeleteConfirmModal
);

// Store derivado para verificar se algum drawer está aberto
export const hasOpenDrawer = derived(
  fichasUIStore,
  $ui => $ui.showDetail || $ui.showFilters
);

// Store derivado para verificar se algum loading está ativo
export const hasActiveLoading = derived(
  fichasUIStore,
  $ui => $ui.bulkActionLoading || $ui.exportLoading
);
/**
 * Fichas Filters Store - Estado dos Filtros
 * Responsabilidade: Gerenciar estado dos filtros de fichas
 */

import { writable, derived } from 'svelte/store';
import type { FichaQueryParams } from '$lib/services/process/queries/types';

// ==================== INTERFACES ====================

interface FiltersState {
  search: string;
  empresaId: string;
  empresa: string;
  cargo: string;
  status: string;
  devolucaoPendente: boolean | null;
}

interface FiltersActions {
  setSearch: (search: string) => void;
  setEmpresa: (empresaId: string, empresaNome?: string) => void;
  setCargo: (cargo: string) => void;
  setStatus: (status: string) => void;
  setDevolucaoPendente: (pendente: boolean | null) => void;
  updateFilters: (filters: Partial<FiltersState>) => void;
  clear: () => void;
  reset: () => void;
}

// ==================== INITIAL STATE ====================

const initialState: FiltersState = {
  search: '',
  empresaId: '',
  empresa: '',
  cargo: '',
  status: '',
  devolucaoPendente: null
};

// ==================== STORE IMPLEMENTATION ====================

function createFichasFiltersStore() {
  const { subscribe, set, update } = writable<FiltersState>(initialState);

  const actions: FiltersActions = {
    setSearch(search: string) {
      update(state => ({ ...state, search }));
    },

    setEmpresa(empresaId: string, empresaNome = '') {
      update(state => ({ 
        ...state, 
        empresaId, 
        empresa: empresaNome 
      }));
    },

    setCargo(cargo: string) {
      update(state => ({ ...state, cargo }));
    },

    setStatus(status: string) {
      update(state => ({ ...state, status }));
    },

    setDevolucaoPendente(devolucaoPendente: boolean | null) {
      update(state => ({ ...state, devolucaoPendente }));
    },

    updateFilters(filters: Partial<FiltersState>) {
      update(state => ({ ...state, ...filters }));
    },

    clear() {
      set(initialState);
    },

    reset() {
      set(initialState);
    }
  };

  return {
    subscribe,
    ...actions
  };
}

// ==================== DERIVED STORES ====================

export const fichasFiltersStore = createFichasFiltersStore();

// Store derivado que converte filtros para FichaQueryParams
export const fichasQueryParams = derived(
  fichasFiltersStore,
  $filters => {
    const params: FichaQueryParams = {};

    if ($filters.search.trim()) {
      params.search = $filters.search.trim();
    }

    if ($filters.empresaId) {
      params.empresaId = $filters.empresaId;
    }

    if ($filters.empresa.trim()) {
      params.empresa = $filters.empresa.trim();
    }

    if ($filters.cargo.trim()) {
      params.cargo = $filters.cargo.trim();
    }

    if ($filters.status) {
      params.status = $filters.status;
    }

    if ($filters.devolucaoPendente !== null) {
      params.devolucaoPendente = $filters.devolucaoPendente;
    }

    return params;
  }
);

// Store derivado que indica se há filtros ativos
export const hasActiveFilters = derived(
  fichasFiltersStore,
  $filters => {
    return (
      $filters.search.trim() !== '' ||
      $filters.empresaId !== '' ||
      $filters.empresa.trim() !== '' ||
      $filters.cargo.trim() !== '' ||
      $filters.status !== '' ||
      $filters.devolucaoPendente !== null
    );
  }
);

// Store derivado que conta quantos filtros estão ativos
export const activeFiltersCount = derived(
  fichasFiltersStore,
  $filters => {
    let count = 0;
    
    if ($filters.search.trim()) count++;
    if ($filters.empresaId) count++;
    if ($filters.empresa.trim()) count++;
    if ($filters.cargo.trim()) count++;
    if ($filters.status) count++;
    if ($filters.devolucaoPendente !== null) count++;
    
    return count;
  }
);

// Store derivado para exibir resumo dos filtros ativos
export const filtersDisplay = derived(
  fichasFiltersStore,
  $filters => {
    const active: string[] = [];
    
    if ($filters.search.trim()) {
      active.push(`Busca: "${$filters.search}"`);
    }
    
    if ($filters.empresa.trim()) {
      active.push(`Empresa: ${$filters.empresa}`);
    }
    
    if ($filters.cargo.trim()) {
      active.push(`Cargo: ${$filters.cargo}`);
    }
    
    if ($filters.status) {
      active.push(`Status: ${$filters.status}`);
    }
    
    if ($filters.devolucaoPendente === true) {
      active.push('Devolução Pendente');
    }
    
    return active;
  }
);
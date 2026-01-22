/**
 * Fichas Store - Estado Principal
 * Responsabilidade: Gerenciar estado das fichas e operações CRUD
 */

import { writable, derived } from 'svelte/store';
import { fichaQueryAdapter } from '$lib/services/process/queries';
import type { FichaBasica, FichaQueryParams } from '$lib/services/process/queries/types';

// ==================== INTERFACES ====================

interface PaginationState {
  page: number;
  total: number;
  pageSize: number;
  totalPages: number;
}

interface FichasState {
  items: FichaBasica[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  lastUpdated: string | null;
}

interface FichasActions {
  initialize: (pageSize?: number) => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  search: (searchTerm: string) => Promise<void>;
  applyFilters: (filters: FichaQueryParams) => Promise<void>;
  clear: () => void;
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
}

// ==================== STORE IMPLEMENTATION ====================

function createFichasStore() {
  const { subscribe, set, update } = writable<FichasState>({
    items: [],
    loading: false,
    error: null,
    pagination: { page: 1, total: 0, pageSize: 10, totalPages: 0 },
    lastUpdated: null
  });

  let currentFilters: FichaQueryParams = {};
  let autoRefreshInterval: number | null = null;

  const actions: FichasActions = {
    async initialize(pageSize = 10) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fichaQueryAdapter.getFichasList({
          page: 1,
          limit: pageSize
        });

        set({
          items: response.items,
          loading: false,
          error: null,
          pagination: {
            page: response.page,
            total: response.total,
            pageSize: response.pageSize,
            totalPages: response.totalPages
          },
          lastUpdated: new Date().toISOString()
        });

        currentFilters = { page: 1, limit: pageSize };
      } catch (error: any) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro ao carregar fichas'
        }));
      }
    },

    async loadPage(page: number) {
      if (page < 1) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fichaQueryAdapter.getFichasList({
          ...currentFilters,
          page
        });

        update(state => ({
          ...state,
          items: response.items,
          loading: false,
          pagination: {
            page: response.page,
            total: response.total,
            pageSize: response.pageSize,
            totalPages: response.totalPages
          },
          lastUpdated: new Date().toISOString()
        }));

        currentFilters.page = page;
      } catch (error: any) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro ao carregar página'
        }));
      }
    },

    async refresh() {
      const currentPage = currentFilters.page || 1;
      await actions.loadPage(currentPage);
    },

    async search(searchTerm: string) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        if (!searchTerm.trim()) {
          // Se busca vazia, volta para listagem normal
          await actions.initialize(currentFilters.limit);
          return;
        }

        const items = await fichaQueryAdapter.searchFichas(searchTerm);
        
        update(state => ({
          ...state,
          items,
          loading: false,
          pagination: {
            page: 1,
            total: items.length,
            pageSize: items.length,
            totalPages: 1
          },
          lastUpdated: new Date().toISOString()
        }));

        currentFilters = { search: searchTerm };
      } catch (error: any) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro na busca'
        }));
      }
    },

    async applyFilters(filters: FichaQueryParams) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fichaQueryAdapter.getFichasList({
          ...filters,
          page: 1 // Reset para primeira página ao aplicar filtros
        });

        update(state => ({
          ...state,
          items: response.items,
          loading: false,
          pagination: {
            page: response.page,
            total: response.total,
            pageSize: response.pageSize,
            totalPages: response.totalPages
          },
          lastUpdated: new Date().toISOString()
        }));

        currentFilters = { ...filters, page: 1 };
      } catch (error: any) {
        update(state => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro ao aplicar filtros'
        }));
      }
    },

    clear() {
      set({
        items: [],
        loading: false,
        error: null,
        pagination: { page: 1, total: 0, pageSize: 10, totalPages: 0 },
        lastUpdated: null
      });
      currentFilters = {};
    },

    startAutoRefresh(intervalMs = 30000) {
      actions.stopAutoRefresh(); // Para qualquer refresh anterior
      
      autoRefreshInterval = setInterval(() => {
        actions.refresh();
      }, intervalMs);
    },

    stopAutoRefresh() {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
      }
    }
  };

  return {
    subscribe,
    ...actions
  };
}

// ==================== DERIVED STORES ====================

export const fichasStore = createFichasStore();

// Store derivado para fichas ativas apenas
export const fichasAtivas = derived(
  fichasStore,
  $fichas => ({
    ...$fichas,
    items: $fichas.items.filter(ficha => ficha.status === 'ativa')
  })
);

// Store derivado para fichas com devolução pendente
export const fichasPendenteDevolucao = derived(
  fichasStore,
  $fichas => ({
    ...$fichas,
    items: $fichas.items.filter(ficha => ficha.status === 'pendente_devolucao')
  })
);

// Store derivado para estatísticas rápidas
export const fichasEstats = derived(
  fichasStore,
  $fichas => {
    const items = $fichas.items;
    return {
      total: items.length,
      ativas: items.filter(f => f.status === 'ativa').length,
      inativas: items.filter(f => f.status === 'inativa').length,
      pendenteDevolucao: items.filter(f => f.status === 'pendente_devolucao').length,
      vencidas: items.filter(f => f.status === 'vencida').length
    };
  }
);
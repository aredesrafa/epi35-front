/**
 * Fichas Config Store - Configurações e Opções
 * Responsabilidade: Gerenciar opções para filtros, configurações de exibição, etc.
 */

import { writable, derived } from 'svelte/store';
import { fichaResourceAdapter } from '$lib/services/process/queries';

// ==================== INTERFACES ====================

interface ConfigState {
  // Opções para filtros
  empresaOptions: Array<{ id: string; nome: string; label?: string }>;
  cargoOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: string; label: string; color: string }>;
  
  // Configurações de interface
  defaultPageSize: number;
  availablePageSizes: number[];
  autoRefreshInterval: number;
  autoRefreshEnabled: boolean;
  
  // Estado de carregamento das opções
  loadingEmpresas: boolean;
  loadingCargos: boolean;
  
  // Cache
  lastUpdated: {
    empresas: string | null;
    cargos: string | null;
  };
}

interface ConfigActions {
  // Carregar opções
  loadEmpresaOptions: () => Promise<void>;
  loadCargoOptions: () => Promise<void>;
  refreshAllOptions: () => Promise<void>;
  
  // Configurações
  setDefaultPageSize: (size: number) => void;
  setAutoRefreshInterval: (interval: number) => void;
  toggleAutoRefresh: () => void;
  
  // Cache
  clearCache: () => void;
  
  // Reset
  resetConfig: () => void;
}

// ==================== INITIAL STATE ====================

const statusOptionsDefault = [
  { value: '', label: 'Todos os Status', color: 'gray' },
  { value: 'ativa', label: 'Ativa', color: 'green' },
  { value: 'inativa', label: 'Inativa', color: 'gray' },
  { value: 'vencida', label: 'Vencida', color: 'red' },
  { value: 'pendente_devolucao', label: 'Pendente Devolução', color: 'yellow' }
];

const initialState: ConfigState = {
  empresaOptions: [],
  cargoOptions: [],
  statusOptions: statusOptionsDefault,
  defaultPageSize: 10,
  availablePageSizes: [5, 10, 20, 50, 100],
  autoRefreshInterval: 30000, // 30 segundos
  autoRefreshEnabled: false,
  loadingEmpresas: false,
  loadingCargos: false,
  lastUpdated: {
    empresas: null,
    cargos: null
  }
};

// ==================== STORE IMPLEMENTATION ====================

function createFichasConfigStore() {
  const { subscribe, set, update } = writable<ConfigState>(initialState);

  const actions: ConfigActions = {
    async loadEmpresaOptions() {
      update(state => ({ ...state, loadingEmpresas: true }));

      try {
        const empresas = await fichaResourceAdapter.getEmpresasOptions();
        
        const empresaOptions = [
          { id: '', nome: 'Todas as Empresas', label: 'Todas as Empresas' },
          ...empresas.map(empresa => ({
            id: empresa.id,
            nome: empresa.nome,
            label: empresa.nome
          }))
        ];

        update(state => ({
          ...state,
          empresaOptions,
          loadingEmpresas: false,
          lastUpdated: {
            ...state.lastUpdated,
            empresas: new Date().toISOString()
          }
        }));
      } catch (error: any) {
        console.error('Erro ao carregar empresas:', error);
        update(state => ({ ...state, loadingEmpresas: false }));
      }
    },

    async loadCargoOptions() {
      update(state => ({ ...state, loadingCargos: true }));

      try {
        const cargos = await fichaResourceAdapter.getCargosOptions();
        
        const cargoOptions = [
          { value: '', label: 'Todos os Cargos' },
          ...cargos.map(cargo => ({
            value: cargo,
            label: cargo
          }))
        ];

        update(state => ({
          ...state,
          cargoOptions,
          loadingCargos: false,
          lastUpdated: {
            ...state.lastUpdated,
            cargos: new Date().toISOString()
          }
        }));
      } catch (error: any) {
        console.error('Erro ao carregar cargos:', error);
        update(state => ({ ...state, loadingCargos: false }));
      }
    },

    async refreshAllOptions() {
      await Promise.all([
        actions.loadEmpresaOptions(),
        actions.loadCargoOptions()
      ]);
    },

    setDefaultPageSize(defaultPageSize: number) {
      if (defaultPageSize > 0) {
        update(state => ({ ...state, defaultPageSize }));
      }
    },

    setAutoRefreshInterval(autoRefreshInterval: number) {
      if (autoRefreshInterval >= 5000) { // Mínimo 5 segundos
        update(state => ({ ...state, autoRefreshInterval }));
      }
    },

    toggleAutoRefresh() {
      update(state => ({
        ...state,
        autoRefreshEnabled: !state.autoRefreshEnabled
      }));
    },

    clearCache() {
      update(state => ({
        ...state,
        empresaOptions: [],
        cargoOptions: [],
        lastUpdated: {
          empresas: null,
          cargos: null
        }
      }));
    },

    resetConfig() {
      set(initialState);
    }
  };

  return {
    subscribe,
    ...actions
  };
}

// ==================== DERIVED STORES ====================

export const fichasConfigStore = createFichasConfigStore();

// Store derivado para verificar se as opções estão carregadas
export const optionsLoaded = derived(
  fichasConfigStore,
  $config => ({
    empresas: $config.empresaOptions.length > 0,
    cargos: $config.cargoOptions.length > 0,
    all: $config.empresaOptions.length > 0 && $config.cargoOptions.length > 0
  })
);

// Store derivado para verificar se alguma opção está carregando
export const optionsLoading = derived(
  fichasConfigStore,
  $config => $config.loadingEmpresas || $config.loadingCargos
);

// Store derivado para cache status
export const cacheStatus = derived(
  fichasConfigStore,
  $config => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutos
    
    return {
      empresas: {
        hasCache: !!$config.lastUpdated.empresas,
        isStale: $config.lastUpdated.empresas 
          ? (now - new Date($config.lastUpdated.empresas).getTime()) > maxAge
          : true
      },
      cargos: {
        hasCache: !!$config.lastUpdated.cargos,
        isStale: $config.lastUpdated.cargos 
          ? (now - new Date($config.lastUpdated.cargos).getTime()) > maxAge
          : true
      }
    };
  }
);

// Store derivado para opções formatadas para dropdowns
export const dropdownOptions = derived(
  fichasConfigStore,
  $config => ({
    empresas: $config.empresaOptions,
    cargos: $config.cargoOptions,
    status: $config.statusOptions,
    pageSizes: $config.availablePageSizes.map(size => ({
      value: size,
      label: `${size} por página`
    }))
  })
);
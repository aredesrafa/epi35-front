/**
 * Business Configuration Store
 *
 * Store global reativo para configurações de negócio carregadas dinamicamente.
 * Gerencia o estado das configurações de ENUMs e regras de negócio.
 */

import { writable, derived, type Readable } from "svelte/store";
import { browser } from "$app/environment";
import {
  configurationService,
  type BusinessConfiguration,
  type BusinessConfigurationItem,
} from "$lib/services/core/configurationService";

interface BusinessConfigState {
  data: BusinessConfiguration | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: BusinessConfigState = {
  data: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

function createBusinessConfigStore() {
  const { subscribe, set, update } =
    writable<BusinessConfigState>(initialState);

  return {
    subscribe,

    /**
     * Inicializa as configurações carregando do backend
     * Deve ser chamado no +layout.svelte
     */
    async initialize(): Promise<void> {
      if (!browser) return;

      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const config = await configurationService.loadBusinessRules();

        set({
          data: config,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        });

        console.log("✅ Configurações de negócio carregadas com sucesso");
      } catch (error: any) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";

        update((state) => ({
          ...state,
          loading: false,
          error: `Erro ao carregar configurações: ${errorMessage}`,
        }));

        console.error("❌ Erro ao carregar configurações de negócio:", error);
      }
    },

    /**
     * Recarrega as configurações forçando uma nova requisição
     */
    async reload(): Promise<void> {
      configurationService.clearCache();
      await this.initialize();
    },

    /**
     * Limpa o store resetando para o estado inicial
     */
    reset(): void {
      set(initialState);
    },

    /**
     * Verifica se as configurações estão carregadas e válidas
     */
    isReady(): boolean {
      const currentState = { subscribe } as any;
      let isReady = false;

      subscribe((state) => {
        isReady = state.data !== null && !state.loading && !state.error;
      })();

      return isReady;
    },
  };
}

// Store principal
export const businessConfigStore = createBusinessConfigStore();

// Stores derivados para facilitar o acesso a categorias específicas
export const tiposMovimentacaoStore: Readable<BusinessConfigurationItem[]> =
  derived(
    businessConfigStore,
    ($config) => $config.data?.tiposMovimentacao || [],
  );

export const categoriasEPIStore: Readable<BusinessConfigurationItem[]> =
  derived(businessConfigStore, ($config) => $config.data?.categoriasEPI || []);

export const statusEntregaStore: Readable<BusinessConfigurationItem[]> =
  derived(businessConfigStore, ($config) => $config.data?.statusEntrega || []);

export const statusFichaStore: Readable<BusinessConfigurationItem[]> = derived(
  businessConfigStore,
  ($config) => $config.data?.statusFicha || [],
);

export const statusEstoqueStore: Readable<BusinessConfigurationItem[]> =
  derived(businessConfigStore, ($config) => $config.data?.statusEstoque || []);

export const tiposNotaStore: Readable<BusinessConfigurationItem[]> = derived(
  businessConfigStore,
  ($config) => $config.data?.tiposNota || [],
);

// Store derivado para verificar se está pronto
export const configReadyStore: Readable<boolean> = derived(
  businessConfigStore,
  ($config) => $config.data !== null && !$config.loading && !$config.error,
);

/**
 * Helper function para inicializar as configurações
 * Deve ser chamada no +layout.svelte do app
 */
export async function initializeBusinessConfig(): Promise<void> {
  await businessConfigStore.initialize();
}

/**
 * Helper functions para buscar configurações específicas de forma reativa
 */
export function getConfigByCode(
  store: Readable<BusinessConfigurationItem[]>,
  code: string,
): Readable<BusinessConfigurationItem | null> {
  return derived(
    store,
    (items) => items.find((item) => item.code === code) || null,
  );
}

/**
 * Helper function para converter array de configuração em options para dropdowns
 */
export function configToOptions(
  items: BusinessConfigurationItem[],
  addEmptyOption = true,
): Array<{ value: string; label: string }> {
  const options = items.map((item) => ({
    value: item.code,
    label: item.label,
  }));

  if (addEmptyOption) {
    return [{ value: "", label: "Selecionar..." }, ...options];
  }

  return options;
}

/**
 * Store derivado para opções de dropdown
 */
export const tiposMovimentacaoOptions: Readable<
  Array<{ value: string; label: string }>
> = derived(tiposMovimentacaoStore, (items) => configToOptions(items));

export const categoriasEPIOptions: Readable<
  Array<{ value: string; label: string }>
> = derived(categoriasEPIStore, (items) => configToOptions(items));

export const statusEntregaOptions: Readable<
  Array<{ value: string; label: string }>
> = derived(statusEntregaStore, (items) => configToOptions(items));

export const statusEstoqueOptions: Readable<
  Array<{ value: string; label: string }>
> = derived(statusEstoqueStore, (items) => configToOptions(items));

// Export default para facilitar importação
export default businessConfigStore;

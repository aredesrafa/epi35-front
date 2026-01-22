/**
 * Configuration Store Dinâmico
 *
 * Store reativo que carrega configurações do backend e as disponibiliza
 * globalmente para toda a aplicação.
 *
 * Features:
 * - Configurações carregadas do backend
 * - Fallback para valores padrão
 * - Derivações para ENUMs específicos
 * - Type safety completa
 * - Error handling robusto
 */

import { writable, derived, type Readable } from "svelte/store";
import { api } from "../services/core/apiClient";
import {
  CategoriaEPI,
  StatusEstoqueItem,
  TipoMovimentacao,
  StatusEntrega,
  StatusEntregaItem,
  ConfiguracaoChave,
  type CategoriaEPIEnum,
  type StatusEstoqueItemEnum,
  type TipoMovimentacaoEnum,
} from "../constants/enums";

// ==================== TIPOS ====================

export interface SystemConfiguration {
  // Configurações booleanas críticas
  [ConfiguracaoChave.PERMITIR_ESTOQUE_NEGATIVO]: boolean;
  [ConfiguracaoChave.PERMITIR_AJUSTES_FORCADOS]: boolean;
  [ConfiguracaoChave.ESTOQUE_MINIMO_EQUIPAMENTO]: number;

  // Feature flags para migração
  useV2Routes?: boolean;
  enableAdvancedReports?: boolean;

  // Outras configurações que podem vir do backend
  [key: string]: any;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  category?: string;
}

// ==================== STORE PRINCIPAL ====================

/**
 * Store principal de configuração
 */
export const configurationStore = writable<SystemConfiguration | null>(null);

/**
 * Store de status de carregamento
 */
export const configurationLoading = writable<boolean>(false);

/**
 * Store de erro
 */
export const configurationError = writable<string | null>(null);

// ==================== VALORES PADRÃO ====================

const DEFAULT_CONFIGURATION: SystemConfiguration = {
  [ConfiguracaoChave.PERMITIR_ESTOQUE_NEGATIVO]: false,
  [ConfiguracaoChave.PERMITIR_AJUSTES_FORCADOS]: false,
  [ConfiguracaoChave.ESTOQUE_MINIMO_EQUIPAMENTO]: 10,
  useV2Routes: false,
  enableAdvancedReports: true,
};

// ==================== FUNÇÃO DE INICIALIZAÇÃO ====================

/**
 * Inicializa configurações carregando do backend
 */
export async function initializeConfiguration(): Promise<SystemConfiguration> {
  configurationLoading.set(true);
  configurationError.set(null);

  try {
    // Carrega configurações diretas (hardcoded conforme backend)
    // Note: /configuracoes endpoint correto da API v3.5
    const response = await api.get<{success: boolean, data: Array<{chave: string, valorParsed: any}>, message?: string}>("/configuracoes").catch((error) => {
      console.warn(
        "⚠️ Endpoint /configuracoes não encontrado, usando configurações padrão",
      );
      return null;
    });

    // Processar resposta da API v3.5
    let backendConfig = {};
    if (response?.success && response.data) {
      // Transformar array de configurações em objeto
      backendConfig = response.data.reduce((acc, config) => {
        acc[config.chave] = config.valorParsed;
        return acc;
      }, {} as Record<string, any>);
      
      console.log("✅ Configurações processadas do backend:", backendConfig);
    }

    // Mescla com valores padrão
    const mergedConfig: SystemConfiguration = {
      ...DEFAULT_CONFIGURATION,
      ...backendConfig,
    };

    configurationStore.set(mergedConfig);
    configurationLoading.set(false);

    console.log(
      "✅ Configurações carregadas diretamente do cliente API:",
      mergedConfig,
    );
    return mergedConfig;
  } catch (error: any) {
    console.warn(
      "⚠️ Erro inesperado ao carregar configurações, usando padrão:",
      error,
    );

    // Em caso de erro, usa configurações padrão
    configurationStore.set(DEFAULT_CONFIGURATION);
    configurationError.set(
      error instanceof Error ? error.message : "Erro desconhecido",
    );
    configurationLoading.set(false);

    return DEFAULT_CONFIGURATION;
  }
}

/**
 * Atualiza uma configuração específica
 */
export function updateConfiguration(
  key: keyof SystemConfiguration,
  value: any,
): void {
  configurationStore.update((config) => {
    if (!config) return config;

    return {
      ...config,
      [key]: value,
    };
  });
}

/**
 * Reseta configurações para padrão
 */
export function resetConfiguration(): void {
  configurationStore.set(DEFAULT_CONFIGURATION);
  configurationError.set(null);
}

// ==================== STORES DERIVADOS ====================

/**
 * Configurações específicas derivadas
 */
export const permitirEstoqueNegativo: Readable<boolean> = derived(
  configurationStore,
  ($config) => $config?.[ConfiguracaoChave.PERMITIR_ESTOQUE_NEGATIVO] ?? false,
);

export const permitirAjustesForcados: Readable<boolean> = derived(
  configurationStore,
  ($config) => $config?.[ConfiguracaoChave.PERMITIR_AJUSTES_FORCADOS] ?? false,
);

export const estoqueMinimo: Readable<number> = derived(
  configurationStore,
  ($config) => $config?.[ConfiguracaoChave.ESTOQUE_MINIMO_EQUIPAMENTO] ?? 10,
);

export const useV2Routes: Readable<boolean> = derived(
  configurationStore,
  ($config) => $config?.useV2Routes ?? false,
);

// ==================== OPÇÕES PARA COMPONENTES UI ====================

/**
 * Opções para seletor de categoria EPI
 */
export const categoriasEPIOptions: Readable<SelectOption[]> = derived(
  configurationStore,
  () =>
    Object.entries(CategoriaEPI).map(([key, value]) => ({
      value,
      label: getCategoryLabel(value),
      category: "epi",
    })),
);

/**
 * Opções para seletor de status de estoque
 */
export const statusEstoqueOptions: Readable<SelectOption[]> = derived(
  configurationStore,
  () =>
    Object.entries(StatusEstoqueItem).map(([key, value]) => ({
      value,
      label: getStatusEstoqueLabel(value),
      category: "estoque",
    })),
);

/**
 * Opções para tipos de movimentação (Event Sourcing)
 */
export const tiposMovimentacaoOptions: Readable<SelectOption[]> = derived(
  configurationStore,
  () =>
    Object.entries(TipoMovimentacao).map(([key, value]) => ({
      value,
      label: getTipoMovimentacaoLabel(value),
      category: value.startsWith("ESTORNO_") ? "estorno" : "movimentacao",
      disabled: value.startsWith("ESTORNO_"), // Estornos não são selecionáveis pelo usuário
    })),
);

/**
 * Opções para status de entrega
 */
export const statusEntregaOptions: Readable<SelectOption[]> = derived(
  configurationStore,
  () =>
    Object.entries(StatusEntrega).map(([key, value]) => ({
      value,
      label: getStatusEntregaLabel(value),
      category: "entrega",
    })),
);

/**
 * Opções para status de item de entrega
 */
export const statusEntregaItemOptions: Readable<SelectOption[]> = derived(
  configurationStore,
  () =>
    Object.entries(StatusEntregaItem).map(([key, value]) => ({
      value,
      label: getStatusEntregaItemLabel(value),
      category: "entrega_item",
    })),
);

// ==================== HELPERS PARA LABELS ====================

function getCategoryLabel(categoria: CategoriaEPIEnum): string {
  const mapping: Record<CategoriaEPIEnum, string> = {
    [CategoriaEPI.PROTECAO_CABECA]: "Proteção da Cabeça",
    [CategoriaEPI.PROTECAO_OLHOS]: "Proteção dos Olhos",
    [CategoriaEPI.PROTECAO_AUDITIVA]: "Proteção Auditiva",
    [CategoriaEPI.PROTECAO_RESPIRATORIA]: "Proteção Respiratória",
    [CategoriaEPI.PROTECAO_TRONCO]: "Proteção do Tronco",
    [CategoriaEPI.PROTECAO_MAOS]: "Proteção das Mãos",
    [CategoriaEPI.PROTECAO_PES]: "Proteção dos Pés",
    [CategoriaEPI.PROTECAO_QUEDAS]: "Proteção Contra Quedas",
    [CategoriaEPI.OUTROS]: "Outros",
  };
  return mapping[categoria] || categoria;
}

function getStatusEstoqueLabel(status: StatusEstoqueItemEnum): string {
  const mapping: Record<StatusEstoqueItemEnum, string> = {
    [StatusEstoqueItem.DISPONIVEL]: "Disponível",
    [StatusEstoqueItem.AGUARDANDO_INSPECAO]: "Aguardando Inspeção",
    [StatusEstoqueItem.QUARENTENA]: "Em Quarentena",
  };
  return mapping[status] || status;
}

function getTipoMovimentacaoLabel(tipo: TipoMovimentacaoEnum): string {
  const mapping: Record<TipoMovimentacaoEnum, string> = {
    // Movimentações Diretas
    [TipoMovimentacao.ENTRADA_NOTA]: "Entrada por Nota",
    [TipoMovimentacao.SAIDA_ENTREGA]: "Saída por Entrega",
    [TipoMovimentacao.ENTRADA_DEVOLUCAO]: "Entrada por Devolução",
    [TipoMovimentacao.SAIDA_TRANSFERENCIA]: "Saída por Transferência",
    [TipoMovimentacao.ENTRADA_TRANSFERENCIA]: "Entrada por Transferência",
    [TipoMovimentacao.SAIDA_DESCARTE]: "Saída por Descarte",
    [TipoMovimentacao.AJUSTE_POSITIVO]: "Ajuste Positivo",
    [TipoMovimentacao.AJUSTE_NEGATIVO]: "Ajuste Negativo",

    // Estornos
    [TipoMovimentacao.ESTORNO_ENTRADA_NOTA]: "Estorno - Entrada por Nota",
    [TipoMovimentacao.ESTORNO_SAIDA_ENTREGA]: "Estorno - Saída por Entrega",
    [TipoMovimentacao.ESTORNO_ENTRADA_DEVOLUCAO]:
      "Estorno - Entrada por Devolução",
    [TipoMovimentacao.ESTORNO_SAIDA_DESCARTE]: "Estorno - Saída por Descarte",
    [TipoMovimentacao.ESTORNO_SAIDA_TRANSFERENCIA]:
      "Estorno - Saída por Transferência",
    [TipoMovimentacao.ESTORNO_ENTRADA_TRANSFERENCIA]:
      "Estorno - Entrada por Transferência",
    [TipoMovimentacao.ESTORNO_AJUSTE_POSITIVO]: "Estorno - Ajuste Positivo",
    [TipoMovimentacao.ESTORNO_AJUSTE_NEGATIVO]: "Estorno - Ajuste Negativo",
  };
  return mapping[tipo] || tipo;
}

function getStatusEntregaLabel(status: string): string {
  const mapping: Record<string, string> = {
    PENDENTE_ASSINATURA: "Pendente Assinatura",
    ASSINADA: "Assinada",
    CANCELADA: "Cancelada",
  };
  return mapping[status] || status;
}

function getStatusEntregaItemLabel(status: string): string {
  const mapping: Record<string, string> = {
    COM_COLABORADOR: "Com Colaborador",
    DEVOLVIDO: "Devolvido",
  };
  return mapping[status] || status;
}

// ==================== UTILITÁRIOS ====================

/**
 * Hook para verificar se feature está habilitada
 */
export function useFeatureFlag(
  flag: keyof SystemConfiguration,
): Readable<boolean> {
  return derived(configurationStore, ($config) => Boolean($config?.[flag]));
}

/**
 * Obtém valor de configuração específica
 */
export function getConfigValue<T>(
  key: keyof SystemConfiguration,
  defaultValue: T,
): Readable<T> {
  return derived(
    configurationStore,
    ($config) => ($config?.[key] as T) ?? defaultValue,
  );
}

/**
 * Verifica se configurações estão carregadas
 */
export const isConfigurationLoaded: Readable<boolean> = derived(
  configurationStore,
  ($config) => $config !== null,
);

// ==================== EXPORT CONSOLIDADO ====================

export const configurationHelpers = {
  initializeConfiguration,
  updateConfiguration,
  resetConfiguration,
  useFeatureFlag,
  getConfigValue,
};

export default configurationStore;

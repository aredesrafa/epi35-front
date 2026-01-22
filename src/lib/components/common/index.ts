/**
 * Common Components - DataLife EPI
 *
 * Componentes comuns e reutilizáveis do design system.
 * Todos seguem padrões de consistência e usam constantes centralizadas.
 */

// Componentes de feedback e loading
export { default as LoadingSpinner } from "./LoadingSpinner.svelte";
export { default as ErrorDisplay } from "./ErrorDisplay.svelte";
export { default as NotificationToast } from "./NotificationToast.svelte";

// Componentes de modal
export { default as LocalConfirmationModal } from "./LocalConfirmationModal.svelte";

// Componentes de input e seleção
export { default as SearchableDropdown } from "./SearchableDropdown.svelte";
export { default as CompanySelector } from "./CompanySelector.svelte";

// Componentes de botão
export { default as StandardButton } from "./StandardButton.svelte";

// Tipos úteis
export interface ConfirmationConfig {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "success" | "error" | "warning" | "info" | "primary" | "neutral";
  dangerous?: boolean;
}

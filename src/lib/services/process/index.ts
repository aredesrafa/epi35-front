/**
 * Export Unificado - Novos Adapters Especializados
 *
 * Centraliza todos os exports dos novos adapters para facilitar imports
 * e manter organização do sistema modular.
 */

// ==================== QUERY ADAPTERS ====================
export { fichaQueryAdapter } from "./queries/fichaQueryAdapter";
export type {
  FichaQueryParams,
  PaginatedFichaResponse,
  FichaBasica,
} from "./queries/types";

// ==================== OPERATION ADAPTERS ====================
export { deliveryProcessAdapter } from "./operations/deliveryProcessAdapter";
export type {
  CreateDeliveryPayload,
  DeliveryCompleteResult,
  ConfirmSignaturePayload,
  CancelDeliveryPayload,
} from "./operations/deliveryProcessAdapter";

export { returnProcessAdapter } from "./operations/returnProcessAdapter";
export type {
  ReturnItem,
  ReturnBatchPayload,
  ReturnBatchResult,
  ReturnValidationResult,
} from "./operations/returnProcessAdapter";

// ==================== SHARED HELPERS ====================
export { UIMappingHelpers } from "./shared/uiMappingHelpers";
export {
  getEventIcon,
  getColorClasses,
  getBadgeColor,
  formatDaysRemaining,
  getInitials,
  formatConditionalText,
} from "./shared/uiMappingHelpers";

// ==================== LEGACY SUPPORT ====================
// Tipos do adapter original migrados para novos adapters
export type {
  EPIDisponivel,
  NovaEntregaFormData,
} from "./operations/deliveryProcessAdapter";

// FichaDetailData movido para tipos centralizados
export type { FichaDetailData } from "../../types/serviceTypes";

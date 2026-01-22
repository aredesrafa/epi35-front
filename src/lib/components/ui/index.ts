// Barrel exports para componentes UI otimizados
// Componentes fundamentais do design system

export { default as StatusBadge } from "./StatusBadge.svelte";
export { default as OptimizedTable } from "./OptimizedTable.svelte";
export { default as OptimizedModal } from "./OptimizedModal.svelte";
export { default as TableContainer } from "./TableContainer.svelte";
export { default as TableFilters } from "./TableFilters.svelte";
export { default as StatsCard } from "./StatsCard.svelte";
export { default as ItemMovementHistory } from "./ItemMovementHistory.svelte";

// Tipos úteis para componentes UI
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  type?: "text" | "badge" | "actions" | "number" | "date";
}

export interface FilterMetadata {
  key: string;
  label: string;
  type: "search" | "select" | "checkbox";
  placeholder?: string;
  options?: Array<{ value: string; label: string; count?: number }>;
}

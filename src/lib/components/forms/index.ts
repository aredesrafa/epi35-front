/**
 * Forms Components - DataLife EPI
 *
 * Componentes de formulário padronizados que seguem o design system.
 * Todos os componentes usam FormField como base para consistência.
 */

// Componente base
export { default as FormField } from "./FormField.svelte";

// Componentes de input
export { default as TextInput } from "./TextInput.svelte";
export { default as SelectInput } from "./SelectInput.svelte";

// Tipos úteis para TypeScript
export interface FormOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormFieldProps {
  label: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helper?: string;
  containerClass?: string;
}

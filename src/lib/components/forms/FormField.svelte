<!--
  FormField - Componente wrapper genérico para campos de formulário
  
  Fornece estrutura consistente com label, campo (via slot) e feedback visual.
  Segue padrões de acessibilidade e design do sistema.
-->

<script lang="ts">
  import { Label } from 'flowbite-svelte';
  import { formClasses } from '$lib/theme';
  import type { FormLabel } from '$lib/constants/content';
  
  // Props principais
  export let label: string;
  export let forId: string;
  export let required: boolean = false;
  export let error: string | undefined = undefined;
  export let helper: string | undefined = undefined;
  export let disabled: boolean = false;
  
  // Classes customizáveis
  export let labelClass: string = '';
  export let containerClass: string = '';
  export let errorClass: string = '';
  export let helperClass: string = '';
  
  // Gerar ID único se não fornecido
  const defaultId = `field-${Math.random().toString(36).substr(2, 9)}`;
  $: fieldId = forId || defaultId;
  
  // Classes combinadas
  $: combinedLabelClass = required 
    ? `${formClasses.labelRequired} ${labelClass}`.trim()
    : `${formClasses.label} ${labelClass}`.trim();
  
  $: combinedErrorClass = `${formClasses.error} ${errorClass}`.trim();
  $: combinedHelperClass = `${formClasses.helper} ${helperClass}`.trim();
  
  // IDs para acessibilidade
  $: errorId = error ? `${fieldId}-error` : undefined;
  $: helperId = helper ? `${fieldId}-helper` : undefined;
  $: describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
</script>

<div class="form-field {containerClass}" class:opacity-60={disabled}>
  <!-- Label -->
  <Label 
    for={fieldId} 
    class={combinedLabelClass}
  >
    {label}
    {#if required}
      <span class="text-red-500 ml-1" aria-label="obrigatório">*</span>
    {/if}
  </Label>
  
  <!-- Campo de input (via slot) -->
  <div class="form-field-input">
    <slot 
      {fieldId}
      {error}
      {required}
      {disabled}
      {describedBy}
    />
  </div>
  
  <!-- Mensagem de erro -->
  {#if error}
    <p 
      id={errorId}
      class={combinedErrorClass}
      role="alert"
      aria-live="polite"
    >
      {error}
    </p>
  {/if}
  
  <!-- Texto de ajuda -->
  {#if helper && !error}
    <p 
      id={helperId}
      class={combinedHelperClass}
    >
      {helper}
    </p>
  {/if}
</div>

<style>
  .form-field {
    @apply space-y-1;
  }
  
  .form-field-input {
    @apply relative;
  }
  
  /* Estado disabled */
  .form-field.opacity-60 {
    @apply pointer-events-none;
  }
  
  /* Melhorar foco para acessibilidade */
  .form-field :global(input:focus),
  .form-field :global(select:focus),
  .form-field :global(textarea:focus) {
    @apply ring-2 ring-primary-500 ring-offset-2;
  }
  
  /* Estado de erro */
  .form-field :global(.input-error) {
    @apply border-red-500 focus:border-red-500 focus:ring-red-500;
  }
</style>
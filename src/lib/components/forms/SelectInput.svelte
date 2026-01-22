<!--
  SelectInput - Campo de seleção padronizado encapsulado
  
  Usa FormField como wrapper e Select do Flowbite para máxima consistência.
  Suporta opções simples e complexas com labels/values diferentes.
-->

<script lang="ts">
  import { Select } from 'flowbite-svelte';
  import FormField from './FormField.svelte';
  import { formClasses } from '$lib/theme';
  import { PLACEHOLDERS } from '$lib/constants/content';
  
  // Tipos para opções
  interface SimpleOption {
    value: string | number;
    label: string;
    disabled?: boolean;
  }
  
  // Props principais do campo
  export let value: string | number = '';
  export let label: string;
  export let id: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  
  // Props específicas do select
  export let options: SimpleOption[] = [];
  export let placeholder: string = PLACEHOLDERS.selectOption;
  export let multiple: boolean = false;
  
  // Validação e feedback
  export let error: string | undefined = undefined;
  export let helper: string | undefined = undefined;
  
  // Tamanho do select
  export let size: 'sm' | 'md' | 'lg' = 'sm';
  
  // Classes customizáveis
  export let containerClass: string = '';
  export let selectClass: string = '';
  
  // Gerar ID único se não fornecido
  const defaultId = `select-input-${Math.random().toString(36).substr(2, 9)}`;
  $: fieldId = id || defaultId;
  
  // Classes do select baseadas no estado
  $: selectClasses = [
    formClasses.input,
    error ? 'input-error' : '',
    selectClass
  ].filter(Boolean).join(' ');
  
  // Prepara opções para o Select do Flowbite
  $: selectItems = [
    ...(placeholder ? [{ value: '', name: placeholder, disabled: !required }] : []),
    ...options.map(option => ({
      value: String(option.value),
      name: option.label,
      disabled: option.disabled || false
    }))
  ];
  
  // Eventos
  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedValue = target.value;
    
    // Converter de volta para o tipo original se for number
    if (typeof value === 'number' && selectedValue !== '') {
      value = Number(selectedValue);
    } else {
      value = selectedValue;
    }
  }
</script>

<FormField
  {label}
  forId={fieldId}
  {required}
  {error}
  {helper}
  {disabled}
  containerClass={containerClass}
  let:fieldId
  let:describedBy
>
  <Select
    id={fieldId}
    items={selectItems}
    {size}
    {disabled}
    {multiple}
    bind:value
    class={selectClasses}
    aria-describedby={describedBy}
    aria-invalid={error ? 'true' : 'false'}
    on:change={handleChange}
    on:focus
    on:blur
    {...$$restProps}
  />
</FormField>

<style>
  /* Estilos específicos para estados do select */
  :global(.input-error) {
    @apply border-red-500 focus:border-red-500 focus:ring-red-500;
  }
  
  /* Melhorar contraste para modo escuro */
  :global(.dark .input-error) {
    @apply border-red-400 focus:border-red-400 focus:ring-red-400;
  }
  
  /* Estilo para opção placeholder */
  :global(select option[value=""]) {
    @apply text-gray-500 dark:text-gray-400;
  }
</style>
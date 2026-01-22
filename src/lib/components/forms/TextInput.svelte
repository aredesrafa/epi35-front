<!--
  TextInput - Campo de texto padronizado encapsulado
  
  Usa FormField como wrapper e Input do Flowbite para máxima consistência.
  Fornece API simples para o desenvolvedor com todas as features necessárias.
-->

<script lang="ts">
  import { Input } from 'flowbite-svelte';
  import FormField from './FormField.svelte';
  import { formClasses } from '$lib/theme';
  import type { FormLabel } from '$lib/constants/content';
  
  // Props principais do campo
  export let value: string = '';
  export let label: string;
  export let id: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  
  // Props específicas do input
  export let type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' = 'text';
  export let placeholder: string = '';
  export let autocomplete: string = '';
  export let maxlength: number | undefined = undefined;
  export let minlength: number | undefined = undefined;
  export let pattern: string | undefined = undefined;
  
  // Validação e feedback
  export let error: string | undefined = undefined;
  export let helper: string | undefined = undefined;
  
  // Tamanho do input
  export let size: 'sm' | 'md' | 'lg' = 'sm';
  
  // Classes customizáveis
  export let containerClass: string = '';
  export let inputClass: string = '';
  
  // Gerar ID único se não fornecido
  const defaultId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
  $: fieldId = id || defaultId;
  
  // Classes do input baseadas no estado
  $: inputClasses = [
    formClasses.input,
    error ? 'input-error' : '',
    inputClass
  ].filter(Boolean).join(' ');
  
  // Eventos
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
  }
  
  function handleBlur(event: FocusEvent) {
    // Dispatch para componente pai se necessário
    const customEvent = new CustomEvent('blur', { detail: { value, event } });
    if (typeof window !== 'undefined') {
      document.dispatchEvent(customEvent);
    }
  }
  
  function handleFocus(event: FocusEvent) {
    // Dispatch para componente pai se necessário
    const customEvent = new CustomEvent('focus', { detail: { value, event } });
    if (typeof window !== 'undefined') {
      document.dispatchEvent(customEvent);
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
  <Input
    id={fieldId}
    {type}
    {placeholder}
    {autocomplete}
    {maxlength}
    {minlength}
    {pattern}
    {size}
    {disabled}
    {readonly}
    bind:value
    class={inputClasses}
    aria-describedby={describedBy}
    aria-invalid={error ? 'true' : 'false'}
    on:input={handleInput}
    on:blur={handleBlur}
    on:focus={handleFocus}
    on:keydown
    on:keyup
    on:keypress
    {...$$restProps}
  />
</FormField>

<style>
  /* Estilos específicos para estados do input */
  :global(.input-error) {
    @apply border-red-500 focus:border-red-500 focus:ring-red-500;
  }
  
  /* Melhorar contraste para modo escuro */
  :global(.dark .input-error) {
    @apply border-red-400 focus:border-red-400 focus:ring-red-400;
  }
</style>
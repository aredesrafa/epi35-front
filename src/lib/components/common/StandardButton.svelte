<!--
  StandardButton - Botão padronizado do design system
  
  Encapsula o Button do Flowbite com variantes e estados consistentes.
  Integra com LoadingSpinner e constantes de conteúdo.
-->

<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import { BUTTON_TEXTS, LOADING_TEXTS, type ButtonText, type LoadingText } from '$lib/constants/content';
  import { borderRadius, type ButtonSize } from '$lib/theme';
  
  // Variantes de botão padronizadas
  type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  
  // Cores disponíveis no Flowbite (definindo localmente para evitar import issues)
  type ComponentColor = 'alternative' | 'blue' | 'dark' | 'green' | 'light' | 'primary' | 'purple' | 'red' | 'yellow';
  
  // Props principais
  export let variant: ButtonVariant = 'primary';
  export let size: ButtonSize = 'sm';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let fullWidth: boolean = false;
  export let outline: boolean = false;
  
  // Texto do botão
  export let text: string = '';
  export let buttonType: ButtonText | undefined = undefined;
  export let loadingText: string = '';
  export let loadingType: LoadingText | undefined = undefined;
  
  // Props técnicas
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let href: string | undefined = undefined;
  
  // Classes customizáveis
  export let customClass: string = '';
  
  // Mapeamento de variantes para cores do Flowbite
  const variantToColor: Record<ButtonVariant, ComponentColor> = {
    primary: 'primary',
    secondary: 'alternative',
    success: 'green',
    danger: 'red',
    warning: 'yellow',
    info: 'blue',
    neutral: 'light'
  };
  
  // Texto exibido
  $: displayText = buttonType ? BUTTON_TEXTS[buttonType] : text;
  $: displayLoadingText = loadingType ? LOADING_TEXTS[loadingType] : (loadingText || displayText);
  
  // Cor do botão baseada na variante
  $: buttonColor = variantToColor[variant];
  
  // Classes finais
  $: finalClasses = [
    borderRadius.sm,
    fullWidth ? 'w-full' : '',
    customClass
  ].filter(Boolean).join(' ');
  
  // Estado efetivo de disabled
  $: isDisabled = disabled || loading;
</script>

<!-- Botão com loading integrado -->
<Button
  {type}
  {href}
  color={buttonColor}
  {size}
  {outline}
  disabled={isDisabled}
  class={finalClasses}
  on:click
  on:focus
  on:blur
  {...$$restProps}
>
  {#if loading}
    <!-- Estado de loading -->
    <div class="flex items-center space-x-2">
      <LoadingSpinner 
        size="xs" 
        color="white" 
        text="" 
        inline={true}
      />
      <span>{displayLoadingText}</span>
    </div>
  {:else}
    <!-- Estado normal -->
    <slot>{displayText}</slot>
  {/if}
</Button>

<style>
  /* Estilos adicionais se necessário */
  :global(.standard-button-loading) {
    pointer-events: none;
  }
</style>
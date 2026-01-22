<!--
  LocalConfirmationModal - Modal de confirmação para uso local
  
  Versão não-singleton que pode ser instanciada onde necessário.
  Evita race conditions e torna o state management explícito.
-->

<script lang="ts">
  import { Modal } from 'flowbite-svelte';
  import { ExclamationCircleOutline, InfoCircleOutline, CheckCircleOutline } from 'flowbite-svelte-icons';
  import StandardButton from './StandardButton.svelte';
  import { BUTTON_TEXTS, CONFIRMATION_MESSAGES } from '$lib/constants/content';
  import { semanticColors, type SemanticColor } from '$lib/theme';
  import { createEventDispatcher } from 'svelte';
  
  // Dispatcher para eventos
  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
    close: void;
  }>();
  
  // Props principais
  export let open: boolean = false;
  export let title: string;
  export let message: string = '';
  export let variant: SemanticColor = 'error';
  export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'sm';
  
  // Textos dos botões
  export let confirmText: string = BUTTON_TEXTS.confirm;
  export let cancelText: string = BUTTON_TEXTS.cancel;
  
  // Configurações
  export let outsideClose: boolean = true;
  export let showCancel: boolean = true;
  export let loading: boolean = false;
  export let dangerous: boolean = false;
  
  // Classes customizáveis
  export let modalClass: string = '';
  
  // Configurações por variante
  const variantConfig = {
    success: { 
      icon: CheckCircleOutline, 
      colors: semanticColors.success,
      buttonVariant: 'success'
    },
    error: { 
      icon: ExclamationCircleOutline, 
      colors: semanticColors.error,
      buttonVariant: 'danger'
    },
    warning: { 
      icon: ExclamationCircleOutline, 
      colors: semanticColors.warning,
      buttonVariant: 'warning'
    },
    info: { 
      icon: InfoCircleOutline, 
      colors: semanticColors.info,
      buttonVariant: 'info'
    },
    primary: { 
      icon: InfoCircleOutline, 
      colors: semanticColors.primary,
      buttonVariant: 'primary'
    },
    neutral: { 
      icon: InfoCircleOutline, 
      colors: semanticColors.neutral,
      buttonVariant: 'neutral'
    }
  };
  
  $: config = variantConfig[variant];
  $: IconComponent = config.icon;
  
  // Handlers
  function handleConfirm() {
    dispatch('confirm');
  }
  
  function handleCancel() {
    dispatch('cancel');
    open = false;
  }
  
  function handleClose() {
    dispatch('close');
    open = false;
  }
  
  // Determinar se deve usar variante danger para confirm button
  $: confirmButtonVariant = dangerous ? 'danger' : config.buttonVariant;
</script>

<Modal
  bind:open
  {size}
  outsideclose={outsideClose}
  class="rounded-sm {modalClass}"
  on:close={handleClose}
>
  <div class="text-center">
    <!-- Icon -->
    <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 {config.colors.bg} rounded-full">
      <svelte:component this={IconComponent} class="w-6 h-6 {config.colors.text}" />
    </div>
    
    <!-- Title -->
    <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    
    <!-- Message -->
    {#if message}
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {message}
      </p>
    {/if}
    
    <!-- Content slot para casos mais complexos -->
    <slot />
    
    <!-- Actions -->
    <div class="flex justify-center space-x-4 mt-6">
      <StandardButton
        variant={confirmButtonVariant}
        {loading}
        loadingType="processing"
        text={confirmText}
        on:click={handleConfirm}
      />
      
      {#if showCancel}
        <StandardButton
          variant="secondary"
          disabled={loading}
          text={cancelText}
          on:click={handleCancel}
        />
      {/if}
    </div>
  </div>
</Modal>
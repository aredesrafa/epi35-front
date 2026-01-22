<!--
  OptimizedModal.svelte
  Modal component otimizado para Flowbite Svelte v0.48.6
  Implementa lazy loading, focus trap e animações suaves
-->

<script lang="ts">
  import { Modal, Button, Spinner } from 'flowbite-svelte';
  import { CloseOutline } from 'flowbite-svelte-icons';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Props
  export let show = false;
  export let title = '';
  export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' = 'md';
  export let autoclose = false;
  export let outsideclose = true;
  export let persistent = false;
  export let loading = false;
  export let loadingMessage = 'Carregando...';
  export let maxHeight = 'max-h-[80vh]';
  export let customClass = '';
  
  // Slots props
  export let showHeader = true;
  export let showFooter = false;
  export let showCloseButton = true;
  
  const dispatch = createEventDispatcher<{
    close: void;
    open: void;
    escape: void;
  }>();
  
  let modalElement: HTMLElement;
  let previousActiveElement: Element | null = null;
  let firstFocusableElement: HTMLElement | null = null;
  let lastFocusableElement: HTMLElement | null = null;
  
  // Reactive statements
  $: if (show && !loading) {
    handleModalOpen();
  } else if (!show) {
    handleModalClose();
  }
  
  // Focus management
  async function handleModalOpen() {
    await tick();
    
    // Salvar o elemento ativo anterior
    previousActiveElement = document.activeElement;
    
    // Encontrar elementos focáveis
    updateFocusableElements();
    
    // Focar no primeiro elemento focável
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
    
    // Adicionar listener para trap de foco
    document.addEventListener('keydown', handleKeyDown);
    
    dispatch('open');
  }
  
  function handleModalClose() {
    // Restaurar foco anterior
    if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus();
    }
    
    // Remover listener
    document.removeEventListener('keydown', handleKeyDown);
    
    dispatch('close');
  }
  
  function updateFocusableElements() {
    if (!modalElement) return;
    
    const focusableElementsSelector = 
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    const focusableElements = modalElement.querySelectorAll(focusableElementsSelector);
    
    firstFocusableElement = focusableElements[0] as HTMLElement || null;
    lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement || null;
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (!show) return;
    
    // ESC para fechar (se não for persistent)
    if (event.key === 'Escape' && !persistent) {
      event.preventDefault();
      closeModal();
      dispatch('escape');
      return;
    }
    
    // Tab trap
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement?.focus();
        }
      }
    }
  }
  
  function closeModal() {
    if (!persistent) {
      show = false;
    }
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (outsideclose && !persistent && event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  onMount(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<!-- Modal optimizado -->
{#if show}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 dark:bg-opacity-70"
    on:click={handleBackdropClick}
    on:keydown={handleKeyDown}
    transition:scale={{ duration: 200, easing: quintOut, start: 0.95 }}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <div 
      bind:this={modalElement}
      class="relative w-full {size === 'xs' ? 'max-w-xs' : 
             size === 'sm' ? 'max-w-sm' :
             size === 'md' ? 'max-w-md' :
             size === 'lg' ? 'max-w-lg' :
             size === 'xl' ? 'max-w-xl' :
             size === '2xl' ? 'max-w-2xl' :
             size === '3xl' ? 'max-w-3xl' :
             size === '4xl' ? 'max-w-4xl' :
             size === '5xl' ? 'max-w-5xl' :
             size === '6xl' ? 'max-w-6xl' : 'max-w-7xl'} 
             {maxHeight} bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden {customClass}"
      on:click|stopPropagation
    >
      <!-- Loading overlay -->
      {#if loading}
        <div class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 flex items-center justify-center z-10">
          <div class="flex items-center gap-3">
            <Spinner size="6" color="primary" />
            <span class="text-gray-600 dark:text-gray-300">{loadingMessage}</span>
          </div>
        </div>
      {/if}
      
      <!-- Header -->
      {#if showHeader && (title || $$slots.header)}
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex-1">
            {#if $$slots.header}
              <slot name="header" />
            {:else if title}
              <h3 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            {/if}
          </div>
          
          {#if showCloseButton && !persistent}
            <Button
              color="alternative"
              size="sm"
              class="rounded-sm p-2 ml-4"
              on:click={closeModal}
              aria-label="Fechar modal"
            >
              <CloseOutline class="w-4 h-4" />
            </Button>
          {/if}
        </div>
      {/if}
      
      <!-- Body -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-6">
          <slot />
        </div>
      </div>
      
      <!-- Footer -->
      {#if showFooter || $$slots.footer}
        <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <slot name="footer">
            <Button color="alternative" size="sm" class="rounded-sm" on:click={closeModal}>
              Cancelar
            </Button>
            <Button color="primary" size="sm" class="rounded-sm">
              Confirmar
            </Button>
          </slot>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Otimizações de performance */
  :global(.modal-optimized) {
    contain: layout style paint;
    will-change: transform, opacity;
  }
  
  /* Smooth scrolling para o body do modal */
  .modal-body {
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
  }
  
  .modal-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-body::-webkit-scrollbar-track {
    background: theme('colors.gray.100');
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb {
    background: theme('colors.gray.400');
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: theme('colors.gray.500');
  }
  
  /* Dark mode scrollbar */
  :global(.dark) .modal-body {
    scrollbar-color: theme('colors.gray.600') theme('colors.gray.800');
  }
  
  :global(.dark) .modal-body::-webkit-scrollbar-track {
    background: theme('colors.gray.800');
  }
  
  :global(.dark) .modal-body::-webkit-scrollbar-thumb {
    background: theme('colors.gray.600');
  }
  
  :global(.dark) .modal-body::-webkit-scrollbar-thumb:hover {
    background: theme('colors.gray.500');
  }
</style>
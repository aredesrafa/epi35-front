<!--
  Container de Tabela Padronizado
  
  Este componente implementa o padrão visual do Figma:
  - Container único com bordas arredondadas e sombra sutil
  - Suporte a filtros integrados via slot
  - Estados de loading, erro e vazio
  - Paginação opcional
-->

<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import ErrorDisplay from './ErrorDisplay.svelte';
  import { _ } from 'svelte-i18n';
  
  // ==================== PROPS ====================
  
  export let loading: boolean = false;
  export let error: string | null = null;
  export let isEmpty: boolean = false;
  export let embedded: boolean = false;
  export let emptyIcon: any = null;
  export let emptyTitle: string = 'Nenhum item encontrado';
  export let emptyMessage: string = 'Não há dados para exibir';
  export let emptyActionLabel: string = '';
  export let showPagination: boolean = false;
  export let currentPage: number = 1;
  export let totalPages: number = 1;
  export let pageSize: number = 20;
  export let total: number = 0;
  
  // ==================== EVENTS ====================
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{
    emptyAction: void;
    pageChange: { page: number };
  }>();
  
  // ==================== COMPUTED ====================
  
  $: startItem = ((currentPage - 1) * pageSize) + 1;
  $: endItem = Math.min(currentPage * pageSize, total);
</script>

<!-- Container principal com padrão Figma - overflow visible para permitir dropdowns -->
<div class="{embedded ? '' : 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm'}">
  {#if loading}
    <!-- Estado de carregamento -->
    <div class="p-8">
      <LoadingSpinner />
    </div>
  {:else if error}
    <!-- Estado de erro -->
    <div class="p-8">
      <ErrorDisplay error={error} />
    </div>
  {:else if isEmpty}
    <!-- Estado vazio -->
    <div class="p-16 text-center">
      {#if emptyIcon}
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svelte:component this={emptyIcon} class="w-8 h-8 text-gray-400" />
        </div>
      {/if}
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {emptyTitle}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {emptyMessage}
      </p>
      {#if emptyActionLabel}
        <Button size="sm" color="primary" class="rounded-sm" on:click={() => dispatch('emptyAction')}>
          {emptyActionLabel}
        </Button>
      {/if}
    </div>
  {:else}
    <!-- Conteúdo Principal -->
    <div>
      <slot name="filters" />
      
      <!-- Wrapper com overflow para a tabela -->
      <div class="overflow-hidden rounded-b-lg">
        <slot />
      </div>
    
      {#if showPagination}
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {$_('pagination.showing')} {startItem} {$_('pagination.to')} {endItem} {$_('pagination.of')} {total} {$_('pagination.results')}
          </div>
          <div class="flex space-x-2">
            <Button
              color="alternative"
              class="rounded-sm"
              disabled={currentPage === 1}
              on:click={() => dispatch('pageChange', { page: currentPage - 1 })}
            >
              {$_('pagination.previous')}
            </Button>
            <span class="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400">
              {$_('pagination.page')} {currentPage} {$_('pagination.of')} {totalPages}
            </span>
            <Button
              color="alternative"
              class="rounded-sm"
              disabled={currentPage === totalPages}
              on:click={() => dispatch('pageChange', { page: currentPage + 1 })}
            >
              {$_('pagination.next')}
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
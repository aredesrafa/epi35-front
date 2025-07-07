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
  
  // ==================== PROPS ====================
  
  export let loading: boolean = false;
  export let error: string | null = null;
  export let isEmpty: boolean = false;
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

<!-- Container principal com padrão Figma -->
<div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
  {#if loading}
    <!-- Estado de carregamento -->
    <div class="p-8">
      <LoadingSpinner />
    </div>
  {:else if error}
    <!-- Estado de erro -->
    <div class="p-8">
      <ErrorDisplay message={error} />
    </div>
  {:else if isEmpty}
    <!-- Estado vazio -->
    <div class="p-16 text-center">
      {#if emptyIcon}
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svelte:component this={emptyIcon} class="w-8 h-8 text-gray-400" />
        </div>
      {/if}
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {emptyTitle}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
        {emptyMessage}
      </p>
      {#if emptyActionLabel}
        <Button
          size="sm"
          color="primary"
          class="rounded-sm"
          on:click={() => dispatch('emptyAction')}
        >
          {emptyActionLabel}
        </Button>
      {/if}
    </div>
  {:else}
    <!-- Slot para filtros -->
    <slot name="filters" />
    
    <!-- Slot para conteúdo principal (tabela) -->
    <div class="overflow-x-auto">
      <slot />
    </div>
    
    <!-- Paginação -->
    {#if showPagination && totalPages > 1}
      <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {startItem} a {endItem} de {total} resultados
        </div>
        <div class="flex gap-2">
          <Button
            size="sm"
            color="alternative"
            class="rounded-sm"
            disabled={currentPage === 1}
            on:click={() => dispatch('pageChange', { page: currentPage - 1 })}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            color="alternative"
            class="rounded-sm"
            disabled={currentPage === totalPages}
            on:click={() => dispatch('pageChange', { page: currentPage + 1 })}
          >
            Próximo
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
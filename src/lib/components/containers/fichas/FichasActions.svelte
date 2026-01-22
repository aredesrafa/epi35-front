<!--
  Fichas Actions - Componente de Ações
  Responsabilidade: Ações globais (nova ficha, bulk actions, export)
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Dropdown, DropdownItem, DropdownDivider, ButtonGroup } from 'flowbite-svelte';
  import { 
    PlusOutline, 
    DotsVerticalOutline, 
    DownloadOutline, 
    TrashBinOutline,
    CheckOutline,
    CloseOutline 
  } from 'flowbite-svelte-icons';
  
  import { 
    fichasUIStore, 
    hasSelection, 
    hasMultipleSelection, 
    selectedCount,
    hasActiveLoading 
  } from '$lib/stores/fichas';

  const dispatch = createEventDispatcher();

  // ==================== REACTIVE STATEMENTS ====================
  
  $: showSelection = $hasSelection;
  $: isMultipleSelection = $hasMultipleSelection;
  $: selectionCount = $selectedCount;
  $: isLoading = $hasActiveLoading;

  // ==================== EVENT HANDLERS ====================
  
  function handleNovaFicha() {
    dispatch('novaFicha');
  }

  function handleBulkAction(action: string) {
    const selectedIds = $fichasUIStore.selectedFichaIds;
    dispatch('bulkAction', { action, fichaIds: selectedIds });
  }

  function handleExport(format: string) {
    dispatch('export', { format });
  }

  function handleClearSelection() {
    fichasUIStore.clearSelection();
  }
</script>

<!-- ==================== TEMPLATE ==================== -->

<div class="fichas-actions bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
  <div class="flex items-center justify-between">
    <!-- Lado esquerdo - Ações principais -->
    <div class="flex items-center gap-3">
      <!-- Nova Ficha -->
      <Button 
        size="sm" 
        class="rounded-sm"
        on:click={handleNovaFicha}
      >
        <PlusOutline class="w-4 h-4 mr-2" />
        Nova Ficha
      </Button>

      <!-- Ações de seleção (aparecem quando há itens selecionados) -->
      {#if showSelection}
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {selectionCount} item{selectionCount !== 1 ? 's' : ''} selecionado{selectionCount !== 1 ? 's' : ''}
          </span>

          <ButtonGroup size="sm">
            <!-- Ativar -->
            <Button 
              color="green" 
              class="rounded-l-sm"
              disabled={isLoading}
              on:click={() => handleBulkAction('activate')}
              title="Ativar fichas selecionadas"
            >
              <CheckOutline class="w-4 h-4" />
            </Button>

            <!-- Desativar -->
            <Button 
              color="yellow" 
              class="border-l-0"
              disabled={isLoading}
              on:click={() => handleBulkAction('deactivate')}
              title="Desativar fichas selecionadas"
            >
              <CloseOutline class="w-4 h-4" />
            </Button>

            <!-- Excluir -->
            <Button 
              color="red" 
              class="rounded-r-sm border-l-0"
              disabled={isLoading}
              on:click={() => handleBulkAction('delete')}
              title="Excluir fichas selecionadas"
            >
              <TrashBinOutline class="w-4 h-4" />
            </Button>
          </ButtonGroup>

          <!-- Limpar seleção -->
          <Button 
            size="sm" 
            color="alternative" 
            class="rounded-sm"
            on:click={handleClearSelection}
          >
            Limpar Seleção
          </Button>
        </div>
      {/if}
    </div>

    <!-- Lado direito - Ações secundárias -->
    <div class="flex items-center gap-2">
      <!-- Export -->
      <Button 
        size="sm" 
        color="alternative" 
        class="rounded-sm"
        disabled={isLoading}
      >
        <DownloadOutline class="w-4 h-4 mr-2" />
        Exportar
      </Button>
      
      <Dropdown placement="bottom-end">
        <DropdownItem on:click={() => handleExport('xlsx')}>
          <DownloadOutline class="w-4 h-4 mr-2" />
          Excel (.xlsx)
        </DropdownItem>
        <DropdownItem on:click={() => handleExport('csv')}>
          <DownloadOutline class="w-4 h-4 mr-2" />
          CSV
        </DropdownItem>
        <DropdownItem on:click={() => handleExport('pdf')}>
          <DownloadOutline class="w-4 h-4 mr-2" />
          PDF
        </DropdownItem>
      </Dropdown>

      <!-- Menu de ações -->
      <Button 
        size="sm" 
        color="alternative" 
        class="rounded-sm"
      >
        <DotsVerticalOutline class="w-4 h-4" />
      </Button>
      
      <Dropdown placement="bottom-end">
        <DropdownItem>
          Importar Fichas
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem>
          Configurações
        </DropdownItem>
        <DropdownItem>
          Relatórios
        </DropdownItem>
      </Dropdown>
    </div>
  </div>

  <!-- Barra de progresso para bulk actions -->
  {#if isLoading}
    <div class="mt-3">
      <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div class="bg-primary-600 h-2 rounded-full animate-pulse w-1/3"></div>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Processando ação em lote...
      </p>
    </div>
  {/if}
</div>

<style>
  .fichas-actions {
    @apply transition-all duration-200;
  }
</style>
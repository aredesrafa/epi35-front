<!--
  Fichas Container - Orquestrador Principal Refatorado
  Responsabilidade: Coordenar componentes filhos e stores especializados
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    fichasStore, 
    fichasFiltersStore, 
    fichasUIStore, 
    fichasConfigStore,
    fichasQueryParams 
  } from '$lib/stores/fichas';
  
  import FichasFilters from './fichas/FichasFilters.svelte';
  import FichasTable from './fichas/FichasTable.svelte';
  import FichasActions from './fichas/FichasActions.svelte';
  import FichaDetailContainer from './FichaDetailContainer.svelte';
  
  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export let autoRefresh = false;

  // ==================== REACTIVE STATEMENTS ====================
  
  // Estados principais
  $: currentFichas = $fichasStore.items;
  $: isLoading = $fichasStore.loading;
  $: hasError = $fichasStore.error;
  $: pagination = $fichasStore.pagination;
  
  // Estados da UI
  $: showDetail = $fichasUIStore.showDetail;
  $: selectedFichaId = $fichasUIStore.selectedFichaId;
  $: showFilters = $fichasUIStore.showFilters;
  
  // Filtros (reativo - aplica automaticamente quando mudarem)
  $: {
    if ($fichasQueryParams && Object.keys($fichasQueryParams).length > 0) {
      applyFiltersDebounced();
    }
  }

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    // Inicializar configurações
    await fichasConfigStore.refreshAllOptions();
    
    // Inicializar store principal
    await fichasStore.initialize(initialPageSize);
    
    // Auto-refresh se habilitado
    if (autoRefresh) {
      fichasStore.startAutoRefresh();
    }
  });

  onDestroy(() => {
    fichasStore.stopAutoRefresh();
  });

  // ==================== DEBOUNCE PARA FILTROS ====================
  
  let filtersTimeout: NodeJS.Timeout;
  
  function applyFiltersDebounced() {
    clearTimeout(filtersTimeout);
    filtersTimeout = setTimeout(() => {
      fichasStore.applyFilters($fichasQueryParams);
    }, 300); // 300ms de debounce
  }

  // ==================== EVENT HANDLERS ====================
  
  // Seleção de fichas
  function handleFichaSelect(event: CustomEvent<string>) {
    const fichaId = event.detail;
    fichasUIStore.selectFicha(fichaId);
    fichasUIStore.openDetail(fichaId);
  }

  function handleMultipleSelect(event: CustomEvent<string[]>) {
    const fichaIds = event.detail;
    fichasUIStore.selectMultipleFichas(fichaIds);
  }

  // Paginação
  function handlePageChange(event: CustomEvent<number>) {
    const page = event.detail;
    fichasStore.loadPage(page);
  }

  // Busca
  function handleSearch(event: CustomEvent<string>) {
    const searchTerm = event.detail;
    fichasFiltersStore.setSearch(searchTerm);
  }

  // Refresh
  function handleRefresh() {
    fichasStore.refresh();
  }

  // Fechar detail
  function handleCloseDetail() {
    fichasUIStore.closeDetail();
  }

  // Ações de ficha
  function handleNovaFicha() {
    fichasUIStore.openNovaFichaModal();
  }

  function handleFichaCriada() {
    fichasUIStore.closeNovaFichaModal();
    fichasStore.refresh();
  }

  function handleFichaEditada() {
    fichasStore.refresh();
  }

  function handleFichaExcluida() {
    fichasUIStore.clearSelection();
    fichasStore.refresh();
  }

  // Bulk actions
  async function handleBulkAction(event: CustomEvent<{action: string, fichaIds: string[]}>) {
    const { action, fichaIds } = event.detail;
    
    fichasUIStore.setBulkActionLoading(true);
    
    try {
      switch (action) {
        case 'delete':
          // Implementar exclusão em lote
          break;
        case 'activate':
          // Implementar ativação em lote
          break;
        case 'deactivate':
          // Implementar desativação em lote
          break;
        default:
          console.warn('Ação não reconhecida:', action);
      }
      
      fichasStore.refresh();
    } catch (error) {
      console.error('Erro na ação em lote:', error);
    } finally {
      fichasUIStore.setBulkActionLoading(false);
    }
  }

  // Export
  async function handleExport(event: CustomEvent<{format: string, filters?: any}>) {
    const { format, filters } = event.detail;
    
    fichasUIStore.setExportLoading(true);
    
    try {
      // Implementar exportação
      console.log('Exportando:', format, filters);
    } catch (error) {
      console.error('Erro na exportação:', error);
    } finally {
      fichasUIStore.setExportLoading(false);
    }
  }
</script>

<!-- ==================== TEMPLATE ==================== -->

<div class="fichas-container h-full flex flex-col">
  <!-- Header com filtros e ações -->
  <div class="flex-shrink-0">
    <FichasFilters 
      on:search={handleSearch}
      on:refresh={handleRefresh}
    />
    
    <FichasActions 
      on:novaFicha={handleNovaFicha}
      on:bulkAction={handleBulkAction}
      on:export={handleExport}
    />
  </div>

  <!-- Tabela principal -->
  <div class="flex-1 min-h-0">
    <FichasTable 
      fichas={currentFichas}
      {pagination}
      loading={isLoading}
      error={hasError}
      on:selectFicha={handleFichaSelect}
      on:selectMultiple={handleMultipleSelect}
      on:pageChange={handlePageChange}
    />
  </div>

  <!-- Drawers e Modais -->
  {#if showDetail && selectedFichaId}
    <FichaDetailContainer
      fichaId={selectedFichaId}
      on:close={handleCloseDetail}
      on:fichaEditada={handleFichaEditada}
      on:fichaExcluida={handleFichaExcluida}
    />
  {/if}

  <!-- Modal Nova Ficha -->
  {#if $fichasUIStore.showNovaFichaModal}
    <!-- Implementar NovaFichaModal refatorado -->
    <div>Nova Ficha Modal (TODO)</div>
  {/if}
</div>

<style>
  .fichas-container {
    @apply bg-white dark:bg-gray-900;
  }
</style>
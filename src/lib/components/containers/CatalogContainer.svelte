<!--
  Catalog Container - Componente "Inteligente" com Enhanced Paginated Store
  
  Responsabilidades:
  - Gerenciar estado do catálogo com arquitetura unificada
  - Integração com enhanced store para performance otimizada
  - Lógica de filtros e paginação com debounce automático
  - Event handlers para CRUD
  - Delegação de UI para presenter
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { catalogAdapter, type TipoEPI } from '$lib/services/entity/catalogAdapter';
  import { createEnhancedPaginatedStore } from '$lib/stores/enhancedPaginatedStore';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  import { notify } from '$lib/stores';
  import CatalogTablePresenter from '$lib/components/presenters/CatalogTablePresenter.svelte';
  import EPIFormModalPresenter from '$lib/components/presenters/EPIFormModalPresenter.svelte';

  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export let autoRefresh = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    epiCreated: TipoEPI;
    epiUpdated: TipoEPI;
    epiDeleted: string;
  }>();

  // ==================== ENHANCED STORE ====================
  
  // Enhanced store com extração de filtros dos dados (sem endpoints específicos)
  const catalogStore = createEnhancedPaginatedStore<TipoEPI>({
    baseEndpoint: '/tipos-epi',
    defaultPageSize: initialPageSize,
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    autoRefresh,
    refreshInterval: autoRefresh ? 30000 : undefined,
    // Não usar filterEndpoints - extrair filtros dos dados principais
    filterEndpoints: {
      categorias: 'extract-from-data'
    }
  });

  // ==================== STATE ====================
  
  // Modal state
  let showEPIModal = false;
  let modalMode: 'create' | 'edit' | 'view' = 'create';
  let selectedEPI: TipoEPI | null = null;
  let epiFormLoading = false;

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('📋 CatalogContainer: Inicializando com Enhanced Store...');
    
    // Aguardar configurações de negócio
    await businessConfigStore.initialize();
    
    // Inicializar enhanced store (carrega dados e filtros automaticamente)
    await catalogStore.initialize();
    
    console.log('✅ CatalogContainer: Inicializado com Enhanced Store');
  });

  onDestroy(() => {
    catalogStore.destroy();
  });

  // ==================== FILTER HANDLERS ====================
  
  function handleSearchChange(value: string): void {
    catalogStore.search(value);
  }

  function handleCategoriaFilterChange(value: string): void {
    const filters = value === 'todas' ? {} : { categoria: value };
    catalogStore.applyFilters(filters);
  }


  function handleStatusFilterChange(value: string): void {
    const filters = value === 'todos' ? {} : { status: value };
    catalogStore.applyFilters(filters);
  }

  function handleClearFilters(): void {
    catalogStore.clearFilters();
  }

  // ==================== PAGINATION HANDLERS ====================
  
  function handlePageChange(page: number): void {
    catalogStore.goToPage(page);
  }

  function handlePageSizeChange(pageSize: number): void {
    catalogStore.loadData({ limit: pageSize, page: 1 });
  }

  // ==================== EPI CRUD HANDLERS ====================
  
  function handleNovoEPI(): void {
    selectedEPI = null;
    modalMode = 'create';
    showEPIModal = true;
  }

  function handleEditarEPI(epi: TipoEPI): void {
    selectedEPI = epi;
    modalMode = 'edit';
    showEPIModal = true;
  }

  function handleVisualizarEPI(epi: TipoEPI): void {
    selectedEPI = epi;
    modalMode = 'view';
    showEPIModal = true;
  }

  async function handleExcluirEPI(epi: TipoEPI): Promise<void> {
    try {
      await catalogAdapter.deleteTipoEPI(epi.id);
      
      notify.success('EPI removido', `${epi.nomeEquipamento} foi removido do catálogo`);
      
      // Recarregar dados usando enhanced store
      catalogStore.reload();
      
      // Emitir evento
      dispatch('epiDeleted', epi.id);
    } catch (error) {
      console.error('Erro ao excluir EPI:', error);
      notify.error('Erro ao excluir', 'Não foi possível remover o EPI do catálogo');
    }
  }

  // ==================== FORM MODAL HANDLERS ====================
  
  async function handleFormSave(formData: any): Promise<void> {
    epiFormLoading = true;
    
    try {
      let result: TipoEPI;
      
      if (modalMode === 'create') {
        result = await catalogAdapter.createTipoEPI(formData);
        notify.success('EPI criado', `${result.nomeEquipamento} foi adicionado ao catálogo`);
        dispatch('epiCreated', result);
      } else {
        result = await catalogAdapter.updateTipoEPI(selectedEPI!.id, formData);
        notify.success('EPI atualizado', `${result.nomeEquipamento} foi atualizado no catálogo`);
        dispatch('epiUpdated', result);
      }
      
      // Recarregar dados usando enhanced store
      catalogStore.reload();
      
      // Fechar modal
      showEPIModal = false;
      selectedEPI = null;
      
    } catch (error) {
      console.error('Erro ao salvar EPI:', error);
      notify.error('Erro ao salvar', 'Não foi possível salvar o EPI');
    } finally {
      epiFormLoading = false;
    }
  }

  function handleFormCancel(): void {
    showEPIModal = false;
    selectedEPI = null;
    epiFormLoading = false;
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: modalTitle = modalMode === 'create' ? 'Novo EPI' : 
    modalMode === 'edit' ? 'Editar EPI' : 'Visualizar EPI';

  // ==================== DERIVED FILTER OPTIONS ====================
  
  // Extrair opções de filtros dos metadados do enhanced store
  $: categoriaOptions = [
    { value: 'todas', label: 'Todas as Categorias' },
    ...($catalogStore.filterMetadata.categorias || [])
  ];


  // ==================== PRESENTER PROPS ====================
  
  $: presentationData = {
    items: $catalogStore.items,
    loading: $catalogStore.loading,
    error: $catalogStore.error,
    pagination: {
      currentPage: $catalogStore.pagination.page,
      totalPages: $catalogStore.pagination.totalPages,
      pageSize: $catalogStore.pagination.limit,
      total: $catalogStore.pagination.total,
      hasNext: $catalogStore.pagination.hasNextPage,
      hasPrev: $catalogStore.pagination.hasPreviousPage
    },
    filters: {
      searchTerm: $catalogStore.search,
      categoriaFilter: $catalogStore.filters.categoria || 'todas',
      statusFilter: $catalogStore.filters.status || 'todos',
      hasActiveFilters: $catalogStore.hasFilters
    },
    filterOptions: {
      categorias: categoriaOptions
    }
  };
</script>

<!-- Usar presenter com dados do enhanced store -->
<CatalogTablePresenter
  items={presentationData.items}
  loading={presentationData.loading}
  error={presentationData.error}
  pagination={presentationData.pagination}
  filters={presentationData.filters}
  filterOptions={presentationData.filterOptions}
  on:searchChange={(e) => handleSearchChange(e.detail)}
  on:categoriaFilterChange={(e) => handleCategoriaFilterChange(e.detail)}
  on:statusFilterChange={(e) => handleStatusFilterChange(e.detail)}
  on:clearFilters={handleClearFilters}
  on:pageChange={(e) => handlePageChange(e.detail)}
  on:pageSizeChange={(e) => handlePageSizeChange(e.detail)}
  on:novoEPI={handleNovoEPI}
  on:editarEPI={(e) => handleEditarEPI(e.detail)}
  on:visualizarEPI={(e) => handleVisualizarEPI(e.detail)}
  on:excluirEPI={(e) => handleExcluirEPI(e.detail)}
/>

<!-- Modal de Formulário EPI -->
<EPIFormModalPresenter
  show={showEPIModal}
  mode={modalMode}
  title={modalTitle}
  epi={selectedEPI}
  loading={epiFormLoading}
  on:salvar={(e) => handleFormSave(e.detail)}
  on:cancelar={handleFormCancel}
/>
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
  import { catalogAdapter, type TipoEPI, type CatalogFilterParams, type CreateTipoEPIData } from '$lib/services/entity/catalogAdapter';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  import { notify } from '$lib/stores';
  import CatalogTablePresenter from '$lib/components/presenters/CatalogTablePresenter.svelte';
  import EPIDetailDrawer from '$lib/components/presenters/EPIDetailDrawer.svelte';

  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export const autoRefresh = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    epiCreated: TipoEPI;
    epiUpdated: TipoEPI;
    epiDeleted: string;
  }>();

  // ==================== PAGINATED STORE ====================
  
  // Store para catálogo com paginação server-side
  const catalogStore = createPaginatedStore<TipoEPI>(
    (params) => {
      // Convert PaginationParams to CatalogFilterParams
      const catalogParams: CatalogFilterParams = {
        search: params.search,
        categoria: params.categoria,
        status: params.status,
        ativo: typeof params.ativo === 'string' ? params.ativo === 'true' : params.ativo,
        page: params.page,
        pageSize: params.pageSize,
        limit: params.limit
      };
      return catalogAdapter.getTiposEPI(catalogParams);
    },
    {
      initialPageSize: initialPageSize,
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutos
      debounceDelay: 300
    }
  );

  // ==================== STATE ====================
  
  // Drawer state
  let showEPIDrawer = false;
  let drawerMode: 'create' | 'edit' | 'view' = 'view';
  let selectedEPI: TipoEPI | null = null;
  let epiDrawerLoading = false;

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('📋 CatalogContainer: Inicializando (versão corrigida)...');
    
    try {
      // Aguardar configurações de negócio
      await businessConfigStore.initialize();
      
      // Carregar dados iniciais
      await catalogStore.fetchPage();
      
      console.log('✅ CatalogContainer: Inicializado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro na inicialização do CatalogContainer:', error);
    }
  });

  onDestroy(() => {
    // Cleanup se necessário
  });

  // ==================== FILTER HANDLERS ====================
  
  // Estado dos filtros
  let searchTerm = '';
  let categoriaFilter = 'todas';
  let statusFilter = 'todos';
  
  function handleSearchChange(value: string): void {
    searchTerm = value;
    catalogStore.setSearch(value);
  }

  function handleCategoriaFilterChange(value: string): void {
    categoriaFilter = value;
    applyFiltersToStore();
  }

  function handleStatusFilterChange(value: string): void {
    statusFilter = value;
    applyFiltersToStore();
  }

  function handleClearFilters(): void {
    searchTerm = '';
    categoriaFilter = 'todas';
    statusFilter = 'todos';
    applyFiltersToStore();
  }
  
  function applyFiltersToStore(): void {
    const filters: any = {};
    
    if (categoriaFilter !== 'todas') {
      filters.categoria = categoriaFilter;
    }
    
    if (statusFilter !== 'todos') {
      filters.status = statusFilter;
    }
    
    catalogStore.setFilters(filters);
  }

  // ==================== PAGINATION HANDLERS ====================
  
  function handlePageChange(page: number): void {
    catalogStore.goToPage(page);
  }

  function handlePageSizeChange(pageSize: number): void {
    catalogStore.fetchPage({ limit: pageSize, page: 1 });
  }

  // ==================== EPI CRUD HANDLERS ====================
  
  function handleNovoEPI(): void {
    selectedEPI = null;
    drawerMode = 'create';
    showEPIDrawer = true;
  }

  function handleEditarEPI(epi: TipoEPI): void {
    selectedEPI = epi;
    drawerMode = 'edit';
    showEPIDrawer = true;
  }

  function handleVisualizarEPI(epi: TipoEPI): void {
    selectedEPI = epi;
    drawerMode = 'view';
    showEPIDrawer = true;
  }

  async function handleExcluirEPI(epi: TipoEPI): Promise<void> {
    try {
      await catalogAdapter.deleteTipoEPI(epi.id);
      
      notify.success('EPI removido', `${epi.nomeEquipamento} foi removido do catálogo`);
      
      // Recarregar dados usando enhanced store
      catalogStore.reload();
      
      // Emitir evento
      dispatch('epiDeleted', epi.id);
    } catch (error: any) {
      console.error('Erro ao excluir EPI:', error);
      notify.error('Erro ao excluir', 'Não foi possível remover o EPI do catálogo');
    }
  }

  // ==================== DRAWER HANDLERS ====================
  
  async function handleDrawerSave(event: CustomEvent<Partial<TipoEPI>>): Promise<void> {
    epiDrawerLoading = true;
    
    try {
      const formData = event.detail;
      let result: TipoEPI;
      
      if (drawerMode === 'create') {
        // Ensure required fields are present for create
        const createData: CreateTipoEPIData = {
          nomeEquipamento: formData.nomeEquipamento || '',
          numeroCa: formData.numeroCa || formData.numeroCA || '',
          categoria: formData.categoria || '',
          vidaUtilDias: formData.vidaUtilDias || formData.validadePadrao,
          descricao: formData.descricao
        };
        result = await catalogAdapter.createTipoEPI(createData);
        notify.success('EPI criado', `${result.nomeEquipamento} foi adicionado ao catálogo`);
        dispatch('epiCreated', result);
      } else {
        result = await catalogAdapter.updateTipoEPI(selectedEPI!.id, formData);
        notify.success('EPI atualizado', `${result.nomeEquipamento} foi atualizado no catálogo`);
        dispatch('epiUpdated', result);
      }
      
      // Recarregar dados
      catalogStore.reload();
      
      // Fechar drawer
      showEPIDrawer = false;
      selectedEPI = null;
      
    } catch (error: any) {
      console.error('Erro ao salvar EPI:', error);
      notify.error('Erro ao salvar', 'Não foi possível salvar o EPI');
    } finally {
      epiDrawerLoading = false;
    }
  }

  function handleDrawerClose(): void {
    showEPIDrawer = false;
    selectedEPI = null;
    epiDrawerLoading = false;
  }

  function handleDrawerEdit(): void {
    drawerMode = 'edit';
  }

  // ==================== COMPUTED PROPERTIES ====================

  // ==================== FILTER OPTIONS ====================
  
  // Opções de filtros carregadas do backend
  $: categoriaOptions = [
    { value: 'todas', label: 'Todas as Categorias' },
    { value: 'PROTECAO_CABECA', label: 'Proteção da Cabeça' },
    { value: 'PROTECAO_OLHOS_ROSTO', label: 'Proteção dos Olhos e Rosto' },
    { value: 'PROTECAO_OUVIDOS', label: 'Proteção Auditiva' },
    { value: 'PROTECAO_RESPIRATORIA', label: 'Proteção Respiratória' },
    { value: 'PROTECAO_MAOS_BRACCOS', label: 'Proteção das Mãos e Braços' },
    { value: 'PROTECAO_PES', label: 'Proteção dos Pés' },
    { value: 'PROTECAO_CLIMATICA', label: 'Proteção Climática' },
    { value: 'ROUPA_APROXIMACAO', label: 'Roupa de Aproximação' }
  ];

  // ==================== COMPUTED PROPERTIES ====================
  
  $: hasActiveFilters = searchTerm !== '' || 
    categoriaFilter !== 'todas' || 
    statusFilter !== 'todos';

  // ==================== PRESENTER PROPS ====================
  
  $: presentationData = {
    items: $catalogStore.items,
    loading: $catalogStore.loading,
    error: $catalogStore.error,
    pagination: {
      currentPage: $catalogStore.page,
      totalPages: $catalogStore.totalPages,
      pageSize: $catalogStore.pageSize,
      total: $catalogStore.total,
      hasNext: catalogStore.hasNext(),
      hasPrev: catalogStore.hasPrev()
    },
    filters: {
      searchTerm,
      categoriaFilter,
      statusFilter,
      hasActiveFilters
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

<!-- Drawer de Detalhes EPI -->
<EPIDetailDrawer
  open={showEPIDrawer}
  mode={drawerMode}
  epi={selectedEPI}
  loading={epiDrawerLoading}
  on:save={handleDrawerSave}
  on:close={handleDrawerClose}
  on:edit={handleDrawerEdit}
/>
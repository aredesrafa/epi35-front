<!--
  Fichas Container - Componente "Inteligente" com Enhanced Store
  
  Responsabilidades:
  - Gerenciar estado das fichas com arquitetura unificada
  - Integração com enhanced store para performance otimizada
  - Lógica de filtros e paginação com debounce automático
  - Event handlers para CRUD de fichas
  - Delegação de UI para presenter
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  // 🚀 MIGRADO: Usar novo adapter de consultas
  import { fichaQueryAdapter } from '$lib/services/process';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  import { notify } from '$lib/stores';
  import FichasTablePresenter from '../presenters/FichasTablePresenter.svelte';
  import FichaDetailContainer from '../containers/FichaDetailContainer.svelte';
  import type { FichaEPIDTO } from '$lib/types/serviceTypes';

  // ==================== PROPS ====================
  
  export let initialPageSize: number = 10;
  export let autoRefresh: boolean = false;
  export let refreshInterval: number = 30000;

  // ==================== ENHANCED STORE ====================
  
  // 🚀 MIGRADO: Store paginado usando método transitório do novo adapter
  const fichasStore = createPaginatedStore(
    (params) => fichaQueryAdapter.getFichasWithColaboradores({
      page: params.page || 1,
      limit: params.limit || initialPageSize,
      searchTerm: params.search || undefined,
      empresaFilter: params.empresa !== 'todas' ? params.empresa : undefined,
      cargoFilter: params.cargo !== 'todos' ? params.cargo : undefined,
      statusFilter: params.status !== 'todos' ? params.status : undefined,
      devolucaoPendente: !!params.devolucaoPendente
    }).then(response => ({
      data: response.fichas,
      total: response.total,
      page: response.page || params.page || 1,
      pageSize: response.pageSize || params.limit || initialPageSize,
      totalPages: Math.ceil(response.total / (params.limit || initialPageSize))
    })),
    { initialPageSize }
  );
  
  // Estado local para modais
  let showDetail = false;
  let selectedFichaId: string | null = null;

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('🚀 FichasContainer: Inicializando...');
    
    // Aguardar configurações de negócio
    await businessConfigStore.initialize();
    
    // Carregar dados iniciais
    await loadFichasData();
    
    console.log('✅ FichasContainer: Inicializado com sucesso');
  });
  
  // ==================== DATA LOADING ====================
  
  async function loadFichasData(): Promise<void> {
    try {
      await fichasStore.fetchPage();
      console.log('📋 Dados de fichas carregados');
    } catch (error) {
      console.error('❌ Erro ao carregar fichas:', error);
      notify.error('Erro ao carregar fichas', 'Não foi possível carregar os dados das fichas');
    }
  }
  
  // ==================== FILTER HANDLERS ====================
  
  // Filtros reativos
  let filters = {
    empresa: 'todas',
    cargo: 'todos', 
    devolucaoPendente: false
  };
  let searchTerm = '';

  function handleSearchChange(value: string): void {
    searchTerm = value;
    applyFilters();
  }

  function handleEmpresaFilterChange(value: string): void {
    filters = { ...filters, empresa: value };
    applyFilters();
  }

  function handleCargoFilterChange(value: string): void {
    filters = { ...filters, cargo: value };
    applyFilters();
  }


  function handleDevolucaoPendenteChange(checked: boolean): void {
    filters = { ...filters, devolucaoPendente: checked };
    applyFilters();
  }

  function handleClearFilters(): void {
    searchTerm = '';
    filters = { empresa: 'todas', cargo: 'todos', devolucaoPendente: false };
    applyFilters();
  }

  /**
   * Aplica filtros de forma reativa
   */
  function applyFilters(): void {
    const activeFilters: Record<string, any> = {};
    
    // Adicionar busca se não estiver vazia
    if (searchTerm && searchTerm.trim() !== '') {
      activeFilters.search = searchTerm.trim();
    }
    
    // Adicionar filtros apenas se diferentes dos valores padrão
    if (filters.empresa && filters.empresa !== 'todas') {
      activeFilters.empresa = filters.empresa;
    }
    
    if (filters.cargo && filters.cargo !== 'todos') {
      activeFilters.cargo = filters.cargo;
    }


    if (filters.devolucaoPendente) {
      activeFilters.devolucaoPendente = true;
    }
    
    console.log('🔧 Aplicando filtros de fichas:', activeFilters);
    fichasStore.setFilters(activeFilters);
  }
  
  // ==================== PAGINATION HANDLERS ====================
  
  function handlePageChange(page: number): void {
    fichasStore.goToPage(page);
  }

  function handlePageSizeChange(pageSize: number): void {
    console.log('Page size change solicitado para fichas:', pageSize);
  }
  
  // ==================== FICHA HANDLERS ====================
  
  function handleViewDetail(fichaId: string): void {
    selectedFichaId = fichaId;
    showDetail = true;
    console.log('👀 Abrindo detalhes da ficha:', fichaId);
  }

  function handleCloseDetail(): void {
    showDetail = false;
    selectedFichaId = null;
  }

  function handleFichaUpdated(): void {
    console.log('🔄 Ficha atualizada, recarregando lista');
    loadFichasData();
  }

  function handleRefresh(): void {
    loadFichasData();
  }

  function handleNovaFicha(): void {
    // TODO: Implementar modal de nova ficha
    console.log('➕ Nova ficha');
  }
  
  // ==================== COMPUTED PROPERTIES ====================
  
  // Opções de filtros (hardcoded por enquanto, podem ser carregadas dinamicamente depois)
  $: empresaOptions = [
    { value: 'todas', label: 'Todas as Empresas' }
    // TODO: Carregar dinamicamente do backend
  ];

  $: cargoOptions = [
    { value: 'todos', label: 'Todos os Cargos' }
    // TODO: Carregar dinamicamente do backend
  ];


  // Verificar se há filtros ativos
  $: hasActiveFilters = searchTerm !== '' || 
    filters.empresa !== 'todas' || 
    filters.cargo !== 'todos' ||
    filters.devolucaoPendente;
  
  // ==================== PRESENTER PROPS ====================
  
  $: presentationData = {
    items: $fichasStore.items || [],
    loading: $fichasStore.loading,
    error: $fichasStore.error,
    pagination: {
      currentPage: $fichasStore.page,
      totalPages: $fichasStore.totalPages,
      pageSize: $fichasStore.pageSize,
      total: $fichasStore.total,
      hasNext: fichasStore.hasNext(),
      hasPrev: fichasStore.hasPrev()
    },
    filters: {
      searchTerm,
      empresaFilter: filters.empresa,
      cargoFilter: filters.cargo,
      devolucaoPendente: filters.devolucaoPendente,
      hasActiveFilters
    },
    filterOptions: {
      empresas: empresaOptions,
      cargos: cargoOptions
    }
  };
</script>

<!-- Presenter com dados do store legado -->
<FichasTablePresenter
  items={presentationData.items}
  loading={presentationData.loading}
  error={presentationData.error}
  pagination={presentationData.pagination}
  filters={presentationData.filters}
  filterOptions={presentationData.filterOptions}
  on:searchChange={(e) => handleSearchChange(e.detail)}
  on:empresaFilterChange={(e) => handleEmpresaFilterChange(e.detail)}
  on:cargoFilterChange={(e) => handleCargoFilterChange(e.detail)}
  on:devolucaoPendenteChange={(e) => handleDevolucaoPendenteChange(e.detail)}
  on:clearFilters={handleClearFilters}
  on:pageChange={(e) => handlePageChange(e.detail)}
  on:pageSizeChange={(e) => handlePageSizeChange(e.detail)}
  on:viewDetail={(e) => handleViewDetail(e.detail)}
  on:refresh={handleRefresh}
  on:novaFicha={handleNovaFicha}
/>

<!-- Modal de detalhes -->
{#if showDetail}
  <FichaDetailContainer
    bind:open={showDetail}
    fichaId={selectedFichaId}
    on:close={handleCloseDetail}
    on:fichaUpdated={handleFichaUpdated}
  />
{/if}
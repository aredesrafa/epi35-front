<!--
  Inventory Container - Componente "Inteligente" com Enhanced Store
  
  Responsabilidades:
  - Gerenciar estado do estoque com arquitetura unificada
  - Integração com enhanced store para performance otimizada
  - Lógica de filtros e paginação com debounce automático
  - Event handlers para movimentações de estoque
  - Delegação de UI para presenter
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    inventoryCommandAdapter, 
    entityManagementAdapter,
    businessConfigStore,
    statusEstoqueOptions,
    categoriasEPIOptions
  } from '$lib/services';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import { notify } from '$lib/stores';
  import InventoryTablePresenter from '../presenters/InventoryTablePresenter.svelte';
  import MovementModalPresenter from '../presenters/MovementModalPresenter.svelte';
  import HistoryModalPresenter from '../presenters/HistoryModalPresenter.svelte';
  import type { 
    ItemEstoqueDTO, 
    NovaMovimentacaoForm,
    MovimentacaoEstoqueDTO,
    TipoEPIDTO,
    AlmoxarifadoDTO 
  } from '$lib/types/serviceTypes';
  
  // ==================== PROPS ====================
  
  export let initialPageSize: number = 20;
  export let autoRefresh: boolean = false;
  export let refreshInterval: number = 30000;
  
  // ==================== ENHANCED STORE ====================
  
  // Store paginado usando o service adapter para transformação correta dos dados
  const inventoryStore = createPaginatedStore(
    (params) => inventoryCommandAdapter.getInventoryItems({
      ...params,
      includeExpanded: true // Incluir dados de tipoEPI e almoxarifado
    }),
    { initialPageSize }
  );
  
  // Estado local para modais
  let showMovementModal = false;
  let showHistoryModal = false;
  let selectedItem: ItemEstoqueDTO | null = null;
  let selectedItemForHistory: ItemEstoqueDTO | null = null;
  let movementLoading = false;
  let historyLoading = false;
  let historyError: string | null = null;
  let movimentacoes: MovimentacaoEstoqueDTO[] = [];
  let historyPeriod = '30';
  
  // Dados auxiliares
  let tiposEPI: TipoEPIDTO[] = [];
  let almoxarifados: AlmoxarifadoDTO[] = [];
  
  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('🚀 InventoryContainer: Inicializando...');
    
    // Aguardar configurações de negócio
    await businessConfigStore.initialize();
    
    // Carregar dados auxiliares
    await loadAuxiliaryData();
    
    // Carregar dados iniciais
    await loadInventoryData();
    
    console.log('✅ InventoryContainer: Inicializado com sucesso');
  });
  
  // ==================== DATA LOADING ====================
  
  /**
   * Carrega dados de inventário
   */
  async function loadInventoryData(): Promise<void> {
    try {
      await inventoryStore.fetchPage();
      console.log('📦 Dados de inventário carregados');
    } catch (error) {
      console.error('❌ Erro ao carregar inventário:', error);
      notify.error('Erro ao carregar inventário', 'Não foi possível carregar os dados do estoque');
    }
  }
  
  /**
   * Carrega dados auxiliares (tipos EPI, almoxarifados)
   */
  async function loadAuxiliaryData(): Promise<void> {
    try {
      const [tiposResponse, almoxarifadosResponse] = await Promise.all([
        entityManagementAdapter.getTiposEPI({ ativo: true }),
        entityManagementAdapter.getAlmoxarifados({ ativo: true })
      ]);
      
      tiposEPI = tiposResponse.data || [];
      almoxarifados = almoxarifadosResponse;
      
      console.log(`📋 Carregados ${tiposEPI.length} tipos EPI e ${almoxarifados.length} almoxarifados`);
    } catch (error) {
      console.error('❌ Erro ao carregar dados auxiliares:', error);
    }
  }
  
  // ==================== FILTER HANDLERS ====================
  
  // Filtros reativos
  let filters = {
    status: 'todos',
    categoria: 'todas'
  };
  let searchTerm = '';

  function handleSearchChange(value: string): void {
    searchTerm = value;
    applyFilters();
  }

  function handleStatusFilterChange(value: string): void {
    filters = { ...filters, status: value };
    applyFilters();
  }

  function handleCategoriaFilterChange(value: string): void {
    filters = { ...filters, categoria: value };
    applyFilters();
  }

  function handleClearFilters(): void {
    searchTerm = '';
    filters = { status: 'todos', categoria: 'todas' };
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
    if (filters.status && filters.status !== 'todos') {
      activeFilters.status = filters.status;
    }
    
    if (filters.categoria && filters.categoria !== 'todas') {
      activeFilters.categoria = filters.categoria;
    }
    
    console.log('🔧 Aplicando filtros:', activeFilters);
    inventoryStore.setFilters(activeFilters);
  }
  
  // ==================== PAGINATION HANDLERS ====================
  
  function handlePageChange(page: number): void {
    inventoryStore.goToPage(page);
  }

  function handlePageSizeChange(pageSize: number): void {
    // Funcionalidade complexa - pode ser implementada depois
    console.log('Page size change solicitado:', pageSize);
  }
  
  /**
   * Handler para edição de item
   */
  function handleItemEdit(event: CustomEvent<{ item: ItemEstoqueDTO }>): void {
    selectedItem = event.detail.item;
    showMovementModal = true;
    console.log('✏️ Editando item:', selectedItem.id);
  }
  
  /**
   * Handler para histórico de item
   */
  async function handleItemHistory(event: CustomEvent<{ item: ItemEstoqueDTO }>): Promise<void> {
    selectedItemForHistory = event.detail.item;
    showHistoryModal = true;
    await loadItemHistory();
    console.log('📊 Abrindo histórico do item:', selectedItemForHistory.id);
  }

  /**
   * Carrega histórico de movimentações do item
   */
  async function loadItemHistory(): Promise<void> {
    if (!selectedItemForHistory) return;
    
    historyLoading = true;
    historyError = null;
    
    try {
      const history = await inventoryCommandAdapter.getItemMovementHistory(
        selectedItemForHistory.id,
        { 
          limit: 100,
          // Filtrar por período se necessário
          dataInicio: getDateFromPeriod(historyPeriod)
        }
      );
      
      movimentacoes = history;
      console.log(`📊 Carregado histórico: ${history.length} movimentações`);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      historyError = error instanceof Error ? error.message : 'Erro desconhecido';
    } finally {
      historyLoading = false;
    }
  }

  /**
   * Calcula data inicial baseada no período selecionado
   */
  function getDateFromPeriod(period: string): string {
    const now = new Date();
    const days = parseInt(period);
    const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return pastDate.toISOString().split('T')[0];
  }
  
  /**
   * Handler para salvar movimentação
   */
  async function handleMovementSave(event: CustomEvent<NovaMovimentacaoForm>): Promise<void> {
    movementLoading = true;
    
    try {
      console.log('💾 Salvando movimentação:', event.detail);
      
      // Usar o service adapter para registrar movimentação
      const result = await inventoryCommandAdapter.registerMovement(event.detail);
      
      console.log('✅ Movimentação registrada:', result.id);
      
      // Fechar modal
      showMovementModal = false;
      selectedItem = null;
      
      // Recarregar dados
      await loadInventoryData();
      
      notify.success(
        'Movimentação registrada', 
        `${event.detail.tipoMovimentacao} de ${event.detail.quantidade} unidades`
      );
      
    } catch (error) {
      console.error('❌ Erro ao salvar movimentação:', error);
      notify.error('Erro ao salvar', 'Não foi possível registrar a movimentação');
    } finally {
      movementLoading = false;
    }
  }
  
  /**
   * Handler para cancelar movimentação
   */
  function handleMovementCancel(): void {
    showMovementModal = false;
    selectedItem = null;
    console.log('❌ Movimentação cancelada');
  }
  
  // Handlers duplicados removidos - usando os do enhanced store

  /**
   * Handler para fechar modal de histórico
   */
  function handleHistoryClose(): void {
    showHistoryModal = false;
    selectedItemForHistory = null;
    movimentacoes = [];
    historyError = null;
    console.log('❌ Modal de histórico fechado');
  }

  /**
   * Handler para mudança de período no histórico
   */
  async function handleHistoryPeriodChange(event: CustomEvent<{ period: string }>): Promise<void> {
    historyPeriod = event.detail.period;
    await loadItemHistory();
    console.log('📅 Período do histórico alterado:', historyPeriod);
  }
  
  /**
   * Handler para nova movimentação
   */
  function handleNewMovement(): void {
    selectedItem = null; // Nova movimentação não tem item específico
    showMovementModal = true;
    console.log('➕ Nova movimentação');
  }
  
  // ==================== COMPUTED PROPERTIES ====================
  
  // Opções para dropdowns baseadas em configuração dinâmica
  $: statusOptions = [
    { value: 'todos', label: 'Todos os Status' },
    ...$statusEstoqueOptions
  ];
  
  $: categoriaOptions = [
    { value: 'todas', label: 'Todas as Categorias' },
    ...$categoriasEPIOptions
  ];
  
  // Opções de almoxarifado
  $: almoxarifadoOptions = [
    { value: '', label: 'Todos os Almoxarifados' },
    ...almoxarifados.map(alm => ({ value: alm.id, label: alm.nome }))
  ];

  // Verificar se há filtros ativos
  $: hasActiveFilters = searchTerm !== '' || 
    filters.status !== 'todos' || 
    filters.categoria !== 'todas';
  
  // ==================== PRESENTER PROPS ====================
  
  $: presentationData = {
    items: $inventoryStore.items || [],
    loading: $inventoryStore.loading,
    error: $inventoryStore.error,
    pagination: {
      currentPage: $inventoryStore.page,
      totalPages: $inventoryStore.totalPages,
      pageSize: $inventoryStore.pageSize,
      total: $inventoryStore.total,
      hasNext: inventoryStore.hasNext(),
      hasPrev: inventoryStore.hasPrev()
    },
    filters: {
      searchTerm,
      statusFilter: filters.status,
      categoriaFilter: filters.categoria,
      hasActiveFilters
    },
    filterOptions: {
      status: statusOptions,
      categorias: categoriaOptions
    }
  };
</script>

<!-- 
  O Container não possui HTML próprio - apenas gerencia estado e lógica.
  Todo o HTML fica no Presenter, que é "burro" e apenas recebe dados e emite eventos.
-->

<!-- Presenter com dados do store legado -->
<InventoryTablePresenter
  items={presentationData.items}
  loading={presentationData.loading}
  error={presentationData.error}
  total={presentationData.pagination.total}
  page={presentationData.pagination.currentPage}
  totalPages={presentationData.pagination.totalPages}
  searchTerm={presentationData.filters.searchTerm}
  filters={{
    status: presentationData.filters.statusFilter,
    categoria: presentationData.filters.categoriaFilter
  }}
  categoriaOptions={presentationData.filterOptions.categorias}
  on:searchChange={(e) => handleSearchChange(e.detail.value)}
  on:filterChange={(e) => {
    if (e.detail.key === 'status') {
      handleStatusFilterChange(e.detail.value);
    } else if (e.detail.key === 'categoria') {
      handleCategoriaFilterChange(e.detail.value);
    }
  }}
  on:clearFilters={handleClearFilters}
  on:pageChange={(e) => handlePageChange(e.detail.page)}
  on:itemEdit={(e) => handleItemEdit(e.detail.item)}
  on:itemHistory={(e) => handleItemHistory(e.detail.item)}
  on:newMovement={handleNewMovement}
/>

{#if showMovementModal}
  <MovementModalPresenter
    item={selectedItem}
    {tiposEPI}
    {almoxarifados}
    loading={movementLoading}
    show={showMovementModal}
    on:save={handleMovementSave}
    on:cancel={handleMovementCancel}
  />
{/if}

{#if showHistoryModal}
  <HistoryModalPresenter
    item={selectedItemForHistory}
    {movimentacoes}
    loading={historyLoading}
    error={historyError}
    show={showHistoryModal}
    on:close={handleHistoryClose}
    on:filterChange={handleHistoryPeriodChange}
  />
{/if}
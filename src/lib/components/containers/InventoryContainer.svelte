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
  import HistoryModal from '../presenters/HistoryModal.svelte';
  import NotesDetailDrawer from '../presenters/NotesDetailDrawer.svelte';
  import { kardexAdapter } from '$lib/services/entity/kardexAdapter';
  import type { 
    ItemEstoqueDTO, 
    NovaMovimentacaoForm,
    MovimentacaoEstoqueDTO,
    TipoEPIDTO,
    AlmoxarifadoDTO 
  } from '$lib/types/serviceTypes';
  import type { KardexData } from '$lib/services/entity/kardexAdapter';
  
  // ==================== PROPS ====================
  
  export let initialPageSize: number = 20;
  export let key: string = 'default'; // Para identificar qual tab está ativa
  export let statusFilter: string = ''; // Filtro de status para a tab
  export const autoRefresh: boolean = false;
  export const refreshInterval: number = 30000;
  
  // Evento para notificar mudanças nos dados
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
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
  let showNotesDrawer = false;
  let selectedItem: ItemEstoqueDTO | null = null;
  let selectedItemForHistory: ItemEstoqueDTO | null = null;
  let movementLoading = false;
  let historyLoading = false;
  let historyError: string | null = null;
  let kardexData: KardexData | null = null;
  
  // Dados auxiliares
  let tiposEPI: TipoEPIDTO[] = [];
  let almoxarifados: AlmoxarifadoDTO[] = [];
  
  // Estado de inicialização para evitar flash do empty state
  let initializing = true;
  
  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('🚨 CONTAINER INICIADO: InventoryContainer carregando...', { key, statusFilter });
    
    try {
      // Aguardar configurações de negócio
      await businessConfigStore.initialize();
      
      // Carregar dados auxiliares
      await loadAuxiliaryData();
      
      // Aplicar filtro de status se fornecido
      if (statusFilter) {
        console.log('🔍 Aplicando filtro de status automático:', statusFilter);
        filters = { ...filters, status: statusFilter };
        // CRÍTICO: Aplicar filtros ao store após definir o statusFilter
        applyFilters();
      }
      
      // Carregar dados iniciais
      console.log('🚨 CHAMANDO loadInventoryData...');
      await loadInventoryData();
      
      console.log('✅ InventoryContainer: Inicializado com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar InventoryContainer:', error);
    } finally {
      // Finalizar inicialização após carregar dados ou erro
      initializing = false;
    }
  });
  
  // ==================== DATA LOADING ====================
  
  /**
   * Carrega dados de inventário
   */
  async function loadInventoryData(): Promise<void> {
    try {
      await inventoryStore.fetchPage();
      console.log('📦 Dados de inventário carregados');
    } catch (error: any) {
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
    } catch (error: any) {
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
    
    // CRÍTICO: statusFilter da tab tem prioridade ABSOLUTA
    if (statusFilter && statusFilter !== '') {
      activeFilters.status = statusFilter;
      console.log('🎯 FILTRO DE TAB APLICADO:', statusFilter);
    } else if (filters.status && filters.status !== 'todos') {
      activeFilters.status = filters.status;
      console.log('🔧 Filtro manual de status aplicado:', filters.status);
    }
    
    if (filters.categoria && filters.categoria !== 'todas') {
      activeFilters.categoria = filters.categoria;
    }
    
    console.log('🔧 Aplicando filtros finais:', activeFilters, { 
      statusFilter, 
      manualStatus: filters.status,
      key: key 
    });
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
   * Carrega histórico de movimentações do item usando kardexAdapter
   */
  async function loadItemHistory(dataInicio?: string, dataFim?: string): Promise<void> {
    if (!selectedItemForHistory) return;
    
    historyLoading = true;
    historyError = null;
    kardexData = null;
    
    try {
      console.log('📊 DEBUG: Item selecionado para histórico:', selectedItemForHistory);
      console.log('📊 DEBUG: Campos disponíveis:', Object.keys(selectedItemForHistory));
      
      // Verificar múltiplos possíveis nomes de campo para compatibilidade
      const almoxarifadoId = selectedItemForHistory.almoxarifadoId || 
                            selectedItemForHistory.almoxarifado?.id ||
                            selectedItemForHistory.almoxarife_id;
      
      const tipoEpiId = selectedItemForHistory.tipoEPIId || 
                       selectedItemForHistory.tipoEpiId ||
                       selectedItemForHistory.tipo_epi_id ||
                       selectedItemForHistory.tipoEPI?.id;

      console.log('📊 DEBUG: IDs extraídos:', { almoxarifadoId, tipoEpiId });

      // Verificar se conseguimos extrair os IDs necessários
      if (!almoxarifadoId || !tipoEpiId) {
        console.error('❌ DEBUG: IDs não encontrados:', {
          almoxarifadoId: !!almoxarifadoId,
          tipoEpiId: !!tipoEpiId,
          itemCompleto: selectedItemForHistory
        });
        throw new Error(`Item não possui dados necessários para buscar histórico. Almoxarifado: ${!!almoxarifadoId}, TipoEPI: ${!!tipoEpiId}`);
      }

      const params = {
        almoxarifadoId: almoxarifadoId,
        tipoEpiId: tipoEpiId,
        dataInicio,
        dataFim
      };

      console.log('📊 Buscando kardex com parâmetros:', params);
      
      kardexData = await kardexAdapter.obterKardex(params);
      
      console.log(`📊 Kardex carregado: ${kardexData.movimentacoes.length} movimentações`);
      console.log('📊 RESPOSTA COMPLETA DO KARDEX:', {
        saldoInicial: kardexData.saldoInicial,
        saldoFinal: kardexData.saldoFinal,
        totalEntradas: kardexData.totalEntradas,
        totalSaidas: kardexData.totalSaidas,
        primeiraMovimentacao: kardexData.movimentacoes[0],
        ultimaMovimentacao: kardexData.movimentacoes[kardexData.movimentacoes.length - 1],
        movimentacoesCompletas: kardexData.movimentacoes
      });
      
      // ANÁLISE DE INCONSISTÊNCIA: Comparar estoque atual vs kardex
      const estoqueAtual = selectedItemForHistory.quantidade;
      const saldoKardex = kardexData.saldoFinal;
      if (estoqueAtual !== saldoKardex) {
        console.warn('🚨 INCONSISTÊNCIA DETECTADA:', {
          item: selectedItemForHistory.tipoEPI?.nomeEquipamento || 'Item não identificado',
          numeroCA: selectedItemForHistory.tipoEPI?.numeroCA || 'CA não identificado',
          estoqueAtualListagem: estoqueAtual,
          saldoFinalKardex: saldoKardex,
          diferenca: estoqueAtual - saldoKardex,
          problemaTipo: estoqueAtual > saldoKardex ? 'READ_model_maior' : 'event_log_maior',
          possiveisProblemas: [
            'Desincronização Read Model vs Event Log',
            'Ajuste manual não refletido no Event Log', 
            'Bug na projeção/cálculo',
            'Movimentação não processada corretamente'
          ]
        });
      } else {
        console.log('✅ Estoque consistente:', { estoqueAtual, saldoKardex });
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar histórico:', error);
      historyError = error instanceof Error ? error.message : 'Erro desconhecido';
    } finally {
      historyLoading = false;
    }
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
      
      // Notificar que os dados mudaram para atualizar contadores
      dispatch('dataChanged');
      
      notify.success(
        'Movimentação registrada', 
        `${event.detail.tipoMovimentacao} de ${event.detail.quantidade} unidades`
      );
      
    } catch (error: any) {
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
    kardexData = null;
    historyError = null;
    historyLoading = false;
    console.log('❌ Modal de histórico fechado');
  }

  /**
   * Handler para mudança de período no histórico
   */
  async function handleHistoryPeriodChange(event: CustomEvent<{ period: string; dataInicio?: string; dataFim?: string }>): Promise<void> {
    const { period, dataInicio, dataFim } = event.detail;
    await loadItemHistory(dataInicio, dataFim);
    console.log('📅 Período do histórico alterado:', period);
  }
  
  /**
   * Handler para nova movimentação
   */
  function handleNewMovement(): void {
    selectedItem = null; // Nova movimentação não tem item específico
    showNotesDrawer = true;
    console.log('➕ Nova movimentação');
  }
  
  /**
   * Handler para fechar drawer de notas
   */
  function handleNotesDrawerClose(): void {
    showNotesDrawer = false;
    selectedItem = null;
    console.log('❌ Drawer de notas fechado');
  }
  
  /**
   * Handler para salvar nota
   */
  async function handleNotesSave(event: any): Promise<void> {
    try {
      console.log('💾 Salvando nota:', event.detail);
      
      // Fechar drawer
      showNotesDrawer = false;
      selectedItem = null;
      
      // Recarregar dados
      await loadInventoryData();
      
      // Notificar que os dados mudaram para atualizar contadores
      dispatch('dataChanged');
      
      notify.success('Nota salva', 'Movimentação registrada com sucesso');
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar nota:', error);
      notify.error('Erro ao salvar', 'Não foi possível registrar a movimentação');
    }
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
  
  // DEBUG: Log para verificar dados do store
  $: {
    console.log('🏗️ CONTAINER: dados do store:', {
      storeItems: $inventoryStore.items?.length || 0,
      storeLoading: $inventoryStore.loading,
      storeError: $inventoryStore.error,
      storeTotal: $inventoryStore.total
    });
  }
  
  $: presentationData = {
    items: $inventoryStore.items || [],
    loading: initializing || $inventoryStore.loading,
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
  statusOptions={presentationData.filterOptions.status}
  hideStatusFilter={!!statusFilter}
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
  on:itemHistory={handleItemHistory}
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
  <HistoryModal
    showModal={showHistoryModal}
    item={selectedItemForHistory}
    {kardexData}
    loading={historyLoading}
    error={historyError}
    on:close={handleHistoryClose}
    on:periodFilter={handleHistoryPeriodChange}
  />
{/if}

{#if showNotesDrawer}
  <NotesDetailDrawer
    open={showNotesDrawer}
    mode="create"
    on:close={handleNotesDrawerClose}
    on:save={handleNotesSave}
  />
{/if}
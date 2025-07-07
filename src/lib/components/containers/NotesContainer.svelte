<!--
  Notes Container - Componente "Inteligente" (Refatorado)
  
  Container para notas de movimentação usando arquitetura Container/Presenter
  similar ao FichasContainer, conectado ao backend PostgreSQL real.
  
  Responsabilidades:
  - Gerenciar estado das notas com enhanced paginated store
  - Integração com notasMovimentacaoAdapter (backend real)
  - Lógica de filtros, busca e paginação
  - Event handlers para CRUD
  - Delegação de UI para presenter
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { notasMovimentacaoAdapter } from '$lib/services/process/notasMovimentacaoAdapter';
  import type { 
    NotaMovimentacao, 
    NotasMovimentacaoFilterParams,
    CriarNotaMovimentacaoRequest,
    TipoNotaEnum,
    StatusNotaEnum,
    NotasFilterOptions
  } from '$lib/services/process/notasMovimentacaoAdapter';
  import { createEnhancedPaginatedStore } from '$lib/stores/enhancedPaginatedStore';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  import { notify } from '$lib/stores';
  import NotesTablePresenter from '$lib/components/presenters/NotesTablePresenter.svelte';
  import NotesFormModalPresenter from '$lib/components/presenters/NotesFormModalPresenter.svelte';

  // ==================== PROPS ====================
  
  export let initialPageSize = 20;
  export let autoRefresh = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    notaCreated: NotaMovimentacao;
    notaUpdated: NotaMovimentacao;
    notaDeleted: string;
    notaConcluida: NotaMovimentacao;
    notaCancelada: string;
  }>();

  // ==================== ENHANCED STORE ====================
  
  // Enhanced store para notas com paginação server-side e cache
  const notesStore = createEnhancedPaginatedStore<NotaMovimentacao>({
    baseEndpoint: '/notas-movimentacao',
    defaultPageSize: initialPageSize,
    debounceDelay: 300,
    cacheTimeout: 3 * 60 * 1000, // 3 minutos
    autoRefresh,
    refreshInterval: autoRefresh ? 30000 : undefined,
    // Função customizada de fetch usando o adapter
    customFetch: async (params: any) => {
      return notasMovimentacaoAdapter.listarNotas(params as NotasMovimentacaoFilterParams);
    }
  });

  // ==================== STATE ====================
  
  // Filtros
  let searchTerm = '';
  let tipoFilter: TipoNotaEnum | 'todas' = 'todas';
  let statusFilter: StatusNotaEnum | 'todos' = 'todos';
  let responsavelFilter = 'todos';
  let almoxarifadoFilter = 'todos';
  let dataInicioFilter = '';
  let dataFimFilter = '';

  // Tab state
  let activeTab = 0; // 0 = Todas, 1 = Rascunhos, 2 = Concluídas, 3 = Canceladas

  // Modal state
  let showNotaModal = false;
  let modalMode: 'create' | 'edit' | 'view' = 'create';
  let modalTipo: TipoNotaEnum = 'ENTRADA';
  let selectedNota: NotaMovimentacao | null = null;
  let notaFormLoading = false;

  // Filter options (carregadas dinamicamente)
  let filterOptions: NotasFilterOptions = {
    responsaveis: [{ value: 'todos', label: 'Todos os Responsáveis' }],
    almoxarifados: [{ value: 'todos', label: 'Todos os Almoxarifados' }],
    tipos: [],
    status: []
  };

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('📋 NotesContainer: Inicializando com Enhanced Store...');
    
    // Aguardar configurações de negócio
    await businessConfigStore.initialize();
    
    // Carregar opções de filtros
    await loadFilterOptions();
    
    // Inicializar enhanced store (carrega dados automaticamente)
    await notesStore.initialize();
    
    console.log('✅ NotesContainer: Inicializado com Enhanced Store');
  });

  onDestroy(() => {
    notesStore.destroy();
  });

  // ==================== DATA LOADING ====================
  
  async function loadFilterOptions(): Promise<void> {
    try {
      const options = await notasMovimentacaoAdapter.obterOpcoesFilters();
      
      filterOptions = {
        responsaveis: [
          { value: 'todos', label: 'Todos os Responsáveis' },
          ...options.responsaveis
        ],
        almoxarifados: [
          { value: 'todos', label: 'Todos os Almoxarifados' },
          ...options.almoxarifados
        ],
        tipos: options.tipos,
        status: [
          { value: 'todos', label: 'Todos os Status' },
          ...options.status.map(s => ({ value: s.value, label: s.label }))
        ]
      };
    } catch (error) {
      console.error('Erro ao carregar opções de filtros:', error);
    }
  }

  // ==================== FILTER HELPERS ====================
  
  function buildFilters(): NotasMovimentacaoFilterParams {
    const filters: NotasMovimentacaoFilterParams = {
      search: searchTerm || undefined,
      dataInicio: dataInicioFilter || undefined,
      dataFim: dataFimFilter || undefined
    };

    // Aplicar filtro de tipo
    if (tipoFilter !== 'todas') {
      filters.tipo = tipoFilter;
    }

    // Aplicar filtro de status baseado na aba ativa
    switch (activeTab) {
      case 1: // Rascunhos
        filters.status = 'RASCUNHO';
        break;
      case 2: // Concluídas
        filters.status = 'CONCLUIDA';
        break;
      case 3: // Canceladas
        filters.status = 'CANCELADA';
        break;
      default: // Todas
        if (statusFilter !== 'todos') {
          filters.status = statusFilter;
        }
        break;
    }

    // Aplicar filtros adicionais
    if (responsavelFilter !== 'todos') {
      filters.responsavel_id = responsavelFilter;
    }
    
    if (almoxarifadoFilter !== 'todos') {
      filters.almoxarifado_id = almoxarifadoFilter;
    }

    return filters;
  }

  // ==================== TAB HANDLERS ====================
  
  function handleTabChange(tabIndex: number): void {
    activeTab = tabIndex;
    applyFiltersToStore();
  }

  // ==================== FILTER HANDLERS ====================
  
  function handleSearchChange(value: string): void {
    searchTerm = value;
    notesStore.search(value);
  }

  function handleTipoFilterChange(value: string): void {
    tipoFilter = value as TipoNotaEnum | 'todas';
    applyFiltersToStore();
  }

  function handleStatusFilterChange(value: string): void {
    statusFilter = value as StatusNotaEnum | 'todos';
    applyFiltersToStore();
  }

  function handleResponsavelFilterChange(value: string): void {
    responsavelFilter = value;
    applyFiltersToStore();
  }

  function handleAlmoxarifadoFilterChange(value: string): void {
    almoxarifadoFilter = value;
    applyFiltersToStore();
  }

  function handleDataInicioChange(value: string): void {
    dataInicioFilter = value;
    applyFiltersToStore();
  }

  function handleDataFimChange(value: string): void {
    dataFimFilter = value;
    applyFiltersToStore();
  }

  function handleClearFilters(): void {
    searchTerm = '';
    tipoFilter = 'todas';
    statusFilter = 'todos';
    responsavelFilter = 'todos';
    almoxarifadoFilter = 'todos';
    dataInicioFilter = '';
    dataFimFilter = '';
    activeTab = 0;
    notesStore.clearFilters();
  }

  function applyFiltersToStore(): void {
    const filters = buildFilters();
    notesStore.applyFilters(filters);
  }

  // ==================== PAGINATION HANDLERS ====================
  
  function handlePageChange(page: number): void {
    notesStore.goToPage(page);
  }

  function handlePageSizeChange(pageSize: number): void {
    notesStore.loadData({ limit: pageSize, page: 1 });
  }

  // ==================== NOTA CRUD HANDLERS ====================
  
  function handleNovaNota(tipo: TipoNotaEnum): void {
    selectedNota = null;
    modalMode = 'create';
    modalTipo = tipo;
    showNotaModal = true;
  }

  function handleEditarNota(nota: NotaMovimentacao): void {
    selectedNota = nota;
    modalMode = 'edit';
    modalTipo = nota.tipo_nota;
    showNotaModal = true;
  }

  function handleVisualizarNota(nota: NotaMovimentacao): void {
    selectedNota = nota;
    modalMode = 'view';
    modalTipo = nota.tipo_nota;
    showNotaModal = true;
  }

  async function handleExcluirNota(nota: NotaMovimentacao): Promise<void> {
    try {
      await notasMovimentacaoAdapter.excluirNota(nota.id);
      
      notify.success('Nota removida', `Nota ${nota.numero_documento || nota.id.slice(0, 8)} foi removida`);
      
      // Recarregar dados usando enhanced store
      notesStore.reload();
      
      // Emitir evento
      dispatch('notaDeleted', nota.id);
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      notify.error('Erro ao excluir', 'Não foi possível remover a nota');
    }
  }

  async function handleConcluirNota(nota: NotaMovimentacao): Promise<void> {
    try {
      const response = await notasMovimentacaoAdapter.concluirNota(nota.id);
      
      notify.success(
        'Nota concluída', 
        `Nota concluída com ${response.data.movimentacoes_criadas} movimentações criadas`
      );
      
      // Recarregar dados
      notesStore.reload();
      
      // Emitir evento
      dispatch('notaConcluida', { ...nota, status: 'CONCLUIDA' });
    } catch (error) {
      console.error('Erro ao concluir nota:', error);
      notify.error('Erro ao concluir', 'Não foi possível concluir a nota');
    }
  }

  async function handleCancelarNota(nota: NotaMovimentacao): Promise<void> {
    try {
      // Validar se pode cancelar
      const validacao = await notasMovimentacaoAdapter.validarCancelamento(nota.id);
      
      if (!validacao.pode_cancelar) {
        notify.error('Não é possível cancelar', validacao.motivo || 'Nota não pode ser cancelada');
        return;
      }

      await notasMovimentacaoAdapter.cancelarNota(nota.id);
      
      notify.success('Nota cancelada', `Nota ${nota.numero_documento || nota.id.slice(0, 8)} foi cancelada`);
      
      // Recarregar dados
      notesStore.reload();
      
      // Emitir evento
      dispatch('notaCancelada', nota.id);
    } catch (error) {
      console.error('Erro ao cancelar nota:', error);
      notify.error('Erro ao cancelar', 'Não foi possível cancelar a nota');
    }
  }

  // ==================== FORM MODAL HANDLERS ====================
  
  async function handleFormSave(formData: CriarNotaMovimentacaoRequest): Promise<void> {
    notaFormLoading = true;
    
    try {
      let result: NotaMovimentacao;
      
      if (modalMode === 'create') {
        const createResponse = await notasMovimentacaoAdapter.criarNota(formData);
        // Buscar a nota criada para obter dados completos
        result = await notasMovimentacaoAdapter.obterNota(createResponse.data.id);
        
        notify.success('Nota criada', `Nota ${createResponse.data.numero} foi criada`);
        dispatch('notaCreated', result);
      } else {
        result = await notasMovimentacaoAdapter.atualizarNota(selectedNota!.id, formData);
        
        notify.success('Nota atualizada', `Nota foi atualizada`);
        dispatch('notaUpdated', result);
      }
      
      // Recarregar dados usando enhanced store
      notesStore.reload();
      
      // Recarregar opções de filtros para incluir novos dados
      await loadFilterOptions();
      
      // Fechar modal
      showNotaModal = false;
      selectedNota = null;
      
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      notify.error('Erro ao salvar', 'Não foi possível salvar a nota');
    } finally {
      notaFormLoading = false;
    }
  }

  function handleFormCancel(): void {
    showNotaModal = false;
    selectedNota = null;
    notaFormLoading = false;
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: hasActiveFilters = searchTerm !== '' || 
    tipoFilter !== 'todas' || 
    statusFilter !== 'todos' || 
    responsavelFilter !== 'todos' ||
    almoxarifadoFilter !== 'todos' ||
    dataInicioFilter !== '' ||
    dataFimFilter !== '' ||
    activeTab !== 0;

  $: modalTitle = modalMode === 'create' ? `Nova Nota - ${notasMovimentacaoAdapter.getTipoNotaLabel(modalTipo)}` : 
    modalMode === 'edit' ? `Editar Nota - ${notasMovimentacaoAdapter.getTipoNotaLabel(modalTipo)}` : 
    `Visualizar Nota - ${notasMovimentacaoAdapter.getTipoNotaLabel(modalTipo)}`;

  // ==================== PRESENTER PROPS ====================
  
  $: presentationData = {
    items: $notesStore.items,
    loading: $notesStore.loading,
    error: $notesStore.error,
    pagination: {
      currentPage: $notesStore.pagination.page,
      totalPages: $notesStore.pagination.totalPages,
      pageSize: $notesStore.pagination.limit,
      total: $notesStore.pagination.total,
      hasNext: $notesStore.pagination.hasNextPage,
      hasPrev: $notesStore.pagination.hasPreviousPage
    },
    filters: {
      searchTerm,
      tipoFilter,
      statusFilter,
      responsavelFilter,
      almoxarifadoFilter,
      dataInicioFilter,
      dataFimFilter,
      hasActiveFilters,
      activeTab
    },
    filterOptions
  };
</script>

<!-- Usar presenter com dados do enhanced store -->
<NotesTablePresenter
  items={presentationData.items}
  loading={presentationData.loading}
  error={presentationData.error}
  pagination={presentationData.pagination}
  filters={presentationData.filters}
  filterOptions={presentationData.filterOptions}
  on:searchChange={(e) => handleSearchChange(e.detail)}
  on:tipoFilterChange={(e) => handleTipoFilterChange(e.detail)}
  on:statusFilterChange={(e) => handleStatusFilterChange(e.detail)}
  on:responsavelFilterChange={(e) => handleResponsavelFilterChange(e.detail)}
  on:almoxarifadoFilterChange={(e) => handleAlmoxarifadoFilterChange(e.detail)}
  on:dataInicioChange={(e) => handleDataInicioChange(e.detail)}
  on:dataFimChange={(e) => handleDataFimChange(e.detail)}
  on:clearFilters={handleClearFilters}
  on:tabChange={(e) => handleTabChange(e.detail)}
  on:pageChange={(e) => handlePageChange(e.detail)}
  on:pageSizeChange={(e) => handlePageSizeChange(e.detail)}
  on:novaNotaEntrada={() => handleNovaNota('ENTRADA')}
  on:novaNotaTransferencia={() => handleNovaNota('TRANSFERENCIA')}
  on:novaNotaDescarte={() => handleNovaNota('DESCARTE')}
  on:editarNota={(e) => handleEditarNota(e.detail)}
  on:visualizarNota={(e) => handleVisualizarNota(e.detail)}
  on:excluirNota={(e) => handleExcluirNota(e.detail)}
  on:concluirNota={(e) => handleConcluirNota(e.detail)}
  on:cancelarNota={(e) => handleCancelarNota(e.detail)}
/>

<!-- Modal de Formulário Nota -->
<NotesFormModalPresenter
  show={showNotaModal}
  mode={modalMode}
  tipo={modalTipo}
  title={modalTitle}
  nota={selectedNota}
  loading={notaFormLoading}
  on:salvar={(e) => handleFormSave(e.detail)}
  on:cancelar={handleFormCancel}
/>
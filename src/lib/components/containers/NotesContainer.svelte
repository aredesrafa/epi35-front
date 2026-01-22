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
  } from '$lib/services/process/notasMovimentacaoTypes';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  import { notify } from '$lib/stores';
  import NotesTablePresenter from '$lib/components/presenters/NotesTablePresenter.svelte';
  import NotesDetailDrawer from '$lib/components/presenters/NotesDetailDrawer.svelte';
  import BackendStatusIndicator from '$lib/components/common/BackendStatusIndicator.svelte';
  import { getTipoNotaLabel } from '$lib/utils/notasHelpers';

  // ==================== PROPS ====================
  
  export let initialPageSize = 20;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    notaCreated: NotaMovimentacao;
    notaUpdated: NotaMovimentacao;
    notaDeleted: string;
    notaConcluida: NotaMovimentacao;
    notaCancelada: string;
  }>();

  // ==================== PAGINATED STORE ====================
  
  // Store para notas com paginação server-side
  const notesStore = createPaginatedStore<NotaMovimentacao>(
    (params) => notasMovimentacaoAdapter.listarNotas(params as NotasMovimentacaoFilterParams),
    {
      initialPageSize: initialPageSize,
      enableCache: true,
      cacheTimeout: 3 * 60 * 1000, // 3 minutos
      debounceDelay: 300
    }
  );

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
  let activeTab = 0; // 0 = Concluídas, 1 = Rascunhos, 2 = Canceladas

  // Drawer state
  let showNotaDrawer = false;
  let drawerMode: 'create' | 'edit' | 'view' = 'create';
  let drawerTipo: TipoNotaEnum = 'ENTRADA';
  let selectedNota: NotaMovimentacao | null = null;
  let notaFormLoading = false;

  // Backend status
  let usingFallbackData = false;

  // Filter options (carregadas dinamicamente)
  let filterOptions: NotasFilterOptions = {
    responsaveis: [{ value: 'todos', label: 'Todos os Responsáveis' }],
    almoxarifados: [{ value: 'todos', label: 'Todos os Almoxarifados' }],
    tipos: [],
    status: []
  };
  
  // Estado de inicialização para evitar flash do empty state
  let initializing = true;

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('📋 NotesContainer: Inicializando...');
    
    try {
      // Aguardar configurações de negócio
      await businessConfigStore.initialize();
      
      // Carregar opções de filtros
      await loadFilterOptions();
      
      // Aplicar filtros iniciais (tab Concluídas = status CONCLUIDA)
      applyFiltersToStore();
      
      console.log('✅ NotesContainer: Inicializado');
    } catch (error: any) {
      console.error('❌ Erro ao inicializar NotesContainer:', error);
    } finally {
      // Finalizar inicialização após carregar dados ou erro
      initializing = false;
    }
  });

  onDestroy(() => {
    // Cleanup se necessário
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
          ...options.status.map(s => ({ value: s.value as StatusNotaEnum, label: s.label }))
        ]
      };
    } catch (error: any) {
      console.error('Erro ao carregar opções de filtros:', error);
      
      // Detectar se estamos usando dados de fallback
      if (error.message?.includes('Backend pode estar iniciando') || 
          error.message?.includes('timeout') ||
          error.message?.includes('fallback')) {
        usingFallbackData = true;
      }
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
      case 0: // Concluídas (padrão)
        filters.status = 'CONCLUIDA';
        break;
      case 1: // Rascunhos
        filters.status = 'RASCUNHO';
        break;
      case 2: // Canceladas
        filters.status = 'CANCELADA';
        break;
      default: // Fallback para concluídas
        filters.status = 'CONCLUIDA';
        break;
    }

    // Aplicar filtros adicionais
    if (responsavelFilter !== 'todos') {
      filters.responsavel_id = responsavelFilter;
    }
    
    if (almoxarifadoFilter !== 'todos') {
      filters.almoxarifado_id = almoxarifadoFilter;
    }

    console.log('🔍 BuildFilters: activeTab =', activeTab, ', status filter =', filters.status);
    
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
    notesStore.setSearch(value);
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
    activeTab = 0; // Volta para Concluídas
    applyFiltersToStore();
  }

  function applyFiltersToStore(): void {
    const filters = buildFilters();
    notesStore.setFilters(filters);
  }

  // ==================== PAGINATION HANDLERS ====================
  
  function handlePageChange(page: number): void {
    notesStore.goToPage(page);
  }

  function handlePageSizeChange(pageSize: number): void {
    notesStore.fetchPage({ limit: pageSize, page: 1 });
  }

  // ==================== NOTA CRUD HANDLERS ====================
  
  function handleNovaNota(): void {
    selectedNota = null;
    drawerMode = 'create';
    drawerTipo = 'ENTRADA'; // Padrão: ENTRADA
    showNotaDrawer = true;
  }

  async function handleEditarNota(nota: NotaMovimentacao): Promise<void> {
    try {
      console.log('✏️ Carregando dados completos da nota para edição:', nota.id);
      
      // Buscar dados completos da nota (incluindo itens) usando endpoint GET /:id
      const notaCompleta = await notasMovimentacaoAdapter.obterNota(nota.id);
      
      selectedNota = notaCompleta;
      drawerMode = 'edit';
      drawerTipo = notaCompleta.tipo_nota || notaCompleta.tipo;
      showNotaDrawer = true;
      
      console.log('✅ Dados completos carregados para edição:', {
        id: notaCompleta.id,
        itens: notaCompleta.itens?.length || 0,
        status: notaCompleta.status
      });
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados completos da nota:', error);
      
      // Fallback para dados básicos (do resumo)
      selectedNota = nota;
      drawerMode = 'edit';
      drawerTipo = nota.tipo;
      showNotaDrawer = true;
      
      notify.warning('Aviso', 'Alguns detalhes podem não estar disponíveis');
    }
  }

  async function handleVisualizarNota(nota: NotaMovimentacao): Promise<void> {
    try {
      console.log('👁️ Carregando dados completos da nota:', nota.id);
      
      // Buscar dados completos da nota (incluindo itens) usando endpoint GET /:id
      const notaCompleta = await notasMovimentacaoAdapter.obterNota(nota.id);
      
      selectedNota = notaCompleta;
      
      // 🔧 CORREÇÃO: Notas de rascunho devem abrir automaticamente em modo de edição
      const isRascunho = notaCompleta.status === 'RASCUNHO' || notaCompleta._status === 'RASCUNHO';
      drawerMode = isRascunho ? 'edit' : 'view';
      drawerTipo = notaCompleta.tipo_nota || notaCompleta.tipo;
      showNotaDrawer = true;
      
      console.log('✅ Dados completos carregados:', {
        id: notaCompleta.id,
        itens: notaCompleta.itens?.length || 0,
        status: notaCompleta.status,
        modo: drawerMode
      });
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados completos da nota:', error);
      
      // Fallback para dados básicos (do resumo)
      selectedNota = nota;
      
      // 🔧 CORREÇÃO: Aplicar mesma lógica no fallback
      const isRascunho = nota.status === 'RASCUNHO' || nota._status === 'RASCUNHO';
      drawerMode = isRascunho ? 'edit' : 'view';
      drawerTipo = nota.tipo;
      showNotaDrawer = true;
      
      notify.warning('Aviso', 'Alguns detalhes podem não estar disponíveis');
    }
  }

  async function handleExcluirNota(nota: NotaMovimentacao): Promise<void> {
    try {
      await notasMovimentacaoAdapter.excluirNota(nota.id);
      
      notify.success('Nota removida', `Nota ${nota.numero || nota.id.slice(0, 8)} foi removida`);
      
      // Recarregar dados usando enhanced store
      notesStore.reload();
      
      // Emitir evento
      dispatch('notaDeleted', nota.id);
    } catch (error: any) {
      console.error('Erro ao excluir nota:', error);
      notify.error('Erro ao excluir', 'Não foi possível remover a nota');
    }
  }

  async function handleConcluirNota(nota: NotaMovimentacao): Promise<void> {
    try {
      // Validação usando o método local melhorado (sem fazer chamada 404)
      const validacao = await notasMovimentacaoAdapter.validarNotaAntesConcluir(nota.id);
      
      if (!validacao.pode_concluir) {
        notify.error('Não é possível concluir', validacao.erros.join(', '));
        return;
      }
      
      console.log('✅ Validação local passou, prosseguindo com conclusão...');
      
      const response = await notasMovimentacaoAdapter.concluirNota(nota.id);
      
      // Verificar se realmente foi concluída
      console.log('📋 Resposta da conclusão:', response);
      
      // Parse response data safely
      const responseData = response.data || response;
      const movimentacoes = responseData.movimentacoesCriadas?.length || 
                           responseData.data?.movimentacoesCriadas?.length ||
                           responseData.movimentacoes_criadas ||
                           'N/A';
      
      // Verificar status após conclusão
      try {
        const notaAtualizada = await notasMovimentacaoAdapter.obterNota(nota.id);
        if (notaAtualizada.status !== 'CONCLUIDA' && notaAtualizada._status !== 'CONCLUIDA') {
          throw new Error('Nota não foi concluída no backend');
        }
        console.log('✅ Confirmado: Nota foi concluída no backend');
      } catch (verificationError) {
        console.error('❌ Erro na verificação pós-conclusão:', verificationError);
        notify.error('Erro na conclusão', 'Nota pode não ter sido concluída corretamente');
        return;
      }
      
      notify.success(
        'Nota concluída', 
        `Nota concluída com sucesso! ${movimentacoes !== 'N/A' && movimentacoes !== 0 ? `${movimentacoes} movimentações criadas` : 'Verificar movimentações no backend'}`
      );
      
      // Recarregar dados
      notesStore.reload();
      
      // Emitir evento
      dispatch('notaConcluida', { ...nota, status: 'CONCLUIDA' });
    } catch (error: any) {
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
      
      notify.success('Nota cancelada', `Nota ${nota.numero || nota.id.slice(0, 8)} foi cancelada`);
      
      // Recarregar dados
      notesStore.reload();
      
      // Emitir evento
      dispatch('notaCancelada', nota.id);
    } catch (error: any) {
      console.error('Erro ao cancelar nota:', error);
      notify.error('Erro ao cancelar', 'Não foi possível cancelar a nota');
    }
  }

  // ==================== FORM MODAL HANDLERS ====================
  
  async function handleFormSave(event: CustomEvent<{ notaId: string; modo: 'rascunho' | 'concluida' }>): Promise<void> {
    notaFormLoading = true;
    
    try {
      const { notaId, modo } = event.detail;
      
      if (modo === 'concluida') {
        // Se for para concluir, processar a nota
        await handleConcluirNota({ id: notaId } as NotaMovimentacao);
      }
      
      // Recarregar dados usando enhanced store
      notesStore.reload();
      
      // Recarregar opções de filtros para incluir novos dados
      await loadFilterOptions();
      
      // Fechar drawer
      showNotaDrawer = false;
      selectedNota = null;
      
      const mensagem = modo === 'rascunho' ? 'Rascunho salvo com sucesso' : 'Nota concluída com sucesso';
      notify.success('Sucesso', mensagem);
      
      // Emitir eventos apropriados
      if (modo === 'rascunho') {
        const notaAtualizada = await notasMovimentacaoAdapter.obterNota(notaId);
        if (drawerMode === 'create') {
          dispatch('notaCreated', notaAtualizada);
        } else {
          dispatch('notaUpdated', notaAtualizada);
        }
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar nota:', error);
      notify.error('Erro ao salvar', 'Não foi possível salvar a nota');
    } finally {
      notaFormLoading = false;
    }
  }

  function handleFormCancel(): void {
    showNotaDrawer = false;
    selectedNota = null;
    notaFormLoading = false;
  }

  function handleDrawerClose(): void {
    showNotaDrawer = false;
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
    dataFimFilter !== '';

  $: drawerTitle = drawerMode === 'create' ? `Nova Nota - ${getTipoNotaLabel(drawerTipo)}` : 
    drawerMode === 'edit' ? `Editar Nota - ${getTipoNotaLabel(drawerTipo)}` : 
    `Visualizar Nota - ${getTipoNotaLabel(drawerTipo)}`;

  // ==================== PRESENTER PROPS ====================
  
  $: {
    // Detectar dados de fallback verificando IDs de fallback
    if ($notesStore.items.some(item => item.id.startsWith('fallback-'))) {
      usingFallbackData = true;
    }
  }

  $: presentationData = {
    items: $notesStore.items,
    loading: initializing || $notesStore.loading,
    error: $notesStore.error,
    pagination: {
      currentPage: $notesStore.page,
      totalPages: $notesStore.totalPages,
      pageSize: $notesStore.pageSize,
      total: $notesStore.total,
      hasNext: notesStore.hasNext(),
      hasPrev: notesStore.hasPrev()
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

<!-- Backend Status Indicator -->
<BackendStatusIndicator visible={usingFallbackData} />

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
  on:novaNota={handleNovaNota}
  on:editarNota={(e) => { handleEditarNota(e.detail); }}
  on:visualizarNota={(e) => { handleVisualizarNota(e.detail); }}
  on:excluirNota={(e) => handleExcluirNota(e.detail)}
  on:concluirNota={(e) => handleConcluirNota(e.detail)}
  on:cancelarNota={(e) => handleCancelarNota(e.detail)}
/>

<!-- Drawer de Nota -->
<NotesDetailDrawer
  open={showNotaDrawer}
  mode={drawerMode}
  tipo={drawerTipo}
  nota={selectedNota}
  loading={notaFormLoading}
  on:salvar={handleFormSave}
  on:cancelar={handleFormCancel}
  on:close={handleDrawerClose}
/>
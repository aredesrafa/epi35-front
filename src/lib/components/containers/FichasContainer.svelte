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
  import NovaFichaModalPresenter from '../presenters/NovaFichaModalPresenter.svelte';
  import type { FichaEPIDTO } from '$lib/types/serviceTypes';

  // ==================== PROPS ====================
  
  export let initialPageSize: number = 10;
  export const autoRefresh: boolean = false;
  export const refreshInterval: number = 30000;

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
  let showNovaFicha = false;
  
  // Estado para nova ficha
  let contratadas: Array<{ value: string; label: string }> = [];
  let colaboradores: Array<{ value: string; label: string; empresa: string }> = [];
  let loadingContratadas = false;
  let loadingColaboradores = false;
  let submittingNovaFicha = false;

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
    showNovaFicha = true;
    loadContratadas();
  }
  
  // ==================== NOVA FICHA HANDLERS ====================
  
  async function loadContratadas(): Promise<void> {
    if (contratadas.length > 0) return; // Já carregadas
    
    try {
      loadingContratadas = true;
      console.log('🔄 Carregando contratadas da API...');
      
      // Chamada real para API de contratadas  
      const response = await fetch('/api/contratadas');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log('📦 Raw API response for contratadas:', result);
      console.log('📦 result.data structure:', result.data);
      
      if (result.success && result.data) {
        // Backend retorna: { success: true, data: { contratadas: [...], total: 4 } }
        const contratadasArray = result.data.contratadas || result.data;
        
        if (Array.isArray(contratadasArray)) {
          contratadas = contratadasArray.map((contratada: any) => ({
            value: contratada.id,
            label: contratada.nome
          }));
          console.log('✅ Contratadas carregadas da API:', contratadas.length);
        } else {
          throw new Error('Dados de contratadas não são um array');
        }
      } else {
        throw new Error('Resposta inválida da API de contratadas');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar contratadas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      notify.error('Erro ao carregar contratadas', `Não foi possível carregar a lista de empresas: ${errorMessage}`);
      
      // Fallback para dados mock em caso de erro
      contratadas = [
        { value: 'empresa-alpha', label: 'Empresa Alpha LTDA' },
        { value: 'empresa-beta', label: 'Empresa Beta Serviços' },
        { value: 'empresa-gamma', label: 'Gamma Construções' }
      ];
    } finally {
      loadingContratadas = false;
    }
  }
  
  async function loadColaboradores(contratadaId: string): Promise<void> {
    try {
      loadingColaboradores = true;
      console.log('🔄 Carregando colaboradores para contratada:', contratadaId);
      
      // Usar endpoint dedicado de colaboradores com filtro por contratada
      const response = await fetch(`/api/colaboradores?contratadaId=${contratadaId}&limit=100`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log('📦 Raw API response for colaboradores:', result);
      console.log('📦 result.data structure:', result.data);
      
      if (result.success && result.data) {
        // Backend retorna: { success: true, data: [...], pagination: {...} }
        const colaboradoresArray = result.data;
        
        if (Array.isArray(colaboradoresArray)) {
          colaboradores = colaboradoresArray.map((colaborador: any) => ({
            value: colaborador.id,
            label: colaborador.nome,
            empresa: contratadaId,
            cpf: colaborador.cpf || colaborador.cpfFormatado,
            cargo: colaborador.cargo,
            matricula: colaborador.matricula,
            setor: colaborador.setor
          }));
          
          console.log('✅ Colaboradores carregados da API:', colaboradores.length);
        } else {
          throw new Error('Dados de colaboradores não são um array');
        }
      } else {
        throw new Error('Resposta inválida da API de colaboradores');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar colaboradores:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      notify.error('Erro ao carregar colaboradores', `Não foi possível carregar a lista de profissionais: ${errorMessage}`);
      
      // Fallback para dados mock em caso de erro - usar dados genéricos para qualquer contratada
      colaboradores = [
        { 
          value: `mock-colab-001-${contratadaId}`, 
          label: 'Carlos Oliveira (Mock)', 
          empresa: contratadaId,
          cpf: '123.456.789-01',
          cargo: 'Operador'
        },
        { 
          value: `mock-colab-002-${contratadaId}`, 
          label: 'Ana Santos (Mock)', 
          empresa: contratadaId,
          cpf: '987.654.321-02',
          cargo: 'Técnica'
        },
        { 
          value: `mock-colab-003-${contratadaId}`, 
          label: 'João Silva (Mock)', 
          empresa: contratadaId,
          cpf: '456.789.123-03',
          cargo: 'Supervisor'
        }
      ];
      
      console.log('⚠️ Usando dados mock para colaboradores:', colaboradores.length);
    } finally {
      loadingColaboradores = false;
    }
  }
  
  function handleContratadaChange(contratadaId: string): void {
    console.log('🏢 Contratada selecionada:', contratadaId);
    if (contratadaId) {
      loadColaboradores(contratadaId);
    } else {
      colaboradores = [];
    }
  }
  
  function handleColaboradorChange(colaboradorId: string): void {
    console.log('👤 Colaborador selecionado:', colaboradorId);
  }
  
  async function handleSubmitNovaFicha(event: CustomEvent<{ contratadaId: string; colaboradorId: string }>): Promise<void> {
    const { contratadaId, colaboradorId } = event.detail;
    
    try {
      submittingNovaFicha = true;
      console.log('📝 Criando nova ficha:', { contratadaId, colaboradorId });
      
      // Chamada real para API de criação de ficha
      const payload = {
        colaboradorId,
        status: 'ATIVA'
      };
      
      console.log('📤 Enviando payload para criação de ficha:', payload);
      
      const response = await fetch('/api/fichas-epi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📥 Resposta da API ao criar ficha:', result);
      
      if (result.success) {
        // Fechar modal e recarregar dados
        showNovaFicha = false;
        await loadFichasData();
        
        // Encontrar nome do colaborador para notificação
        const colaborador = colaboradores.find(c => c.value === colaboradorId);
        const nomeColaborador = colaborador?.label || 'Colaborador';
        
        notify.success(
          'Ficha criada com sucesso',
          `Ficha de EPI criada para ${nomeColaborador}`
        );
        
        console.log('✅ Nova ficha criada com sucesso:', result.data);
      } else {
        throw new Error(result.message || 'Erro ao criar ficha');
      }
    } catch (error) {
      console.error('❌ Erro ao criar nova ficha:', error);
      notify.error('Erro ao criar ficha', 'Não foi possível criar a ficha de EPI');
    } finally {
      submittingNovaFicha = false;
    }
  }
  
  function handleCloseNovaFicha(): void {
    showNovaFicha = false;
    // Limpar dados ao fechar
    colaboradores = [];
  }
  
  function handleRetryNovaFicha(): void {
    // Recarregar contratadas em caso de erro
    contratadas = [];
    loadContratadas();
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

<!-- Modal de nova ficha -->
{#if showNovaFicha}
  <NovaFichaModalPresenter
    bind:open={showNovaFicha}
    {contratadas}
    {colaboradores}
    {loadingContratadas}
    {loadingColaboradores}
    submitting={submittingNovaFicha}
    on:close={handleCloseNovaFicha}
    on:contratadaChange={(e) => handleContratadaChange(e.detail)}
    on:colaboradorChange={(e) => handleColaboradorChange(e.detail)}
    on:submit={handleSubmitNovaFicha}
    on:retry={handleRetryNovaFicha}
  />
{/if}
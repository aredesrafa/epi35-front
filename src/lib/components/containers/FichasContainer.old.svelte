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
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  // 🚀 MIGRADO: Usar novo adapter de consultas
  import { fichaQueryAdapter } from '$lib/services/process';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  import { notify } from '$lib/stores';
  import { api } from '$lib/services/core/apiClient';
  import FichasTablePresenter from '../presenters/FichasTablePresenter.svelte';
  import FichaDetailContainer from '../containers/FichaDetailContainer.svelte';
  import NovaFichaModalPresenter from '../presenters/NovaFichaModalPresenter.svelte';
  import type { FichaEPIDTO } from '$lib/types/serviceTypes';

  // ==================== PROPS ====================
  
  export let initialPageSize: number = 10;
  export let autoRefresh: boolean = false;
  export let refreshInterval: number = 30000;

  // ==================== ENHANCED STORE ====================
  
  // 🚀 ATUALIZADO: Store paginado usando novo método getFichasList com busca unificada
  const fichasStore = createPaginatedStore(
    (params) => fichaQueryAdapter.getFichasList({
      page: params.page || 1,
      limit: params.limit || initialPageSize,
      search: params.search || undefined, // 🆕 BUSCA UNIFICADA: CPF, nome, matrícula
      // ✅ CORREÇÃO: Usar nomes corretos dos parâmetros conforme container envia
      empresaFilter: params.empresaFilter !== 'todas' ? params.empresaFilter : undefined, // Container envia 'empresaFilter'
      cargo: params.cargo !== 'todos' ? params.cargo : undefined,
      status: params.status !== 'todos' ? params.status : undefined,
      devolucaoPendente: !!params.devolucaoPendente // ✅ CORREÇÃO: Usar nome correto
    }).then(response => ({
      data: response.items,
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

  // ✅ NOVO: Estado para opções de filtros dinâmicos
  let empresaOptions: Array<{ value: string; label: string }> = [
    { value: 'todas', label: 'Todas as Empresas' }
  ];
  let cargoOptions: Array<{ value: string; label: string }> = [
    { value: 'todos', label: 'Todos os Cargos' }
  ];
  let loadingFilterOptions = false;

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('🚀 FichasContainer: Inicializando...');
    
    // Aguardar configurações de negócio
    await businessConfigStore.initialize();
    
    // Carregar opções de filtros e dados iniciais em paralelo
    await Promise.all([
      loadFilterOptions(),
      loadFichasData()
    ]);
    
    // 🔗 NOVO: Verificar se há uma ficha para abrir via URL
    checkForDirectLink();
    
    console.log('✅ FichasContainer: Inicializado com sucesso');
  });
  
  // 🔗 NOVO: Reagir a mudanças na URL
  $: {
    if ($page.url.searchParams.get('ficha')) {
      handleDirectLink($page.url.searchParams.get('ficha'));
    }
  }
  
  // 🔗 NOVO: Verificar link direto na inicialização
  function checkForDirectLink(): void {
    const fichaIdFromUrl = $page.url.searchParams.get('ficha');
    if (fichaIdFromUrl) {
      console.log('🔗 Link direto detectado para ficha:', fichaIdFromUrl);
      handleDirectLink(fichaIdFromUrl);
    }
  }
  
  // 🔗 NOVO: Processar link direto
  function handleDirectLink(fichaId: string | null): void {
    if (fichaId && fichaId !== selectedFichaId) {
      console.log('🔗 Abrindo ficha via link direto:', fichaId);
      selectedFichaId = fichaId;
      showDetail = true;
    }
  }
  
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

  // ✅ NOVO: Carregar opções de filtros dinamicamente
  async function loadFilterOptions(): Promise<void> {
    try {
      loadingFilterOptions = true;
      console.log('🔄 Carregando opções de filtros...');

      // Carregar empresas únicas das contratadas
      const empresasResponse = await api.get('/contratadas');
      if (empresasResponse.success && empresasResponse.data) {
        const contratadasArray = empresasResponse.data.contratadas || empresasResponse.data;
        if (Array.isArray(contratadasArray)) {
          empresaOptions = [
            { value: 'todas', label: 'Todas as Empresas' },
            ...contratadasArray.map((empresa: any) => ({
              value: empresa.id,
              label: empresa.nome
            }))
          ];
          console.log('✅ Opções de empresa carregadas:', {
            total: empresaOptions.length,
            exemplos: empresaOptions.slice(0, 3).map(emp => ({ 
              id: emp.value, 
              nome: emp.label 
            }))
          });
        }
      }

      // ✅ DINÂMICO: Carregar cargos únicos do endpoint de colaboradores
      try {
        const colaboradoresResponse = await api.get('/colaboradores?limit=100');
        if (colaboradoresResponse.success && colaboradoresResponse.data) {
          const colaboradores = Array.isArray(colaboradoresResponse.data) 
            ? colaboradoresResponse.data 
            : colaboradoresResponse.data.items || [];
          
          // Extrair cargos únicos
          const cargosUnicos = [...new Set(
            colaboradores
              .map((colab: any) => colab.cargo)
              .filter((cargo: string) => cargo && cargo.trim())
          )].sort();
          
          cargoOptions = [
            { value: 'todos', label: 'Todos os Cargos' },
            ...cargosUnicos.map((cargo: string) => ({
              value: cargo, // ✅ CORREÇÃO: Usar o valor original do cargo
              label: cargo
            }))
          ];
          console.log('✅ Opções de cargo carregadas dinamicamente:', cargoOptions.length);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar cargos, usando fallback:', error);
        // Fallback para cargos comuns
        cargoOptions = [
          { value: 'todos', label: 'Todos os Cargos' },
          { value: 'operador', label: 'Operador' },
          { value: 'tecnico', label: 'Técnico' },
          { value: 'supervisor', label: 'Supervisor' },
          { value: 'gerente', label: 'Gerente' },
        ];
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar opções de filtros:', error);
      // Manter opções padrão em caso de erro
    } finally {
      loadingFilterOptions = false;
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
    console.log('🧹 Limpando todos os filtros...');
    
    // ✅ CORREÇÃO: Limpar PRIMEIRO os valores locais
    searchTerm = '';
    filters = { empresa: 'todas', cargo: 'todos', devolucaoPendente: false };
    
    // ✅ CORREÇÃO: Resetar store completamente e recarregar dados limpos
    fichasStore.reset(); // Reset completo (página 1, filtros limpos, cache limpo)
    fichasStore.fetchPage(); // Recarregar dados sem filtros
    
    console.log('✅ Filtros limpos, store resetado e dados recarregados');
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
    
    // ✅ CORREÇÃO: Usar nomes corretos dos parâmetros conforme adapter
    if (filters.empresa && filters.empresa !== 'todas') {
      activeFilters.empresaFilter = filters.empresa; // Adapter processa 'empresaFilter' → 'empresaId'
    }
    
    if (filters.cargo && filters.cargo !== 'todos') {
      activeFilters.cargo = filters.cargo; // Este está correto
    }

    if (filters.devolucaoPendente) {
      activeFilters.devolucaoPendente = true; // ✅ CORREÇÃO: Adapter processa 'devolucaoPendente'
    }
    
    console.log('🔧 Aplicando filtros de fichas:', {
      original: filters,
      processed: activeFilters,
      searchTerm,
      empresa: filters.empresa,
      cargo: filters.cargo,
      devolucaoPendente: filters.devolucaoPendente
    });
    
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
    
    // 🔗 NOVO: Atualizar URL com o ID da ficha
    const url = new URL($page.url);
    url.searchParams.set('ficha', fichaId);
    goto(url.toString(), { replaceState: true, noScroll: true });
    
    console.log('👀 Abrindo detalhes da ficha:', fichaId);
  }

  function handleCloseDetail(): void {
    showDetail = false;
    selectedFichaId = null;
    
    // 🔗 NOVO: Remover parâmetro da URL
    const url = new URL($page.url);
    url.searchParams.delete('ficha');
    goto(url.toString(), { replaceState: true, noScroll: true });
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
      
      // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
      const result = await api.get('/contratadas');
      
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
      console.log('🔄 Carregando colaboradores SEM FICHA para contratada:', contratadaId);
      
      // ✅ BACKEND CORRIGIDO: Agora aceita semFicha=true como string corretamente
      // Usar apenas colaboradores que não possuem ficha EPI ativa
      
      const urlParams = new URLSearchParams();
      urlParams.set('contratadaId', contratadaId);
      urlParams.set('semFicha', 'true'); // ✅ CORRIGIDO: Backend agora aceita string
      urlParams.set('limit', '100');
      
      const url = `/colaboradores?${urlParams.toString()}`;
      console.log('🔗 URL (com semFicha=true):', url);
      
      const result = await api.get(url);
      console.log('📋 FILTRADO: Mostrará APENAS colaboradores sem ficha EPI');
      
      console.log('📦 Raw API response for colaboradores:', result);
      console.log('📦 result.data structure:', result.data);
      
      if (result.success && result.data) {
        // ✅ CORREÇÃO: Backend retorna { success: true, data: [...], pagination: {...} }
        const colaboradoresArray = result.data;
        
        console.log('📋 Colaboradores sem ficha encontrados:', colaboradoresArray.length);
        
        if (Array.isArray(colaboradoresArray)) {
          colaboradores = colaboradoresArray.map((colaborador: any) => ({
            value: colaborador.id,
            label: colaborador.nome,
            empresa: contratadaId,
            cpf: colaborador.cpfFormatado || colaborador.cpf, // ✅ CORREÇÃO: priorizar formatado
            cargo: colaborador.cargo || '-',
            matricula: colaborador.matricula || '-',
            setor: colaborador.setor || '-'
          }));
          
          console.log('✅ Colaboradores sem ficha carregados da API:', colaboradores.length);
        } else {
          throw new Error('Dados de colaboradores não são um array');
        }
      } else {
        throw new Error('Resposta inválida da API de colaboradores');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar colaboradores sem ficha:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      notify.error('Erro ao carregar colaboradores', `Não foi possível carregar a lista de profissionais sem ficha: ${errorMessage}`);
      
      // Fallback para dados mock em caso de erro - usar dados genéricos para qualquer contratada
      colaboradores = [
        { 
          value: `mock-colab-001-${contratadaId}`, 
          label: 'Carlos Oliveira (Mock - Sem Ficha)', 
          empresa: contratadaId,
          cpf: '123.456.789-01',
          cargo: 'Operador'
        },
        { 
          value: `mock-colab-002-${contratadaId}`, 
          label: 'Ana Santos (Mock - Sem Ficha)', 
          empresa: contratadaId,
          cpf: '987.654.321-02',
          cargo: 'Técnica'
        },
        { 
          value: `mock-colab-003-${contratadaId}`, 
          label: 'João Silva (Mock - Sem Ficha)', 
          empresa: contratadaId,
          cpf: '456.789.123-03',
          cargo: 'Supervisor'
        }
      ];
      
      console.log('⚠️ Usando dados mock para colaboradores sem ficha:', colaboradores.length);
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
      
      // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
      const result = await api.post('/fichas-epi', payload);
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
        
        // 🔗 NOVO: Abrir a ficha recém-criada automaticamente
        if (result.data && result.data.id) {
          console.log('🎯 Abrindo ficha recém-criada:', result.data.id);
          selectedFichaId = result.data.id;
          showDetail = true;
          
          // 🔗 Atualizar URL com o ID da nova ficha
          const url = new URL($page.url);
          url.searchParams.set('ficha', result.data.id);
          goto(url.toString(), { replaceState: true, noScroll: true });
        }
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
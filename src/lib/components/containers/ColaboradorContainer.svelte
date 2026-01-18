<!--
  Colaborador Container - Sistema DataLife EPI
  
  Container inteligente que gerencia lógica de negócio para gestão de colaboradores.
  Utiliza Enhanced Paginated Store para paginação server-side e operações CRUD.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import ColaboradorTablePresenter from '$lib/components/presenters/ColaboradorTablePresenter.svelte';
  import { notify } from '$lib/stores';
  import type { ColaboradorDTO, ContratadaDTO } from '$lib/types/serviceTypes';
  
  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export let embedded = false; // Para uso em tabs
  
  // ==================== SIMPLE PAGINATED STORE ====================
  
  // ✅ Store integrado com adapter real
  const colaboradorStore = createPaginatedStore<ColaboradorDTO>(
    async (params) => {
      console.log('👥 Fetching colaboradores with params:', params);
      try {
        // Usar endpoint real de colaboradores
        const response = await fetch(`https://epi-backend.onrender.com/api/colaboradores?page=${params.page || 1}&limit=${params.limit || 10}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Colaboradores carregados do backend:', result);
        
        if (result.success && result.data) {
          return {
            data: result.data,
            total: result.pagination?.total || 0,
            page: params.page || 1,
            pageSize: params.limit || 10,
            totalPages: result.pagination?.totalPages || 1
          };
        } else {
          throw new Error('Resposta inválida do backend');
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar colaboradores:', error);
        throw error;
      }
    },
    { initialPageSize }
  );
  
  // ==================== DERIVED STORES ====================
  
  $: items = $colaboradorStore.items || [];
  $: loading = $colaboradorStore.loading;
  $: error = $colaboradorStore.error;
  $: pagination = {
    currentPage: $colaboradorStore.page,
    totalPages: $colaboradorStore.totalPages,
    total: $colaboradorStore.total,
    totalItems: $colaboradorStore.total,
    itemsPerPage: $colaboradorStore.pageSize || initialPageSize,
    hasNext: $colaboradorStore.page < $colaboradorStore.totalPages,
    hasPrev: $colaboradorStore.page > 1
  };
  
  // ==================== CONTRATADAS STATE ====================
  
  let contratadas: ContratadaDTO[] = [];
  let loadingContratadas = false;
  
  // Função para carregar contratadas
  async function loadContratadas() {
    if (loadingContratadas) return;
    
    try {
      loadingContratadas = true;
      console.log('🏢 Carregando contratadas...');
      
      const response = await fetch('https://epi-backend.onrender.com/api/contratadas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Contratadas carregadas:', result);
      
      if (result.success && result.data) {
        contratadas = result.data;
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar contratadas:', error);
      contratadas = [];
    } finally {
      loadingContratadas = false;
    }
  }
  
  // Mock filters para teste
  $: filters = {
    searchTerm: '',
    contratadaFilter: 'todas',
    cargoFilter: 'todos',
    statusFilter: 'todos'
  };
  
  // Debug logs
  $: console.log('👥 ColaboradorContainer - items:', items.length, items);
  $: console.log('👥 ColaboradorContainer - loading:', loading);
  $: console.log('👥 ColaboradorContainer - store:', $colaboradorStore);
  
  // ==================== LOCAL STATE ====================
  
  let showEditarColaboradorModal = false;
  let colaboradorEdicao: ColaboradorDTO | null = null;
  
  // ==================== LIFECYCLE ====================
  
  onMount(() => {
    console.log('👥 Inicializando ColaboradorContainer...');
    colaboradorStore.fetchPage();
    loadContratadas();
  });
  
  // ==================== EVENT HANDLERS ====================
  
  function handlePageChange(newPage: number): void {
    console.log('📄 Mudança de página:', newPage);
    colaboradorStore.goToPage(newPage);
  }
  
  function handleFilterChange(filterKey: string, value: any): void {
    console.log('🔍 Filtro alterado:', filterKey, value);
    // Mock para teste - implementar filtros depois
  }
  
  function handleClearFilters(): void {
    console.log('🧹 Limpando filtros...');
    // Mock para teste - implementar filtros depois
  }
  
  function handleRefresh(): void {
    console.log('🔄 Atualizando dados de colaboradores...');
    colaboradorStore.fetchPage();
  }
  
  function handleItemsPerPageChange(newSize: number): void {
    console.log('📊 Alterando itens por página:', newSize);
    // Mock para teste - implementar depois
  }
  
  function handleNovoColaborador(): void {
    console.log('➕ Novo colaborador...');
    showEditarColaboradorModal = true;
    colaboradorEdicao = null;
  }
  
  function handleEditarColaborador(colaborador: ColaboradorDTO): void {
    console.log('✏️ Editar colaborador:', colaborador.id);
    colaboradorEdicao = colaborador;
    showEditarColaboradorModal = true;
  }
  
  async function handleSalvarColaborador(dados: Partial<ColaboradorDTO>): Promise<void> {
    try {
      console.log('💾 Salvando colaborador:', dados);
      
      // Mock para teste - implementar API real depois
      showEditarColaboradorModal = false;
      notify.success('Sucesso', 'Colaborador salvo com sucesso');
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar colaborador:', error);
      notify.error('Erro', 'Não foi possível salvar o colaborador');
    }
  }
  
  async function handleAtualizarColaborador(dados: Partial<ColaboradorDTO>): Promise<void> {
    try {
      console.log('💾 Atualizando colaborador:', colaboradorEdicao?.id, dados);
      
      // Mock para teste - implementar API real depois
      showEditarColaboradorModal = false;
      colaboradorEdicao = null;
      notify.success('Sucesso', 'Colaborador atualizado com sucesso');
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar colaborador:', error);
      notify.error('Erro', 'Não foi possível atualizar o colaborador');
    }
  }
  
  async function handleExcluirColaborador(colaborador: ColaboradorDTO): Promise<void> {
    try {
      console.log('🗑️ Excluir colaborador:', colaborador.id);
      
      // Mock para teste - implementar API real depois
      notify.success('Sucesso', 'Colaborador excluído com sucesso');
      
    } catch (error: any) {
      console.error('❌ Erro ao excluir colaborador:', error);
      notify.error('Erro', 'Não foi possível excluir o colaborador');
    }
  }
  
  function handleCancelarModal(): void {
    showEditarColaboradorModal = false;
    colaboradorEdicao = null;
  }
</script>

<!-- ==================== PRESENTER ====================

  Delega toda renderização para o ColaboradorTablePresenter,
  que é um componente "burro" responsável apenas pela UI.
-->

<ColaboradorTablePresenter 
  {items}
  {loading}
  {error}
  {pagination}
  {filters}
  {contratadas}
  {embedded}
  {showEditarColaboradorModal}
  {colaboradorEdicao}
  on:pageChange={(e) => handlePageChange(e.detail)}
  on:filterChange={(e) => handleFilterChange(e.detail.key, e.detail.value)}
  on:clearFilters={handleClearFilters}
  on:refresh={handleRefresh}
  on:itemsPerPageChange={(e) => handleItemsPerPageChange(e.detail)}
  on:novoColaborador={handleNovoColaborador}
  on:editarColaborador={(e) => handleEditarColaborador(e.detail)}
  on:excluirColaborador={(e) => handleExcluirColaborador(e.detail)}
  on:salvarColaborador={(e) => handleSalvarColaborador(e.detail)}
  on:atualizarColaborador={(e) => handleAtualizarColaborador(e.detail)}
  on:cancelarModal={handleCancelarModal}
/>
<!--
  Colaborador Container - Sistema DataLife EPI
  
  Container inteligente que gerencia lógica de negócio para gestão de colaboradores.
  Utiliza Enhanced Paginated Store para paginação server-side e operações CRUD.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { createAdvancedPaginatedStore } from '$lib/stores/paginatedStore';
  import ColaboradorTablePresenter from '$lib/components/presenters/ColaboradorTablePresenter.svelte';
  import { notify } from '$lib/stores';
  import type { ColaboradorDTO, ContratadaDTO } from '$lib/types/serviceTypes';
  
  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export let embedded = false; // Para uso em tabs
  
  // ==================== ENHANCED PAGINATED STORE ====================
  
  // ✅ Enhanced Store conectado ao endpoint de colaboradores
  const colaboradorStore = createAdvancedPaginatedStore<ColaboradorDTO>({
    baseEndpoint: '/colaboradores',
    defaultPageSize: initialPageSize,
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1000, // 5 min cache
    autoRefresh: false,
    filterEndpoints: {
      contratadas: '/contratadas' // Para filtro por contratada
    }
  });
  
  // ==================== DERIVED STORES ====================
  
  $: items = $colaboradorStore.data;
  $: loading = $colaboradorStore.loading;
  $: error = $colaboradorStore.error;
  $: pagination = $colaboradorStore.pagination;
  $: filters = $colaboradorStore.filters;
  $: contratadas = $colaboradorStore.filterOptions.contratadas || [];
  
  // ==================== LOCAL STATE ====================
  
  let showNovoColaboradorModal = false;
  let showEditarColaboradorModal = false;
  let colaboradorEdicao: ColaboradorDTO | null = null;
  
  // ==================== LIFECYCLE ====================
  
  onMount(() => {
    console.log('👥 Inicializando ColaboradorContainer...');
    colaboradorStore.loadData();
  });
  
  // ==================== EVENT HANDLERS ====================
  
  function handlePageChange(newPage: number): void {
    console.log('📄 Mudança de página:', newPage);
    colaboradorStore.setPage(newPage);
  }
  
  function handleFilterChange(filterKey: string, value: any): void {
    console.log('🔍 Filtro alterado:', filterKey, value);
    colaboradorStore.setFilter(filterKey, value);
  }
  
  function handleClearFilters(): void {
    console.log('🧹 Limpando filtros...');
    colaboradorStore.clearFilters();
  }
  
  function handleRefresh(): void {
    console.log('🔄 Atualizando dados de colaboradores...');
    colaboradorStore.refresh();
  }
  
  function handleItemsPerPageChange(newSize: number): void {
    console.log('📊 Alterando itens por página:', newSize);
    colaboradorStore.setPageSize(newSize);
  }
  
  function handleNovoColaborador(): void {
    console.log('➕ Novo colaborador...');
    showNovoColaboradorModal = true;
  }
  
  function handleEditarColaborador(colaborador: ColaboradorDTO): void {
    console.log('✏️ Editar colaborador:', colaborador.id);
    colaboradorEdicao = colaborador;
    showEditarColaboradorModal = true;
  }
  
  async function handleSalvarColaborador(dados: Partial<ColaboradorDTO>): Promise<void> {
    try {
      console.log('💾 Salvando colaborador:', dados);
      
      // TODO: Implementar salvamento real quando endpoint estiver disponível
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showNovoColaboradorModal = false;
      
      await colaboradorStore.refresh();
      notify.success('Sucesso', 'Colaborador salvo com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao salvar colaborador:', error);
      notify.error('Erro', 'Não foi possível salvar o colaborador');
    }
  }
  
  async function handleAtualizarColaborador(dados: Partial<ColaboradorDTO>): Promise<void> {
    try {
      console.log('💾 Atualizando colaborador:', colaboradorEdicao?.id, dados);
      
      // TODO: Implementar atualização real quando endpoint estiver disponível
      await new Promise(resolve => setTimeout(resolve, 800));
      
      showEditarColaboradorModal = false;
      colaboradorEdicao = null;
      
      await colaboradorStore.refresh();
      notify.success('Sucesso', 'Colaborador atualizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao atualizar colaborador:', error);
      notify.error('Erro', 'Não foi possível atualizar o colaborador');
    }
  }
  
  async function handleExcluirColaborador(colaborador: ColaboradorDTO): Promise<void> {
    try {
      console.log('🗑️ Excluir colaborador:', colaborador.id);
      
      // TODO: Implementar exclusão real quando endpoint estiver disponível
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await colaboradorStore.refresh();
      notify.success('Sucesso', 'Colaborador excluído com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao excluir colaborador:', error);
      notify.error('Erro', 'Não foi possível excluir o colaborador');
    }
  }
  
  function handleCancelarModal(): void {
    showNovoColaboradorModal = false;
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
  {showNovoColaboradorModal}
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
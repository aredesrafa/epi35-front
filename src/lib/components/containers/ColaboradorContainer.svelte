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
  
  $: items = $colaboradorStore.items || [];
  $: loading = $colaboradorStore.loading;
  $: error = $colaboradorStore.error;
  $: pagination = {
    currentPage: $colaboradorStore.page,
    itemsPerPage: $colaboradorStore.pageSize,
    totalItems: $colaboradorStore.total,
    totalPages: $colaboradorStore.totalPages
  };
  $: filters = colaboradorStore.filters;
  $: contratadas = colaboradorStore.filterOptions.contratadas || [];
  
  // Debug logs
  $: console.log('👥 ColaboradorContainer - items:', items.length, items);
  $: console.log('👥 ColaboradorContainer - loading:', loading);
  $: console.log('👥 ColaboradorContainer - pagination:', pagination);
  $: console.log('👥 ColaboradorContainer - contratadas:', contratadas.length, contratadas);
  
  // ==================== LOCAL STATE ====================
  
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
      
      // Usar método create do store para salvar via API real
      await colaboradorStore.create(dados);
      
      showEditarColaboradorModal = false;
      notify.success('Sucesso', 'Colaborador salvo com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao salvar colaborador:', error);
      notify.error('Erro', 'Não foi possível salvar o colaborador');
    }
  }
  
  async function handleAtualizarColaborador(dados: Partial<ColaboradorDTO>): Promise<void> {
    try {
      console.log('💾 Atualizando colaborador:', colaboradorEdicao?.id, dados);
      
      if (!colaboradorEdicao?.id) {
        throw new Error('ID do colaborador não encontrado');
      }
      
      // Usar método update do store para atualizar via API real
      await colaboradorStore.update(colaboradorEdicao.id, dados);
      
      showEditarColaboradorModal = false;
      colaboradorEdicao = null;
      notify.success('Sucesso', 'Colaborador atualizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao atualizar colaborador:', error);
      notify.error('Erro', 'Não foi possível atualizar o colaborador');
    }
  }
  
  async function handleExcluirColaborador(colaborador: ColaboradorDTO): Promise<void> {
    try {
      console.log('🗑️ Excluir colaborador:', colaborador.id);
      
      // Usar método delete do store para excluir via API real
      await colaboradorStore.delete(colaborador.id);
      
      notify.success('Sucesso', 'Colaborador excluído com sucesso');
      
    } catch (error) {
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
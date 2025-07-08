<!--
  Contratada Container - Sistema DataLife EPI
  
  Container inteligente que gerencia lógica de negócio para gestão de contratadas.
  Utiliza store paginado para paginação server-side e operações CRUD.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { createAdvancedPaginatedStore } from '$lib/stores/paginatedStore';
  import ContratadaTablePresenter from '$lib/components/presenters/ContratadaTablePresenter.svelte';
  import { notify } from '$lib/stores';
  import type { ContratadaDTO } from '$lib/types/serviceTypes';
  
  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export let embedded = false; // Para uso em tabs
  
  // ==================== ADVANCED PAGINATED STORE ====================
  
  const contratadaStore = createAdvancedPaginatedStore<ContratadaDTO>({
    baseEndpoint: '/contratadas',
    defaultPageSize: initialPageSize,
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1000
  });
  
  // ==================== DERIVED STORES ====================
  
  $: items = $contratadaStore.items || [];
  $: loading = $contratadaStore.loading;
  $: error = $contratadaStore.error;
  $: pagination = {
    currentPage: $contratadaStore.page,
    itemsPerPage: $contratadaStore.pageSize,
    totalItems: $contratadaStore.total,
    totalPages: $contratadaStore.totalPages
  };
  $: filters = contratadaStore.filters;
  
  // Debug logs
  $: console.log('🏢 ContratadaContainer - items:', items.length, items);
  $: console.log('🏢 ContratadaContainer - loading:', loading);
  $: console.log('🏢 ContratadaContainer - pagination:', pagination);
  
  let showEditarContratadaModal = false;
  let contratadaEdicao: ContratadaDTO | null = null;
  
  // ==================== LIFECYCLE ====================
  
  onMount(() => {
    console.log('🏢 Inicializando ContratadaContainer...');
    contratadaStore.loadData();
  });
  
  // ==================== EVENT HANDLERS ====================
  
  function handlePageChange(newPage: number): void {
    console.log('📄 Mudança de página:', newPage);
    contratadaStore.setPage(newPage);
  }
  
  function handleFilterChange(filterKey: string, value: any): void {
    console.log('🔍 Filtro alterado:', filterKey, value);
    contratadaStore.setFilter(filterKey, value);
  }
  
  function handleClearFilters(): void {
    console.log('🧹 Limpando filtros...');
    contratadaStore.clearFilters();
  }
  
  function handleRefresh(): void {
    console.log('🔄 Atualizando dados de contratadas...');
    contratadaStore.refresh();
  }
  
  function handleItemsPerPageChange(newSize: number): void {
    console.log('📊 Alterando itens por página:', newSize);
    contratadaStore.setPageSize(newSize);
  }
  
  function handleNovaContratada(): void {
    console.log('➕ Nova contratada...');
    showEditarContratadaModal = true;
    contratadaEdicao = null;
  }
  
  function handleEditarContratada(contratada: ContratadaDTO): void {
    console.log('✏️ Editar contratada:', contratada.id);
    contratadaEdicao = contratada;
    showEditarContratadaModal = true;
  }
  
  async function handleSalvarContratada(dados: Partial<ContratadaDTO>): Promise<void> {
    try {
      console.log('💾 Salvando contratada:', dados);
      
      // Usar método create do store para salvar via API real
      await contratadaStore.create(dados);
      
      showEditarContratadaModal = false;
      notify.success('Sucesso', 'Contratada salva com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao salvar contratada:', error);
      notify.error('Erro', 'Não foi possível salvar a contratada');
    }
  }
  
  async function handleAtualizarContratada(dados: Partial<ContratadaDTO>): Promise<void> {
    try {
      console.log('💾 Atualizando contratada:', contratadaEdicao?.id, dados);
      
      if (!contratadaEdicao?.id) {
        throw new Error('ID da contratada não encontrado');
      }
      
      // Usar método update do store para atualizar via API real
      await contratadaStore.update(contratadaEdicao.id, dados);
      
      showEditarContratadaModal = false;
      contratadaEdicao = null;
      notify.success('Sucesso', 'Contratada atualizada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao atualizar contratada:', error);
      notify.error('Erro', 'Não foi possível atualizar a contratada');
    }
  }
  
  async function handleExcluirContratada(contratada: ContratadaDTO): Promise<void> {
    try {
      console.log('🗑️ Excluir contratada:', contratada.id);
      
      // Usar método delete do store para excluir via API real
      await contratadaStore.delete(contratada.id);
      
      notify.success('Sucesso', 'Contratada excluída com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao excluir contratada:', error);
      notify.error('Erro', 'Não foi possível excluir a contratada');
    }
  }
  
  function handleCancelarModal(): void {
    showEditarContratadaModal = false;
    contratadaEdicao = null;
  }
</script>

<!-- ==================== PRESENTER ====================

  Delega toda renderização para o ContratadaTablePresenter,
  que é um componente "burro" responsável apenas pela UI.
-->

<ContratadaTablePresenter 
  {items}
  {loading}
  {error}
  {pagination}
  {filters}
  {embedded}
  {showEditarContratadaModal}
  {contratadaEdicao}
  on:pageChange={(e) => handlePageChange(e.detail)}
  on:filterChange={(e) => handleFilterChange(e.detail.key, e.detail.value)}
  on:clearFilters={handleClearFilters}
  on:refresh={handleRefresh}
  on:itemsPerPageChange={(e) => handleItemsPerPageChange(e.detail)}
  on:novaContratada={handleNovaContratada}
  on:editarContratada={(e) => handleEditarContratada(e.detail)}
  on:excluirContratada={(e) => handleExcluirContratada(e.detail)}
  on:salvarContratada={(e) => handleSalvarContratada(e.detail)}
  on:atualizarContratada={(e) => handleAtualizarContratada(e.detail)}
  on:cancelarModal={handleCancelarModal}
/>
<!--
  Contratada Container - Sistema DataLife EPI
  
  Container inteligente que gerencia lógica de negócio para gestão de contratadas.
  Utiliza store paginado para paginação server-side e operações CRUD.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import ContratadaTablePresenter from '$lib/components/presenters/ContratadaTablePresenter.svelte';
  import { notify } from '$lib/stores';
  import type { ContratadaDTO } from '$lib/types/serviceTypes';
  import { contratadasAdapter } from '$lib/services/entity/contratadasAdapter';
  
  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export let embedded = false; // Para uso em tabs
  
  // ==================== PAGINATED STORE WITH ADAPTER ====================
  
  const contratadaStore = createPaginatedStore<ContratadaDTO>(
    async (params) => {
      console.log('🏢 Fetching contratadas with params:', params);
      const result = await contratadasAdapter.getContratadas({
        page: params.page,
        limit: params.limit,
        searchTerm: params.search,
        statusFilter: params.status
      });
      
      return {
        data: result.contratadas,
        total: result.total,
        page: result.page,
        pageSize: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      };
    },
    {
      initialPageSize,
      debounceDelay: 300,
      cacheTimeout: 5 * 60 * 1000,
      enableCache: true
    }
  );
  
  // ==================== DERIVED STORES ====================
  
  $: items = $contratadaStore?.items || [];
  $: loading = $contratadaStore?.loading || false;
  $: error = $contratadaStore?.error || null;
  $: pagination = {
    currentPage: $contratadaStore?.page || 1,
    itemsPerPage: $contratadaStore?.pageSize || initialPageSize,
    totalItems: $contratadaStore?.total || 0,
    totalPages: $contratadaStore?.totalPages || 1
  };
  
  // Debug logs
  $: console.log('🏢 ContratadaContainer - items:', items.length, items);
  $: console.log('🏢 ContratadaContainer - loading:', loading);
  $: console.log('🏢 ContratadaContainer - pagination:', pagination);
  
  let showEditarContratadaModal = false;
  let contratadaEdicao: ContratadaDTO | null = null;
  
  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('🏢 Inicializando ContratadaContainer...');
    await contratadaStore.fetchPage({ page: 1, limit: initialPageSize });
  });
  
  // ==================== EVENT HANDLERS ====================
  
  function handlePageChange(newPage: number): void {
    console.log('📄 Mudança de página:', newPage);
    contratadaStore.goToPage(newPage);
  }
  
  function handleFilterChange(filterKey: string, value: any): void {
    console.log('🔍 Filtro alterado:', filterKey, value);
    contratadaStore.setFilters({ [filterKey]: value });
  }
  
  function handleClearFilters(): void {
    console.log('🧹 Limpando filtros...');
    contratadaStore.reset();
  }
  
  function handleRefresh(): void {
    console.log('🔄 Atualizando dados de contratadas...');
    contratadaStore.reload();
  }
  
  function handleItemsPerPageChange(newSize: number): void {
    console.log('📊 Alterando itens por página:', newSize);
    contratadaStore.fetchPage({ page: 1, limit: newSize });
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
      
      // Usar adapter diretamente para criar contratada
      await contratadasAdapter.createContratada(dados as any);
      
      showEditarContratadaModal = false;
      notify.success('Sucesso', 'Contratada salva com sucesso');
      
      // Reload data after creation
      await contratadaStore.reload();
      
    } catch (error: any) {
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
      
      // Usar adapter diretamente para atualizar contratada
      await contratadasAdapter.updateContratada(contratadaEdicao.id, dados as any);
      
      showEditarContratadaModal = false;
      contratadaEdicao = null;
      notify.success('Sucesso', 'Contratada atualizada com sucesso');
      
      // Reload data after update
      await contratadaStore.reload();
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar contratada:', error);
      notify.error('Erro', 'Não foi possível atualizar a contratada');
    }
  }
  
  async function handleExcluirContratada(contratada: ContratadaDTO): Promise<void> {
    try {
      console.log('🗑️ Excluir contratada:', contratada.id);
      
      // Usar adapter diretamente para excluir contratada
      await contratadasAdapter.deleteContratada(contratada.id);
      
      notify.success('Sucesso', 'Contratada excluída com sucesso');
      
      // Reload data after deletion
      await contratadaStore.reload();
      
    } catch (error: any) {
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
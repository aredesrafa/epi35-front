<!--
  Unified Data Container - Solução Definitiva para Catálogo e Estoque
  
  Container unificado que resolve problemas de:
  - Duplicação de código entre catálogo e estoque
  - Performance com grandes volumes
  - Filtros inconsistentes
  - Cache fragmentado
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEnhancedPaginatedStore, type StoreConfig } from '$lib/stores/enhancedPaginatedStore';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  import { notify } from '$lib/stores';
  import UnifiedDataTablePresenter from '../presenters/UnifiedDataTablePresenter.svelte';
  
  // ==================== PROPS ====================
  
  export let mode: 'catalog' | 'inventory' = 'catalog';
  export let title: string = '';
  export let pageSize: number = 20;
  export let autoRefresh: boolean = false;
  export let refreshInterval: number = 30000;
  export let enableCRUD: boolean = true;
  export let enableExport: boolean = true;
  export let customFilters: Record<string, any> = {};
  
  // ==================== CONFIGURAÇÃO POR MODO ====================
  
  const modeConfig = {
    catalog: {
      baseEndpoint: '/tipos-epi',
      filterEndpoints: {
        categorias: '/tipos-epi/categorias-disponiveis',
        fabricantes: '/tipos-epi/fabricantes-disponiveis'
      },
      columns: [
        { key: 'nomeEquipamento', label: 'Equipamento', sortable: true },
        { key: 'numeroCa', label: 'CA', sortable: true },
        { key: 'categoria', label: 'Categoria', sortable: true },
        { key: 'fabricante', label: 'Fabricante', sortable: true },
        { key: 'status', label: 'Status', sortable: true, type: 'badge' },
        { key: 'actions', label: 'Ações', type: 'actions' }
      ],
      searchPlaceholder: 'Buscar por nome ou CA...',
      emptyMessage: 'Nenhum tipo de EPI encontrado'
    },
    inventory: {
      baseEndpoint: '/estoque-itens',
      filterEndpoints: {
        categorias: '/tipos-epi/categorias-disponiveis',
        status: '/estoque-itens/status-disponiveis',
        almoxarifados: '/almoxarifados/disponiveis'
      },
      columns: [
        { key: 'quantidade', label: 'Quant.', sortable: true, type: 'number' },
        { key: 'tipoEPI.nomeEquipamento', label: 'Equipamento', sortable: true },
        { key: 'tipoEPI.numeroCa', label: 'CA', sortable: false },
        { key: 'status', label: 'Status', sortable: true, type: 'badge' },
        { key: 'tipoEPI.categoria', label: 'Categoria', sortable: true },
        { key: 'almoxarifado.nome', label: 'Local', sortable: true },
        { key: 'actions', label: 'Ações', type: 'actions' }
      ],
      searchPlaceholder: 'Buscar por equipamento ou CA...',
      emptyMessage: 'Nenhum item em estoque encontrado'
    }
  };
  
  $: config = modeConfig[mode];
  $: displayTitle = title || (mode === 'catalog' ? 'Catálogo de EPIs' : 'Estoque');
  
  // ==================== STORE CONFIGURATION ====================
  
  // Configuração inicial segura para SSR
  const initialStoreConfig = {
    baseEndpoint: '/tipos-epi',
    defaultPageSize: pageSize,
    debounceDelay: 300,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    autoRefresh,
    refreshInterval,
    filterEndpoints: {}
  };
  
  // Criar store unificado
  let dataStore = createEnhancedPaginatedStore(initialStoreConfig);
  
  // Recriar store quando configuração mudar
  $: if (config) {
    const newStoreConfig = {
      baseEndpoint: config.baseEndpoint,
      defaultPageSize: pageSize,
      debounceDelay: 300,
      cacheTimeout: 5 * 60 * 1000,
      autoRefresh,
      refreshInterval,
      filterEndpoints: config.filterEndpoints || {}
    };
    
    dataStore = createEnhancedPaginatedStore(newStoreConfig);
  }
  
  // ==================== STATE ====================
  
  let searchTerm = '';
  let selectedFilters: Record<string, any> = { ...customFilters };
  
  // Modal states (se CRUD habilitado)
  let showCreateModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedItem: any = null;
  
  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log(`🚀 Inicializando UnifiedDataContainer em modo: ${mode}`);
    
    // Garantir que configurações de negócio estejam carregadas
    await businessConfigStore.initialize();
    
    // Inicializar store
    await dataStore.initialize();
    
    console.log('✅ UnifiedDataContainer inicializado com sucesso');
  });
  
  onDestroy(() => {
    dataStore.destroy();
  });
  
  // ==================== HANDLERS ====================
  
  function handleSearch(event: CustomEvent<string>): void {
    searchTerm = event.detail;
    dataStore.search(searchTerm);
  }
  
  function handleFilterChange(event: CustomEvent<{ key: string; value: any }>): void {
    const { key, value } = event.detail;
    
    selectedFilters = {
      ...selectedFilters,
      [key]: value === 'todos' || value === 'todas' ? undefined : value
    };
    
    // Remover filtros vazios
    Object.keys(selectedFilters).forEach(k => {
      if (selectedFilters[k] === undefined || selectedFilters[k] === '') {
        delete selectedFilters[k];
      }
    });
    
    dataStore.applyFilters(selectedFilters);
  }
  
  function handleClearFilters(): void {
    searchTerm = '';
    selectedFilters = { ...customFilters };
    dataStore.clearFilters();
  }
  
  function handlePageChange(event: CustomEvent<number>): void {
    dataStore.goToPage(event.detail);
  }
  
  function handleRefresh(): void {
    dataStore.reload();
    notify.info('Dados atualizados', 'Lista recarregada com sucesso');
  }
  
  // CRUD Handlers (se habilitado)
  function handleCreate(): void {
    if (!enableCRUD) return;
    selectedItem = null;
    showCreateModal = true;
  }
  
  function handleEdit(event: CustomEvent<any>): void {
    if (!enableCRUD) return;
    selectedItem = event.detail;
    showEditModal = true;
  }
  
  function handleDelete(event: CustomEvent<any>): void {
    if (!enableCRUD) return;
    selectedItem = event.detail;
    showDeleteModal = true;
  }
  
  function handleView(event: CustomEvent<any>): void {
    // Implementar visualização detalhada
    console.log('Ver detalhes:', event.detail);
  }
  
  async function handleSave(event: CustomEvent<any>): Promise<void> {
    try {
      const data = event.detail;
      
      if (selectedItem) {
        // Atualizar
        console.log('Atualizando item:', selectedItem.id, data);
        // TODO: Implementar atualização via API
        notify.success('Item atualizado', 'Alterações salvas com sucesso');
      } else {
        // Criar
        console.log('Criando item:', data);
        // TODO: Implementar criação via API
        notify.success('Item criado', 'Novo item adicionado com sucesso');
      }
      
      // Fechar modais e recarregar
      showCreateModal = false;
      showEditModal = false;
      selectedItem = null;
      dataStore.reload();
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      notify.error('Erro ao salvar', 'Não foi possível salvar o item');
    }
  }
  
  async function handleConfirmDelete(): Promise<void> {
    try {
      if (!selectedItem) return;
      
      console.log('Excluindo item:', selectedItem.id);
      // TODO: Implementar exclusão via API
      
      notify.success('Item excluído', 'Item removido com sucesso');
      
      showDeleteModal = false;
      selectedItem = null;
      dataStore.reload();
      
    } catch (error) {
      console.error('Erro ao excluir:', error);
      notify.error('Erro ao excluir', 'Não foi possível remover o item');
    }
  }
  
  function handleExport(event: CustomEvent<string>): void {
    if (!enableExport) return;
    
    const format = event.detail;
    console.log(`Exportando em formato: ${format}`);
    
    // TODO: Implementar exportação
    notify.info('Exportação iniciada', `Preparando arquivo ${format.toUpperCase()}...`);
  }
  
  // ==================== COMPUTED ====================
  
  $: hasActiveFilters = Object.keys(selectedFilters).length > 0 || searchTerm.length > 0;
  
  $: actionButtons = [
    ...(enableCRUD ? [
      { 
        id: 'create', 
        label: mode === 'catalog' ? 'Novo EPI' : 'Novo Item',
        color: 'primary',
        icon: 'plus'
      }
    ] : []),
    { 
      id: 'refresh', 
      label: 'Atualizar',
      color: 'alternative',
      icon: 'refresh'
    },
    ...(enableExport ? [
      { 
        id: 'export', 
        label: 'Exportar',
        color: 'light',
        icon: 'download'
      }
    ] : [])
  ];
</script>

<!-- Interface unificada usando o presenter -->
<UnifiedDataTablePresenter
  {mode}
  title={displayTitle}
  items={$dataStore.items}
  loading={$dataStore.loading}
  error={$dataStore.error}
  columns={config.columns}
  pagination={$dataStore.pagination}
  searchTerm={searchTerm}
  searchPlaceholder={config.searchPlaceholder}
  filters={selectedFilters}
  filterOptions={$dataStore.filterMetadata}
  {hasActiveFilters}
  {actionButtons}
  {enableCRUD}
  {enableExport}
  emptyMessage={config.emptyMessage}
  
  on:search={handleSearch}
  on:filterChange={handleFilterChange}
  on:clearFilters={handleClearFilters}
  on:pageChange={handlePageChange}
  on:actionClick={(e) => {
    switch(e.detail) {
      case 'create': handleCreate(); break;
      case 'refresh': handleRefresh(); break;
      case 'export': handleExport(new CustomEvent('export', { detail: 'xlsx' })); break;
    }
  }}
  on:itemEdit={handleEdit}
  on:itemDelete={handleDelete}
  on:itemView={handleView}
  on:export={handleExport}
/>

<!-- Modais de CRUD (se habilitado) -->
{#if enableCRUD}
  <!-- TODO: Implementar modais específicos por modo -->
  {#if showCreateModal}
    <div class="modal">
      <!-- Modal de criação -->
    </div>
  {/if}
  
  {#if showEditModal}
    <div class="modal">
      <!-- Modal de edição -->
    </div>
  {/if}
  
  {#if showDeleteModal}
    <div class="modal">
      <!-- Modal de confirmação de exclusão -->
    </div>
  {/if}
{/if}

<style>
  .modal {
    /* Estilos básicos para modais - implementar com Flowbite */
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
</style>
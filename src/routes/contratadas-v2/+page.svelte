<!-- 
  Contratadas v2 - Nova Funcionalidade
  
  Página de gestão de empresas contratadas usando arquitetura moderna:
  - Container/Presenter pattern
  - Server-side pagination
  - Validação CNPJ em tempo real
  - CRUD completo
  - Filtros avançados
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { 
    contratadaStore, 
    contratadaData, 
    contratadaLoading, 
    contratadaError,
    contratadaStats,
    loadContratadas,
    searchContratadas,
    filterContratadas,
    clearContratadaFilters,
    deleteContratada
  } from '$lib/stores/contratadaStore';
  
  // Flowbite components
  import { 
    Button, 
    Card, 
    Input, 
    Select, 
    Table, 
    TableBody, 
    TableBodyCell, 
    TableBodyRow, 
    TableHead, 
    TableHeadCell,
    Badge,
    Modal,
    Alert,
    Spinner,
    Breadcrumb,
    BreadcrumbItem
  } from 'flowbite-svelte';
  
  // Icons
  import { 
    PlusOutline, 
    SearchOutline, 
    EditOutline, 
    TrashBinOutline,
    FilterOutline,
    DownloadOutline,
    ExclamationTriangleOutline
  } from 'flowbite-svelte-icons';
  
  // Componentes locais
  import ContratadaFormModal from '$lib/components/modals/ContratadaFormModal.svelte';
  import ContratadaDeleteModal from '$lib/components/modals/ContratadaDeleteModal.svelte';
  import StatsCard from '$lib/components/common/StatsCard.svelte';
  
  // ==================== ESTADO LOCAL ====================
  
  // Filtros
  let searchTerm = '';
  let statusFilter = '';
  let showFilters = false;
  
  // Modals
  let showCreateModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedContratada: any = null;
  
  // Ordenação
  let currentSort = '';
  let sortDirection: 'asc' | 'desc' = 'asc';
  
  // Paginação - valores reativos do store
  $: currentPage = $contratadaStore.page;
  $: totalPages = $contratadaStore.totalPages;
  $: hasNext = $contratadaStore.hasNext;
  $: hasPrev = $contratadaStore.hasPrev;
  
  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('🏢 Inicializando página Contratadas v2...');
    
    // Carregar dados iniciais
    await loadContratadas();
    
    console.log('✅ Página Contratadas v2 inicializada');
  });
  
  // ==================== HANDLERS ====================
  
  function handleSearch() {
    if (searchTerm.trim()) {
      searchContratadas(searchTerm.trim());
    } else {
      clearContratadaFilters();
    }
  }
  
  function handleFilterChange() {
    const filters: any = {};
    
    if (statusFilter) {
      filters.status = statusFilter;
    }
    
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    
    filterContratadas(filters);
  }
  
  function handleClearFilters() {
    searchTerm = '';
    statusFilter = '';
    clearContratadaFilters();
  }
  
  function handleSort(field: string) {
    if (currentSort === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort = field;
      sortDirection = 'asc';
    }
    
    contratadaStore.setSorting(field, sortDirection);
  }
  
  function handleCreate() {
    selectedContratada = null;
    showCreateModal = true;
  }
  
  function handleEdit(contratada: any) {
    selectedContratada = contratada;
    showEditModal = true;
  }
  
  function handleDelete(contratada: any) {
    selectedContratada = contratada;
    showDeleteModal = true;
  }
  
  async function handleDeleteConfirm() {
    if (selectedContratada) {
      try {
        await deleteContratada(selectedContratada.id);
        showDeleteModal = false;
        selectedContratada = null;
      } catch (error) {
        console.error('Erro ao deletar contratada:', error);
      }
    }
  }
  
  function handleView(contratada: any) {
    goto(`/contratadas-v2/${contratada.id}`);
  }
  
  // Paginação
  function handlePreviousPage() {
    if (hasPrev()) {
      contratadaStore.prevPage();
    }
  }
  
  function handleNextPage() {
    if (hasNext()) {
      contratadaStore.nextPage();
    }
  }
  
  function handlePageChange(page: number) {
    contratadaStore.goToPage(page);
  }
  
  // ==================== HELPERS ====================
  
  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'ATIVA': return 'green';
      case 'INATIVA': return 'gray';
      case 'SUSPENSA': return 'red';
      default: return 'gray';
    }
  }
  
  function formatCNPJ(cnpj: string): string {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }
  
  // ==================== REATIVIDADE ====================
  
  // Aplicar filtros quando mudarem
  $: if (statusFilter !== undefined) {
    handleFilterChange();
  }
</script>

<!-- ==================== HTML ==================== -->

<svelte:head>
  <title>Contratadas - DataLife EPI</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Breadcrumb -->
  <div class="px-4 pt-4">
    <Breadcrumb aria-label="Navegação" class="mb-4">
      <BreadcrumbItem href="/" home>Início</BreadcrumbItem>
      <BreadcrumbItem>Contratadas</BreadcrumbItem>
    </Breadcrumb>
  </div>

  <div class="px-4 pb-4">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Empresas Contratadas
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Gestão de empresas contratadas e colaboradores vinculados
          </p>
        </div>
        
        <div class="flex gap-2">
          <Button 
            size="sm" 
            color="light"
            on:click={() => showFilters = !showFilters}
          >
            <FilterOutline class="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          <Button 
            size="sm" 
            color="primary"
            on:click={handleCreate}
          >
            <PlusOutline class="w-4 h-4 mr-2" />
            Nova Contratada
          </Button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    {#if $contratadaStats}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total"
          value={$contratadaStats.total}
          icon="building"
          color="blue"
        />
        <StatsCard
          title="Ativas"
          value={$contratadaStats.ativas}
          icon="check-circle"
          color="green"
        />
        <StatsCard
          title="Total Colaboradores"
          value={$contratadaStats.totalColaboradores}
          icon="users"
          color="purple"
        />
        <StatsCard
          title="Média por Contratada"
          value={$contratadaStats.mediaColaboradoresPorContratada}
          icon="chart"
          color="orange"
          suffix="colaboradores"
        />
      </div>
    {/if}

    <!-- Filtros (expandível) -->
    {#if showFilters}
      <Card class="mb-6">
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Filtros Avançados
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Busca -->
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div class="relative">
                <Input
                  id="search"
                  placeholder="Nome, razão social ou CNPJ..."
                  bind:value={searchTerm}
                  on:input={handleSearch}
                  class="pl-10"
                />
                <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select
                id="status"
                bind:value={statusFilter}
                placeholder="Todos os status"
              >
                <option value="">Todos os status</option>
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
                <option value="SUSPENSA">Suspensa</option>
              </Select>
            </div>
            
            <!-- Ações -->
            <div class="flex items-end gap-2">
              <Button size="sm" color="light" on:click={handleClearFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    {/if}

    <!-- Tabela Principal -->
    <Card>
      <!-- Loading State -->
      {#if $contratadaLoading}
        <div class="flex items-center justify-center py-12">
          <Spinner size="8" />
          <span class="ml-3 text-gray-600 dark:text-gray-400">
            Carregando contratadas...
          </span>
        </div>
      {:else if $contratadaError}
        <!-- Error State -->
        <Alert color="red" class="mb-4">
          <ExclamationTriangleOutline slot="icon" class="w-4 h-4" />
          <span class="font-medium">Erro ao carregar dados:</span> {$contratadaError}
        </Alert>
      {:else if $contratadaData.length === 0}
        <!-- Empty State -->
        <div class="text-center py-12">
          <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma contratada encontrada
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter ? 'Tente ajustar os filtros.' : 'Comece adicionando uma nova contratada.'}
          </p>
          {#if !searchTerm && !statusFilter}
            <Button color="primary" on:click={handleCreate}>
              <PlusOutline class="w-4 h-4 mr-2" />
              Adicionar Primeira Contratada
            </Button>
          {/if}
        </div>
      {:else}
        <!-- Data Table -->
        <div class="overflow-x-auto">
          <Table>
            <TableHead>
              <TableHeadCell class="cursor-pointer" on:click={() => handleSort('nome')}>
                <div class="flex items-center">
                  Nome / Razão Social
                  {#if currentSort === 'nome'}
                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </div>
              </TableHeadCell>
              <TableHeadCell class="cursor-pointer" on:click={() => handleSort('cnpj')}>
                <div class="flex items-center">
                  CNPJ
                  {#if currentSort === 'cnpj'}
                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </div>
              </TableHeadCell>
              <TableHeadCell class="cursor-pointer" on:click={() => handleSort('status')}>
                <div class="flex items-center">
                  Status
                  {#if currentSort === 'status'}
                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </div>
              </TableHeadCell>
              <TableHeadCell class="cursor-pointer" on:click={() => handleSort('totalColaboradores')}>
                <div class="flex items-center">
                  Colaboradores
                  {#if currentSort === 'totalColaboradores'}
                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </div>
              </TableHeadCell>
              <TableHeadCell class="cursor-pointer" on:click={() => handleSort('dataInicioContrato')}>
                <div class="flex items-center">
                  Início Contrato
                  {#if currentSort === 'dataInicioContrato'}
                    <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </div>
              </TableHeadCell>
              <TableHeadCell>Ações</TableHeadCell>
            </TableHead>
            <TableBody>
              {#each $contratadaData as contratada (contratada.id)}
                <TableBodyRow class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableBodyCell>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {contratada.nome}
                      </div>
                      {#if contratada.razaoSocial !== contratada.nome}
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          {contratada.razaoSocial}
                        </div>
                      {/if}
                    </div>
                  </TableBodyCell>
                  <TableBodyCell>
                    <code class="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {formatCNPJ(contratada.cnpj)}
                    </code>
                  </TableBodyCell>
                  <TableBodyCell>
                    <Badge color={getStatusBadgeColor(contratada.status)} class="w-fit">
                      {contratada.status}
                    </Badge>
                  </TableBodyCell>
                  <TableBodyCell>
                    <div class="text-center">
                      <span class="font-medium">{contratada.totalColaboradores || 0}</span>
                      <div class="text-xs text-gray-500">
                        {contratada.colaboradoresAtivos || 0} ativos
                      </div>
                    </div>
                  </TableBodyCell>
                  <TableBodyCell>
                    {formatDate(contratada.dataInicioContrato)}
                  </TableBodyCell>
                  <TableBodyCell>
                    <div class="flex gap-1">
                      <Button 
                        size="xs" 
                        color="light"
                        on:click={() => handleView(contratada)}
                        title="Ver detalhes"
                      >
                        <SearchOutline class="w-3 h-3" />
                      </Button>
                      <Button 
                        size="xs" 
                        color="light"
                        on:click={() => handleEdit(contratada)}
                        title="Editar"
                      >
                        <EditOutline class="w-3 h-3" />
                      </Button>
                      <Button 
                        size="xs" 
                        color="red"
                        on:click={() => handleDelete(contratada)}
                        title="Excluir"
                      >
                        <TrashBinOutline class="w-3 h-3" />
                      </Button>
                    </div>
                  </TableBodyCell>
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
        </div>

        <!-- Paginação -->
        {#if totalPages > 1}
          <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Página {currentPage} de {totalPages}
            </div>
            
            <div class="flex gap-2">
              <Button 
                size="sm" 
                color="light" 
                disabled={!hasPrev()}
                on:click={handlePreviousPage}
              >
                Anterior
              </Button>
              
              <!-- Page numbers (mostrar algumas páginas) -->
              {#each Array(Math.min(5, totalPages)) as _, i}
                {@const pageNum = Math.max(1, currentPage - 2) + i}
                {#if pageNum <= totalPages}
                  <Button 
                    size="sm" 
                    color={pageNum === currentPage ? 'primary' : 'light'}
                    on:click={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                {/if}
              {/each}
              
              <Button 
                size="sm" 
                color="light" 
                disabled={!hasNext()}
                on:click={handleNextPage}
              >
                Próxima
              </Button>
            </div>
          </div>
        {/if}
      {/if}
    </Card>
  </div>
</div>

<!-- ==================== MODALS ==================== -->

<!-- Modal de Criação/Edição -->
<ContratadaFormModal 
  bind:show={showCreateModal}
  contratada={selectedContratada}
  on:success={() => {
    showCreateModal = false;
    selectedContratada = null;
    loadContratadas(); // Reload data
  }}
  on:cancel={() => {
    showCreateModal = false;
    selectedContratada = null;
  }}
/>

<!-- Modal de Edição -->
<ContratadaFormModal 
  bind:show={showEditModal}
  contratada={selectedContratada}
  on:success={() => {
    showEditModal = false;
    selectedContratada = null;
    loadContratadas(); // Reload data
  }}
  on:cancel={() => {
    showEditModal = false;
    selectedContratada = null;
  }}
/>

<!-- Modal de Confirmação de Exclusão -->
<ContratadaDeleteModal
  bind:show={showDeleteModal}
  contratada={selectedContratada}
  on:confirm={handleDeleteConfirm}
  on:cancel={() => {
    showDeleteModal = false;
    selectedContratada = null;
  }}
/>

<!-- ==================== STYLES ==================== -->

<style>
  /* Estilos específicos para a tabela */
  :global(.table-hover tbody tr:hover) {
    background-color: rgb(249 250 251);
  }
  
  :global(.dark .table-hover tbody tr:hover) {
    background-color: rgb(31 41 55);
  }
  
  /* Loading spinner customizado */
  :global(.custom-spinner) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
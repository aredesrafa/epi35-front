<!--
  Catalog Table Presenter - Componente "Burro"
  
  Responsabilidades:
  - Renderizar UI da tabela de catálogo
  - Renderizar filtros e busca
  - Renderizar paginação
  - Emitir eventos para o Container
  - Zero lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, Button, Input, Badge, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell } from 'flowbite-svelte';
  import { PlusOutline, SearchOutline, EyeOutline, PenOutline, TrashBinOutline, RefreshOutline } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import type { TipoEPI } from '$lib/services/entity/catalogAdapter';
  import { formatarData } from '$lib/utils/dateHelpers';

  // ==================== PROPS ====================
  
  export let items: TipoEPI[] = [];
  export let loading = false;
  export let error: string | null = null;
  
  export let pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  
  export let filters: {
    searchTerm: string;
    categoriaFilter: string;
    statusFilter: string;
    hasActiveFilters: boolean;
  };
  
  export let filterOptions: {
    categorias: Array<{ value: string; label: string }>;
  };

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    searchChange: string;
    categoriaFilterChange: string;
    statusFilterChange: string;
    clearFilters: void;
    pageChange: number;
    pageSizeChange: number;
    novoEPI: void;
    editarEPI: TipoEPI;
    visualizarEPI: TipoEPI;
    excluirEPI: TipoEPI;
  }>();

  // ==================== STATUS OPTIONS ====================
  
  const statusOptions = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'DESCONTINUADO', label: 'Descontinuado' }
  ];

  // ==================== HANDLERS ====================
  
  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('searchChange', target.value);
  }

  function handleCategoriaChange(event: CustomEvent<string>): void {
    dispatch('categoriaFilterChange', event.detail);
  }


  function handleStatusChange(event: CustomEvent<string>): void {
    dispatch('statusFilterChange', event.detail);
  }

  function handleClearFilters(): void {
    dispatch('clearFilters');
  }

  function handlePageChange(page: number): void {
    dispatch('pageChange', page);
  }

  function handleNovoEPI(): void {
    dispatch('novoEPI');
  }

  function handleEditarEPI(epi: TipoEPI): void {
    dispatch('editarEPI', epi);
  }

  function handleVisualizarEPI(epi: TipoEPI): void {
    dispatch('visualizarEPI', epi);
  }

  function handleExcluirEPI(epi: TipoEPI): void {
    dispatch('excluirEPI', epi);
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: statusBadgeColor = (ativo: boolean) => ativo ? 'green' : 'red';
  $: statusText = (ativo: boolean) => ativo ? 'Ativo' : 'Inativo';
</script>

<svelte:head>
  <title>Catálogo de EPIs - DataLife EPI</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-medium text-gray-900 dark:text-white">Catálogo de EPIs</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Gerencie os tipos de equipamentos de proteção individual
      </p>
    </div>
    <div class="flex space-x-2">
      <Button size="sm" color="primary" class="rounded-sm" on:click={handleNovoEPI}>
        <PlusOutline class="w-4 h-4 mr-2" />
        Novo EPI
      </Button>
    </div>
  </div>

  <!-- Content -->
  {#if loading}
    <LoadingSpinner />
  {:else if error}
    <ErrorDisplay 
      {error} 
      onRetry={() => dispatch('pageChange', pagination.currentPage)}
    />
  {:else if items.length > 0}
    <!-- Table with Filters -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <!-- Filters inside table container -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="relative">
            <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar EPIs..."
              class="pl-10 rounded-sm h-10 text-sm"
              value={filters.searchTerm}
              on:input={handleSearchInput}
            />
          </div>
          
          <!-- Category Filter -->
          <SearchableDropdown
            options={filterOptions.categorias}
            value={filters.categoriaFilter}
            placeholder="Categoria"
            on:change={handleCategoriaChange}
          />
          
          <!-- Status Filter -->
          <SearchableDropdown
            options={statusOptions}
            value={filters.statusFilter}
            placeholder="Status"
            on:change={handleStatusChange}
          />
          
          <!-- Clear Filters - only show if there are active filters -->
          {#if filters.hasActiveFilters}
            <Button 
              color="alternative" 
              class="rounded-sm h-10 w-10 p-0 flex items-center justify-center" 
              on:click={handleClearFilters}
              title="Limpar Filtros"
            >
              <RefreshOutline class="w-4 h-4" />
            </Button>
          {:else}
            <!-- Empty div to maintain grid layout -->
            <div></div>
          {/if}
        </div>
      </div>
      
      <!-- Table content with responsive behavior -->
      <div class="min-w-[980px] overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Nome do Equipamento</TableHeadCell>
            <TableHeadCell>Número CA</TableHeadCell>
            <TableHeadCell>Categoria</TableHeadCell>
            <TableHeadCell>Validade Padrão</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Ações</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each items as epi (epi.id)}
              <TableBodyRow 
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                on:click={() => handleVisualizarEPI(epi)}
              >
                <TableBodyCell>
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {epi.nomeEquipamento}
                    </span>
                    {#if epi.descricao}
                      <span class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {epi.descricao}
                      </span>
                    {/if}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm">{epi.numeroCa || epi.numeroCA}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="text-sm">{epi.categoria}</span>
                </TableBodyCell>
                <TableBodyCell>
                  {#if epi.vidaUtilDias || epi.validadePadrao}
                    <span class="text-sm">
                      {Math.round((epi.vidaUtilDias || epi.validadePadrao) / 30)} meses
                    </span>
                  {:else}
                    <span class="text-sm text-gray-400">-</span>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  {#if epi.status}
                    <Badge color={epi.status === 'ATIVO' ? 'green' : 'red'} class="w-fit rounded-sm">
                      {epi.status === 'ATIVO' ? 'Ativo' : 'Descontinuado'}
                    </Badge>
                  {:else}
                    <Badge color={statusBadgeColor(epi.ativo)} class="w-fit rounded-sm">
                      {statusText(epi.ativo)}
                    </Badge>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex space-x-1">
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={(e) => { e.stopPropagation(); handleVisualizarEPI(epi); }}
                      title="Visualizar"
                    >
                      <EyeOutline class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={(e) => { e.stopPropagation(); handleEditarEPI(epi); }}
                      title="Editar"
                    >
                      <PenOutline class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={(e) => { e.stopPropagation(); handleExcluirEPI(epi); }}
                      title="Excluir"
                    >
                      <TrashBinOutline class="w-4 h-4" />
                    </button>
                  </div>
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
      
      <!-- Pagination -->
      {#if pagination.totalPages > 1}
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.total)} a {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} de {pagination.total} resultados
          </div>
          <div class="flex space-x-2">
            <Button
                            color="alternative"
              class="rounded-sm"
              disabled={!pagination.hasPrev}
              on:click={() => handlePageChange(pagination.currentPage - 1)}
            >
              Anterior
            </Button>
            <span class="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <Button
                            color="alternative"
              class="rounded-sm"
              disabled={!pagination.hasNext}
              on:click={() => handlePageChange(pagination.currentPage + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Empty state -->
    <Card size="sm" class="rounded-sm">
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <SearchOutline class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhum EPI encontrado
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {filters.hasActiveFilters
            ? 'Tente ajustar os filtros ou termo de busca'
            : 'Comece cadastrando um novo tipo de EPI'}
        </p>
        <Button size="sm" color="primary" class="rounded-sm" on:click={handleNovoEPI}>
          <PlusOutline class="w-4 h-4 mr-2" />
          {!filters.hasActiveFilters ? 'Primeiro EPI' : 'Novo EPI'}
        </Button>
      </div>
    </Card>
  {/if}
</div>
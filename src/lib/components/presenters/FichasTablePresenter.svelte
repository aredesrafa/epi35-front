<!--
  Fichas Table Presenter - Componente "Burro"
  
  Responsabilidades:
  - Renderizar UI da tabela de fichas
  - Renderizar filtros e busca
  - Renderizar paginação
  - Emitir eventos para o Container
  - Zero lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, Button, Input, Badge, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Checkbox } from 'flowbite-svelte';
  import { PlusOutline, SearchOutline, RefreshOutline, EyeOutline } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import type { FichaEPIDTO } from '$lib/types/serviceTypes';
  import { formatarData } from '$lib/utils/dateHelpers';

  // ==================== PROPS ====================
  
  export let items: FichaEPIDTO[] = [];
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
    empresaFilter: string;
    cargoFilter: string;
    devolucaoPendente: boolean;
    hasActiveFilters: boolean;
  };
  
  export let filterOptions: {
    empresas: Array<{ value: string; label: string }>;
    cargos: Array<{ value: string; label: string }>;
  };

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    searchChange: string;
    empresaFilterChange: string;
    cargoFilterChange: string;
    devolucaoPendenteChange: boolean;
    clearFilters: void;
    pageChange: number;
    pageSizeChange: number;
    viewDetail: string;
    refresh: void;
    novaFicha: void;
  }>();

  // ==================== HANDLERS ====================
  
  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('searchChange', target.value);
  }

  function handleEmpresaChange(event: CustomEvent<string>): void {
    dispatch('empresaFilterChange', event.detail);
  }

  function handleCargoChange(event: CustomEvent<string>): void {
    dispatch('cargoFilterChange', event.detail);
  }


  function handleDevolucaoPendenteChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('devolucaoPendenteChange', target.checked);
  }

  function handleClearFilters(): void {
    dispatch('clearFilters');
  }

  function handlePageChange(page: number): void {
    dispatch('pageChange', page);
  }

  function handleViewDetail(fichaId: string): void {
    dispatch('viewDetail', fichaId);
  }

  function handleRefresh(): void {
    dispatch('refresh');
  }

  function handleNovaFicha(): void {
    dispatch('novaFicha');
  }

  // ==================== COMPUTED PROPERTIES ====================
</script>

<svelte:head>
  <title>Fichas de EPI - DataLife EPI</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-medium text-gray-900 dark:text-white">Fichas de EPI</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Gerencie as fichas individuais de equipamentos de proteção
      </p>
    </div>
    <div class="flex space-x-2">
      <Button size="sm" color="primary" class="rounded-sm" on:click={handleNovaFicha}>
        <PlusOutline class="w-4 h-4 mr-2" />
        Nova Ficha
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
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Search -->
          <div class="relative">
            <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar colaborador..."
              class="pl-10 rounded-sm h-10 text-sm"
              value={filters.searchTerm}
              on:input={handleSearchInput}
            />
          </div>
          
          <!-- Empresa Filter -->
          <SearchableDropdown
            options={filterOptions.empresas}
            value={filters.empresaFilter}
            placeholder="Empresa"
            on:change={handleEmpresaChange}
          />
          
          <!-- Cargo Filter -->
          <SearchableDropdown
            options={filterOptions.cargos}
            value={filters.cargoFilter}
            placeholder="Cargo"
            on:change={handleCargoChange}
          />

          <!-- Devolução Pendente Checkbox -->
          <div class="flex items-center">
            <Checkbox
              checked={filters.devolucaoPendente}
              on:change={handleDevolucaoPendenteChange}
            >
              Pendentes devolução
            </Checkbox>
          </div>
          
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
      <div class="min-w-[680px] overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Colaborador</TableHeadCell>
            <TableHeadCell>Empresa</TableHeadCell>
            <TableHeadCell>EPIs Ativos</TableHeadCell>
            <TableHeadCell>Ações</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each items as ficha (ficha.id)}
              <TableBodyRow 
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                on:click={() => handleViewDetail(ficha.id)}
              >
                <TableBodyCell>
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {ficha.colaborador.nome}
                    </span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {ficha.colaborador.cpf || 'CPF não informado'} • {ficha.colaborador.matricula || 'S/N'}
                    </span>
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <div>
                    <span class="font-medium text-gray-900 dark:text-white">
                      {ficha.colaborador.empresa}
                    </span>
                    {#if ficha.contratada}
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {ficha.contratada.nome}
                      </div>
                    {/if}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex flex-wrap gap-1">
                    <Badge color="blue" class="w-fit rounded-sm">
                      {ficha.episInfo?.totalEpisAtivos || ficha.totalEpisAtivos || 0} EPIs
                    </Badge>
                    {#if (ficha.episInfo?.episExpirados || ficha.totalEpisVencidos) && (ficha.episInfo?.episExpirados > 0 || ficha.totalEpisVencidos > 0)}
                      <Badge color="red" class="w-fit rounded-sm">
                        {ficha.episInfo?.episExpirados || ficha.totalEpisVencidos} vencido(s)
                      </Badge>
                    {/if}
                  </div>
                  {#if ficha.episInfo?.tiposEpisAtivos && ficha.episInfo.tiposEpisAtivos.length > 0}
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {ficha.episInfo.tiposEpisAtivos.slice(0, 2).map(tipo => `${tipo.quantidade}x ${tipo.tipoEpiNome}`).join(', ')}
                      {#if ficha.episInfo.tiposEpisAtivos.length > 2}
                        <span>... +{ficha.episInfo.tiposEpisAtivos.length - 2}</span>
                      {/if}
                    </div>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex space-x-1">
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={(e) => { e.stopPropagation(); handleViewDetail(ficha.id); }}
                      title="Ver Detalhes"
                    >
                      <EyeOutline class="w-4 h-4" />
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
          Nenhuma ficha encontrada
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {filters.hasActiveFilters
            ? 'Tente ajustar os filtros ou termo de busca'
            : 'Comece cadastrando uma nova ficha de EPI'}
        </p>
        <Button size="sm" color="primary" class="rounded-sm" on:click={handleNovaFicha}>
          <PlusOutline class="w-4 h-4 mr-2" />
          {!filters.hasActiveFilters ? 'Primeira Ficha' : 'Nova Ficha'}
        </Button>
      </div>
    </Card>
  {/if}
</div>
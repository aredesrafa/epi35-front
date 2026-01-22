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
  import { PlusOutline, SearchOutline, RefreshOutline, EyeOutline, FileDocOutline, ShieldCheckOutline } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import TableContainer from '$lib/components/common/TableContainer.svelte';
  import TableFilters from '$lib/components/common/TableFilters.svelte';
  import { _ } from 'svelte-i18n';

  // Props
  export let loading: boolean = false;
  export let error: string | null = null;
  export let items: any[] = [];
  export let pagination = {
    currentPage: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  };
  export let filters = {
    searchTerm: '',
    empresaFilter: '',
    cargoFilter: '',
    devolucaoPendente: false,
    hasActiveFilters: false
  };
  export let filterOptions = {
    empresas: [] as { value: string; label: string }[],
    cargos: [] as { value: string; label: string }[]
  };

  const dispatch = createEventDispatcher();

  // Handlers
  function handleNovaFicha() {
    dispatch('novaFicha');
  }

  function handleSearchChange(e: CustomEvent) {
    dispatch('search', e.detail.value);
  }

  function handleFilterChange(e: CustomEvent) {
    const { key, value } = e.detail;
    if (key === 'empresa') dispatch('empresaChange', value);
    if (key === 'cargo') dispatch('cargoChange', value);
  }

  function handleCheckboxChange(e: CustomEvent) {
    const { key, checked } = e.detail;
    if (key === 'devolucaoPendente') dispatch('devolucaoPendenteChange', checked);
  }

  function handleClearFilters() {
    dispatch('clearFilters');
  }

  function handleViewDetail(id: string) {
    dispatch('viewDetail', id);
  }

  function handlePageChange(e: CustomEvent) {
    dispatch('pageChange', e.detail.page);
    // Compatibility: The original component dispatched just the number, but TableContainer dispatches an object. 
    // Wait, let's check: TableContainer dispatches { page: number }. 
    // The parent container likely expects just the number based on the previous code `dispatch('pageChange', page)`.
    // We should fix this mismatch. The original `handlePageChange` took `page` number.
    // If we use `on:pageChange={(e) => dispatch('pageChange', e.detail.page)}` it works.
  }

  function formatarCPF(cpf: string): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function formatarEpisAtivos(tipos: any[]): string {
    if (!tipos || !Array.isArray(tipos)) return '';
    return tipos.slice(0, 2).map(tipo => `${tipo.quantidade}x ${tipo.tipoEpiNome}`).join(', ');
  }
  
  // Computados
  $: filterConfig = [
    {
      key: 'empresa',
      value: filters.empresaFilter,
      placeholder: 'Empresa'
    },
    {
      key: 'cargo',
      value: filters.cargoFilter,
      options: filterOptions.cargos,
      placeholder: 'Cargo'
    }
  ];

  $: checkboxConfig = [
    {
      key: 'devolucaoPendente',
      checked: filters.devolucaoPendente,
      label: 'Pendentes devolução'
    }
  ];
</script>

<svelte:head>
  <title>{$_('fichas.title')} - DataLife EPI</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {$_('fichas.title')}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Gerencie as fichas individuais de equipamentos de proteção
      </p>
    </div>
    <div class="flex items-center space-x-3">
      <Button size="sm" color="primary" class="rounded-sm shadow-sm transition-all hover:shadow-md" on:click={handleNovaFicha}>
        <PlusOutline class="w-4 h-4 mr-2" />
        {$_('fichas.nova_ficha')}
      </Button>
    </div>
  </div>

  <TableContainer
    {loading}
    {error}
    isEmpty={items.length === 0 && !loading && !error}
    emptyTitle="Nenhuma ficha encontrada"
    emptyMessage={filters.hasActiveFilters ? 'Tente ajustar os filtros ou termo de busca' : 'Comece cadastrando uma nova ficha de EPI'}
    emptyActionLabel={!filters.hasActiveFilters ? 'Primeira Ficha' : ''}
    emptyIcon={FileDocOutline}
    on:emptyAction={handleNovaFicha}
    showPagination={true}
    currentPage={pagination.currentPage}
    totalPages={pagination.totalPages}
    pageSize={pagination.pageSize}
    total={pagination.total}
    on:pageChange={handlePageChange}
  >
    <TableFilters
      slot="filters"
      searchValue={filters.searchTerm}
      searchPlaceholder="Buscar por nome, CPF ou matrícula..."
      filters={filterConfig}
      checkboxFilters={checkboxConfig}
      resultCount={items.length}
      totalCount={pagination.total}
      showClearButton={filters.hasActiveFilters}
      on:searchChange={handleSearchChange}
      on:filterChange={handleFilterChange}
      on:checkboxChange={handleCheckboxChange}
      on:clearFilters={handleClearFilters}
    />

    <Table hoverable>
      <TableHead>
        <TableHeadCell>{$_('tables.colaborador')}</TableHeadCell>
        <TableHeadCell>{$_('tables.contratada')}</TableHeadCell>
        <TableHeadCell>{$_('tables.epis')}</TableHeadCell>
        <TableHeadCell>{$_('tables.acoes')}</TableHeadCell>
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
                  {formatarCPF(ficha.colaborador.cpf)}
                </span>
                {#if ficha.colaborador.matricula}
                  <span class="text-xs text-gray-400 dark:text-gray-500">
                    Matrícula: {ficha.colaborador.matricula}
                  </span>
                {/if}
              </div>
            </TableBodyCell>
            <TableBodyCell>
              <div>
                <span class="font-medium text-gray-900 dark:text-white">
                  {ficha.colaborador.empresa || 'Empresa não informada'}
                </span>
                {#if ficha.colaborador.cargo}
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {ficha.colaborador.cargo}
                  </div>
                {/if}
              </div>
            </TableBodyCell>
            <TableBodyCell>
              <div class="flex flex-wrap gap-1">
                <Badge color="blue" class="w-fit rounded-sm">
                  {ficha.totalEpisAtivos || ficha.episInfo?.totalEpisComColaborador || 0} EPIs
                </Badge>
                {#if (ficha.episInfo?.episExpirados || ficha.totalEpisVencidos) && ((ficha.episInfo?.episExpirados || 0) > 0 || (ficha.totalEpisVencidos || 0) > 0)}
                  <Badge color="red" class="w-fit rounded-sm">
                    {ficha.episInfo?.episExpirados || ficha.totalEpisVencidos} vencido(s)
                  </Badge>
                {/if}
              </div>
              {#if ficha.episInfo?.tiposEpisAtivos && ficha.episInfo.tiposEpisAtivos.length > 0}
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatarEpisAtivos(ficha.episInfo.tiposEpisAtivos)}
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
                  on:click={(e) => { e.stopPropagation(); /* No action yet */ }}
                  title="Nova Entrega"
                >
                  <ShieldCheckOutline class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                  on:click={(e) => { e.stopPropagation(); handleViewDetail(ficha.id.startsWith('FICHA') ? ficha.id.substring(5) : ficha.id); }}
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
  </TableContainer>
</div>

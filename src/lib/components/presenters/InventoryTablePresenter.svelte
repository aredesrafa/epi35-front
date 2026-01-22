<!--
  Inventory Table Presenter - Componente "Burro" com Layout Original

  Este presenter é puramente apresentacional:
  - Recebe dados via props
  - Renderiza UI IDÊNTICA ao original
  - Emite eventos para o Container
  - Não contém lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Card,
    Button,
    Badge,
    Input,
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyRow,
    TableBodyCell,
    Spinner,
    Alert
  } from 'flowbite-svelte';
  import { PlusOutline, SearchOutline, EyeOutline, PenOutline, TrashBinOutline, RefreshOutline, ShieldCheckOutline, FileDocOutline, ClockOutline } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import TableContainer from '$lib/components/common/TableContainer.svelte';
  import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte';
  import { _ } from 'svelte-i18n';

  // Props
  export let loading: boolean = false;
  export let error: string | null = null;
  export let items: any[] = [];
  export let page: number = 1;
  export let totalPages: number = 1;
  export let total: number = 0;
  export let searchInput: string = '';
  export let filters: { status?: string; categoria?: string } = {};
  export let hideStatusFilter: boolean = false;
  export let statusOptions: { value: string; label: string }[] = [];
  export let categoriaOptions: { value: string; label: string }[] = [];

  const dispatch = createEventDispatcher();

  // Computed
  $: hasActiveFilters = searchInput ||
    (!hideStatusFilter && filters.status && filters.status !== 'todos') ||
    (filters.categoria && filters.categoria !== 'todas');

  // Handlers
  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    dispatch('search', target.value);
  }

  function handleFilterChange(filterName: string, value: string) {
    dispatch('filterChange', { filterName, value });
  }

  function handleClearFilters() {
    dispatch('clearFilters');
  }

  function handlePageChange(newPage: number) {
    dispatch('pageChange', newPage);
  }

  function handleItemHistory(item: any) {
    dispatch('itemHistory', item);
  }

  function handleItemEdit(item: any) {
    dispatch('itemEdit', item);
  }

  function handleNewMovement() {
    dispatch('newMovement');
  }

  function getStatusInfo(status: string): { label: string; color: 'green' | 'yellow' | 'red' | 'blue' | 'gray' } {
    const statusMap: Record<string, { labelKey: string; color: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }> = {
      'disponivel': { labelKey: 'status_labels.disponivel', color: 'green' },
      'em_uso': { labelKey: 'status_labels.em_uso', color: 'blue' },
      'baixo_estoque': { labelKey: 'dashboard.low_stock', color: 'yellow' },
      'sem_estoque': { labelKey: 'dashboard.low_stock', color: 'red' },
      'vencido': { labelKey: 'status_labels.vencido', color: 'red' }
    };
    const mapped = statusMap[status];
    return mapped ? { label: $_(mapped.labelKey), color: mapped.color } : { label: status || 'Unknown', color: 'gray' };
  }
</script>

<!-- Layout sem header duplicado -->
<div class="space-y-6">
      <!-- Filtros em linha -->
      <TableContainer
        {loading}
        {error}
        isEmpty={items.length === 0 && !loading && !error}
        emptyTitle="Nenhum EPI encontrado"
        emptyMessage="Tente ajustar os filtros ou termo de busca"
        emptyIcon={FileDocOutline}
        showPagination={true}
        currentPage={page}
        totalPages={totalPages}
        total={total}
        on:pageChange={(e) => handlePageChange(e.detail.page)}
      >
        <div slot="filters" class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-4">
          <!-- Search Input - mais largo -->
          <div class="relative flex-1 max-w-md">
            <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por equipamento ou CA..."
              class="pl-10 rounded-sm h-10 text-sm"
              value={searchInput}
              on:input={handleSearchInput}
            />
          </div>

          <!-- Filtros em linha -->
          {#if !hideStatusFilter && statusOptions && statusOptions.length > 0}
            <SearchableDropdown
              options={statusOptions}
              value={filters.status || 'todos'}
              placeholder="Status"
              class="min-w-[140px]"
              on:change={(e) => handleFilterChange('status', e.detail)}
            />
          {/if}

          <SearchableDropdown
            options={categoriaOptions}
            value={filters.categoria || 'todas'}
            placeholder="Categoria"
            class="min-w-[140px]"
            on:change={(e) => handleFilterChange('categoria', e.detail)}
          />

          <!-- Botão de limpar filtros -->
          {#if hasActiveFilters}
            <Button
              color="alternative"
              class="rounded-sm h-10 px-3"
              on:click={handleClearFilters}
              title="Limpar Filtros"
            >
              <RefreshOutline class="w-4 h-4" />
            </Button>
          {/if}
        </div>
      </div>

      <!-- Tabela mais limpa conforme Figma -->
      <div class="overflow-x-auto">
        <Table hoverable>
          <TableHead class="bg-gray-50 dark:bg-gray-700">
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300">
              {$_('tables.item')}
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 hidden md:table-cell">
              {$_('tables.categoria')}
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 text-center">
              {$_('common.quantity')}
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 hidden lg:table-cell">
              {$_('common.status')}
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 text-center">
              {$_('tables.acoes')}
            </TableHeadCell>
          </TableHead>
          <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each items as item (item.id)}
              {@const statusInfo = getStatusInfo(item.status)}

              <TableBodyRow
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                on:click={() => handleItemHistory(item)}
              >
                <TableBodyCell class="py-4 px-6">
                  <div class="flex items-center space-x-3">
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-gray-900 dark:text-white truncate">
                        {item.tipoEPI?.nomeEquipamento || 'EPI não encontrado'}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                        CA {item.tipoEPI?.numeroCA || '-'}
                      </p>
                      <!-- Info adicional em mobile -->
                      <div class="md:hidden mt-1 space-y-1">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {item.tipoEPI?.categoria || 'Sem categoria'}
                        </p>
                        <div class="lg:hidden">
                          <Badge
                            color={statusInfo.color}
                            class="w-fit rounded-sm text-xs"
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableBodyCell>
                <TableBodyCell class="py-4 px-6 hidden md:table-cell">
                  <Badge color="dark" class="rounded-full px-2.5 py-0.5">
                    {item.tipoEPI?.categoria || 'Geral'}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell class="py-4 px-6 text-center">
                  <span class="font-mono font-medium text-gray-900 dark:text-white">
                    {item.quantidade}
                  </span>
                </TableBodyCell>
                <TableBodyCell class="py-4 px-6 hidden lg:table-cell">
                   <Badge color={statusInfo.color} class="rounded-full px-2.5 py-0.5">
                    {statusInfo.label}
                   </Badge>
                </TableBodyCell>
                <TableBodyCell class="py-4 px-6 text-center">
                  <div class="flex items-center justify-center space-x-2">
                    <button
                      class="p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Ajustar quantidade"
                      on:click|stopPropagation={() => handleItemEdit(item)}
                    >
                      <PenOutline class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Ver histórico"
                      on:click|stopPropagation={() => handleItemHistory(item)}
                    >
                      <ClockOutline class="w-4 h-4" />
                    </button>
                  </div>
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>

      </TableContainer>
</div>

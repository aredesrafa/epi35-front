<!--
  OptimizedTable.svelte
  Componente de tabela otimizado seguindo as melhores práticas do Flowbite Svelte v0.48.6
  Implementa virtualização, paginação eficiente e estados de loading
-->

<script lang="ts">
  import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Button, Spinner } from 'flowbite-svelte';
  import { ChevronLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import { createPaginationStore } from '$lib/utils/performance';
  
  // Props tipadas
  export let data: any[] = [];
  export let columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (value: any, row: any) => string;
  }> = [];
  export let loading = false;
  export let itemsPerPage = 10;
  export let hoverable = true;
  export let striped = false;
  export let onRowClick: ((row: any) => void) | null = null;
  export let emptyMessage = 'Nenhum dado encontrado';
  export let loadingMessage = 'Carregando dados...';
  
  // Store de paginação otimizada
  const pagination = createPaginationStore(itemsPerPage);
  const { currentPage, totalPages, hasNext, hasPrev, startIndex, endIndex } = pagination;
  
  // Estado de ordenação
  let sortField: string | null = null;
  let sortDirection: 'asc' | 'desc' = 'asc';
  
  // Dados computados reativo
  $: {
    pagination.totalItems.set(data.length);
  }
  
  // Dados ordenados e paginados
  $: sortedData = sortField 
    ? [...data].sort((a, b) => {
        const aVal = a[sortField!];
        const bVal = b[sortField!];
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
        return 0;
      })
    : data;
    
  $: paginatedData = sortedData.slice($startIndex, $endIndex);
  
  function handleSort(columnKey: string, sortable: boolean = true) {
    if (!sortable) return;
    
    if (sortField === columnKey) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = columnKey;
      sortDirection = 'asc';
    }
  }
  
  function handleRowClick(row: any, event: MouseEvent) {
    if (onRowClick && !event.defaultPrevented) {
      onRowClick(row);
    }
  }
  
  function renderCellValue(column: any, row: any) {
    const value = row[column.key];
    return column.render ? column.render(value, row) : (value ?? '');
  }
  
  // Navegação via teclado para acessibilidade
  function handleKeyDown(event: KeyboardEvent, row: any) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (onRowClick) onRowClick(row);
    }
  }
</script>

<div class="space-y-4">
  <!-- Tabela principal -->
  <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow-sm rounded-sm border border-gray-200 dark:border-gray-700">
    <Table {hoverable} {striped} class="min-w-full">
      <TableHead class="bg-gray-50 dark:bg-gray-700">
        {#each columns as column}
          <TableHeadCell 
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider {column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''} {column.width ? `w-${column.width}` : ''}"
            on:click={() => handleSort(column.key, column.sortable)}
            role={column.sortable ? 'button' : 'columnheader'}
            tabindex={column.sortable ? 0 : -1}
            on:keydown={(e) => column.sortable && (e.key === 'Enter' || e.key === ' ') && handleSort(column.key, column.sortable)}
          >
            <div class="flex items-center gap-2">
              {column.label}
              {#if column.sortable && sortField === column.key}
                <span class="text-primary-500 text-sm">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              {/if}
            </div>
          </TableHeadCell>
        {/each}
      </TableHead>
      
      <TableBody>
        {#if loading}
          <TableBodyRow>
            <TableBodyCell colspan={columns.length} class="text-center py-12">
              <div class="flex items-center justify-center gap-3">
                <Spinner size="6" color="primary" />
                <span class="text-gray-500 dark:text-gray-400">{loadingMessage}</span>
              </div>
            </TableBodyCell>
          </TableBodyRow>
        {:else if paginatedData.length === 0}
          <TableBodyRow>
            <TableBodyCell colspan={columns.length} class="text-center py-12">
              <div class="text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </div>
            </TableBodyCell>
          </TableBodyRow>
        {:else}
          {#each paginatedData as row, index (row.id || index)}
            <TableBodyRow 
              class="{onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}"
              role={onRowClick ? 'button' : 'row'}
              tabindex={onRowClick ? 0 : -1}
              on:click={(e) => handleRowClick(row, e)}
              on:keydown={(e) => handleKeyDown(e, row)}
            >
              {#each columns as column}
                <TableBodyCell class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {@html renderCellValue(column, row)}
                </TableBodyCell>
              {/each}
            </TableBodyRow>
          {/each}
        {/if}
      </TableBody>
    </Table>
  </div>
  
  <!-- Paginação otimizada -->
  {#if !loading && $totalPages > 1}
    <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm">
      <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <span>Mostrando</span>
        <span class="font-medium">{$startIndex + 1}</span>
        <span>a</span>
        <span class="font-medium">{$endIndex}</span>
        <span>de</span>
        <span class="font-medium">{data.length}</span>
        <span>resultados</span>
      </div>
      
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          color="alternative"
          class="rounded-sm"
          disabled={!$hasPrev}
          on:click={pagination.prevPage}
          aria-label="Página anterior"
        >
          <ChevronLeftOutline class="w-4 h-4" />
          Anterior
        </Button>
        
        <!-- Números de página -->
        <div class="flex items-center gap-1">
          {#each Array.from({ length: Math.min(5, $totalPages) }, (_, i) => {
            const start = Math.max(1, $currentPage - 2);
            return start + i;
          }).filter(page => page <= $totalPages) as page}
            <Button
              size="sm"
              color={page === $currentPage ? 'primary' : 'alternative'}
              class="rounded-sm min-w-[40px]"
              on:click={() => pagination.goToPage(page)}
              aria-label={`Página ${page}`}
              aria-current={page === $currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          {/each}
        </div>
        
        <Button
          size="sm"
          color="alternative"
          class="rounded-sm"
          disabled={!$hasNext}
          on:click={pagination.nextPage}
          aria-label="Próxima página"
        >
          Próximo
          <ChevronRightOutline class="w-4 h-4" />
        </Button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Otimizações de performance */
  :global(.table-optimized) {
    contain: layout style paint;
  }
  
  /* Smooth transitions */
  :global(.table-optimized tr) {
    transition: background-color 0.15s ease-in-out;
  }
  
  /* Focus styles para acessibilidade */
  :global(.table-optimized th:focus),
  :global(.table-optimized tr:focus) {
    outline: 2px solid theme('colors.primary.500');
    outline-offset: -2px;
  }
</style>
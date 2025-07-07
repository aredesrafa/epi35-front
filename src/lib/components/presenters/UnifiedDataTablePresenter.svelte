<!--
  Unified Data Table Presenter - Solução de UI Definitiva
  
  Presenter unificado que pode renderizar tanto catálogo quanto estoque:
  - Interface consistente
  - Filtros padronizados
  - Performance otimizada
  - Acessibilidade completa
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Card, 
    Button, 
    Badge, 
    Table, 
    TableHead, 
    TableHeadCell, 
    TableBody, 
    TableBodyRow, 
    TableBodyCell,
    Input,
    Select,
    Spinner,
    Alert
  } from 'flowbite-svelte';
  import { 
    SearchOutline, 
    PlusOutline, 
    RefreshOutline,
    EyeOutline,
    PenOutline,
    TrashBinOutline,
    ChevronLeftOutline,
    ChevronRightOutline,
    FilterSolid
  } from 'flowbite-svelte-icons';
  import type { 
    TipoEPIUnified, 
    ItemEstoqueUnified 
  } from '$lib/services/unified/unifiedDataAdapter';
  import type { FilterMetadata } from '$lib/stores/enhancedPaginatedStore';

  // ==================== PROPS ====================
  
  // Estado do container (padronizado)
  export let containerState: {
    mode: 'catalog' | 'inventory';
    title: string;
    items: (TipoEPIUnified | ItemEstoqueUnified)[];
    loading: boolean;
    error: string | null;
    pagination: {
      current: number;
      total: number;
      pageSize: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      active: Record<string, any>;
      metadata: FilterMetadata[];
      options: Record<string, Array<{ value: string; label: string; count?: number }>>;
      hasActive: boolean;
      loading: boolean;
    };
    showActions: boolean;
    initialized: boolean;
  };

  // Event handlers (padronizados)
  export let handleFilterChange: (key: string, value: any) => Promise<void>;
  export let handleSearch: (searchTerm: string) => Promise<void>;
  export let handleClearFilters: () => Promise<void>;
  export let handlePageChange: (page: number) => Promise<void>;
  export let handleSort: (field: string, direction: 'asc' | 'desc') => Promise<void>;
  export let handleReload: () => Promise<void>;
  export let handleItemClick: (item: any) => void;
  export let handleItemEdit: (item: any) => void;
  export let handleItemView: (item: any) => void;
  export let handleItemDelete: (item: any) => void;
  export let handleNewItem: () => void;

  // ==================== EVENTS ====================
  
  const dispatch = createEventDispatcher();

  // ==================== LOCAL STATE ====================
  
  let currentSearchTerm = '';
  let sortField = '';
  let sortDirection: 'asc' | 'desc' = 'asc';

  // ==================== COMPUTED PROPERTIES ====================

  // Configuração de colunas baseada no modo
  $: columns = getColumns(containerState.mode);
  
  // Estado dos filtros para renderização
  $: filterComponents = containerState.filters.metadata.map(filter => ({
    ...filter,
    value: containerState.filters.active[filter.key] || '',
    options: filter.options || containerState.filters.options[filter.key] || []
  }));

  // ==================== COLUMN CONFIGURATION ====================

  function getColumns(mode: string) {
    if (mode === 'catalog') {
      return [
        { key: 'nomeEquipamento', label: 'Equipamento', sortable: true, width: 'auto' },
        { key: 'numeroCA', label: 'CA', sortable: true, width: '120px' },
        { key: 'categoria', label: 'Categoria', sortable: true, width: '180px' },
        { key: 'status', label: 'Status', sortable: true, width: '140px' },
        { key: 'actions', label: 'Ações', sortable: false, width: '140px' }
      ];
    } else {
      return [
        { key: 'quantidade', label: 'Quant.', sortable: true, width: '80px' },
        { key: 'tipoEPI.nomeEquipamento', label: 'Equipamento', sortable: true, width: 'auto' },
        { key: 'status', label: 'Status', sortable: true, width: '120px' },
        { key: 'tipoEPI.categoria', label: 'Categoria', sortable: true, width: '160px' },
        { key: 'localizacao', label: 'Localização', sortable: false, width: '120px' },
        { key: 'actions', label: 'Ações', sortable: false, width: '120px' }
      ];
    }
  }

  // ==================== EVENT HANDLERS ====================

  /**
   * Handler para busca com debounce
   */
  function onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    currentSearchTerm = target.value;
    handleSearch(currentSearchTerm);
  }

  /**
   * Handler para mudança de filtro
   */
  function onFilterChange(filterKey: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    handleFilterChange(filterKey, target.value);
  }

  /**
   * Handler para ordenação
   */
  function onSort(field: string): void {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
    
    handleSort(field, sortDirection);
  }

  /**
   * Handler para limpeza de filtros
   */
  function onClearFilters(): void {
    currentSearchTerm = '';
    handleClearFilters();
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Renderiza valor da célula baseado no tipo
   */
  function getCellValue(item: any, columnKey: string): any {
    if (columnKey.includes('.')) {
      const keys = columnKey.split('.');
      let value = item;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) break;
      }
      return value;
    }
    return item[columnKey];
  }

  /**
   * Renderiza badge de status
   */
  function getStatusBadge(status: string | boolean, mode: string): { color: string; label: string } {
    if (mode === 'catalog') {
      // Handle both boolean (ativo field) and string (status field) values
      if (typeof status === 'boolean') {
        return status ? { color: 'green', label: 'Ativo' } : { color: 'red', label: 'Inativo' };
      } else {
        // Handle status string values from API
        switch (status) {
          case 'ATIVO':
            return { color: 'green', label: 'Ativo' };
          case 'DESCONTINUADO':
            return { color: 'red', label: 'Descontinuado' };
          default:
            return { color: 'gray', label: status };
        }
      }
    } else {
      // Status de estoque
      switch (status) {
        case 'disponivel':
          return { color: 'green', label: 'Disponível' };
        case 'baixo_estoque':
          return { color: 'yellow', label: 'Baixo' };
        case 'esgotado':
          return { color: 'red', label: 'Esgotado' };
        case 'vencido':
          return { color: 'dark', label: 'Vencido' };
        default:
          return { color: 'gray', label: status };
      }
    }
  }

  /**
   * Gera páginas para paginação
   */
  function getPaginationPages(): number[] {
    const current = containerState.pagination.current;
    const total = containerState.pagination.total;
    const pages: number[] = [];
    
    // Sempre mostrar primeira página
    if (total > 0) pages.push(1);
    
    // Páginas ao redor da atual
    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);
    
    // Adicionar elipse se necessário
    if (start > 2) pages.push(-1); // -1 representa elipse
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) pages.push(i);
    }
    
    // Adicionar elipse se necessário
    if (end < total - 1) pages.push(-1);
    
    // Sempre mostrar última página (se diferente da primeira)
    if (total > 1) pages.push(total);
    
    return pages;
  }
</script>

<!-- ==================== MAIN CONTENT ==================== -->

<div class="space-y-4">
  <!-- Header com título e ações -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {containerState.title}
      </h1>
      {#if containerState.pagination.totalItems > 0}
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {containerState.pagination.totalItems} {containerState.mode === 'catalog' ? 'tipos de EPI' : 'itens em estoque'}
        </p>
      {/if}
    </div>
    
    {#if containerState.showActions}
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          color="alternative"
          on:click={handleReload}
          disabled={containerState.loading}
          class="whitespace-nowrap"
        >
          <RefreshOutline class="w-4 h-4 mr-2" />
          Atualizar
        </Button>
        
        <Button
          size="sm"
          color="primary"
          on:click={handleNewItem}
          class="whitespace-nowrap"
        >
          <PlusOutline class="w-4 h-4 mr-2" />
          Novo {containerState.mode === 'catalog' ? 'EPI' : 'Item'}
        </Button>
      </div>
    {/if}
  </div>

  <!-- Filtros -->
  <Card class="p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each filterComponents as filter}
        <div class="space-y-1">
          <label for={filter.key} class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {filter.label}
          </label>
          
          {#if filter.type === 'search'}
            <div class="relative">
              <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id={filter.key}
                type="text"
                placeholder={filter.placeholder || ''}
                value={currentSearchTerm}
                on:input={onSearchInput}
                class="pl-10 h-10"
                size="sm"
              />
            </div>
          
          {:else if filter.type === 'select'}
            <Select
              id={filter.key}
              items={filter.options}
              value={filter.value}
              on:change={(e) => onFilterChange(filter.key, e)}
              size="sm"
              class="h-10"
            />
          {/if}
        </div>
      {/each}
      
      <!-- Botão limpar filtros -->
      {#if containerState.filters.hasActive}
        <div class="flex items-end">
          <Button
            size="sm"
            color="alternative"
            on:click={onClearFilters}
            class="h-10 w-full"
          >
            <FilterSolid class="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      {/if}
    </div>
    
    <!-- Loading state dos filtros -->
    {#if containerState.filters.loading}
      <div class="mt-2 text-sm text-gray-500 flex items-center">
        <Spinner class="w-4 h-4 mr-2" />
        Carregando opções...
      </div>
    {/if}
  </Card>

  <!-- Tabela de dados -->
  <Card class="overflow-hidden">
    {#if containerState.error}
      <Alert color="red" class="mb-4">
        <span class="font-medium">Erro:</span> {containerState.error}
      </Alert>
    {/if}

    <div class="overflow-x-auto">
      <Table hoverable={true} class="w-full">
        <TableHead>
          {#each columns as column}
            <TableHeadCell 
              class={column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
              style={column.width ? `width: ${column.width}` : ''}
              on:click={column.sortable ? () => onSort(column.key) : undefined}
            >
              <div class="flex items-center justify-between">
                <span>{column.label}</span>
                {#if column.sortable && sortField === column.key}
                  <span class="ml-1 text-primary-600">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                {/if}
              </div>
            </TableHeadCell>
          {/each}
        </TableHead>
        
        <TableBody>
          {#if containerState.loading}
            <TableBodyRow>
              <TableBodyCell colspan={columns.length} class="text-center py-8">
                <div class="flex items-center justify-center">
                  <Spinner class="w-6 h-6 mr-3" />
                  <span class="text-gray-600 dark:text-gray-400">Carregando dados...</span>
                </div>
              </TableBodyCell>
            </TableBodyRow>
          
          {:else if containerState.items.length === 0}
            <TableBodyRow>
              <TableBodyCell colspan={columns.length} class="text-center py-8">
                <div class="text-gray-500 dark:text-gray-400">
                  {#if containerState.filters.hasActive}
                    <p>Nenhum resultado encontrado com os filtros aplicados.</p>
                    <Button 
                      size="sm" 
                      color="alternative" 
                      class="mt-2"
                      on:click={onClearFilters}
                    >
                      Limpar filtros
                    </Button>
                  {:else}
                    <p>Nenhum {containerState.mode === 'catalog' ? 'EPI cadastrado' : 'item em estoque'}.</p>
                  {/if}
                </div>
              </TableBodyCell>
            </TableBodyRow>
          
          {:else}
            {#each containerState.items as item (item.id)}
              <TableBodyRow 
                class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                on:click={() => handleItemClick(item)}
              >
                {#each columns as column}
                  <TableBodyCell class="py-3">
                    {#if column.key === 'actions'}
                      <!-- Ações -->
                      <div 
                        class="flex items-center gap-1" 
                        on:click|stopPropagation
                        on:keydown|stopPropagation
                        role="group"
                        aria-label="Ações do item"
                      >
                        <button
                          class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                          on:click={() => handleItemView(item)}
                          title="Visualizar"
                        >
                          <EyeOutline class="w-3 h-3" />
                        </button>
                        
                        <button
                          class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                          on:click={() => handleItemEdit(item)}
                          title="Editar"
                        >
                          <PenOutline class="w-3 h-3" />
                        </button>
                        
                        <button
                          class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                          on:click={() => handleItemDelete(item)}
                          title="Excluir"
                        >
                          <TrashBinOutline class="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    
                    {:else if column.key === 'ativo' || column.key === 'status'}
                      <!-- Status/Badge -->
                      {@const statusValue = column.key === 'status' ? getCellValue(item, 'status') : getCellValue(item, 'ativo')}
                      {@const badge = getStatusBadge(statusValue, containerState.mode)}
                      <Badge color={badge.color} class="w-fit">
                        {badge.label}
                      </Badge>
                    
                    {:else if column.key === 'quantidade'}
                      <!-- Quantidade com formatação -->
                      <span class="font-medium">
                        {getCellValue(item, column.key)}
                      </span>
                    
                    {:else}
                      <!-- Valor padrão -->
                      <span class="text-sm">
                        {getCellValue(item, column.key) || '-'}
                      </span>
                    {/if}
                  </TableBodyCell>
                {/each}
              </TableBodyRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </div>

    <!-- Paginação -->
    {#if containerState.pagination.total > 1}
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <!-- Info da paginação -->
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Página {containerState.pagination.current} de {containerState.pagination.total}
          <span class="text-gray-500">
            ({containerState.pagination.totalItems} itens total)
          </span>
        </div>
        
        <!-- Controles de paginação -->
        <div class="flex items-center gap-1">
          <!-- Página anterior -->
          <Button
            size="sm"
            color="alternative"
            disabled={!containerState.pagination.hasPrev || containerState.loading}
            on:click={() => handlePageChange(containerState.pagination.current - 1)}
          >
            <ChevronLeftOutline class="w-4 h-4" />
          </Button>
          
          <!-- Páginas numeradas -->
          {#each getPaginationPages() as page}
            {#if page === -1}
              <span class="px-2 text-gray-400">...</span>
            {:else}
              <Button
                size="sm"
                color={page === containerState.pagination.current ? 'primary' : 'alternative'}
                disabled={containerState.loading}
                on:click={() => handlePageChange(page)}
                class="min-w-[2.5rem]"
              >
                {page}
              </Button>
            {/if}
          {/each}
          
          <!-- Próxima página -->
          <Button
            size="sm"
            color="alternative"
            disabled={!containerState.pagination.hasNext || containerState.loading}
            on:click={() => handlePageChange(containerState.pagination.current + 1)}
          >
            <ChevronRightOutline class="w-4 h-4" />
          </Button>
        </div>
      </div>
    {/if}
  </Card>
</div>
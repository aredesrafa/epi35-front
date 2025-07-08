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
  import { 
    PlusOutline, 
    SearchOutline, 
    RefreshOutline,
    AdjustmentsHorizontalOutline,
    ClockOutline,
    ArrowUpOutline
  } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import type { ItemEstoqueDTO } from '$lib/types/serviceTypes';

  // ==================== PROPS (dados do Container) ====================
  
  export let items: ItemEstoqueDTO[] = [];
  export let loading: boolean = false;
  export let error: string | null = null;
  export let total: number = 0;
  export let page: number = 1;
  export let totalPages: number = 1;
  export let searchTerm: string = '';
  export let filters: {
    status: string;
    categoria: string;
  };
  export let categoriaOptions: Array<{ value: string; label: string }> = [];

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    pageChange: { page: number };
    itemEdit: { item: ItemEstoqueDTO };
    itemHistory: { item: ItemEstoqueDTO };
    searchChange: { value: string };
    filterChange: { key: string; value: string };
    clearFilters: void;
    newMovement: void;
  }>();

  // ==================== LOCAL STATE ====================
  
  let searchInput = '';

  // ==================== EVENT HANDLERS ====================
  
  function handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    searchInput = value;
    dispatch('searchChange', { value });
  }

  function handleFilterChange(key: string, value: string): void {
    dispatch('filterChange', { key, value });
  }

  function handleClearFilters(): void {
    searchInput = '';
    dispatch('clearFilters');
  }

  function handleItemEdit(item: ItemEstoqueDTO): void {
    dispatch('itemEdit', { item });
  }

  function handleItemHistory(item: ItemEstoqueDTO): void {
    dispatch('itemHistory', { item });
  }

  function handlePageChange(newPage: number): void {
    dispatch('pageChange', { page: newPage });
  }

  function handleNewMovement(): void {
    dispatch('newMovement');
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  function getStatusInfo(status: string) {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'disponivel':
      case 'ativo':
        return { color: 'green' as const, label: 'Disponível' };
      case 'baixo':
        return { color: 'yellow' as const, label: 'Estoque baixo' };
      case 'indisponivel':
      case 'inativo':
        return { color: 'red' as const, label: 'Indisponível' };
      case 'vencendo':
        return { color: 'orange' as const, label: 'Próximo ao vencimento' };
      case 'vencido':
        return { color: 'red' as const, label: 'Vencido' };
      case 'esgotado':
      case 'zero':
        return { color: 'gray' as const, label: 'Esgotado' };
      default:
        return { color: 'blue' as const, label: status || 'Indefinido' };
    }
  }


  // ==================== REACTIVE STATEMENTS ====================
  
  // DEBUG: Log para verificar se items chegam ao presenter
  $: {
    console.log('🎨 PRESENTER: items recebidos:', {
      itemsLength: items?.length || 0,
      items: items,
      loading,
      error
    });
  }
  
  // Sincronizar searchInput com searchTerm quando vem do container
  $: if (searchTerm !== undefined && searchTerm !== searchInput) {
    searchInput = searchTerm;
  }

  // Verificar se há filtros ativos
  $: hasActiveFilters = searchInput || 
    (filters.status && filters.status !== 'todos') || 
    (filters.categoria && filters.categoria !== 'todas');
</script>

<!-- Layout atualizado baseado no Figma -->
<div class="p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Estoque</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Controle de estoque e movimentações
      </p>
    </div>
    <div class="flex gap-3">
      <Button size="sm" color="primary" class="rounded-sm" on:click={handleNewMovement}>
        <PlusOutline class="w-4 h-4 mr-2" />
        Nova Movimentação
      </Button>
    </div>
  </div>
  
  <!-- Content -->
  {#if loading}
    <LoadingSpinner />
  {:else if error}
    <ErrorDisplay 
      {error} 
      onRetry={() => handlePageChange(page)}
    />
  {:else if items.length > 0}
    <!-- Card container com design limpo do Figma -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Filtros alinhados horizontalmente no topo da tabela -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
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
          <SearchableDropdown
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'disponivel', label: 'Disponível' },
              { value: 'indisponivel', label: 'Indisponível' }
            ]}
            value={filters.status || 'todos'}
            placeholder="Status"
            class="min-w-[140px]"
            on:change={(e) => handleFilterChange('status', e.detail)}
          />
          
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
              Equipamento
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 hidden md:table-cell">
              Categoria
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 text-center">
              Quantidade
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 hidden lg:table-cell">
              Status
            </TableHeadCell>
            <TableHeadCell class="py-3 px-6 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 text-center">
              Ações
            </TableHeadCell>
          </TableHead>
          <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each items as item (item.id)}
              {@const statusInfo = getStatusInfo(item.status)}
              
              <TableBodyRow 
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer" 
                on:click={() => handleItemEdit(item)}
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
                  <span class="text-sm text-gray-900 dark:text-white">
                    {item.tipoEPI?.categoria || '-'}
                  </span>
                </TableBodyCell>
                <TableBodyCell class="py-4 px-6 text-center">
                  <span class="font-semibold text-lg text-gray-900 dark:text-white">
                    {item.quantidade}
                  </span>
                </TableBodyCell>
                <TableBodyCell class="py-4 px-6 hidden lg:table-cell">
                  <Badge 
                    color={statusInfo.color} 
                    class="w-fit rounded-sm"
                  >
                    {statusInfo.label}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell class="py-4 px-6">
                  <div class="flex items-center justify-center space-x-1">
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={(e) => {
                        e.stopPropagation();
                        handleItemEdit(item);
                      }}
                      title="Ajustar quantidade"
                    >
                      <AdjustmentsHorizontalOutline class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={(e) => {
                        e.stopPropagation();
                        handleItemHistory(item);
                      }}
                      title="Ver histórico"
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
      
      <!-- Paginação limpa -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, total)} de {total} resultados
          </div>
          <div class="flex gap-2">
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm"
              disabled={page === 1}
              on:click={() => handlePageChange(page - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm"
              disabled={page === totalPages}
              on:click={() => handlePageChange(page + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Estado vazio limpo -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="text-center py-16 px-6">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <ArrowUpOutline class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum item encontrado
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {searchInput || hasActiveFilters
            ? 'Tente ajustar os filtros ou termo de busca para encontrar itens'
            : 'Comece adicionando itens ao estoque através de uma nova movimentação'}
        </p>
        <Button size="sm" color="primary" class="rounded-sm" on:click={handleNewMovement}>
          <PlusOutline class="w-4 h-4 mr-2" />
          {searchInput || hasActiveFilters ? 'Nova Movimentação' : 'Primeira Movimentação'}
        </Button>
      </div>
    </div>
  {/if}
</div>
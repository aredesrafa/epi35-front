<!--
  Notes Table Presenter - Componente "Burro" (Baseado no FichasTablePresenter)
  
  Responsabilidades:
  - Renderizar UI da tabela de notas de movimentação
  - Renderizar filtros, busca e tabs
  - Renderizar paginação
  - Emitir eventos para o Container
  - Zero lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Card, Button, Input, Badge, Table, TableHead, TableHeadCell, 
    TableBody, TableBodyRow, TableBodyCell 
  } from 'flowbite-svelte';
  import { 
    PlusOutline, SearchOutline, EyeOutline, PenOutline, TrashBinOutline, 
    RefreshOutline, CheckOutline, CloseOutline, FileDocOutline 
  } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import TableContainer from '$lib/components/common/TableContainer.svelte';
  import TableFilters from '$lib/components/common/TableFilters.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import type { 
    NotaMovimentacao, 
    TipoNotaEnum, 
    StatusNotaEnum,
    NotasFilterOptions 
  } from '$lib/services/process/notasMovimentacaoTypes';
  import { formatarData } from '$lib/utils/dateHelpers';
  import { 
    getTipoNotaLabel, 
    getStatusNotaLabel,
    getStatusNotaBadgeColor 
  } from '$lib/utils/notasHelpers';

  // ==================== PROPS ====================
  
  export let items: NotaMovimentacao[] = [];
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
    tipoFilter: TipoNotaEnum | 'todas';
    statusFilter: StatusNotaEnum | 'todos';
    responsavelFilter: string;
    almoxarifadoFilter: string;
    dataInicioFilter: string;
    dataFimFilter: string;
    hasActiveFilters: boolean;
    activeTab: number;
  };
  
  export let filterOptions: NotasFilterOptions;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    searchChange: string;
    tipoFilterChange: string;
    statusFilterChange: string;
    responsavelFilterChange: string;
    almoxarifadoFilterChange: string;
    dataInicioChange: string;
    dataFimChange: string;
    clearFilters: void;
    tabChange: number;
    pageChange: number;
    pageSizeChange: number;
    novaNota: void;
    editarNota: NotaMovimentacao;
    visualizarNota: NotaMovimentacao;
    excluirNota: NotaMovimentacao;
    concluirNota: NotaMovimentacao;
    cancelarNota: NotaMovimentacao;
  }>();

  // ==================== DEBUG LOGGING ====================
  
  $: if (items && items.length > 0) {
    console.log('🔍 NotesTablePresenter: Dados recebidos', {
      quantidade: items.length,
      primeiraNota: {
        id: items[0]?.id,
        numero: items[0]?.numero,
        responsavel_nome: items[0]?.responsavel_nome,
        almoxarifado_nome: items[0]?.almoxarifado_nome,
        total_itens: items[0]?.total_itens,
        valor_total: items[0]?.valor_total,
        status: items[0]?.status,
        tipo: items[0]?.tipo,
        data_documento: items[0]?.data_documento
      }
    });
  }

  // ==================== TABS CONFIGURATION ====================
  
  const tabs = [
    { label: 'Concluídas', count: 0 },
    { label: 'Rascunhos', count: 0 },
    { label: 'Canceladas', count: 0 }
  ];

  // ==================== HANDLERS ====================
  
  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('searchChange', target.value);
  }

  function handleTipoChange(event: CustomEvent<string>): void {
    dispatch('tipoFilterChange', event.detail);
  }

  function handleStatusChange(event: CustomEvent<string>): void {
    dispatch('statusFilterChange', event.detail);
  }

  function handleResponsavelChange(event: CustomEvent<string>): void {
    dispatch('responsavelFilterChange', event.detail);
  }

  function handleAlmoxarifadoChange(event: CustomEvent<string>): void {
    dispatch('almoxarifadoFilterChange', event.detail);
  }

  function handleDataInicioChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('dataInicioChange', target.value);
  }

  function handleDataFimChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('dataFimChange', target.value);
  }

  function handleClearFilters(): void {
    dispatch('clearFilters');
  }

  function handleTabChange(event: CustomEvent<{ activeTabValue: number }>): void {
    dispatch('tabChange', event.detail.activeTabValue);
  }

  function handlePageChange(page: number): void {
    dispatch('pageChange', page);
  }

  function handleNovaNota(): void {
    dispatch('novaNota');
  }

  function handleEditarNota(nota: NotaMovimentacao): void {
    dispatch('editarNota', nota);
  }

  function handleVisualizarNota(nota: NotaMovimentacao): void {
    dispatch('visualizarNota', nota);
  }

  function handleExcluirNota(nota: NotaMovimentacao): void {
    dispatch('excluirNota', nota);
  }

  function handleConcluirNota(nota: NotaMovimentacao): void {
    dispatch('concluirNota', nota);
  }

  function handleCancelarNota(nota: NotaMovimentacao): void {
    dispatch('cancelarNota', nota);
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  // Configuração de filtros para TableFilters
  $: filterConfig = [
    {
      key: 'tipo',
      value: filters.tipoFilter,
      options: [
        { value: 'todas', label: 'Todos os Tipos' },
        ...filterOptions.tipos
      ],
      placeholder: 'Tipo'
    },
    {
      key: 'responsavel',
      value: filters.responsavelFilter,
      options: filterOptions.responsaveis,
      placeholder: 'Responsável'
    },
    {
      key: 'almoxarifado',
      value: filters.almoxarifadoFilter,
      options: filterOptions.almoxarifados,
      placeholder: 'Almoxarifado'
    }
  ].filter(Boolean);

  // Filtros de data
  $: dateFilters = [
    {
      key: 'dataInicio',
      type: 'date',
      value: filters.dataInicioFilter,
      placeholder: 'Data início'
    },
    {
      key: 'dataFim',
      type: 'date',
      value: filters.dataFimFilter,
      placeholder: 'Data fim'
    }
  ];

  // Ações disponíveis baseadas no status
  function getAvailableActions(nota: NotaMovimentacao): Array<'edit' | 'view' | 'delete' | 'conclude' | 'cancel'> {
    const actions: Array<'edit' | 'view' | 'delete' | 'conclude' | 'cancel'> = ['view'];
    
    switch (nota.status) {
      case 'RASCUNHO':
        // Rascunhos: podem ser editados, excluídos ou concluídos
        actions.push('edit', 'delete', 'conclude');
        break;
      case 'CONCLUIDA':
        // Concluídas: podem ser canceladas (se permitido pelo backend)
        actions.push('cancel');
        break;
      case 'CANCELADA':
        // Canceladas: apenas visualizar
        break;
    }
    
    return actions;
  }

  // Helper para obter tooltip das ações
  function getActionTooltip(action: string, nota: NotaMovimentacao): string {
    const actionLabels = {
      'view': 'Visualizar detalhes da nota',
      'edit': 'Editar nota (rascunho)',
      'delete': 'Excluir nota (rascunho)',
      'conclude': `Concluir nota e processar ${nota.total_itens || nota.itens?.length || 0} ${(nota.total_itens || nota.itens?.length || 0) === 1 ? 'item' : 'itens'}`,
      'cancel': 'Cancelar nota (reversível)'
    };
    return actionLabels[action] || action;
  }

  // Função para mapear eventos de filtro
  function handleFilterChange(event: CustomEvent<{ key: string; value: string }>): void {
    const { key, value } = event.detail;
    
    switch (key) {
      case 'tipo':
        dispatch('tipoFilterChange', value);
        break;
      case 'status':
        dispatch('statusFilterChange', value);
        break;
      case 'responsavel':
        dispatch('responsavelFilterChange', value);
        break;
      case 'almoxarifado':
        dispatch('almoxarifadoFilterChange', value);
        break;
      case 'dataInicio':
        dispatch('dataInicioChange', value);
        break;
      case 'dataFim':
        dispatch('dataFimChange', value);
        break;
    }
  }
</script>

<svelte:head>
  <title>Notas de Movimentação - DataLife EPI</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-medium text-gray-900 dark:text-white">Notas de Movimentação</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Gerencie notas de entrada, transferência e descarte de EPIs
      </p>
    </div>
    <div class="flex space-x-2">
      <Button size="sm" color="primary" class="rounded-sm" on:click={handleNovaNota}>
        <PlusOutline class="w-4 h-4 mr-2" />
        Nova Nota
      </Button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700">
    <nav class="flex space-x-4 px-4" aria-label="Tabs">
      {#each tabs as tab, index}
        <button
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200 -mb-px {filters.activeTab === index ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
          on:click={() => handleTabChange({detail: {activeTabValue: index}})}
        >
          <span class="flex items-center space-x-2">
            <span>{tab.label}</span>
            {#if filters.activeTab === index && pagination.total > 0}
              <Badge color="gray" class="rounded-sm text-xs">{pagination.total}</Badge>
            {/if}
          </span>
        </button>
      {/each}
    </nav>
  </div>

  <!-- Content -->
  {#if loading}
    <LoadingSpinner />
  {:else if error}
    <Card size="sm" class="rounded-sm">
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
          <CloseOutline class="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Erro ao carregar dados</h3>
        <p class="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button size="sm" color="red" class="rounded-sm" on:click={() => handlePageChange(pagination.currentPage)}>
          <RefreshOutline class="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    </Card>
  {:else if items.length > 0}
    <!-- Table with Filters -->
    <TableContainer {loading} {error} isEmpty={items.length === 0}>
      <TableFilters
        slot="filters"
        searchValue={filters.searchTerm}
        filters={filterConfig}
        dateFilters={dateFilters}
        resultCount={items.length}
        totalCount={pagination.total}
        on:searchChange={(e) => dispatch('searchChange', e.detail)}
        on:filterChange={handleFilterChange}
        on:clearFilters={handleClearFilters}
        hasActiveFilters={filters.hasActiveFilters}
      />
      
      <!-- Table content with responsive behavior -->
      <div class="min-w-[1200px] overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Número/Tipo</TableHeadCell>
            <TableHeadCell>Data</TableHeadCell>
            <TableHeadCell>Responsável</TableHeadCell>
            <TableHeadCell>Almoxarifado</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Qtd. Itens</TableHeadCell>
            <TableHeadCell>Valor Total</TableHeadCell>
            <TableHeadCell>Ações</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each items as nota (nota.id)}
              <TableBodyRow 
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                on:click={() => handleVisualizarNota(nota)}
              >
                <TableBodyCell>
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {nota.numero || `#${nota.id.slice(0, 8)}`}
                    </span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {getTipoNotaLabel(nota.tipo)}
                    </span>
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="text-sm">{formatarData(nota.data_documento)}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="text-sm">{nota.responsavel_nome || 'N/A'}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex flex-col">
                    <span class="text-sm">{nota.almoxarifado_nome || 'N/A'}</span>
                    {#if nota.almoxarifado_destino_nome && nota.tipo === 'TRANSFERENCIA'}
                      <span class="text-xs text-gray-500 dark:text-gray-400">→ {nota.almoxarifado_destino_nome}</span>
                    {/if}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <Badge 
                    color={getStatusNotaBadgeColor(nota.status)} 
                    class="w-fit rounded-sm"
                  >
                    {getStatusNotaLabel(nota.status)}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex items-center space-x-2">
                    <FileDocOutline class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span class="text-sm font-medium">{nota.total_itens || nota.itens?.length || 0}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {(nota.total_itens || nota.itens?.length || 0) === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  {#if nota.valor_total && nota.valor_total > 0}
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-green-600 dark:text-green-400">
                        R$ {nota.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        Médio: R$ {(nota.valor_total / (nota.total_itens || nota.itens?.length || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  {:else}
                    <span class="text-sm text-gray-400 dark:text-gray-500">—</span>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex space-x-1">
                    {#each getAvailableActions(nota) as action}
                      {#if action === 'view'}
                        <button
                          class="p-2 rounded-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors"
                          on:click={(e) => { e.stopPropagation(); handleVisualizarNota(nota); }}
                          title={getActionTooltip('view', nota)}
                        >
                          <EyeOutline class="w-4 h-4" />
                        </button>
                      {:else if action === 'edit'}
                        <button
                          class="p-2 rounded-sm text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700 transition-colors"
                          on:click={(e) => { e.stopPropagation(); handleEditarNota(nota); }}
                          title={getActionTooltip('edit', nota)}
                        >
                          <PenOutline class="w-4 h-4" />
                        </button>
                      {:else if action === 'delete'}
                        <button
                          class="p-2 rounded-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-700 transition-colors"
                          on:click={(e) => { e.stopPropagation(); handleExcluirNota(nota); }}
                          title={getActionTooltip('delete', nota)}
                        >
                          <TrashBinOutline class="w-4 h-4" />
                        </button>
                      {:else if action === 'conclude'}
                        <button
                          class="p-2 rounded-sm text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200 dark:focus:ring-green-700 transition-colors"
                          on:click={(e) => { e.stopPropagation(); handleConcluirNota(nota); }}
                          title={getActionTooltip('conclude', nota)}
                        >
                          <CheckOutline class="w-4 h-4" />
                        </button>
                      {:else if action === 'cancel'}
                        <button
                          class="p-2 rounded-sm text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-700 transition-colors"
                          on:click={(e) => { e.stopPropagation(); handleCancelarNota(nota); }}
                          title={getActionTooltip('cancel', nota)}
                        >
                          <CloseOutline class="w-4 h-4" />
                        </button>
                      {/if}
                    {/each}
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
    </TableContainer>
  {:else}
    <!-- Empty state -->
    <Card size="sm" class="rounded-sm">
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <FileDocOutline class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhuma nota encontrada
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {filters.hasActiveFilters
            ? 'Tente ajustar os filtros ou termo de busca'
            : 'Comece criando uma nova nota de movimentação'}
        </p>
        <Button size="sm" color="primary" class="rounded-sm" on:click={handleNovaNota}>
          <PlusOutline class="w-4 h-4 mr-2" />
          Nova Nota
        </Button>
      </div>
    </Card>
  {/if}
</div>
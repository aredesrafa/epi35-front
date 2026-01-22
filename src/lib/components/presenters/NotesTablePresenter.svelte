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
  import SkeletonTable from '$lib/components/ui/SkeletonTable.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
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
    activeTab: 0,
    tipo: '',
    status: '',
    responsavel: '',
    almoxarifado: '',
    dataInicio: '',
    dataFim: '',
    hasActiveFilters: false
  };
  export let tabs: { label: string; value: string }[] = [
    { label: 'Todas', value: 'todas' },
    { label: 'Entrada', value: 'ENTRADA' },
    { label: 'Transferência', value: 'TRANSFERENCIA' },
    { label: 'Descarte', value: 'DESCARTE' }
  ];
  export let filterConfig: any[] = [];
  export let dateFilters: any = {};

  const dispatch = createEventDispatcher();

  // Handlers
  function handleNovaNota() {
    dispatch('novaNota');
  }

  function handleTabChange(event: { detail: { activeTabValue: number } }) {
    dispatch('tabChange', event.detail.activeTabValue);
  }

  function handlePageChange(page: number) {
    dispatch('pageChange', page);
  }

  function handleClearFilters() {
    dispatch('clearFilters');
  }

  function handleVisualizarNota(nota: any) {
    dispatch('visualizarNota', nota);
  }

  function handleEditarNota(nota: any) {
    dispatch('editarNota', nota);
  }

  function handleExcluirNota(nota: any) {
    dispatch('excluirNota', nota);
  }

  function handleConcluirNota(nota: any) {
    dispatch('concluirNota', nota);
  }

  function handleCancelarNota(nota: any) {
    dispatch('cancelarNota', nota);
  }

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

  // Formatters
  function formatarData(data: string | null): string {
    if (!data) return '—';
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  }

  function getTipoNotaLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      'ENTRADA': 'Entrada',
      'TRANSFERENCIA': 'Transferência',
      'DESCARTE': 'Descarte',
      'SAIDA': 'Saída'
    };
    return tipos[tipo] || tipo || 'N/A';
  }

  function getStatusNotaLabel(status: string): string {
    const statuses: Record<string, string> = {
      'RASCUNHO': 'Rascunho',
      'PENDENTE': 'Pendente',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    };
    return statuses[status] || status || 'N/A';
  }

  function getStatusNotaBadgeColor(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'dark' {
    const colors: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'dark'> = {
      'RASCUNHO': 'dark',
      'PENDENTE': 'yellow',
      'CONCLUIDA': 'green',
      'CANCELADA': 'red'
    };
    return colors[status] || 'dark';
  }

  function getAvailableActions(nota: any): string[] {
    const actions: string[] = ['view'];

    if (nota.status === 'RASCUNHO' || nota.status === 'PENDENTE') {
      actions.push('edit');
      actions.push('conclude');
      actions.push('cancel');
    }

    if (nota.status === 'RASCUNHO') {
      actions.push('delete');
    }

    return actions;
  }

  function getActionTooltip(action: string, nota: any): string {
    const tooltips: Record<string, string> = {
      'view': 'Visualizar nota',
      'edit': 'Editar nota',
      'delete': 'Excluir nota',
      'conclude': 'Concluir nota',
      'cancel': 'Cancelar nota'
    };
    return tooltips[action] || action;
  }
</script>

<svelte:head>
  <title>{$_('notas.title')} - DataLife EPI</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {$_('notas.title')}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Registre e consulte entregas, devoluções e transferências
      </p>
    </div>
    <div class="flex items-center space-x-3">
      <Button size="sm" color="primary" class="rounded-sm shadow-sm transition-all hover:shadow-md" on:click={handleNovaNota}>
        <PlusOutline class="w-4 h-4 mr-2" />
        {$_('notas.nova_nota')}
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
              <Badge color="dark" class="rounded-sm text-xs">{pagination.total}</Badge>
            {/if}
          </span>
        </button>
      {/each}
    </nav>
  </div>

  <!-- Content -->
  <TableContainer
    {loading}
    {error}
    isEmpty={items.length === 0 && !loading && !error}
    emptyTitle="Nenhuma nota encontrada"
    emptyMessage={filters.hasActiveFilters 
      ? 'Tente ajustar os filtros ou termo de busca' 
      : 'Comece criando uma nova nota de movimentação'}
    emptyActionLabel="Nova Movimentação"
    emptyIcon={FileDocOutline}
    on:emptyAction={handleNovaNota}
    showPagination={true}
    currentPage={pagination.currentPage}
    totalPages={pagination.totalPages}
    pageSize={pagination.pageSize}
    total={pagination.total}
    on:pageChange={(e) => handlePageChange(e.detail.page)}
  >
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
          <TableHeadCell>{$_('tables.numero')}/{$_('common.type')}</TableHeadCell>
          <TableHeadCell>{$_('common.date')}</TableHeadCell>
          <TableHeadCell>Responsável</TableHeadCell>
          <TableHeadCell>Almoxarifado</TableHeadCell>
          <TableHeadCell>{$_('common.status')}</TableHeadCell>
          <TableHeadCell>{$_('tables.total_itens')}</TableHeadCell>
          <TableHeadCell>Valor Total</TableHeadCell>
          <TableHeadCell>{$_('tables.acoes')}</TableHeadCell>
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
                {#if nota.status}
                  <Badge
                    color={getStatusNotaBadgeColor(nota.status)}
                    class="w-fit rounded-sm"
                  >
                    {getStatusNotaLabel(nota.status)}
                  </Badge>
                {:else}
                  <Badge color="dark" class="w-fit rounded-sm">
                    Sem status
                  </Badge>
                {/if}
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
  </TableContainer>
</div>

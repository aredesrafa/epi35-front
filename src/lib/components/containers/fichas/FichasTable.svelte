<!--
  Fichas Table - Componente de Tabela
  Responsabilidade: Exibir dados das fichas com paginação
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Checkbox, Button, Spinner, Alert } from 'flowbite-svelte';
  import { UserOutline, BuildingOutline, ClockOutline } from 'flowbite-svelte-icons';
  
  import { fichasUIStore } from '$lib/stores/fichas';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import EmptyState from '$lib/components/common/EmptyState.svelte';
  
  import type { FichaBasica } from '$lib/services/process/queries/types';

  // ==================== PROPS ====================
  
  export let fichas: FichaBasica[];
  export let pagination: {
    page: number;
    total: number;
    pageSize: number;
    totalPages: number;
  };
  export let loading: boolean;
  export let error: string | null;

  const dispatch = createEventDispatcher();

  // ==================== REACTIVE STATEMENTS ====================
  
  $: selectedIds = $fichasUIStore.selectedFichaIds;
  $: allSelected = fichas.length > 0 && fichas.every(ficha => selectedIds.includes(ficha.id));
  $: someSelected = selectedIds.length > 0 && !allSelected;

  // ==================== EVENT HANDLERS ====================
  
  function handleRowClick(ficha: FichaBasica) {
    dispatch('selectFicha', ficha.id);
  }

  function handleCheckboxChange(ficha: FichaBasica, event: Event) {
    event.stopPropagation();
    fichasUIStore.toggleFichaSelection(ficha.id);
    
    // Dispatch para sincronizar com container
    dispatch('selectMultiple', $fichasUIStore.selectedFichaIds);
  }

  function handleSelectAll(event: Event) {
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    
    if (target.checked) {
      const allIds = fichas.map(f => f.id);
      fichasUIStore.selectAll(allIds);
      dispatch('selectMultiple', allIds);
    } else {
      fichasUIStore.clearSelection();
      dispatch('selectMultiple', []);
    }
  }

  function handlePageChange(page: number) {
    dispatch('pageChange', page);
  }

  // ==================== HELPER FUNCTIONS ====================
  
  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }

  function getRowClasses(ficha: FichaBasica): string {
    const baseClasses = 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
    const selectedClasses = selectedIds.includes(ficha.id) ? 'bg-primary-50 dark:bg-primary-900/20' : '';
    return `${baseClasses} ${selectedClasses}`;
  }
</script>

<!-- ==================== TEMPLATE ==================== -->

<div class="fichas-table h-full flex flex-col">
  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <Spinner size="8" />
        <p class="mt-2 text-gray-600 dark:text-gray-400">Carregando fichas...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex-1 flex items-center justify-center p-4">
      <Alert color="red" class="max-w-md">
        <span class="font-medium">Erro ao carregar fichas:</span>
        {error}
      </Alert>
    </div>
  {:else if fichas.length === 0}
    <div class="flex-1 flex items-center justify-center">
      <EmptyState
        title="Nenhuma ficha encontrada"
        description="Não há fichas que correspondam aos filtros aplicados."
        icon="user"
      />
    </div>
  {:else}
    <!-- Tabela principal -->
    <div class="flex-1 overflow-auto">
      <Table>
        <!-- Header -->
        <TableHead>
          <TableHeadCell class="w-12">
            <Checkbox 
              checked={allSelected}
              indeterminate={someSelected}
              on:change={handleSelectAll}
            />
          </TableHeadCell>
          <TableHeadCell>Colaborador</TableHeadCell>
          <TableHeadCell>Empresa</TableHeadCell>
          <TableHeadCell>Cargo</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Estatísticas</TableHeadCell>
          <TableHeadCell>Última Atualização</TableHeadCell>
        </TableHead>

        <!-- Body -->
        <TableBody>
          {#each fichas as ficha (ficha.id)}
            <TableBodyRow 
              class={getRowClasses(ficha)}
              on:click={() => handleRowClick(ficha)}
            >
              <!-- Checkbox -->
              <TableBodyCell>
                <Checkbox 
                  checked={selectedIds.includes(ficha.id)}
                  on:change={(e) => handleCheckboxChange(ficha, e)}
                />
              </TableBodyCell>

              <!-- Colaborador -->
              <TableBodyCell>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {ficha.colaborador.iniciais}
                    </span>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                      {ficha.colaborador.nome}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      CPF: {ficha.colaborador.cpfDisplay}
                    </div>
                    {#if ficha.colaborador.matricula}
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        Matrícula: {ficha.colaborador.matricula}
                      </div>
                    {/if}
                  </div>
                </div>
              </TableBodyCell>

              <!-- Empresa -->
              <TableBodyCell>
                <div class="flex items-center gap-2">
                  <BuildingOutline class="w-4 h-4 text-gray-400" />
                  <span class="text-gray-900 dark:text-white">
                    {ficha.colaborador.empresa}
                  </span>
                </div>
              </TableBodyCell>

              <!-- Cargo -->
              <TableBodyCell>
                <div class="flex items-center gap-2">
                  <UserOutline class="w-4 h-4 text-gray-400" />
                  <span class="text-gray-900 dark:text-white">
                    {ficha.colaborador.cargo || 'Não informado'}
                  </span>
                </div>
              </TableBodyCell>

              <!-- Status -->
              <TableBodyCell>
                <StatusBadge 
                  status={ficha.status}
                  color={ficha.statusDisplay.cor}
                  label={ficha.statusDisplay.label}
                />
              </TableBodyCell>

              <!-- Estatísticas -->
              <TableBodyCell>
                <div class="space-y-1 text-sm">
                  <div class="text-gray-900 dark:text-white">
                    {ficha.estatisticas.totalEntregas} entregas
                  </div>
                  <div class="text-gray-500 dark:text-gray-400">
                    {ficha.estatisticas.itensAtivos} itens ativos
                  </div>
                  {#if ficha.estatisticas.devolucoesPendentes > 0}
                    <div class="text-yellow-600 dark:text-yellow-400">
                      {ficha.estatisticas.devolucoesPendentes} pendentes
                    </div>
                  {/if}
                </div>
              </TableBodyCell>

              <!-- Última Atualização -->
              <TableBodyCell>
                <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClockOutline class="w-4 h-4" />
                  {formatDate(ficha.dataAtualizacao)}
                </div>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    <!-- Paginação -->
    {#if pagination.totalPages > 1}
      <div class="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} fichas
          </div>
          
          <div class="flex items-center gap-2">
            <Button 
              size="sm" 
              color="alternative" 
              class="rounded-sm"
              disabled={pagination.page <= 1}
              on:click={() => handlePageChange(pagination.page - 1)}
            >
              Anterior
            </Button>
            
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <Button 
              size="sm" 
              color="alternative" 
              class="rounded-sm"
              disabled={pagination.page >= pagination.totalPages}
              on:click={() => handlePageChange(pagination.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .fichas-table {
    @apply bg-white dark:bg-gray-900;
  }
</style>
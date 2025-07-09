<!--
  History Modal - Modal para exibir histórico de movimentações de um item
  
  Funcionalidades:
  - Exibe histórico completo de movimentações de um item
  - Filtros por período (7, 30, 90 dias, todos)
  - Tabela com todas as movimentações
  - Dados do kardex do backend
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Modal, 
    Button, 
    Badge, 
    Table, 
    TableHead, 
    TableHeadCell, 
    TableBody, 
    TableBodyRow, 
    TableBodyCell,
    Spinner,
    Alert,
    ButtonGroup
  } from 'flowbite-svelte';
  import { 
    ClockOutline, 
    FileDocOutline,
    ArrowUpOutline,
    ArrowDownOutline,
    CalendarOutline,
    CloseOutline
  } from 'flowbite-svelte-icons';
  import { formatDate } from '$lib/utils/dateHelpers';
  import type { ItemEstoqueDTO } from '$lib/types/serviceTypes';

  // ==================== INTERFACES ====================

  export interface KardexMovimentacao {
    data: string;
    documento: string;
    tipoMovimentacao: string;
    entrada: number;
    saida: number;
    saldo: number;
    observacoes: string | null;
  }

  export interface KardexData {
    movimentacoes: KardexMovimentacao[];
    saldoInicial: number;
    saldoFinal: number;
    totalEntradas: number;
    totalSaidas: number;
  }

  // ==================== PROPS ====================

  export let showModal: boolean = false;
  export let item: ItemEstoqueDTO | null = null;
  export let kardexData: KardexData | null = null;
  export let loading: boolean = false;
  export let error: string | null = null;

  // ==================== EVENT DISPATCHER ====================

  const dispatch = createEventDispatcher<{
    close: void;
    periodFilter: { period: string; dataInicio?: string; dataFim?: string };
  }>();

  // ==================== STATE ====================

  let selectedPeriod = 'all';

  // ==================== PERIOD FILTERS ====================

  const periodOptions = [
    { value: '7', label: '7 dias' },
    { value: '30', label: '30 dias' },
    { value: '90', label: '90 dias' },
    { value: 'all', label: 'Todos' }
  ];

  // ==================== EVENT HANDLERS ====================

  function handleClose(): void {
    dispatch('close');
  }

  function handlePeriodChange(period: string): void {
    selectedPeriod = period;
    
    if (period === 'all') {
      dispatch('periodFilter', { period });
    } else {
      const days = parseInt(period);
      const dataFim = new Date().toISOString().split('T')[0];
      const dataInicio = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      dispatch('periodFilter', { period, dataInicio, dataFim });
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  function getMovimentacaoIcon(tipo: string) {
    if (tipo.includes('ENTRADA')) {
      return ArrowUpOutline;
    } else if (tipo.includes('SAIDA')) {
      return ArrowDownOutline;
    } else {
      return FileDocOutline;
    }
  }

  function getMovimentacaoColor(tipo: string) {
    if (tipo.includes('ENTRADA')) {
      return 'green';
    } else if (tipo.includes('SAIDA')) {
      return 'red';
    } else {
      return 'blue';
    }
  }

  function formatTipoMovimentacao(tipo: string): string {
    const tipos = {
      'ENTRADA_NOTA': 'Entrada por Nota',
      'SAIDA_ENTREGA': 'Saída - Entrega',
      'SAIDA_TRANSFERENCIA': 'Saída - Transferência',
      'ENTRADA_TRANSFERENCIA': 'Entrada - Transferência',
      'ENTRADA_DEVOLUCAO': 'Entrada - Devolução',
      'SAIDA_DESCARTE': 'Saída - Descarte',
      'AJUSTE_POSITIVO': 'Ajuste Positivo',
      'AJUSTE_NEGATIVO': 'Ajuste Negativo'
    };
    return tipos[tipo] || tipo;
  }

  function formatQuantidade(entrada: number, saida: number): string {
    if (entrada > 0) {
      return `+${entrada}`;
    } else if (saida > 0) {
      return `-${saida}`;
    }
    return '0';
  }

  // ==================== REACTIVE STATEMENTS ====================

  $: modalTitle = item ? `Histórico - ${item.tipoEPI?.nomeEquipamento || 'Item'}` : 'Histórico';
  $: modalSubtitle = item ? `CA ${item.tipoEPI?.numeroCA || '-'}` : '';
</script>

<Modal bind:open={showModal} size="xl" class="rounded-sm">
  <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-600">
    <div class="flex items-center space-x-3">
      <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
        <ClockOutline class="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {modalTitle}
        </h3>
        {#if modalSubtitle}
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {modalSubtitle}
          </p>
        {/if}
      </div>
    </div>
    <Button 
      color="alternative" 
      class="rounded-sm p-2"
      on:click={handleClose}
    >
      <CloseOutline class="w-5 h-5" />
    </Button>
  </div>

  <div class="p-6 space-y-6">
    <!-- Period Filter -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <CalendarOutline class="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Período:
        </span>
      </div>
      <ButtonGroup class="rounded-sm">
        {#each periodOptions as option}
          <Button
            size="sm"
            color={selectedPeriod === option.value ? 'primary' : 'alternative'}
            class="rounded-none first:rounded-l-sm last:rounded-r-sm"
            on:click={() => handlePeriodChange(option.value)}
          >
            {option.label}
          </Button>
        {/each}
      </ButtonGroup>
    </div>

    <!-- Content -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Spinner class="w-8 h-8" />
        <span class="ml-3 text-gray-600 dark:text-gray-400">
          Carregando histórico...
        </span>
      </div>
    {:else if error}
      <Alert color="red" class="rounded-sm">
        <span class="font-medium">Erro ao carregar histórico:</span> {error}
      </Alert>
    {:else if kardexData}
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Saldo Inicial</p>
              <p class="text-xl font-semibold text-gray-900 dark:text-white">
                {kardexData.saldoInicial}
              </p>
            </div>
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileDocOutline class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div class="bg-green-50 dark:bg-green-900 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-600 dark:text-green-400">Total Entradas</p>
              <p class="text-xl font-semibold text-green-900 dark:text-green-100">
                +{kardexData.totalEntradas}
              </p>
            </div>
            <div class="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <ArrowUpOutline class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div class="bg-red-50 dark:bg-red-900 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-red-600 dark:text-red-400">Total Saídas</p>
              <p class="text-xl font-semibold text-red-900 dark:text-red-100">
                -{kardexData.totalSaidas}
              </p>
            </div>
            <div class="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
              <ArrowDownOutline class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 dark:text-blue-400">Saldo Final</p>
              <p class="text-xl font-semibold text-blue-900 dark:text-blue-100">
                {kardexData.saldoFinal}
              </p>
            </div>
            <div class="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <FileDocOutline class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Movimentações Table -->
      {#if kardexData.movimentacoes.length > 0}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <Table>
              <TableHead class="bg-gray-50 dark:bg-gray-700">
                <TableHeadCell class="py-3 px-4 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300">
                  Data
                </TableHeadCell>
                <TableHeadCell class="py-3 px-4 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300">
                  Documento
                </TableHeadCell>
                <TableHeadCell class="py-3 px-4 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300">
                  Tipo
                </TableHeadCell>
                <TableHeadCell class="py-3 px-4 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 text-center">
                  Quantidade
                </TableHeadCell>
                <TableHeadCell class="py-3 px-4 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300 text-center">
                  Saldo
                </TableHeadCell>
                <TableHeadCell class="py-3 px-4 font-semibold text-xs uppercase text-gray-600 dark:text-gray-300">
                  Observações
                </TableHeadCell>
              </TableHead>
              <TableBody class="divide-y divide-gray-200 dark:divide-gray-700">
                {#each kardexData.movimentacoes as movimentacao}
                  {@const icon = getMovimentacaoIcon(movimentacao.tipoMovimentacao)}
                  {@const color = getMovimentacaoColor(movimentacao.tipoMovimentacao)}
                  
                  <TableBodyRow class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableBodyCell class="py-3 px-4">
                      <div class="text-sm text-gray-900 dark:text-white">
                        {formatDate(movimentacao.data)}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(movimentacao.data).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </TableBodyCell>
                    <TableBodyCell class="py-3 px-4">
                      <div class="flex items-center space-x-2">
                        <div class="p-1 bg-gray-100 dark:bg-gray-700 rounded">
                          <FileDocOutline class="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span class="text-sm font-medium text-gray-900 dark:text-white">
                          {movimentacao.documento}
                        </span>
                      </div>
                    </TableBodyCell>
                    <TableBodyCell class="py-3 px-4">
                      <div class="flex items-center space-x-2">
                        <div class="p-1 {color === 'green' ? 'bg-green-100 dark:bg-green-900' : color === 'red' ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'} rounded">
                          <svelte:component this={icon} class="w-3 h-3 {color === 'green' ? 'text-green-600 dark:text-green-400' : color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}" />
                        </div>
                        <span class="text-sm text-gray-900 dark:text-white">
                          {formatTipoMovimentacao(movimentacao.tipoMovimentacao)}
                        </span>
                      </div>
                    </TableBodyCell>
                    <TableBodyCell class="py-3 px-4 text-center">
                      <Badge 
                        color={movimentacao.entrada > 0 ? 'green' : 'red'} 
                        class="w-fit rounded-sm"
                      >
                        {formatQuantidade(movimentacao.entrada, movimentacao.saida)}
                      </Badge>
                    </TableBodyCell>
                    <TableBodyCell class="py-3 px-4 text-center">
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {movimentacao.saldo}
                      </span>
                    </TableBodyCell>
                    <TableBodyCell class="py-3 px-4">
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        {movimentacao.observacoes || '-'}
                      </span>
                    </TableBodyCell>
                  </TableBodyRow>
                {/each}
              </TableBody>
            </Table>
          </div>
        </div>
      {:else}
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <ClockOutline class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma movimentação encontrada
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Não há movimentações registradas para este item no período selecionado.
          </p>
        </div>
      {/if}
    {:else}
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <ClockOutline class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Selecione um item
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          Escolha um item da tabela para ver seu histórico de movimentações.
        </p>
      </div>
    {/if}
  </div>

  <div class="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-600 space-x-3">
    <Button 
      color="alternative" 
      class="rounded-sm" 
      on:click={handleClose}
    >
      Fechar
    </Button>
  </div>
</Modal>
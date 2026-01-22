<!--
  History Modal Presenter - Componente "Burro"
  
  Este presenter mostra o histórico de movimentações de um item:
  - Recebe dados via props
  - Renderiza modal com filtros de período
  - Emite eventos para o Container
  - Não contém lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Modal, 
    Button, 
    Select, 
    Table,
    TableHead,
    TableHeadCell,
    TableBody,
    TableBodyRow,
    TableBodyCell,
    Badge,
    Spinner,
    Alert
  } from 'flowbite-svelte';
  import type { ItemEstoqueDTO, MovimentacaoEstoqueDTO } from '$lib/types/serviceTypes';

  // ==================== PROPS ====================
  
  export let item: ItemEstoqueDTO | null = null;
  export let movimentacoes: MovimentacaoEstoqueDTO[] = [];
  export let loading: boolean = false;
  export let error: string | null = null;
  export let show: boolean = true;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    close: void;
    filterChange: { period: string };
  }>();

  // ==================== LOCAL STATE ====================
  
  let selectedPeriod = '30'; // padrão 30 dias

  // Opções de período
  const periodOptions = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' }
  ];

  // ==================== REACTIVE STATEMENTS ====================
  
  $: if (selectedPeriod) {
    dispatch('filterChange', { period: selectedPeriod });
  }

  // ==================== EVENT HANDLERS ====================
  
  function handleClose(): void {
    dispatch('close');
  }

  function handlePeriodChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    selectedPeriod = target.value;
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  function formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTipoMovimentacaoColor(tipo: string): "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none" {
    if (tipo.includes('ENTRADA') || tipo.includes('DEVOLUCAO')) return 'green';
    if (tipo.includes('SAIDA') || tipo.includes('ENTREGA')) return 'blue';
    if (tipo.includes('AJUSTE_POSITIVO')) return 'green';
    if (tipo.includes('AJUSTE_NEGATIVO')) return 'yellow';
    if (tipo.includes('DESCARTE')) return 'red';
    if (tipo.includes('ESTORNO')) return 'purple';
    return 'dark';
  }

  function getTipoMovimentacaoLabel(tipo: string): string {
    switch (tipo) {
      case 'ENTRADA_NOTA': return 'Entrada por Nota';
      case 'SAIDA_ENTREGA': return 'Saída para Entrega';
      case 'ENTRADA_DEVOLUCAO': return 'Entrada por Devolução';
      case 'SAIDA_TRANSFERENCIA': return 'Saída por Transferência';
      case 'ENTRADA_TRANSFERENCIA': return 'Entrada por Transferência';
      case 'SAIDA_DESCARTE': return 'Descarte';
      case 'AJUSTE_POSITIVO': return 'Ajuste Positivo';
      case 'AJUSTE_NEGATIVO': return 'Ajuste Negativo';
      case 'ESTORNO_ENTRADA_NOTA': return 'Estorno de Entrada';
      case 'ESTORNO_SAIDA_ENTREGA': return 'Estorno de Saída';
      default: return tipo || 'N/A';
    }
  }

  function formatQuantidade(quantidade: number, tipo: string): string {
    const isPositive = tipo.includes('ENTRADA') || tipo.includes('AJUSTE_POSITIVO') || tipo.includes('DEVOLUCAO');
    const prefix = isPositive ? '+' : '-';
    return `${prefix}${Math.abs(quantidade)}`;
  }

  function getQuantidadeColor(quantidade: number, tipo: string): string {
    const isPositive = tipo.includes('ENTRADA') || tipo.includes('AJUSTE_POSITIVO') || tipo.includes('DEVOLUCAO');
    return isPositive ? 'text-green-600' : 'text-red-600';
  }
</script>

<!-- ==================== TEMPLATE ==================== -->

<Modal 
  bind:open={show}
  size="xl"
  autoclose={false}
  class="w-full max-w-4xl"
  on:close={handleClose}
>
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
        Histórico de Movimentações
      </h3>
      {#if item}
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {item.tipoEPI?.nomeEquipamento || 'Item'} - CA: {item.tipoEPI?.numero_ca || 'N/A'}
        </p>
      {/if}
    </div>
    
    <!-- Filtro de período -->
    <div class="flex items-center gap-2">
      <label for="period" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Período:
      </label>
      <Select
        id="period"
        bind:value={selectedPeriod}
        size="sm"
        class="rounded-sm w-40"
        on:change={handlePeriodChange}
      >
        {#each periodOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </Select>
    </div>
  </div>

  <!-- Content -->
  <div class="space-y-4">
    {#if error}
      <Alert color="red" class="rounded-sm">
        <span class="font-medium">Erro:</span> {error}
      </Alert>
    {:else if loading}
      <div class="flex items-center justify-center py-12">
        <Spinner size="6" color="blue" />
        <span class="ml-3 text-gray-600 dark:text-gray-400">Carregando histórico...</span>
      </div>
    {:else if movimentacoes.length === 0}
      <div class="text-center py-12">
        <div class="text-gray-400 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-gray-600 dark:text-gray-400">
          Nenhuma movimentação encontrada no período selecionado
        </p>
      </div>
    {:else}
      <!-- Tabela de movimentações -->
      <div class="overflow-x-auto max-h-96">
        <Table>
          <TableHead>
            <TableHeadCell class="text-left">Data</TableHeadCell>
            <TableHeadCell class="text-left">Tipo</TableHeadCell>
            <TableHeadCell class="text-center">Quantidade</TableHeadCell>
            <TableHeadCell class="text-left">Motivo</TableHeadCell>
            <TableHeadCell class="text-left">Usuário</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each movimentacoes as movimentacao (movimentacao.id)}
              <TableBodyRow>
                <!-- Data -->
                <TableBodyCell class="font-medium">
                  <div class="text-sm">
                    {formatDate(movimentacao.dataMovimentacao)}
                  </div>
                </TableBodyCell>

                <!-- Tipo -->
                <TableBodyCell>
                  <Badge 
                    color={getTipoMovimentacaoColor(movimentacao.tipoMovimentacao)} 
                    class="w-fit rounded-sm text-xs"
                  >
                    {getTipoMovimentacaoLabel(movimentacao.tipoMovimentacao)}
                  </Badge>
                </TableBodyCell>

                <!-- Quantidade -->
                <TableBodyCell class="text-center">
                  <span 
                    class="font-semibold {getQuantidadeColor(movimentacao.quantidade, movimentacao.tipoMovimentacao)}"
                  >
                    {formatQuantidade(movimentacao.quantidade, movimentacao.tipoMovimentacao)}
                  </span>
                </TableBodyCell>

                <!-- Motivo -->
                <TableBodyCell>
                  <div class="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={movimentacao.motivo}>
                    {movimentacao.motivo || '-'}
                  </div>
                </TableBodyCell>

                <!-- Usuário -->
                <TableBodyCell>
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    {movimentacao.usuario?.nome || 'Sistema'}
                  </div>
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>

      <!-- Resumo -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <strong>{movimentacoes.length}</strong> movimentações encontradas no período de <strong>{periodOptions.find(p => p.value === selectedPeriod)?.label.toLowerCase()}</strong>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600 mt-6">
    <Button
      size="sm"
      color="light"
      class="rounded-sm"
      on:click={handleClose}
    >
      Fechar
    </Button>
  </div>
</Modal>
<!--
  Relatório de Descartes - Sistema DataLife EPI
  
  Análise completa de descartes de EPIs com filtros avançados.
  Conectado ao endpoint /api/relatorios/descartes.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Input, Label, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell } from 'flowbite-svelte';
  import { DownloadOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import { notify } from '$lib/stores';
  
  // ✅ CONECTADO AO BACKEND REAL
  import { reportingQueryAdapter } from '$lib/services/reporting/reportingQueryAdapter';
  import type { RelatorioDescartes, EstatisticasDescartes, FiltrosRelatorio } from '$lib/services/reporting/reportingQueryAdapter';

  // State
  let loading = false;
  let relatorioDescartes: RelatorioDescartes | null = null;
  let estatisticas: EstatisticasDescartes | null = null;
  let error: string | null = null;
  
  // Filtros
  let filtros: FiltrosRelatorio = {};

  onMount(() => {
    loadRelatorioDescartes();
    loadEstatisticas();
  });

  async function loadRelatorioDescartes(): Promise<void> {
    loading = true;
    error = null;
    
    try {
      console.log('🗑️ Carregando relatório de descartes...');
      relatorioDescartes = await reportingQueryAdapter.getRelatorioDescartes(filtros);
      console.log('✅ Relatório de descartes carregado:', relatorioDescartes);
    } catch (err) {
      console.error('❌ Erro ao carregar relatório de descartes:', err);
      error = 'Erro ao carregar relatório de descartes';
      notify.error('Erro', 'Não foi possível carregar o relatório');
    } finally {
      loading = false;
    }
  }

  async function loadEstatisticas(): Promise<void> {
    try {
      console.log('📊 Carregando estatísticas de descartes...');
      estatisticas = await reportingQueryAdapter.getEstatisticasDescartes();
      console.log('✅ Estatísticas carregadas:', estatisticas);
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
    }
  }
</script>

<svelte:head>
  <title>Relatório de Descartes - DataLife EPI</title>
  <meta name="description" content="Análise completa de descartes de EPIs com estatísticas e filtros avançados" />
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Relatório de Descartes</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Análise completa de descartes de EPIs e equipamentos
      </p>
    </div>
    <Button size="sm" color="primary" class="rounded-sm">
      <DownloadOutline class="w-4 h-4 mr-2" />
      Exportar
    </Button>
  </div>

  <!-- Estatísticas Resumo -->
  {#if estatisticas}
    <div class="grid gap-6 md:grid-cols-4">
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-red-100 dark:bg-red-900">
            <TrashBinOutline class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Descartado</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.totalDescartado.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-orange-100 dark:bg-orange-900">
            <TrashBinOutline class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {estatisticas.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  {/if}

  <!-- Filtros -->
  <Card class="p-4 rounded-sm !max-w-none">
    <div class="grid gap-4 md:grid-cols-3">
      <div>
        <Label for="dataInicio" class="mb-2">Data Início</Label>
        <Input 
          id="dataInicio"
          type="date"
          bind:value={filtros.dataInicio}
          class="rounded-sm"
        />
      </div>
      <div>
        <Label for="dataFim" class="mb-2">Data Fim</Label>
        <Input 
          id="dataFim"
          type="date"
          bind:value={filtros.dataFim}
          class="rounded-sm"
        />
      </div>
      <div class="flex items-end">
        <Button 
          size="sm" 
          color="primary" 
          class="rounded-sm"
          on:click={loadRelatorioDescartes}
        >
          Filtrar
        </Button>
      </div>
    </div>
  </Card>

  <!-- Tabela de Descartes -->
  {#if loading}
    <Card class="rounded-sm !max-w-none">
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    </Card>
  {:else if error}
    <Card class="rounded-sm !max-w-none">
      <p class="text-red-600 dark:text-red-400 text-center py-8">{error}</p>
    </Card>
  {:else if relatorioDescartes}
    <Card class="rounded-sm !max-w-none">
      <div class="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Data</TableHeadCell>
            <TableHeadCell>Equipamento</TableHeadCell>
            <TableHeadCell>Quantidade</TableHeadCell>
            <TableHeadCell>Motivo</TableHeadCell>
            <TableHeadCell>Valor</TableHeadCell>
            <TableHeadCell>Responsável</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each relatorioDescartes.descartes as descarte}
              <TableBodyRow>
                <TableBodyCell>
                  {new Date(descarte.data).toLocaleDateString('pt-BR')}
                </TableBodyCell>
                <TableBodyCell>{descarte.equipamento}</TableBodyCell>
                <TableBodyCell>{descarte.quantidade}</TableBodyCell>
                <TableBodyCell>{descarte.motivo}</TableBodyCell>
                <TableBodyCell>
                  {descarte.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableBodyCell>
                <TableBodyCell>{descarte.responsavel}</TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    </Card>
  {/if}
</div>
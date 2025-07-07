<!--
  Saúde do Sistema - Monitoramento Técnico
  
  Dashboard técnico para monitoramento da saúde e performance do sistema.
  Conectado ao endpoint /api/relatorios/saude.
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Card, Button, Badge, Toggle, Label } from 'flowbite-svelte';
  import { 
    CheckCircleOutline, 
    ExclamationCircleOutline, 
    ClockOutline,
    ChartOutline,
    RefreshOutline
  } from 'flowbite-svelte-icons';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import { notify } from '$lib/stores';
  
  // ✅ CONECTADO AO BACKEND REAL
  import { reportingQueryAdapter } from '$lib/services/reporting/reportingQueryAdapter';
  import type { SaudeSistema } from '$lib/services/reporting/reportingQueryAdapter';

  // State
  let loading = false;
  let saudeSistema: SaudeSistema | null = null;
  let error: string | null = null;
  let incluirPerformance = false;
  let autoRefresh = true;
  let refreshInterval: any = null;

  onMount(() => {
    loadSaudeSistema();
    
    if (autoRefresh) {
      refreshInterval = setInterval(loadSaudeSistema, 30000); // Refresh a cada 30s
    }
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  async function loadSaudeSistema(): Promise<void> {
    loading = true;
    error = null;
    
    try {
      console.log('⚕️ Carregando saúde do sistema...');
      saudeSistema = await reportingQueryAdapter.getSaudeSistema(incluirPerformance);
      console.log('✅ Saúde do sistema carregada:', saudeSistema);
    } catch (err) {
      console.error('❌ Erro ao carregar saúde do sistema:', err);
      error = 'Erro ao carregar dados de saúde do sistema';
      notify.error('Erro', 'Não foi possível carregar os dados do sistema');
    } finally {
      loading = false;
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'saudavel': return 'green';
      case 'alerta': return 'yellow';
      case 'critico': return 'red';
      case 'conectado': return 'green';
      case 'desconectado': return 'red';
      default: return 'gray';
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'saudavel': return 'Saudável';
      case 'alerta': return 'Alerta';
      case 'critico': return 'Crítico';
      case 'conectado': return 'Conectado';
      case 'desconectado': return 'Desconectado';
      default: return status;
    }
  }

  function getNivelLogColor(nivel: string): string {
    switch (nivel) {
      case 'info': return 'blue';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  }

  function handleTogglePerformance(): void {
    loadSaudeSistema();
  }

  function handleToggleAutoRefresh(): void {
    if (autoRefresh) {
      refreshInterval = setInterval(loadSaudeSistema, 30000);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    }
  }
</script>

<svelte:head>
  <title>Saúde do Sistema - DataLife EPI</title>
  <meta name="description" content="Monitoramento técnico da saúde e performance do sistema EPI" />
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Saúde do Sistema</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Monitoramento técnico e performance do sistema
      </p>
    </div>
    <div class="flex items-center space-x-3">
      <Button 
        size="sm" 
        color="alternative" 
        class="rounded-sm"
        on:click={loadSaudeSistema}
        disabled={loading}
      >
        <RefreshOutline class="w-4 h-4 mr-2" />
        Atualizar
      </Button>
    </div>
  </div>

  <!-- Controles -->
  <Card class="p-4 rounded-sm !max-w-none">
    <div class="flex flex-wrap gap-6 items-center">
      <div class="flex items-center space-x-2">
        <Toggle 
          bind:checked={incluirPerformance}
          on:change={handleTogglePerformance}
        />
        <Label>Incluir dados de performance</Label>
      </div>
      
      <div class="flex items-center space-x-2">
        <Toggle 
          bind:checked={autoRefresh}
          on:change={handleToggleAutoRefresh}
        />
        <Label>Atualização automática (30s)</Label>
      </div>
    </div>
  </Card>

  {#if loading}
    <div class="grid gap-6 md:grid-cols-3">
      {#each Array(6) as _}
        <Card class="rounded-sm !max-w-none">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-8 bg-gray-200 rounded"></div>
          </div>
        </Card>
      {/each}
    </div>
  {:else if error}
    <Card class="rounded-sm !max-w-none">
      <p class="text-red-600 dark:text-red-400 text-center py-8">{error}</p>
    </Card>
  {:else if saudeSistema}
    <!-- Status Geral -->
    <div class="grid gap-6 md:grid-cols-3">
      <!-- Status Principal -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm {saudeSistema.status === 'saudavel' ? 'bg-green-100 dark:bg-green-900' : saudeSistema.status === 'alerta' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900'}">
            {#if saudeSistema.status === 'saudavel'}
              <CheckCircleOutline class="w-6 h-6 text-green-600 dark:text-green-400" />
            {:else if saudeSistema.status === 'alerta'}
              <ExclamationCircleOutline class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            {:else}
              <ExclamationCircleOutline class="w-6 h-6 text-red-600 dark:text-red-400" />
            {/if}
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Status do Sistema</p>
            <Badge 
              color={getStatusColor(saudeSistema.status)} 
              class="w-fit rounded-sm"
            >
              {getStatusLabel(saudeSistema.status)}
            </Badge>
          </div>
        </div>
      </Card>

      <!-- Uptime -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-blue-100 dark:bg-blue-900">
            <ClockOutline class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {saudeSistema.uptime.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>

      <!-- Tempo de Resposta -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-purple-100 dark:bg-purple-900">
            <ClockOutline class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Tempo Resposta</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {saudeSistema.tempoResposta}ms
            </p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Base de Dados -->
    <Card class="rounded-sm !max-w-none">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Base de Dados</h3>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <Badge 
            color={getStatusColor(saudeSistema.baseDados.status)} 
            class="w-fit rounded-sm"
          >
            {getStatusLabel(saudeSistema.baseDados.status)}
          </Badge>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Latência: {saudeSistema.baseDados.latencia}ms
          </span>
        </div>
      </div>
    </Card>

    <!-- Performance (se habilitado) -->
    {#if incluirPerformance && saudeSistema.performance}
      <Card class="rounded-sm !max-w-none">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
        <div class="grid gap-4 md:grid-cols-3">
          <div class="flex items-center">
            <ChartOutline class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">CPU</p>
              <p class="font-bold">{saudeSistema.performance.cpu}%</p>
            </div>
          </div>
          
          <div class="flex items-center">
            <ChartOutline class="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Memória</p>
              <p class="font-bold">{saudeSistema.performance.memoria}%</p>
            </div>
          </div>
          
          <div class="flex items-center">
            <ChartOutline class="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Disco</p>
              <p class="font-bold">{saudeSistema.performance.disco}%</p>
            </div>
          </div>
        </div>
      </Card>
    {/if}

    <!-- Logs Recentes -->
    <Card class="rounded-sm !max-w-none">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logs Recentes</h3>
      {#if saudeSistema.logsRecentes.length > 0}
        <div class="space-y-3">
          {#each saudeSistema.logsRecentes.slice(0, 10) as log}
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-sm">
              <div class="flex-1">
                <p class="text-sm text-gray-900 dark:text-white">{log.message}</p>
                <p class="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              <Badge 
                color={getNivelLogColor(log.nivel)} 
                class="w-fit rounded-sm"
              >
                {log.nivel}
              </Badge>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 dark:text-gray-400 text-center py-8">
          Nenhum log recente encontrado
        </p>
      {/if}
    </Card>
  {/if}
</div>
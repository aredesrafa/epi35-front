<script lang="ts">
  import { Card, Badge, Button } from 'flowbite-svelte';
  import { 
    FileDocOutline, 
    CheckCircleOutline, 
    ExclamationCircleOutline, 
    ArchiveOutline,
    ArrowRightOutline,
    SearchOutline
  } from 'flowbite-svelte-icons';
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { base } from '$app/paths';
  import { dashboardAdapter } from '$lib/services/reporting/dashboardAdapter';
  import type { DashboardData, ActivityItem } from '$lib/services/reporting/dashboardAdapter';
  import { _ } from 'svelte-i18n';
  
  // Dashboard data store
  const dashboardData = writable<DashboardData | null>(null);
  const loading = writable(true);
  const error = writable<string | null>(null);
  
  // Metrics data (reactive)
  let metrics: any[] = [];
  
  // Load dashboard data from API
  async function loadDashboardData() {
    try {
      loading.set(true);
      error.set(null);
      
      // ✅ Usar novo adapter que conecta ao backend real
      const data = await dashboardAdapter.getDashboardData();
      dashboardData.set(data);
      
      // Update metrics array com dados reais
      metrics = [
        {
          title: $_('dashboard.active_fichas'),
          value: data.metrics.fichasAtivas.toString(),
          icon: FileDocOutline,
          color: 'blue',
          change: data.metrics.fichasAtivasChange || '0%',
          changeType: 'positive'
        },
        {
          title: $_('dashboard.delivered_epis'),
          value: data.metrics.episEntregues.toString(),
          icon: CheckCircleOutline,
          color: 'green',
          change: data.metrics.episEntreguesChange || '0%',
          changeType: 'positive'
        },
        {
          title: $_('dashboard.expiring_epis'),
          value: data.metrics.episVencendo.toString(),
          icon: ExclamationCircleOutline,
          color: 'yellow',
          change: data.metrics.episVencendoChange || '0%',
          changeType: 'negative'
        },
        {
          title: $_('dashboard.low_stock'),
          value: data.metrics.estoqueBaixo.toString(),
          icon: ArchiveOutline,
          color: 'red',
          change: data.metrics.estoqueBaixoChange || '0%',
          changeType: 'positive'
        }
      ];
      
      // Atualizar activities store com dados reais
      activitiesStore.set(data.activities);
      
      // Atualizar quick stats store com dados reais
      quickStatsStore.set(data.quickStats);
      
      console.log('📊 Dashboard carregado com sucesso:', data);
    } catch (err) {
      console.error('❌ Erro ao carregar dashboard:', err);
      error.set(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      loading.set(false);
    }
  }
  
  // Stores para atividades e stats rápidas (preenchidas com dados reais)
  const activitiesStore = writable<ActivityItem[]>([]);
  const quickStatsStore = writable({
    totalColaboradores: 0,
    fichasVencidas: 0,
    estoqueTotal: 0,
    entregasHoje: 0
  });
  
  // Derived stores para computações reativas otimizadas
  const totalActiveAlerts = derived([quickStatsStore], ([$stats]) => 
    $stats.fichasVencidas + metrics.find(m => m.title === 'Estoque Baixo')?.value || 0
  );
  
  function getActivityColor(type: string) {
    switch (type) {
      case 'entrega': return 'green';
      case 'devolucao': return 'blue';
      case 'entrada': return 'purple';
      case 'vencimento': return 'yellow';
      case 'ficha': return 'indigo';
      default: return 'gray';
    }
  }
  
  function getActivityBgClass(type: string) {
    const color = getActivityColor(type);
    switch (color) {
      case 'green': return 'bg-green-100 dark:bg-green-900';
      case 'blue': return 'bg-blue-100 dark:bg-blue-900';
      case 'purple': return 'bg-purple-100 dark:bg-purple-900';
      case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900';
      case 'indigo': return 'bg-indigo-100 dark:bg-indigo-900';
      default: return 'bg-gray-100 dark:bg-gray-900';
    }
  }
  
  function getActivityIcon(type: string) {
    switch (type) {
      case 'entrega': return CheckCircleOutline;
      case 'devolucao': return ArrowRightOutline;
      case 'entrada': return ArchiveOutline;
      case 'vencimento': return ExclamationCircleOutline;
      case 'ficha': return FileDocOutline;
      default: return FileDocOutline;
    }
  }
  
  // Otimização: Lazy loading e performance
  let dashboardLoaded = false;
  
  onMount(() => {
    dashboardLoaded = true;
    
    // Carregar dados do dashboard do backend
    loadDashboardData();
    
    // Simular carregamento de dados em tempo real
    const interval = setInterval(() => {
      quickStatsStore.update(stats => ({
        ...stats,
        entregasHoje: stats.entregasHoje + Math.floor(Math.random() * 5) // Increased activity
      }));
    }, 30000); // Update a cada 30 segundos
    
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Dashboard - DataLife EPI</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {$_('dashboard.title')}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {$_('dashboard.subtitle')}
      </p>
    </div>
  </div>
  
  <!-- Metrics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#if $loading}
      {#each Array(4) as _, i}
        <Card size="sm" class="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between animate-pulse">
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div class="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </Card>
      {/each}
    {:else}
      {#each metrics as metric}
        <Card size="sm" class="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
              <div class="flex items-center mt-2">
                <span class="text-xs {metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}">
                  {metric.change}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">vs. mês anterior</span>
              </div>
            </div>
            <div class="p-3 rounded-lg {metric.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' : metric.color === 'green' ? 'bg-green-100 dark:bg-green-900' : metric.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900'}">
              <svelte:component this={metric.icon} class="w-6 h-6" />
            </div>
          </div>
        </Card>
      {/each}
    {/if}
  </div>
  
  <!-- Main Content Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Recent Activities e Top Contratadas - Expandido para ocupar 2/3 -->
    <div class="lg:col-span-2 space-y-6">
      <Card size="sm" class="rounded-lg w-full max-w-none shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Atividades Recentes</h3>
          <Button size="xs" color="alternative" class="rounded-sm" href="{base}/fichas">Ver Fichas</Button>
        </div>
        
        <div class="space-y-3">
          {#each $activitiesStore as activity (activity.id)}
            <div class="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex-shrink-0">
                <div class="p-2 rounded-lg {getActivityBgClass(activity.type)}">
                  <svelte:component this={getActivityIcon(activity.type)} class="w-5 h-5" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{activity.equipment}</p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          {/each}
        </div>
      </Card>

      <!-- Top Contratadas por EPIs Ativos -->
      {#if $dashboardData && $dashboardData.contratadaStats && $dashboardData.contratadaStats.topContratadas.length > 0}
        <Card size="sm" class="rounded-lg w-full max-w-none shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">EPIs ativos por Contratada</h3>
          <div class="space-y-3">
            {#each $dashboardData.contratadaStats.topContratadas as item}
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{item.contratada.nome}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{item.contratada.cnpjFormatado}</p>
                </div>
                <div class="text-right ml-4">
                  <Badge color="green" class="w-fit rounded-sm mb-1">{item.totalEpisAtivos} EPIs</Badge>
                  <p class="text-xs text-gray-600 dark:text-gray-400">{item.totalColaboradores} Colab.</p>
                </div>
              </div>
            {/each}
          </div>
        </Card>
      {/if}
    </div>
    
    <!-- Quick Stats & Alerts -->
    <div class="space-y-6">
      <!-- Quick Stats -->
      <Card size="sm" class="rounded-lg w-full max-w-none shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visão Rápida</h3>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Total de Colaboradores</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{$quickStatsStore.totalColaboradores}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Fichas Vencidas</span>
            {#if $quickStatsStore.fichasVencidas > 0}
               <Badge color="red" class="w-fit rounded-sm">{$quickStatsStore.fichasVencidas}</Badge>
            {:else}
               <span class="text-sm font-semibold text-gray-900 dark:text-white">0</span>
            {/if}
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Estoque Total</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{$quickStatsStore.estoqueTotal.toLocaleString('pt-BR')}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Entregas Hoje</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{$quickStatsStore.entregasHoje}</span>
          </div>
        </div>
      </Card>
      
      <!-- Alerts -->
      <Card size="sm" class="rounded-sm border-l-4 border-l-yellow-500 shadow-none">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Alertas</h3>
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <ExclamationCircleOutline class="w-4 h-4 text-yellow-600" />
            <span class="text-sm text-gray-600 dark:text-gray-400">23 EPIs vencendo em 30 dias</span>
          </div>
          <div class="flex items-center space-x-2">
            <ExclamationCircleOutline class="w-4 h-4 text-red-600" />
            <span class="text-sm text-gray-600 dark:text-gray-400">12 itens com estoque baixo</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
</div>
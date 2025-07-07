<!--
  Dashboard Executivo - Relatórios
  
  Visão geral executiva com métricas principais e KPIs do sistema EPI.
  Conectado aos endpoints reais de /api/relatorios/dashboard.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Badge, Select, Input, Label } from 'flowbite-svelte';
  import { 
    ChartOutline, 
    CalendarMonthSolid,
    UsersGroupSolid,
    ShoppingBagSolid,
    ExclamationCircleOutline,
    CheckCircleOutline,
    ClockOutline,
    DownloadOutline,
    RefreshOutline
  } from 'flowbite-svelte-icons';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import { notify } from '$lib/stores';
  import { formatarData } from '$lib/utils/dateHelpers';
  
  // ✅ NOVO: Service adapter conectado ao backend real
  import { reportingQueryAdapter } from '$lib/services/reporting/reportingQueryAdapter';
  import type { DashboardData, EstatisticasEntregas, VencimentosProximos, FiltrosRelatorio } from '$lib/services/reporting/reportingQueryAdapter';

  // ==================== STATE ====================
  
  // Data
  let dashboardData: DashboardData | null = null;
  let estatisticasEntregas: EstatisticasEntregas | null = null;
  let vencimentosProximos: VencimentosProximos | null = null;
  
  // Loading states
  let loading = false;
  let loadingEntregas = false;
  let loadingVencimentos = false;
  
  // Error states
  let error: string | null = null;
  let errorEntregas: string | null = null;
  let errorVencimentos: string | null = null;
  
  // Filtros
  let filtros: FiltrosRelatorio = {
    periodo: 'ULTIMO_MES'
  };
  
  let filtroAlmoxarifado = '';
  let filtroUnidadeNegocio = '';
  
  // Opções para filtros (baseadas nos enums do backend)
  let periodosDisponiveis = [
    { value: 'ULTIMO_MES', label: 'Último Mês' },
    { value: 'ULTIMO_TRIMESTRE', label: 'Último Trimestre' },
    { value: 'ULTIMO_SEMESTRE', label: 'Último Semestre' },
    { value: 'ULTIMO_ANO', label: 'Último Ano' }
  ];

  // ==================== LIFECYCLE ====================
  
  onMount(() => {
    console.log('📊 Inicializando Dashboard Executivo...');
    loadDashboardData();
  });

  // ==================== DATA LOADING ====================
  
  async function loadDashboardData(): Promise<void> {
    loading = true;
    error = null;
    
    try {
      console.log('📈 Carregando dados do dashboard executivo...', filtros);
      
      // ✅ CONECTADO AO BACKEND REAL: Carregar dados principais
      dashboardData = await reportingQueryAdapter.getDashboardData(filtros);
      
      console.log('✅ Dashboard executivo carregado:', dashboardData);
      
      // Carregar dados complementares em paralelo
      await Promise.all([
        loadEstatisticasEntregas(),
        loadVencimentosProximos()
      ]);
      
    } catch (err) {
      console.error('❌ Erro ao carregar dashboard executivo:', err);
      error = 'Erro ao carregar dados do dashboard. Tente novamente.';
      notify.error('Erro', 'Não foi possível carregar o dashboard');
    } finally {
      loading = false;
    }
  }
  
  async function loadEstatisticasEntregas(): Promise<void> {
    loadingEntregas = true;
    errorEntregas = null;
    
    try {
      console.log('📊 Carregando estatísticas de entregas...');
      
      // ✅ CONECTADO AO BACKEND REAL: Estatísticas de entregas
      estatisticasEntregas = await reportingQueryAdapter.getEstatisticasEntregas(filtros);
      
      console.log('✅ Estatísticas de entregas carregadas:', estatisticasEntregas);
      
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas de entregas:', err);
      errorEntregas = 'Erro ao carregar estatísticas de entregas';
    } finally {
      loadingEntregas = false;
    }
  }
  
  async function loadVencimentosProximos(): Promise<void> {
    loadingVencimentos = true;
    errorVencimentos = null;
    
    try {
      console.log('⏰ Carregando vencimentos próximos...');
      
      // ✅ CONECTADO AO BACKEND REAL: Vencimentos próximos
      vencimentosProximos = await reportingQueryAdapter.getVencimentosProximos(filtros);
      
      console.log('✅ Vencimentos próximos carregados:', vencimentosProximos);
      
    } catch (err) {
      console.error('❌ Erro ao carregar vencimentos próximos:', err);
      errorVencimentos = 'Erro ao carregar vencimentos próximos';
    } finally {
      loadingVencimentos = false;
    }
  }

  // ==================== EVENT HANDLERS ====================
  
  function handlePeriodoChange(): void {
    console.log('🔄 Período alterado:', filtros.periodo);
    loadDashboardData();
  }
  
  function handleRefresh(): void {
    console.log('🔄 Atualizando dashboard...');
    loadDashboardData();
  }
  
  async function handleExportDashboard(): Promise<void> {
    try {
      console.log('📥 Exportando dashboard...');
      
      // TODO: Implementar exportação de dashboard
      await reportingQueryAdapter.exportarRelatorio('dashboard', 'pdf', filtros);
      
      notify.success('Exportação', 'Dashboard exportado com sucesso');
      
    } catch (err) {
      console.error('❌ Erro ao exportar dashboard:', err);
      notify.error('Erro', 'Não foi possível exportar o dashboard');
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  
  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'critico': return 'red';
      case 'alerta': return 'yellow';
      case 'normal': return 'green';
      default: return 'gray';
    }
  }
  
  function formatarNumero(numero: number): string {
    return numero.toLocaleString('pt-BR');
  }
  
  function formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  }
</script>

<!-- SEO -->
<svelte:head>
  <title>Dashboard Executivo - Relatórios EPI</title>
  <meta name="description" content="Visão executiva completa dos dados de EPIs, estatísticas e indicadores principais" />
</svelte:head>

<!-- Page Content -->
<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Executivo</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Visão geral dos indicadores principais do sistema EPI
      </p>
    </div>
    <div class="flex items-center space-x-3">
      <Button 
        size="sm" 
        color="alternative" 
        class="rounded-sm"
        on:click={handleRefresh}
        disabled={loading}
      >
        <RefreshOutline class="w-4 h-4 mr-2" />
        Atualizar
      </Button>
      <Button 
        size="sm" 
        color="primary" 
        class="rounded-sm"
        on:click={handleExportDashboard}
        disabled={loading}
      >
        <DownloadOutline class="w-4 h-4 mr-2" />
        Exportar
      </Button>
    </div>
  </div>

  <!-- Filtros -->
  <Card class="p-4 rounded-sm !max-w-none">
    <div class="flex flex-wrap gap-4 items-end">
      <div class="min-w-[200px]">
        <Label for="periodo" class="mb-2">Período</Label>
        <Select 
          id="periodo"
          bind:value={filtros.periodo}
          on:change={handlePeriodoChange}
          items={periodosDisponiveis}
          class="rounded-sm"
        />
      </div>
      
      <div class="min-w-[200px]">
        <Label for="almoxarifado" class="mb-2">Almoxarifado (Opcional)</Label>
        <Input 
          id="almoxarifado"
          bind:value={filtroAlmoxarifado}
          placeholder="Filtrar por almoxarifado..."
          class="rounded-sm"
        />
      </div>
      
      <div class="min-w-[200px]">
        <Label for="unidade" class="mb-2">Unidade de Negócio (Opcional)</Label>
        <Input 
          id="unidade"
          bind:value={filtroUnidadeNegocio}
          placeholder="Filtrar por unidade..."
          class="rounded-sm"
        />
      </div>
    </div>
  </Card>

  <!-- Indicadores Principais -->
  {#if loading}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {#each Array(8) as _, i}
        <Card class="rounded-sm !max-w-none">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-8 bg-gray-200 rounded"></div>
          </div>
        </Card>
      {/each}
    </div>
  {:else if error}
    <ErrorDisplay message={error} />
  {:else if dashboardData}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <!-- Total Colaboradores -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-blue-100 dark:bg-blue-900">
            <UsersGroupSolid class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Colaboradores</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarNumero(dashboardData.indicadoresGerais.totalColaboradores)}
            </p>
          </div>
        </div>
      </Card>

      <!-- Fichas Ativas -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-green-100 dark:bg-green-900">
            <CheckCircleOutline class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas Ativas</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarNumero(dashboardData.indicadoresGerais.fichasAtivas)}
            </p>
          </div>
        </div>
      </Card>

      <!-- Fichas Vencidas -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-red-100 dark:bg-red-900">
            <ExclamationCircleOutline class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas Vencidas</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarNumero(dashboardData.indicadoresGerais.fichasVencidas)}
            </p>
          </div>
        </div>
      </Card>

      <!-- Estoque Total -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-purple-100 dark:bg-purple-900">
            <ShoppingBagSolid class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Itens em Estoque</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarNumero(dashboardData.indicadoresGerais.estoqueTotal)}
            </p>
          </div>
        </div>
      </Card>

      <!-- Estoque Baixo -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-yellow-100 dark:bg-yellow-900">
            <ExclamationCircleOutline class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Estoque Baixo</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarNumero(dashboardData.indicadoresGerais.estoqueBaixo)}
            </p>
          </div>
        </div>
      </Card>

      <!-- Entregas do Mês -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex items-center">
          <div class="p-3 rounded-sm bg-indigo-100 dark:bg-indigo-900">
            <CalendarMonthSolid class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Entregas do Mês</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {formatarNumero(dashboardData.indicadoresGerais.entregasMes)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  {/if}

  <!-- Vencimentos Próximos -->
  {#if loadingVencimentos}
    <Card class="rounded-sm !max-w-none">
      <div class="animate-pulse">
        <div class="h-6 bg-gray-200 rounded mb-4"></div>
        <div class="space-y-3">
          {#each Array(3) as _}
            <div class="h-4 bg-gray-200 rounded"></div>
          {/each}
        </div>
      </div>
    </Card>
  {:else if errorVencimentos}
    <ErrorDisplay message={errorVencimentos} />
  {:else if vencimentosProximos}
    <Card class="rounded-sm !max-w-none">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Vencimentos Próximos
        </h3>
        <Badge 
          color="red" 
          class="w-fit rounded-sm"
        >
          {vencimentosProximos.resumo.criticos} críticos
        </Badge>
      </div>
      
      {#if vencimentosProximos.vencimentosProximos.length > 0}
        <div class="space-y-3">
          {#each vencimentosProximos.vencimentosProximos.slice(0, 5) as vencimento}
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-sm">
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{vencimento.colaborador}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{vencimento.equipamento}</p>
              </div>
              <div class="flex items-center space-x-3">
                <div class="text-right">
                  <p class="text-sm font-medium">{formatarData(vencimento.dataVencimento)}</p>
                  <p class="text-xs text-gray-500">{vencimento.diasRestantes} dias</p>
                </div>
                <Badge 
                  color={getStatusBadgeColor(vencimento.status)} 
                  class="w-fit rounded-sm"
                >
                  {vencimento.status}
                </Badge>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 dark:text-gray-400 text-center py-8">
          Nenhum vencimento próximo encontrado
        </p>
      {/if}
    </Card>
  {/if}

  <!-- Estatísticas de Entregas -->
  {#if loadingEntregas}
    <Card class="rounded-sm !max-w-none">
      <div class="animate-pulse">
        <div class="h-6 bg-gray-200 rounded mb-4"></div>
        <div class="h-32 bg-gray-200 rounded"></div>
      </div>
    </Card>
  {:else if errorEntregas}
    <ErrorDisplay message={errorEntregas} />
  {:else if estatisticasEntregas}
    <Card class="rounded-sm !max-w-none">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Estatísticas de Entregas
        </h3>
        <Badge 
          color="blue" 
          class="w-fit rounded-sm"
        >
          {formatarNumero(estatisticasEntregas.totalEntregas)} total
        </Badge>
      </div>
      
      <!-- TODO: Implementar gráficos com Chart.js ou biblioteca similar -->
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">Entregas por Categoria</h4>
          <div class="space-y-2">
            {#each estatisticasEntregas.entregasPorCategoria as categoria}
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">{categoria.categoria}</span>
                <span class="text-sm font-medium">{categoria.quantidade}</span>
              </div>
            {/each}
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">Tendência Diária</h4>
          <div class="space-y-2">
            {#each estatisticasEntregas.entregasPorDia.slice(-5) as dia}
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">{formatarData(dia.data)}</span>
                <span class="text-sm font-medium">{dia.quantidade}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </Card>
  {/if}
</div>
<!--
  Componente de Verificação de Consistência de Estoque
  
  Interface visual para detectar e corrigir inconsistências entre
  Read Model (estoque atual) e Event Log (kardex) causadas por seeds.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card, Badge, Alert, Spinner, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import { ExclamationTriangleOutline, CheckCircleOutline, ArrowPathOutline, CogOutline } from 'flowbite-svelte-icons';
  
  import { 
    stockConsistencyFixer, 
    runFullConsistencyCheck,
    type InconsistencyReport,
    type FixResult 
  } from '$lib/utils/stockConsistencyFixer';
  
  // Estado do componente
  let checking = false;
  let fixing = false;
  let inconsistencies: InconsistencyReport[] = [];
  let fixResults: FixResult[] = [];
  let lastCheckTime: Date | null = null;
  let error: string | null = null;
  
  // Estatísticas computadas
  $: stats = {
    total: inconsistencies.length,
    criticas: inconsistencies.filter(i => i.severidade === 'critica').length,
    altas: inconsistencies.filter(i => i.severidade === 'alta').length,
    medias: inconsistencies.filter(i => i.severidade === 'media').length,
    baixas: inconsistencies.filter(i => i.severidade === 'baixa').length,
    readModelMaior: inconsistencies.filter(i => i.tipo === 'read_model_maior').length,
    eventLogMaior: inconsistencies.filter(i => i.tipo === 'event_log_maior').length
  };
  
  $: fixStats = fixResults.length > 0 ? {
    total: fixResults.length,
    sucessos: fixResults.filter(f => f.success).length,
    falhas: fixResults.filter(f => !f.success).length
  } : null;
  
  /**
   * Executa verificação de inconsistências
   */
  async function runCheck(): Promise<void> {
    checking = true;
    error = null;
    inconsistencies = [];
    fixResults = [];
    
    try {
      console.log('🔍 Iniciando verificação de consistência...');
      
      const result = await runFullConsistencyCheck(false);
      inconsistencies = result.inconsistencies;
      lastCheckTime = new Date();
      
      console.log(`✅ Verificação completa: ${inconsistencies.length} inconsistências`);
      
    } catch (err) {
      console.error('❌ Erro na verificação:', err);
      error = err instanceof Error ? err.message : 'Erro desconhecido na verificação';
    } finally {
      checking = false;
    }
  }
  
  /**
   * Aplica correções automáticas
   */
  async function runFix(): Promise<void> {
    if (inconsistencies.length === 0) return;
    
    fixing = true;
    error = null;
    
    try {
      console.log('🔧 Iniciando correções automáticas...');
      
      // Filtrar apenas inconsistências não-críticas para correção automática
      const nonCritical = inconsistencies.filter(i => i.severidade !== 'critica');
      
      if (nonCritical.length === 0) {
        throw new Error('Apenas inconsistências críticas detectadas. Correção manual necessária.');
      }
      
      fixResults = await stockConsistencyFixer.fixAllInconsistencies(nonCritical, {
        confirmarCriticas: true,
        maxCorrecoesSimultaneas: 3,
        delayEntreCorrecoes: 1500
      });
      
      console.log(`✅ Correções aplicadas: ${fixResults.filter(f => f.success).length}/${fixResults.length}`);
      
      // Executar nova verificação para confirmar correções
      await runCheck();
      
    } catch (err) {
      console.error('❌ Erro nas correções:', err);
      error = err instanceof Error ? err.message : 'Erro desconhecido nas correções';
    } finally {
      fixing = false;
    }
  }
  
  /**
   * Corrige inconsistência específica
   */
  async function fixSpecific(inconsistency: InconsistencyReport): Promise<void> {
    try {
      console.log(`🔧 Corrigindo item específico: ${inconsistency.item.tipoEPI?.nomeEquipamento}`);
      
      const result = await stockConsistencyFixer.fixInconsistency(inconsistency);
      
      if (result.success) {
        // Remover da lista de inconsistências
        inconsistencies = inconsistencies.filter(i => i.item.id !== inconsistency.item.id);
        
        // Adicionar aos resultados de correção
        fixResults = [...fixResults, result];
        
        console.log(`✅ Item corrigido: ${result.nomeEquipamento}`);
      } else {
        throw new Error(result.error || 'Falha na correção');
      }
      
    } catch (err) {
      console.error('❌ Erro na correção específica:', err);
      error = err instanceof Error ? err.message : 'Erro na correção específica';
    }
  }
  
  /**
   * Obtém cor do badge baseada na severidade
   */
  function getSeverityColor(severidade: string): "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none" {
    switch (severidade) {
      case 'critica': return 'red';
      case 'alta': return 'yellow'; // orange -> yellow
      case 'media': return 'yellow';
      case 'baixa': return 'blue';
      default: return 'dark'; // gray -> dark
    }
  }
  
  /**
   * Obtém cor do badge baseada no tipo
   */
  function getTypeColor(tipo: string): "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none" {
    return tipo === 'read_model_maior' ? 'purple' : 'indigo';
  }
  
  // Auto-executar verificação ao montar componente
  onMount(() => {
    runCheck();
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        Verificador de Consistência de Estoque
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Detecta inconsistências entre estoque atual e histórico de movimentações (kardex)
      </p>
    </div>
    
    <div class="flex gap-2">
      <Button 
        color="light" 
        size="sm"
        disabled={checking || fixing}
        on:click={runCheck}
        class="rounded-sm"
      >
        {#if checking}
          <Spinner class="w-4 h-4 mr-2" />
        {:else}
          <ArrowPathOutline class="w-4 h-4 mr-2" />
        {/if}
        Verificar
      </Button>
      
      {#if inconsistencies.length > 0}
        <Button 
          color="primary" 
          size="sm"
          disabled={checking || fixing || stats.criticas === stats.total}
          on:click={runFix}
          class="rounded-sm"
        >
          {#if fixing}
            <Spinner class="w-4 h-4 mr-2" />
          {:else}
            <CheckCircleOutline class="w-4 h-4 mr-2" />
          {/if}
          Corrigir Automaticamente
        </Button>
      {/if}
    </div>
  </div>
  
  <!-- Error Alert -->
  {#if error}
    <Alert color="red" dismissable on:close={() => error = null}>
      <ExclamationTriangleOutline slot="icon" class="w-4 h-4" />
      <span class="font-medium">Erro:</span> {error}
    </Alert>
  {/if}
  
  <!-- Status Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Total -->
    <Card class="rounded-sm">
      <div class="flex items-center space-x-2">
        <CogOutline class="w-5 h-5 text-gray-500" />
        <div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Inconsistências
          </div>
        </div>
      </div>
    </Card>
    
    <!-- Por Severidade -->
    <Card class="rounded-sm">
      <div class="space-y-2">
        <div class="text-sm font-medium text-gray-900 dark:text-white">Por Severidade</div>
        <div class="flex flex-wrap gap-1">
          {#if stats.criticas > 0}
            <Badge color="red" class="rounded-sm">Críticas: {stats.criticas}</Badge>
          {/if}
          {#if stats.altas > 0}
            <Badge color="yellow" class="rounded-sm">Altas: {stats.altas}</Badge>
          {/if}
          {#if stats.medias > 0}
            <Badge color="yellow" class="rounded-sm">Médias: {stats.medias}</Badge>
          {/if}
          {#if stats.baixas > 0}
            <Badge color="blue" class="rounded-sm">Baixas: {stats.baixas}</Badge>
          {/if}
          {#if stats.total === 0}
            <Badge color="green" class="rounded-sm">Sistema Íntegro</Badge>
          {/if}
        </div>
      </div>
    </Card>
    
    <!-- Por Tipo -->
    <Card class="rounded-sm">
      <div class="space-y-2">
        <div class="text-sm font-medium text-gray-900 dark:text-white">Por Tipo</div>
        <div class="flex flex-wrap gap-1">
          {#if stats.readModelMaior > 0}
            <Badge color="purple" class="rounded-sm">Read Model +: {stats.readModelMaior}</Badge>
          {/if}
          {#if stats.eventLogMaior > 0}
            <Badge color="indigo" class="rounded-sm">Event Log +: {stats.eventLogMaior}</Badge>
          {/if}
        </div>
      </div>
    </Card>
    
    <!-- Fix Results -->
    <Card class="rounded-sm">
      <div class="space-y-2">
        <div class="text-sm font-medium text-gray-900 dark:text-white">Correções</div>
        {#if fixStats}
          <div class="flex flex-wrap gap-1">
            <Badge color="green" class="rounded-sm">Sucessos: {fixStats.sucessos}</Badge>
            {#if fixStats.falhas > 0}
              <Badge color="red" class="rounded-sm">Falhas: {fixStats.falhas}</Badge>
            {/if}
          </div>
        {:else}
          <div class="text-sm text-gray-500">Nenhuma correção aplicada</div>
        {/if}
      </div>
    </Card>
  </div>
  
  <!-- Last Check Info -->
  {#if lastCheckTime}
    <div class="text-sm text-gray-600 dark:text-gray-400">
      Última verificação: {lastCheckTime.toLocaleString('pt-BR')}
    </div>
  {/if}
  
  <!-- Inconsistências Detectadas -->
  {#if inconsistencies.length > 0}
    <Card class="rounded-sm">
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Inconsistências Detectadas
          </h3>
          {#if stats.criticas > 0}
            <Alert color="red" class="py-2 px-3">
              <ExclamationTriangleOutline class="w-4 h-4 mr-2" />
              {stats.criticas} inconsistências críticas requerem atenção manual
            </Alert>
          {/if}
        </div>
        
        <Table divClass="relative overflow-x-auto">
          <TableHead>
            <TableHeadCell>EPI</TableHeadCell>
            <TableHeadCell>CA</TableHeadCell>
            <TableHeadCell>Estoque Atual</TableHeadCell>
            <TableHeadCell>Saldo Kardex</TableHeadCell>
            <TableHeadCell>Diferença</TableHeadCell>
            <TableHeadCell>Severidade</TableHeadCell>
            <TableHeadCell>Tipo</TableHeadCell>
            <TableHeadCell>Ações</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each inconsistencies as inconsistency (inconsistency.item.id)}
              <TableBodyRow>
                <TableBodyCell>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {inconsistency.item.tipoEPI?.nomeEquipamento || 'N/A'}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  {inconsistency.item.tipoEPI?.numeroCA || 'N/A'}
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm">
                    {inconsistency.estoqueAtual}
                  </span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm">
                    {inconsistency.saldoKardex}
                  </span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm" class:text-red-600={inconsistency.diferenca < 0} class:text-green-600={inconsistency.diferenca > 0}>
                    {inconsistency.diferenca > 0 ? '+' : ''}{inconsistency.diferenca}
                  </span>
                </TableBodyCell>
                <TableBodyCell>
                  <Badge color={getSeverityColor(inconsistency.severidade)} class="rounded-sm capitalize">
                    {inconsistency.severidade}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell>
                  <Badge color={getTypeColor(inconsistency.tipo)} class="rounded-sm">
                    {inconsistency.tipo === 'read_model_maior' ? 'Read Model +' : 'Event Log +'}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell>
                  {#if inconsistency.severidade !== 'critica'}
                    <Button 
                      size="xs" 
                      color="primary"
                      on:click={() => fixSpecific(inconsistency)}
                      class="rounded-sm"
                    >
                      Corrigir
                    </Button>
                  {:else}
                    <span class="text-xs text-gray-500">Manual</span>
                  {/if}
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    </Card>
  {:else if !checking}
    <Card class="rounded-sm">
      <div class="text-center py-8">
        <CheckCircleOutline class="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sistema Íntegro
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Nenhuma inconsistência detectada entre estoque atual e kardex.
        </p>
      </div>
    </Card>
  {/if}
  
  <!-- Fix Results -->
  {#if fixResults.length > 0}
    <Card class="rounded-sm">
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Resultados das Correções
        </h3>
        
        <Table divClass="relative overflow-x-auto">
          <TableHead>
            <TableHeadCell>EPI</TableHeadCell>
            <TableHeadCell>Valor Anterior</TableHeadCell>
            <TableHeadCell>Valor Corrigido</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>ID Ajuste</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each fixResults as result (result.itemId)}
              <TableBodyRow>
                <TableBodyCell>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {result.nomeEquipamento}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm">
                    {result.valorAnterior}
                  </span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm">
                    {result.valorCorrigido}
                  </span>
                </TableBodyCell>
                <TableBodyCell>
                  {#if result.success}
                    <Badge color="green" class="rounded-sm">Sucesso</Badge>
                  {:else}
                    <Badge color="red" class="rounded-sm">Falha</Badge>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  {#if result.success && result.ajusteId}
                    <span class="font-mono text-xs text-gray-600">
                      {result.ajusteId.slice(0, 8)}...
                    </span>
                  {:else if result.error}
                    <span class="text-xs text-red-600" title={result.error}>
                      Ver erro
                    </span>
                  {:else}
                    <span class="text-xs text-gray-400">N/A</span>
                  {/if}
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    </Card>
  {/if}
  
  <!-- Loading State -->
  {#if checking}
    <Card class="rounded-sm">
      <div class="text-center py-8">
        <Spinner class="w-8 h-8 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Verificando Consistência...
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Comparando estoque atual com histórico de movimentações (kardex)
        </p>
      </div>
    </Card>
  {/if}
</div>
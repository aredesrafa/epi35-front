<!--
  Página de Estoque - Tabbed Interface with Counters
  Similar ao padrão da página de notas com abas e contadores
  ✅ IMPLEMENTADO: Sistema de abas com contadores dinâmicos
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { Badge, Button } from 'flowbite-svelte';
  import { PlusOutline, RefreshOutline } from 'flowbite-svelte-icons';
  import { estoqueItensAdapter } from '$lib/services/entity/estoqueItensAdapter';
  
  // Variáveis reativas para controle de estado
  let error: string | null = null;
  let InventoryContainer: any;
  let activeTab = 0;
  let tabCounts = {
    disponivel: 0,
    quarentena: 0,
    aguardando_inspecao: 0
  };
  let loadingCounts = false;
  let inventoryContainerRef: any;
  
  // Configuração das abas com contadores
  const tabs = [
    { label: 'Disponível', key: 'disponivel', statusFilter: 'DISPONIVEL' },
    { label: 'Quarentena', key: 'quarentena', statusFilter: 'QUARENTENA' },
    { label: 'Aguardando Inspeção', key: 'aguardando_inspecao', statusFilter: 'AGUARDANDO_INSPECAO' }
  ];
  
  // Carregar componente de forma SSR-safe
  onMount(async () => {
    if (!browser) return;
    
    console.log('🚀 Inicializando página de estoque com abas e contadores');
    
    try {
      // Importação dinâmica para evitar problemas de SSR
      const inventoryComponent = await import('$lib/components/containers/InventoryContainer.svelte');
      InventoryContainer = inventoryComponent.default;
      
      // Carregar contadores das abas
      await loadTabCounts();
      
      console.log('✅ InventoryContainer carregado com sucesso');
    } catch (err) {
      console.error('❌ Erro ao carregar InventoryContainer:', err);
      error = err instanceof Error ? err.message : 'Erro desconhecido';
    }
  });
  
  /**
   * Carrega contadores para cada aba
   */
  async function loadTabCounts(): Promise<void> {
    loadingCounts = true;
    console.log('📊 Carregando contadores das abas...');
    
    try {
      // Fazer requisições paralelas para cada status
      const [disponivelResult, quarentenaResult, aguardandoInspecaoResult] = await Promise.allSettled([
        estoqueItensAdapter.listarItensEstoque({ status: 'DISPONIVEL', limit: 1 }),
        estoqueItensAdapter.listarItensEstoque({ status: 'QUARENTENA', limit: 1 }),
        estoqueItensAdapter.listarItensEstoque({ status: 'AGUARDANDO_INSPECAO', limit: 1 })
      ]);
      
      // Extrair totais das respostas
      tabCounts.disponivel = disponivelResult.status === 'fulfilled' ? disponivelResult.value.total : 0;
      tabCounts.quarentena = quarentenaResult.status === 'fulfilled' ? quarentenaResult.value.total : 0;
      tabCounts.aguardando_inspecao = aguardandoInspecaoResult.status === 'fulfilled' ? aguardandoInspecaoResult.value.total : 0;
      
      console.log('✅ Contadores carregados:', tabCounts);
    } catch (error: any) {
      console.error('❌ Erro ao carregar contadores:', error);
      // Manter contadores em 0 em caso de erro
    } finally {
      loadingCounts = false;
    }
  }
  
  /**
   * Handler para mudança de aba
   */
  function handleTabChange(newTab: number): void {
    activeTab = newTab;
    console.log('🔄 Mudança de aba:', tabs[newTab].label);
  }
  
  /**
   * Handler para nova movimentação - delega para o container
   */
  function handleNewMovement(): void {
    if (inventoryContainerRef?.handleNewMovement) {
      inventoryContainerRef.handleNewMovement();
    }
  }

  /**
   * Handler para dados alterados - atualiza contadores
   */
  function handleDataChanged(): void {
    loadTabCounts();
  }
</script>

<svelte:head>
  <title>Estoque - DataLife EPI</title>
</svelte:head>

{#if error}
  <div class="p-6">
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 class="text-red-800 font-medium">Erro ao carregar página de estoque</h3>
      <p class="text-red-600 mt-2">{error}</p>
    </div>
  </div>
{:else if !InventoryContainer}
  <div class="p-6">
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 class="text-gray-800 font-medium">Carregando configuração de estoque...</h3>
      <div class="mt-2 flex items-center">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
        <span class="text-gray-600">Aguarde...</span>
      </div>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Estoque</h1>
      </div>
      <div class="flex items-center space-x-3">
        <Button 
          size="sm" 
          color="primary" 
          class="rounded-sm shadow-sm transition-all hover:shadow-md" 
          on:click={handleNewMovement}
        >
          <PlusOutline class="w-4 h-4 mr-2" />
          Nova Movimentação
        </Button>
      </div>
    </div>

    <!-- Tabs com Contadores -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex space-x-4 px-6" aria-label="Tabs">
        {#each tabs as tab, index}
          <button
            class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200 -mb-px {activeTab === index ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
            on:click={() => handleTabChange(index)}
          >
            <span class="flex items-center space-x-2">
              <span>{tab.label}</span>
              {#if !loadingCounts}
                <Badge color="dark" class="rounded-sm text-xs">
                  {tabCounts[tab.key]}
                </Badge>
              {:else}
                <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
              {/if}
            </span>
          </button>
        {/each}
      </nav>
    </div>

    <!-- Conteúdo da Aba Ativa -->
    {#if InventoryContainer}
      <svelte:component 
        this={InventoryContainer}
        bind:this={inventoryContainerRef}
        key={tabs[activeTab].key}
        statusFilter={tabs[activeTab].statusFilter}
        initialPageSize={20}
        autoRefresh={false}
        on:dataChanged={handleDataChanged}
      />
    {:else}
      <div class="p-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-blue-700">Carregando container de inventário...</p>
        </div>
      </div>
    {/if}
  </div>
{/if}
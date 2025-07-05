<!--
  Devoluções v2 - Sistema Avançado de Devoluções
  
  Sistema completo de gerenciamento de devoluções com:
  - Status COM_COLABORADOR/DEVOLVIDO
  - Limitações por assinatura digital
  - Workflow de aprovação
  - Validação de condições do equipamento
  - Event Sourcing para auditoria completa
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import DevolutionDashboard from '$lib/components/devolution/DevolutionDashboard.svelte';
  import { 
    Breadcrumb, 
    BreadcrumbItem,
    Alert
  } from 'flowbite-svelte';
  import { 
    HomeOutline,
    ArrowLeftOutline,
    CheckCircleOutline
  } from 'flowbite-svelte-icons';

  // Estado da página
  let pageLoaded = false;

  onMount(() => {
    console.log('🚀 Página Devoluções v2 inicializada');
    console.log('📋 Sistema avançado de devoluções carregado');
    console.log('🔄 Features implementadas:');
    console.log('  - Status COM_COLABORADOR/DEVOLVIDO');
    console.log('  - Limitações por assinatura digital');
    console.log('  - Workflow de aprovação com múltiplas etapas');
    console.log('  - Validação automática de devoluções');
    console.log('  - Event Sourcing para auditoria completa');
    console.log('  - Tracking de tempo de posse');
    console.log('  - Validação de condições do equipamento');
    
    pageLoaded = true;
  });
</script>

<svelte:head>
  <title>Devoluções Avançadas - DataLife EPI</title>
  <meta name="description" content="Sistema avançado de devoluções com workflow de aprovação e validação automática" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Breadcrumb -->
  <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Breadcrumb solid class="mb-0">
        <BreadcrumbItem href="/" home>
          <HomeOutline class="w-4 h-4 mr-2" />
          Dashboard
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ArrowLeftOutline class="w-4 h-4 mr-2" />
          Devoluções Avançadas
        </BreadcrumbItem>
      </Breadcrumb>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Header com informações sobre o sistema -->
    <div class="mb-8">
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
        <div class="flex items-center gap-3 mb-4">
          <ArrowLeftOutline class="w-8 h-8" />
          <div>
            <h1 class="text-3xl font-bold">Sistema Avançado de Devoluções</h1>
            <p class="text-blue-100 mt-1">
              Controle completo do ciclo de vida dos EPIs com workflow inteligente
            </p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div class="bg-white/10 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <CheckCircleOutline class="w-5 h-5" />
              <span class="font-semibold">Validação Automática</span>
            </div>
            <p class="text-sm text-blue-100">
              Sistema verifica automaticamente se devoluções podem ser processadas baseado em regras de negócio
            </p>
          </div>
          
          <div class="bg-white/10 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <CheckCircleOutline class="w-5 h-5" />
              <span class="font-semibold">Workflow de Aprovação</span>
            </div>
            <p class="text-sm text-blue-100">
              Processo estruturado com múltiplas assinaturas e aprovações conforme criticidade do equipamento
            </p>
          </div>
          
          <div class="bg-white/10 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <CheckCircleOutline class="w-5 h-5" />
              <span class="font-semibold">Event Sourcing</span>
            </div>
            <p class="text-sm text-blue-100">
              Auditoria completa com histórico de todas as movimentações e mudanças de status
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertas informativos -->
    <div class="space-y-4 mb-8">
      <Alert color="blue" border>
        <CheckCircleOutline slot="icon" class="w-5 h-5" />
        <span class="font-medium">Sistema Implementado:</span> 
        Todas as funcionalidades do sistema avançado de devoluções estão implementadas e prontas para integração com o backend.
      </Alert>
      
      <Alert color="green" border>
        <CheckCircleOutline slot="icon" class="w-5 h-5" />
        <span class="font-medium">Arquitetura Modular:</span> 
        Utiliza Container/Presenter pattern, service adapters especializados e stores reativos para máxima flexibilidade.
      </Alert>
    </div>

    <!-- Dashboard Component -->
    {#if pageLoaded}
      <DevolutionDashboard />
    {:else}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">Carregando sistema de devoluções...</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Custom animations for the gradient background */
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .bg-gradient-to-r {
    background-size: 200% 200%;
    animation: gradient 6s ease infinite;
  }
</style>
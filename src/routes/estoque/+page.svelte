<!--
  Página de Estoque - Arquitetura Container/Presenter
  Implementação completa com service adapters especializados
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import InventoryContainer from '$lib/components/containers/InventoryContainer.svelte';
  import { businessConfigStore } from '$lib/stores/businessConfigStore';
  
  let error: string | null = null;
  
  // Garantir que as configurações de negócio estejam carregadas
  onMount(async () => {
    console.log('🚀 Inicializando página de estoque com arquitetura Container/Presenter');
    
    try {
      // Inicializar configurações se ainda não estiverem carregadas
      await businessConfigStore.initialize();
      
      console.log('✅ Página de estoque pronta com arquitetura modular completa');
    } catch (err) {
      console.error('❌ Erro ao inicializar página de estoque:', err);
      error = err instanceof Error ? err.message : 'Erro desconhecido';
    }
  });
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
{:else}
  <!-- Usando o Container completo com service adapters -->
  <InventoryContainer 
    initialPageSize={20}
    autoRefresh={false}
  />
{/if}
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/themeStore';
  import { configurationStore, initializeConfiguration } from '$lib/stores/configurationStore';
  import MainLayout from '$lib/components/layout/MainLayout.svelte';
  import NotificationToast from '$lib/components/common/NotificationToast.svelte';
  import '$lib/i18n'; // Import i18n configuration
  import { isLoading } from 'svelte-i18n';
  import type { PageData } from './$types';

  export let data: PageData;

  // Aplicar o tema ao HTML
  $: if (typeof document !== 'undefined') {
    if ($themeStore === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  onMount(async () => {
    // Inicializar o tema
    themeStore.initialize();
    
    // Primeiro aplicar configurações padrão do SSR
    if (data.configuration) {
      configurationStore.set(data.configuration);
    }
    
    // Wake up backend first (cold start handling)
    try {
      console.log('🚀 Inicializando aplicação...');
      
      // ⚠️ Health check desabilitado temporariamente para evitar warnings desnecessários
      // const { healthCheck } = await import('$lib/services/core/apiClient');
      // const health = await healthCheck();
      // console.log('🏥 Health check:', health.message);
      
      // Load configurations
      const realConfiguration = await initializeConfiguration();
      console.log('✅ Configurações carregadas:', realConfiguration);
    } catch (error: any) {
      console.warn('⚠️ Erro ao carregar configurações do backend, usando padrão:', error);
    }
  });
</script>

{#if $isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
{:else}
  <MainLayout>
    <slot />
  </MainLayout>
{/if}

<!-- Global Components -->
<NotificationToast />
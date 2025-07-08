<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/themeStore';
  import { configurationStore, initializeConfiguration } from '$lib/stores/configurationStore';
  import MainLayout from '$lib/components/layout/MainLayout.svelte';
  import NotificationToast from '$lib/components/common/NotificationToast.svelte';
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
      console.log('🚀 Inicializando aplicação - verificando backend...');
      
      // Import healthCheck here to avoid SSR issues
      const { healthCheck } = await import('$lib/services/core/apiClient');
      const health = await healthCheck();
      console.log('🏥 Health check:', health.message);
      
      // Now load configurations
      const realConfiguration = await initializeConfiguration();
      console.log('✅ Configurações carregadas:', realConfiguration);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar configurações do backend, usando padrão:', error);
    }
  });
</script>

<MainLayout>
  <slot />
</MainLayout>

<!-- Global Components -->
<NotificationToast />
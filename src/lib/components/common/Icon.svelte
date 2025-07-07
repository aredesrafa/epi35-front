<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  export let name: string;
  export let className: string = '';
  export let size: string = 'w-4 h-4';

  let IconComponent: any = null;
  let loading = true;
  let error = false;

  // Mapeamento de ícones disponíveis
  const iconMap: Record<string, string> = {
    'XMarkOutline': 'CloseOutline', // Fix: XMarkOutline doesn't exist, use CloseOutline
    'CloseOutline': 'CloseOutline',
    'UserOutline': 'UserOutline', 
    'CalendarMonthOutline': 'CalendarMonthOutline',
    'ClipboardListOutline': 'ClipboardListOutline',
    'TruckOutline': 'TruckOutline',
    'ExclamationTriangleOutline': 'ExclamationCircleOutline', // Fallback
    'CheckCircleOutline': 'CheckCircleOutline',
    'CheckOutline': 'CheckOutline', // Para botões de confirmação
    'ClockOutline': 'ClockOutline',
    'PlusOutline': 'PlusOutline',
    'SearchOutline': 'SearchOutline',
    'PenOutline': 'PenOutline',
    'EyeOutline': 'EyeOutline',
    'FileDocOutline': 'FileDocumentOutline'
  };

  onMount(async () => {
    if (!browser) return;
    
    try {
      const iconName = iconMap[name] || name;
      const iconModule = await import('flowbite-svelte-icons');
      
      if (iconModule[iconName]) {
        IconComponent = iconModule[iconName];
      } else {
        console.warn(`Ícone não encontrado: ${iconName}`);
        error = true;
      }
    } catch (err) {
      console.error('Erro ao carregar ícone:', err);
      error = true;
    } finally {
      loading = false;
    }
  });

  // Fallback para SSR - renderiza um placeholder
  $: finalClass = `${size} ${className}`;
</script>

<!-- Durante SSR ou loading, mostra placeholder -->
{#if !browser || loading}
  <div class={`${finalClass} bg-gray-200 dark:bg-gray-600 rounded animate-pulse`}></div>
<!-- Se houver erro, mostra ícone genérico -->
{:else if error}
  <div class={`${finalClass} border border-gray-300 dark:border-gray-600 rounded flex items-center justify-center`}>
    <span class="text-xs text-gray-400">?</span>
  </div>
<!-- Renderiza o ícone carregado -->
{:else if IconComponent}
  <svelte:component this={IconComponent} class={finalClass} />
{/if}
<!--
  ErrorDisplay - Componente reutilizável para exibição de erros
-->

<script lang="ts">
  import { Card, Button } from 'flowbite-svelte';
  import { CloseOutline, RefreshOutline } from 'flowbite-svelte-icons';

  export let error: string | null = null;
  export let onRetry: (() => void) | undefined = undefined;
  export let title: string = 'Erro ao carregar dados';
</script>

<Card size="sm" class="rounded-sm">
  <div class="text-center py-8">
    <div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
      <CloseOutline class="w-8 h-8 text-red-600 dark:text-red-400" />
    </div>
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
    {#if error}
      <p class="text-red-600 dark:text-red-400 mb-4">{error}</p>
    {/if}
    {#if onRetry}
      <Button size="sm" color="red" class="rounded-sm" on:click={onRetry}>
        <RefreshOutline class="w-4 h-4 mr-2" />
        Tentar novamente
      </Button>
    {/if}
  </div>
</Card>

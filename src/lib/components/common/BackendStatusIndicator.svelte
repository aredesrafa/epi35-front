<!--
  Backend Status Indicator - Mostra quando estamos usando dados de fallback
-->

<script lang="ts">
  import { Alert } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  
  export let visible = false;
  export let message = 'Backend indisponível - usando dados de demonstração';
</script>

{#if visible}
  <Alert color="yellow" class="mb-4">
    <ExclamationCircleOutline slot="icon" class="w-4 h-4" />
    <span class="font-medium">Modo Offline:</span> {message}
    <span class="block text-sm mt-1">
      O sistema está funcionando com dados de demonstração. As operações serão limitadas até que a conexão seja restabelecida.
    </span>
  </Alert>
{/if}
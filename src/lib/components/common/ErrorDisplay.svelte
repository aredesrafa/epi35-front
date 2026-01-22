<script lang="ts">
  import { Alert, Button } from 'flowbite-svelte';
  import { ExclamationCircleOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
  
  export let error: string | Error | null = null;
  export let title: string = 'Ops! Algo deu errado';
  export let showRetry: boolean = true;
  export let retryText: string = 'Tentar Novamente';
  export let onRetry: (() => void) | null = null;
  export let fullHeight: boolean = false;
  
  $: errorMessage = error instanceof Error ? error.message : error || 'Erro desconhecido';
  
  function handleRetry() {
    if (onRetry) {
      onRetry();
    }
  }
</script>

<div class="flex items-center justify-center {fullHeight ? 'min-h-96' : 'p-8'}">
  <div class="w-full max-w-md">
    <Alert color="red" class="border-l-4 border-red-500">
      <ExclamationCircleOutline slot="icon" class="w-4 h-4" />
      
      <span class="font-medium">{title}</span>
      
      <div class="mt-2 mb-4 text-sm">
        <p>{errorMessage}</p>
      </div>
      
      {#if showRetry && onRetry}
        <div class="flex">
          <Button 
            size="sm" 
            color="red" 
            class="rounded-sm"
            on:click={handleRetry}
          >
            <ArrowRightOutline class="w-4 h-4 mr-2" />
            {retryText}
          </Button>
        </div>
      {/if}
    </Alert>
  </div>
</div>
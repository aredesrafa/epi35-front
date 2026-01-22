<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { GridOutline } from 'flowbite-svelte-icons';
  
  export let moduleName: string = 'Gestão de EPI';
  export let showAppsButton: boolean = true;
  
  function handleAppsClick() {
    // Implementar navegação entre módulos futuramente
    console.log('Apps clicked - implementar navegação entre módulos');
  }
</script>

<!-- Module Header - Alinhado ao conteúdo da página -->
<div class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
  <div class="flex items-center gap-4">
    <!-- Apps Button -->
    {#if showAppsButton}
      <Button 
        color="alternative" 
        size="sm" 
        class="rounded-sm p-2"
        on:click={handleAppsClick}
      >
        <GridOutline class="w-5 h-5" />
      </Button>
    {/if}
    
    <!-- Module Name -->
    <h1 class="text-lg font-medium text-gray-900 dark:text-white">
      {moduleName}
    </h1>
  </div>
</div>
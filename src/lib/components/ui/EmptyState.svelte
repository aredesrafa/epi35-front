<script lang="ts">
  import { ArchiveOutline } from 'flowbite-svelte-icons';
  
  export let title = 'Nenhum item encontrado';
  export let description = 'Não encontramos registros com os filtros atuais.';
  export let showIcon = true;
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700">
  {#if showIcon}
    <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 text-gray-400 dark:text-gray-500">
      <slot name="icon">
        <ArchiveOutline class="w-8 h-8" />
      </slot>
    </div>
  {/if}
  
  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
    {title}
  </h3>
  
  <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
    {description}
  </p>
  
  <div class="flex gap-3">
    <slot name="action"></slot>
  </div>
</div>

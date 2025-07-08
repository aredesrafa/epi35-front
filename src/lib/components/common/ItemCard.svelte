<script lang="ts">
  export let className: string = '';
  export let hoverable: boolean = false;
  export let clickable: boolean = false;
  
  $: cardClasses = [
    'border border-gray-200 dark:border-gray-700 rounded-sm p-4',
    hoverable ? 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' : '',
    clickable ? 'cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ');
</script>

<div class={cardClasses} on:click>
  <div class="flex justify-between items-start">
    <div class="flex-1 min-w-0">
      <slot name="content" />
    </div>
    
    {#if $$slots.actions}
      <div class="flex-shrink-0 ml-4">
        <slot name="actions" />
      </div>
    {/if}
  </div>
  
  <!-- Slot opcional para conteúdo adicional embaixo -->
  <slot name="footer" />
</div>
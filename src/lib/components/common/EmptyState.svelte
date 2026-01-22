<script lang="ts">
  import Icon from '$lib/components/common/Icon.svelte';
  
  export let icon: string;
  export let message: string;
  export let description: string = '';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  $: iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };
  
  $: paddingSizes = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12'
  };
</script>

<div class="text-center {paddingSizes[size]} text-gray-500 dark:text-gray-400">
  <Icon name={icon} className="{iconSizes[size]} mx-auto mb-2 text-gray-400 dark:text-gray-500" />
  <p class="font-medium text-sm">{message}</p>
  {#if description}
    <p class="text-xs mt-1 text-gray-400 dark:text-gray-500">{description}</p>
  {/if}
  
  <!-- Slot para ações opcionais -->
  <slot name="actions" />
</div>
<script lang="ts">
  import { Spinner } from 'flowbite-svelte';
  import { LOADING_TEXTS, type LoadingText } from '$lib/constants/content';
  
  export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let color: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'purple' | 'pink' | 'primary' | 'white' | 'custom' = 'primary';
  export let text: string = LOADING_TEXTS.default;
  export let loadingType: LoadingText | undefined = undefined;
  export let fullScreen: boolean = false;
  export let inline: boolean = false;
  
  // Se loadingType for fornecido, usar o texto correspondente
  $: displayText = loadingType ? LOADING_TEXTS[loadingType] : text;
</script>

{#if fullScreen}
  <div class="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50">
    <div class="text-center">
      <Spinner {size} {color} class="mb-4" />
      <p class="text-gray-600 dark:text-gray-400">{displayText}</p>
    </div>
  </div>
{:else if inline}
  <div class="flex items-center space-x-2">
    <Spinner {size} {color} />
    <span class="text-sm text-gray-600 dark:text-gray-400">{displayText}</span>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center py-12 px-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-sm">
      <div class="flex flex-col items-center text-center">
        <Spinner {size} {color} class="mb-3" />
        <p class="text-sm text-gray-600 dark:text-gray-400">{displayText}</p>
      </div>
    </div>
  </div>
{/if}
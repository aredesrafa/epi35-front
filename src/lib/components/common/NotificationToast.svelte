<script lang="ts">
  import { fly } from 'svelte/transition';
  import { Button } from 'flowbite-svelte';
  // Icons temporarily simplified for compilation
  import { notifications } from '$lib/stores';
  
  // Icons mapping
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  // Colors mapping
  const colorMap = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900',
      border: 'border-green-200 dark:border-green-700',
      icon: 'text-green-400 dark:text-green-300',
      title: 'text-green-800 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900',
      border: 'border-red-200 dark:border-red-700',
      icon: 'text-red-400 dark:text-red-300',
      title: 'text-red-800 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900',
      border: 'border-yellow-200 dark:border-yellow-700',
      icon: 'text-yellow-400 dark:text-yellow-300',
      title: 'text-yellow-800 dark:text-yellow-200',
      message: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900',
      border: 'border-blue-200 dark:border-blue-700',
      icon: 'text-blue-400 dark:text-blue-300',
      title: 'text-blue-800 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300'
    }
  };
  
  function handleClose(id: string) {
    notifications.remove(id);
  }
</script>

<!-- Toast Container -->
<div class="fixed top-4 right-4 z-50 space-y-4 max-w-sm w-full">
  {#each $notifications as notification (notification.id)}
    <div
      class="flex p-4 border rounded-lg shadow-lg {colorMap[notification.type].bg} {colorMap[notification.type].border}"
      transition:fly={{ x: 300, duration: 300 }}
      role="alert"
    >
      <!-- Icon -->
      <div class="flex-shrink-0">
        <span class="text-lg">{iconMap[notification.type]}</span>
      </div>
      
      <!-- Content -->
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium {colorMap[notification.type].title}">
          {notification.title}
        </h3>
        
        {#if notification.message}
          <p class="mt-1 text-sm {colorMap[notification.type].message}">
            {notification.message}
          </p>
        {/if}
      </div>
      
      <!-- Close Button -->
      <div class="ml-4 flex-shrink-0">
        <Button
          size="xs"
          color="alternative"
          class="p-1 rounded-sm !text-gray-500 hover:!text-gray-700 dark:!text-gray-400 dark:hover:!text-gray-200"
          on:click={() => handleClose(notification.id)}
        >
          ✕
        </Button>
      </div>
    </div>
  {/each}
</div>
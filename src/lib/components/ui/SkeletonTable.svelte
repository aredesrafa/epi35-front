<script lang="ts">
  export let rows = 5;
  export let columns = 4;
</script>

<div class="animate-pulse space-y-4 w-full">
  <!-- Header -->
  <div class="flex space-x-4 border-b border-gray-200 dark:border-gray-700 pb-2">
    {#each Array(columns) as _}
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
    {/each}
  </div>

  <!-- Rows -->
  {#each Array(rows) as _}
    <div class="flex space-x-4 py-2 border-b border-gray-100 dark:border-gray-800">
      {#each Array(columns) as _, i}
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded {i === 0 ? 'w-1/3' : 'w-1/4'}"></div>
      {/each}
    </div>
  {/each}
  
  <!-- Footer/Pagination -->
  <div class="flex justify-between items-center pt-2">
    <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    <div class="flex space-x-2">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
    </div>
  </div>
</div>

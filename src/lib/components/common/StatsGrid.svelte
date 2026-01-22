<script lang="ts">
  interface StatItem {
    label: string;
    value: string | number;
    color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray';
    icon?: string;
  }
  
  export let stats: StatItem[];
  export let columns: number = 4;
  
  $: gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3', 
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-2 lg:grid-cols-6'
  };
  
  $: colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600'
  };
</script>

<div class="grid {gridCols[columns] || 'grid-cols-4'} gap-4">
  {#each stats as stat}
    <div class="text-center">
      <p class="text-2xl font-bold {stat.color ? colorClasses[stat.color] : 'text-gray-900 dark:text-white'}">
        {stat.value}
      </p>
      <p class="text-xs text-gray-600 dark:text-gray-400">
        {stat.label}
      </p>
    </div>
  {/each}
</div>
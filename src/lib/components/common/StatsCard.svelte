<!--
  StatsCard - Componente para exibir estatísticas
  
  Props:
  - title: string - Título da estatística
  - value: number | string - Valor principal
  - icon: string - Nome do ícone
  - color: string - Cor do tema
  - suffix: string - Texto adicional após o valor
  - prefix: string - Texto antes do valor
-->

<script lang="ts">
  import { Card } from 'flowbite-svelte';
  import { 
    BuildingOutline,
    CheckCircleOutline,
    UsersOutline,
    ChartOutline,
    FileDocOutline,
    ExclamationCircleOutline,
    InfoCircleOutline
  } from 'flowbite-svelte-icons';

  // Props
  export let title: string;
  export let value: number | string;
  export let icon: string = 'document';
  export let color: string = 'blue';
  export let suffix: string = '';
  export let prefix: string = '';

  // Icon mapping
  const iconMap = {
    'building': BuildingOutline,
    'check-circle': CheckCircleOutline,
    'users': UsersOutline,
    'chart': ChartOutline,
    'document': FileDocOutline,
    'warning': ExclamationCircleOutline,
    'info': InfoCircleOutline
  };

  // Color mapping
  const colorMap = {
    'blue': 'text-blue-600 dark:text-blue-400',
    'green': 'text-green-600 dark:text-green-400',
    'purple': 'text-purple-600 dark:text-purple-400',
    'orange': 'text-orange-600 dark:text-orange-400',
    'red': 'text-red-600 dark:text-red-400',
    'gray': 'text-gray-600 dark:text-gray-400'
  };

  // Background color mapping - Softer pastel tones
  const bgColorMap = {
    'blue': 'bg-blue-50 dark:bg-blue-900/10',
    'green': 'bg-green-50 dark:bg-green-900/10',
    'purple': 'bg-purple-50 dark:bg-purple-900/10',
    'orange': 'bg-orange-50 dark:bg-orange-900/10',
    'red': 'bg-red-50 dark:bg-red-900/10',
    'gray': 'bg-gray-50 dark:bg-gray-900/10'
  };

  $: IconComponent = iconMap[icon as keyof typeof iconMap] || iconMap.document;
  $: textColor = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  $: bgColor = bgColorMap[color as keyof typeof bgColorMap] || bgColorMap.blue;
  $: formattedValue = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200">
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <h3 class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <div class="flex items-baseline gap-1">
        {#if prefix}
          <span class="text-sm text-gray-500 dark:text-gray-400">{prefix}</span>
        {/if}
        <span class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
          {formattedValue}
        </span>
        {#if suffix}
          <span class="text-sm text-gray-500 dark:text-gray-400">{suffix}</span>
        {/if}
      </div>
    </div>
    
    <div class="flex-shrink-0">
      <div class="w-10 h-10 rounded-full flex items-center justify-center {bgColor}">
        <svelte:component this={IconComponent} class="w-5 h-5 {textColor}" />
      </div>
    </div>
  </div>
</div>
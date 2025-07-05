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
    DocumentOutline,
    ExclamationTriangleOutline,
    InformationCircleOutline
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
    'document': DocumentOutline,
    'warning': ExclamationTriangleOutline,
    'info': InformationCircleOutline
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

  // Background color mapping
  const bgColorMap = {
    'blue': 'bg-blue-50 dark:bg-blue-900/20',
    'green': 'bg-green-50 dark:bg-green-900/20',
    'purple': 'bg-purple-50 dark:bg-purple-900/20',
    'orange': 'bg-orange-50 dark:bg-orange-900/20',
    'red': 'bg-red-50 dark:bg-red-900/20',
    'gray': 'bg-gray-50 dark:bg-gray-900/20'
  };

  $: IconComponent = iconMap[icon as keyof typeof iconMap] || iconMap.document;
  $: textColor = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  $: bgColor = bgColorMap[color as keyof typeof bgColorMap] || bgColorMap.blue;
  $: formattedValue = typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
</script>

<Card class="hover:shadow-lg transition-shadow duration-200">
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <div class="flex items-baseline gap-1">
        {#if prefix}
          <span class="text-sm text-gray-500 dark:text-gray-400">{prefix}</span>
        {/if}
        <span class="text-2xl font-bold text-gray-900 dark:text-white">
          {formattedValue}
        </span>
        {#if suffix}
          <span class="text-sm text-gray-500 dark:text-gray-400">{suffix}</span>
        {/if}
      </div>
    </div>
    
    <div class="flex-shrink-0">
      <div class="w-12 h-12 rounded-full flex items-center justify-center {bgColor}">
        <svelte:component this={IconComponent} class="w-6 h-6 {textColor}" />
      </div>
    </div>
  </div>
</Card>
<!--
  StatusBadge - Componente Universal para Status
  
  Substitui StatusIndicator e StatusDot com funcionalidade simplificada.
  Compatível com todos os usos existentes no sistema.
-->

<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  // Definindo tipo ComponentColor localmente para evitar import issues
  type ComponentColor = 'alternative' | 'blue' | 'dark' | 'green' | 'light' | 'primary' | 'purple' | 'red' | 'yellow';
  import { statusColors, statusColorsHex, getFlowbiteColor } from '$lib/theme';
  
  export let status: string;
  export const type: 'ficha' | 'epi' | 'colaborador' | 'estoque' | 'entrega' | 'item' | 'movimento' = 'epi';
  export let size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' = 'sm';
  export let rounded = false;
  export let showText = true; // Para compatibilidade com StatusDot
  export const showIcon = false; // Para badges simples
  
  // Usar configuração centralizada do tema
  $: flowbiteColor = (statusColors[status] || statusColors[status?.toUpperCase?.()] || 'blue') as ComponentColor;
  $: hexColor = statusColorsHex[status] || statusColorsHex[status?.toUpperCase?.()] || '#3F83F8';
  $: displayLabel = status ? (status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')) : '';
  
  $: config = {
    color: flowbiteColor,
    label: displayLabel,
    hex: hexColor
  };
  
  // Modo dot (para compatibilidade com StatusDot)
  export let dotMode = false;
  export let dotSize: 'sm' | 'md' | 'lg' = 'md';
  
  // Tamanhos do dot
  const dotSizes = {
    sm: 'w-2 h-2',   // 8px
    md: 'w-2.5 h-2.5', // 10px (padrão)
    lg: 'w-3 h-3'    // 12px
  };

  // Tamanhos da fonte para dot mode
  const textSizes = {
    sm: 'text-xs',   // 12px
    md: 'text-sm',   // 14px (padrão)
    lg: 'text-base'  // 16px
  };
  
  $: dotClass = dotSizes[dotSize];
  $: textClass = textSizes[dotSize];
</script>

{#if dotMode}
  <!-- StatusDot Mode -->
  <div class="inline-flex items-center gap-2 {$$props.class || ''}">
    <!-- Dot (círculo colorido) -->
    <div 
      class="rounded-full {dotClass} border border-white dark:border-gray-800"
      style="background-color: {config.hex};"
    ></div>
    
    <!-- Text (se habilitado) -->
    {#if showText}
      <span class="font-medium text-gray-900 dark:text-white {textClass}">
        {config.label}
      </span>
    {/if}
  </div>
{:else}
  <!-- Badge Mode -->
  <Badge 
    color={config.color} 
    {size}
    {rounded}
    class="w-fit rounded-sm {$$props.class || ''}"
  >
    {config.label}
  </Badge>
{/if}
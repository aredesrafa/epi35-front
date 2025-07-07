<!--
  StatusBadge - Badge Type-Safe para Status de Entidades
  
  Componente universal para exibir status de diferentes entidades do sistema
  com type safety completa e mapeamento automático de cores/ícones.
  
  Features:
  - Type safety com ENUMs do backend
  - Mapeamento automático status → cor/ícone
  - Suporte a múltiplos tipos de entidade
  - Variantes visuais (solid, outlined, subtle)
  - Indicadores de estado (loading, error, success)
  - Acessibilidade completa
-->

<script lang="ts">
  import { 
    StatusFicha,
    StatusEntrega,
    StatusEntregaItem,
    StatusNota,
    StatusEstoqueItem,
    StatusTipoEPI,
    getHumanReadableStatusEntrega,
    getHumanReadableStatusEntregaItem,
    type StatusFichaEnum,
    type StatusEntregaEnum,
    type StatusEntregaItemEnum,
    type StatusNotaEnum,
    type StatusEstoqueItemEnum,
    type StatusTipoEPIEnum
  } from '$lib/constants/enums';
  
  // Flowbite components
  import { Badge } from 'flowbite-svelte';
  
  // Icons para diferentes status
  import { 
    CheckCircleOutline,
    ClockOutline,
    CloseOutline,
    ExclamationCircleOutline,
    FileDocOutline,
    EyeSlashOutline,
    InfoCircleOutline,
    UserOutline,
    FolderOutline
  } from 'flowbite-svelte-icons';
  
  // ==================== PROPS ====================
  
  export let type: 'ficha' | 'entrega' | 'entrega_item' | 'nota' | 'estoque_item' | 'tipo_epi' | 'contratada';
  export let status: StatusFichaEnum | StatusEntregaEnum | StatusEntregaItemEnum | StatusNotaEnum | StatusEstoqueItemEnum | StatusTipoEPIEnum | string;
  export let variant: 'solid' | 'outlined' | 'subtle' = 'solid';
  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';
  export let showIcon = true;
  export let showTooltip = false;
  export let rounded = true;
  export let pulse = false; // Para status que mudam (loading, etc.)
  
  // Para casos especiais
  export let overrideColor: string | null = null;
  export let overrideLabel: string | null = null;
  export let overrideIcon: any = null;
  
  // Classes CSS customizáveis
  export let containerClass = '';
  
  // ==================== COMPUTED ====================
  
  // Configurações por tipo de entidade e status
  const statusConfigs = {
    ficha: {
      [StatusFicha.ATIVA]: {
        color: 'green',
        label: 'Ativa',
        icon: CheckCircleOutline
      },
      [StatusFicha.INATIVA]: {
        color: 'gray',
        label: 'Inativa',
        icon: EyeSlashOutline
      }
    },
    entrega: {
      [StatusEntrega.PENDENTE_ASSINATURA]: {
        color: 'yellow',
        label: 'Pendente Assinatura',
        icon: ClockOutline
      },
      [StatusEntrega.ASSINADA]: {
        color: 'green',
        label: 'Assinada',
        icon: CheckCircleOutline
      },
      [StatusEntrega.CANCELADA]: {
        color: 'red',
        label: 'Cancelada',
        icon: CloseOutline
      }
    },
    entrega_item: {
      [StatusEntregaItem.COM_COLABORADOR]: {
        color: 'blue',
        label: 'Com Colaborador',
        icon: UserOutline
      },
      [StatusEntregaItem.DEVOLVIDO]: {
        color: 'gray',
        label: 'Devolvido',
        icon: FolderOutline
      }
    },
    nota: {
      [StatusNota.RASCUNHO]: {
        color: 'gray',
        label: 'Rascunho',
        icon: FileDocOutline
      },
      [StatusNota.CONCLUIDA]: {
        color: 'green',
        label: 'Concluída',
        icon: CheckCircleOutline
      },
      [StatusNota.CANCELADA]: {
        color: 'red',
        label: 'Cancelada',
        icon: CloseOutline
      }
    },
    estoque_item: {
      [StatusEstoqueItem.DISPONIVEL]: {
        color: 'green',
        label: 'Disponível',
        icon: CheckCircleOutline
      },
      [StatusEstoqueItem.AGUARDANDO_INSPECAO]: {
        color: 'yellow',
        label: 'Aguardando Inspeção',
        icon: ClockOutline
      },
      [StatusEstoqueItem.QUARENTENA]: {
        color: 'orange',
        label: 'Em Quarentena',
        icon: ExclamationCircleOutline
      }
    },
    tipo_epi: {
      [StatusTipoEPI.ATIVO]: {
        color: 'green',
        label: 'Ativo',
        icon: CheckCircleOutline
      },
      [StatusTipoEPI.DESCONTINUADO]: {
        color: 'red',
        label: 'Descontinuado',
        icon: ExclamationCircleOutline
      }
    },
    contratada: {
      'ATIVA': {
        color: 'green',
        label: 'Ativa',
        icon: CheckCircleOutline
      },
      'INATIVA': {
        color: 'gray',
        label: 'Inativa',
        icon: EyeSlashOutline
      },
      'SUSPENSA': {
        color: 'red',
        label: 'Suspensa',
        icon: CloseOutline
      }
    }
  };
  
  // Obter configuração para o status atual
  $: config = overrideColor || overrideLabel || overrideIcon ? {
    color: overrideColor || 'gray',
    label: overrideLabel || status,
    icon: overrideIcon || InfoCircleOutline
  } : statusConfigs[type]?.[status] || {
    color: 'gray',
    label: status,
    icon: InfoCircleOutline
  };
  
  // Classes CSS do Flowbite Badge baseadas na variante
  $: badgeClasses = {
    solid: '',
    outlined: 'border',
    subtle: 'bg-opacity-20 border-opacity-30'
  }[variant];
  
  // Classe de tamanho
  $: sizeClass = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1', 
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }[size];
  
  // Título para tooltip
  $: tooltipTitle = showTooltip ? `${type}: ${config.label}` : '';
  
  // Classes de animação
  $: animationClass = pulse ? 'animate-pulse' : '';
</script>

<!-- ==================== HTML ==================== -->

<span 
  class="status-badge {containerClass} {animationClass}"
  title={tooltipTitle}
  role="status"
  aria-label="{type} status: {config.label}"
>
  <Badge
    color={config.color}
    class="inline-flex items-center {badgeClasses} {sizeClass} {rounded ? 'rounded-full' : 'rounded'}"
  >
    {#if showIcon && config.icon}
      <svelte:component 
        this={config.icon} 
        class="w-3 h-3 mr-1 flex-shrink-0"
        aria-hidden="true"
      />
    {/if}
    
    <span class="truncate">
      {config.label}
    </span>
  </Badge>
</span>

<!-- ==================== STYLES ==================== -->

<style>
  .status-badge {
    @apply inline-block;
  }
  
  /* Variantes visuais customizadas */
  :global(.status-badge .badge-outlined) {
    @apply bg-transparent;
  }
  
  :global(.status-badge .badge-subtle) {
    @apply backdrop-blur-sm;
  }
  
  /* Animações suaves */
  .status-badge {
    transition: all 0.2s ease-in-out;
  }
  
  .status-badge:hover {
    transform: scale(1.02);
  }
  
  /* Estados especiais */
  .status-badge.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .7;
    }
  }
  
  /* Responsividade */
  @media (max-width: 640px) {
    .status-badge {
      @apply text-xs;
    }
  }
</style>
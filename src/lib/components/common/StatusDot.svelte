<script lang="ts">
  // Componente de status com círculo colorido + texto
  // Baseado no design do Figma: Dot & Text component
  // Substitui o StatusIndicator (badge) nos headers de drawer
  
  export let status: string;
  export let type: 'ficha' | 'colaborador' | 'entrega' | 'item' | 'movimento' = 'ficha';
  export let showText: boolean = true; // Permite usar apenas o dot sem texto
  export let size: 'sm' | 'md' | 'lg' = 'md'; // Tamanhos do dot
  
  // Mapeamento de cores por status e tipo
  const statusColors = {
    // Fichas EPI
    ficha: {
      ativa: '#00B8AA',        // green-500 - nossa paleta personalizada
      ativo: '#00B8AA',        // green-500 - nossa paleta personalizada (alias)
      vencida: '#FF4563',      // red-500 - nossa paleta personalizada
      vencido: '#FF4563',      // red-500 - nossa paleta personalizada (alias)
      suspensa: '#D98C29',     // yellow-500 - nossa paleta personalizada
      suspenso: '#D98C29',     // yellow-500 - nossa paleta personalizada (alias)
      arquivada: '#535D72',    // gray-500 - nossa paleta personalizada
      arquivado: '#535D72',    // gray-500 - nossa paleta personalizada (alias)
      inativa: '#535D72',      // gray-500
      inativo: '#535D72'       // gray-500 (alias)
    },
    // Colaboradores
    colaborador: {
      ativo: '#00B8AA',        // green-500
      inativo: '#535D72',      // gray-500
      desligado: '#FF4563',    // red-500
      suspenso: '#D98C29'      // yellow-500
    },
    // Entregas
    entrega: {
      assinado: '#00B8AA',     // green-500
      nao_assinado: '#D98C29', // yellow-500
      pendente: '#D98C29',     // yellow-500
      cancelado: '#FF4563'     // red-500
    },
    // Itens de estoque
    item: {
      disponivel: '#00B8AA',   // green-500
      baixo_estoque: '#D98C29', // yellow-500
      esgotado: '#FF4563',     // red-500
      vencido: '#FF4563',      // red-500
      vencendo: '#D98C29'      // yellow-500
    },
    // Movimentações
    movimento: {
      entrada: '#00B8AA',      // green-500
      saida: '#FF4563',        // red-500
      ajuste: '#3F83F8',       // primary-500 (blue)
      transferencia: '#3F83F8' // primary-500 (blue)
    }
  };

  // Mapeamento de textos legíveis por status
  const statusTexts = {
    // Fichas
    ativo: 'Ativo',
    vencido: 'Vencido', 
    suspenso: 'Suspenso',
    arquivado: 'Arquivado',
    inativo: 'Inativo',
    
    // Entregas
    assinado: 'Assinado',
    nao_assinado: 'Não Assinado',
    pendente: 'Pendente',
    cancelado: 'Cancelado',
    
    // Estoque
    disponivel: 'Disponível',
    baixo_estoque: 'Baixo Estoque',
    esgotado: 'Esgotado',
    vencendo: 'Vencendo',
    
    // Movimentações
    entrada: 'Entrada',
    saida: 'Saída',
    ajuste: 'Ajuste',
    transferencia: 'Transferência'
  };

  // Tamanhos do dot
  const dotSizes = {
    sm: 'w-2 h-2',   // 8px
    md: 'w-2.5 h-2.5', // 10px (padrão Figma)
    lg: 'w-3 h-3'    // 12px
  };

  // Tamanhos da fonte
  const textSizes = {
    sm: 'text-xs',   // 12px
    md: 'text-sm',   // 14px (padrão Figma)
    lg: 'text-base'  // 16px
  };

  // Obter cor do status
  $: color = statusColors[type]?.[status] || '#535D72'; // fallback para gray-500
  
  // Obter texto do status
  $: text = statusTexts[status] || status;
  
  // Classes do dot
  $: dotClass = dotSizes[size];
  
  // Classes do texto
  $: textClass = textSizes[size];
</script>

<!-- Status Dot Component -->
<div class="inline-flex items-center gap-2 {$$props.class || ''}">
  <!-- Dot (círculo colorido) -->
  <div 
    class="rounded-full {dotClass} border border-white dark:border-gray-800"
    style="background-color: {color};"
  ></div>
  
  <!-- Text (se habilitado) -->
  {#if showText}
    <span class="font-medium text-gray-900 dark:text-white {textClass}">
      {text}
    </span>
  {/if}
</div>

<!-- 
  Exemplos de uso:
  
  <StatusDot status="ativo" type="ficha" />
  <StatusDot status="vencido" type="ficha" size="lg" />
  <StatusDot status="assinado" type="entrega" size="sm" />
  <StatusDot status="disponivel" type="item" showText={false} />
-->
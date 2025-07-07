<!--
  MovementHistoryLog - UI Timeline para Event Sourcing
  
  Componente especializado para exibir histórico de movimentações de estoque
  usando o paradigma Event Sourcing. Não é uma tabela editável, mas um log
  visual tipo timeline/feed.
  
  Features:
  - Timeline visual com ícones por tipo de movimentação
  - Integração com ENUMs do backend (16 tipos + estornos)
  - Filtros por período e tipo
  - Indicadores visuais para entrada/saída
  - Suporte a estornos e movimentações órfãs
  - Paginação para históricos grandes
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    TipoMovimentacao,
    getMovementIcon,
    isEstorno,
    isEntrada,
    isSaida,
    type TipoMovimentacaoEnum
  } from '$lib/constants/enums';
  
  // Flowbite components
  import { 
    Card,
    Button,
    Badge,
    Select,
    Input,
    Alert,
    Spinner
  } from 'flowbite-svelte';
  
  // Icons
  import { 
    CalendarDateRangeOutline,
    FilterOutline,
    ChevronDownOutline,
    ChevronUpOutline,
    ExclamationTriangleOutline,
    InfoCircleOutline
  } from 'flowbite-svelte-icons';
  
  // ==================== TIPOS ====================
  
  export interface MovimentacaoEstoque {
    id: string;
    tipoMovimentacao: TipoMovimentacaoEnum;
    quantidadeMovida: number;
    quantidadeAnterior: number;
    quantidadeResultante: number;
    dataMovimentacao: string;
    responsavelNome: string;
    responsavelId: string;
    observacoes?: string;
    
    // Event Sourcing específico
    movimentacaoOrigemId?: string; // Para estornos
    notaMovimentacaoId?: string;
    entregaId?: string;
    
    // Metadados
    almoxarifadoNome: string;
    tipoEpiNome: string;
    tipoEpiCA?: string;
    
    // Auditoria
    createdAt: string;
    ipOrigemOperacao?: string;
  }
  
  export interface HistoryFilters {
    periodo?: '7d' | '30d' | '90d' | 'custom';
    dataInicio?: string;
    dataFim?: string;
    tipoMovimentacao?: TipoMovimentacaoEnum | 'all';
    apenasEstornos?: boolean;
    responsavelId?: string;
  }
  
  // ==================== PROPS ====================
  
  export let movements: MovimentacaoEstoque[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let empty = false;
  
  // Configurações
  export let showFilters = true;
  export let showPagination = true;
  export let itemsPerPage = 10;
  export let maxHeight = '600px';
  export let highlightEstornos = true;
  export let showQuantityFlow = true;
  
  // Filtros
  export let filters: HistoryFilters = {};
  
  // Estados
  export let currentPage = 1;
  export let totalPages = 1;
  export let totalItems = 0;
  
  // ==================== EVENTOS ====================
  
  const dispatch = createEventDispatcher<{
    filtersChange: { filters: HistoryFilters };
    pageChange: { page: number };
    movementDetails: { movement: MovimentacaoEstoque };
    estornoCreate: { originalMovement: MovimentacaoEstoque };
  }>();
  
  // ==================== ESTADO LOCAL ====================
  
  let filtersExpanded = false;
  let selectedPeriod = filters.periodo || '30d';
  let selectedTipo = filters.tipoMovimentacao || 'all';
  let customDateStart = filters.dataInicio || '';
  let customDateEnd = filters.dataFim || '';
  
  // ==================== COMPUTED ====================
  
  // Períodos pré-definidos
  const periodOptions = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'custom', label: 'Período personalizado' }
  ];
  
  // Tipos de movimentação para filtro
  const tipoOptions = [
    { value: 'all', label: 'Todos os tipos' },
    ...Object.entries(TipoMovimentacao).map(([key, value]) => ({
      value,
      label: getTipoLabel(value)
    }))
  ];
  
  // Movimentações organizadas por data
  $: movementsByDate = groupMovementsByDate(movements);
  
  // Estatísticas do período
  $: periodStats = calculatePeriodStats(movements);
  
  // ==================== HANDLERS ====================
  
  function handleFiltersChange() {
    const newFilters: HistoryFilters = {
      periodo: selectedPeriod,
      tipoMovimentacao: selectedTipo === 'all' ? undefined : selectedTipo as TipoMovimentacaoEnum,
      apenasEstornos: filters.apenasEstornos
    };
    
    if (selectedPeriod === 'custom') {
      newFilters.dataInicio = customDateStart;
      newFilters.dataFim = customDateEnd;
    }
    
    dispatch('filtersChange', { filters: newFilters });
  }
  
  function handleMovementClick(movement: MovimentacaoEstoque) {
    dispatch('movementDetails', { movement });
  }
  
  function handleEstornoClick(movement: MovimentacaoEstoque) {
    dispatch('estornoCreate', { originalMovement: movement });
  }
  
  function handlePageChange(page: number) {
    dispatch('pageChange', { page });
  }
  
  // ==================== UTILITIES ====================
  
  function getTipoLabel(tipo: TipoMovimentacaoEnum): string {
    const labels: Record<TipoMovimentacaoEnum, string> = {
      [TipoMovimentacao.ENTRADA_NOTA]: 'Entrada por Nota',
      [TipoMovimentacao.SAIDA_ENTREGA]: 'Saída por Entrega',
      [TipoMovimentacao.ENTRADA_DEVOLUCAO]: 'Entrada por Devolução',
      [TipoMovimentacao.SAIDA_TRANSFERENCIA]: 'Saída por Transferência',
      [TipoMovimentacao.ENTRADA_TRANSFERENCIA]: 'Entrada por Transferência',
      [TipoMovimentacao.SAIDA_DESCARTE]: 'Saída por Descarte',
      [TipoMovimentacao.AJUSTE_POSITIVO]: 'Ajuste Positivo',
      [TipoMovimentacao.AJUSTE_NEGATIVO]: 'Ajuste Negativo',
      [TipoMovimentacao.ESTORNO_ENTRADA_NOTA]: 'Estorno - Entrada por Nota',
      [TipoMovimentacao.ESTORNO_SAIDA_ENTREGA]: 'Estorno - Saída por Entrega',
      [TipoMovimentacao.ESTORNO_ENTRADA_DEVOLUCAO]: 'Estorno - Entrada por Devolução',
      [TipoMovimentacao.ESTORNO_SAIDA_DESCARTE]: 'Estorno - Saída por Descarte',
      [TipoMovimentacao.ESTORNO_SAIDA_TRANSFERENCIA]: 'Estorno - Saída por Transferência',
      [TipoMovimentacao.ESTORNO_ENTRADA_TRANSFERENCIA]: 'Estorno - Entrada por Transferência',
      [TipoMovimentacao.ESTORNO_AJUSTE_POSITIVO]: 'Estorno - Ajuste Positivo',
      [TipoMovimentacao.ESTORNO_AJUSTE_NEGATIVO]: 'Estorno - Ajuste Negativo'
    };
    return labels[tipo] || tipo;
  }
  
  function groupMovementsByDate(movements: MovimentacaoEstoque[]) {
    const grouped = new Map();
    
    movements.forEach(movement => {
      const date = new Date(movement.dataMovimentacao).toDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date).push(movement);
    });
    
    return Array.from(grouped.entries()).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }
  
  function calculatePeriodStats(movements: MovimentacaoEstoque[]) {
    const entradas = movements.filter(m => isEntrada(m.tipoMovimentacao));
    const saidas = movements.filter(m => isSaida(m.tipoMovimentacao));
    const estornos = movements.filter(m => isEstorno(m.tipoMovimentacao));
    
    return {
      totalMovimentacoes: movements.length,
      totalEntradas: entradas.reduce((sum, m) => sum + m.quantidadeMovida, 0),
      totalSaidas: saidas.reduce((sum, m) => sum + m.quantidadeMovida, 0),
      totalEstornos: estornos.length,
      saldoLiquido: entradas.reduce((sum, m) => sum + m.quantidadeMovida, 0) - 
                    saidas.reduce((sum, m) => sum + m.quantidadeMovida, 0)
    };
  }
  
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getMovementColor(movement: MovimentacaoEstoque): string {
    if (isEstorno(movement.tipoMovimentacao)) return 'red';
    if (isEntrada(movement.tipoMovimentacao)) return 'green';
    if (isSaida(movement.tipoMovimentacao)) return 'blue';
    return 'gray';
  }
  
  function getQuantityChangeText(movement: MovimentacaoEstoque): string {
    const isPositive = isEntrada(movement.tipoMovimentacao);
    const sign = isPositive ? '+' : '-';
    return `${sign}${movement.quantidadeMovida}`;
  }
</script>

<!-- ==================== HTML ==================== -->

<div class="movement-history-log">
  
  <!-- Filtros (se habilitados) -->
  {#if showFilters}
    <Card class="mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Histórico de Movimentações
        </h3>
        
        <Button 
          size="sm" 
          color="light"
          class="rounded-sm"
          on:click={() => filtersExpanded = !filtersExpanded}
        >
          <FilterOutline class="w-4 h-4 mr-2" />
          Filtros
          {#if filtersExpanded}
            <ChevronUpOutline class="w-4 h-4 ml-2" />
          {:else}
            <ChevronDownOutline class="w-4 h-4 ml-2" />
          {/if}
        </Button>
      </div>
      
      <!-- Estatísticas do período -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {periodStats.totalMovimentacoes}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Movimentações</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">
            +{periodStats.totalEntradas}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Entradas</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">
            -{periodStats.totalSaidas}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Saídas</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold {periodStats.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}">
            {periodStats.saldoLiquido >= 0 ? '+' : ''}{periodStats.saldoLiquido}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Saldo Líquido</div>
        </div>
      </div>
      
      <!-- Filtros expandidos -->
      {#if filtersExpanded}
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Período -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Período
              </label>
              <Select bind:value={selectedPeriod} on:change={handleFiltersChange}>
                {#each periodOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </Select>
              
              {#if selectedPeriod === 'custom'}
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <Input 
                    type="date" 
                    bind:value={customDateStart}
                    on:change={handleFiltersChange}
                    placeholder="Data início"
                  />
                  <Input 
                    type="date" 
                    bind:value={customDateEnd}
                    on:change={handleFiltersChange}
                    placeholder="Data fim"
                  />
                </div>
              {/if}
            </div>
            
            <!-- Tipo de Movimentação -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Movimentação
              </label>
              <Select bind:value={selectedTipo} on:change={handleFiltersChange}>
                {#each tipoOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </Select>
            </div>
            
            <!-- Opções adicionais -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opções
              </label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    bind:checked={filters.apenasEstornos}
                    on:change={handleFiltersChange}
                    class="mr-2"
                  />
                  Apenas estornos
                </label>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </Card>
  {/if}
  
  <!-- Timeline de Movimentações -->
  <Card>
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <Spinner size="8" />
        <span class="ml-3 text-gray-600 dark:text-gray-400">
          Carregando histórico...
        </span>
      </div>
      
    {:else if error}
      <Alert color="red">
        <ExclamationTriangleOutline slot="icon" class="w-4 h-4" />
        <span class="font-medium">Erro ao carregar histórico:</span> {error}
      </Alert>
      
    {:else if empty || movements.length === 0}
      <div class="text-center py-12">
        <InfoCircleOutline class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhuma movimentação encontrada
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Não há movimentações para o período e filtros selecionados.
        </p>
      </div>
      
    {:else}
      <!-- Timeline -->
      <div class="timeline" style="max-height: {maxHeight}; overflow-y: auto;">
        {#each movementsByDate as [date, dayMovements]}
          <!-- Separador de data -->
          <div class="date-separator">
            <div class="date-line"></div>
            <div class="date-badge">
              {formatDate(date)}
            </div>
            <div class="date-line"></div>
          </div>
          
          <!-- Movimentações do dia -->
          {#each dayMovements as movement}
            <div 
              class="timeline-item"
              class:estorno={isEstorno(movement.tipoMovimentacao) && highlightEstornos}
            >
              <!-- Ícone da timeline -->
              <div class="timeline-icon {getMovementColor(movement)}">
                <span class="movement-emoji">
                  {getMovementIcon(movement.tipoMovimentacao)}
                </span>
              </div>
              
              <!-- Conteúdo da movimentação -->
              <div class="timeline-content">
                <div class="movement-header">
                  <div class="flex items-start justify-between">
                    <div>
                      <h4 class="movement-title">
                        {getTipoLabel(movement.tipoMovimentacao)}
                      </h4>
                      <div class="movement-meta">
                        {formatTime(movement.dataMovimentacao)} • {movement.responsavelNome}
                      </div>
                    </div>
                    
                    <div class="movement-quantity">
                      <Badge color={getMovementColor(movement)}>
                        {getQuantityChangeText(movement)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <!-- Fluxo de quantidade (se habilitado) -->
                {#if showQuantityFlow}
                  <div class="quantity-flow">
                    <span class="quantity-before">{movement.quantidadeAnterior}</span>
                    <span class="arrow">→</span>
                    <span class="quantity-after">{movement.quantidadeResultante}</span>
                  </div>
                {/if}
                
                <!-- Observações -->
                {#if movement.observacoes}
                  <div class="movement-notes">
                    <em>"{movement.observacoes}"</em>
                  </div>
                {/if}
                
                <!-- Referências (notas, entregas, etc.) -->
                <div class="movement-references">
                  {#if movement.notaMovimentacaoId}
                    <Badge color="light" class="mr-1">Nota: {movement.notaMovimentacaoId}</Badge>
                  {/if}
                  {#if movement.entregaId}
                    <Badge color="light" class="mr-1">Entrega: {movement.entregaId}</Badge>
                  {/if}
                  {#if movement.movimentacaoOrigemId}
                    <Badge color="red" class="mr-1">Estorno de: {movement.movimentacaoOrigemId}</Badge>
                  {/if}
                </div>
                
                <!-- Ações -->
                <div class="movement-actions">
                  <button 
                    class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                    on:click={() => handleMovementClick(movement)}
                  >
                    Detalhes
                  </button>
                  
                  {#if !isEstorno(movement.tipoMovimentacao)}
                    <button 
                      class="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900"
                      on:click={() => handleEstornoClick(movement)}
                    >
                      Estornar
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        {/each}
      </div>
      
      <!-- Paginação (se habilitada) -->
      {#if showPagination && totalPages > 1}
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Página {currentPage} de {totalPages} • {totalItems} movimentações
          </div>
          
          <div class="flex gap-2">
            <Button 
              size="sm" 
              color="light"
              class="rounded-sm"
              disabled={currentPage === 1}
              on:click={() => handlePageChange(currentPage - 1)}
            >
              Anterior
            </Button>
            
            <Button 
              size="sm" 
              color="light"
              class="rounded-sm"
              disabled={currentPage === totalPages}
              on:click={() => handlePageChange(currentPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      {/if}
    {/if}
  </Card>
</div>

<!-- ==================== STYLES ==================== -->

<style>
  .movement-history-log {
    @apply w-full;
  }
  
  /* Timeline */
  .timeline {
    @apply relative space-y-4 px-2;
  }
  
  /* Separador de data */
  .date-separator {
    @apply flex items-center my-6;
  }
  
  .date-line {
    @apply flex-1 h-px bg-gray-300 dark:bg-gray-600;
  }
  
  .date-badge {
    @apply px-4 py-1 mx-4 text-sm font-medium text-gray-600 dark:text-gray-400 
           bg-gray-100 dark:bg-gray-800 rounded-full;
  }
  
  /* Item da timeline */
  .timeline-item {
    @apply relative flex items-start space-x-4 p-4 
           bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
           rounded-lg shadow-sm hover:shadow-md transition-shadow;
  }
  
  .timeline-item.estorno {
    @apply border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20;
  }
  
  /* Ícone da timeline */
  .timeline-icon {
    @apply flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
           text-white font-bold text-lg;
  }
  
  .timeline-icon.green {
    @apply bg-green-500;
  }
  
  .timeline-icon.blue {
    @apply bg-blue-500;
  }
  
  .timeline-icon.red {
    @apply bg-red-500;
  }
  
  .timeline-icon.gray {
    @apply bg-gray-500;
  }
  
  .movement-emoji {
    @apply text-base;
  }
  
  /* Conteúdo */
  .timeline-content {
    @apply flex-1 min-w-0;
  }
  
  .movement-title {
    @apply text-base font-medium text-gray-900 dark:text-white;
  }
  
  .movement-meta {
    @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
  }
  
  .movement-quantity {
    @apply flex-shrink-0;
  }
  
  /* Fluxo de quantidade */
  .quantity-flow {
    @apply flex items-center text-sm text-gray-600 dark:text-gray-400 mt-2;
  }
  
  .quantity-before {
    @apply font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded;
  }
  
  .arrow {
    @apply mx-2;
  }
  
  .quantity-after {
    @apply font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded;
  }
  
  /* Observações */
  .movement-notes {
    @apply text-sm text-gray-600 dark:text-gray-400 mt-2 italic;
  }
  
  /* Referências */
  .movement-references {
    @apply mt-2;
  }
  
  /* Ações */
  .movement-actions {
    @apply flex gap-2 mt-3;
  }
  
  /* Animações */
  .timeline-item {
    animation: slideInLeft 0.3s ease-out;
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  /* Scrollbar customizada */
  .timeline::-webkit-scrollbar {
    width: 6px;
  }
  
  .timeline::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-800;
  }
  
  .timeline::-webkit-scrollbar-thumb {
    @apply bg-gray-400 dark:bg-gray-600 rounded-full;
  }
  
  .timeline::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500 dark:bg-gray-500;
  }
</style>
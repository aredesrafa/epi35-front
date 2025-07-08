<!--
  Auditoria Table Presenter - Sistema DataLife EPI
  
  Componente "burro" responsável apenas pela renderização da interface de auditoria.
  Recebe dados via props e emite eventos para o Container pai.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Card, Button, Input, Select, Table, TableHead, TableHeadCell, 
    TableBody, TableBodyRow, TableBodyCell, Label, Badge 
  } from 'flowbite-svelte';
  import { 
    RefreshOutline, DownloadOutline, TrashBinOutline 
  } from 'flowbite-svelte-icons';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import { formatarData } from '$lib/utils/dateHelpers';
  import type { RelatorioMovimentacaoDTO, AlmoxarifadoDTO, TipoEPIDTO, UsuarioDTO } from '$lib/types/serviceTypes';
  
  // ==================== PROPS ====================
  
  export let items: RelatorioMovimentacaoDTO[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  export let filters: Record<string, any> = {};
  export let almoxarifados: AlmoxarifadoDTO[] = [];
  export let tiposEpi: TipoEPIDTO[] = [];
  export let usuarios: UsuarioDTO[] = [];
  
  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    pageChange: number;
    filterChange: { key: string; value: any };
    clearFilters: void;
    refresh: void;
    itemsPerPageChange: number;
    movementDetails: RelatorioMovimentacaoDTO;
    exportData: void;
  }>();
  
  // ==================== LOCAL STATE ====================
  
  let itemsPerPageOptions = [
    { value: 10, label: '10 por página' },
    { value: 25, label: '25 por página' },
    { value: 50, label: '50 por página' },
    { value: 100, label: '100 por página' }
  ];
  
  // ✅ Tipos de movimentação conforme documentação oficial do backend
  let tiposMovimentacao = [
    { value: '', label: 'Todos os tipos' },
    // Movimentações Diretas
    { value: 'ENTRADA_NOTA', label: 'Entrada por Nota' },
    { value: 'SAIDA_ENTREGA', label: 'Entrega a Colaborador' },
    { value: 'ENTRADA_DEVOLUCAO', label: 'Devolução' },
    { value: 'SAIDA_TRANSFERENCIA', label: 'Transferência de Saída' },
    { value: 'ENTRADA_TRANSFERENCIA', label: 'Transferência de Entrada' },
    { value: 'SAIDA_DESCARTE', label: 'Descarte' },
    { value: 'AJUSTE_POSITIVO', label: 'Ajuste (+)' },
    { value: 'AJUSTE_NEGATIVO', label: 'Ajuste (-)' },
    // Movimentações de Estorno
    { value: 'ESTORNO_ENTRADA_NOTA', label: 'Estorno de Entrada' },
    { value: 'ESTORNO_SAIDA_ENTREGA', label: 'Estorno de Entrega' },
    { value: 'ESTORNO_ENTRADA_DEVOLUCAO', label: 'Estorno de Devolução' },
    { value: 'ESTORNO_SAIDA_DESCARTE', label: 'Estorno de Descarte' },
    { value: 'ESTORNO_SAIDA_TRANSFERENCIA', label: 'Estorno de Transferência de Saída' },
    { value: 'ESTORNO_ENTRADA_TRANSFERENCIA', label: 'Estorno de Transferência de Entrada' },
    { value: 'ESTORNO_AJUSTE_POSITIVO', label: 'Estorno de Ajuste Positivo' },
    { value: 'ESTORNO_AJUSTE_NEGATIVO', label: 'Estorno de Ajuste Negativo' }
  ];
  
  // ==================== COMPUTED VALUES ====================
  
  $: startIndex = (pagination.page - 1) * pagination.pageSize + 1;
  $: endIndex = Math.min(pagination.page * pagination.pageSize, pagination.total);
  $: hasFiltersApplied = Object.values(filters).some(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  // ==================== HELPER FUNCTIONS ====================
  
  function truncateId(id: string): string {
    return id.length > 8 ? id.substring(0, 8) + '...' : id;
  }
  
  function formatTipoMovimentacao(tipo: string): string {
    const tipoFormatado = tiposMovimentacao.find(t => t.value === tipo);
    if (tipoFormatado) {
      return tipoFormatado.label;
    }
    // Fallback para tipos não mapeados
    return tipo.replace(/_/g, ' ').toLowerCase()
               .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  function getTipoMovimentacaoColor(tipo: string): string {
    // Estornos têm prioridade (laranja)
    if (tipo.startsWith('ESTORNO_')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    }
    
    // Categorias de entrada (verde)
    if (tipo.startsWith('ENTRADA_') || tipo === 'AJUSTE_POSITIVO') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    
    // Categorias de saída (vermelho)  
    if (tipo.startsWith('SAIDA_') || tipo === 'AJUSTE_NEGATIVO') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    
    // Padrão (cinza)
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
  
  function generatePageNumbers(): number[] {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  
  // ==================== EVENT HANDLERS ====================
  
  function handleFilterInput(key: string, value: any): void {
    dispatch('filterChange', { key, value });
  }
  
  function handlePageClick(page: number): void {
    dispatch('pageChange', page);
  }
  
  function handleItemsPerPageChange(value: string): void {
    dispatch('itemsPerPageChange', parseInt(value));
  }
  
  function handleMovementClick(movement: RelatorioMovimentacaoDTO): void {
    dispatch('movementDetails', movement);
  }
</script>

<!-- ==================== TEMPLATE ==================== -->

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Auditoria de Movimentações</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Visualize e audite todas as movimentações de estoque com rastreabilidade completa
      </p>
    </div>
    <div class="flex items-center space-x-3">
      <Button 
        size="sm" 
        color="alternative" 
        class="rounded-sm"
        on:click={() => dispatch('refresh')}
        disabled={loading}
      >
        <RefreshOutline class="w-4 h-4 mr-2" />
        Atualizar
      </Button>
      <Button 
        size="sm" 
        color="primary" 
        class="rounded-sm"
        on:click={() => dispatch('exportData')}
        disabled={loading}
      >
        <DownloadOutline class="w-4 h-4 mr-2" />
        Exportar
      </Button>
    </div>
  </div>

  <!-- Filtros -->
  <Card class="p-4 rounded-sm !max-w-none">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <!-- Almoxarifado -->
      <div>
        <Label for="filtro-almoxarifado" class="mb-2">Almoxarifado</Label>
        <Select
          id="filtro-almoxarifado"
          value={filters.almoxarifadoId || ''}
          on:change={(e) => {
            const target = e.target;
            if (target && 'value' in target) handleFilterInput('almoxarifadoId', target.value);
          }}
          size="sm"
          class="rounded-sm"
        >
          <option value="">Todos os almoxarifados</option>
          {#each almoxarifados as almoxarifado}
            <option value={almoxarifado.id}>{almoxarifado.nome}</option>
          {/each}
        </Select>
      </div>
      
      <!-- Tipo EPI -->
      <div>
        <Label for="filtro-tipo-epi" class="mb-2">Tipo EPI</Label>
        <Select
          id="filtro-tipo-epi"
          value={filters.tipoEpiId || ''}
          on:change={(e) => handleFilterInput('tipoEpiId', e.target.value)}
          size="sm"
          class="rounded-sm"
        >
          <option value="">Todos os EPIs</option>
          {#each tiposEpi as tipoEpi}
            <option value={tipoEpi.id}>{tipoEpi.nomeEquipamento} (CA {tipoEpi.numeroCA})</option>
          {/each}
        </Select>
      </div>
      
      <!-- Tipo de Movimentação -->
      <div>
        <Label for="filtro-tipo-movimentacao" class="mb-2">Tipo Movimentação</Label>
        <Select
          id="filtro-tipo-movimentacao"
          value={filters.tipoMovimentacao || ''}
          on:change={(e) => handleFilterInput('tipoMovimentacao', e.target.value)}
          size="sm"
          class="rounded-sm"
        >
          {#each tiposMovimentacao as tipo}
            <option value={tipo.value}>{tipo.label}</option>
          {/each}
        </Select>
      </div>
      
      <!-- Usuário Responsável -->
      <div>
        <Label for="filtro-usuario" class="mb-2">Responsável</Label>
        <Select
          id="filtro-usuario"
          value={filters.usuarioId || ''}
          on:change={(e) => handleFilterInput('usuarioId', e.target.value)}
          size="sm"
          class="rounded-sm"
        >
          <option value="">Todos os usuários</option>
          {#each usuarios as usuario}
            <option value={usuario.id}>{usuario.nome}</option>
          {/each}
        </Select>
      </div>
      
      <!-- Data Início -->
      <div>
        <Label for="filtro-data-inicio" class="mb-2">Data Início</Label>
        <Input
          id="filtro-data-inicio"
          type="date"
          value={filters.dataInicio || ''}
          on:input={(e) => handleFilterInput('dataInicio', e.target.value)}
          size="sm"
          class="rounded-sm"
        />
      </div>
      
      <!-- Data Fim -->
      <div>
        <Label for="filtro-data-fim" class="mb-2">Data Fim</Label>
        <Input
          id="filtro-data-fim"
          type="date"
          value={filters.dataFim || ''}
          on:input={(e) => handleFilterInput('dataFim', e.target.value)}
          size="sm"
          class="rounded-sm"
        />
      </div>
    </div>
    
    <!-- Ações dos Filtros -->
    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">{pagination.total}</span> movimentação(ões) encontrada(s)
        {#if hasFiltersApplied}
          <span class="text-blue-600 dark:text-blue-400">com filtros aplicados</span>
        {/if}
      </div>
      
      {#if hasFiltersApplied}
        <Button 
          size="sm" 
          color="alternative" 
          class="rounded-sm"
          on:click={() => dispatch('clearFilters')}
        >
          <TrashBinOutline class="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      {/if}
    </div>
  </Card>

  <!-- Conteúdo Principal -->
  {#if loading}
    <Card class="rounded-sm !max-w-none">
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    </Card>
  {:else if error}
    <ErrorDisplay 
      error={error}
      onRetry={() => dispatch('refresh')}
    />
  {:else if items.length === 0}
    <Card class="rounded-sm !max-w-none">
      <div class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          Nenhuma movimentação encontrada com os filtros aplicados.
        </div>
      </div>
    </Card>
  {:else}
    <!-- Tabela -->
    <Card class="rounded-sm !max-w-none overflow-hidden">
      <div class="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>ID</TableHeadCell>
            <TableHeadCell>Data</TableHeadCell>
            <TableHeadCell>Tipo Movimentação</TableHeadCell>
            <TableHeadCell>Quantidade</TableHeadCell>
            <TableHeadCell>EPI</TableHeadCell>
            <TableHeadCell>Almoxarifado</TableHeadCell>
            <TableHeadCell>Responsável</TableHeadCell>
            <TableHeadCell>Entrega</TableHeadCell>
            <TableHeadCell>Colaborador</TableHeadCell>
            <TableHeadCell>Documento</TableHeadCell>
            <TableHeadCell>Observações</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each items as movement}
              <TableBodyRow 
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                on:click={() => handleMovementClick(movement)}
              >
                <TableBodyCell class="font-medium">
                  <span class="text-xs font-mono">{truncateId(movement.id)}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="text-sm">
                    <div>{formatarData(movement.data)}</div>
                    <div class="text-xs text-gray-500">
                      {new Date(movement.data).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <Badge 
                    class="w-fit rounded-sm {getTipoMovimentacaoColor(movement.tipoMovimentacao)}"
                  >
                    {formatTipoMovimentacao(movement.tipoMovimentacao)}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-medium">{movement.quantidade}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="max-w-32 truncate" title={movement.tipoEpiNome || 'N/A'}>
                    {movement.tipoEpiNome || 'N/A'}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="text-sm">
                    {movement.almoxarifadoNome || 'N/A'}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="max-w-24 truncate" title={movement.usuarioNome}>
                    {movement.usuarioNome}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  {#if movement.entregaId}
                    <Badge color="blue" class="rounded-sm w-fit font-mono text-xs">
                      {movement.entregaId.substring(0, 8)}...
                    </Badge>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  {#if movement.colaboradorNome}
                    <div class="max-w-28 truncate" title={movement.colaboradorNome}>
                      <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {movement.colaboradorNome}
                      </span>
                    </div>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  {#if movement.documento}
                    <div class="text-xs font-mono text-blue-600 dark:text-blue-400">
                      {movement.documento}
                    </div>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  <div class="max-w-32 truncate" title={movement.observacoes || 'N/A'}>
                    {movement.observacoes || '-'}
                  </div>
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
      
      <!-- Paginação -->
      {#if pagination.totalPages > 1}
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex} a {endIndex} de {pagination.total} resultados
            </div>
            <Select
              value={pagination.pageSize.toString()}
              on:change={(e) => handleItemsPerPageChange(e.target.value)}
              size="sm"
              class="w-40 rounded-sm"
            >
              {#each itemsPerPageOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </Select>
          </div>
          
          <div class="flex space-x-2">
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm"
              disabled={pagination.page <= 1}
              on:click={() => handlePageClick(pagination.page - 1)}
            >
              Anterior
            </Button>
            
            <!-- Números das páginas -->
            {#each generatePageNumbers() as pageNum}
              <Button
                size="sm"
                color={pageNum === pagination.page ? 'primary' : 'alternative'}
                class="rounded-sm min-w-[40px]"
                on:click={() => handlePageClick(pageNum)}
              >
                {pageNum}
              </Button>
            {/each}
            
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm"
              disabled={pagination.page >= pagination.totalPages}
              on:click={() => handlePageClick(pagination.page + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      {/if}
    </Card>
  {/if}
</div>
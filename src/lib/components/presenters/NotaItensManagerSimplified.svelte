<!--
  Nota Itens Manager Simplificado - Sistema card-based inspirado no drawer de entregas
  
  Benefícios:
  - Interface mais simples e intuitiva
  - Preview imediato dos itens
  - Layout responsivo
  - Menos estados de interface
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Button, Input, Select, Card, Badge, Alert } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { tiposEpiAdapter } from '$lib/services/entity/tiposEpiAdapter';
  import { estoqueItensAdapter } from '$lib/services/entity/estoqueItensAdapter';
  import { notasMovimentacaoAdapter } from '$lib/services/process/notasMovimentacaoAdapter';
  import type { TipoNotaEnum } from '$lib/services/process/notasMovimentacaoTypes';
  import type { TipoEpiSelectOption } from '$lib/services/entity/tiposEpiAdapter';
  import type { EstoqueItemOption } from '$lib/services/entity/estoqueItensAdapter';

  // ==================== INTERFACES ====================

  export interface NotaItem {
    temp_id: string;
    quantidade: number;
    estoque_item_id?: string; // Para saídas/transferências
    tipo_epi_id?: string; // Para entradas
    custo_unitario?: number; // Para entradas
    // Campos para exibição
    equipamento_nome: string;
    categoria?: string;
    numero_ca?: string;
    quantidade_disponivel?: number;
  }

  // ==================== PROPS ====================

  export let tipo: TipoNotaEnum;
  export let almoxarifadoId: string;
  export let itens: NotaItem[] = [];
  export let readonly = false;
  export let currentNotaId: string = ''; // Para salvar custos de itens existentes

  // Track if we've loaded data to prevent auto-addition during data loading
  let hasLoadedData = false;

  // ==================== EVENT DISPATCHER ====================

  const dispatch = createEventDispatcher<{
    itensChanged: NotaItem[];
    validationError: string;
  }>();

  // ==================== STATE ====================

  // Opções carregadas
  let tipoEpiOptions: TipoEpiSelectOption[] = [];
  let estoqueItensOptions: EstoqueItemOption[] = [];
  let loadingOptions = false;

  // Estado de validação
  let validationErrors: { [tempId: string]: string } = {};

  // ==================== COMPUTED PROPERTIES ====================

  $: isEntrada = tipo === 'ENTRADA';
  $: usaTiposEpi = isEntrada;
  $: usaEstoqueItens = !isEntrada;

  // ==================== LIFECYCLE ====================

  onMount(async () => {
    console.log('🏗️ NotaItensManagerSimplified: Inicializando', { tipo, almoxarifadoId });
    await loadOptions();
  });

  // Recarregar quando tipo ou almoxarifado muda
  $: if (tipo || almoxarifadoId) {
    loadOptions();
  }

  // ==================== DATA LOADING ====================

  async function loadOptions(): Promise<void> {
    if (!almoxarifadoId && !usaTiposEpi) return;
    
    try {
      loadingOptions = true;
      
      if (usaTiposEpi) {
        // Para entradas: carregar tipos EPI
        tipoEpiOptions = await tiposEpiAdapter.obterOpcoesSelectComCache({ 
          apenasAtivos: true 
        });
        console.log('📦 Tipos EPI carregados:', tipoEpiOptions.length);
      } else {
        // Para saídas/transferências: carregar itens de estoque
        estoqueItensOptions = await estoqueItensAdapter.obterItensDisponiveisComCache(
          almoxarifadoId
        );
        console.log('📦 Itens de estoque carregados:', estoqueItensOptions.length);
      }
      
    } catch (error: any) {
      console.error('Erro ao carregar opções:', error);
      dispatch('validationError', 'Erro ao carregar opções disponíveis');
    } finally {
      loadingOptions = false;
    }
  }

  // ==================== ITEM MANAGEMENT ====================

  function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function adicionarItem(): void {
    const novoItem: NotaItem = {
      temp_id: generateTempId(),
      quantidade: 1,
      equipamento_nome: '',
      custo_unitario: isEntrada ? 0 : undefined
    };

    if (usaTiposEpi) {
      novoItem.tipo_epi_id = '';
    } else {
      novoItem.estoque_item_id = '';
    }

    itens = [...itens, novoItem];
    dispatch('itensChanged', itens);
    
    console.log('➕ Item adicionado:', novoItem.temp_id);
  }

  function removerItem(index: number): void {
    const item = itens[index];
    itens = itens.filter((_, i) => i !== index);
    
    // Limpar validação
    if (item && validationErrors[item.temp_id]) {
      delete validationErrors[item.temp_id];
      validationErrors = { ...validationErrors };
    }
    
    dispatch('itensChanged', itens);
    console.log('➖ Item removido:', item?.temp_id);
  }

  // Função auxiliar para eventos de select - compatível com Svelte
  function handleSelectChangeForItem(index: number, campo: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    atualizarItem(index, campo, target.value);
  }

  function atualizarItem(index: number, campo: string, valor: any): void {
    const item = itens[index];
    if (!item) return;

    // Atualizar campo
    (item as any)[campo] = valor;

    // Se mudou o EPI/item, buscar informações
    if (campo === 'tipo_epi_id' && valor) {
      const tipoEpi = tipoEpiOptions.find(opt => opt.value === valor);
      if (tipoEpi) {
        item.equipamento_nome = tipoEpi.label;
        item.categoria = tipoEpi.categoria;
        item.numero_ca = tipoEpi.numeroCA;
        
        // Sugestão de custo se disponível
        if (tipoEpi.custoSugerido && (!item.custo_unitario || item.custo_unitario === 0)) {
          item.custo_unitario = tipoEpi.custoSugerido;
        }
      }
    } else if (campo === 'estoque_item_id' && valor) {
      const estoqueItem = estoqueItensOptions.find(opt => opt.value === valor);
      if (estoqueItem) {
        item.equipamento_nome = estoqueItem.label;
        item.categoria = estoqueItem.categoria;
        item.numero_ca = estoqueItem.numeroCA;
        item.quantidade_disponivel = estoqueItem.quantidadeDisponivel;
      }
    }

    // Validação em tempo real
    validarItem(item);

    // Trigger update
    itens = [...itens];
    dispatch('itensChanged', itens);
  }

  function validarItem(item: NotaItem): void {
    validationErrors[item.temp_id] = '';

    // Validar campos obrigatórios
    if (usaTiposEpi && !item.tipo_epi_id) {
      validationErrors[item.temp_id] = 'Selecione um tipo de EPI';
      return;
    }

    if (usaEstoqueItens && !item.estoque_item_id) {
      validationErrors[item.temp_id] = 'Selecione um item do estoque';
      return;
    }

    if (!item.quantidade || item.quantidade <= 0) {
      validationErrors[item.temp_id] = 'Quantidade deve ser maior que zero';
      return;
    }

    // Validar quantidade disponível
    if (usaEstoqueItens && item.quantidade_disponivel !== undefined) {
      if (item.quantidade > item.quantidade_disponivel) {
        validationErrors[item.temp_id] = `Quantidade indisponível (máx: ${item.quantidade_disponivel})`;
        return;
      }
    }

    // Validar custo para entradas
    if (isEntrada && (!item.custo_unitario || item.custo_unitario <= 0)) {
      validationErrors[item.temp_id] = 'Custo unitário é obrigatório para entradas';
      return;
    }

    // Item válido
    validationErrors[item.temp_id] = '';
    dispatch('validationError', '');
  }

  // Validar todos os itens
  function validarTodos(): string[] {
    const erros: string[] = [];
    
    if (itens.length === 0) {
      erros.push('Adicione pelo menos um item');
    }

    itens.forEach((item, index) => {
      validarItem(item);
      if (validationErrors[item.temp_id]) {
        erros.push(`Item ${index + 1}: ${validationErrors[item.temp_id]}`);
      }
    });

    return erros;
  }

  // Funções auxiliares para eventos - compatível com Svelte
  function handleQuantidadeInputChange(event: Event, index: number): void {
    const target = event.currentTarget as HTMLInputElement;
    atualizarItem(index, 'quantidade', parseInt(target.value) || 1);
  }

  async function handleCustoInputChange(event: Event, index: number): Promise<void> {
    const target = event.currentTarget as HTMLInputElement;
    const novoCusto = target.value ? parseFloat(target.value) : 0;
    
    console.log('💰 HandleCustoInputChange:', {
      valor_input: target.value,
      novo_custo: novoCusto,
      index: index,
      item_id: itens[index]?.temp_id
    });
    
    if (novoCusto < 0) {
      const item = itens[index];
      if (item) {
        validationErrors[item.temp_id] = 'Custo unitário deve ser maior ou igual a zero';
      }
      return;
    }

    const item = itens[index];
    if (!item) return;

    // Se é item existente com ID, salvar no backend
    if (item.id && currentNotaId && item.tipo_epi_id) {
      try {
        await notasMovimentacaoAdapter.atualizarCustoUnitario(
          currentNotaId,
          item.tipo_epi_id,
          novoCusto
        );
        
        // Limpar erro de validação
        delete validationErrors[item.temp_id];
      } catch (error: any) {
        validationErrors[item.temp_id] = 'Erro ao salvar custo unitário';
        console.error('Erro ao atualizar custo unitário:', error);
        return;
      }
    }

    // Atualizar localmente
    atualizarItem(index, 'custo_unitario', novoCusto);
  }

  // Mark as loaded when we receive items with data
  $: if (itens.length > 0 && itens.some(item => item.tipo_epi_id || item.estoque_item_id)) {
    hasLoadedData = true;
  }

  // Only auto-add items in create mode, not when loading existing data
  $: if (itens.length === 0 && !readonly && (tipoEpiOptions.length > 0 || estoqueItensOptions.length > 0) && !hasLoadedData) {
    adicionarItem();
  }
</script>

<!-- Container principal -->
<div class="space-y-4">
  <!-- Header com botão adicionar -->
  <div class="flex items-center justify-between">
    <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
      Itens da Nota
      {#if itens.length > 0}
        <Badge color="dark" class="ml-2 rounded-sm">{itens.length}</Badge>
      {/if}
    </h4>
    
    {#if !readonly}
      <Button 
        size="sm" 
        color="primary" 
        class="rounded-sm"
        disabled={loadingOptions}
        on:click={adicionarItem}
      >
        <PlusOutline class="w-4 h-4 mr-2" />
        Adicionar Item
      </Button>
    {/if}
  </div>

  <!-- Loading state -->
  {#if loadingOptions}
    <div class="text-center py-8">
      <div class="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-primary-600 rounded-full" aria-label="loading">
        <span class="sr-only">Carregando...</span>
      </div>
      <p class="text-sm text-gray-500 mt-2">Carregando opções...</p>
    </div>
  {:else if itens.length === 0}
    <!-- Estado vazio -->
    <Card size="sm" class="text-center py-8">
      <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <PlusOutline class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {readonly ? 'Nenhum item encontrado' : 'Nenhum item adicionado'}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        {#if readonly}
          Esta nota não possui itens registrados
        {:else}
          {usaTiposEpi ? 'Adicione EPIs do catálogo' : 'Selecione itens do estoque'}
        {/if}
      </p>
      {#if !readonly}
        <Button size="sm" color="primary" class="rounded-sm" on:click={adicionarItem}>
          <PlusOutline class="w-4 h-4 mr-2" />
          Adicionar Primeiro Item
        </Button>
      {/if}
    </Card>
  {:else}
    <!-- Lista de itens - Layout card-based -->
    <div class="space-y-0">
      {#each itens as item, index (item.temp_id)}
        <div class="w-full border border-gray-200 dark:border-gray-700 rounded-sm p-4 bg-white dark:bg-gray-800">
          <!-- Header do card -->
          <div class="flex items-start justify-between mb-4">
            <h5 class="text-sm font-medium text-gray-900 dark:text-white">
              Item {index + 1}
              {#if item.equipamento_nome}
                <span class="font-normal text-gray-600 dark:text-gray-400">
                  - {item.equipamento_nome}
                </span>
              {/if}
            </h5>
            
            {#if !readonly && itens.length > 1}
              <button
                class="p-1 rounded-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-800/20 transition-colors"
                on:click={() => removerItem(index)}
                title="Remover item"
              >
                <TrashBinOutline class="w-4 h-4" />
              </button>
            {/if}
          </div>

          <!-- Campos do item -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Seleção de EPI/Item -->
            <div class="md:col-span-2">
              <label for="item-select-{index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {usaTiposEpi ? 'Tipo de EPI' : 'Item do Estoque'}
              </label>
              <Select
                id="item-select-{index}"
                value={usaTiposEpi ? item.tipo_epi_id : item.estoque_item_id}
                disabled={readonly}
                class="rounded-sm text-sm"
                on:change={(e) => handleSelectChangeForItem(index, usaTiposEpi ? 'tipo_epi_id' : 'estoque_item_id', e)}
              >
                <option value="">Selecione...</option>
                {#each usaTiposEpi ? tipoEpiOptions : estoqueItensOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </Select>
            </div>

            <!-- Quantidade -->
            <div>
              <label for="quantidade-{index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade
                {#if item.quantidade_disponivel !== undefined}
                  <span class="text-xs text-gray-500">(máx: {item.quantidade_disponivel})</span>
                {/if}
              </label>
              <Input
                id="quantidade-{index}"
                type="number"
                min="1"
                max={item.quantidade_disponivel || undefined}
                value={item.quantidade}
                disabled={readonly}
                placeholder="Qtd"
                class="rounded-sm text-sm"
                on:input={(e) => handleQuantidadeInputChange(e, index)}
              />
            </div>

            <!-- Custo unitário (apenas para entradas) -->
            {#if isEntrada}
              <div class="md:col-span-3">
                <label for="custo-{index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custo Unitário (R$)
                </label>
                <Input
                  id="custo-{index}"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.custo_unitario ?? ''}
                  disabled={readonly}
                  placeholder="Custo unitário (R$)"
                  class="rounded-sm text-sm"
                  on:input={(e) => handleCustoInputChange(e, index)}
                />
              </div>
            {/if}
          </div>

          <!-- Preview do item selecionado -->
          {#if item.equipamento_nome}
            <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-sm">
              <div class="flex items-start justify-between">
                <div>
                  <h6 class="text-sm font-medium text-gray-900 dark:text-white">
                    {item.equipamento_nome}
                  </h6>
                  {#if item.categoria}
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Categoria: {item.categoria}
                    </p>
                  {/if}
                  {#if item.numero_ca}
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      CA: {item.numero_ca}
                    </p>
                  {/if}
                </div>
                
                <!-- Resumo de valores -->
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Qtd: {item.quantidade}
                  </p>
                  {#if isEntrada && item.custo_unitario != null && typeof item.custo_unitario === 'number' && !isNaN(item.custo_unitario)}
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Unit: R$ {item.custo_unitario.toFixed(2)}
                    </p>
                    <p class="text-sm font-medium text-green-600 dark:text-green-400">
                      Total: R$ {(item.quantidade * item.custo_unitario).toFixed(2)}
                    </p>
                  {/if}
                  {#if item.quantidade_disponivel !== undefined}
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Disponível: {item.quantidade_disponivel}
                    </p>
                  {/if}
                </div>
              </div>
            </div>
          {/if}

          <!-- Erro de validação -->
          {#if validationErrors[item.temp_id]}
            <Alert color="red" class="mt-3 rounded-sm">
              <span class="text-sm">{validationErrors[item.temp_id]}</span>
            </Alert>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Resumo total -->
    {#if itens.length > 0}
      <div class="w-full border border-gray-200 dark:border-gray-700 rounded-sm p-4 bg-gray-50 dark:bg-gray-800">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              Total de Itens: {itens.length}
            </span>
            {#if isEntrada}
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                Valor Total: 
                <span class="text-lg font-bold text-green-600 dark:text-green-400">
                  R$ {itens.reduce((total, item) => {
                    const quantidade = item.quantidade || 0;
                    const custo = (item.custo_unitario != null && typeof item.custo_unitario === 'number' && !isNaN(item.custo_unitario)) ? item.custo_unitario : 0;
                    return total + (quantidade * custo);
                  }, 0).toFixed(2)}
                </span>
              </span>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
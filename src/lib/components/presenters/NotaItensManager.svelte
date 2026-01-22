<!--
  Nota Itens Manager - Componente para Gerenciamento de Itens da Nota
  
  Responsabilidades:
  - Gerenciar lista de itens temporários da nota
  - Interface para adicionar/remover/editar itens
  - Validação de quantidades disponíveis
  - Integração com adapters de tipos EPI e estoque
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Button, Input, Select, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Alert } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { almoxarifadosAdapter } from '$lib/services/entity/almoxarifadosAdapter';
  import { tiposEpiAdapter } from '$lib/services/entity/tiposEpiAdapter';
  import { estoqueItensAdapter } from '$lib/services/entity/estoqueItensAdapter';
  import { notasMovimentacaoAdapter } from '$lib/services/process/notasMovimentacaoAdapter';
  import type { TipoNotaEnum } from '$lib/services/process/notasMovimentacaoTypes';
  import type { TipoEpiSelectOption } from '$lib/services/entity/tiposEpiAdapter';
  import type { EstoqueItemOption } from '$lib/services/entity/estoqueItensAdapter';
  import type { AlmoxarifadoSelectOption } from '$lib/services/entity/almoxarifadosAdapter';

  // ==================== INTERFACES ====================

  export interface NotaItem {
    id?: string; // Para itens já salvos no backend
    temp_id: string; // ID temporário para controle local
    quantidade: number;
    estoque_item_id?: string; // Para saídas/transferências
    tipo_epi_id?: string; // Para entradas
    custo_unitario?: number; // Para entradas
    // Campos derivados para exibição
    equipamento_nome: string;
    categoria?: string;
    numero_ca?: string;
    quantidade_disponivel?: number; // Para validação de saídas
    almoxarifado_origem?: string; // Para transferências
  }

  // ==================== PROPS ====================

  export let tipo: TipoNotaEnum;
  export let almoxarifadoId: string;
  export let almoxarifadoDestinoId: string = '';
  export let itens: NotaItem[] = [];
  export let readonly = false;
  export let currentNotaId: string = ''; // Para salvar custos de itens existentes

  // ==================== EVENT DISPATCHER ====================

  const dispatch = createEventDispatcher<{
    itensChanged: NotaItem[];
    validationError: string;
  }>();

  // ==================== STATE ====================

  // Estados de adição de item
  let addingItem = false;
  let newItemForm = {
    item_id: '',
    quantidade: 1,
    custo_unitario: 0
  };

  // Opções carregadas dos adapters
  let almoxarifadoOptions: AlmoxarifadoSelectOption[] = [];
  let tipoEpiOptions: TipoEpiSelectOption[] = [];
  let estoqueItensOptions: EstoqueItemOption[] = [];
  let loadingOptions = false;

  // Estados de validação
  let validationErrors: { [tempId: string]: string } = {};

  // ==================== COMPUTED PROPERTIES ====================

  $: isEntrada = tipo === 'ENTRADA' || tipo === 'ENTRADA_AJUSTE';
  $: isSaida = tipo === 'DESCARTE' || tipo === 'SAIDA_AJUSTE';
  $: isTransferencia = tipo === 'TRANSFERENCIA';

  $: canAddItems = almoxarifadoId && (!isTransferencia || almoxarifadoDestinoId);
  $: hasItems = itens.length > 0;

  // ==================== LIFECYCLE ====================

  onMount(async () => {
    console.log('🏗️ NotaItensManager: Inicializando', { tipo, almoxarifadoId });
    await loadInitialOptions();
  });

  // Recarregar opções quando almoxarifado muda
  $: if (almoxarifadoId) {
    loadOptionsForAlmoxarifado(almoxarifadoId);
  }

  // ==================== DATA LOADING ====================

  async function loadInitialOptions(): Promise<void> {
    try {
      loadingOptions = true;
      
      // Carregar almoxarifados para transferências
      if (isTransferencia) {
        almoxarifadoOptions = await almoxarifadosAdapter.obterOpcoesSelectComCache();
      }

      // Carregar opções específicas baseadas no almoxarifado
      if (almoxarifadoId) {
        await loadOptionsForAlmoxarifado(almoxarifadoId);
      }
    } catch (error: any) {
      console.error('Erro ao carregar opções iniciais:', error);
    } finally {
      loadingOptions = false;
    }
  }

  async function loadOptionsForAlmoxarifado(almoxarifadoId: string): Promise<void> {
    try {
      if (isEntrada) {
        // Para entradas: carregar tipos de EPI
        tipoEpiOptions = await tiposEpiAdapter.obterOpcoesSelectComCache({ apenasAtivos: true });
      } else {
        // Para saídas/transferências: carregar itens de estoque disponíveis
        estoqueItensOptions = await estoqueItensAdapter.obterItensDisponiveisComCache(almoxarifadoId);
      }
    } catch (error: any) {
      console.error('Erro ao carregar opções para almoxarifado:', error);
    }
  }

  // ==================== ITEM MANAGEMENT ====================

  function handleAdicionarItem(): void {
    addingItem = true;
    resetNewItemForm();
  }

  function resetNewItemForm(): void {
    newItemForm = {
      item_id: '',
      quantidade: 1,
      custo_unitario: 0
    };
  }

  async function handleConfirmarItem(): Promise<void> {
    console.log('🔵 Iniciando adição de item:', {
      item_id: newItemForm.item_id,
      quantidade: newItemForm.quantidade,
      isEntrada,
      tipoEpiOptionsCount: tipoEpiOptions.length
    });

    if (!newItemForm.item_id || Number(newItemForm.quantidade) <= 0) {
      console.error('❌ Validação falhou: item_id ou quantidade inválidos');
      return;
    }

    try {
      let novoItem: NotaItem;

      if (isEntrada) {
        // Para entradas: usar tipo de EPI
        console.log('🔍 Procurando tipo EPI com ID:', newItemForm.item_id);
        console.log('🔍 Opções disponíveis:', tipoEpiOptions.map(t => ({ value: t.value, label: t.label })));
        
        const tipoEpi = tipoEpiOptions.find(t => t.value === newItemForm.item_id);
        
        if (!tipoEpi) {
          console.error('❌ Tipo EPI não encontrado!', { 
            procurado: newItemForm.item_id,
            disponíveis: tipoEpiOptions.map(t => t.value)
          });
          return;
        }

        console.log('✅ Tipo EPI encontrado:', tipoEpi);

        novoItem = {
          temp_id: generateTempId(),
          tipo_epi_id: tipoEpi.value,
          quantidade: Number(newItemForm.quantidade),
          custo_unitario: Number(newItemForm.custo_unitario) || tipoEpi.custoUnitario,
          equipamento_nome: tipoEpi.label,
          categoria: tipoEpi.categoria,
          numero_ca: tipoEpi.numeroCA
        };

        console.log('📦 Novo item criado:', novoItem);
      } else {
        // Para saídas/transferências: usar item de estoque
        console.log('🔍 Procurando item de estoque com ID:', newItemForm.item_id);
        console.log('🔍 Opções de estoque disponíveis:', estoqueItensOptions.map(e => ({ value: e.value, label: e.equipamento })));
        
        const estoqueItem = estoqueItensOptions.find(e => e.value === newItemForm.item_id);
        
        if (!estoqueItem) {
          console.error('❌ Item de estoque não encontrado!', { 
            procurado: newItemForm.item_id,
            disponíveis: estoqueItensOptions.map(e => e.value)
          });
          return;
        }

        console.log('✅ Item de estoque encontrado:', estoqueItem);

        // Validar quantidade disponível
        const validacao = await estoqueItensAdapter.validarQuantidadeDisponivel(
          estoqueItem.value,
          Number(newItemForm.quantidade)
        );

        if (!validacao.valido) {
          dispatch('validationError', validacao.motivo || 'Quantidade inválida');
          return;
        }

        novoItem = {
          temp_id: generateTempId(),
          estoque_item_id: estoqueItem.value,
          quantidade: Number(newItemForm.quantidade),
          equipamento_nome: estoqueItem.equipamento,
          categoria: estoqueItem.categoria,
          numero_ca: estoqueItem.numeroCA,
          quantidade_disponivel: estoqueItem.quantidadeMaxima,
          almoxarifado_origem: estoqueItem.almoxarifado
        };
      }

      // Verificar se item já existe na lista
      const itemExistente = itens.find(item => 
        (isEntrada && item.tipo_epi_id === novoItem.tipo_epi_id) ||
        (!isEntrada && item.estoque_item_id === novoItem.estoque_item_id)
      );

      if (itemExistente) {
        // Atualizar quantidade do item existente
        await handleQuantidadeChange(itemExistente.temp_id, itemExistente.quantidade + novoItem.quantidade);
      } else {
        // Adicionar novo item
        itens = [...itens, novoItem];
        emitItensChange();
      }

      // Fechar formulário
      addingItem = false;
      resetNewItemForm();

    } catch (error: any) {
      console.error('Erro ao adicionar item:', error);
      dispatch('validationError', 'Erro ao adicionar item');
    }
  }

  function handleCancelarItem(): void {
    addingItem = false;
    resetNewItemForm();
  }

  async function handleRemoverItem(tempId: string): Promise<void> {
    itens = itens.filter(item => item.temp_id !== tempId);
    delete validationErrors[tempId];
    emitItensChange();
  }

  async function handleQuantidadeChange(tempId: string, novaQuantidade: number): Promise<void> {
    if (novaQuantidade <= 0) {
      validationErrors[tempId] = 'Quantidade deve ser maior que zero';
      return;
    }

    const item = itens.find(i => i.temp_id === tempId);
    if (!item) return;

    // Validar quantidade para saídas/transferências
    if (!isEntrada && item.estoque_item_id) {
      try {
        const validacao = await estoqueItensAdapter.validarQuantidadeDisponivel(
          item.estoque_item_id,
          novaQuantidade
        );

        if (!validacao.valido) {
          validationErrors[tempId] = validacao.motivo || 'Quantidade inválida';
          return;
        }
      } catch (error: any) {
        validationErrors[tempId] = 'Erro ao validar quantidade';
        return;
      }
    }

    // Limpar erro de validação
    delete validationErrors[tempId];

    // Atualizar quantidade
    itens = itens.map(i => 
      i.temp_id === tempId 
        ? { ...i, quantidade: novaQuantidade }
        : i
    );

    emitItensChange();
  }

  async function handleCustoUnitarioChange(tempId: string, novoCusto: number): Promise<void> {
    if (novoCusto < 0) {
      validationErrors[tempId] = 'Custo unitário deve ser maior ou igual a zero';
      return;
    }

    const item = itens.find(i => i.temp_id === tempId);
    if (!item) return;

    // Se não tem ID ou não tem nota ID, apenas atualizar localmente
    if (!item.id || !currentNotaId || !item.tipo_epi_id) {
      handleCustoUnitarioLocalChange(tempId, novoCusto);
      return;
    }

    try {
      // Item existente com ID - salvar no backend usando novo endpoint
      await notasMovimentacaoAdapter.atualizarCustoUnitario(
        currentNotaId,
        item.tipo_epi_id,
        novoCusto
      );

      // Limpar erro de validação
      delete validationErrors[tempId];

      // Atualizar item local
      itens = itens.map(i => 
        i.temp_id === tempId 
          ? { ...i, custo_unitario: novoCusto }
          : i
      );

      emitItensChange();
      
    } catch (error: any) {
      validationErrors[tempId] = 'Erro ao salvar custo unitário';
      console.error('Erro ao atualizar custo unitário:', error);
    }
  }

  function handleCustoUnitarioLocalChange(tempId: string, novoCusto: number): void {
    // Atualização local (para itens novos)
    itens = itens.map(i => 
      i.temp_id === tempId 
        ? { ...i, custo_unitario: novoCusto }
        : i
    );
    emitItensChange();
  }

  function emitItensChange(): void {
    console.log('📤 Emitindo mudança de itens:', itens.map(item => ({
      temp_id: item.temp_id,
      tipo_epi_id: item.tipo_epi_id,
      estoque_item_id: item.estoque_item_id,
      quantidade: item.quantidade,
      custo_unitario: item.custo_unitario,
      custo_tipo: typeof item.custo_unitario
    })));
    dispatch('itensChanged', itens);
  }

  function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== VALIDATION ====================

  function getTotalItens(): number {
    return itens.reduce((total, item) => total + item.quantidade, 0);
  }

  function getTotalValor(): number {
    return itens.reduce((total, item) => {
      const custo = (item.custo_unitario != null && 
                    typeof item.custo_unitario === 'number' && 
                    !isNaN(item.custo_unitario)) ? item.custo_unitario : 0;
      return total + (custo * item.quantidade);
    }, 0);
  }

  function hasValidationErrors(): boolean {
    return Object.keys(validationErrors).length > 0;
  }

  // Funções auxiliares para eventos - compatível com Svelte
  function handleCustoUnitarioInputChange(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    const value = target.value;
    newItemForm.custo_unitario = value ? parseFloat(value) : 0;
  }

  function handleQuantidadeItemInputChange(event: Event, tempId: string): void {
    const target = event.currentTarget as HTMLInputElement;
    handleQuantidadeChange(tempId, parseInt(target.value) || 0);
  }
</script>

<div class="space-y-4">
  <!-- Header com resumo -->
  <div class="flex items-center justify-between">
    <div>
      <h4 class="text-lg font-medium text-gray-900 dark:text-white">
        Itens da Nota {#if hasItems}({getTotalItens()} {getTotalItens() === 1 ? 'item' : 'itens'}){/if}
      </h4>
      {#if isEntrada && getTotalValor() > 0}
        <p class="text-sm text-gray-500">
          Valor total: R$ {getTotalValor().toFixed(2)}
        </p>
      {/if}
    </div>

    {#if canAddItems && !readonly}
      <Button
        size="sm"
        color="primary"
        class="rounded-sm"
        on:click={handleAdicionarItem}
        disabled={addingItem || loadingOptions}
      >
        <PlusOutline class="w-4 h-4 mr-2" />
        Adicionar Item
      </Button>
    {/if}
  </div>

  <!-- Alertas de requisitos -->
  {#if !canAddItems}
    <Alert color="yellow" class="text-sm">
      {#if !almoxarifadoId}
        Selecione um almoxarifado para adicionar itens.
      {:else if isTransferencia && !almoxarifadoDestinoId}
        Selecione o almoxarifado de destino para adicionar itens.
      {/if}
    </Alert>
  {/if}

  <!-- Formulário de adição de item -->
  {#if addingItem}
    <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
      <h5 class="text-sm font-medium mb-3">
        {isEntrada ? 'Adicionar Tipo de EPI' : 'Adicionar Item do Estoque'}
      </h5>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Seleção do item -->
        <div class="md:col-span-2">
          <Select
            bind:value={newItemForm.item_id}
            disabled={loadingOptions}
            class="rounded-sm text-sm"
            placeholder={isEntrada ? 'Selecione um tipo de EPI...' : 'Selecione um item do estoque...'}
          >
            <option value="">
              {isEntrada ? 'Selecione um tipo de EPI' : 'Selecione um item do estoque'}
            </option>
            
            {#if isEntrada}
              {#each tipoEpiOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            {:else}
              {#each estoqueItensOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            {/if}
          </Select>
        </div>

        <!-- Quantidade -->
        <div>
          <Input
            type="number"
            min="1"
            bind:value={newItemForm.quantidade}
            placeholder="Qtd"
            class="rounded-sm text-sm"
          />
        </div>

        <!-- Custo unitário (apenas para entradas) -->
        {#if isEntrada}
          <div class="md:col-span-3">
            <Input
              type="number"
              min="0"
              step="0.01"
              bind:value={newItemForm.custo_unitario}
              placeholder="Custo unitário (R$)"
              class="rounded-sm text-sm"
              on:input={handleCustoUnitarioInputChange}
            />
          </div>
        {/if}
      </div>

      <!-- Botões de ação -->
      <div class="flex justify-end space-x-2 mt-4">
        <Button
          size="sm"
          color="alternative"
          class="rounded-sm"
          on:click={handleCancelarItem}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          color="primary"
          class="rounded-sm"
          on:click={handleConfirmarItem}
          disabled={!newItemForm.item_id || Number(newItemForm.quantidade) <= 0}
        >
          Adicionar
        </Button>
      </div>
    </div>
  {/if}

  <!-- Lista de itens -->
  {#if hasItems}
    <div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <Table hoverable={true}>
        <TableHead>
          <TableHeadCell>Equipamento</TableHeadCell>
          <TableHeadCell>Categoria</TableHeadCell>
          <TableHeadCell>CA</TableHeadCell>
          <TableHeadCell>Quantidade</TableHeadCell>
          {#if isEntrada}
            <TableHeadCell>Custo Unit.</TableHeadCell>
            <TableHeadCell>Subtotal</TableHeadCell>
          {:else}
            <TableHeadCell>Disponível</TableHeadCell>
          {/if}
          {#if !readonly}
            <TableHeadCell>Ações</TableHeadCell>
          {/if}
        </TableHead>
        <TableBody>
          {#each itens as item (item.temp_id)}
            <TableBodyRow>
              <TableBodyCell class="font-medium">
                {item.equipamento_nome}
              </TableBodyCell>
              <TableBodyCell>
                <Badge color="dark" class="w-fit rounded-sm">
                  {item.categoria || 'N/A'}
                </Badge>
              </TableBodyCell>
              <TableBodyCell class="text-sm text-gray-600">
                {item.numero_ca || 'N/A'}
              </TableBodyCell>
              <TableBodyCell>
                {#if readonly}
                  <span class="font-medium">{item.quantidade}</span>
                {:else}
                  <Input
                    type="number"
                    min="1"
                    max={item.quantidade_disponivel}
                    value={item.quantidade}
                    class="w-20 text-sm rounded-sm {validationErrors[item.temp_id] ? 'border-red-500' : ''}"
                    on:input={(e) => handleQuantidadeItemInputChange(e, item.temp_id)}
                  />
                  {#if validationErrors[item.temp_id]}
                    <p class="text-xs text-red-500 mt-1">{validationErrors[item.temp_id]}</p>
                  {/if}
                {/if}
              </TableBodyCell>
              
              {#if isEntrada}
                <TableBodyCell class="text-sm">
                  {#if readonly}
                    {#if item.custo_unitario != null && typeof item.custo_unitario === 'number' && !isNaN(item.custo_unitario)}
                      R$ {item.custo_unitario.toFixed(2)}
                    {:else}
                      <span class="text-gray-400">N/A</span>
                    {/if}
                  {:else}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.custo_unitario || 0}
                      class="w-24 text-sm rounded-sm {validationErrors[item.temp_id] ? 'border-red-500' : ''}"
                      on:blur={(e) => handleCustoUnitarioChange(item.temp_id, parseFloat(e.currentTarget.value) || 0)}
                    />
                  {/if}
                </TableBodyCell>
                <TableBodyCell class="text-sm font-medium">
                  {#if item.custo_unitario != null && typeof item.custo_unitario === 'number' && !isNaN(item.custo_unitario)}
                    R$ {(item.custo_unitario * item.quantidade).toFixed(2)}
                  {:else}
                    <span class="text-gray-400">N/A</span>
                  {/if}
                </TableBodyCell>
              {:else}
                <TableBodyCell class="text-sm text-gray-600">
                  {item.quantidade_disponivel || 'N/A'}
                </TableBodyCell>
              {/if}

              {#if !readonly}
                <TableBodyCell>
                  <Button
                    size="xs"
                    color="red"
                    class="rounded-sm"
                    on:click={() => handleRemoverItem(item.temp_id)}
                  >
                    <TrashBinOutline class="w-3 h-3" />
                  </Button>
                </TableBodyCell>
              {/if}
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    <!-- Resumo final -->
    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Total: {getTotalItens()} {getTotalItens() === 1 ? 'item' : 'itens'}
      </div>
      {#if isEntrada && getTotalValor() > 0}
        <div class="text-sm font-medium">
          Total: R$ {getTotalValor().toFixed(2)}
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p class="text-sm">Nenhum item adicionado ainda.</p>
      {#if canAddItems && !readonly}
        <p class="text-xs mt-1">
          Clique em "Adicionar Item" para começar.
        </p>
      {/if}
    </div>
  {/if}

  <!-- Validações globais -->
  {#if hasValidationErrors()}
    <Alert color="red" class="text-sm">
      Corrija os erros nos itens antes de continuar.
    </Alert>
  {/if}
</div>
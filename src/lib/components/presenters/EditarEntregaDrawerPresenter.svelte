<!--
  Editar Entrega Drawer Presenter - Componente "Burro"
  
  Presenter para edição de entrega existente:
  - Reutiliza lógica similar ao NovaEntregaDrawerPresenter
  - Pré-popula campos com dados da entrega
  - Mantém layout idêntico
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Input, Select, Label } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline, CheckOutline, RefreshOutline } from 'flowbite-svelte-icons';
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  import type { 
    EPIDisponivel,
    NovaEntregaFormData
  } from '$lib/services/process';

  // ==================== PROPS ====================
  
  export let episDisponiveis: EPIDisponivel[] = [];
  export let entrega: any = null; // Entrega a ser editada
  export let loading: boolean = false;
  export let show: boolean = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    salvar: NovaEntregaFormData;
    cancelar: void;
  }>();

  // ==================== LOCAL STATE ====================
  
  let responsavelEntrega = '';
  let itensSelecionados: Array<{
    episDisponivelId: string;
    nomeEquipamento: string;
    registroCA: string;
    quantidade: number;
  }> = [];

  // Validation state
  let errors: Record<string, string> = {};

  // ==================== LIFECYCLE ====================
  
  // Populate form when entrega changes
  $: if (show && entrega) {
    populateForm();
  }

  // ==================== FORM MANAGEMENT ====================
  
  function populateForm(): void {
    if (!entrega) return;

    responsavelEntrega = 'Responsável da Entrega'; // Mockado - em produção viria de entrega.responsavel
    
    // Mockado - em produção viria de entrega.itens
    itensSelecionados = [
      {
        episDisponivelId: '1', // Encontrar correspondência com episDisponiveis
        nomeEquipamento: 'Capacete de Segurança',
        registroCA: '31469',
        quantidade: 1
      }
    ];
    
    errors = {};
  }

  function resetForm(): void {
    responsavelEntrega = '';
    itensSelecionados = [];
    errors = {};
  }

  function adicionarItem(): void {
    itensSelecionados = [...itensSelecionados, {
      episDisponivelId: '',
      nomeEquipamento: '',
      registroCA: '',
      quantidade: 1
    }];
  }

  function removerItem(index: number): void {
    itensSelecionados = itensSelecionados.filter((_, i) => i !== index);
  }

  // Função auxiliar para eventos de select - compatível com Svelte
  function handleEPISelectChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    atualizarEPI(index, target.value);
  }

  function atualizarEPI(index: number, episDisponivelId: string): void {
    const epiSelecionado = episDisponiveis.find(epi => epi.id === episDisponivelId);
    if (epiSelecionado) {
      itensSelecionados[index] = {
        ...itensSelecionados[index],
        episDisponivelId,
        nomeEquipamento: epiSelecionado.nomeEquipamento,
        registroCA: epiSelecionado.registroCA
      };
      
      // Clear validation error for this item
      delete errors[`item-${index}`];
      errors = { ...errors };
    }
  }

  function atualizarQuantidade(index: number, quantidade: number): void {
    itensSelecionados[index] = {
      ...itensSelecionados[index],
      quantidade
    };
    
    // Clear validation error
    delete errors[`quantidade-${index}`];
    errors = { ...errors };
  }

  // ==================== VALIDATION ====================
  
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    // Validate responsavel
    if (!responsavelEntrega.trim()) {
      newErrors.responsavel = 'Responsável é obrigatório';
    }

    // Validate items
    if (itensSelecionados.length === 0) {
      newErrors.items = 'Adicione pelo menos um item';
    }

    // Validate each item
    itensSelecionados.forEach((item, index) => {
      if (!item.episDisponivelId) {
        newErrors[`item-${index}`] = 'Selecione um EPI';
      }
      if (item.quantidade < 1) {
        newErrors[`quantidade-${index}`] = 'Quantidade deve ser maior que 0';
      }
    });

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  // ==================== EVENT HANDLERS ====================
  
  function handleSalvar(): void {
    if (!validateForm()) {
      return;
    }

    const formData: NovaEntregaFormData = {
      responsavel: responsavelEntrega.trim(),
      usuarioResponsavelId: responsavelEntrega.trim(),
      responsavelId: responsavelEntrega.trim(),
      itens: itensSelecionados.map(item => ({
        episDisponivelId: item.episDisponivelId,
        nomeEquipamento: item.nomeEquipamento,
        registroCA: item.registroCA,
        quantidade: item.quantidade,
        estoqueItemId: item.episDisponivelId
      }))
    };

    dispatch('salvar', formData);
  }

  function handleCancelar(): void {
    dispatch('cancelar');
  }

  // Função auxiliar para eventos de input - compatível com Svelte
  function handleQuantidadeInputChange(event: Event, index: number): void {
    const target = event.currentTarget as HTMLInputElement;
    atualizarQuantidade(index, parseInt(target.value) || 1);
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: episOptions = [
    { value: '', label: 'Selecione um EPI...', name: 'select' },
    ...episDisponiveis
      .filter(epi => epi.disponivel)
      .map(epi => ({
        value: epi.id,
        label: `${epi.nomeEquipamento} (CA ${epi.registroCA})${epi.quantidade ? ` - ${epi.quantidade} disponíveis` : ''}`,
        name: epi.nomeEquipamento
      }))
  ];

  $: canSave = responsavelEntrega.trim() && itensSelecionados.length > 0 && !loading;
</script>

{#if show}
  <!-- Overlay -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity"
    on:click={handleCancelar}
    role="presentation"
  ></div>

  <!-- Drawer -->
  <div 
    class="fixed top-16 right-0 h-[calc(100vh-4rem)] w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out"
    on:click|stopPropagation
    role="dialog"
    aria-modal="true"
  >
    
    <!-- Header -->
    <DrawerHeader 
      title="Editar Entrega #{entrega?.id || ''}" 
      on:close={handleCancelar}
    />

    <!-- Content -->
    <div class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6" style="height: calc(100% - 80px);">
        
        <!-- Info da Entrega Original -->
        {#if entrega}
          <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Informações da Entrega Original
            </h4>
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p>• Data: {new Date(entrega.dataEntrega).toLocaleDateString('pt-BR')}</p>
              <p>• Status: {entrega.status === 'assinado' ? 'Assinado' : 'Pendente Assinatura'}</p>
              <p>• ID: #{entrega.id}</p>
            </div>
          </div>
        {/if}
        
        <!-- Responsável -->
        <div class="mb-6">
          <Label for="responsavel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Responsável pela Entrega *
          </Label>
          <Input
            id="responsavel"
            type="text"
            placeholder="Nome do responsável pela entrega"
            bind:value={responsavelEntrega}
            class="rounded-sm {errors.responsavel ? 'border-red-500' : ''}"
            disabled={loading}
          />
          {#if errors.responsavel}
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.responsavel}
            </p>
          {/if}
        </div>

        <!-- EPIs para Entrega -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              EPIs da Entrega *
            </Label>
            <Button
              size="xs"
              color="alternative"
              class="rounded-sm"
              on:click={adicionarItem}
              disabled={loading}
            >
              <PlusOutline class="mr-2 w-4 h-4" />
              Adicionar Item
            </Button>
          </div>

          {#if errors.items}
            <p class="mb-3 text-sm text-red-600 dark:text-red-400">
              {errors.items}
            </p>
          {/if}

          <div class="space-y-4">
            {#each itensSelecionados as item, index}
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="flex items-start justify-between mb-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                    Item {index + 1}
                  </h4>
                  {#if itensSelecionados.length > 1}
                    <button
                      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      on:click={() => removerItem(index)}
                      disabled={loading}
                      title="Remover item"
                    >
                      <TrashBinOutline class="w-4 h-4" />
                    </button>
                  {/if}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- EPI Selection -->
                  <div class="md:col-span-2">
                    <Label for="epi-{index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Equipamento
                    </Label>
                    <Select
                      id="epi-{index}"
                      items={episOptions}
                      bind:value={item.episDisponivelId}
                      on:change={(e) => handleEPISelectChange(index, e)}
                      class="rounded-sm {errors[`item-${index}`] ? 'border-red-500' : ''}"
                      disabled={loading}
                    />
                    {#if errors[`item-${index}`]}
                      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors[`item-${index}`]}
                      </p>
                    {/if}
                  </div>

                  <!-- Quantidade -->
                  <div>
                    <Label for="quantidade-{index}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantidade
                    </Label>
                    <Input
                      id="quantidade-{index}"
                      type="number"
                      min="1"
                      max="100"
                      bind:value={item.quantidade}
                      on:input={(e) => handleQuantidadeInputChange(e, index)}
                      class="rounded-sm {errors[`quantidade-${index}`] ? 'border-red-500' : ''}"
                      disabled={loading}
                    />
                    {#if errors[`quantidade-${index}`]}
                      <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors[`quantidade-${index}`]}
                      </p>
                    {/if}
                  </div>
                </div>

                <!-- Preview do EPI selecionado -->
                {#if item.nomeEquipamento}
                  <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-sm">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                          {item.nomeEquipamento}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          CA {item.registroCA}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                          Qtd: {item.quantidade}
                        </p>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            {/each}

            <!-- Add first item button if no items -->
            {#if itensSelecionados.length === 0}
              <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <PlusOutline class="mx-auto mb-3 text-gray-400 w-8 h-8" />
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Nenhum item na entrega
                </p>
                <Button
                  size="sm"
                  color="alternative"
                  class="rounded-sm"
                  on:click={adicionarItem}
                  disabled={loading}
                >
                  Adicionar Primeiro Item
                </Button>
              </div>
            {/if}
          </div>
        </div>

        <!-- Summary -->
        {#if itensSelecionados.length > 0}
          <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 class="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Resumo das Alterações
            </h4>
            <div class="text-sm text-yellow-800 dark:text-yellow-200">
              <p>• Total de itens: {itensSelecionados.length}</p>
              <p>• Quantidade total: {itensSelecionados.reduce((sum, item) => sum + item.quantidade, 0)} unidades</p>
              <p>• Responsável: {responsavelEntrega || 'Não informado'}</p>
            </div>
          </div>
        {/if}

      </div>

      <!-- Footer Actions -->
      <div class="flex-shrink-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-end space-x-3">
          <Button
            color="alternative"
            class="rounded-sm"
            on:click={handleCancelar}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            class="rounded-sm"
            on:click={handleSalvar}
            disabled={!canSave}
          >
            {#if loading}
              <RefreshOutline class="mr-2 animate-spin w-4 h-4" />
              Salvando...
            {:else}
              <CheckOutline class="mr-2 w-4 h-4" />
              Salvar Alterações
            {/if}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Scrollbar customization */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    background-clip: content-box;
  }
</style>
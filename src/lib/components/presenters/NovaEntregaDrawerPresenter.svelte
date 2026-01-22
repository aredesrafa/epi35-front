<!--
  Nova Entrega Drawer Presenter - Componente "Burro"
  
  Presenter especializado para o formulário de nova entrega:
  - Recebe dados via props
  - Renderiza formulário com validação visual
  - Emite eventos para o Container
  - Mantém layout original
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Input, Label } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline, CheckOutline, CloseOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  // 🚀 MIGRADO: Importar tipos das novas interfaces
  import type { EPIDisponivel, NovaEntregaFormData } from '$lib/services/process';

  // ==================== PROPS ====================
  
  export let episDisponiveis: EPIDisponivel[] = [];
  export let usuarios: Array<{id: string; nome: string; email: string;}> = [];
  export let loading: boolean = false;
  export let show: boolean = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    salvar: NovaEntregaFormData;
    cancelar: void;
  }>();

  // ==================== LOCAL STATE ====================
  
  let responsavelEntrega = '';
  let usuarioResponsavelId = '';
  let itensSelecionados: Array<{
    episDisponivelId: string;
    nomeEquipamento: string;
    registroCA: string;
    quantidade: number;
  }> = [];


  // ==================== LIFECYCLE ====================
  
  // Reset form when drawer opens
  $: if (show && itensSelecionados.length === 0) {
    resetForm();
    // Adicionar automaticamente o primeiro item para melhor UX
    adicionarItem();
  }

  // Auto-select first user when users are loaded
  $: if (usuarios.length > 0 && !usuarioResponsavelId) {
    usuarioResponsavelId = usuarios[0].id;
    responsavelEntrega = usuarios[0].nome;
  }

  // ==================== FORM MANAGEMENT ====================
  
  function resetForm(): void {
    responsavelEntrega = '';
    usuarioResponsavelId = '';
    itensSelecionados = [];
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

  function atualizarEPI(index: number, episDisponivelId: string): void {
    const epiSelecionado = episDisponiveis.find(epi => epi.id === episDisponivelId);
    if (epiSelecionado) {
      itensSelecionados[index] = {
        ...itensSelecionados[index],
        episDisponivelId,
        nomeEquipamento: epiSelecionado.nomeEquipamento,
        registroCA: epiSelecionado.numeroCA || epiSelecionado.registroCA
      };
    }
  }

  function atualizarQuantidade(index: number, quantidade: number): void {
    itensSelecionados[index] = {
      ...itensSelecionados[index],
      quantidade
    };
  }

  function atualizarUsuario(usuarioId: string): void {
    const usuarioSelecionado = usuarios.find(user => user.id === usuarioId);
    if (usuarioSelecionado) {
      usuarioResponsavelId = usuarioId;
      responsavelEntrega = usuarioSelecionado.nome;
    }
  }

  // ==================== VALIDATION ====================
  
  function validateForm(): boolean {
    // Validação simples: verificar se usuário está selecionado e itens estão válidos
    return !!usuarioResponsavelId.trim() && 
           itensSelecionados.length > 0 && 
           itensSelecionados.every(item => item.episDisponivelId && item.quantidade > 0);
  }

  // ==================== EVENT HANDLERS ====================
  
  function handleSalvar(): void {
    console.log('📝 NovaEntregaDrawer: Preparando dados do formulário...');
    console.log('📋 Itens selecionados originais:', itensSelecionados);
    console.log('👤 Usuario responsável ID:', usuarioResponsavelId);
    console.log('📦 Validando itens...');
    
    // Validação antes de criar o payload
    if (!usuarioResponsavelId.trim()) {
      console.error('❌ Erro: usuário responsável não selecionado');
      return;
    }
    
    if (itensSelecionados.length === 0) {
      console.error('❌ Erro: nenhum item selecionado');
      return;
    }
    
    const itensValidos = itensSelecionados.filter(item => item.episDisponivelId && item.quantidade > 0);
    if (itensValidos.length === 0) {
      console.error('❌ Erro: nenhum item válido selecionado');
      return;
    }
    
    const formData: NovaEntregaFormData = {
      responsavel: responsavelEntrega.trim(),
      usuarioResponsavelId: usuarioResponsavelId.trim(),
      responsavelId: usuarioResponsavelId.trim(),
      itens: itensValidos.map(item => ({
        episDisponivelId: item.episDisponivelId,
        nomeEquipamento: item.nomeEquipamento,
        registroCA: item.registroCA,
        quantidade: item.quantidade,
        estoqueItemId: item.episDisponivelId
      }))
    };

    console.log('✅ FormData montado:', {
      responsavel: formData.responsavel,
      usuarioId: formData.usuarioResponsavelId,
      totalItens: formData.itens.length,
      itens: formData.itens.map((item, index) => ({
        index: index + 1,
        id: item.episDisponivelId,
        nome: item.nomeEquipamento,
        ca: item.registroCA,
        quantidade: item.quantidade
      }))
    });

    // ✅ VALIDAÇÃO CRÍTICA: Verificar se temos diferentes tipos de EPI
    const tiposUnicos = new Set(formData.itens.map(item => item.episDisponivelId));
    console.log(`🎯 Verificação de tipos únicos: ${tiposUnicos.size} tipos únicos de ${formData.itens.length} itens totais`);
    
    if (tiposUnicos.size < formData.itens.length) {
      console.warn('⚠️ ALERTA: Alguns itens têm o mesmo episDisponivelId - isso pode causar problemas na expansão');
    }

    dispatch('salvar', formData);
  }

  function handleCancelar(): void {
    dispatch('cancelar');
  }

  // Função auxiliar para eventos de input - compatível com Svelte
  function handleQuantidadeInput(event: Event, index: number): void {
    const target = event.currentTarget as HTMLInputElement;
    atualizarQuantidade(index, parseInt(target.value) || 1);
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: episOptions = [
    { value: '', label: 'Selecione um EPI...' },
    ...episDisponiveis.map(epi => ({
      value: epi.id,
      label: `${epi.nomeEquipamento} (CA ${epi.numeroCA || epi.registroCA}) - ${epi.quantidadeDisponivel} disponíveis`
    }))
  ];

  // Debug reativo para EPIs
  $: if (episDisponiveis?.length > 0) {
    console.log('🎯 NovaEntregaDrawer: EPIs disponíveis atualizados:', episDisponiveis.length);
    console.log('📦 Amostra de EPIs no drawer:', episDisponiveis.slice(0, 2));
    console.log('🔧 Opções do select:', episOptions.slice(0, 3));
  }

  $: usuarioOptions = [
    { value: '', label: 'Selecione um responsável...' },
    ...usuarios.map(user => ({
      value: user.id,
      label: `${user.nome} (${user.email})`
    }))
  ];

  $: canSave = usuarioResponsavelId.trim() && itensSelecionados.length > 0 && !loading && episDisponiveis.length > 0;
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
      title="Nova Entrega de EPI"
      objectType="NOVA ENTREGA"
      iconName="PlusOutline"
      primaryAction={{
        text: loading ? 'Salvando...' : 'Criar Entrega',
        icon: loading ? '' : 'CheckOutline',
        disabled: !canSave
      }}
      secondaryAction={{
        text: 'Cancelar',
        disabled: loading
      }}
      on:close={handleCancelar}
      on:primaryAction={handleSalvar}
      on:secondaryAction={handleCancelar}
    />

    <!-- Content -->
    <div class="overflow-y-auto custom-scrollbar p-6" style="height: calc(100% - 80px);">
        
        <!-- Responsável -->
        <div class="mb-6">
          <Label for="responsavel" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Responsável pela Entrega *
          </Label>
          <SearchableDropdown
            options={usuarioOptions}
            value={usuarioResponsavelId}
            placeholder="Selecione um responsável..."
            disabled={loading}
            on:change={(e) => atualizarUsuario(e.detail)}
          />
        </div>

        <!-- EPIs para Entrega -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              EPIs para Entrega *
            </Label>
            <Button
              size="xs"
              color="alternative"
              class="rounded-sm"
              on:click={adicionarItem}
              disabled={loading}
            >
              <PlusOutline class="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>


          {#if episDisponiveis.length === 0}
            <div class="p-4 border-2 border-dashed border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div class="text-center">
                <ExclamationCircleOutline class="mx-auto mb-2 text-red-500 w-8 h-8" />
                <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Nenhum EPI Disponível
                </h4>
                <p class="text-sm text-red-600 dark:text-red-400">
                  Não há EPIs disponíveis para entrega no momento. Verifique o estoque ou entre em contato com o administrador.
                </p>
              </div>
            </div>
          {:else}
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
                    <SearchableDropdown
                      options={episOptions}
                      value={item.episDisponivelId}
                      placeholder="Selecione um EPI..."
                      disabled={loading}
                      on:change={(e) => atualizarEPI(index, e.detail)}
                    />
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
                      on:input={(e) => handleQuantidadeInput(e, index)}
                      class="rounded-sm"
                      disabled={loading}
                    />
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
                <PlusOutline class="w-8 h-8 mx-auto mb-3 text-gray-400" />
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Nenhum item adicionado
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
          {/if}
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
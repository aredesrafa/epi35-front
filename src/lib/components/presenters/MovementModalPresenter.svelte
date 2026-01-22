<!--
  Movement Modal Presenter - Componente "Burro" com Layout Original
  
  Este presenter é puramente apresentacional:
  - Recebe dados via props
  - Renderiza modal IDÊNTICO ao original
  - Emite eventos save/cancel para o Container
  - Não contém lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal, Button, Input, Label, Textarea, Radio } from 'flowbite-svelte';
  import type { ItemEstoqueDTO, TipoEPIDTO, NovaMovimentacaoForm } from '$lib/types/serviceTypes';

  // ==================== PROPS ====================
  
  export let item: ItemEstoqueDTO | null = null;
  export let loading: boolean = false;
  export let show: boolean = true;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    save: NovaMovimentacaoForm;
    cancel: void;
  }>();

  // ==================== LOCAL STATE ====================
  
  let formData = {
    tipo: 'entrada' as 'entrada' | 'saida',
    quantidade: 0,
    motivo: ''
  };

  let errors: Record<string, string> = {};

  // ==================== LIFECYCLE ====================
  
  // Reset form when modal opens/closes
  $: if (show && item) {
    resetForm();
  }

  // ==================== FUNCTIONS ====================
  
  function resetForm() {
    formData = {
      tipo: 'entrada',
      quantidade: 0,
      motivo: ''
    };
    errors = {};
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.quantidade || formData.quantidade === 0) {
      newErrors.quantidade = 'Quantidade é obrigatória e deve ser diferente de zero';
    }

    if (!formData.motivo.trim()) {
      newErrors.motivo = 'Motivo é obrigatório';
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (validateForm()) {
      // Dispatch com formato da nova arquitetura
      dispatch('save', {
        tipoEPIId: item?.tipoEPIId || '',
        almoxarifadoId: item?.almoxarifadoId || '',
        tipoMovimentacao: formData.tipo === 'entrada' ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
        quantidade: formData.quantidade,
        motivo: formData.motivo,
        observacoes: '',
        itemEstoqueId: item?.id
      });
      handleClose();
    }
  }

  function handleClose() {
    show = false;
    dispatch('cancel');
  }

  function handleQuantidadeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    formData.quantidade = parseFloat(target.value) || 0;
  }

  function handleTextareaResize(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.max(40, target.scrollHeight) + 'px';
  }

  // ==================== COMPUTED ====================
  
  $: displayQuantity = formData.tipo === 'entrada' ? `+${formData.quantidade}` : `-${formData.quantidade}`;
  $: modalTitle = item ? 'Ajustar Estoque' : 'Nova Movimentação';
</script>

<!-- Modal IDÊNTICO ao original -->
<Modal bind:open={show} title={modalTitle} size="md" autoclose={false} outsideclose={false}>
  {#if item}
    <div class="space-y-4">
      <!-- Informações do Item - LAYOUT IDÊNTICO -->
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900 dark:text-white">
            {item.tipoEPI?.nomeEquipamento || 'EPI não encontrado'}
          </h4>
          <span class="text-sm font-light text-gray-600 dark:text-gray-400">
            Estoque atual = {item.quantidade}
          </span>
        </div>
      </div>

      <!-- Formulário IDÊNTICO -->
      <div class="space-y-4">
        <!-- Tipo de Movimentação e Quantidade -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Tipo de Movimentação -->
          <div>
            <Label class="mb-3 block">Tipo de Movimentação *</Label>
            <div class="flex gap-6">
              <div class="flex items-center">
                <Radio
                  name="tipo"
                  value="entrada"
                  bind:group={formData.tipo}
                  class="mr-2"
                />
                <Label class="text-sm font-normal">Aumentar</Label>
              </div>
              <div class="flex items-center">
                <Radio
                  name="tipo"
                  value="saida"
                  bind:group={formData.tipo}
                  class="mr-2"
                />
                <Label class="text-sm font-normal">Retirar</Label>
              </div>
            </div>
          </div>

          <!-- Quantidade -->
          <div>
            <Label for="quantidade" class="mb-2">Quantidade *</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 {formData.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'} font-medium">
                {formData.tipo === 'entrada' ? '+' : '-'}
              </span>
              <Input
                id="quantidade"
                type="number"
                min="1"
                step="1"
                bind:value={formData.quantidade}
                on:input={handleQuantidadeChange}
                size="sm"
                class="rounded-sm pl-8"
                color={errors.quantidade ? 'red' : 'base'}
              />
            </div>
            {#if errors.quantidade}
              <p class="text-red-600 text-xs mt-1">{errors.quantidade}</p>
            {/if}
          </div>
        </div>

        <!-- Motivo -->
        <div>
          <Label for="motivo" class="mb-2">Motivo *</Label>
          <Textarea
            id="motivo"
            bind:value={formData.motivo}
            on:input={handleTextareaResize}
            placeholder="Descreva o motivo da movimentação..."
            rows={2}
            class="rounded-sm resize-none"
            color={errors.motivo ? 'red' : 'base'}
          />
          {#if errors.motivo}
            <p class="text-red-600 text-xs mt-1">{errors.motivo}</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Footer IDÊNTICO - MOVED OUTSIDE {#if} BLOCK -->
  <svelte:fragment slot="footer">
    {#if item}
      <div class="flex items-center gap-3">
        <Button
          color="alternative"
          class="rounded-sm"
          on:click={handleClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          color="primary"
          class="rounded-sm"
          on:click={handleSave}
          disabled={loading}
        >
          {#if loading}
            <div class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </div>
          {:else}
            Salvar Movimentação
          {/if}
        </Button>
      </div>
    {/if}
  </svelte:fragment>
</Modal>
<!--
  Devolução Modal Presenter - Componente "Burro"
  
  Modal para processar devolução de EPI:
  - Interface simples para devolução
  - Validação básica
  - Layout original preservado
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal, Button, Label, Textarea, Checkbox, Input } from 'flowbite-svelte';
  import Icon from '$lib/components/common/Icon.svelte';
  import { formatarData } from '$lib/utils/dateHelpers';
  import type { EquipamentoEmPosse } from '$lib/services/process/fichaProcessAdapter';

  // ==================== PROPS ====================
  
  export let equipamento: EquipamentoEmPosse | null = null;
  export let loading: boolean = false;
  export let show: boolean = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    confirmar: { motivo: string };
    cancelar: void;
  }>();

  // ==================== LOCAL STATE ====================
  
  let motivo = '';

  // Validation
  let errors: Record<string, string> = {};

  // ==================== LIFECYCLE ====================
  
  // Reset form when modal opens
  $: if (show && equipamento) {
    resetForm();
  }

  // ==================== FORM MANAGEMENT ====================
  
  function resetForm(): void {
    motivo = '';
    errors = {};
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!motivo.trim()) {
      newErrors.motivo = 'Motivo da devolução é obrigatório';
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  // ==================== EVENT HANDLERS ====================
  
  function handleConfirmar(): void {
    if (!validateForm()) {
      return;
    }

    // Como cada equipamento é individual (quantidade = 1), sempre é devolução total do item
    const motivoCompleto = `Devolução de item individual: ${motivo.trim()}`;

    dispatch('confirmar', { motivo: motivoCompleto });
  }

  function handleCancelar(): void {
    dispatch('cancelar');
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: canConfirm = motivo.trim() && !loading;
  $: isVencido = equipamento?.vencido || false;
  $: diasVencimento = equipamento?.diasVencido || 0;
</script>

<Modal
  bind:open={show}
  size="md"
  autoclose={false}
  class="z-60"
>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Devolver Equipamento
      </h3>
      <button
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        on:click={handleCancelar}
        disabled={loading}
      >
        <Icon name="CloseOutline" size="w-5 h-5" />
      </button>
    </div>

    {#if equipamento}
      <!-- Informações do Equipamento -->
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              {equipamento.nomeEquipamento}
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              CA {equipamento.registroCA} • Entrega #{equipamento.entregaId}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Qtd: {equipamento.quantidade}
            </p>
          </div>
        </div>

        <!-- Status de Vencimento -->
        <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Prazo de Devolução
              </p>
              <p class="text-sm text-gray-900 dark:text-white">
                {formatarData(equipamento.prazoMaximoDevolucao)}
              </p>
            </div>
            <div class="text-right">
              {#if isVencido}
                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  <Icon name="ExclamationTriangleOutline" className="mr-1" size="w-3 h-3" />
                  Vencido há {diasVencimento} dias
                </div>
              {:else}
                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Icon name="CheckCircleOutline" className="mr-1" size="w-3 h-3" />
                  No prazo
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Informação sobre a Devolução -->
      <div class="mb-6">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
                          <Icon name="ExclamationCircleOutline" className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5" size="w-4 h-4" />
            <div>
              <p class="text-sm text-blue-800 dark:text-blue-200">
                <strong>Devolução de Item Individual</strong>
              </p>
              <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Este equipamento será devolvido como uma unidade individual. 
                {#if equipamento.quantidade === 1}
                  Para devolver múltiplos itens do mesmo tipo, selecione cada um separadamente.
                {/if}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Motivo da Devolução -->
      <div class="mb-6">
        <Label for="motivo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Motivo da Devolução *
        </Label>
        <Textarea
          id="motivo"
          placeholder="Descreva o motivo da devolução..."
          bind:value={motivo}
          rows={3}
          class="rounded-sm {errors.motivo ? 'border-red-500' : ''}"
          disabled={loading}
        />
        {#if errors.motivo}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.motivo}
          </p>
        {/if}
      </div>

      <!-- Alertas -->
      {#if isVencido}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div class="flex items-start">
            <Icon name="ExclamationTriangleOutline" className="text-red-600 dark:text-red-400 mt-0.5 mr-3" size="w-5 h-5" />
            <div>
              <h4 class="text-sm font-medium text-red-800 dark:text-red-200">
                Equipamento com prazo vencido
              </h4>
              <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                Este equipamento está {diasVencimento} dias em atraso para devolução.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Resumo -->
      <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Resumo da Devolução
        </h4>
        <div class="text-sm text-blue-800 dark:text-blue-200">
          <p>• Equipamento: {equipamento.nomeEquipamento} (CA {equipamento.registroCA})</p>
          <p>• Quantidade: 1 unidade (item individual)</p>
          <p>• Tipo: Devolução de item individual</p>
          {#if motivo.trim()}
            <p>• Motivo: {motivo.trim()}</p>
          {/if}
        </div>
      </div>

    {/if}

    <!-- Actions -->
    <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
        on:click={handleConfirmar}
        disabled={!canConfirm}
      >
        {#if loading}
          <Icon name="ClockOutline" className="mr-2 animate-spin" size="w-4 h-4" />
          Processando...
        {:else}
          <Icon name="CheckOutline" className="mr-2" size="w-4 h-4" />
          Confirmar Devolução
        {/if}
      </Button>
    </div>
  </div>
</Modal>
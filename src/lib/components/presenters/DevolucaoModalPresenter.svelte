<!--
  Devolução Drawer Presenter - Componente "Burro"
  
  Drawer para processar devolução de EPI:
  - Interface simples para devolução
  - Validação básica
  - Layout convertido de modal para drawer
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Label, Textarea, Select } from 'flowbite-svelte';
  import { 
    CloseOutline, 
    ExclamationCircleOutline, 
    CheckCircleOutline, 
    ClockOutline,
    CheckOutline,
    ArrowLeftOutline
  } from 'flowbite-svelte-icons';
  import { formatarData } from '$lib/utils/dateHelpers';
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  import type { EquipamentoEmPosseItem } from '$lib/types/serviceTypes';

  // ==================== PROPS ====================
  
  export let equipamento: EquipamentoEmPosseItem | null = null;
  export let loading: boolean = false;
  export let show: boolean = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    confirmar: { motivo: string; observacoes?: string };
    cancelar: void;
  }>();

  // ==================== LOCAL STATE ====================
  
  let motivoSelecionado: 'devolução padrão' | 'danificado' | 'troca' | 'outros' = 'devolução padrão';
  let observacoes = '';

  // Validation
  let errors: Record<string, string> = {};

  // Opções do motivo de devolução
  const motivosOptions = [
    { value: 'devolução padrão', name: 'Devolução Padrão - Fim do período de uso' },
    { value: 'danificado', name: 'Danificado - EPI com defeito ou quebrado' },
    { value: 'troca', name: 'Troca - Substituição por outro equipamento' },
    { value: 'outros', name: 'Outros - Outro motivo específico' }
  ];

  // ==================== LIFECYCLE ====================
  
  // Reset form when modal opens
  $: if (show && equipamento) {
    resetForm();
  }

  // ==================== FORM MANAGEMENT ====================
  
  function resetForm(): void {
    motivoSelecionado = 'devolução padrão';
    observacoes = '';
    errors = {};
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!motivoSelecionado) {
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

    // Agora o motivo já está no formato correto do enum
    dispatch('confirmar', { 
      motivo: motivoSelecionado,
      observacoes: observacoes.trim() || undefined
    });
  }

  function handleCancelar(): void {
    dispatch('cancelar');
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: canConfirm = motivoSelecionado && !loading;
  $: isVencido = equipamento?.vencido || false;
  $: diasVencimento = equipamento?.diasVencido || 0;
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
      title={equipamento ? `Devolver ${equipamento.nomeEquipamento}` : 'Devolver Equipamento'}
      objectType="DEVOLUÇÃO EPI"
      iconName="TrashBinOutline"
      primaryAction={{
        text: loading ? 'Processando...' : 'Confirmar Devolução',
        icon: loading ? '' : 'CheckOutline',
        disabled: !canConfirm
      }}
      on:close={handleCancelar}
      on:primaryAction={handleConfirmar}
    />

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">

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
                  <ExclamationCircleOutline class="mr-1 w-3 h-3" />
                  Vencido há {diasVencimento} dias
                </div>
              {:else}
                <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircleOutline class="mr-1 w-3 h-3" />
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
            <ExclamationCircleOutline class="text-blue-600 dark:text-blue-400 mr-2 mt-0.5 w-4 h-4" />
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
        <Select
          id="motivo"
          bind:value={motivoSelecionado}
          class="rounded-sm {errors.motivo ? 'border-red-500' : ''}"
          disabled={loading}
          items={motivosOptions}
        />
        {#if errors.motivo}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.motivo}
          </p>
        {/if}
      </div>

      <!-- Observações (opcional) -->
      <div class="mb-6">
        <Label for="observacoes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observações (opcional)
        </Label>
        <Textarea
          id="observacoes"
          placeholder="Observações adicionais sobre a devolução..."
          bind:value={observacoes}
          rows={2}
          class="rounded-sm"
          disabled={loading}
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Campo opcional para detalhes específicos da devolução
        </p>
      </div>

      <!-- Alertas -->
      {#if isVencido}
        <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div class="flex items-start">
            <ExclamationCircleOutline class="text-red-600 dark:text-red-400 mt-0.5 mr-3 w-5 h-5" />
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
          {#if motivoSelecionado.trim()}
            <p>• Motivo: {motivoSelecionado.trim()}</p>
          {/if}
        </div>
      </div>

    {/if}

    </div>
  </div>
{/if}

<style>
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
</style>
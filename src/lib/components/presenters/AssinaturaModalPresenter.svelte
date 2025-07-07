<!--
  Assinatura Modal Presenter - Componente "Burro"
  
  Modal para processar assinatura digital:
  - Interface simples para confirmar assinatura
  - Placeholder para integração futura com assinatura digital
  - Layout original preservado
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal, Button, Label, Textarea } from 'flowbite-svelte';
  import Icon from '$lib/components/common/Icon.svelte';
  import { formatarData } from '$lib/utils/dateHelpers';

  // ==================== PROPS ====================
  
  export let entrega: any = null;
  export let loading: boolean = false;
  export let show: boolean = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    confirmar: { assinatura: string };
    cancelar: void;
  }>();

  // ==================== LOCAL STATE ====================
  
  let observacoes = '';
  let assinaturaConfirmada = false;

  // ==================== LIFECYCLE ====================
  
  // Reset when modal opens
  $: if (show) {
    resetForm();
  }

  // ==================== FORM MANAGEMENT ====================
  
  function resetForm(): void {
    observacoes = '';
    assinaturaConfirmada = false;
  }

  // ==================== EVENT HANDLERS ====================
  
  function handleConfirmar(): void {
    // Em produção, aqui seria capturada a assinatura digital real
    // Por enquanto, simular com timestamp
    const assinaturaDigital = `assinatura_digital_${Date.now()}`;
    
    dispatch('confirmar', { assinatura: assinaturaDigital });
  }

  function handleCancelar(): void {
    dispatch('cancelar');
  }

  function confirmarAssinatura(): void {
    assinaturaConfirmada = true;
    // Simular processo de assinatura digital
    setTimeout(() => {
      handleConfirmar();
    }, 500);
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: canConfirm = !loading && !assinaturaConfirmada;
</script>

<Modal
  bind:open={show}
  size="lg"
  autoclose={false}
  class="z-60"
>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Confirmar Assinatura Digital
      </h3>
      <button
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        on:click={handleCancelar}
        disabled={loading}
      >
        <Icon name="CloseOutline" size="w-5 h-5" />
      </button>
    </div>

    {#if entrega}
      <!-- Informações da Entrega -->
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              Entrega
            </p>
            <p class="text-sm text-gray-900 dark:text-white font-semibold">
              #{entrega.id}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              Data da Entrega
            </p>
            <p class="text-sm text-gray-900 dark:text-white font-semibold">
              {formatarData(entrega.dataEntrega)}
            </p>
          </div>
        </div>
      </div>

      <!-- EPIs da Entrega -->
      <div class="mb-6">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          EPIs a serem confirmados:
        </h4>
        <div class="space-y-2">
          <!-- Item mockado - em produção viria de entrega.itens -->
          <div class="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-sm border border-gray-200 dark:border-gray-600">
            <div class="flex flex-col">
              <span class="text-sm text-gray-900 dark:text-white font-medium">
                Capacete de Segurança
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                CA 31469
              </span>
            </div>
            <div class="text-right">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                Qtd: 1
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Observações -->
      <div class="mb-6">
        <Label for="observacoes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observações (opcional)
        </Label>
        <Textarea
          id="observacoes"
          placeholder="Adicione observações sobre a entrega..."
          bind:value={observacoes}
          rows={3}
          class="rounded-sm"
          disabled={loading}
        />
      </div>

      <!-- Opções de Assinatura -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Assinatura Digital -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
            <Icon name="DeviceTabletOutline" className="text-blue-600 dark:text-blue-400 mt-0.5 mr-3" size="w-5 h-5" />
            <div>
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
                Assinatura Digital
              </h4>
              <p class="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Assine digitalmente através do link ou QR Code
              </p>
              <div class="mt-3 space-y-2">
                <Button size="xs" color="primary" class="rounded-sm w-full">
                  <Icon name="GlobeOutline" className="mr-2" size="w-3 h-3" />
                  Abrir Link de Assinatura
                </Button>
                <div class="flex items-center justify-center p-3 bg-white dark:bg-gray-700 rounded border">
                  <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    <Icon name="QrCodeOutline" className="text-gray-400" size="w-8 h-8" />
                  </div>
                </div>
                <p class="text-xs text-blue-700 dark:text-blue-300 text-center">
                  Escaneie o QR Code para assinar
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Assinatura Manual -->
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div class="flex items-start">
            <Icon name="DocumentTextOutline" className="text-green-600 dark:text-green-400 mt-0.5 mr-3" size="w-5 h-5" />
            <div>
              <h4 class="text-sm font-medium text-green-900 dark:text-green-100">
                Assinatura Manual
              </h4>
              <p class="text-sm text-green-800 dark:text-green-200 mt-1">
                Imprima o documento para assinatura física
              </p>
              <div class="mt-3 space-y-2">
                <Button size="xs" color="alternative" class="rounded-sm w-full">
                  <Icon name="PrinterOutline" className="mr-2" size="w-3 h-3" />
                  Imprimir Documento
                </Button>
                <p class="text-xs text-green-700 dark:text-green-300 text-center">
                  Após assinatura física, confirme abaixo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado da Assinatura -->
      {#if assinaturaConfirmada}
        <div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div class="flex items-center">
            <Icon name="CheckCircleOutline" className="text-green-600 dark:text-green-400 mr-3" size="w-5 h-5" />
            <div>
              <h4 class="text-sm font-medium text-green-900 dark:text-green-100">
                Assinatura Confirmada
              </h4>
              <p class="text-sm text-green-800 dark:text-green-200">
                Processando assinatura digital...
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Termos -->
      <div class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div class="flex items-start">
          <Icon name="ExclamationTriangleOutline" className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" size="w-5 h-5" />
          <div>
            <h4 class="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Importante
            </h4>
            <p class="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
              Ao assinar, você confirma o recebimento dos EPIs e se compromete a:
            </p>
            <ul class="text-sm text-yellow-800 dark:text-yellow-200 mt-2 ml-4 list-disc">
              <li>Usar os equipamentos conforme as instruções</li>
              <li>Manter os EPIs em bom estado de conservação</li>
              <li>Devolver quando solicitado ou no fim do período</li>
              <li>Comunicar imediatamente qualquer dano ou perda</li>
            </ul>
          </div>
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
        on:click={confirmarAssinatura}
        disabled={!canConfirm}
      >
        {#if loading}
          <Icon name="SpinnerOutline" className="mr-2 animate-spin" size="w-4 h-4" />
          Processando Assinatura...
        {:else if assinaturaConfirmada}
          <Icon name="CheckOutline" className="mr-2" size="w-4 h-4" />
          Assinatura Confirmada
        {:else}
          <Icon name="CheckCircleOutline" className="mr-2" size="w-4 h-4" />
          Foi assinado
        {/if}
      </Button>
    </div>
  </div>
</Modal>
<!--
  Assinatura Drawer Presenter - Componente "Burro"
  
  Drawer para processar assinatura digital:
  - Interface simples para confirmar assinatura
  - Placeholder para integração futura com assinatura digital
  - Layout convertido de modal para drawer
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from 'flowbite-svelte';
  import { 
    CloseOutline, 
    CheckOutline, 
    RefreshOutline,
    CheckCircleOutline,
    TabletOutline,
    GlobeOutline,
    QrCodeOutline,
    FileLinesOutline,
    PrinterOutline
  } from 'flowbite-svelte-icons';
  import { formatarData } from '$lib/utils/dateHelpers';
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';

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
  
  let assinaturaConfirmada = false;

  // ==================== LIFECYCLE ====================
  
  // Reset when drawer opens
  $: if (show) {
    resetForm();
  }

  // ==================== FORM MANAGEMENT ====================
  
  function resetForm(): void {
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
      title={entrega ? `Assinatura da Entrega #${entrega.id}` : 'Confirmar Assinatura Digital'}
      objectType="ASSINATURA DIGITAL"
      iconName="TabletOutline"
      primaryAction={{
        text: loading ? 'Processando...' : (assinaturaConfirmada ? 'Assinatura Confirmada' : 'Foi assinado'),
        icon: loading ? '' : (assinaturaConfirmada ? 'CheckOutline' : 'CheckCircleOutline'),
        disabled: !canConfirm
      }}
      secondaryAction={{
        text: 'Cancelar',
        disabled: loading
      }}
      on:close={handleCancelar}
      on:primaryAction={confirmarAssinatura}
      on:secondaryAction={handleCancelar}
    />

    <!-- Content -->
    <div class="overflow-y-auto custom-scrollbar p-6" style="height: calc(100% - 80px);">

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


      <!-- Opções de Assinatura -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Assinatura Digital -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
            <TabletOutline class="text-blue-600 dark:text-blue-400 mt-0.5 mr-3 w-5 h-5" />
            <div>
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
                Assinatura Digital
              </h4>
              <p class="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Assine digitalmente através do link ou QR Code
              </p>
              <div class="mt-3 space-y-2">
                <Button size="xs" color="primary" class="rounded-sm w-full">
                  <GlobeOutline class="mr-2 w-3 h-3" />
                  Abrir Link de Assinatura
                </Button>
                <div class="flex items-center justify-center p-3 bg-white dark:bg-gray-700 rounded border">
                  <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                    <QrCodeOutline class="text-gray-400 w-8 h-8" />
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
            <FileLinesOutline class="text-green-600 dark:text-green-400 mt-0.5 mr-3 w-5 h-5" />
            <div>
              <h4 class="text-sm font-medium text-green-900 dark:text-green-100">
                Assinatura Manual
              </h4>
              <p class="text-sm text-green-800 dark:text-green-200 mt-1">
                Imprima o documento para assinatura física
              </p>
              <div class="mt-3 space-y-2">
                <Button size="xs" color="alternative" class="rounded-sm w-full">
                  <PrinterOutline class="mr-2 w-3 h-3" />
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
            <CheckCircleOutline class="text-green-600 dark:text-green-400 mr-3 w-5 h-5" />
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


    {/if}

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
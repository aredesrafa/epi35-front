<!--
  Modal de confirmação para exclusão de contratadas
  
  Exibe informações da contratada e solicita confirmação antes de excluir
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Modal, Alert } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import type { Contratada } from '$lib/services/api/types';

  // Props
  export let show = false;
  export let contratada: Contratada | null = null;

  // Events
  const dispatch = createEventDispatcher<{
    confirm: Contratada;
    cancel: void;
  }>();

  // State
  let isDeleting = false;

  // Handle confirm
  async function handleConfirm() {
    if (!contratada) return;

    isDeleting = true;
    try {
      dispatch('confirm', contratada);
      show = false;
    } catch (error: any) {
      console.error('Erro ao excluir contratada:', error);
    } finally {
      isDeleting = false;
    }
  }

  // Handle cancel
  function handleCancel() {
    dispatch('cancel');
    show = false;
  }
</script>

<Modal bind:open={show} size="md" class="min-w-fit">
  <svelte:fragment slot="header">
    <div class="flex items-center gap-2">
      <ExclamationCircleOutline class="w-6 h-6 text-red-500" />
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
        Confirmar Exclusão
      </h3>
    </div>
  </svelte:fragment>

  {#if contratada}
    <div class="space-y-4">
      <Alert color="red" class="border-red-200">
        <ExclamationCircleOutline slot="icon" class="w-5 h-5" />
        <span class="font-medium">Atenção!</span> 
        Esta ação não pode ser desfeita.
      </Alert>

      <div class="space-y-2">
        <p class="text-gray-700 dark:text-gray-300">
          Você tem certeza que deseja excluir a contratada:
        </p>
        
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-medium text-gray-600 dark:text-gray-400">Nome:</span>
              <span class="text-gray-900 dark:text-white">{contratada.nome}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-600 dark:text-gray-400">CNPJ:</span>
              <span class="text-gray-900 dark:text-white">{contratada.cnpj}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium text-gray-600 dark:text-gray-400">Status:</span>
              <span class="text-gray-900 dark:text-white">{contratada.status}</span>
            </div>
          </div>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>Consequências:</strong> Todos os dados relacionados a esta contratada 
          (colaboradores, fichas, entregas) também serão afetados.
        </p>
      </div>
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <div class="flex justify-end gap-2">
      <Button
        color="light"
        class="rounded-sm"
        on:click={handleCancel}
        disabled={isDeleting}
      >
        Cancelar
      </Button>
      <Button
        color="red"
        class="rounded-sm"
        on:click={handleConfirm}
        disabled={isDeleting}
      >
        {#if isDeleting}
          Excluindo...
        {:else}
          Excluir Contratada
        {/if}
      </Button>
    </div>
  </svelte:fragment>
</Modal>
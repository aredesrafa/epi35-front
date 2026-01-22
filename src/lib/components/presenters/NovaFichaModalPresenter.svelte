<!--
  Nova Ficha Modal Presenter - Simples e Minimalista
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal, Button, Spinner } from 'flowbite-svelte';
  import { CloseOutline } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';

  // ==================== PROPS ====================
  
  export let open = false;
  export let submitting = false;
  export let error: string | null = null;
  export let contratadas: Array<{ value: string; label: string }> = [];
  export let colaboradores: Array<{ value: string; label: string; empresa: string }> = [];
  export let loadingContratadas = false;
  export let loadingColaboradores = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    close: void;
    contratadaChange: string;
    colaboradorChange: string;
    submit: { contratadaId: string; colaboradorId: string };
    retry: void;
  }>();

  // ==================== STATE ====================
  
  let selectedContratada = '';
  let selectedColaborador = '';

  // ==================== REACTIVE STATEMENTS ====================
  
  $: canSubmit = !!selectedContratada && !!selectedColaborador && !submitting;
  $: colaboradoresFiltrados = colaboradores.filter(c => 
    !selectedContratada || c.empresa === selectedContratada
  );

  // ==================== HANDLERS ====================
  
  function handleClose(): void {
    if (!submitting) {
      selectedContratada = '';
      selectedColaborador = '';
      dispatch('close');
    }
  }
  
  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !submitting) {
      handleClose();
    }
  }
  
  function handleContratadaChange(event: CustomEvent<string>): void {
    selectedContratada = event.detail;
    selectedColaborador = ''; // Reset colaborador
    dispatch('contratadaChange', selectedContratada);
  }
  
  function handleColaboradorChange(event: CustomEvent<string>): void {
    selectedColaborador = event.detail;
    dispatch('colaboradorChange', selectedColaborador);
  }
  
  function handleSubmit(): void {
    if (canSubmit) {
      dispatch('submit', {
        contratadaId: selectedContratada,
        colaboradorId: selectedColaborador
      });
    }
  }
  
  function handleRetry(): void {
    dispatch('retry');
  }

  // Reset form when modal closes
  $: if (!open) {
    console.log('📝 NovaFichaModal: Modal fechado, resetando formulário');
    selectedContratada = '';
    selectedColaborador = '';
  }
  
  // Debug modal state changes
  $: console.log('📝 NovaFichaModal: Estado do modal mudou para:', open);
</script>

<Modal bind:open size="md" outsideclose={!submitting} autoclose={false}>
  
  <!-- Error Display -->
  {#if error}
    <ErrorDisplay {error} onRetry={handleRetry} />
  {/if}

  <!-- Form -->
  <div class="space-y-4">
    
    <!-- Contratada -->
    <div>
      <label for="contratada-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Contratada
      </label>
      {#if loadingContratadas}
        <div class="flex items-center justify-center py-4 min-h-[42px]">
          <LoadingSpinner size="sm" />
          <span class="ml-2 text-sm text-gray-600">Carregando...</span>
        </div>
      {:else}
        <SearchableDropdown
          options={contratadas}
          value={selectedContratada}
          placeholder="Selecione uma contratada..."
          on:change={handleContratadaChange}
          disabled={submitting}
        />
      {/if}
    </div>
    
    <!-- Colaborador -->
    <div>
      <label for="colaborador-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Colaborador
      </label>
      {#if loadingColaboradores}
        <div class="flex items-center justify-center py-4 min-h-[42px]">
          <LoadingSpinner size="sm" />
          <span class="ml-2 text-sm text-gray-600">Carregando...</span>
        </div>
      {:else}
        <SearchableDropdown
          options={colaboradoresFiltrados}
          value={selectedColaborador}
          placeholder={selectedContratada ? "Selecione um colaborador sem ficha..." : "Primeiro selecione uma contratada"}
          on:change={handleColaboradorChange}
          disabled={submitting || !selectedContratada}
        />
        
        {#if colaboradoresFiltrados.length === 0 && selectedContratada}
          <p class="text-sm text-gray-500 mt-1">
            Todos os colaboradores desta contratada já possuem ficha EPI
          </p>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Footer -->
  <svelte:fragment slot="footer">
    <Button
      color="alternative"
      size="sm"
      class="rounded-sm"
      on:click={handleClose}
      disabled={submitting}
    >
      Cancelar
    </Button>
    
    <Button
      color="primary"
      size="sm"
      class="rounded-sm"
      on:click={handleSubmit}
      disabled={!canSubmit}
    >
      {#if submitting}
        <Spinner class="mr-2" size="4" />
        Criando...
      {:else}
        Criar Ficha
      {/if}
    </Button>
  </svelte:fragment>
</Modal>
<!--
  Nova Ficha Modal Presenter - Componente "Burro"
  
  Responsabilidades:
  - Renderizar UI do modal de criação de ficha
  - Gerenciar steps do fluxo de criação
  - Validar seleções antes de avançar
  - Emitir eventos para o Container
  - Zero lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal, Button, Card, Spinner } from 'flowbite-svelte';
  import { UserOutline, BuildingOutline, CheckOutline, XSolid } from 'flowbite-svelte-icons';
  import SearchableDropdown from '$lib/components/common/SearchableDropdown.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';

  // ==================== PROPS ====================
  
  export let open = false;
  export let submitting = false;
  export let error: string | null = null;
  
  // Dados para os dropdowns
  export let contratadas: Array<{ value: string; label: string }> = [];
  export let colaboradores: Array<{ value: string; label: string; empresa: string }> = [];
  
  // Estados de carregamento
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
  
  let currentStep = 1;
  let selectedContratada = '';
  let selectedColaborador = '';
  
  // Steps configuration
  const steps = [
    {
      id: 1,
      title: 'Contratada',
      description: 'Selecione a empresa',
      icon: BuildingOutline,
      completed: false
    },
    {
      id: 2,
      title: 'Colaborador',
      description: 'Selecione o profissional',
      icon: UserOutline,
      completed: false
    },
    {
      id: 3,
      title: 'Confirmação',
      description: 'Revisar e criar',
      icon: CheckOutline,
      completed: false
    }
  ];

  // ==================== REACTIVE STATEMENTS ====================
  
  // Atualizar status dos steps
  $: {
    steps[0].completed = !!selectedContratada;
    steps[1].completed = !!selectedColaborador;
    steps[2].completed = false; // Nunca completed até submeter
  }
  
  // Habilitar/desabilitar avanço de step
  $: canAdvanceFromStep1 = !!selectedContratada;
  $: canAdvanceFromStep2 = !!selectedColaborador;
  $: canSubmit = !!selectedContratada && !!selectedColaborador && !submitting;
  
  // Filtrar colaboradores pela contratada selecionada
  $: colaboradoresFiltrados = colaboradores.filter(c => 
    !selectedContratada || c.empresa === selectedContratada
  );
  
  // Dados da contratada e colaborador selecionados
  $: contratadaSelecionada = contratadas.find(c => c.value === selectedContratada);
  $: colaboradorSelecionado = colaboradores.find(c => c.value === selectedColaborador);

  // ==================== HANDLERS ====================
  
  function handleClose(): void {
    if (!submitting) {
      resetForm();
      dispatch('close');
    }
  }
  
  function resetForm(): void {
    currentStep = 1;
    selectedContratada = '';
    selectedColaborador = '';
  }
  
  function handleContratadaChange(event: CustomEvent<string>): void {
    selectedContratada = event.detail;
    // Limpar colaborador quando trocar de contratada
    selectedColaborador = '';
    dispatch('contratadaChange', selectedContratada);
  }
  
  function handleColaboradorChange(event: CustomEvent<string>): void {
    selectedColaborador = event.detail;
    dispatch('colaboradorChange', selectedColaborador);
  }
  
  function handleNextStep(): void {
    if (currentStep === 1 && canAdvanceFromStep1) {
      currentStep = 2;
    } else if (currentStep === 2 && canAdvanceFromStep2) {
      currentStep = 3;
    }
  }
  
  function handlePrevStep(): void {
    if (currentStep > 1) {
      currentStep = currentStep - 1;
    }
  }
  
  function handleStepClick(stepId: number): void {
    // Permitir navegar apenas para steps já completados ou atual
    if (stepId === 1) {
      currentStep = 1;
    } else if (stepId === 2 && canAdvanceFromStep1) {
      currentStep = 2;
    } else if (stepId === 3 && canAdvanceFromStep2) {
      currentStep = 3;
    }
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

  // ==================== REACTIVE CLEANUP ====================
  
  // Reset form when modal closes
  $: if (!open) {
    resetForm();
  }
</script>

<Modal bind:open size="lg" class="w-full max-w-2xl">
  <div class="space-y-6">
    
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">
          Nova Ficha de EPI
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Crie uma nova ficha para um colaborador
        </p>
      </div>
      <Button 
        color="alternative" 
        size="sm" 
        class="rounded-sm p-2"
        on:click={handleClose}
        disabled={submitting}
      >
        <XSolid class="w-4 h-4" />
      </Button>
    </div>

    <!-- Custom Stepper -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        {#each steps as step, index}
          <div 
            class="flex items-center cursor-pointer transition-all duration-200 {
              currentStep === step.id ? 'text-primary-600' : 
              step.completed ? 'text-green-600' : 'text-gray-400'
            }"
            on:click={() => handleStepClick(step.id)}
            on:keydown={(e) => e.key === 'Enter' && handleStepClick(step.id)}
            role="button"
            tabindex="0"
          >
            <!-- Step Circle -->
            <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 {
              currentStep === step.id ? 'border-primary-600 bg-primary-50' : 
              step.completed ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'
            }">
              {#if step.completed && currentStep !== step.id}
                <CheckOutline class="w-4 h-4" />
              {:else}
                <svelte:component this={step.icon} class="w-4 h-4" />
              {/if}
            </div>
            
            <!-- Step Info -->
            <div class="ml-3 hidden sm:block">
              <div class="text-sm font-medium">{step.title}</div>
              <div class="text-xs opacity-70">{step.description}</div>
            </div>
          </div>
          
          <!-- Connector Line -->
          {#if index < steps.length - 1}
            <div class="flex-1 h-px bg-gray-200 mx-4"></div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <ErrorDisplay {error} onRetry={handleRetry} />
    {/if}

    <!-- Step Content -->
    <div class="min-h-[200px]">
      
      <!-- Step 1: Selecionar Contratada -->
      {#if currentStep === 1}
        <Card class="p-6">
          <div class="space-y-4">
            <div class="text-center">
              <BuildingOutline class="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                Selecione a Contratada
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Escolha a empresa à qual o colaborador pertence
              </p>
            </div>
            
            <div class="max-w-md mx-auto">
              {#if loadingContratadas}
                <div class="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                  <span class="ml-2 text-sm text-gray-600">Carregando contratadas...</span>
                </div>
              {:else}
                <SearchableDropdown
                  options={contratadas}
                  value={selectedContratada}
                  placeholder="Selecione uma contratada..."
                  searchPlaceholder="Buscar empresa..."
                  on:change={handleContratadaChange}
                  disabled={submitting}
                />
              {/if}
            </div>
          </div>
        </Card>
      
      <!-- Step 2: Selecionar Colaborador -->
      {:else if currentStep === 2}
        <Card class="p-6">
          <div class="space-y-4">
            <div class="text-center">
              <UserOutline class="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                Selecione o Colaborador
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Escolha o profissional para criar a ficha
              </p>
              {#if contratadaSelecionada}
                <p class="text-xs text-primary-600 dark:text-primary-400 mt-1">
                  Empresa: {contratadaSelecionada.label}
                </p>
              {/if}
            </div>
            
            <div class="max-w-md mx-auto">
              {#if loadingColaboradores}
                <div class="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                  <span class="ml-2 text-sm text-gray-600">Carregando colaboradores...</span>
                </div>
              {:else}
                <SearchableDropdown
                  options={colaboradoresFiltrados}
                  value={selectedColaborador}
                  placeholder="Selecione um colaborador..."
                  searchPlaceholder="Buscar profissional..."
                  on:change={handleColaboradorChange}
                  disabled={submitting}
                />
                
                {#if colaboradoresFiltrados.length === 0 && selectedContratada}
                  <p class="text-sm text-gray-500 text-center mt-2">
                    Nenhum colaborador encontrado para esta contratada
                  </p>
                {/if}
              {/if}
            </div>
          </div>
        </Card>
      
      <!-- Step 3: Confirmação -->
      {:else if currentStep === 3}
        <Card class="p-6">
          <div class="space-y-4">
            <div class="text-center">
              <CheckOutline class="w-12 h-12 mx-auto text-green-400 mb-3" />
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                Confirmar Criação
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Revise os dados antes de criar a ficha
              </p>
            </div>
            
            <!-- Resumo das seleções -->
            <div class="max-w-md mx-auto space-y-3">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div class="grid grid-cols-1 gap-3">
                  <div>
                    <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Contratada
                    </div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {contratadaSelecionada?.label || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Colaborador
                    </div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {colaboradorSelecionado?.label || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="text-xs text-gray-500 text-center">
                Uma ficha ativa será criada para este colaborador. Apenas uma ficha ativa é permitida por colaborador.
              </div>
            </div>
          </div>
        </Card>
      {/if}
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      
      <!-- Previous Button -->
      <Button
        color="alternative"
        size="sm"
        class="rounded-sm"
        on:click={handlePrevStep}
        disabled={currentStep === 1 || submitting}
      >
        Anterior
      </Button>
      
      <!-- Step Indicator -->
      <div class="text-sm text-gray-500">
        Passo {currentStep} de {steps.length}
      </div>
      
      <!-- Next/Submit Button -->
      <div class="flex space-x-2">
        <Button
          color="alternative"
          size="sm"
          class="rounded-sm"
          on:click={handleClose}
          disabled={submitting}
        >
          Cancelar
        </Button>
        
        {#if currentStep < 3}
          <Button
            color="primary"
            size="sm"
            class="rounded-sm"
            on:click={handleNextStep}
            disabled={
              (currentStep === 1 && !canAdvanceFromStep1) ||
              (currentStep === 2 && !canAdvanceFromStep2) ||
              submitting
            }
          >
            Próximo
          </Button>
        {:else}
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
        {/if}
      </div>
    </div>
  </div>
</Modal>
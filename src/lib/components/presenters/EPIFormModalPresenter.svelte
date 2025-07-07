<!--
  EPI Form Modal Presenter - Componente "Burro" (Recriado)
  
  Modal para criar/editar/visualizar tipos de EPI
  Alinhado com a estrutura real da API do backend PostgreSQL
  
  Responsabilidades:
  - Renderizar UI do modal de formulário EPI
  - Renderizar campos conforme API real (sem fabricante)
  - Validação básica de UI
  - Emitir eventos para o Container
  - Zero lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal, Button, Input, Textarea, Label, Select } from 'flowbite-svelte';
  import type { TipoEPI, CreateTipoEPIData } from '$lib/services/entity/catalogAdapter';

  // ==================== PROPS ====================
  
  export let show = false;
  export let mode: 'create' | 'edit' | 'view' = 'create';
  export let title = 'EPI';
  export let epi: TipoEPI | null = null;
  export let loading = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    salvar: CreateTipoEPIData;
    cancelar: void;
  }>();

  // ==================== FORM STATE ====================
  
  let formData: CreateTipoEPIData = {
    nomeEquipamento: '',
    numeroCa: '',
    categoria: 'PROTECAO_CABECA',
    vidaUtilDias: undefined,
    descricao: ''
  };

  // Form validation
  let errors: Record<string, string> = {};

  // ==================== CATEGORIA OPTIONS ====================
  // Baseado no enum categoria_epi_enum REAL do backend (conforme erro de validação)
  
  const categoriaOptions = [
    { value: 'PROTECAO_CABECA', label: 'Proteção da Cabeça' },
    { value: 'PROTECAO_OLHOS_ROSTO', label: 'Proteção dos Olhos/Rosto' },
    { value: 'PROTECAO_OUVIDOS', label: 'Proteção dos Ouvidos' },
    { value: 'PROTECAO_MAOS_BRACCOS', label: 'Proteção das Mãos/Braços' },
    { value: 'PROTECAO_PES', label: 'Proteção dos Pés' },
    { value: 'PROTECAO_RESPIRATORIA', label: 'Proteção Respiratória' },
    { value: 'PROTECAO_CLIMATICA', label: 'Proteção Climática' },
    { value: 'ROUPA_APROXIMACAO', label: 'Roupa de Aproximação' }
  ];

  // ==================== LIFECYCLE ====================
  
  // Função para resetar/preencher formulário
  function resetForm() {
    console.log('🔄 EPIFormModal: Resetando formulário:', { mode, epiNome: epi?.nomeEquipamento });
    
    if (mode === 'edit' || mode === 'view') {
      if (epi) {
        const newFormData = {
          nomeEquipamento: epi.nomeEquipamento || '',
          numeroCa: epi.numeroCa || epi.numeroCA || '',
          categoria: epi.categoria || 'PROTECAO_CABECA',
          vidaUtilDias: epi.vidaUtilDias || epi.validadePadrao || undefined,
          descricao: epi.descricao || ''
        };
        
        formData = newFormData;
        console.log('✅ Formulário preenchido para edição:', newFormData);
      }
    } else {
      formData = {
        nomeEquipamento: '',
        numeroCa: '',
        categoria: 'PROTECAO_CABECA',
        vidaUtilDias: undefined,
        descricao: ''
      };
    }
    errors = {};
  }
  
  // Reativo: resetar formulário quando modal abre ou quando props mudam
  $: if (show && (mode || epi)) {
    // Usar setTimeout para garantir que a atualização aconteça no próximo tick
    setTimeout(() => {
      resetForm();
    }, 50);
  }

  // ==================== VALIDATION ====================
  
  function validateForm(): boolean {
    errors = {};

    if (!formData.nomeEquipamento.trim()) {
      errors.nomeEquipamento = 'Nome do equipamento é obrigatório';
    }

    if (!formData.numeroCa.trim()) {
      errors.numeroCa = 'Número CA é obrigatório';
    }

    if (!formData.categoria) {
      errors.categoria = 'Categoria é obrigatória';
    }

    if (formData.vidaUtilDias !== undefined && formData.vidaUtilDias < 1) {
      errors.vidaUtilDias = 'Vida útil deve ser maior que 0';
    }

    return Object.keys(errors).length === 0;
  }

  // ==================== HANDLERS ====================
  
  function handleInputChange(field: string, value: any) {
    console.log(`🔄 Input change - ${field}:`, value);
    formData = {
      ...formData,
      [field]: value
    };
  }
  
  function handleSalvar(): void {
    if (mode === 'view') return;

    console.log('💾 Salvando formulário:', formData);
    
    if (validateForm()) {
      // Converter vidaUtilDias para number antes de enviar
      const dataToSend: CreateTipoEPIData = {
        ...formData,
        vidaUtilDias: formData.vidaUtilDias ? Number(formData.vidaUtilDias) : undefined
      };
      
      console.log('📤 Dados sendo enviados:', dataToSend);
      dispatch('salvar', dataToSend);
    }
  }

  function handleCancelar(): void {
    dispatch('cancelar');
  }

  function handleModalClose(): void {
    if (!loading) {
      handleCancelar();
    }
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: isReadonly = mode === 'view';
  $: saveButtonText = mode === 'create' ? 'Cadastrar' : mode === 'edit' ? 'Atualizar' : '';
  $: showSaveButton = mode !== 'view';

  // Helper para obter label da categoria
  function getCategoriaLabel(categoria: string): string {
    const option = categoriaOptions.find(opt => opt.value === categoria);
    return option ? option.label : categoria;
  }
</script>

<Modal bind:open={show} size="lg" autoclose={false} outsideclose={!loading} on:close={handleModalClose}>
  <div slot="header" class="flex items-center space-x-4">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
      {title}
    </h3>
  </div>

  <form class="space-y-4" on:submit|preventDefault={handleSalvar}>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Nome do Equipamento -->
      <div class="md:col-span-2">
        <Label for="nomeEquipamento" class="mb-2">
          Nome do Equipamento *
        </Label>
        <Input
          id="nomeEquipamento"
          type="text"
          placeholder="Ex: Capacete de Segurança"
          bind:value={formData.nomeEquipamento}
          disabled={isReadonly || loading}
          class="rounded-sm {errors.nomeEquipamento ? 'border-red-500' : ''}"
          on:input={(e) => handleInputChange('nomeEquipamento', e.target.value)}
        />
        {#if errors.nomeEquipamento}
          <p class="text-red-500 text-sm mt-1">{errors.nomeEquipamento}</p>
        {/if}
      </div>

      <!-- Número CA -->
      <div>
        <Label for="numeroCa" class="mb-2">
          Número CA *
        </Label>
        <Input
          id="numeroCa"
          type="text"
          placeholder="Ex: 31469"
          bind:value={formData.numeroCa}
          disabled={isReadonly || loading}
          class="rounded-sm {errors.numeroCa ? 'border-red-500' : ''}"
          on:input={(e) => handleInputChange('numeroCa', e.target.value)}
        />
        {#if errors.numeroCa}
          <p class="text-red-500 text-sm mt-1">{errors.numeroCa}</p>
        {/if}
        <p class="text-sm text-gray-500 mt-1">
          Certificado de Aprovação do INMETRO
        </p>
      </div>

      <!-- Categoria -->
      <div>
        <Label for="categoria" class="mb-2">
          Categoria *
        </Label>
        <select
          id="categoria"
          bind:value={formData.categoria}
          disabled={isReadonly || loading}
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 {errors.categoria ? 'border-red-500' : ''}"
          on:change={(e) => handleInputChange('categoria', e.target.value)}
        >
          {#each categoriaOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        {#if errors.categoria}
          <p class="text-red-500 text-sm mt-1">{errors.categoria}</p>
        {/if}
      </div>

      <!-- Vida Útil -->
      <div>
        <Label for="vidaUtilDias" class="mb-2">
          Vida Útil (dias)
        </Label>
        <Input
          id="vidaUtilDias"
          type="number"
          placeholder="Ex: 365"
          bind:value={formData.vidaUtilDias}
          disabled={isReadonly || loading}
          class="rounded-sm {errors.vidaUtilDias ? 'border-red-500' : ''}"
          min="1"
          on:input={(e) => handleInputChange('vidaUtilDias', e.target.value ? Number(e.target.value) : undefined)}
        />
        {#if errors.vidaUtilDias}
          <p class="text-red-500 text-sm mt-1">{errors.vidaUtilDias}</p>
        {/if}
        <p class="text-sm text-gray-500 mt-1">
          Deixe em branco se não houver vida útil definida
        </p>
      </div>

      <!-- Status (apenas para visualização/edição) -->
      {#if mode !== 'create' && epi}
        <div>
          <Label class="mb-2">Status</Label>
          <div class="mt-2">
            {#if epi.status === 'ATIVO'}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                Ativo
              </span>
            {:else}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                Descontinuado
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Descrição -->
      <div class="md:col-span-2">
        <Label for="descricao" class="mb-2">
          Descrição
        </Label>
        <Textarea
          id="descricao"
          placeholder="Descrição técnica detalhada do equipamento..."
          rows="3"
          bind:value={formData.descricao}
          disabled={isReadonly || loading}
          class="rounded-sm"
          on:input={(e) => handleInputChange('descricao', e.target.value)}
        />
      </div>

      <!-- Informações adicionais (apenas visualização) -->
      {#if mode === 'view' && epi}
        <div class="md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Informações do Sistema</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Criado em:</span>
              <p class="font-medium">{new Date(epi.createdAt || epi.dataCriacao || '').toLocaleDateString('pt-BR')}</p>
            </div>
            {#if epi.updatedAt || epi.dataAtualizacao}
              <div>
                <span class="text-gray-500 dark:text-gray-400">Atualizado em:</span>
                <p class="font-medium">{new Date(epi.updatedAt || epi.dataAtualizacao || '').toLocaleDateString('pt-BR')}</p>
              </div>
            {/if}
            <div>
              <span class="text-gray-500 dark:text-gray-400">Categoria:</span>
              <p class="font-medium">{getCategoriaLabel(epi.categoria)}</p>
            </div>
            {#if epi.vidaUtilDias || epi.validadePadrao}
              <div>
                <span class="text-gray-500 dark:text-gray-400">Vida útil:</span>
                <p class="font-medium">
                  {Math.round((epi.vidaUtilDias || epi.validadePadrao || 0) / 30)} meses
                  ({epi.vidaUtilDias || epi.validadePadrao} dias)
                </p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </form>

  <div slot="footer" class="flex justify-end space-x-2">
    <Button
      color="alternative"
      size="sm"
      class="rounded-sm"
      on:click={handleCancelar}
      disabled={loading}
    >
      {mode === 'view' ? 'Fechar' : 'Cancelar'}
    </Button>
    {#if showSaveButton}
      <Button
        color="primary"
        size="sm"
        class="rounded-sm"
        on:click={handleSalvar}
        disabled={loading}
      >
        {loading ? 'Salvando...' : saveButtonText}
      </Button>
    {/if}
  </div>
</Modal>
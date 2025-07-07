<!--
  Notes Form Modal Presenter - Componente "Burro" (Refatorado para Backend Real)
  
  Modal para criar/editar/visualizar notas de movimentação baseado na estrutura real
  do backend PostgreSQL (tabela notas_movimentacao)
  
  Responsabilidades:
  - Renderizar UI do modal de formulário de notas
  - Renderizar campos conforme API real do backend
  - Validação básica de UI
  - Emitir eventos para o Container
  - Zero lógica de negócio
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Modal, Button, Input, Textarea, Label, Select } from 'flowbite-svelte';
  import type { 
    NotaMovimentacao, 
    CriarNotaMovimentacaoRequest,
    TipoNotaEnum 
  } from '$lib/services/process/notasMovimentacaoAdapter';

  // ==================== PROPS ====================
  
  export let show = false;
  export let mode: 'create' | 'edit' | 'view' = 'create';
  export let tipo: TipoNotaEnum = 'ENTRADA';
  export let title = 'Nota de Movimentação';
  export let nota: NotaMovimentacao | null = null;
  export let loading = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    salvar: CriarNotaMovimentacaoRequest;
    cancelar: void;
  }>();

  // ==================== FORM STATE ====================
  
  let formData: CriarNotaMovimentacaoRequest = {
    tipo_nota: 'ENTRADA',
    almoxarifado_id: '',
    numero_documento: '',
    data_documento: '',
    observacoes: ''
  };

  // Form validation
  let errors: Record<string, string> = {};

  // Options para almoxarifados (mock por enquanto, deve vir do backend)
  let almoxarifadoOptions = [
    { value: '', label: 'Selecione um almoxarifado' },
    { value: 'alm-001', label: 'Almoxarifado Central' },
    { value: 'alm-002', label: 'Almoxarifado Filial 1' },
    { value: 'alm-003', label: 'Almoxarifado Filial 2' }
  ];

  // ==================== LIFECYCLE ====================
  
  // Função para resetar/preencher formulário
  function resetForm() {
    console.log('🔄 NotesFormModal: Resetando formulário:', { mode, tipo, nota });
    
    if (mode === 'edit' || mode === 'view') {
      if (nota) {
        formData = {
          tipo_nota: nota.tipo_nota,
          almoxarifado_id: nota.almoxarifado_id,
          almoxarifado_destino_id: nota.almoxarifado_destino_id,
          numero_documento: nota.numero_documento || '',
          data_documento: nota.data_documento,
          observacoes: nota.observacoes || ''
        };
        console.log('✅ Formulário preenchido para edição:', formData);
      }
    } else {
      // Modo create - usar valores padrão
      formData = {
        tipo_nota: tipo,
        almoxarifado_id: '',
        almoxarifado_destino_id: undefined,
        numero_documento: '',
        data_documento: new Date().toISOString().split('T')[0], // Data atual
        observacoes: ''
      };
      console.log('✅ Formulário resetado para criação:', formData);
    }
    errors = {};
  }
  
  // Reativo: resetar formulário quando modal abre ou quando props mudam
  $: if (show && (mode || tipo || nota)) {
    setTimeout(() => {
      resetForm();
    }, 50);
  }

  // ==================== VALIDATION ====================
  
  function validateForm(): boolean {
    errors = {};

    if (!formData.almoxarifado_id) {
      errors.almoxarifado_id = 'Almoxarifado é obrigatório';
    }

    if (!formData.data_documento) {
      errors.data_documento = 'Data do documento é obrigatória';
    }

    // Validação específica para transferência
    if (formData.tipo_nota === 'TRANSFERENCIA') {
      if (!formData.almoxarifado_destino_id) {
        errors.almoxarifado_destino_id = 'Almoxarifado de destino é obrigatório para transferências';
      } else if (formData.almoxarifado_destino_id === formData.almoxarifado_id) {
        errors.almoxarifado_destino_id = 'Almoxarifado de destino deve ser diferente do origem';
      }
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
      console.log('📤 Dados sendo enviados:', formData);
      dispatch('salvar', formData);
    } else {
      console.warn('❌ Formulário inválido:', errors);
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
  $: saveButtonText = mode === 'create' ? 'Criar Nota' : mode === 'edit' ? 'Atualizar Nota' : '';
  $: showSaveButton = mode !== 'view';
  $: isTransferencia = formData.tipo_nota === 'TRANSFERENCIA';

  // Helper para obter label do tipo
  function getTipoLabel(tipoNota: TipoNotaEnum): string {
    const labels: Record<TipoNotaEnum, string> = {
      'ENTRADA': 'Entrada',
      'TRANSFERENCIA': 'Transferência',
      'DESCARTE': 'Descarte',
      'ENTRADA_AJUSTE': 'Entrada (Ajuste)',
      'SAIDA_AJUSTE': 'Saída (Ajuste)'
    };
    return labels[tipoNota] || tipoNota;
  }

  // Helper para obter cor do badge
  function getTipoBadgeColor(tipoNota: TipoNotaEnum): string {
    const colors: Record<TipoNotaEnum, string> = {
      'ENTRADA': 'green',
      'TRANSFERENCIA': 'blue', 
      'DESCARTE': 'red',
      'ENTRADA_AJUSTE': 'yellow',
      'SAIDA_AJUSTE': 'orange'
    };
    return colors[tipoNota] || 'gray';
  }
</script>

<Modal bind:open={show} size="lg" autoclose={false} outsideclose={!loading} on:close={handleModalClose}>
  <div slot="header" class="flex items-center space-x-4">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
      {title}
    </h3>
    <span class="text-sm px-2 py-1 bg-{getTipoBadgeColor(formData.tipo_nota)}-100 text-{getTipoBadgeColor(formData.tipo_nota)}-800 rounded-sm">
      {getTipoLabel(formData.tipo_nota)}
    </span>
  </div>

  <form class="space-y-6" on:submit|preventDefault={handleSalvar}>
    <!-- Informações Básicas -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      <!-- Tipo da Nota (readonly para edit/view) -->
      <div class="md:col-span-2">
        <Label for="tipo_nota" class="mb-2">
          Tipo da Nota *
        </Label>
        {#if mode === 'create'}
          <Select
            id="tipo_nota"
            bind:value={formData.tipo_nota}
            disabled={loading}
            class="rounded-sm"
            on:change={(e) => handleInputChange('tipo_nota', e.target.value)}
          >
            <option value="ENTRADA">Entrada</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="DESCARTE">Descarte</option>
            <option value="ENTRADA_AJUSTE">Entrada (Ajuste)</option>
            <option value="SAIDA_AJUSTE">Saída (Ajuste)</option>
          </Select>
        {:else}
          <div class="flex items-center h-10 px-3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-sm">
            <span class="text-sm">{getTipoLabel(formData.tipo_nota)}</span>
          </div>
        {/if}
      </div>

      <!-- Almoxarifado Origem -->
      <div>
        <Label for="almoxarifado_id" class="mb-2">
          Almoxarifado {isTransferencia ? 'Origem' : ''} *
        </Label>
        <Select
          id="almoxarifado_id"
          bind:value={formData.almoxarifado_id}
          disabled={isReadonly || loading}
          class="rounded-sm {errors.almoxarifado_id ? 'border-red-500' : ''}"
          on:change={(e) => handleInputChange('almoxarifado_id', e.target.value)}
        >
          {#each almoxarifadoOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </Select>
        {#if errors.almoxarifado_id}
          <p class="text-red-500 text-sm mt-1">{errors.almoxarifado_id}</p>
        {/if}
      </div>

      <!-- Almoxarifado Destino (apenas para transferência) -->
      {#if isTransferencia}
        <div>
          <Label for="almoxarifado_destino_id" class="mb-2">
            Almoxarifado Destino *
          </Label>
          <Select
            id="almoxarifado_destino_id"
            bind:value={formData.almoxarifado_destino_id}
            disabled={isReadonly || loading}
            class="rounded-sm {errors.almoxarifado_destino_id ? 'border-red-500' : ''}"
            on:change={(e) => handleInputChange('almoxarifado_destino_id', e.target.value)}
          >
            {#each almoxarifadoOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </Select>
          {#if errors.almoxarifado_destino_id}
            <p class="text-red-500 text-sm mt-1">{errors.almoxarifado_destino_id}</p>
          {/if}
        </div>
      {:else}
        <!-- Espaço vazio para manter grid layout -->
        <div></div>
      {/if}

      <!-- Número do Documento -->
      <div>
        <Label for="numero_documento" class="mb-2">
          Número do Documento
        </Label>
        <Input
          id="numero_documento"
          type="text"
          placeholder="Ex: NF-12345"
          bind:value={formData.numero_documento}
          disabled={isReadonly || loading}
          class="rounded-sm"
          on:input={(e) => handleInputChange('numero_documento', e.target.value)}
        />
        <p class="text-sm text-gray-500 mt-1">
          Nota fiscal, código interno, etc.
        </p>
      </div>

      <!-- Data do Documento -->
      <div>
        <Label for="data_documento" class="mb-2">
          Data do Documento *
        </Label>
        <Input
          id="data_documento"
          type="date"
          bind:value={formData.data_documento}
          disabled={isReadonly || loading}
          class="rounded-sm {errors.data_documento ? 'border-red-500' : ''}"
          on:input={(e) => handleInputChange('data_documento', e.target.value)}
        />
        {#if errors.data_documento}
          <p class="text-red-500 text-sm mt-1">{errors.data_documento}</p>
        {/if}
      </div>
    </div>

    <!-- Observações -->
    <div>
      <Label for="observacoes" class="mb-2">
        Observações
      </Label>
      <Textarea
        id="observacoes"
        placeholder="Observações sobre a nota de movimentação..."
        rows="3"
        bind:value={formData.observacoes}
        disabled={isReadonly || loading}
        class="rounded-sm"
        on:input={(e) => handleInputChange('observacoes', e.target.value)}
      />
    </div>

    <!-- Informações do Status (apenas para visualização/edição) -->
    {#if mode !== 'create' && nota}
      <div class="pt-4 border-t border-gray-200 dark:border-gray-600">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Informações da Nota</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          
          <!-- Status -->
          <div>
            <span class="text-gray-500 dark:text-gray-400">Status:</span>
            <div class="mt-1">
              {#if nota.status === 'RASCUNHO'}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                  Rascunho
                </span>
              {:else if nota.status === 'CONCLUIDA'}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  Concluída
                </span>
              {:else if nota.status === 'CANCELADA'}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                  Cancelada
                </span>
              {/if}
            </div>
          </div>

          <!-- Responsável -->
          {#if nota.responsavel}
            <div>
              <span class="text-gray-500 dark:text-gray-400">Responsável:</span>
              <p class="font-medium">{nota.responsavel.nome}</p>
            </div>
          {/if}

          <!-- Data de Criação -->
          <div>
            <span class="text-gray-500 dark:text-gray-400">Criado em:</span>
            <p class="font-medium">{new Date(nota.created_at).toLocaleDateString('pt-BR')}</p>
          </div>

          <!-- Total de Itens -->
          {#if nota.total_itens || nota.itens}
            <div>
              <span class="text-gray-500 dark:text-gray-400">Total de itens:</span>
              <p class="font-medium">{nota.total_itens || nota.itens?.length || 0}</p>
            </div>
          {/if}

          <!-- Valor Total -->
          {#if nota.valor_total}
            <div>
              <span class="text-gray-500 dark:text-gray-400">Valor total:</span>
              <p class="font-medium">R$ {nota.valor_total.toFixed(2)}</p>
            </div>
          {/if}

          <!-- Almoxarifado Origem -->
          {#if nota.almoxarifado}
            <div>
              <span class="text-gray-500 dark:text-gray-400">Almoxarifado origem:</span>
              <p class="font-medium">{nota.almoxarifado.nome}</p>
            </div>
          {/if}

          <!-- Almoxarifado Destino -->
          {#if nota.almoxarifado_destino}
            <div>
              <span class="text-gray-500 dark:text-gray-400">Almoxarifado destino:</span>
              <p class="font-medium">{nota.almoxarifado_destino.nome}</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Aviso sobre itens -->
    {#if mode === 'create'}
      <div class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Próximo passo</h4>
        <p class="text-sm text-blue-700 dark:text-blue-200">
          Após criar a nota, você poderá adicionar os itens de movimentação específicos e depois processá-la.
        </p>
      </div>
    {/if}
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
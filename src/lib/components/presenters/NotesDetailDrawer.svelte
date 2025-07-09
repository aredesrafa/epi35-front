<!--
  Notes Detail Drawer - Drawer para visualizar/criar/editar notas
  
  Baseado na arquitetura do FichaDetailPresenter com o padrão estabelecido.
  Substitui o modal anterior por um drawer consistente com o resto da aplicação.
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Drawer, Badge, Button, Input, Textarea, Label, Select, Alert } from 'flowbite-svelte';
  import { 
    CheckOutline, 
    FloppyDiskOutline, 
    FileDocOutline,
    PlusOutline,
    ArrowRightOutline
  } from 'flowbite-svelte-icons';
  
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  import NotaItensManager, { type NotaItem } from './NotaItensManager.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  
  import { almoxarifadosAdapter } from '$lib/services/entity/almoxarifadosAdapter';
  import { notasMovimentacaoAdapter } from '$lib/services/process/notasMovimentacaoAdapter';
  import type { 
    NotaMovimentacao, 
    CriarNotaMovimentacaoRequest,
    TipoNotaEnum 
  } from '$lib/services/process/notasMovimentacaoTypes';
  import type { AlmoxarifadoSelectOption } from '$lib/services/entity/almoxarifadosAdapter';
  import { getTipoNotaLabel, getTipoNotaBadgeColor } from '$lib/utils/notasHelpers';

  // ==================== PROPS ====================
  
  export let open = false;
  export let mode: 'create' | 'edit' | 'view' = 'create';
  export let tipo: TipoNotaEnum = 'ENTRADA';
  export let nota: NotaMovimentacao | null = null;
  export const loading = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    salvar: { notaId: string; modo: 'rascunho' | 'concluida' };
    cancelar: void;
    close: void;
  }>();

  // ==================== STATE ====================
  
  // Variável para o Drawer - inicializada com base em open
  let hidden = !open;
  
  // Sincronizar hidden com open
  let lastOpen = open;
  $: if (open !== lastOpen) {
    hidden = !open;
    lastOpen = open;
  }

  // Form data
  let formData: CriarNotaMovimentacaoRequest = {
    tipo: 'ENTRADA',
    almoxarifado_id: '',
    almoxarifado_destino_id: '',
    descricao: '',
    observacoes: '',
    data_documento: new Date().toISOString().split('T')[0],
    itens: []
  };

  // Itens state
  let itens: NotaItem[] = [];
  let itemValidationErrors: string[] = [];

  // Validation state
  let formErrors: Record<string, string> = {};
  let showValidationErrors = false;

  // Options
  let almoxarifadoOptions: AlmoxarifadoSelectOption[] = [];
  let almoxarifadoDestinoOptions: AlmoxarifadoSelectOption[] = [];

  // Loading states
  let saveLoading = false;
  let dataLoading = false;

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    await loadFormData();
  });

  // Resetar quando o drawer abre
  $: if (open) {
    resetForm();
    loadFormData();
  }

  // ==================== DATA LOADING ====================
  
  async function loadFormData(): Promise<void> {
    dataLoading = true;
    
    try {
      // Carregar dados auxiliares
      const almoxarifadosResponse = await almoxarifadosAdapter.listarAlmoxarifados();

      // Converter para opções de select
      almoxarifadoOptions = almoxarifadosResponse.map(alm => ({
        value: alm.id,
        label: alm.nome,
        isPrincipal: alm.isPrincipal,
        unidadeNegocio: alm.unidadeNegocio?.nome
      }));
      
      almoxarifadoDestinoOptions = almoxarifadoOptions;
      
      console.log('📋 NotesDetailDrawer: Almoxarifados carregados:', {
        original: almoxarifadosResponse.length,
        options: almoxarifadoOptions.length,
        samples: almoxarifadoOptions.slice(0, 2).map(opt => ({ value: opt.value, label: opt.label }))
      });

      // Se é edição, carregar dados da nota
      if (mode === 'edit' && nota) {
        await loadNotaData();
      } else {
        // Nova nota: configurar valores padrão
        formData.tipo = tipo;
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
      
      // Fallback para dados básicos em caso de erro
      almoxarifadoOptions = [
        { value: '567a1885-0763-4a13-b9f6-157daa39ddc3', label: 'Almoxarifado Central SP' },
        { value: '1a743859-33e6-4ce3-9158-025dee47922b', label: 'Almoxarifado RJ' }
      ];
      almoxarifadoDestinoOptions = almoxarifadoOptions;
      
      console.log('⚠️ NotesDetailDrawer: Usando fallback para almoxarifados');
    } finally {
      dataLoading = false;
    }
  }

  async function loadNotaData(): Promise<void> {
    if (!nota) return;

    try {
      // Mapear dados da nota para o formulário
      formData = {
        tipo: nota.tipo,
        almoxarifado_id: nota.almoxarifado_id || '',
        almoxarifado_destino_id: nota.almoxarifado_destino_id || '',
        descricao: nota.descricao || '',
        observacoes: nota.observacoes || '',
        data_documento: nota.data_documento?.split('T')[0] || new Date().toISOString().split('T')[0],
        itens: []
      };

      // Mapear itens se existirem
      if (nota.itens && nota.itens.length > 0) {
        itens = nota.itens.map(item => ({
          tipo_epi_id: item.tipo_epi_id,
          quantidade: item.quantidade,
          custo_unitario: item.custo_unitario || 0,
          observacoes: item.observacoes || ''
        }));
      }

    } catch (error) {
      console.error('Erro ao carregar dados da nota:', error);
    }
  }

  // ==================== FORM MANAGEMENT ====================
  
  function resetForm(): void {
    formData = {
      tipo: tipo,
      almoxarifado_id: '',
      almoxarifado_destino_id: '',
      descricao: '',
      observacoes: '',
      data_documento: new Date().toISOString().split('T')[0],
      itens: []
    };
    itens = [];
    formErrors = {};
    showValidationErrors = false;
    itemValidationErrors = [];
  }

  function validateForm(): boolean {
    formErrors = {};
    
    // Validações básicas
    if (!formData.almoxarifado_id) {
      formErrors.almoxarifado_id = 'Almoxarifado é obrigatório';
    }
    
    if (formData.tipo === 'TRANSFERENCIA' && !formData.almoxarifado_destino_id) {
      formErrors.almoxarifado_destino_id = 'Almoxarifado de destino é obrigatório para transferência';
    }
    
    if (formData.tipo === 'TRANSFERENCIA' && formData.almoxarifado_id === formData.almoxarifado_destino_id) {
      formErrors.almoxarifado_destino_id = 'Almoxarifado de destino deve ser diferente do origem';
    }

    if (!formData.data_documento) {
      formErrors.data_documento = 'Data do documento é obrigatória';
    }

    // Validar itens
    if (itens.length === 0) {
      itemValidationErrors = ['Pelo menos um item deve ser adicionado'];
      return false;
    }

    return Object.keys(formErrors).length === 0;
  }

  // ==================== SAVE HANDLERS ====================
  
  async function handleSaveRascunho(): Promise<void> {
    if (!validateForm()) {
      showValidationErrors = true;
      return;
    }

    await saveNota('rascunho');
  }

  async function handleSaveConcluida(): Promise<void> {
    if (!validateForm()) {
      showValidationErrors = true;
      return;
    }

    await saveNota('concluida');
  }

  async function saveNota(modo: 'rascunho' | 'concluida'): Promise<void> {
    saveLoading = true;
    
    try {
      // Preparar dados para salvar
      const notaData: CriarNotaMovimentacaoRequest = {
        ...formData,
        itens: itens
      };

      let notaId: string;

      if (mode === 'create') {
        // Criar nova nota
        const response = await notasMovimentacaoAdapter.criarNota(notaData);
        notaId = response.id;
      } else {
        // Atualizar nota existente
        if (!nota?.id) {
          throw new Error('ID da nota não encontrado');
        }
        
        await notasMovimentacaoAdapter.atualizarNota(nota.id, notaData);
        notaId = nota.id;
      }

      // Emitir evento de sucesso
      dispatch('salvar', { notaId, modo });
      
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      throw error;
    } finally {
      saveLoading = false;
    }
  }

  // ==================== EVENT HANDLERS ====================
  
  function handleClose(): void {
    dispatch('close');
  }

  function handleCancel(): void {
    dispatch('cancelar');
  }

  function handleItensChange(event: CustomEvent<NotaItem[]>): void {
    itens = event.detail;
    formData.itens = itens;
    
    // Limpar erros de validação de itens quando itens são adicionados
    if (itens.length > 0) {
      itemValidationErrors = [];
    }
  }

  function handleItensValidationChange(event: CustomEvent<string>): void {
    if (event.detail) {
      itemValidationErrors = [event.detail];
    } else {
      itemValidationErrors = [];
    }
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: drawerTitle = mode === 'create' ? `Nova Nota - ${getTipoNotaLabel(formData.tipo)}` : 
    mode === 'edit' ? `Editar Nota - ${getTipoNotaLabel(formData.tipo)}` : 
    `Visualizar Nota - ${getTipoNotaLabel(formData.tipo)}`;

  $: totalItens = itens.length;
  
  $: valorTotal = itens.reduce((total, item) => {
    const custo = typeof item.custo_unitario === 'number' ? item.custo_unitario : 0;
    return total + (item.quantidade * custo);
  }, 0);

  $: canSave = !saveLoading && !dataLoading && mode !== 'view';

  // Botões do header baseados no modo
  $: primaryAction = mode === 'view' ? null : {
    text: 'Concluir',
    icon: 'CheckOutline',
    disabled: !canSave
  };

  $: secondaryAction = mode === 'view' ? null : {
    text: 'Salvar Rascunho',
    icon: 'FloppyDiskOutline', 
    disabled: !canSave
  };

  $: statusText = mode === 'create' ? 'NOVA' : 
    mode === 'edit' ? 'EDITANDO' : 
    nota?.status || 'VISUALIZANDO';

  $: additionalInfo = [
    `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`,
    valorTotal > 0 ? `R$ ${valorTotal.toFixed(2)}` : 'Sem valor'
  ];

  // ==================== REACTIVE STATEMENTS ====================
  
  // Atualizar opções de almoxarifado destino baseado no tipo
  $: if (formData.tipo !== 'TRANSFERENCIA') {
    formData.almoxarifado_destino_id = '';
  }

  // Filtrar almoxarifado destino para não incluir o de origem
  $: almoxarifadoDestinoFiltrado = almoxarifadoDestinoOptions.filter(
    alm => alm.value !== formData.almoxarifado_id
  );
</script>

<style>
  :global(.drawer-notas) {
    top: 64px !important; /* Altura do header */
    height: calc(100vh - 64px) !important;
    max-width: 940px !important;
    z-index: 50 !important;
  }
  
  /* Ajustar backdrop para não cobrir header - seletor mais específico */
  :global([role="presentation"].fixed.top-0.start-0.z-50.w-full.h-full) {
    top: 64px !important; /* Começar abaixo do header */
    height: calc(100vh - 64px) !important;
  }
</style>

<Drawer 
  bind:hidden 
  placement="right" 
  width="w-full max-w-[940px]"
  backdrop={true}
  activateClickOutside={true}
  bgOpacity="bg-black/50"
  position="fixed"
  id="notas-detail-drawer"
  class="drawer-notas"
>
  <!-- Header -->
  <DrawerHeader
    title={drawerTitle}
    objectType="NOTA DE MOVIMENTAÇÃO"
    iconName="FileDocOutline"
    status={statusText}
    statusType="movimento"
    {additionalInfo}
    {primaryAction}
    {secondaryAction}
    on:close={handleClose}
    on:primaryAction={handleSaveConcluida}
    on:secondaryAction={handleSaveRascunho}
  />

  {#if dataLoading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner />
    </div>
  {:else}
    <!-- Validation Errors -->
    {#if showValidationErrors && (Object.keys(formErrors).length > 0 || itemValidationErrors.length > 0)}
      <div class="p-6 pb-0">
        <Alert color="red" class="rounded-sm">
          <span class="font-medium">Erros de validação:</span>
          <ul class="mt-2 list-disc list-inside">
            {#each Object.values(formErrors) as error}
              <li>{error}</li>
            {/each}
            {#each itemValidationErrors as error}
              <li>{error}</li>
            {/each}
          </ul>
        </Alert>
      </div>
    {/if}

    <!-- Content Container -->
    <div class="p-6 space-y-6">

      <!-- Dados Básicos -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Dados da Nota</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Tipo -->
          <div>
            <Label for="tipo" class="mb-2 text-gray-900 dark:text-white">Tipo de Nota</Label>
            <Select
              id="tipo"
              bind:value={formData.tipo}
              disabled={mode === 'view'}
              class="rounded-sm {formErrors.tipo ? 'border-red-500' : ''}"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="DESCARTE">Descarte</option>
            </Select>
            {#if formErrors.tipo}
              <p class="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.tipo}</p>
            {/if}
          </div>

          <!-- Data do Documento -->
          <div>
            <Label for="data_documento" class="mb-2 text-gray-900 dark:text-white">Data do Documento</Label>
            <Input
              id="data_documento"
              type="date"
              bind:value={formData.data_documento}
              disabled={mode === 'view'}
              class="rounded-sm {formErrors.data_documento ? 'border-red-500' : ''}"
            />
            {#if formErrors.data_documento}
              <p class="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.data_documento}</p>
            {/if}
          </div>

          <!-- Almoxarifado Origem -->
          <div>
            <Label for="almoxarifado_id" class="mb-2 text-gray-900 dark:text-white">Almoxarifado</Label>
            <Select
              id="almoxarifado_id"
              bind:value={formData.almoxarifado_id}
              disabled={mode === 'view'}
              class="rounded-sm {formErrors.almoxarifado_id ? 'border-red-500' : ''}"
            >
              <option value="">Selecione um almoxarifado</option>
              {#each almoxarifadoOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </Select>
            {#if formErrors.almoxarifado_id}
              <p class="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.almoxarifado_id}</p>
            {/if}
          </div>

          <!-- Almoxarifado Destino (apenas para transferência) -->
          {#if formData.tipo === 'TRANSFERENCIA'}
            <div>
              <Label for="almoxarifado_destino_id" class="mb-2 text-gray-900 dark:text-white">Almoxarifado Destino</Label>
              <Select
                id="almoxarifado_destino_id"
                bind:value={formData.almoxarifado_destino_id}
                disabled={mode === 'view'}
                class="rounded-sm {formErrors.almoxarifado_destino_id ? 'border-red-500' : ''}"
              >
                <option value="">Selecione o destino</option>
                {#each almoxarifadoDestinoFiltrado as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </Select>
              {#if formErrors.almoxarifado_destino_id}
                <p class="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.almoxarifado_destino_id}</p>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Descrição -->
        <div>
          <Label for="descricao" class="mb-2 text-gray-900 dark:text-white">Descrição</Label>
          <Textarea
            id="descricao"
            bind:value={formData.descricao}
            disabled={mode === 'view'}
            placeholder="Descrição da movimentação..."
            rows="3"
            class="rounded-sm"
          />
        </div>

        <!-- Observações -->
        <div>
          <Label for="observacoes" class="mb-2 text-gray-900 dark:text-white">Observações</Label>
          <Textarea
            id="observacoes"
            bind:value={formData.observacoes}
            disabled={mode === 'view'}
            placeholder="Observações adicionais..."
            rows="2"
            class="rounded-sm"
          />
        </div>
      </div>

      <!-- Itens Manager -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Itens da Nota</h3>
        
        <NotaItensManager
          bind:itens
          tipo={formData.tipo}
          almoxarifadoId={formData.almoxarifado_id}
          almoxarifadoDestinoId={formData.almoxarifado_destino_id}
          readonly={mode === 'view'}
          on:itensChanged={handleItensChange}
          on:validationError={handleItensValidationChange}
        />
      </div>

      <!-- Resumo -->
      {#if totalItens > 0}
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">Resumo</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600 dark:text-gray-400">Total de itens:</span>
              <span class="font-medium ml-2">{totalItens}</span>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Valor total:</span>
              <span class="font-medium ml-2 text-green-600 dark:text-green-400">
                R$ {valorTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</Drawer>
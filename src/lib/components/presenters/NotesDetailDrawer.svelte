<!--
  Notes Detail Drawer - Drawer para visualizar/criar/editar notas
  
  Baseado na arquitetura do FichaDetailPresenter com o padrão estabelecido.
  Substitui o modal anterior por um drawer consistente com o resto da aplicação.
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Drawer, Badge, Button, Input, Textarea, Label, Radio, Select, Alert } from 'flowbite-svelte';
  import { 
    CheckOutline, 
    FloppyDiskOutline, 
    FileDocOutline,
    PlusOutline,
    ArrowRightOutline
  } from 'flowbite-svelte-icons';
  
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  import NotaItensManagerSimplified, { type NotaItem } from './NotaItensManagerSimplified.svelte';
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

  // Form data corrigido para formato da API
  let formData = {
    tipo_nota: 'ENTRADA' as TipoNotaEnum,
    almoxarifado_origem_id: '',
    almoxarifado_destino_id: '', 
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
      
      // Ordenar: almoxarifado principal primeiro, depois os outros
      almoxarifadoOptions.sort((a, b) => {
        if (a.isPrincipal && !b.isPrincipal) return -1;
        if (!a.isPrincipal && b.isPrincipal) return 1;
        return a.label.localeCompare(b.label);
      });
      
      almoxarifadoDestinoOptions = almoxarifadoOptions;
      
      console.log('📋 NotesDetailDrawer: Almoxarifados carregados:', {
        original: almoxarifadosResponse.length,
        options: almoxarifadoOptions.length,
        principal: almoxarifadoOptions.find(opt => opt.isPrincipal)?.label || 'Nenhum',
        samples: almoxarifadoOptions.slice(0, 2).map(opt => ({ value: opt.value, label: opt.label, isPrincipal: opt.isPrincipal }))
      });

      // Se é edição, carregar dados da nota
      if (mode === 'edit' && nota) {
        await loadNotaData();
      } else {
        // Nova nota: configurar valores padrão
        formData.tipo_nota = tipo;
        
        // Auto-selecionar almoxarifado padrão baseado no tipo de nota
        if (almoxarifadoOptions.length > 0) {
          const almoxarifadoPadrao = almoxarifadoOptions.find(opt => opt.isPrincipal) || almoxarifadoOptions[0];
          
          
          if (formData.tipo_nota === 'ENTRADA') {
            // Para ENTRADA: almoxarifado de destino é obrigatório (onde os itens vão entrar)
            if (!formData.almoxarifado_destino_id) {
              formData.almoxarifado_destino_id = almoxarifadoPadrao.value;
            }
          } else if (formData.tipo_nota === 'TRANSFERENCIA') {
            // Para TRANSFERENCIA: tanto origem quanto destino são obrigatórios
            if (!formData.almoxarifado_origem_id) {
              formData.almoxarifado_origem_id = almoxarifadoPadrao.value;
            }
          } else if (formData.tipo_nota === 'DESCARTE') {
            // Para DESCARTE: almoxarifado de origem é obrigatório (de onde sai)
            if (!formData.almoxarifado_origem_id) {
              formData.almoxarifado_origem_id = almoxarifadoPadrao.value;
            }
          }
          
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
      
      // Fallback para dados básicos em caso de erro
      almoxarifadoOptions = [
        { value: '567a1885-0763-4a13-b9f6-157daa39ddc3', label: 'Almoxarifado Central SP', isPrincipal: true },
        { value: '1a743859-33e6-4ce3-9158-025dee47922b', label: 'Almoxarifado RJ', isPrincipal: false }
      ];
      almoxarifadoDestinoOptions = almoxarifadoOptions;
      
      // Auto-selecionar almoxarifado padrão mesmo no fallback
      if (mode !== 'edit') {
        formData.tipo_nota = tipo;
        const almoxarifadoPadrao = almoxarifadoOptions[0];
        
        if (tipo === 'ENTRADA' && !formData.almoxarifado_destino_id) {
          formData.almoxarifado_destino_id = almoxarifadoPadrao.value;
        } else if (tipo === 'TRANSFERENCIA' && !formData.almoxarifado_origem_id) {
          formData.almoxarifado_origem_id = almoxarifadoPadrao.value;
        } else if (tipo === 'DESCARTE' && !formData.almoxarifado_origem_id) {
          formData.almoxarifado_origem_id = almoxarifadoPadrao.value;
        }
      }
      
    } finally {
      dataLoading = false;
    }
  }

  async function loadNotaData(): Promise<void> {
    if (!nota) return;

    try {
      // Mapear dados da nota para o formulário
      formData = {
        tipo_nota: nota.tipo,
        almoxarifado_origem_id: nota.almoxarifado_id || nota.almoxarifadoOrigemId || '',
        almoxarifado_destino_id: nota.almoxarifado_destino_id || nota.almoxarifadoDestinoId || '',
        observacoes: nota.observacoes || '',
        data_documento: nota.data_documento?.split('T')[0] || new Date().toISOString().split('T')[0],
        itens: []
      };

      // Mapear itens se existirem
      if (nota.itens && nota.itens.length > 0) {
        itens = nota.itens.map(item => ({
          temp_id: `existing_${item.id}`,
          tipo_epi_id: item.tipo_epi_id,
          estoque_item_id: item.estoque_item_id,
          quantidade: item.quantidade,
          custo_unitario: item.custo_unitario || 0,
          equipamento_nome: item.equipamento_nome || '',
          categoria: item.categoria || '',
          numero_ca: item.equipamento_ca || ''
        }));
      }

    } catch (error) {
      console.error('Erro ao carregar dados da nota:', error);
    }
  }

  // ==================== FORM MANAGEMENT ====================
  
  function resetForm(): void {
    // Criar um objeto completamente novo para garantir reatividade
    const newFormData = {
      tipo_nota: tipo,
      almoxarifado_origem_id: '',
      almoxarifado_destino_id: '',
      observacoes: '',
      data_documento: new Date().toISOString().split('T')[0],
      itens: []
    };
    
    // Forçar uma nova referência para garantir reatividade
    formData = newFormData;
    itens = [];
    formErrors = {};
    showValidationErrors = false;
    itemValidationErrors = [];
    
  }

  // Validação flexível para rascunho - permite campos vazios
  function validateRascunho(): boolean {
    formErrors = {};
    itemValidationErrors = [];
    
    // Para rascunho, apenas validações críticas
    if (formData.tipo_nota === 'TRANSFERENCIA' && formData.almoxarifado_origem_id && formData.almoxarifado_destino_id) {
      if (formData.almoxarifado_origem_id === formData.almoxarifado_destino_id) {
        formErrors.almoxarifado_destino_id = 'Almoxarifado de destino deve ser diferente do origem';
      }
    }

    // Validar se há pelo menos um item ou permitir salvar vazio como rascunho
    if (itens.length === 0) {
      // Para rascunho, apenas avisar sem impedir salvamento
      itemValidationErrors = ['⚠️ Rascunho salvo sem itens - adicione itens antes de concluir'];
    }

    // Rascunho sempre pode ser salvo, mesmo com campos vazios
    return Object.keys(formErrors).length === 0;
  }

  // Validação rigorosa para nota completa - todos os campos obrigatórios
  function validateConcluida(): boolean {
    formErrors = {};
    itemValidationErrors = [];
    
    // Validações baseadas no tipo de nota
    if (formData.tipo_nota === 'ENTRADA') {
      // Para ENTRADA: almoxarifado de destino é obrigatório
      if (!formData.almoxarifado_destino_id) {
        formErrors.almoxarifado_destino_id = 'Almoxarifado de destino é obrigatório para entrada';
      }
    } else if (formData.tipo_nota === 'TRANSFERENCIA') {
      // Para TRANSFERENCIA: tanto origem quanto destino são obrigatórios
      if (!formData.almoxarifado_origem_id) {
        formErrors.almoxarifado_origem_id = 'Almoxarifado de origem é obrigatório para transferência';
      }
      if (!formData.almoxarifado_destino_id) {
        formErrors.almoxarifado_destino_id = 'Almoxarifado de destino é obrigatório para transferência';
      }
      if (formData.almoxarifado_origem_id === formData.almoxarifado_destino_id) {
        formErrors.almoxarifado_destino_id = 'Almoxarifado de destino deve ser diferente do origem';
      }
    } else if (formData.tipo_nota === 'DESCARTE') {
      // Para DESCARTE: almoxarifado de origem é obrigatório
      if (!formData.almoxarifado_origem_id) {
        formErrors.almoxarifado_origem_id = 'Almoxarifado de origem é obrigatório para descarte';
      }
    }

    if (!formData.data_documento) {
      formErrors.data_documento = 'Data do documento é obrigatória';
    }

    // Validar itens obrigatoriamente
    if (itens.length === 0) {
      itemValidationErrors = ['Pelo menos um item deve ser adicionado para concluir a nota'];
      return false;
    }

    // Validar se todos os itens têm custo (para entradas)
    if (formData.tipo_nota === 'ENTRADA') {
      const itensSemCusto = itens.filter(item => !item.custo_unitario || item.custo_unitario <= 0);
      if (itensSemCusto.length > 0) {
        itemValidationErrors = [`${itensSemCusto.length} ${itensSemCusto.length === 1 ? 'item não possui' : 'itens não possuem'} custo unitário válido`];
        return false;
      }
    }

    return Object.keys(formErrors).length === 0;
  }

  // ==================== SAVE HANDLERS ====================
  
  async function handleSaveRascunho(): Promise<void> {
    if (!validateRascunho()) {
      showValidationErrors = true;
      return;
    }

    // Para rascunho, mostrar warnings mas não bloquear
    showValidationErrors = itemValidationErrors.length > 0;
    await saveNota('rascunho');
  }

  async function handleSaveConcluida(): Promise<void> {
    if (!validateConcluida()) {
      showValidationErrors = true;
      return;
    }

    await saveNota('concluida');
  }

  async function saveNota(modo: 'rascunho' | 'concluida'): Promise<void> {
    saveLoading = true;
    
    try {
      // Preparar dados para salvar com formato correto da API baseado no tipo de nota
      const notaData: any = {
        tipo_nota: formData.tipo_nota,
        data_documento: formData.data_documento
      };

      // Adicionar observacoes apenas se existir (evitar null)
      if (formData.observacoes && formData.observacoes.trim() !== '') {
        notaData.observacoes = formData.observacoes.trim();
      }

      // Adicionar campos específicos baseados no tipo de nota
      if (formData.tipo_nota === 'ENTRADA') {
        // Para ENTRADA: apenas almoxarifado de destino
        if (formData.almoxarifado_destino_id) {
          notaData.almoxarifado_destino_id = formData.almoxarifado_destino_id;
        }
      } else if (formData.tipo_nota === 'TRANSFERENCIA') {
        // Para TRANSFERENCIA: tanto origem quanto destino
        if (formData.almoxarifado_origem_id) {
          notaData.almoxarifado_origem_id = formData.almoxarifado_origem_id;
        }
        if (formData.almoxarifado_destino_id) {
          notaData.almoxarifado_destino_id = formData.almoxarifado_destino_id;
        }
      } else if (formData.tipo_nota === 'DESCARTE') {
        // Para DESCARTE: apenas almoxarifado de origem
        if (formData.almoxarifado_origem_id) {
          notaData.almoxarifado_origem_id = formData.almoxarifado_origem_id;
        }
      }


      let notaId: string;

      if (mode === 'create') {
        // Criar nova nota
        const response = await notasMovimentacaoAdapter.criarNota(notaData);
        console.log('📝 Resposta da criação da nota:', response);
        console.log('🔍 Estrutura completa da resposta:', JSON.stringify(response, null, 2));
        
        // Extrair ID de forma mais defensiva
        notaId = response?.data?.id || response?.id || response?.data?.uuid || response?.uuid;
        
        if (!notaId) {
          console.error('❌ Não foi possível extrair o ID da nota criada:', response);
          throw new Error('Erro: ID da nota não encontrado na resposta do servidor');
        }
        
        console.log('✅ Nota criada com ID:', notaId);
        
        // Adicionar itens se existirem
        if (itens.length > 0) {
          for (const item of itens) {
            const itemData = {
              tipo_epi_id: item.tipo_epi_id,
              estoque_item_id: item.estoque_item_id,
              quantidade: item.quantidade,
              custo_unitario: item.custo_unitario
            };
            
            await notasMovimentacaoAdapter.adicionarItem(notaId, itemData);
          }
        }
        
        // Se modo é concluida, concluir a nota
        if (modo === 'concluida') {
          await notasMovimentacaoAdapter.concluirNota(notaId);
        }
        
      } else {
        // Atualizar nota existente
        if (!nota?.id) {
          throw new Error('ID da nota não encontrado');
        }
        
        await notasMovimentacaoAdapter.atualizarNota(nota.id, {
          data_documento: notaData.data_documento,
          observacoes: notaData.observacoes
        });
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
  
  $: drawerTitle = mode === 'create' ? `Nova Nota - ${getTipoNotaLabel(formData.tipo_nota)}` : 
    mode === 'edit' ? `Editar Nota - ${getTipoNotaLabel(formData.tipo_nota)}` : 
    `Visualizar Nota - ${getTipoNotaLabel(formData.tipo_nota)}`;

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

  // Filtrar almoxarifado destino para não incluir o de origem
  $: almoxarifadoDestinoFiltrado = almoxarifadoDestinoOptions.filter(
    alm => alm.value !== formData.almoxarifado_origem_id
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
            <Label for="tipo_nota" class="mb-2 text-gray-900 dark:text-white">Tipo de Nota</Label>
            <Select
              id="tipo_nota"
              bind:value={formData.tipo_nota}
              disabled={mode === 'view'}
              class="rounded-sm {formErrors.tipo_nota ? 'border-red-500' : ''}"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="DESCARTE">Descarte</option>
            </Select>
            {#if formErrors.tipo_nota}
              <p class="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.tipo_nota}</p>
            {/if}
          </div>

          <!-- Data do Documento -->
          <div>
            <Label for="data_documento" class="mb-2 text-gray-900 dark:text-white">Data do Documento</Label>
            <Input
              id="data_documento"
              type="date"
              size="md"
              bind:value={formData.data_documento}
              disabled={mode === 'view'}
              class="rounded-sm h-10 text-sm {formErrors.data_documento ? 'border-red-500' : ''}"
            />
            {#if formErrors.data_documento}
              <p class="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.data_documento}</p>
            {/if}
          </div>

          <!-- Almoxarifado - baseado no tipo de nota -->
          {#if formData.tipo_nota === 'ENTRADA'}
            <!-- Para ENTRADA: Radio buttons para almoxarifado de destino -->
            <div>
              <Label class="mb-3 text-gray-900 dark:text-white">
                Almoxarifado de Destino
              </Label>
              <div class="space-y-2">
                {#each almoxarifadoOptions as option}
                  <div class="flex items-center">
                    <Radio
                      name="almoxarifado_destino_id"
                      value={option.value}
                      bind:group={formData.almoxarifado_destino_id}
                      disabled={mode === 'view'}
                      class="text-primary-600 focus:ring-primary-500"
                    />
                    <Label class="ml-2 text-sm text-gray-900 dark:text-white">
                      {option.label}
                      {#if option.isPrincipal}
                        <span class="text-xs text-primary-600 dark:text-primary-400 font-medium ml-1">(Principal)</span>
                      {/if}
                    </Label>
                  </div>
                {/each}
              </div>
              {#if formErrors.almoxarifado_destino_id}
                <p class="text-red-500 dark:text-red-400 text-sm mt-2">{formErrors.almoxarifado_destino_id}</p>
              {/if}
            </div>
          {:else}
            <!-- Para TRANSFERENCIA e DESCARTE: Radio buttons para almoxarifado de origem -->
            <div>
              <Label class="mb-3 text-gray-900 dark:text-white">
                Almoxarifado de Origem
              </Label>
              <div class="space-y-2">
                {#each almoxarifadoOptions as option}
                  <div class="flex items-center">
                    <Radio
                      name="almoxarifado_origem_id"
                      value={option.value}
                      bind:group={formData.almoxarifado_origem_id}
                      disabled={mode === 'view'}
                      class="text-primary-600 focus:ring-primary-500"
                    />
                    <Label class="ml-2 text-sm text-gray-900 dark:text-white">
                      {option.label}
                      {#if option.isPrincipal}
                        <span class="text-xs text-primary-600 dark:text-primary-400 font-medium ml-1">(Principal)</span>
                      {/if}
                    </Label>
                  </div>
                {/each}
              </div>
              {#if formErrors.almoxarifado_origem_id}
                <p class="text-red-500 dark:text-red-400 text-sm mt-2">{formErrors.almoxarifado_origem_id}</p>
              {/if}
            </div>
          {/if}

          <!-- Almoxarifado Destino (apenas para transferência) -->
          {#if formData.tipo_nota === 'TRANSFERENCIA'}
            <div>
              <Label class="mb-3 text-gray-900 dark:text-white">Almoxarifado de Destino</Label>
              <div class="space-y-2">
                {#each almoxarifadoDestinoFiltrado as option}
                  <div class="flex items-center">
                    <Radio
                      name="almoxarifado_destino_id"
                      value={option.value}
                      bind:group={formData.almoxarifado_destino_id}
                      disabled={mode === 'view'}
                      class="text-primary-600 focus:ring-primary-500"
                    />
                    <Label class="ml-2 text-sm text-gray-900 dark:text-white">
                      {option.label}
                      {#if option.isPrincipal}
                        <span class="text-xs text-primary-600 dark:text-primary-400 font-medium ml-1">(Principal)</span>
                      {/if}
                    </Label>
                  </div>
                {/each}
              </div>
              {#if formErrors.almoxarifado_destino_id}
                <p class="text-red-500 dark:text-red-400 text-sm mt-2">{formErrors.almoxarifado_destino_id}</p>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Observações (campo único, não obrigatório) -->
        <div>
          <Label for="observacoes" class="mb-2 text-gray-900 dark:text-white">
            Observações 
            <span class="text-xs text-gray-500 dark:text-gray-400">(opcional)</span>
          </Label>
          <Textarea
            id="observacoes"
            bind:value={formData.observacoes}
            disabled={mode === 'view'}
            placeholder="Observações sobre a movimentação..."
            rows="3"
            class="rounded-sm {formErrors.observacoes ? 'border-red-500' : ''}"
          />
          {#if formErrors.observacoes}
            <p class="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.observacoes}</p>
          {/if}
        </div>
      </div>

      <!-- Itens Manager -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <NotaItensManagerSimplified
          bind:itens
          tipo={formData.tipo_nota}
          almoxarifadoId={formData.tipo_nota === 'ENTRADA' ? formData.almoxarifado_destino_id : formData.almoxarifado_origem_id}
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
<!--
  Notes Form Modal Presenter - Modal Dual (Itens + Dados)
  
  Modal refatorado com duas abas:
  - Modo Itens: Gerenciamento de itens da nota (principal)
  - Modo Dados: Campos burocráticos (secundário)
  
  Fluxo UX otimizado: itens primeiro, burocracia depois
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Modal, Button, Input, Textarea, Label, Select, Tabs, TabItem, Badge, Alert } from 'flowbite-svelte';
  import { ArrowRightOutline, ArrowLeftOutline, CheckOutline, FloppyDiskOutline, FileDocOutline } from 'flowbite-svelte-icons';
  import NotaItensManager from './NotaItensManager.svelte';
  import type { NotaItem } from './NotaItensManager.svelte';
  import { almoxarifadosAdapter } from '$lib/services/entity/almoxarifadosAdapter';
  import { notasMovimentacaoAdapter } from '$lib/services/process/notasMovimentacaoAdapter';
  import { tiposEpiAdapter } from '$lib/services/entity/tiposEpiAdapter';
  import type { 
    NotaMovimentacao, 
    CriarNotaMovimentacaoRequest,
    TipoNotaEnum 
  } from '$lib/services/process/notasMovimentacaoTypes';
  import type { AlmoxarifadoSelectOption } from '$lib/services/entity/almoxarifadosAdapter';
  import { getTipoNotaLabel, getTipoNotaBadgeColor } from '$lib/utils/notasHelpers';

  // ==================== PROPS ====================
  
  export let show = false;
  export let mode: 'create' | 'edit' | 'view' = 'create';
  export let tipo: TipoNotaEnum = 'ENTRADA';
  export let title = 'Nota de Movimentação';
  export let nota: NotaMovimentacao | null = null;
  export let loading = false;

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    salvar: { notaId: string; modo: 'rascunho' | 'concluida' };
    cancelar: void;
  }>();

  // ==================== STATE ====================
  
  // Modal dual state
  let modalMode: 'itens' | 'dados' = 'itens';
  let activeTabIndex = 0;

  // Form data
  let formData: CriarNotaMovimentacaoRequest = {
    tipo_nota: 'ENTRADA',
    almoxarifado_destino_id: '',
    numero_documento: '',
    data_documento: '',
    observacoes: ''
  };

  // Itens temporários
  let itensTemp: NotaItem[] = [];

  // Form validation
  let errors: Record<string, string> = {};
  let validationMessage = '';

  // Options carregadas do backend
  let almoxarifadoOptions: AlmoxarifadoSelectOption[] = [];
  let loadingOptions = false;

  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    await loadAlmoxarifadoOptions();
  });

  // Reativo: resetar formulário quando modal abre ou quando props mudam
  $: if (show && (mode || tipo || nota)) {
    setTimeout(() => {
      resetForm();
    }, 50);
  }

  // ==================== DATA LOADING ====================

  async function loadAlmoxarifadoOptions(): Promise<void> {
    try {
      loadingOptions = true;
      almoxarifadoOptions = await almoxarifadosAdapter.obterOpcoesSelectComCache();
      console.log('✅ Almoxarifados carregados:', almoxarifadoOptions.length);
    } catch (error) {
      console.error('❌ Erro ao carregar almoxarifados:', error);
      almoxarifadoOptions = [];
    } finally {
      loadingOptions = false;
    }
  }

  // Função para resetar/preencher formulário
  function resetForm() {
    console.log('🔄 NotesFormModal: Resetando formulário:', { mode, tipo, nota });
    
    // Resetar estado do modal
    modalMode = 'itens';
    activeTabIndex = 0;
    itensTemp = [];
    errors = {};
    validationMessage = '';
    
    if (mode === 'edit' || mode === 'view') {
      if (nota) {
        console.log('🔍 Mapeando campos da nota:', JSON.stringify(nota, null, 2));
        
        // Mapear campos da nota baseado na documentação API (linha 855-885)
        // Estrutura: { success: true, data: { id, numero, tipo, status, observacoes, createdAt, itens } }
        formData = {
          tipo_nota: nota.tipo || (nota as any).tipo_nota || 'ENTRADA',
          almoxarifado_origem_id: nota.almoxarifadoOrigemId || (nota as any).almoxarifado_origem_id || (nota as any).almoxarifado_id,
          almoxarifado_destino_id: nota.almoxarifadoDestinoId || (nota as any).almoxarifado_destino_id,
          numero_documento: nota.numero || (nota as any).numero_documento || (nota as any).numeroDocumento || '',
          data_documento: (nota as any).dataDocumento || (nota as any).data_documento || nota.createdAt?.split('T')[0] || '',
          observacoes: nota.observacoes || (nota as any).observacao || ''
        };

        console.log('✅ FormData mapeada:', formData);

        // Carregar itens baseado na estrutura REAL da API
        // A API retorna "_itens" em vez de "itens" (conforme logs)
        const itensArray = nota._itens || nota.itens || nota.items || [];
        if (Array.isArray(itensArray)) {
          itensTemp = itensArray.map((item, index) => {
            console.log(`🔍 Item ${index}:`, JSON.stringify(item, null, 2));
            
            return {
              id: item.id || `temp_${index}`,
              temp_id: `existing_${item.id || index}`,
              quantidade: item.quantidade || item.quantity || 0,
              estoque_item_id: item.estoqueItemId || item.estoque_item_id,
              tipo_epi_id: item.tipoEpiId || item.tipo_epi_id || item.tipoEpi?.id,
              custo_unitario: item.custoUnitario || item.custo_unitario || item.preco || 0,
              // Precisaremos buscar os detalhes do tipo EPI para ter nome/categoria
              equipamento_nome: item.tipoEpi?.nome || item.equipamento_nome || item.nome || `Item ${item.tipoEpiId?.slice(0, 8) || index}`,
              categoria: item.tipoEpi?.categoria || item.categoria || 'Categoria não informada',
              numero_ca: item.tipoEpi?.codigo || item.tipoEpi?.numeroCA || item.numero_ca || item.equipamento_ca || ''
            };
          });
          
          // Enriquecer itens com dados dos tipos EPI se estivermos no modo view
          if (mode === 'view' && itensTemp.length > 0) {
            setTimeout(() => enrichItensWithTipoEpiData(), 100);
          }
        }
        
        console.log('✅ Formulário preenchido para edição/visualização:', formData);
        console.log('📦 Itens carregados:', itensTemp.length, itensTemp);
      }
    } else {
      // Modo create - usar valores padrão
      // Initialize form based on note type
      if (tipo === 'ENTRADA') {
        formData = {
          tipo_nota: tipo,
          almoxarifado_destino_id: '',
          numero_documento: '',
          data_documento: new Date().toISOString().split('T')[0],
          observacoes: ''
        };
      } else if (tipo === 'TRANSFERENCIA') {
        formData = {
          tipo_nota: tipo,
          almoxarifado_origem_id: '',
          almoxarifado_destino_id: '',
          numero_documento: '',
          data_documento: new Date().toISOString().split('T')[0],
          observacoes: ''
        };
      } else {
        // DESCARTE, ENTRADA_AJUSTE, SAIDA_AJUSTE
        formData = {
          tipo_nota: tipo,
          almoxarifado_origem_id: '',
          numero_documento: '',
          data_documento: new Date().toISOString().split('T')[0],
          observacoes: ''
        };
      }
      console.log('✅ Formulário resetado para criação:', formData);
    }
  }

  // ==================== VALIDATION ====================
  
  function validateForm(): boolean {
    errors = {};

    // Validação específica por tipo de nota
    if (formData.tipo_nota === 'ENTRADA') {
      // Para entradas: apenas almoxarifado de destino é obrigatório
      if (!formData.almoxarifado_destino_id) {
        errors.almoxarifado_destino_id = 'Almoxarifado de destino é obrigatório para entradas';
      }
    } else if (formData.tipo_nota === 'TRANSFERENCIA') {
      // Para transferências: ambos almoxarifados são obrigatórios
      if (!formData.almoxarifado_origem_id) {
        errors.almoxarifado_origem_id = 'Almoxarifado de origem é obrigatório para transferências';
      }
      if (!formData.almoxarifado_destino_id) {
        errors.almoxarifado_destino_id = 'Almoxarifado de destino é obrigatório para transferências';
      } else if (formData.almoxarifado_destino_id === formData.almoxarifado_origem_id) {
        errors.almoxarifado_destino_id = 'Almoxarifado de destino deve ser diferente do origem';
      }
    } else {
      // Para descartes e ajustes: apenas almoxarifado de origem é obrigatório
      if (!formData.almoxarifado_origem_id) {
        errors.almoxarifado_origem_id = 'Almoxarifado de origem é obrigatório';
      }
    }

    if (!formData.data_documento) {
      errors.data_documento = 'Data do documento é obrigatória';
    }

    return Object.keys(errors).length === 0;
  }

  function validateItens(): boolean {
    if (itensTemp.length === 0) {
      validationMessage = 'Adicione pelo menos um item à nota';
      return false;
    }
    
    validationMessage = '';
    return true;
  }

  // ==================== HANDLERS ====================
  
  function handleInputChange(field: string, value: any) {
    console.log(`🔄 Input change - ${field}:`, value);
    formData = {
      ...formData,
      [field]: value
    };
  }

  function handleItensChanged(event: CustomEvent<NotaItem[]>): void {
    itensTemp = event.detail;
    console.log('📦 Itens atualizados:', itensTemp.length);
  }

  function handleValidationError(event: CustomEvent<string>): void {
    validationMessage = event.detail;
  }

  // ==================== MODAL NAVIGATION ====================

  function handleProximoModo(): void {
    if (!validateItens()) return;
    
    modalMode = 'dados';
    activeTabIndex = 1;
  }

  function handleVoltarModo(): void {
    modalMode = 'itens';
    activeTabIndex = 0;
  }

  function handleTabChange(event: CustomEvent<{ activeTabValue: number }>): void {
    const newIndex = event.detail.activeTabValue;
    
    if (newIndex === 1 && !validateItens()) {
      // Bloquear navegação para aba de dados se não há itens
      activeTabIndex = 0;
      return;
    }
    
    activeTabIndex = newIndex;
    modalMode = newIndex === 0 ? 'itens' : 'dados';
  }

  // ==================== SAVE HANDLERS ====================

  async function handleSalvarRascunho(): Promise<void> {
    if (mode === 'view') return;

    console.log('💾 Salvando rascunho:', formData, itensTemp);
    
    // Verificar se o almoxarifado necessário foi selecionado baseado no tipo de nota
    const almoxarifadoRequerido = formData.tipo_nota === 'ENTRADA' ? 
      formData.almoxarifado_destino_id : 
      formData.almoxarifado_origem_id;
      
    if (!almoxarifadoRequerido) {
      validationMessage = 'Selecione um almoxarifado antes de salvar';
      return;
    }

    try {
      await sincronizarNotaComItens('rascunho');
    } catch (error) {
      console.error('❌ Erro ao salvar rascunho:', error);
      validationMessage = 'Erro ao salvar rascunho';
    }
  }

  async function handleConcluirNota(): Promise<void> {
    if (mode === 'view') return;

    console.log('⚡ Concluindo nota:', formData, itensTemp);
    
    if (!validateForm() || !validateItens()) {
      return;
    }

    try {
      await sincronizarNotaComItens('concluida');
    } catch (error) {
      console.error('❌ Erro ao concluir nota:', error);
      validationMessage = 'Erro ao concluir nota';
    }
  }

  // ==================== SYNC LOGIC ====================

  async function sincronizarNotaComItens(modo: 'rascunho' | 'concluida'): Promise<void> {
    let notaId: string;
    
    if (nota?.id) {
      // Nota existente: atualizar
      await notasMovimentacaoAdapter.atualizarNota(nota.id, {
        numero_documento: formData.numero_documento,
        data_documento: formData.data_documento,
        observacoes: formData.observacoes
      });
      notaId = nota.id;
    } else {
      // Nova nota: criar primeiro
      const response = await notasMovimentacaoAdapter.criarNota(formData);
      notaId = response.data.id;
    }
    
    // Sincronizar itens
    await sincronizarItens(notaId, itensTemp);
    
    // Emitir evento de sucesso
    dispatch('salvar', { notaId, modo });
  }

  async function sincronizarItens(notaId: string, itens: NotaItem[]): Promise<void> {
    console.log('🔄 Sincronizando itens:', notaId, itens.length);

    // Se é edição, buscar itens atuais da nota
    let itensExistentes: any[] = [];
    if (nota?.id) {
      try {
        // Usar o método obterNota que já inclui itens por padrão (conforme API linha 855)
        const notaCompleta = await notasMovimentacaoAdapter.obterNota(notaId);
        itensExistentes = notaCompleta.itens || [];
        console.log('📦 Itens existentes carregados:', itensExistentes.length);
      } catch (error) {
        console.warn('Aviso: não foi possível carregar itens existentes:', error);
        itensExistentes = [];
      }
    }
    
    // Remover itens que não estão mais na lista temp
    for (const existente of itensExistentes) {
      const aindaExiste = itens.find(temp => temp.id === existente.id);
      if (!aindaExiste) {
        await notasMovimentacaoAdapter.removerItem(notaId, existente.id);
      }
    }
    
    // Adicionar/atualizar itens da lista temp
    for (const temp of itens) {
      if (temp.id) {
        // Item existente: verificar se quantidade mudou
        const existente = itensExistentes.find(e => e.id === temp.id);
        if (existente && existente.quantidade !== temp.quantidade) {
          await notasMovimentacaoAdapter.atualizarQuantidade(
            notaId, 
            temp.tipo_epi_id || temp.estoque_item_id!, 
            temp.quantidade
          );
        }
      } else {
        // Novo item: adicionar
        console.log('📦 Preparando para adicionar item:', temp);
        
        // Validar campos obrigatórios baseado no tipo de nota
        if (formData.tipo_nota === 'ENTRADA' && !temp.tipo_epi_id) {
          throw new Error('Tipo de EPI é obrigatório para notas de entrada');
        }
        
        if ((formData.tipo_nota === 'TRANSFERENCIA' || formData.tipo_nota === 'DESCARTE') && !temp.estoque_item_id) {
          throw new Error('Item de estoque é obrigatório para transferências e descartes');
        }
        
        const itemData = {
          tipo_epi_id: temp.tipo_epi_id,
          estoque_item_id: temp.estoque_item_id,
          quantidade: Number(temp.quantidade),
          custo_unitario: temp.custo_unitario ? Number(temp.custo_unitario) : undefined
        };
        
        console.log('📦 Dados do item para envio:', itemData);
        
        await notasMovimentacaoAdapter.adicionarItem(notaId, itemData);
      }
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

  // ==================== ENRICH ITEMS ====================
  
  async function enrichItensWithTipoEpiData(): Promise<void> {
    try {
      console.log('🔍 Enriquecendo itens com dados dos tipos EPI...');
      
      // Obter opções de tipos EPI (usa cache se disponível)
      const tiposEpiOptions = await tiposEpiAdapter.obterOpcoesSelectComCache();
      
      // Mapear tipos EPI por ID para acesso rápido
      const tiposEpiMap = new Map();
      tiposEpiOptions.forEach(option => {
        tiposEpiMap.set(option.value, option);
      });
      
      // Enriquecer cada item
      itensTemp = itensTemp.map(item => {
        const tipoEpi = tiposEpiMap.get(item.tipo_epi_id);
        if (tipoEpi) {
          return {
            ...item,
            equipamento_nome: tipoEpi.label.split(' (CA:')[0], // Extrair nome limpo
            categoria: tipoEpi.categoria || 'Categoria não informada',
            numero_ca: tipoEpi.numeroCA || ''
          };
        }
        return item;
      });
      
      console.log('✅ Itens enriquecidos:', itensTemp);
    } catch (error) {
      console.error('❌ Erro ao enriquecer itens:', error);
      // Continuar mesmo se falhar - dados básicos já estão disponíveis
    }
  }

  // ==================== COMPUTED PROPERTIES ====================
  
  $: isReadonly = mode === 'view';
  $: isTransferencia = formData.tipo_nota === 'TRANSFERENCIA';
  
  // Validações para navegação entre modos  
  $: almoxarifadoRequerido = formData.tipo_nota === 'ENTRADA' ? 
    formData.almoxarifado_destino_id : 
    formData.almoxarifado_origem_id;
  $: canProceedToDados = itensTemp.length > 0 && almoxarifadoRequerido;
  $: canSaveRascunho = almoxarifadoRequerido;
  $: canConcluir = canProceedToDados && formData.data_documento;

</script>

<Modal bind:open={show} size="xl" autoclose={false} outsideclose={!loading} on:close={handleModalClose}>
  <div slot="header" class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      <Badge color={getTipoNotaBadgeColor(formData.tipo_nota)} class="w-fit rounded-sm">
        {getTipoNotaLabel(formData.tipo_nota)}
      </Badge>
    </div>
    
    {#if itensTemp.length > 0}
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {itensTemp.length} {itensTemp.length === 1 ? 'item' : 'itens'}
      </div>
    {/if}
  </div>

  <!-- Modal Dual com Tabs -->
  <div class="space-y-4">
    <Tabs 
      style="underline" 
      activeTabValue={activeTabIndex}
      on:activeTabChange={handleTabChange}
    >
      <!-- Tab: Itens -->
      <TabItem open={activeTabIndex === 0} title="Itens">
        <div class="space-y-6 pt-4">
          <!-- Configuração básica da nota -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <!-- Tipo da Nota -->
            <div>
              <Label for="tipo_nota" class="mb-2">Tipo da Nota *</Label>
              {#if mode === 'create'}
                <Select
                  id="tipo_nota"
                  bind:value={formData.tipo_nota}
                  disabled={loading}
                  class="rounded-sm"
                  on:change={(e) => handleInputChange('tipo_nota', e.currentTarget.value)}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                  <option value="DESCARTE">Descarte</option>
                  <option value="ENTRADA_AJUSTE">Entrada (Ajuste)</option>
                  <option value="SAIDA_AJUSTE">Saída (Ajuste)</option>
                </Select>
              {:else}
                <div class="flex items-center h-10 px-3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-sm">
                  <span class="text-sm">{getTipoNotaLabel(formData.tipo_nota)}</span>
                </div>
              {/if}
            </div>

            <!-- Almoxarifado fields based on note type -->
            {#if formData.tipo_nota === 'ENTRADA'}
              <!-- Para entradas: apenas almoxarifado de destino -->
              <div class="md:col-span-2">
                <Label for="almoxarifado_destino_id" class="mb-2">
                  Almoxarifado de Destino *
                </Label>
                <Select
                  id="almoxarifado_destino_id"
                  bind:value={formData.almoxarifado_destino_id}
                  disabled={isReadonly || loading || loadingOptions}
                  class="rounded-sm {errors.almoxarifado_destino_id ? 'border-red-500' : ''}"
                  on:change={(e) => handleInputChange('almoxarifado_destino_id', e.currentTarget.value)}
                >
                  <option value="">Selecione o almoxarifado de destino</option>
                  {#each almoxarifadoOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </Select>
                {#if errors.almoxarifado_destino_id}
                  <p class="text-red-500 text-sm mt-1">{errors.almoxarifado_destino_id}</p>
                {/if}
              </div>
            {:else if formData.tipo_nota === 'TRANSFERENCIA'}
              <!-- Para transferências: ambos os almoxarifados -->
              <div>
                <Label for="almoxarifado_origem_id" class="mb-2">
                  Almoxarifado de Origem *
                </Label>
                <Select
                  id="almoxarifado_origem_id"
                  bind:value={formData.almoxarifado_origem_id}
                  disabled={isReadonly || loading || loadingOptions}
                  class="rounded-sm {errors.almoxarifado_origem_id ? 'border-red-500' : ''}"
                  on:change={(e) => handleInputChange('almoxarifado_origem_id', e.currentTarget.value)}
                >
                  <option value="">Selecione o almoxarifado de origem</option>
                  {#each almoxarifadoOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </Select>
                {#if errors.almoxarifado_origem_id}
                  <p class="text-red-500 text-sm mt-1">{errors.almoxarifado_origem_id}</p>
                {/if}
              </div>
              <div>
                <Label for="almoxarifado_destino_id" class="mb-2">
                  Almoxarifado de Destino *
                </Label>
                <Select
                  id="almoxarifado_destino_id"
                  bind:value={formData.almoxarifado_destino_id}
                  disabled={isReadonly || loading || loadingOptions}
                  class="rounded-sm {errors.almoxarifado_destino_id ? 'border-red-500' : ''}"
                  on:change={(e) => handleInputChange('almoxarifado_destino_id', e.currentTarget.value)}
                >
                  <option value="">Selecione o almoxarifado de destino</option>
                  {#each almoxarifadoOptions as option}
                    {#if option.value !== formData.almoxarifado_origem_id}
                      <option value={option.value}>{option.label}</option>
                    {/if}
                  {/each}
                </Select>
                {#if errors.almoxarifado_destino_id}
                  <p class="text-red-500 text-sm mt-1">{errors.almoxarifado_destino_id}</p>
                {/if}
              </div>
            {:else}
              <!-- Para descartes e ajustes: apenas almoxarifado de origem -->
              <div class="md:col-span-2">
                <Label for="almoxarifado_origem_id" class="mb-2">
                  Almoxarifado de Origem *
                </Label>
                <Select
                  id="almoxarifado_origem_id"
                  bind:value={formData.almoxarifado_origem_id}
                  disabled={isReadonly || loading || loadingOptions}
                  class="rounded-sm {errors.almoxarifado_origem_id ? 'border-red-500' : ''}"
                  on:change={(e) => handleInputChange('almoxarifado_origem_id', e.currentTarget.value)}
                >
                  <option value="">Selecione o almoxarifado de origem</option>
                  {#each almoxarifadoOptions as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </Select>
                {#if errors.almoxarifado_origem_id}
                  <p class="text-red-500 text-sm mt-1">{errors.almoxarifado_origem_id}</p>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Gerenciador de Itens -->
          <NotaItensManager
            tipo={formData.tipo_nota}
            almoxarifadoId={almoxarifadoRequerido || ''}
            almoxarifadoDestinoId={formData.almoxarifado_destino_id || ''}
            bind:itens={itensTemp}
            readonly={isReadonly}
            on:itensChanged={handleItensChanged}
            on:validationError={handleValidationError}
          />

          <!-- Alertas de validação -->
          {#if validationMessage}
            <Alert color="red" class="text-sm">
              {validationMessage}
            </Alert>
          {/if}
        </div>
      </TabItem>

      <!-- Tab: Dados -->
      <TabItem open={activeTabIndex === 1} title="Dados da Nota">
        <div class="space-y-6 pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                on:input={(e) => handleInputChange('numero_documento', e.currentTarget.value)}
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
                on:input={(e) => handleInputChange('data_documento', e.currentTarget.value)}
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
              rows="4"
              bind:value={formData.observacoes}
              disabled={isReadonly || loading}
              class="rounded-sm"
              on:input={(e) => handleInputChange('observacoes', e.currentTarget.value)}
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
                    {#if nota.status || nota._status}
                      {@const status = nota.status || nota._status}
                      <Badge 
                        color={status === 'RASCUNHO' ? 'yellow' : status === 'CONCLUIDA' ? 'green' : 'red'}
                        class="w-fit rounded-sm"
                      >
                        {status === 'RASCUNHO' ? 'Rascunho' : status === 'CONCLUIDA' ? 'Concluída' : status || 'Desconhecido'}
                      </Badge>
                    {:else}
                      <span class="text-gray-400">Status não informado</span>
                    {/if}
                  </div>
                </div>

                <!-- Responsável -->
                {#if nota.responsavel?.nome || nota.responsavel_nome || nota.responsavelNome || nota.usuario?.nome}
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Responsável:</span>
                    <p class="font-medium">{nota.responsavel?.nome || nota.responsavel_nome || nota.responsavelNome || nota.usuario?.nome}</p>
                  </div>
                {/if}

                <!-- Data de Criação -->
                {#if nota.createdAt || nota.created_at || nota.data_criacao}
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Criado em:</span>
                    <p class="font-medium">
                      {new Date(nota.createdAt || nota.created_at || nota.data_criacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                {/if}

                <!-- Total de Itens -->
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Total de itens:</span>
                  <p class="font-medium">{nota.total_itens || nota._itens?.length || nota.itens?.length || itensTemp.length || 0}</p>
                </div>

                <!-- Valor Total (se disponível) -->
                {#if nota.valor_total && nota.valor_total > 0}
                  <div>
                    <span class="text-gray-500 dark:text-gray-400">Valor total:</span>
                    <p class="font-medium text-green-600 dark:text-green-400">
                      R$ {nota.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                {/if}

                <!-- ID da Nota (para referência técnica) -->
                {#if mode === 'view'}
                  <div class="md:col-span-2">
                    <span class="text-gray-500 dark:text-gray-400">ID da nota:</span>
                    <p class="font-mono text-xs text-gray-600 dark:text-gray-300">{nota.id}</p>
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Resumo dos Itens (apenas para visualização) -->
          {#if mode === 'view'}
            <div class="pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Resumo dos Itens</h4>
              
              {#if itensTemp.length > 0}
                <div class="space-y-2">
                  {#each itensTemp as item}
                    <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div class="flex-1">
                        <p class="font-medium text-gray-900 dark:text-white">{item.equipamento_nome}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          {item.categoria || 'Categoria não informada'}
                          {#if item.numero_ca}
                            • CA: {item.numero_ca}
                          {/if}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-medium text-gray-900 dark:text-white">
                          {item.quantidade} {item.quantidade === 1 ? 'unidade' : 'unidades'}
                        </p>
                        {#if item.custo_unitario && item.custo_unitario > 0}
                          <p class="text-sm text-green-600 dark:text-green-400">
                            R$ {(item.quantidade * item.custo_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-6">
                  <div class="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <FileDocOutline class="w-6 h-6 text-gray-400" />
                  </div>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    Esta nota ainda não possui itens adicionados
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Itens podem ser adicionados durante a edição
                  </p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </TabItem>
    </Tabs>
  </div>

  <!-- Footer com ações contextuais -->
  <div slot="footer" class="flex justify-between items-center">
    <div class="flex space-x-2">
      <Button
        color="alternative"
        size="sm"
        class="rounded-sm"
        on:click={handleCancelar}
        disabled={loading}
      >
        {mode === 'view' ? 'Fechar' : 'Cancelar'}
      </Button>
    </div>

    {#if !isReadonly}
      <div class="flex space-x-2">
        <!-- Botões do Modo Itens -->
        {#if modalMode === 'itens'}
          <Button
            color="blue"
            size="sm"
            class="rounded-sm"
            on:click={handleSalvarRascunho}
            disabled={!canSaveRascunho || loading}
          >
            <FloppyDiskOutline class="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button
            color="primary"
            size="sm"
            class="rounded-sm"
            on:click={handleProximoModo}
            disabled={!canProceedToDados || loading}
          >
            Próximo: Dados da Nota
            <ArrowRightOutline class="w-4 h-4 ml-2" />
          </Button>

        <!-- Botões do Modo Dados -->
        {:else if modalMode === 'dados'}
          <Button
            color="alternative"
            size="sm"
            class="rounded-sm"
            on:click={handleVoltarModo}
            disabled={loading}
          >
            <ArrowLeftOutline class="w-4 h-4 mr-2" />
            Voltar: Itens
          </Button>
          <Button
            color="blue"
            size="sm"
            class="rounded-sm"
            on:click={handleSalvarRascunho}
            disabled={!canSaveRascunho || loading}
          >
            <FloppyDiskOutline class="w-4 h-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button
            color="green"
            size="sm"
            class="rounded-sm"
            on:click={handleConcluirNota}
            disabled={!canConcluir || loading}
          >
            <CheckOutline class="w-4 h-4 mr-2" />
            Concluir Nota
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</Modal>
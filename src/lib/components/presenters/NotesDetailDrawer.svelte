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
  import NotaItensManagerSimplified from './NotaItensManagerSimplified.svelte';
  import type { NotaItem } from './NotaItensManager.svelte';
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
  export let loading = false;

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
    itens: [] as NotaItem[]
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
    if (mode === 'create') {
      resetForm();
    }
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

      // Se é edição ou visualização, carregar dados da nota
      if ((mode === 'edit' || mode === 'view') && nota) {
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
      
    } catch (error: any) {
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
        tipo_nota: nota.tipo || nota.tipo_nota,
        almoxarifado_origem_id: nota.almoxarifado_id || nota.almoxarifadoOrigemId || '',
        almoxarifado_destino_id: nota.almoxarifado_destino_id || nota.almoxarifadoDestinoId || '',
        observacoes: nota.observacoes || '',
        data_documento: nota.data_documento?.split('T')[0] || new Date().toISOString().split('T')[0],
        itens: []
      };

      // Mapear itens se existirem - verificar tanto itens quanto _itens
      const itemsArray = nota.itens || nota._itens || [];
      console.log('🔍 Items do backend para processar:', {
        total: itemsArray.length,
        nota_id: nota.id,
        fonte: nota.itens ? 'nota.itens' : nota._itens ? 'nota._itens' : 'vazio',
        exemplo_item_raw: itemsArray[0] || null
      });
      
      if (itemsArray && itemsArray.length > 0) {
        // Importar adapters para buscar dados dos equipamentos
        const { tiposEpiAdapter } = await import('$lib/services/entity/tiposEpiAdapter');
        const { estoqueItensAdapter } = await import('$lib/services/entity/estoqueItensAdapter');
        
        // Processar cada item e enriquecer com dados do equipamento
        const enrichedItens = await Promise.all(
          itemsArray.map(async (item) => {
            console.log('🔍 Processando item do backend:', {
              id: item.id,
              custo_original: item.custo_unitario,
              custo_tipo: typeof item.custo_unitario,
              quantidade: item.quantidade
            });
            
            const custoConvertido = item.custo_unitario != null ? Number(item.custo_unitario) : undefined;
            console.log('💰 Conversão de custo:', {
              original: item.custo_unitario,
              convertido: custoConvertido,
              tipo_convertido: typeof custoConvertido
            });
            
            const baseItem = {
              temp_id: `existing_${item.id}`,
              tipo_epi_id: (item as any).tipoEpiId || item.tipo_epi_id,
              estoque_item_id: item.estoque_item_id,
              quantidade: item.quantidade,
              // 🔧 CORREÇÃO: Preservar custo unitário válido, incluindo zeros
              custo_unitario: custoConvertido,
              equipamento_nome: 'Equipamento não identificado',
              categoria: '',
              numero_ca: 'Não informado'
            };

            try {
              // Se tem tipoEpiId, buscar dados do tipo de EPI
              if ((item as any).tipoEpiId || item.tipo_epi_id) {
                const tipoEpiId = (item as any).tipoEpiId || item.tipo_epi_id;
                console.log('🔍 Buscando dados do tipo EPI:', tipoEpiId);
                
                const tiposEpiOptions = await tiposEpiAdapter.obterOpcoesSelectComCache({ 
                  apenasAtivos: false // Incluir inativos para visualização
                });
                
                const tipoEpi = tiposEpiOptions.find(opt => opt.value === tipoEpiId);
                if (tipoEpi) {
                  baseItem.equipamento_nome = tipoEpi.label;
                  baseItem.categoria = tipoEpi.categoria || '';
                  baseItem.numero_ca = tipoEpi.numeroCA || 'Não informado';
                  console.log('✅ Dados do tipo EPI encontrados:', tipoEpi.label);
                } else {
                  console.warn('⚠️ Tipo EPI não encontrado para ID:', tipoEpiId);
                }
              }
              
              // Se tem estoque_item_id, buscar dados do item de estoque
              if (item.estoque_item_id && formData.almoxarifado_origem_id) {
                const estoqueOptions = await estoqueItensAdapter.obterItensDisponiveisComCache(
                  formData.almoxarifado_origem_id
                );
                
                const estoqueItem = estoqueOptions.find(opt => opt.value === item.estoque_item_id);
                if (estoqueItem) {
                  baseItem.equipamento_nome = estoqueItem.label;
                  baseItem.categoria = estoqueItem.categoria || '';
                  baseItem.numero_ca = estoqueItem.numeroCA || 'Não informado';
                  console.log('✅ Dados do estoque encontrados:', estoqueItem.label);
                }
              }
              
            } catch (enrichError) {
              console.error('❌ Erro ao enriquecer item:', enrichError);
              // Manter dados básicos em caso de erro
            }

            return baseItem;
          })
        );
        
        itens = enrichedItens;
        console.log('✅ Itens enriquecidos processados:', {
          quantidade: itens.length,
          exemplos: itens.slice(0, 2).map(item => ({
            temp_id: item.temp_id,
            equipamento: item.equipamento_nome,
            quantidade: item.quantidade,
            custo_unitario: item.custo_unitario,
            custo_tipo: typeof item.custo_unitario
          }))
        });
      }

    } catch (error: any) {
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
      // 🔧 CORREÇÃO: Garantir que a validação trata strings e numbers corretamente
      const itensSemCusto = itens.filter(item => {
        const custo = Number(item.custo_unitario);
        return !custo || custo <= 0;
      });
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
      
    } catch (error: any) {
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
    // 🔧 CORREÇÃO: Preservar custos válidos, incluindo zero
    const custo = (item.custo_unitario != null && typeof item.custo_unitario === 'number') ? item.custo_unitario : 0;
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

      {#if mode === 'view'}
        <!-- VIEW MODE: Interface de leitura limpa -->
        
        <!-- Dados Básicos da Nota -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Informações da Nota</h3>
          
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Tipo de Nota -->
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Nota</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  <Badge 
                    color={getTipoNotaBadgeColor(formData.tipo_nota)} 
                    class="w-fit rounded-sm font-medium"
                  >
                    {getTipoNotaLabel(formData.tipo_nota)}
                  </Badge>
                </dd>
              </div>

              <!-- Data do Documento -->
              <div>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Data do Documento</dt>
                <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(formData.data_documento).toLocaleDateString('pt-BR')}
                </dd>
              </div>

              <!-- Almoxarifado de Origem -->
              {#if formData.almoxarifado_origem_id}
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Almoxarifado de Origem</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {almoxarifadoOptions.find(opt => opt.value === formData.almoxarifado_origem_id)?.label || 'Não identificado'}
                    {#if almoxarifadoOptions.find(opt => opt.value === formData.almoxarifado_origem_id)?.isPrincipal}
                      <span class="text-xs text-primary-600 dark:text-primary-400 font-medium ml-1">(Principal)</span>
                    {/if}
                  </dd>
                </div>
              {/if}

              <!-- Almoxarifado de Destino -->
              {#if formData.almoxarifado_destino_id}
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Almoxarifado de Destino</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {almoxarifadoOptions.find(opt => opt.value === formData.almoxarifado_destino_id)?.label || 'Não identificado'}
                    {#if almoxarifadoOptions.find(opt => opt.value === formData.almoxarifado_destino_id)?.isPrincipal}
                      <span class="text-xs text-primary-600 dark:text-primary-400 font-medium ml-1">(Principal)</span>
                    {/if}
                  </dd>
                </div>
              {/if}

              <!-- Observações -->
              {#if formData.observacoes}
                <div class="md:col-span-2">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {formData.observacoes}
                  </dd>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Itens da Nota -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Itens da Nota
            {#if totalItens > 0}
              <Badge color="dark" class="ml-2 rounded-sm">{totalItens}</Badge>
            {/if}
          </h3>
          
          {#if itens.length === 0}
            <!-- Estado vazio para visualização -->
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <FileDocOutline class="w-6 h-6 text-gray-400" />
              </div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">Nenhum item encontrado</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">Esta nota não possui itens registrados</p>
            </div>
          {:else}
            <!-- Lista de itens para visualização -->
            <div class="space-y-3">
              {#each itens as item, index}
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                          Item {index + 1}
                        </span>
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          {item.equipamento_nome || 'Equipamento não identificado'}
                        </h4>
                      </div>
                      
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <dt class="text-gray-500 dark:text-gray-400">Categoria</dt>
                          <dd class="text-gray-900 dark:text-white">
                            {item.categoria || 'Não informado'}
                          </dd>
                        </div>
                        <div>
                          <dt class="text-gray-500 dark:text-gray-400">Número CA</dt>
                          <dd class="text-gray-900 dark:text-white">
                            {item.numero_ca || 'Não informado'}
                          </dd>
                        </div>
                        <div>
                          <dt class="text-gray-500 dark:text-gray-400">Quantidade</dt>
                          <dd class="text-gray-900 dark:text-white font-medium">
                            {item.quantidade}
                          </dd>
                        </div>
                        {#if formData.tipo_nota === 'ENTRADA' && item.custo_unitario}
                          <div>
                            <dt class="text-gray-500 dark:text-gray-400">Custo Unitário</dt>
                            <dd class="text-gray-900 dark:text-white">
                              R$ {item.custo_unitario.toFixed(2)}
                            </dd>
                          </div>
                          <div>
                            <dt class="text-gray-500 dark:text-gray-400">Valor Total</dt>
                            <dd class="text-green-600 dark:text-green-400 font-medium">
                              R$ {(item.quantidade * item.custo_unitario).toFixed(2)}
                            </dd>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Resumo Total -->
        {#if totalItens > 0}
          <div class="bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-6">
                <div class="text-center">
                  <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {totalItens}
                  </div>
                  <div class="text-xs text-primary-600 dark:text-primary-400 font-medium">
                    {totalItens === 1 ? 'Item' : 'Itens'}
                  </div>
                </div>
                {#if valorTotal > 0}
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ {valorTotal.toFixed(2)}
                    </div>
                    <div class="text-xs text-green-600 dark:text-green-400 font-medium">
                      Valor Total
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}

      {:else}
        <!-- EDIT/CREATE MODE: Interface de formulário -->
        
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
                disabled={false}
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
                disabled={false}
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
                        disabled={false}
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
                        disabled={false}
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
                        disabled={false}
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
              disabled={false}
              placeholder="Observações sobre a movimentação..."
              rows={3}
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
            readonly={false}
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
      {/if}
    </div>
  {/if}
</Drawer>
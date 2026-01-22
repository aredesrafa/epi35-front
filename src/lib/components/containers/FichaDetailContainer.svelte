<!--
  Ficha Detail Container - Componente "Inteligente"
  
  Este container demonstra a nova arquitetura modularizada:
  - Usa service adapters especializados para workflows
  - Implementa Process Lifecycle Pattern
  - Gerencia estado complexo com stores otimizados
  - Separa lógica de negócio da apresentação
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  // 🚀 NOVO: Usar adapters especializados
  import { 
    fichaQueryAdapter,
    deliveryProcessAdapter,
    returnProcessAdapter,
    UIMappingHelpers
  } from '$lib/services/process';
  import { notify } from '$lib/stores';
  import { fichaDataStore } from '$lib/stores/fichaDataStore';
  import FichaDetailPresenter from '../presenters/FichaDetailPresenter.svelte';
  import type { 
    CreateDeliveryPayload,
    ReturnBatchPayload,
    ConfirmSignaturePayload,
    CancelDeliveryPayload
  } from '$lib/services/process';
  import type { FichaCompleteResponse } from '$lib/services/process/queries/types';
  // Imports dos novos adapters
  import type { 
    NovaEntregaFormData,
    EPIDisponivel
  } from '$lib/services/process';
  import type {
    EquipamentoEmPosseItem
  } from '$lib/types/serviceTypes';
  
  // ==================== PROPS ====================
  
  export let open = false;
  export let fichaId: string | null = null;
  
  // Debug - monitorar mudanças no estado open
  $: if (open && fichaId) {
    console.log('🎯 FichaDetailContainer: Estado open mudou para true, fichaId:', fichaId);
  }
  
  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    close: void;
    fichaUpdated: { fichaId: string };
  }>();
  
  // ==================== STATE MANAGEMENT ====================
  
  // 🚀 MUDANÇA: Estado usando dados pré-processados
  let fichaCompleteData: FichaCompleteResponse | null = null;
  let episDisponiveis: EPIDisponivel[] = [];
  let usuarios: Array<{id: string; nome: string; email: string;}> = [];
  let loading = true;
  let error: string | null = null;
  
  // 🚀 ATUALIZADO: Reatividade ao store de fichas com dados completos
  $: if (fichaId && $fichaDataStore.has(fichaId)) {
    const cachedData = $fichaDataStore.get(fichaId);
    if (cachedData) {
      // Convert FichaDetailData to FichaCompleteResponse format
      fichaCompleteData = {
        success: true,
        data: cachedData as any
      };
      console.log('🔄 Dados completos atualizados via store reativo:', fichaId);
    }
  }
  
  // Estados dos modals/drawers
  let showNovaEntregaDrawer = false;
  let showEditarEntregaDrawer = false;
  let showDevolucaoModal = false;
  let showAssinaturaModal = false;
  
  // Estados de loading específicos
  let entregaLoading = false;
  let assinaturaLoading = false;
  let devolucaoLoading = false;
  
  // Dados para operações
  let entregaEdicao: any = null;
  let equipamentoDevolucao: EquipamentoEmPosseItem | null = null;
  let entregaAssinatura: any = null;
  
  // Controle de cache - para evitar recarregamentos desnecessários
  let lastFichaId: string | null = null;
  
  // ==================== LIFECYCLE ====================
  
  onMount(() => {
    console.log('🚀 FichaDetailContainer: Inicializando...');
    
    // Carregar dados auxiliares uma vez (não mudam frequentemente)
    Promise.all([
      loadEPIsDisponiveis(),
      loadUsuarios()
    ]);
  });
  
  // Reactive: carregar dados quando fichaId mudar
  $: if (open && fichaId && fichaId !== lastFichaId) {
    loadFichaData();
  }
  
  // ==================== DATA LOADING ====================
  
  /**
   * 🚀 SIMPLIFICADO: Carrega dados completos pré-processados da ficha
   */
  async function loadFichaData(): Promise<void> {
    if (!fichaId) return;
    
    loading = true;
    error = null;
    lastFichaId = fichaId;
    
    try {
      console.log('📋 FichaDetailContainer: Carregando ficha completa:', fichaId);
      
      // ✅ NOVA ARQUITETURA: 1 call ao invés de 3-5 calls
      fichaCompleteData = await fichaQueryAdapter.getFichaComplete(fichaId);
      
      console.log('✅ Dados da ficha carregados');
      console.log('🔍 Equipamentos em posse:', fichaCompleteData?.data?.equipamentosEmPosse?.length || 0);
      console.log('🔄 Devoluções:', fichaCompleteData?.data?.devolucoes?.length || 0);
      console.log('🚚 Entregas:', fichaCompleteData?.data?.entregas?.length || 0);
      console.log('📝 Histórico:', fichaCompleteData?.data?.historico?.length || 0);
      
    } catch (err) {
      console.error('❌ Erro ao carregar ficha:', err);
      error = err instanceof Error ? err.message : 'Erro desconhecido';
      notify.error('Erro ao carregar ficha', 'Não foi possível carregar os dados da ficha');
    } finally {
      loading = false;
    }
  }
  
  /**
   * 🚀 MIGRADO: Carrega EPIs disponíveis para entregas
   */
  async function loadEPIsDisponiveis(): Promise<void> {
    try {
      console.log('🚀 FichaDetailContainer: Carregando EPIs disponíveis...');
      // ✅ NOVA ARQUITETURA: Usar fichaQueryAdapter para consultas
      episDisponiveis = await fichaQueryAdapter.getEPIsDisponiveis();
      console.log('📦 EPIs disponíveis carregados:', episDisponiveis.length);
      console.log('📦 Estrutura dos EPIs:', episDisponiveis.slice(0, 2));
      
      // ✨ LOG ADICIONAL: Verificar se algum EPI tem estoque
      const episComEstoque = episDisponiveis.filter(epi => epi.disponivel && epi.quantidadeDisponivel > 0);
      console.log('🎯 EPIs com estoque disponível:', episComEstoque.length);
      if (episComEstoque.length === 0) {
        console.warn('⚠️ ATENÇÃO: Nenhum EPI com estoque disponível encontrado!');
        console.log('🔍 EPIs sem estoque:', episDisponiveis.map(epi => ({
          nome: epi.nomeEquipamento,
          quantidade: epi.quantidadeDisponivel,
          disponivel: epi.disponivel
        })));
      }
      
    } catch (err) {
      console.error('❌ Erro ao carregar EPIs disponíveis:', err);
      throw err; // SEM FALLBACK - erro deve ser visível
    }
  }

  /**
   * 🚀 MIGRADO: Carrega usuários disponíveis para responsável da entrega
   */
  async function loadUsuarios(): Promise<void> {
    try {
      console.log('👤 FichaDetailContainer: Carregando usuários...');
      // ✅ NOVA ARQUITETURA: Usar fichaQueryAdapter para consultas
      usuarios = await fichaQueryAdapter.getUsuarios();
      console.log('👥 Usuários carregados:', usuarios?.length);
      console.log('👥 Estrutura dos usuários:', usuarios?.slice(0, 2));
    } catch (err) {
      console.error('❌ Erro ao carregar usuários:', err);
      throw err; // SEM FALLBACK - erro deve ser visível
    }
  }
  
  // ==================== EVENT HANDLERS ====================
  
  /**
   * Handler para fechar drawer
   */
  function handleClose(): void {
    open = false;
    lastFichaId = null;
    
    // Reset state
    fichaCompleteData = null;
    error = null;
    
    // Fechar modals/drawers aninhados
    showNovaEntregaDrawer = false;
    showEditarEntregaDrawer = false;
    showDevolucaoModal = false;
    showAssinaturaModal = false;
    
    dispatch('close');
    console.log('❌ Drawer fechado');
  }
  
  /**
   * Handler para nova entrega
   */
  async function handleNovaEntrega(): Promise<void> {
    console.log('➕ Abrindo formulário de nova entrega');
    console.log('📦 Estado atual dos EPIs:', episDisponiveis.length, 'EPIs carregados');
    
    // Garantir que EPIs estão carregados antes de abrir o drawer
    if (episDisponiveis.length === 0) {
      console.log('🔄 EPIs não carregados, carregando agora...');
      await loadEPIsDisponiveis();
      console.log('📦 Após recarregar:', episDisponiveis.length, 'EPIs disponíveis');
    }
    
    console.log('📦 EPIs que serão passados para o drawer:', episDisponiveis);
    showNovaEntregaDrawer = true;
  }
  
  /**
   * 🚀 MIGRADO: Handler para salvar nova entrega
   */
  async function handleSalvarNovaEntrega(event: CustomEvent<NovaEntregaFormData>): Promise<void> {
    if (!fichaId) return;
    
    entregaLoading = true;
    
    try {
      console.log('💾 FichaDetailContainer: Criando nova entrega...');
      console.log('🔍 Responsável ID:', event.detail.usuarioResponsavelId);
      console.log('🔍 Quantidade de itens:', event.detail.itens?.length || 0);
      
      // Validar dados essenciais antes de criar o payload
      if (!event.detail.usuarioResponsavelId) {
        throw new Error('usuarioResponsavelId é obrigatório');
      }
      
      if (!event.detail.itens || event.detail.itens.length === 0) {
        throw new Error('Pelo menos um item deve ser selecionado');
      }
      
      // ✅ NOVA ARQUITETURA: Usar deliveryProcessAdapter para operações de entrega
      console.log('🔍 Verificando fichaId:', {
        fichaId: fichaId,
        fichaIdType: typeof fichaId,
        isUUID: fichaId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
        isCustomId: fichaId?.match(/^[A-Z0-9]{6}$/i)
      });
      
      const payload: CreateDeliveryPayload = {
        fichaEpiId: fichaId,
        responsavelId: event.detail.usuarioResponsavelId, // Nome do campo correto
        itens: event.detail.itens.map(item => {
          // Encontrar o EPI correspondente para pegar o estoqueItemId correto
          const epiCorrespondente = episDisponiveis.find(epi => epi.id === item.episDisponivelId);
          
          console.log('🔍 Mapeando item:', {
            itemEpisDisponivelId: item.episDisponivelId,
            epiCorrespondente: epiCorrespondente ? {
              id: epiCorrespondente.id,
              estoqueItemId: epiCorrespondente.estoqueItemId,
              episDisponivelId: epiCorrespondente.episDisponivelId,
              nome: epiCorrespondente.nomeEquipamento
            } : null
          });
          
          // Usar o ID real do item de estoque, não o ID de display
          const estoqueItemId = epiCorrespondente?.estoqueItemId || epiCorrespondente?.id || item.episDisponivelId;
          
          // Verificar se o ID está em formato válido
          console.log('🔍 Verificando ID do estoque item:', {
            estoqueItemId: estoqueItemId,
            isValidFormat: estoqueItemId?.match(/^[A-Z0-9]{6}$/) || estoqueItemId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
            needsMapping: !estoqueItemId?.match(/^[A-Z0-9]{6}$/) && !estoqueItemId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
          });
          
          return {
            estoqueItemId: estoqueItemId,
            quantidade: item.quantidade
          };
        }),
        observacoes: event.detail.observacoes || ''
      };
      
      console.log('📋 Payload da entrega:', payload);
      
      const novaEntrega = await deliveryProcessAdapter.createDelivery(payload);
      
      // Fechar drawer
      showNovaEntregaDrawer = false;
      
      // Recarregar dados da ficha
      await loadFichaData();
      
      notify.success(
        'Entrega criada', 
        `Entrega ${novaEntrega.data.entregaId} criada com ${novaEntrega.data.totalItens} itens`
      );
      
      // Notificar que ficha foi atualizada
      dispatch('fichaUpdated', { fichaId });
      
    } catch (error: any) {
      console.error('❌ Erro ao salvar nova entrega:', error);
      
      // Melhor tratamento de erro baseado no tipo
      let errorTitle = 'Erro ao criar entrega';
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'EstoqueItemNotFoundError':
            errorTitle = 'Item de estoque não encontrado';
            errorMessage = 'Os EPIs selecionados não possuem estoque disponível no almoxarifado. Verifique se há itens em estoque antes de criar a entrega.';
            break;
          case 'ValidationError':
            errorTitle = 'Dados de entrega inválidos';
            errorMessage = 'Verifique se todos os campos obrigatórios estão preenchidos e tente novamente.';
            break;
          default:
            if (error.message.includes('Cannot GET') || error.message.includes('404')) {
              errorTitle = 'Serviço indisponível';
              errorMessage = 'O serviço de entregas está temporariamente indisponível. Alguns endpoints do backend não estão implementados. Tente novamente mais tarde.';
            } else if (error.message.includes('Network error') || error.message.includes('timeout')) {
              errorTitle = 'Erro de conexão';
              errorMessage = 'Problema de conexão com o servidor. Verifique sua internet e tente novamente.';
            } else if (error.message.includes('Validation error')) {
              errorTitle = 'Dados inválidos';
              errorMessage = 'Os dados fornecidos são inválidos. Verifique os campos e tente novamente. Detalhes: ' + error.message;
            } else {
              errorMessage = error.message;
            }
            break;
        }
      }
      
      notify.error(errorTitle, errorMessage);
      
      // Não fechar o drawer em caso de erro para permitir correção
      console.log('ℹ️ Drawer mantido aberto para correção dos dados');
      
    } finally {
      entregaLoading = false;
    }
  }
  
  /**
   * Handler para cancelar nova entrega
   */
  function handleCancelarNovaEntrega(): void {
    showNovaEntregaDrawer = false;
    console.log('❌ Nova entrega cancelada');
  }
  
  /**
   * Handler para editar entrega
   */
  function handleEditarEntrega(event: CustomEvent<{ entrega: any }>): void {
    entregaEdicao = event.detail.entrega;
    showEditarEntregaDrawer = true;
    console.log('✏️ Editando entrega:', entregaEdicao.id);
  }
  
  /**
   * 🚀 MIGRADO: Handler para salvar edição de entrega
   */
  async function handleSalvarEdicaoEntrega(event: CustomEvent<NovaEntregaFormData>): Promise<void> {
    if (!entregaEdicao) return;
    
    entregaLoading = true;
    
    try {
      console.log('💾 FichaDetailContainer: Editando entrega:', event.detail);
      
      // ✅ NOVA ARQUITETURA: Usar deliveryProcessAdapter para editar entrega
      const payload: Partial<CreateDeliveryPayload> = {
        responsavelId: event.detail.responsavelId,
        itens: event.detail.itens.map(item => ({
          estoqueItemId: item.estoqueItemId,
          quantidade: item.quantidade
        })),
        observacoes: event.detail.observacoes
      };
      
      await deliveryProcessAdapter.updateDelivery(entregaEdicao.id, payload);
      
      // Fechar drawer
      showEditarEntregaDrawer = false;
      entregaEdicao = null;
      
      // Recarregar dados
      await loadFichaData();
      
      notify.success('Entrega atualizada', 'Entrega foi atualizada com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error: any) {
      console.error('❌ Erro ao editar entrega:', error);
      notify.error('Erro ao editar', 'Não foi possível atualizar a entrega');
    } finally {
      entregaLoading = false;
    }
  }
  
  /**
   * Handler para cancelar edição
   */
  function handleCancelarEdicaoEntrega(): void {
    showEditarEntregaDrawer = false;
    entregaEdicao = null;
    console.log('❌ Edição de entrega cancelada');
  }
  
  /**
   * Handler para assinar entrega
   */
  function handleAssinarEntrega(event: CustomEvent<{ entrega: any }>): void {
    entregaAssinatura = event.detail.entrega;
    showAssinaturaModal = true;
    console.log('✍️ Iniciando assinatura da entrega:', entregaAssinatura.id);
  }
  
  /**
   * 🚀 MIGRADO: Handler para confirmar assinatura
   */
  async function handleConfirmarAssinatura(event: CustomEvent<{ assinatura: string }>): Promise<void> {
    if (!entregaAssinatura) return;
    
    assinaturaLoading = true;
    
    try {
      console.log('✍️ FichaDetailContainer: Confirmando assinatura:', event.detail);
      
      // ✅ NOVA ARQUITETURA: Usar deliveryProcessAdapter para confirmar assinatura
      const payload: ConfirmSignaturePayload = {
        assinatura: event.detail.assinatura
      };
      
      await deliveryProcessAdapter.confirmSignature(entregaAssinatura.id, payload);
      
      // Fechar modal
      showAssinaturaModal = false;
      entregaAssinatura = null;
      
      // Recarregar dados
      await loadFichaData();
      
      notify.success('Assinatura registrada', 'Entrega foi assinada com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error: any) {
      console.error('❌ Erro ao processar assinatura:', error);
      notify.error('Erro na assinatura', 'Não foi possível registrar a assinatura');
    } finally {
      assinaturaLoading = false;
    }
  }
  
  /**
   * Handler para cancelar assinatura
   */
  function handleCancelarAssinatura(): void {
    showAssinaturaModal = false;
    entregaAssinatura = null;
    console.log('❌ Assinatura cancelada');
  }
  
  /**
   * Handler para devolução de equipamento
   */
  function handleDevolverEquipamento(event: CustomEvent<{ equipamento: EquipamentoEmPosseItem }>): void {
    equipamentoDevolucao = event.detail.equipamento;
    showDevolucaoModal = true;
    console.log('🔄 Iniciando devolução:', equipamentoDevolucao.id);
  }
  
  /**
   * 🔧 CORRIGIDO: Handler para confirmar devolução usando endpoint individual
   * Endpoint: POST /api/fichas-epi/:fichaId/devolucoes (da documentação)
   */
  async function handleConfirmarDevolucao(event: CustomEvent<{ motivo: string; observacoes?: string }>): Promise<void> {
    if (!equipamentoDevolucao || !fichaId) return;
    
    devolucaoLoading = true;
    
    try {
      console.log('🔄 FichaDetailContainer: Processando devolução via endpoint individual:', event.detail);
      console.log('📋 Dados do equipamento:', {
        id: equipamentoDevolucao.id,
        entregaId: equipamentoDevolucao.entregaId,
        itemEntregaId: equipamentoDevolucao.itemEntregaId
      });
      
      // Validar que temos todos os dados necessários
      if (!equipamentoDevolucao.entregaId || !equipamentoDevolucao.itemEntregaId) {
        throw new Error('Dados incompletos do equipamento para devolução');
      }

      // Obter usuário do store ou usar padrão
      const usuarioId = 'cffc2197-acbe-4a64-bfd7-435370e9c226'; // TODO: Obter do contexto do usuário logado
      
      // ✅ CORREÇÃO: Usar endpoint individual da documentação
      const result = await returnProcessAdapter.processIndividualReturn(
        fichaId,
        equipamentoDevolucao.entregaId,
        equipamentoDevolucao.itemEntregaId,
        event.detail.motivo as "devolução padrão" | "danificado" | "troca" | "outros",
        usuarioId,
        event.detail.observacoes
      );
      
      // Fechar modal
      showDevolucaoModal = false;
      equipamentoDevolucao = null;
      
      // ✅ RECARREGAR DADOS: Backend real retorna status atualizado dos itens
      await loadFichaData();
      
      notify.success('Devolução registrada', 'Equipamento foi devolvido com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error: any) {
      console.error('❌ Erro ao processar devolução:', error);
      
      // Melhor tratamento de erro
      let errorMessage = 'Não foi possível registrar a devolução';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      notify.error('Erro na devolução', errorMessage);
    } finally {
      devolucaoLoading = false;
    }
  }
  
  /**
   * Handler para cancelar devolução
   */
  function handleCancelarDevolucao(): void {
    showDevolucaoModal = false;
    equipamentoDevolucao = null;
    console.log('❌ Devolução cancelada');
  }
  
  /**
   * Handler para cancelar entrega
   */
  /**
   * 🚀 MIGRADO: Handler para cancelar entrega
   */
  async function handleCancelarEntrega(event: CustomEvent<{ entrega: any; motivo: string }>): Promise<void> {
    try {
      console.log('❌ FichaDetailContainer: Cancelando entrega:', event.detail);
      
      // ✅ NOVA ARQUITETURA: Usar deliveryProcessAdapter para cancelar entrega
      const payload: CancelDeliveryPayload = {
        motivo: event.detail.motivo
      };
      
      await deliveryProcessAdapter.cancelDelivery(event.detail.entrega.id, payload);
      
      // Recarregar dados
      await loadFichaData();
      
      notify.success('Entrega cancelada', 'Entrega foi cancelada com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error: any) {
      console.error('❌ Erro ao cancelar entrega:', error);
      notify.error('Erro ao cancelar', 'Não foi possível cancelar a entrega');
    }
  }
  
  /**
   * Handler para imprimir entrega
   */
  function handleImprimirEntrega(event: CustomEvent<{ entrega: any }>): void {
    console.log('🖨️ Imprimindo entrega:', event.detail.entrega.id);
    // Implementar lógica de impressão
    notify.info('Função em desenvolvimento', 'Impressão será implementada em breve');
  }
  
  // ==================== COMPUTED PROPERTIES ====================
  
  // 🚀 MUDANÇA: Estado consolidado usando dados pré-processados
  $: containerState = {
    // Dados principais (já processados pelo backend)
    fichaCompleteData,
    episDisponiveis,
    usuarios,
    
    // Estados de loading
    loading,
    error,
    entregaLoading,
    assinaturaLoading,
    devolucaoLoading,
    
    // Estados dos modals/drawers
    showNovaEntregaDrawer,
    showEditarEntregaDrawer,
    showDevolucaoModal,
    showAssinaturaModal,
    
    // Dados de contexto para modals
    entregaEdicao,
    equipamentoDevolucao,
    entregaAssinatura,
    
    // Controle de abertura
    open
  };
</script>

<!-- 
  O Container não possui HTML próprio - apenas gerencia estado e lógica.
  Todo o HTML fica no Presenter, que é "burro" e apenas recebe dados e emite eventos.
-->

<!-- Sempre renderizar o Presenter, deixar o controle de visibilidade para ele -->
<FichaDetailPresenter
  {...containerState}
  on:close={handleClose}
  on:novaEntrega={handleNovaEntrega}
  on:salvarNovaEntrega={handleSalvarNovaEntrega}
  on:cancelarNovaEntrega={handleCancelarNovaEntrega}
  on:editarEntrega={handleEditarEntrega}
  on:salvarEdicaoEntrega={handleSalvarEdicaoEntrega}
  on:cancelarEdicaoEntrega={handleCancelarEdicaoEntrega}
  on:assinarEntrega={handleAssinarEntrega}
  on:confirmarAssinatura={handleConfirmarAssinatura}
  on:cancelarAssinatura={handleCancelarAssinatura}
  on:devolverEquipamento={handleDevolverEquipamento}
  on:confirmarDevolucao={handleConfirmarDevolucao}
  on:cancelarDevolucao={handleCancelarDevolucao}
  on:cancelarEntrega={handleCancelarEntrega}
  on:imprimirEntrega={handleImprimirEntrega}
/>
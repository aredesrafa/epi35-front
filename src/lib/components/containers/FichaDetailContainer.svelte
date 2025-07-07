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
  import { fichaProcessAdapter } from '$lib/services/process/fichaProcessAdapter';
  import { notify } from '$lib/stores';
  import { fichaDataStore } from '$lib/stores/fichaDataStore';
  import FichaDetailPresenter from '../presenters/FichaDetailPresenter.svelte';
  import type { 
    FichaDetailData,
    NovaEntregaFormData,
    EPIDisponivel
  } from '$lib/services/process/fichaProcessAdapter';
  import type {
    EquipamentoEmPosseItem
  } from '$lib/types/serviceTypes';
  
  // ==================== PROPS ====================
  
  export let open = false;
  export let fichaId: string | null = null;
  
  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    close: void;
    fichaUpdated: { fichaId: string };
  }>();
  
  // ==================== STATE MANAGEMENT ====================
  
  // Estado principal dos dados (reativo ao store)
  let fichaData: FichaDetailData | null = null;
  let episDisponiveis: EPIDisponivel[] = [];
  let usuarios: Array<{id: string; nome: string; email: string;}> = [];
  let loading = true;
  let error: string | null = null;
  
  // ✅ NOVO: Reatividade ao store de fichas
  $: if (fichaId && $fichaDataStore.has(fichaId)) {
    const cachedData = $fichaDataStore.get(fichaId);
    if (cachedData && fichaData !== cachedData) {
      fichaData = cachedData;
      console.log('🔄 Dados atualizados via store reativo:', fichaId);
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
   * Carrega dados completos da ficha
   */
  async function loadFichaData(): Promise<void> {
    if (!fichaId) return;
    
    loading = true;
    error = null;
    lastFichaId = fichaId;
    
    try {
      console.log('📋 Carregando dados da ficha:', fichaId);
      
      // Usar service adapter para buscar dados
      fichaData = await fichaProcessAdapter.getFichaDetailData(fichaId);
      
      console.log('✅ Dados da ficha carregados:', fichaData);
      
    } catch (err) {
      console.error('❌ Erro ao carregar ficha:', err);
      error = err instanceof Error ? err.message : 'Erro desconhecido';
      notify.error('Erro ao carregar ficha', 'Não foi possível carregar os dados da ficha');
    } finally {
      loading = false;
    }
  }
  
  /**
   * Carrega EPIs disponíveis para entregas
   */
  async function loadEPIsDisponiveis(): Promise<void> {
    try {
      console.log('🚀 Iniciando carregamento de EPIs disponíveis...');
      episDisponiveis = await fichaProcessAdapter.getEPIsDisponiveis();
      console.log('📦 EPIs disponíveis carregados no container:', episDisponiveis.length);
      console.log('📋 Dados dos EPIs:', episDisponiveis);
    } catch (err) {
      console.error('❌ Erro ao carregar EPIs disponíveis:', err);
    }
  }

  /**
   * Carrega usuários disponíveis para responsável da entrega
   */
  async function loadUsuarios(): Promise<void> {
    try {
      console.log('👤 Iniciando carregamento de usuários...');
      usuarios = await fichaProcessAdapter.getUsuarios();
      console.log('👥 Usuários carregados no container:', usuarios.length);
      console.log('📋 Dados dos usuários:', usuarios.map(u => `${u.id} - ${u.nome} (${u.email})`));
    } catch (err) {
      console.error('❌ Erro ao carregar usuários:', err);
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
    fichaData = null;
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
    
    // Garantir que EPIs estão carregados antes de abrir o drawer
    if (episDisponiveis.length === 0) {
      console.log('🔄 EPIs não carregados, carregando agora...');
      await loadEPIsDisponiveis();
    }
    
    showNovaEntregaDrawer = true;
  }
  
  /**
   * Handler para salvar nova entrega
   */
  async function handleSalvarNovaEntrega(event: CustomEvent<NovaEntregaFormData>): Promise<void> {
    if (!fichaId) return;
    
    entregaLoading = true;
    
    try {
      console.log('💾 Salvando nova entrega:', event.detail);
      
      // Usar service adapter para criar entrega
      const novaEntrega = await fichaProcessAdapter.criarNovaEntrega(fichaId, event.detail);
      
      // Fechar drawer
      showNovaEntregaDrawer = false;
      
      // Recarregar dados da ficha
      await loadFichaData();
      
      notify.success(
        'Entrega criada', 
        `Entrega ${novaEntrega.id} criada com sucesso`
      );
      
      // Notificar que ficha foi atualizada
      dispatch('fichaUpdated', { fichaId });
      
    } catch (error) {
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
   * Handler para salvar edição de entrega
   */
  async function handleSalvarEdicaoEntrega(event: CustomEvent<NovaEntregaFormData>): Promise<void> {
    if (!entregaEdicao) return;
    
    entregaLoading = true;
    
    try {
      console.log('💾 Salvando edição de entrega:', event.detail);
      
      // Usar service adapter para editar entrega
      await fichaProcessAdapter.editarEntrega(entregaEdicao.id, event.detail);
      
      // Fechar drawer
      showEditarEntregaDrawer = false;
      entregaEdicao = null;
      
      // Recarregar dados
      await loadFichaData();
      
      notify.success('Entrega atualizada', 'Entrega foi atualizada com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error) {
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
   * Handler para confirmar assinatura
   */
  async function handleConfirmarAssinatura(event: CustomEvent<{ assinatura: string }>): Promise<void> {
    if (!entregaAssinatura) return;
    
    assinaturaLoading = true;
    
    try {
      console.log('✍️ Processando assinatura:', event.detail);
      
      // Usar service adapter para processar assinatura
      // Usar nome do colaborador da ficha como assinatura
      const nomeColaborador = fichaData?.colaborador?.nome || 'Colaborador';
      await fichaProcessAdapter.confirmarAssinatura(
        entregaAssinatura.id, 
        nomeColaborador
      );
      
      // Fechar modal
      showAssinaturaModal = false;
      entregaAssinatura = null;
      
      // Recarregar dados
      await loadFichaData();
      
      notify.success('Assinatura registrada', 'Entrega foi assinada com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error) {
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
   * Handler para confirmar devolução
   */
  async function handleConfirmarDevolucao(event: CustomEvent<{ motivo: string }>): Promise<void> {
    if (!equipamentoDevolucao) return;
    
    devolucaoLoading = true;
    
    try {
      console.log('🔄 Processando devolução:', event.detail);
      
      // Usar service adapter para processar devolução
      await fichaProcessAdapter.processarDevolucao(
        equipamentoDevolucao.id,
        {
          entregaId: equipamentoDevolucao.entregaId,
          motivo: event.detail.motivo
        }
      );
      
      // Fechar modal
      showDevolucaoModal = false;
      equipamentoDevolucao = null;
      
      // ✅ RECARREGAR DADOS: Backend real retorna status atualizado dos itens
      await loadFichaData();
      
      notify.success('Devolução registrada', 'Equipamento foi devolvido com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error) {
      console.error('❌ Erro ao processar devolução:', error);
      notify.error('Erro na devolução', 'Não foi possível registrar a devolução');
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
  async function handleCancelarEntrega(event: CustomEvent<{ entrega: any; motivo: string }>): Promise<void> {
    try {
      console.log('❌ Cancelando entrega:', event.detail);
      
      await fichaProcessAdapter.cancelarEntrega(event.detail.entrega.id, event.detail.motivo);
      
      // Recarregar dados
      await loadFichaData();
      
      notify.success('Entrega cancelada', 'Entrega foi cancelada com sucesso');
      
      dispatch('fichaUpdated', { fichaId: fichaId! });
      
    } catch (error) {
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
  
  // Estado consolidado para o presenter
  $: containerState = {
    // Dados principais
    fichaData,
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

{#if open}
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
{/if}
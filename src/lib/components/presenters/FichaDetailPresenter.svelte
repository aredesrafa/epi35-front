<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Badge, Avatar, Drawer } from 'flowbite-svelte';
  import Icon from '$lib/components/common/Icon.svelte';
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  import EmptyState from '$lib/components/common/EmptyState.svelte';
  import ItemCard from '$lib/components/common/ItemCard.svelte';
  import StatsGrid from '$lib/components/common/StatsGrid.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  
  // Importar presenters especializados
  import NovaEntregaDrawerPresenter from './NovaEntregaDrawerPresenter.svelte';
  import EditarEntregaDrawerPresenter from './EditarEntregaDrawerPresenter.svelte';
  import DevolucaoModalPresenter from './DevolucaoModalPresenter.svelte';
  import AssinaturaModalPresenter from './AssinaturaModalPresenter.svelte';
  
  // 🚀 NOVO: Importar helpers simplificados
  import { UIMappingHelpers } from '$lib/services/process/shared/uiMappingHelpers';
  
  // 🚀 NOVO: Importar tipos das novas interfaces
  import type { FichaCompleteResponse } from '$lib/services/process/queries/types';
  import type { NovaEntregaFormData } from '$lib/services/process';
  import type { EquipamentoEmPosseItem } from '$lib/types/serviceTypes';

  // ==================== PROPS (dados do Container) ====================
  
  // 🚀 MUDANÇA: Usar dados pré-processados do backend
  export let fichaCompleteData: FichaCompleteResponse | null = null;
  export let episDisponiveis: any[] = [];
  export let usuarios: Array<{id: string; nome: string; email: string;}> = [];
  
  // Estados de loading
  export let loading: boolean = false;
  export let error: string | null = null;
  export let entregaLoading: boolean = false;
  export let assinaturaLoading: boolean = false;
  export let devolucaoLoading: boolean = false;
  
  // Estados dos modals/drawers
  export let showNovaEntregaDrawer: boolean = false;
  export let showEditarEntregaDrawer: boolean = false;
  export let showDevolucaoModal: boolean = false;
  export let showAssinaturaModal: boolean = false;
  
  // Dados de contexto para modals
  export let entregaEdicao: any = null;
  export let equipamentoDevolucao: EquipamentoEmPosseItem | null = null;
  export let entregaAssinatura: any = null;
  
  // Controle de abertura
  export let open: boolean = false;
  
  // Variável para o Drawer - inicializada com base em open
  let hidden = !open;
  
  // Sincronizar hidden com open - apenas quando open muda externamente
  let lastOpen = open;
  $: if (open !== lastOpen) {
    console.log('🔄 Sincronizando drawer (open changed):', { open, hidden, lastOpen });
    hidden = !open;
    lastOpen = open;
  }
  
  // Debug - verificar se o drawer está sendo aberto
  $: if (open) {
    console.log('🎯 FichaDetailPresenter: Drawer foi aberto, carregando dados...', { 
      open, 
      hidden,
      fichaCompleteData: !!fichaCompleteData,
      loading 
    });
  }

  // ==================== ESTADO LOCAL ====================
  
  // Controle de tab ativa
  let activeTab: 'equipamentos' | 'devolucoes' | 'entregas' | 'historico' = 'equipamentos';

  // ==================== DADOS PROCESSADOS ====================
  
  // 🚀 SIMPLIFICAÇÃO: Dados já vêm prontos do backend
  $: fichaData = fichaCompleteData?.data;
  $: colaborador = fichaData?.ficha?.colaborador;
  $: equipamentosEmPosse = fichaData?.equipamentosEmPosse || [];
  $: devolucoes = fichaData?.devolucoes || [];
  $: entregas = fichaData?.entregas || [];
  $: historico = fichaData?.historico || [];
  $: estatisticas = fichaData?.estatisticas;

  // Debug reativo - monitorar dados das abas
  $: if (fichaData) {
    console.log('🎯 FichaDetailPresenter - dados reativos atualizados:');
    console.log('  - Equipamentos em posse:', equipamentosEmPosse?.length || 0);
    console.log('  - Devoluções:', devolucoes?.length || 0);
    console.log('  - Entregas:', entregas?.length || 0);
    console.log('  - Histórico:', historico?.length || 0);
  }

  // 🚀 SIMPLIFICAÇÃO: Usar helpers ao invés de lógica complexa
  $: statusConfig = fichaData?.ficha?.statusDisplay ? 
    UIMappingHelpers.getStatusConfig(
      fichaData.ficha.statusDisplay.label, 
      fichaData.ficha.statusDisplay.cor
    ) : null;

  // Estatísticas removidas conforme solicitado

  $: additionalInfo = colaborador ? [
    colaborador.cpfDisplay || colaborador.cpf || 'CPF não disponível',
    `${colaborador.cargo || 'Cargo não informado'} • ${colaborador.empresa || 'Empresa não informada'}`
  ] : [];

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    close: void;
    novaEntrega: void;
    salvarNovaEntrega: NovaEntregaFormData;
    cancelarNovaEntrega: void;
    editarEntrega: { entrega: any };
    salvarEdicaoEntrega: NovaEntregaFormData;
    cancelarEdicaoEntrega: void;
    assinarEntrega: { entrega: any };
    confirmarAssinatura: { assinatura: string };
    cancelarAssinatura: void;
    devolverEquipamento: { equipamento: EquipamentoEmPosseItem };
    confirmarDevolucao: { motivo: string };
    cancelarDevolucao: void;
    cancelarEntrega: { entrega: any; motivo: string };
    imprimirEntrega: { entrega: any };
  }>();

  // ==================== EVENT HANDLERS ====================
  
  function handleClose(): void {
    dispatch('close');
  }
  
  // Handler para quando o Drawer for fechado externamente (clique fora, ESC, etc)
  // Observar mudanças no hidden para detectar fechamento externo
  let lastHidden = hidden;
  $: if (hidden !== lastHidden) {
    console.log('🔄 Hidden changed:', { hidden, lastHidden, open });
    if (hidden && open) {
      // Drawer foi fechado externamente
      console.log('🎯 Drawer fechado externamente, notificando Container');
      dispatch('close');
    }
    lastHidden = hidden;
  }

  function handleNovaEntrega(): void {
    dispatch('novaEntrega');
  }

  function handleEditarEntrega(entrega: any): void {
    dispatch('editarEntrega', { entrega });
  }

  function handleAssinarEntrega(entrega: any): void {
    dispatch('assinarEntrega', { entrega });
  }

  function handleDevolverEquipamento(equipamento: EquipamentoEmPosseItem): void {
    dispatch('devolverEquipamento', { equipamento });
  }

  function handleImprimirEntrega(entrega: any): void {
    dispatch('imprimirEntrega', { entrega });
  }

  function handleCancelarEntrega(entrega: any): void {
    dispatch('cancelarEntrega', { entrega, motivo: 'Cancelamento solicitado' });
  }

  // ==================== MAPEAMENTOS SIMPLES (substituindo lógica complexa) ====================
  
  // 🗑️ REMOVIDAS: formatarItensHistorico() - 130 linhas
  // 🗑️ REMOVIDAS: formatarMudancaStatus() - 42 linhas  
  // 🗑️ REMOVIDAS: formatarStatusLegivel() - 44 linhas
  // 🗑️ REMOVIDAS: formatarValorDetalhe() - 42 linhas
  // 🗑️ REMOVIDAS: getEventoIconConfig() - 46 linhas
  // 🗑️ REMOVIDAS: getEventoLabel() - 15 linhas
  // 🗑️ REMOVIDAS: getStatusFichaInfo() - 12 linhas
  // 🗑️ REMOVIDAS: getStatusEntregaInfo() - 12 linhas
  // 🗑️ REMOVIDAS: getInitials() - 7 linhas

  // ✅ SUBSTITUÍDAS por mapeamentos simples dos helpers:
  function getEventIcon(tipo: string): string {
    return UIMappingHelpers.getEventIcon(tipo);
  }

  function getStatusClasses(cor: string): string {
    return UIMappingHelpers.getColorClasses(cor);
  }

  function getBadgeColor(cor: string) {
    return UIMappingHelpers.getBadgeColor(cor);
  }

  // ==================== NESTED DRAWER CONTROL ====================
  
  // 🚀 CRÍTICO: Desabilitar backdrop/click-outside do drawer principal quando há drawers aninhados abertos
  // Isso evita que o Flowbite Drawer feche quando clicamos dentro de drawers customizados
  $: anyNestedDrawerOpen = showNovaEntregaDrawer || showEditarEntregaDrawer || showDevolucaoModal || showAssinaturaModal;
</script>

<style>
  :global(.drawer-ficha) {
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
  
  /* Garantir que modais e drawers internos fiquem na frente */
  :global(.z-70) {
    z-index: 70 !important;
  }
  
  :global(.z-60) {
    z-index: 60 !important;
  }
</style>

<!-- ==================== DRAWER PRINCIPAL ==================== -->
<Drawer 
  bind:hidden
  placement="right" 
  width="w-full max-w-[940px]"
  backdrop={!anyNestedDrawerOpen}
  activateClickOutside={!anyNestedDrawerOpen}
  bgOpacity="bg-black/50"
  position="fixed"
  id="ficha-detail-drawer"
  class="drawer-ficha"
>
  <!-- ✅ REFATORADO: Usar DrawerHeader aprimorado -->
  <DrawerHeader
    title={colaborador?.nome || 'Nome não disponível'}
    objectType="FICHA EPI"
    iconName="UserOutline"
    status={fichaData?.ficha?.status}
    statusType="ficha"
    {additionalInfo}
    primaryAction={{ text: 'Nova Entrega', icon: 'PlusOutline' }}
    on:close={handleClose}
    on:primaryAction={handleNovaEntrega}
  />
  
  <!-- Estatísticas removidas conforme solicitado -->
  
  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner />
    </div>
  {:else if error}
    <ErrorDisplay error={error} />
  {:else if fichaData}

    <!-- ==================== TABS NAVIGATION ==================== -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <nav class="flex space-x-8 px-6" aria-label="Tabs">
        {#each [
          { id: 'equipamentos', label: 'Equipamentos', count: equipamentosEmPosse.length },
          { id: 'devolucoes', label: 'Devoluções', count: devolucoes.length },
          { id: 'entregas', label: 'Entregas', count: entregas.length },
          { id: 'historico', label: 'Histórico', count: historico.length }
        ] as tab}
          <button
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === tab.id 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
            on:click={() => activeTab = tab.id}
          >
            {tab.label}
            <span class="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {tab.count}
            </span>
          </button>
        {/each}
      </nav>
    </div>

    <!-- ==================== TAB CONTENT ==================== -->
    <div class="p-6">
      
      <!-- TAB: Equipamentos em Posse -->
      {#if activeTab === 'equipamentos'}
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Equipamentos com o Colaborador</h3>
          </div>

          {#if equipamentosEmPosse.length === 0}
            <EmptyState 
              icon="ClipboardDocumentListOutline" 
              message="Nenhum equipamento em posse"
              description="Este colaborador não possui equipamentos atualmente"
            />
          {:else}
            <div class="space-y-3">
              {#each equipamentosEmPosse as equipamento (equipamento.id)}
                <ItemCard>
                  <div slot="content">
                    <h4 class="font-medium text-gray-900 dark:text-white">{equipamento.nomeEquipamento}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      CA: {equipamento.numeroCA || equipamento.registroCA} • {equipamento.categoria}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      Entregue em: {equipamento.dataEntrega}
                    </p>
                    
                    <!-- ✅ SIMPLIFICADO: Status de vencimento já vem processado -->
                    <div class="mt-2">
                      <Badge 
                        color={UIMappingHelpers.getBadgeColor(equipamento.statusVencimentoDisplay.cor)} 
                        class="rounded-sm"
                      >
                        {equipamento.statusVencimentoDisplay.texto}
                      </Badge>
                      <span class="ml-2 text-sm text-gray-600 dark:text-gray-300">
                        {UIMappingHelpers.formatDaysRemaining(
                          equipamento.statusVencimentoDisplay.diasRestantes,
                          equipamento.statusVencimentoDisplay.statusDetalhado
                        )}
                      </span>
                    </div>
                  </div>

                  <!-- ✅ SIMPLIFICADO: Lógica de ações já vem do backend -->
                  <div slot="actions">
                    {#if equipamento.podeDevolver}
                      <Button 
                        size="sm" 
                        color="alternative" 
                        class="rounded-sm"
                        on:click={() => handleDevolverEquipamento(equipamento)}
                      >
                        Devolver
                      </Button>
                    {/if}
                  </div>
                </ItemCard>
              {/each}
            </div>
          {/if}
        </div>

      <!-- TAB: Devoluções -->
      {:else if activeTab === 'devolucoes'}
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Devoluções Efetuadas</h3>

          {#if devolucoes.length === 0}
            <EmptyState 
              icon="TrashBinOutline" 
              message="Nenhuma devolução registrada"
              description="Não há histórico de devoluções para este colaborador"
            />
          {:else}
            <div class="space-y-3">
              {#each devolucoes as devolucao (devolucao.id)}
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <!-- Header com nome do equipamento e badge de status -->
                      <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-gray-900 dark:text-white">{devolucao.nomeEquipamento}</h4>
                        <Badge 
                          color={devolucao.status === 'processada' ? 'green' : 'red'} 
                          class="rounded-sm"
                        >
                          {devolucao.status === 'processada' ? 'Processada' : 'Cancelada'}
                        </Badge>
                      </div>
                      
                      <!-- Informações principais em grid -->
                      <div class="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">CA / Categoria</span>
                          <p class="text-sm text-gray-900 dark:text-white">{devolucao.numeroCA} • {devolucao.categoria}</p>
                        </div>
                        <div>
                          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data Devolução</span>
                          <p class="text-sm text-gray-900 dark:text-white">{devolucao.dataDevolucao}</p>
                        </div>
                      </div>
                      
                      <!-- Motivo da devolução -->
                      <div class="mb-3">
                        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Motivo</span>
                        <p class="text-sm text-gray-900 dark:text-white">{devolucao.motivoDisplay}</p>
                      </div>
                      
                      <!-- Badges de condição (apenas se não for BOM) -->
                      {#if devolucao.condicaoItem && devolucao.condicaoItem !== 'BOM'}
                        <div class="flex items-center space-x-2">
                          <Badge 
                            color={devolucao.condicaoItem === 'DANIFICADO' ? 'yellow' : 'red'} 
                            class="rounded-sm text-xs"
                          >
                            {devolucao.condicaoItem}
                          </Badge>
                        </div>
                      {/if}
                      
                      <!-- Observações (se houver) -->
                      {#if devolucao.observacoes}
                        <div class="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-blue-400">
                          <p class="text-sm text-gray-700 dark:text-gray-300 italic">"{devolucao.observacoes}"</p>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

      <!-- TAB: Entregas -->
      {:else if activeTab === 'entregas'}
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Entregas Registradas</h3>

          {#if entregas.length === 0}
            <EmptyState 
              icon="TruckOutline" 
              message="Nenhuma entrega registrada"
              description="Não há histórico de entregas para este colaborador"
            />
          {:else}
            <div class="space-y-3">
              {#each entregas as entrega (entrega.id)}
                <ItemCard>
                  <div slot="content">
                    <h4 class="font-medium text-gray-900 dark:text-white">Entrega {entrega.numero}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      Data: {entrega.dataEntrega}
                    </p>
                    
                    <!-- ✅ SIMPLIFICADO: Status já vem processado -->
                    <div class="mt-2">
                      <Badge 
                        color={UIMappingHelpers.getBadgeColor(entrega.statusDisplay.cor)} 
                        class="rounded-sm"
                      >
                        {entrega.statusDisplay.label}
                      </Badge>
                    </div>

                    <!-- Itens da entrega -->
                    <div class="mt-2">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">Itens:</p>
                      <div class="mt-1 space-y-1">
                        {#each entrega.itens as item (item.id)}
                          <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-gray-700 rounded">
                              {item.quantidade}
                            </span>
                            <div class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                              {item.nomeEquipamento} (CA: {item.numeroCA || item.registroCA})
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  </div>

                  <!-- ✅ SIMPLIFICADO: Ações permitidas já vêm do backend -->
                  <div slot="actions" class="flex space-x-2">
                    {#each entrega.acoes as acao}
                      {#if acao === 'assinar'}
                        <Button size="sm" color="primary" class="rounded-sm" on:click={() => handleAssinarEntrega(entrega)}>
                          Assinar
                        </Button>
                      {:else if acao === 'imprimir'}
                        <Button size="sm" color="alternative" class="rounded-sm" on:click={() => handleImprimirEntrega(entrega)}>
                          Imprimir
                        </Button>
                      {:else if acao === 'editar'}
                        <Button size="sm" color="alternative" class="rounded-sm" on:click={() => handleEditarEntrega(entrega)}>
                          Editar
                        </Button>
                      {/if}
                    {/each}
                  </div>
                </ItemCard>
              {/each}
            </div>
          {/if}
        </div>

      <!-- TAB: Histórico -->
      {:else if activeTab === 'historico'}
        <div class="space-y-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Histórico Completo</h3>

          {#if historico.length === 0}
            <EmptyState 
              icon="ClockOutline" 
              message="Nenhum evento registrado"
              description="Não há histórico de atividades para esta ficha"
            />
          {:else}
            <div class="space-y-4">
              {#each historico as evento (evento.id)}
                <div class="flex items-start space-x-4">
                  <!-- ✅ SIMPLIFICADO: Usar helper para ícone -->
                  <div class={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusClasses(evento.tipoDisplay.cor)}`}>
                    <Icon name={getEventIcon(evento.tipoDisplay.tipo)} className="w-5 h-5" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div>
                        <!-- ✅ SIMPLIFICADO: Label já vem do backend -->
                        <h4 class="font-medium text-gray-900 dark:text-white">{evento.tipoDisplay.label}</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-300">{evento.acao}</p>
                      </div>
                      <!-- ✅ SIMPLIFICADO: Data já vem formatada -->
                      <span class="text-sm text-gray-500 dark:text-gray-400">{evento.dataFormatada}</span>
                    </div>

                    <!-- ✅ SIMPLIFICADO: Mudança de status já vem formatada -->
                    {#if evento.mudancaStatus}
                      <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        {evento.mudancaStatus}
                      </p>
                    {/if}

                    <!-- ✅ SIMPLIFICADO: Resumo já vem pronto do backend -->
                    {#if evento.detalhes?.resumo}
                      <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {evento.detalhes.resumo}
                      </p>
                    {/if}

                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Responsável: {evento.responsavel}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>Nenhum dado disponível</p>
    </div>
  {/if}
</Drawer>

<!-- ==================== MODALS E DRAWERS ==================== -->

<!-- Nova Entrega Drawer -->
<NovaEntregaDrawerPresenter
  bind:show={showNovaEntregaDrawer}
  {episDisponiveis}
  {usuarios}
  loading={entregaLoading}
  on:salvar={(e) => dispatch('salvarNovaEntrega', e.detail)}
  on:cancelar={() => dispatch('cancelarNovaEntrega')}
/>

<!-- Editar Entrega Drawer -->
<EditarEntregaDrawerPresenter
  bind:show={showEditarEntregaDrawer}
  {episDisponiveis}
  entrega={entregaEdicao}
  loading={entregaLoading}
  on:salvar={(e) => dispatch('salvarEdicaoEntrega', e.detail)}
  on:cancelar={() => dispatch('cancelarEdicaoEntrega')}
/>

<!-- Modal de Devolução -->
<DevolucaoModalPresenter
  bind:show={showDevolucaoModal}
  equipamento={equipamentoDevolucao}
  loading={devolucaoLoading}
  on:confirmar={(e) => dispatch('confirmarDevolucao', e.detail)}
  on:cancelar={() => dispatch('cancelarDevolucao')}
/>

<!-- Modal de Assinatura -->
<AssinaturaModalPresenter
  bind:show={showAssinaturaModal}
  entrega={entregaAssinatura}
  loading={assinaturaLoading}
  on:confirmar={(e) => dispatch('confirmarAssinatura', e.detail)}
  on:cancelar={() => dispatch('cancelarAssinatura')}
/>
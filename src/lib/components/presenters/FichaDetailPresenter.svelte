<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Badge, Avatar } from 'flowbite-svelte';
  import Icon from '$lib/components/common/Icon.svelte';
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  import StatusDot from '$lib/components/common/StatusDot.svelte';
  import StatusIndicator from '$lib/components/common/StatusIndicator.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  
  // Importar presenters especializados
  import NovaEntregaDrawerPresenter from './NovaEntregaDrawerPresenter.svelte';
  import EditarEntregaDrawerPresenter from './EditarEntregaDrawerPresenter.svelte';
  import DevolucaoModalPresenter from './DevolucaoModalPresenter.svelte';
  import AssinaturaModalPresenter from './AssinaturaModalPresenter.svelte';
  
  import { formatarData, formatarDataComHora, getCorVencimento, getStatusVencimento } from '$lib/utils/dateHelpers';
  import type { 
    FichaDetailData,
    EPIDisponivel,
    NovaEntregaFormData
  } from '$lib/services/process/fichaProcessAdapter';
  import type {
    EquipamentoEmPosseItem
  } from '$lib/types/serviceTypes';

  // ==================== PROPS (dados do Container) ====================
  
  // Dados principais
  export let fichaData: FichaDetailData | null = null;
  export let episDisponiveis: EPIDisponivel[] = [];
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

  // ==================== ESTADO LOCAL ====================
  
  // Controle de tab ativa
  let activeTab: 'equipamentos' | 'devolucoes' | 'entregas' | 'historico' = 'equipamentos';

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
    // Por simplicidade, usar motivo padrão - em produção seria um modal
    dispatch('cancelarEntrega', { entrega, motivo: 'Cancelamento solicitado' });
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  function getStatusFichaInfo(status: string) {
    switch (status) {
      case 'ativa':
        return { color: 'green' as const, label: 'Ativa' };
      case 'vencida':
        return { color: 'red' as const, label: 'Vencida' };
      case 'suspensa':
        return { color: 'yellow' as const, label: 'Suspensa' };
      default:
        return { color: 'gray' as const, label: 'Indefinida' };
    }
  }

  function getStatusEntregaInfo(status: string) {
    switch (status) {
      case 'assinado':
        return { color: 'green' as const, label: 'Assinado' };
      case 'nao_assinado':
        return { color: 'yellow' as const, label: 'Pendente Assinatura' };
      case 'cancelado':
        return { color: 'red' as const, label: 'Cancelado' };
      default:
        return { color: 'gray' as const, label: 'Indefinido' };
    }
  }

  function getInitials(nome: string): string {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function getEventoIconConfig(tipo: string) {
    switch (tipo) {
      case 'criacao':
        return {
          icon: 'DocumentPlusOutline',
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          iconColor: 'text-blue-600 dark:text-blue-400',
          badgeColor: 'blue' as const
        };
      case 'entrega':
        return {
          icon: 'TruckOutline',
          bgColor: 'bg-green-100 dark:bg-green-900',
          iconColor: 'text-green-600 dark:text-green-400',
          badgeColor: 'green' as const
        };
      case 'devolucao':
        return {
          icon: 'ArrowUturnLeftOutline',
          bgColor: 'bg-orange-100 dark:bg-orange-900',
          iconColor: 'text-orange-600 dark:text-orange-400',
          badgeColor: 'orange' as const
        };
      case 'cancelamento':
        return {
          icon: 'XCircleOutline',
          bgColor: 'bg-red-100 dark:bg-red-900',
          iconColor: 'text-red-600 dark:text-red-400',
          badgeColor: 'red' as const
        };
      case 'vencimento':
        return {
          icon: 'ExclamationTriangleOutline',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          badgeColor: 'yellow' as const
        };
      default:
        return {
          icon: 'ClockOutline',
          bgColor: 'bg-gray-100 dark:bg-gray-900',
          iconColor: 'text-gray-600 dark:text-gray-400',
          badgeColor: 'gray' as const
        };
    }
  }

  function getEventoLabel(tipo: string): string {
    switch (tipo) {
      case 'criacao':
        return 'Criação';
      case 'entrega':
        return 'Entrega';
      case 'devolucao':
        return 'Devolução';
      case 'cancelamento':
        return 'Cancelamento';
      case 'vencimento':
        return 'Vencimento';
      default:
        return 'Evento';
    }
  }

  /**
   * Formata valores de detalhes do evento de forma legível
   */
  function formatarValorDetalhe(chave: string, valor: any): string {
    if (valor === null || valor === undefined) {
      return '-';
    }
    
    if (typeof valor === 'string') {
      // Se é uma data ISO, formatar
      if (valor.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return formatarData(valor);
      }
      return valor;
    }
    
    if (typeof valor === 'number') {
      return valor.toString();
    }
    
    if (typeof valor === 'object') {
      // Objeto com nome e outros campos
      if (valor.nome) {
        return valor.nome;
      }
      
      // Objeto genérico - mostrar campos principais
      const camposImportantes = ['id', 'nome', 'codigo', 'quantidade', 'status'];
      const camposPresentes = camposImportantes.filter(campo => valor[campo] !== undefined);
      
      if (camposPresentes.length > 0) {
        return camposPresentes.map(campo => `${campo}: ${valor[campo]}`).join(', ');
      }
      
      // Fallback: contar propriedades
      const propriedades = Object.keys(valor).length;
      return `Objeto (${propriedades} propriedades)`;
    }
    
    if (Array.isArray(valor)) {
      // Arrays genéricos (não itens)
      return valor.length > 0 ? valor.join(', ') : 'Vazio';
    }
    
    return String(valor);
  }

  /**
   * Detecta e formata mudanças de status no histórico
   */
  function formatarMudancaStatus(detalhes: any): string | null {
    if (!detalhes || typeof detalhes !== 'object') {
      return null;
    }

    // Procurar por campos que indicam mudança de status (várias variações possíveis)
    const statusAnterior = detalhes.statusAnterior || detalhes.statusAntigo || detalhes.statusPrevio || 
                          detalhes.statusAntes || detalhes.statusFrom || detalhes.fromStatus || 
                          detalhes.anterior || detalhes.de || detalhes.oldStatus;
                          
    const statusNovo = detalhes.statusNovo || detalhes.statusAtual || detalhes.statusDepois || 
                      detalhes.novoStatus || detalhes.statusTo || detalhes.toStatus || 
                      detalhes.atual || detalhes.para || detalhes.newStatus;

    // Também verificar se há campos diretos como "de" e "para"
    const de = detalhes.de || detalhes.from;
    const para = detalhes.para || detalhes.to;

    if (statusAnterior && statusNovo && statusAnterior !== statusNovo) {
      return `${formatarStatusLegivel(statusAnterior)} → ${formatarStatusLegivel(statusNovo)}`;
    } else if (de && para && de !== para) {
      return `${formatarStatusLegivel(de)} → ${formatarStatusLegivel(para)}`;
    }

    // Tentar detectar mudanças implícitas nos detalhes baseado no tipo de evento
    if (detalhes.tipoAcao || detalhes.acao) {
      const acao = detalhes.tipoAcao || detalhes.acao;
      
      // Mapear ações para mudanças de status implícitas
      switch (acao?.toLowerCase()) {
        case 'devolucao':
          return 'Com Colaborador → Devolvido';
        case 'entrega':
          return 'Disponível → Com Colaborador';
        case 'cancelamento':
          return 'Ativa → Cancelada';
        case 'assinatura':
          return 'Pendente Assinatura → Assinada';
      }
    }

    return null;
  }

  /**
   * Converte status técnicos em formato legível
   */
  function formatarStatusLegivel(status: string): string {
    const statusMap: Record<string, string> = {
      // Fichas
      'ATIVA': 'Ativa',
      'INATIVA': 'Inativa',
      'SUSPENSA': 'Suspensa',
      'VENCIDA': 'Vencida',
      'ativa': 'Ativa',
      'inativa': 'Inativa',
      'suspensa': 'Suspensa',
      'vencida': 'Vencida',
      
      // Entregas
      'PENDENTE_ASSINATURA': 'Pendente Assinatura',
      'ASSINADA': 'Assinada',
      'CANCELADA': 'Cancelada',
      'pendente_assinatura': 'Pendente Assinatura',
      'assinada': 'Assinada',
      'cancelada': 'Cancelada',
      
      // Itens
      'COM_COLABORADOR': 'Com Colaborador',
      'DEVOLVIDO': 'Devolvido',
      'PERDIDO': 'Perdido',
      'DANIFICADO': 'Danificado',
      'com_colaborador': 'Com Colaborador',
      'devolvido': 'Devolvido',
      'perdido': 'Perdido',
      'danificado': 'Danificado',
      
      // Estoque
      'DISPONIVEL': 'Disponível',
      'BAIXO_ESTOQUE': 'Baixo Estoque',
      'ESGOTADO': 'Esgotado',
      'VENCENDO': 'Vencendo',
      'VENCIDO': 'Vencido',
      'disponivel': 'Disponível',
      'baixo_estoque': 'Baixo Estoque',
      'esgotado': 'Esgotado',
      'vencendo': 'Vencendo',
      'vencido': 'Vencido'
    };

    return statusMap[status] || status;
  }

  /**
   * Formata especificamente arrays de itens para histórico de entregas
   * Agora usa informações dos equipamentos em posse para obter nomes reais
   */
  function formatarItensHistorico(itens: any[]): string {
    if (!Array.isArray(itens) || itens.length === 0) {
      return 'Nenhum item';
    }

    console.log('🔍 Formatando itens do histórico:', itens);

    // Criar mapa de nomes de EPIs a partir de equipamentos em posse e entregas
    const equipamentosMap = new Map<string, { nome: string; ca: string }>();
    
    // 1. Usar equipamentos em posse (dados atuais)
    if (fichaData?.equipamentosEmPosse) {
      fichaData.equipamentosEmPosse.forEach(eq => {
        equipamentosMap.set(eq.entregaId, { nome: eq.nomeEquipamento, ca: eq.registroCA });
        equipamentosMap.set(eq.id, { nome: eq.nomeEquipamento, ca: eq.registroCA });
      });
      console.log('📋 Mapeando equipamentos em posse:', equipamentosMap.size);
    }
    
    // 2. Usar entregas para correlacionar prazos com tipos de EPI
    const prazoParaEpiMap = new Map<string, { nome: string; ca: string }>();
    if (fichaData?.entregas) {
      fichaData.entregas.forEach(entrega => {
        if (entrega.itens) {
          entrega.itens.forEach(item => {
            if (item.nomeEquipamento && item.registroCA) {
              equipamentosMap.set(entrega.id, { nome: item.nomeEquipamento, ca: item.registroCA });
              equipamentosMap.set(item.id, { nome: item.nomeEquipamento, ca: item.registroCA });
              
              // ✅ ESTRATÉGIA INTELIGENTE: Mapear prazo -> tipo de EPI
              // Pegar os itens dos equipamentos em posse que correspondem a esta entrega
              if (fichaData.equipamentosEmPosse) {
                fichaData.equipamentosEmPosse.forEach(eq => {
                  if (eq.entregaId === entrega.id && eq.nomeEquipamento === item.nomeEquipamento) {
                    const prazoFormatado = formatarData(eq.prazoMaximoDevolucao);
                    prazoParaEpiMap.set(prazoFormatado, { nome: eq.nomeEquipamento, ca: eq.registroCA });
                  }
                });
              }
            }
          });
        }
      });
      console.log('📋 Mapeamento prazo->EPI criado:', prazoParaEpiMap.size);
    }

    // Agrupar itens por tipo/nome de EPI
    const itensPorTipo = new Map<string, { quantidade: number; prazos: string[] }>();
    
    itens.forEach((item, index) => {
      console.log(`📋 Processando item ${index}:`, item);
      
      // Tentar extrair informações do item de várias formas possíveis
      let nomeEpi = 'EPI';
      let prazo = 'Sem prazo';
      
      // 1. Buscar prazo primeiro (é o que temos de mais confiável)
      if (item.dataLimiteDevolucao) {
        prazo = formatarData(item.dataLimiteDevolucao);
      } else if (item.prazo) {
        prazo = formatarData(item.prazo);
      } else if (item.dataValidade) {
        prazo = formatarData(item.dataValidade);
      }
      
      // 2. Usar o prazo para descobrir o tipo de EPI (ESTRATÉGIA INTELIGENTE)
      if (prazo !== 'Sem prazo' && prazoParaEpiMap.has(prazo)) {
        const equipInfo = prazoParaEpiMap.get(prazo)!;
        nomeEpi = equipInfo.nome;
        console.log(`🎯 EPI identificado por prazo ${prazo}: ${nomeEpi}`);
      } else if (item.tipoEpiNome) {
        nomeEpi = item.tipoEpiNome;
      } else if (item.nome) {
        nomeEpi = item.nome;
      } else if (item.equipamento) {
        nomeEpi = item.equipamento;
      } else if (item.tipoEPI?.nomeEquipamento) {
        nomeEpi = item.tipoEPI.nomeEquipamento;
      } else if (item.tipoEPI?.nome) {
        nomeEpi = item.tipoEPI.nome;
      } else if (typeof item === 'string') {
        nomeEpi = item;
      } else if (item.estoqueItemOrigemId && equipamentosMap.has(item.estoqueItemOrigemId)) {
        const equipInfo = equipamentosMap.get(item.estoqueItemOrigemId)!;
        nomeEpi = equipInfo.nome;
      } else if (item.tipoEpiId) {
        // Buscar por qualquer key que contenha o tipoEpiId
        let encontrado = false;
        for (const [key, value] of equipamentosMap.entries()) {
          if (key.includes(item.tipoEpiId)) {
            nomeEpi = value.nome;
            encontrado = true;
            break;
          }
        }
        if (!encontrado) {
          // Último recurso: mostrar ID parcial mais legível
          nomeEpi = `EPI (${item.tipoEpiId.substring(0, 8)}...)`;
        }
      }
      
      console.log(`📋 Item processado: ${nomeEpi} - ${prazo}`);
      
      if (!itensPorTipo.has(nomeEpi)) {
        itensPorTipo.set(nomeEpi, { quantidade: 0, prazos: [] });
      }
      
      const grupo = itensPorTipo.get(nomeEpi)!;
      grupo.quantidade += 1;
      if (!grupo.prazos.includes(prazo)) {
        grupo.prazos.push(prazo);
      }
    });

    // Gerar lista formatada
    const linhas: string[] = [];
    
    itensPorTipo.forEach((dados, nomeEpi) => {
      const prazoTexto = dados.prazos.length > 1 
        ? `prazos: ${dados.prazos.join(', ')}`
        : `prazo: ${dados.prazos[0]}`;
      
      linhas.push(`• ${dados.quantidade}x ${nomeEpi} (${prazoTexto})`);
    });

    console.log('✅ Itens formatados:', linhas);
    return linhas.join('\n');
  }
</script>

{#if open}
  <div 
    class="fixed bg-black bg-opacity-50 z-40 transition-opacity"
    style="top: 4rem; left: 0; right: 0; bottom: 0;"
    on:click={handleClose}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="button"
    tabindex="0"
  ></div>

  <div 
    class="fixed top-16 right-0 bg-white dark:bg-gray-800 shadow-xl z-45 transform transition-transform duration-300 ease-in-out flex flex-col"
    class:translate-x-0={open}
    class:translate-x-full={!open}
    style="width: min(880px, 95vw); height: calc(100vh - 4rem);"
  >
    
    <DrawerHeader
      objectType="FICHA EPI"
      title={fichaData?.colaborador?.nome || 'Carregando colaborador...'}
      iconName="ClipboardListOutline"
      status={fichaData?.status || ''}
      statusType="ficha"
      additionalInfo={[
        fichaData?.colaborador?.cpf ? `CPF ${fichaData.colaborador.cpf}` : '',
        fichaData?.colaborador?.cargo || ''
      ].filter(Boolean)}
      primaryAction={{
        text: 'Nova entrega',
        icon: 'PlusOutline'
      }}
      on:close={handleClose}
      on:primaryAction={handleNovaEntrega}
    />

    {#if loading}
      <div class="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    {:else if error}
      <div class="flex-1 flex items-center justify-center">
        <div class="p-8 text-center">
          <Icon name="ExclamationTriangleOutline" className="text-red-500 mx-auto mb-4" size="w-16 h-16" />
          <p class="text-red-600 dark:text-red-400 text-lg mb-4">{error}</p>
          <Button size="sm" color="primary" class="rounded-sm mt-4" on:click={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    {:else if fichaData}
      <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="px-4 pt-2">
          <nav class="flex space-x-4" aria-label="Tabs">
            <button
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200 -mb-px {activeTab === 'equipamentos' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
              on:click={() => activeTab = 'equipamentos'}
            >
              Equipamentos
            </button>
            <button
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200 -mb-px {activeTab === 'devolucoes' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
              on:click={() => activeTab = 'devolucoes'}
            >
              Devoluções
            </button>
            <button
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200 -mb-px {activeTab === 'entregas' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
              on:click={() => activeTab = 'entregas'}
            >
              Entregas
            </button>
            <button
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200 -mb-px {activeTab === 'historico' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
              on:click={() => activeTab = 'historico'}
            >
              Histórico
            </button>
          </nav>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="px-4 py-4">

          {#if activeTab === 'equipamentos'}
            <div class="mt-6 border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
              {#if fichaData.equipamentosEmPosse && fichaData.equipamentosEmPosse.length > 0}
                {#each fichaData.equipamentosEmPosse as equipamento}
                  <div class="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-sm flex items-center justify-center">
                          <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {equipamento.quantidade}
                          </span>
                        </div>
                        <div>
                          <p class="font-semibold text-gray-900 dark:text-white text-base">
                            {equipamento.nomeEquipamento}
                          </p>
                          <p class="text-sm text-gray-500 dark:text-gray-400">
                            CA {equipamento.registroCA}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center space-x-3">
                        <!-- Botão Devolver - só mostrar se status for COM_COLABORADOR -->
                        {#if equipamento.status === 'COM_COLABORADOR'}
                          <Button size="sm" color="alternative" class="rounded-sm border border-gray-300 dark:border-gray-600" on:click={() => handleDevolverEquipamento(equipamento)}>
                            Devolver
                          </Button>
                        {:else}
                          <!-- Mostrar status atual se não for COM_COLABORADOR -->
                          <Badge color="gray" class="rounded-sm">
                            {equipamento.status === 'DEVOLVIDO' ? 'Devolvido' : equipamento.status}
                          </Badge>
                        {/if}
                      </div>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Entrega</span>
                        <button class="text-sm text-primary-600 dark:text-primary-400 font-semibold mt-1 hover:underline text-left" on:click={() => { console.log('Abrir drawer da entrega:', equipamento.entregaId); }}>
                          #{equipamento.entregaId}
                        </button>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Prazo Devolução</span>
                        <span class="text-sm text-gray-900 dark:text-white font-semibold mt-1">
                          {formatarData(equipamento.prazoMaximoDevolucao)}
                          {#if equipamento.vencido}
                            <span class="text-red-600"> - {equipamento.diasVencido} dias atrasado</span>
                          {/if}
                        </span>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Status</span>
                        <span class="text-sm font-semibold mt-1 {equipamento.vencido ? 'text-red-600' : 'text-green-600'}">
                          {#if equipamento.vencido}
                            Em atraso
                          {:else}
                            No prazo
                          {/if}
                        </span>
                      </div>
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="text-center py-12">
                  <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                    <Icon name="ShieldCheckOutline" className="text-gray-400" size="w-8 h-8" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhum equipamento em posse
                  </h3>
                  <p class="text-gray-500 dark:text-gray-400">
                    Este colaborador não possui EPIs em sua posse no momento.
                  </p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'devolucoes'}
            <div class="mt-6 border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
              {#if fichaData.devolucoes && fichaData.devolucoes.length > 0}
                {#each fichaData.devolucoes as devolucao}
                  <div class="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-sm flex items-center justify-center">
                          <span class="text-lg font-bold text-green-600 dark:text-green-400">
                            {devolucao.quantidade}
                          </span>
                        </div>
                        <div>
                          <p class="font-semibold text-gray-900 dark:text-white text-base">
                            {devolucao.nomeEquipamento}
                          </p>
                          <p class="text-sm text-gray-500 dark:text-gray-400">
                            CA {devolucao.registroCA}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center space-x-3">
                        <Button size="sm" color="alternative" class="rounded-sm border border-gray-300 dark:border-gray-600" on:click={() => console.log('Cancelar devolução:', devolucao)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Entrega</span>
                        <button class="text-sm text-primary-600 dark:text-primary-400 font-semibold mt-1 hover:underline text-left" on:click={() => console.log('Abrir drawer da entrega')}>
                          #E{Math.random().toString(36).substr(2, 3).toUpperCase()}
                        </button>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Data Devolução</span>
                        <span class="text-sm text-gray-800 dark:text-gray-200 font-medium mt-1">
                          {formatarData(devolucao.dataDevolucao)}
                        </span>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Motivo</span>
                        <span class="text-sm text-gray-800 dark:text-gray-200 font-medium mt-1">
                          {devolucao.motivo}
                        </span>
                      </div>
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="text-center py-12">
                  <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                    <Icon name="ArrowLeftOutline" className="text-gray-400" size="w-8 h-8" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma devolução pendente
                  </h3>
                  <p class="text-gray-500 dark:text-gray-400">
                    Não há devoluções de EPIs solicitadas para este colaborador.
                  </p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'entregas'}
            <div class="space-y-4 mt-6">
              {#if fichaData.entregas && fichaData.entregas.length > 0}
                {#each fichaData.entregas as entrega}
                  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center space-x-4">
                        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-sm flex items-center justify-center">
                          <Icon name="DocumentOutline" className="text-blue-600 dark:text-blue-400" size="w-5 h-5" />
                        </div>
                        <div>
                          <h3 class="font-semibold text-gray-900 dark:text-white text-base">
                            Entrega #{entrega.numero}
                          </h3>
                          <p class="text-sm text-gray-500 dark:text-gray-400">
                            {formatarData(entrega.dataEntrega)}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center space-x-2">
                        <Badge 
                          color={entrega.status === 'PENDENTE_ASSINATURA' ? 'yellow' : 
                                 entrega.status === 'ASSINADO' ? 'green' : 'blue'} 
                          class="rounded-sm"
                        >
                          {entrega.status === 'PENDENTE_ASSINATURA' ? 'Pendente Assinatura' :
                           entrega.status === 'ASSINADO' ? 'Assinado' : entrega.status}
                        </Badge>
                        
                        <!-- Botão Assinar - só mostra se status for PENDENTE_ASSINATURA -->
                        {#if entrega.status === 'PENDENTE_ASSINATURA'}
                          <Button size="sm" color="primary" class="rounded-sm" on:click={() => handleAssinarEntrega(entrega)}>
                            <Icon name="PenOutline" className="mr-2" size="w-4 h-4" />
                            Assinar
                          </Button>
                        {/if}
                        
                        <!-- Botão Imprimir - sempre disponível -->
                        <Button size="sm" color="light" class="rounded-sm" on:click={() => handleImprimirEntrega(entrega)}>
                          <Icon name="FileDocOutline" className="mr-2" size="w-4 h-4" />
                          Imprimir
                        </Button>
                        
                        <!-- Botão Editar - sempre disponível -->
                        <Button size="sm" color="alternative" class="rounded-sm" on:click={() => handleEditarEntrega(entrega)}>
                          <Icon name="PenOutline" className="mr-2" size="w-4 h-4" />
                          Editar
                        </Button>
                      </div>
                    </div>

                    <div class="space-y-3">
                      {#if entrega.itens && entrega.itens.length > 0}
                        {#each entrega.itens as item}
                          <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                            <div class="flex items-center space-x-3">
                              <span class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-sm flex items-center justify-center text-sm font-medium">
                                {item.quantidade}
                              </span>
                              <div>
                                <p class="font-medium text-gray-900 dark:text-white text-sm">
                                  {item.nomeEquipamento}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                  CA {item.registroCA}
                                </p>
                              </div>
                            </div>
                          </div>
                        {/each}
                      {/if}
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="text-center py-12">
                  <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                    <Icon name="DocumentOutline" className="text-gray-400" size="w-8 h-8" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma entrega realizada
                  </h3>
                  <p class="text-gray-500 dark:text-gray-400">
                    Este colaborador ainda não possui entregas de EPIs registradas.
                  </p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'historico'}
            <div class="mt-6">
              {#if fichaData.historico && fichaData.historico.length > 0}
                <div class="space-y-4">
                  {#each fichaData.historico as evento}
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm p-6">
                      <div class="flex items-start space-x-4">
                        <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon name="ClockOutline" className="text-gray-500 dark:text-gray-400" size="w-5 h-5" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                              {evento.acao}
                            </h4>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                              {formatarDataComHora(evento.dataEvento)}
                            </span>
                          </div>
                          <!-- Mudança de status (se existir) -->
                          {#if evento.detalhes}
                            {@const mudancaStatus = formatarMudancaStatus(evento.detalhes)}
                            {#if mudancaStatus}
                              <div class="mt-2 flex items-center gap-2">
                                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Mudança de status:</span>
                                <span class="text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                  {mudancaStatus}
                                </span>
                              </div>
                            {/if}
                          {/if}
                          
                          <!-- Detalhes do evento -->
                          {#if evento.detalhes}
                            <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-sm">
                              <h5 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Detalhes do evento:
                              </h5>
                              <div class="grid grid-cols-2 gap-3 text-xs">
                                {#each Object.entries(evento.detalhes) as [chave, valor]}
                                  {#if valor && chave !== 'responsavel' && chave !== 'responsavelNome' && !chave.toLowerCase().includes('status')}
                                    <!-- Tratamento especial para arrays de itens -->
                                    {#if chave.toLowerCase().includes('itens') && Array.isArray(valor)}
                                      <div class="col-span-2 flex flex-col">
                                        <span class="font-medium text-gray-600 dark:text-gray-400 capitalize mb-2">
                                          {chave.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                        </span>
                                        <div class="bg-gray-100 dark:bg-gray-800 rounded-sm p-3">
                                          <pre class="text-gray-800 dark:text-gray-200 whitespace-pre-line text-xs font-mono leading-relaxed">{formatarItensHistorico(valor)}</pre>
                                        </div>
                                      </div>
                                    {:else}
                                      <!-- Outros campos normais -->
                                      <div class="flex flex-col">
                                        <span class="font-medium text-gray-600 dark:text-gray-400 capitalize">
                                          {chave.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                        </span>
                                        <span class="text-gray-800 dark:text-gray-200 mt-1">
                                          {formatarValorDetalhe(chave, valor)}
                                        </span>
                                      </div>
                                    {/if}
                                  {/if}
                                {/each}
                              </div>
                            </div>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-12">
                  <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                    <Icon name="ClockOutline" className="text-gray-400" size="w-8 h-8" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhum evento encontrado
                  </h3>
                  <p class="text-gray-500 dark:text-gray-400">
                    Esta ficha ainda não possui histórico de eventos registrados.
                  </p>
                </div>
              {/if}
            </div>

          {/if}

        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
            <Icon name="DocumentOutline" className="text-gray-400" size="w-8 h-8" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma ficha selecionada
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Selecione uma ficha para ver os detalhes.
          </p>
        </div>
      </div>
    {/if}
  </div>

  {#if showNovaEntregaDrawer}
    <NovaEntregaDrawerPresenter
      {episDisponiveis}
      {usuarios}
      loading={entregaLoading}
      show={showNovaEntregaDrawer}
      on:salvar={(e) => dispatch('salvarNovaEntrega', e.detail)}
      on:cancelar={() => dispatch('cancelarNovaEntrega')}
    />
  {/if}

  {#if showEditarEntregaDrawer && entregaEdicao}
    <EditarEntregaDrawerPresenter
      {episDisponiveis}
      entrega={entregaEdicao}
      loading={entregaLoading}
      show={showEditarEntregaDrawer}
      on:salvar={(e) => dispatch('salvarEdicaoEntrega', e.detail)}
      on:cancelar={() => dispatch('cancelarEdicaoEntrega')}
    />
  {/if}

  {#if showDevolucaoModal && equipamentoDevolucao}
    <DevolucaoModalPresenter
      equipamento={equipamentoDevolucao}
      loading={devolucaoLoading}
      show={showDevolucaoModal}
      on:confirmar={(e) => dispatch('confirmarDevolucao', e.detail)}
      on:cancelar={() => dispatch('cancelarDevolucao')}
    />
  {/if}

  {#if showAssinaturaModal && entregaAssinatura}
    <AssinaturaModalPresenter
      entrega={entregaAssinatura}
      loading={assinaturaLoading}
      show={showAssinaturaModal}
      on:confirmar={(e) => dispatch('confirmarAssinatura', e.detail)}
      on:cancelar={() => dispatch('cancelarAssinatura')}
    />
  {/if}

{/if}

<style>
  /* Personalizar scrollbar para o drawer EXATAMENTE como o original */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    background-clip: content-box;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
    background-clip: content-box;
  }
  
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
    background-clip: content-box;
  }
  
  /* Fallback para Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }
  
  :global(.dark) .custom-scrollbar {
    scrollbar-color: #4b5563 transparent;
  }

  /* Z-index personalizados para sobreposição de drawers */
  :global(.z-45) {
    z-index: 45;
  }
  
  :global(.z-55) {
    z-index: 55;
  }
  
  :global(.z-60) {
    z-index: 60;
  }
</style>
<!--
  Auditoria Container - Sistema DataLife EPI
  
  Container inteligente que gerencia lógica de negócio para auditoria de movimentações.
  Utiliza Enhanced Paginated Store para paginação server-side e filtros otimizados.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { createPaginatedStore } from '$lib/stores/paginatedStore';
  import AuditoriaTablePresenter from '$lib/components/presenters/AuditoriaTablePresenter.svelte';
  import { notify } from '$lib/stores';
  import { api } from '$lib/services/core/apiClient';
  import type { RelatorioMovimentacaoDTO, RelatorioMovimentacoesParams } from '$lib/types/serviceTypes';
  
  // 🚀 MIGRADO: Imports para service adapters
  import { fichaQueryAdapter } from '$lib/services/process/queries/fichaQueryAdapter';
  import { inventoryQueryAdapter } from '$lib/services/inventory/inventoryQueryAdapter';
  import { catalogAdapter } from '$lib/services/entity/catalogAdapter';
  
  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  
  // ==================== BACKEND INTEGRATION ====================
  
  // ✅ Backend agora implementou includeDeliveryData
  // Os campos entregaId e colaboradorNome vêm diretamente do backend

  // ==================== ADVANCED PAGINATED STORE ====================
  
  // ✅ Função de fetch para movimentações de auditoria - BACKEND REAL
  async function fetchMovimentacoes(params: any): Promise<any> {
    const searchParams = new URLSearchParams();
    
    // Parâmetros de paginação
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    
    // Filtros específicos conforme documentação do backend
    if (params.almoxarifadoId) searchParams.set('almoxarifadoId', params.almoxarifadoId);
    if (params.tipoEpiId) searchParams.set('tipoEpiId', params.tipoEpiId);
    if (params.tipoMovimentacao) searchParams.set('tipoMovimentacao', params.tipoMovimentacao);
    if (params.usuarioId) searchParams.set('usuarioId', params.usuarioId);
    if (params.dataInicio) searchParams.set('dataInicio', params.dataInicio);
    if (params.dataFim) searchParams.set('dataFim', params.dataFim);
    
    // ✅ NEW: Incluir dados de entrega quando necessário
    searchParams.set('includeDeliveryData', 'true');
    
    console.log('📋 Buscando movimentações:', `/relatorios/movimentacoes?${searchParams}`);
    
    try {
      // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
      const endpoint = `/relatorios/movimentacoes?${searchParams}`;
      const result = await api.get(endpoint) as { 
        success: boolean; 
        data?: { 
          movimentacoes?: any[]; 
          resumo?: { totalMovimentacoes?: number }; 
        } 
      };
      console.log('✅ Dados recebidos do backend:', result);
      console.log('📊 Estrutura dos dados:', {
        success: result.success,
        movimentacoes: result.data?.movimentacoes?.length || 0,
        totalMovimentacoes: result.data?.resumo?.totalMovimentacoes || 0
      });
      
      // Validar estrutura da resposta conforme documentação
      if (!result.success || !result.data) {
        throw new Error(`Backend retornou estrutura inválida: ${JSON.stringify(result)}`);
      }
      
      const movimentacoes = result.data.movimentacoes || [];
      const total = result.data.resumo?.totalMovimentacoes || 0;
      
      // ✅ Backend agora fornece entregaId e colaboradorNome diretamente
      // Usar os dados do backend sem correlação
      
      console.log('📋 Dados recebidos do backend:', {
        data: movimentacoes.length,
        total: total,
        page: params.page || 1,
        pageSize: params.limit || 10,
        entregasComDados: movimentacoes.filter((m: any) => m.entregaId).length,
        colaboradoresComDados: movimentacoes.filter((m: any) => m.colaboradorNome).length
      });
      
      // 🔍 DEBUG: Verificar se backend implementou includeDeliveryData
      const saidasEntrega = movimentacoes.filter((m: any) => m.tipoMovimentacao === 'SAIDA_ENTREGA');
      console.log('🔍 Movimentações SAIDA_ENTREGA encontradas:', saidasEntrega.length);
      if (saidasEntrega.length > 0) {
        const primeira = saidasEntrega[0];
        console.log('🔍 Primeira SAIDA_ENTREGA do backend:', {
          id: primeira.id.substring(0, 8),
          data: primeira.data,
          entregaId: primeira.entregaId || 'não implementado',
          colaboradorNome: primeira.colaboradorNome || 'não implementado'
        });
        
        // 📋 Status da implementação
        const implementado = primeira.entregaId && primeira.colaboradorNome;
        console.log(`📋 Status includeDeliveryData: ${implementado ? '✅ IMPLEMENTADO' : '⚠️ AGUARDANDO BACKEND'}`);
      }
      
      // Adaptar estrutura do backend para o formato esperado pelo store
      return {
        data: movimentacoes,
        total: total,
        page: params.page || 1,
        pageSize: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10))
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar movimentações:', error);
      throw error;
    }
  }
  
  // ✅ Store paginado conectado ao endpoint correto de relatórios/movimentações
  const auditoriaStore = createPaginatedStore<RelatorioMovimentacaoDTO>(
    fetchMovimentacoes,
    {
      initialPageSize: initialPageSize,
      debounceDelay: 300,
      cacheTimeout: 2 * 60 * 1000, // 2 min cache para dados de auditoria
      enableCache: true
    }
  );
  
  
  // ==================== DERIVED STORES ====================
  
  $: items = $auditoriaStore?.items || [];
  $: loading = $auditoriaStore?.loading || false;
  $: error = $auditoriaStore?.error || null;
  $: pagination = {
    page: $auditoriaStore?.page || 1,
    pageSize: $auditoriaStore?.pageSize || initialPageSize,
    total: $auditoriaStore?.total || 0,
    totalPages: $auditoriaStore?.totalPages || 1
  };
  
  
  // Estado de filtros e opções carregadas do backend
  let filters = {};
  let almoxarifados: any[] = [];
  let tiposEpi: any[] = [];
  let usuarios: any[] = [];
  
  // Carregar opções de filtros do backend
  async function loadFilterOptions() {
    try {
      // Carregar almoxarifados (através dos itens de estoque)
      try {
        const estoqueData = await inventoryQueryAdapter.getInventoryItems({
          page: 1,
          limit: 100
        });
        const almoxarifadosUnicos = new Map();
        (estoqueData.data as any).items?.forEach((item: any) => {
            if (item.almoxarifado) {
              almoxarifadosUnicos.set(item.almoxarifado.id, {
                id: item.almoxarifado.id,
                nome: item.almoxarifado.nome
              });
            }
          });
          almoxarifados = Array.from(almoxarifadosUnicos.values());
          console.log('✅ Almoxarifados carregados:', almoxarifados.length);
      } catch (error: any) {
        console.warn('⚠️ Erro ao carregar almoxarifados, usando fallback:', error);
        // Fallback: usar dados padrão ou buscar de outro endpoint
        almoxarifados = [
          { id: 'alm-central-sp', nome: 'Almoxarifado Central SP' },
          { id: 'alm-rj', nome: 'Almoxarifado RJ' }
        ];
      }
      
      // Carregar tipos de EPI
      const epiData = await catalogAdapter.getTiposEPI({
        page: 1,
        limit: 100
      });
      
      console.log('📦 Estrutura epiData:', epiData);
      
      tiposEpi = epiData.data.map((item: any) => ({
          id: item.id,
          nomeEquipamento: item.nomeEquipamento,
          numeroCA: item.numeroCa || item.numeroCA
        }));
        console.log('✅ Tipos EPI carregados:', tiposEpi.length);
      
      // 🚀 MIGRADO: Carregar usuários
      const usuariosData = await fichaQueryAdapter.getUsuarios();
      usuarios = usuariosData.map((item: any) => ({
          id: item.id,
          nome: item.nome
        }));
        console.log('✅ Usuários carregados:', usuarios.length);
    } catch (error: any) {
      console.error('⚠️ Erro ao carregar opções de filtros:', error);
    }
  }
  
  // ==================== LIFECYCLE ====================
  
  onMount(async () => {
    console.log('📋 Inicializando AuditoriaContainer...');
    try {
      // Carregar opções de filtros e dados iniciais em paralelo
      await Promise.all([
        loadFilterOptions(),
        auditoriaStore.fetchPage({ page: 1, limit: initialPageSize })
      ]);
      console.log('✅ Container de auditoria inicializado com dados reais');
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
    }
  });
  
  // ==================== EVENT HANDLERS ====================
  
  function handlePageChange(newPage: number): void {
    console.log('📄 Mudança de página:', newPage);
    auditoriaStore.goToPage(newPage);
  }
  
  function handleFilterChange(filterKey: string, value: any): void {
    console.log('🔍 Filtro alterado:', filterKey, value);
    filters = { ...filters, [filterKey]: value };
    // Aplicar filtros através do fetchPage com os novos parâmetros
    auditoriaStore.fetchPage({ 
      page: 1, 
      limit: pagination.pageSize,
      ...filters,
      [filterKey]: value 
    });
  }
  
  function handleClearFilters(): void {
    console.log('🧹 Limpando filtros...');
    filters = {};
    auditoriaStore.fetchPage({ page: 1, limit: pagination.pageSize });
  }
  
  function handleRefresh(): void {
    console.log('🔄 Atualizando dados de auditoria...');
    auditoriaStore.reload();
  }
  
  function handleItemsPerPageChange(newSize: number): void {
    console.log('📊 Alterando itens por página:', newSize);
    auditoriaStore.fetchPage({ page: 1, limit: newSize, ...filters });
  }
  
  function handleMovementDetails(movement: RelatorioMovimentacaoDTO): void {
    console.log('📋 Ver detalhes da movimentação:', movement);
    // TODO: Implementar modal de detalhes ou navegação
    notify.info('Em desenvolvimento', 'Visualização de detalhes da movimentação será implementada');
  }
  
  function handleExportData(): void {
    console.log('📥 Exportar dados de auditoria...');
    
    // Preparar dados para exportação
    const exportFilters = filters;
    const exportData = {
      filtros: exportFilters,
      totalRecords: pagination.total,
      dataExportacao: new Date().toISOString()
    };
    
    console.log('📊 Dados para exportação:', exportData);
    
    // TODO: Implementar exportação real
    notify.info('Em desenvolvimento', 'Exportação de relatório de auditoria será implementada');
  }
</script>

<!-- ==================== PRESENTER ====================

  Delega toda renderização para o AuditoriaTablePresenter,
  que é um componente "burro" responsável apenas pela UI.
-->

<AuditoriaTablePresenter 
  {items}
  {loading}
  {error}
  {pagination}
  {filters}
  {almoxarifados}
  {tiposEpi}
  {usuarios}
  on:pageChange={(e) => handlePageChange(e.detail)}
  on:filterChange={(e) => handleFilterChange(e.detail.key, e.detail.value)}
  on:clearFilters={handleClearFilters}
  on:refresh={handleRefresh}
  on:itemsPerPageChange={(e) => handleItemsPerPageChange(e.detail)}
  on:movementDetails={(e) => handleMovementDetails(e.detail)}
  on:exportData={handleExportData}
/>
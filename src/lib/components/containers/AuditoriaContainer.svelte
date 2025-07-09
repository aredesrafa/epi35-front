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
  import { fichaQueryAdapter } from '$lib/services/process';
  import { inventoryQueryAdapter } from '$lib/services/inventory/inventoryQueryAdapter';
  import { catalogAdapter } from '$lib/services/entity/catalogAdapter';
  
  // ==================== PROPS ====================
  
  export let initialPageSize = 10;
  export const autoRefresh = false;
  
  // ==================== ENTREGA CORRELATION ====================
  
  // Cache de entregas para correlação eficiente
  let entregasCache = new Map<string, string>(); // timestamp -> entregaId
  let colaboradoresCache = new Map<string, string>(); // entregaId -> colaboradorNome
  let cacheExpiry = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  /**
   * Busca entregas de fichas para correlação com movimentações
   */
  async function loadEntregasForCorrelation(): Promise<void> {
    if (Date.now() < cacheExpiry) return; // Cache válido
    
    try {
      console.log('🔗 Carregando entregas para correlação...');
      
      // 🚀 MIGRADO: Buscar fichas ativas usando novo adapter
      const fichasData = await fichaQueryAdapter.getFichasWithColaboradores({
        page: 1,
        limit: 100
      });
      entregasCache.clear();
      
      // ✅ CORREÇÃO: A resposta de fichas vem em data diretamente, não data.items
      const fichas = fichasData.data || [];
      console.log(`🔍 Fichas encontradas para correlação: ${fichas.length}`);
      
      // Para cada ficha, buscar entregas e popular cache
      for (const ficha of fichas) {
        try {
          // 🚀 MIGRADO: Buscar entregas usando fallback temporário
          // TODO: Implementar getEntregasByFicha no fichaQueryAdapter
          const entregasData = await fichaQueryAdapter.getFichaById(ficha.id);
            
            // ✅ CORREÇÃO: A resposta de entregas vem em data diretamente como array
            const entregas = entregasData.data || [];
            console.log(`📦 Ficha ${ficha.id.substring(0, 8)}: ${entregas.length} entregas encontradas`);
            
            for (const entrega of entregas) {
              // Criar chaves de timestamp com tolerância ampla de 10 segundos
              const timestamp = new Date(entrega.dataEntrega).getTime();
              
              // ✅ NOVA ESTRATÉGIA: Criar chaves por segundo completo, não por millisegundo
              // Isso resolve o problema de diferenças pequenas entre entrega e movimentação
              const segundoBase = Math.floor(timestamp / 1000) * 1000; // Arredondar para o segundo
              
              for (let i = -10; i <= 10; i++) { // ±10 segundos
                const keyTimestamp = segundoBase + (i * 1000);
                const key = keyTimestamp.toString();
                entregasCache.set(key, entrega.id);
              }
              
              // ✅ NOVO: Cache do nome do colaborador por entregaId
              if (entrega.fichaEPI?.colaborador?.nome) {
                colaboradoresCache.set(entrega.id, entrega.fichaEPI.colaborador.nome);
                console.log(`👤 Colaborador ${entrega.fichaEPI.colaborador.nome} associado à entrega ${entrega.id.substring(0, 8)}`);
              } else if (ficha.colaborador?.nome) {
                // Fallback: usar dados da ficha se a entrega não trouxer os dados do colaborador
                colaboradoresCache.set(entrega.id, ficha.colaborador.nome);
                console.log(`👤 Colaborador ${ficha.colaborador.nome} associado à entrega ${entrega.id.substring(0, 8)} (via ficha)`);
              }
              
              console.log(`✅ Entrega ${entrega.id.substring(0, 8)} adicionada ao cache (${entrega.dataEntrega}) - timestamp base: ${segundoBase}`);
            }
        } catch (error) {
          console.warn(`⚠️ Erro ao buscar entregas da ficha ${ficha.id}:`, error);
        }
      }
      
      cacheExpiry = Date.now() + CACHE_DURATION;
      console.log(`✅ Cache de entregas carregado: ${entregasCache.size} entradas de timestamp, ${colaboradoresCache.size} colaboradores`);
    } catch (error) {
      console.error('❌ Erro ao carregar entregas para correlação:', error);
    }
  }
  
  /**
   * Correlaciona movimentação com entrega e colaborador baseado no timestamp
   */
  function correlacionarEntrega(movimentacao: any): { entregaId: string | null; colaboradorNome: string | null } {
    if (movimentacao.tipoMovimentacao !== 'SAIDA_ENTREGA') {
      return { entregaId: null, colaboradorNome: null };
    }
    
    const timestamp = new Date(movimentacao.data).getTime();
    const segundoBase = Math.floor(timestamp / 1000) * 1000; // Arredondar para o segundo
    
    console.log(`🔍 Tentando correlacionar movimentação ${movimentacao.id.substring(0, 8)} (${movimentacao.data}) - timestamp base: ${segundoBase}`);
    
    // ✅ MESMA ESTRATÉGIA: Buscar por segundo completo com tolerância
    for (let i = -10; i <= 10; i++) { // ±10 segundos
      const keyTimestamp = segundoBase + (i * 1000);
      const key = keyTimestamp.toString();
      const entregaId = entregasCache.get(key);
      if (entregaId) {
        const colaboradorNome = colaboradoresCache.get(entregaId) || null;
        console.log(`✅ Correlação encontrada: movimentação ${movimentacao.id.substring(0, 8)} → entrega ${entregaId.substring(0, 8)} → colaborador ${colaboradorNome || 'N/A'} (diferença: ${i}s)`);
        return { entregaId, colaboradorNome };
      }
    }
    
    console.log(`❌ Nenhuma correlação encontrada para movimentação ${movimentacao.id.substring(0, 8)} (timestamp base: ${segundoBase})`);
    return { entregaId: null, colaboradorNome: null };
  }

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
    
    console.log('📋 Buscando movimentações:', `/api/relatorios/movimentacoes?${searchParams}`);
    
    try {
      // ✅ CORREÇÃO: Usar apiClient para compatibilidade local/GitHub Pages
      const endpoint = `/relatorios/movimentacoes?${searchParams}`;
      const result = await api.get(endpoint);
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
      
      // Carregar cache de entregas para correlação
      await loadEntregasForCorrelation();
      
      // Aplicar correlação de entregas e colaboradores para movimentações SAIDA_ENTREGA
      const movimentacoesComEntrega = movimentacoes.map((mov: any) => {
        const correlacao = correlacionarEntrega(mov);
        return {
          ...mov,
          entregaId: correlacao.entregaId,
          colaboradorNome: correlacao.colaboradorNome
        };
      });
      
      console.log('📋 Dados adaptados para o store:', {
        data: movimentacoesComEntrega.length,
        total: total,
        page: params.page || 1,
        pageSize: params.limit || 10,
        entregasCorrelacionadas: movimentacoesComEntrega.filter((m: any) => m.entregaId).length,
        colaboradoresCorrelacionados: movimentacoesComEntrega.filter((m: any) => m.colaboradorNome).length
      });
      
      // Adaptar estrutura do backend para o formato esperado pelo store
      return {
        data: movimentacoesComEntrega,
        total: total,
        page: params.page || 1,
        pageSize: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10))
      };
    } catch (error) {
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
        estoqueData.data.items.forEach((item: any) => {
            if (item.almoxarifado) {
              almoxarifadosUnicos.set(item.almoxarifado.id, {
                id: item.almoxarifado.id,
                nome: item.almoxarifado.nome
              });
            }
          });
          almoxarifados = Array.from(almoxarifadosUnicos.values());
          console.log('✅ Almoxarifados carregados:', almoxarifados.length);
      } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
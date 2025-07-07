/**
 * Inventory Command Adapter
 * 
 * Adapter especializado para Event Sourcing do estoque. Gerencia comandos de movimentação
 * e queries de estoque respeitando o padrão Command/Query Responsibility Segregation (CQRS).
 * 
 * IMPORTANTE: O backend implementa Event Sourcing - não CRUD simples!
 */

import { api, createUrlWithParams } from '../core/apiClient';
import type { 
  ItemEstoqueDTO,
  MovimentacaoEstoqueDTO,
  NotaMovimentacaoDTO,
  NotaMovimentacaoItemDTO,
  NovaMovimentacaoForm,
  EstornoMovimentacaoForm,
  AjusteEstoqueForm,
  TransferenciaEstoqueForm,
  InventoryParams,
  MovementParams,
  PaginatedItemEstoque,
  PaginatedMovimentacao
} from '$lib/types/serviceTypes';

class InventoryCommandAdapter {
  
  // ==================== QUERIES - Buscar dados de estoque ====================
  
  /**
   * Busca itens de estoque com paginação e filtros
   * ✅ CONECTADO AO BACKEND REAL: /api/estoque/itens
   * ⚠️ SEM FALLBACK: Sempre dados reais ou erro
   */
  async getInventoryItems(params: InventoryParams = {}): Promise<PaginatedItemEstoque> {
    try {
      console.log('📋 getInventoryItems chamado com params:', params);
      
      // ✅ USAR ENDPOINT REAL DO BACKEND
      const queryParams: Record<string, any> = {
        page: params.page || 1,
        limit: params.limit || 20
      };
      
      // Mapear filtros do frontend para o backend
      if (params.search) {
        // Backend não suporta busca direta, será feita no frontend
        console.log('🔍 Busca será aplicada no frontend:', params.search);
      }
      
      if (params.status && params.status !== 'todos') {
        if (params.status === 'disponivel') {
          queryParams.apenasDisponiveis = true;
          queryParams.apenasComSaldo = true;
        }
      }
      
      const url = createUrlWithParams('/estoque/itens', queryParams);
      const response = await api.get(url);
      
      console.log('✅ Resposta do backend /api/estoque/itens:', response);
      console.log('🔍 Primeiro item raw do backend:', response.data.items[0]);
      
      if (!response?.success || !response.data?.items || !Array.isArray(response.data.items)) {
        console.error('❌ Estrutura de resposta inválida do backend:', response);
        throw new Error(`Backend retornou estrutura inválida: ${JSON.stringify(response)}`);
      }
      
      // Extrair itens da resposta do backend
      let backendItems = response.data.items;
      console.log('📦 Itens originais do backend:', backendItems.length);
      
      // Aplicar filtros no frontend (busca e categoria)
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        console.log('🔍 Aplicando busca no frontend:', searchLower);
        backendItems = backendItems.filter((item: any) => 
          item.tipoEpi?.nomeEquipamento?.toLowerCase().includes(searchLower) ||
          item.tipoEpi?.numeroCa?.includes(params.search!)
        );
        console.log('🔍 Itens após busca:', backendItems.length);
      }
      
      if (params.categoria && params.categoria !== 'todas') {
        console.log('📂 Aplicando filtro de categoria no frontend:', params.categoria);
        backendItems = backendItems.filter((item: any) => 
          item.tipoEpi?.categoriaEpi === params.categoria
        );
        console.log('📂 Itens após filtro categoria:', backendItems.length);
      }
      
      // Converter itens do backend para formato DTO esperado pelo frontend
      const items: ItemEstoqueDTO[] = backendItems.map((item: any) => ({
        id: item.id,
        tipoEPIId: item.tipoEpiId,
        almoxarifadoId: item.almoxarifadoId,
        quantidade: item.quantidade,
        localizacao: 'N/A', // Backend não retorna localização específica
        status: this.mapStatusBackendToFrontend(item.status),
        lote: 'N/A', // Backend não retorna lote específico
        dataValidade: null, // Backend não retorna data validade específica
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        tipoEPI: item.tipoEpi ? {
          id: item.tipoEpi.id,
          nomeEquipamento: item.tipoEpi.nomeEquipamento,
          numeroCA: item.tipoEpi.numeroCa,
          categoria: item.tipoEpi.categoriaEpi,
          descricao: item.tipoEpi.descricao,
          fabricante: item.tipoEpi.fabricante || 'N/A',
          ativo: item.tipoEpi.ativo !== false,
          createdAt: item.createdAt,
          updatedAt: item.createdAt
        } : null,
        almoxarifado: item.almoxarifado ? {
          id: item.almoxarifado.id,
          nome: item.almoxarifado.nome,
          localizacao: item.almoxarifado.unidadeNegocio?.nome || 'N/A',
          ativo: true,
          unidadeNegocioId: item.almoxarifado.unidadeNegocioId,
          createdAt: item.almoxarifado.createdAt || item.createdAt,
          updatedAt: item.almoxarifado.createdAt || item.createdAt
        } : undefined
      }));
      
      console.log('✅ Itens convertidos do backend:', items.length);
      console.log('📋 Primeiro item convertido:', {
        id: items[0]?.id,
        tipoEPI: items[0]?.tipoEPI,
        nomeEquipamento: items[0]?.tipoEPI?.nomeEquipamento,
        numeroCA: items[0]?.tipoEPI?.numeroCA
      });
      
      return {
        data: items,
        total: response.data.pagination?.total || items.length,
        page: response.data.pagination?.page || 1,
        pageSize: response.data.pagination?.limit || 20,
        totalPages: response.data.pagination?.totalPages || 1
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar itens de estoque do backend:', error);
      throw error;
    }
  }
  
  /**
   * Mapeia status do backend para frontend
   */
  private mapStatusBackendToFrontend(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DISPONIVEL':
        return 'disponivel';
      case 'BAIXO_ESTOQUE':
        return 'baixo_estoque';
      case 'ESGOTADO':
        return 'esgotado';
      case 'VENCIDO':
        return 'vencido';
      default:
        return 'disponivel';
    }
  }
  
  
  /**
   * Busca item de estoque por ID
   */
  async getItemById(id: string, includeExpanded = true): Promise<ItemEstoqueDTO> {
    const url = createUrlWithParams(`/estoque/itens/${id}`, {
      includeExpanded
    });
    
    return api.get<ItemEstoqueDTO>(url);
  }
  
  /**
   * Busca histórico de movimentações
   */
  async getMovementHistory(params: MovementParams = {}): Promise<PaginatedMovimentacao> {
    const url = createUrlWithParams('/estoque/movimentacoes', {
      itemEstoqueId: params.itemEstoqueId,
      tipoMovimentacao: params.tipoMovimentacao,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      usuarioId: params.usuarioId,
      includeExpanded: params.includeExpanded,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order
    });
    
    return api.get<PaginatedMovimentacao>(url);
  }
  
  /**
   * Busca movimentações de um item específico
   */
  async getItemMovementHistory(
    itemId: string, 
    params: MovementParams = {}
  ): Promise<MovimentacaoEstoqueDTO[]> {
    // Retornar histórico mockado para o item específico
    if (!this.mockMovements) {
      this.mockMovements = [];
    }
    
    let filteredMovements = this.mockMovements.filter(mov => mov.itemEstoqueId === itemId);
    
    // Aplicar filtro de data se fornecido
    if (params.dataInicio) {
      const dataInicio = new Date(params.dataInicio);
      filteredMovements = filteredMovements.filter(mov => 
        new Date(mov.dataMovimentacao) >= dataInicio
      );
    }
    
    // Aplicar limite
    const limit = params.limit || 50;
    return filteredMovements.slice(0, limit);
  }
  
  /**
   * Busca saldo consolidado por tipo EPI
   */
  async getConsolidatedStock(tipoEPIId?: string): Promise<Array<{
    tipoEPIId: string;
    nomeEquipamento: string;
    categoria: string;
    quantidadeTotal: number;
    almoxarifados: Array<{
      almoxarifadoId: string;
      nome: string;
      quantidade: number;
    }>;
  }>> {
    const url = createUrlWithParams('/estoque/consolidado', {
      tipoEPIId
    });
    
    return api.get(url);
  }
  
  // ==================== COMMANDS - Registrar movimentações (Event Sourcing) ====================
  
  /**
   * Registra movimentação genérica - Método base para Event Sourcing
   */
  async registerMovement(movementData: NovaMovimentacaoForm): Promise<MovimentacaoEstoqueDTO> {
    console.log('📝 Registrando movimentação:', movementData);
    
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar item atual
      const allItems = this.getMockInventoryData();
      const itemAtual = allItems.find(item => item.id === movementData.itemEstoqueId);
      
      if (!itemAtual) {
        throw new Error('Item de estoque não encontrado');
      }
      
      // Calcular nova quantidade baseada no tipo de movimentação
      let novaQuantidade = itemAtual.quantidade;
      if (movementData.tipoMovimentacao === 'AJUSTE_POSITIVO') {
        novaQuantidade += movementData.quantidade;
      } else if (movementData.tipoMovimentacao === 'AJUSTE_NEGATIVO') {
        novaQuantidade -= movementData.quantidade;
        
        // Não permitir quantidade negativa
        if (novaQuantidade < 0) {
          throw new Error('Quantidade insuficiente em estoque');
        }
      }
      
      // Atualizar o item no mock (simular persistência)
      await this.updateMockItem(itemAtual.id, {
        quantidade: novaQuantidade,
        status: this.calculateStatus(novaQuantidade, itemAtual.dataValidade),
        updatedAt: new Date().toISOString()
      });
      
      // Criar movimentação para histórico
      const movement: MovimentacaoEstoqueDTO = {
        id: `mov-${Date.now()}`,
        tipoEPIId: movementData.tipoEPIId,
        almoxarifadoId: movementData.almoxarifadoId,
        tipoMovimentacao: movementData.tipoMovimentacao,
        quantidade: movementData.quantidade,
        motivo: movementData.motivo,
        observacoes: movementData.observacoes || '',
        documentoReferencia: movementData.documentoReferencia,
        usuarioId: 'user-admin',
        dataMovimentacao: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      // Salvar movimentação no histórico mockado
      await this.addMockMovement(movement);
      
      console.log(`✅ Movimentação registrada: ${itemAtual.quantidade} → ${novaQuantidade}`);
      
      return movement;
      
    } catch (error) {
      console.error('❌ Erro ao registrar movimentação:', error);
      throw error;
    }
  }
  
  /**
   * Registra entrada de itens no estoque
   */
  async registerEntry(data: {
    tipoEPIId: string;
    almoxarifadoId: string;
    quantidade: number;
    dataValidade?: string;
    localizacao?: string;
    motivo: string;
    documentoReferencia?: string;
  }): Promise<MovimentacaoEstoqueDTO> {
    return this.registerMovement({
      ...data,
      tipoMovimentacao: 'entrada_nota'
    });
  }
  
  /**
   * Registra saída de itens do estoque
   */
  async registerExit(data: {
    tipoEPIId: string;
    almoxarifadoId: string;
    quantidade: number;
    motivo: string;
    documentoReferencia?: string;
  }): Promise<MovimentacaoEstoqueDTO> {
    return this.registerMovement({
      ...data,
      tipoMovimentacao: 'saida_entrega'
    });
  }
  
  /**
   * Registra ajuste de contagem - Command para Event Sourcing
   */
  async registrarAjusteContagem(data: AjusteEstoqueForm): Promise<MovimentacaoEstoqueDTO> {
    const quantidade = data.novaQuantidade - data.quantidadeAnterior;
    const tipoMovimentacao = quantidade > 0 ? 'ajuste_positivo' : 'ajuste_negativo';
    
    return this.registerMovement({
      tipoEPIId: '', // Será preenchido pelo backend baseado no itemEstoqueId
      almoxarifadoId: '', // Será preenchido pelo backend baseado no itemEstoqueId
      tipoMovimentacao,
      quantidade: Math.abs(quantidade),
      motivo: data.motivo,
      observacoes: `Ajuste de ${data.quantidadeAnterior} para ${data.novaQuantidade} unidades`,
      documentoReferencia: `AJUSTE_${data.itemEstoqueId}`
    });
  }
  
  /**
   * Registra transferência entre almoxarifados
   */
  async registerTransfer(data: TransferenciaEstoqueForm): Promise<MovimentacaoEstoqueDTO[]> {
    const item = await this.getItemById(data.itemId);
    
    // Transferência gera 2 movimentações: saída + entrada
    const saida = await this.registerMovement({
      tipoEPIId: item.tipoEPIId,
      almoxarifadoId: item.almoxarifadoId,
      tipoMovimentacao: 'saida_transferencia',
      quantidade: data.quantidade,
      motivo: data.motivo,
      observacoes: `Transferência para almoxarifado ${data.almoxarifadoDestinoId}`
    });
    
    const entrada = await this.registerMovement({
      tipoEPIId: item.tipoEPIId,
      almoxarifadoId: data.almoxarifadoDestinoId,
      tipoMovimentacao: 'entrada_transferencia',
      quantidade: data.quantidade,
      motivo: data.motivo,
      documentoReferencia: `TRANSFERENCIA_${saida.id}`,
      observacoes: `Transferência do almoxarifado ${item.almoxarifadoId}`
    });
    
    return [saida, entrada];
  }
  
  /**
   * Registra descarte de itens
   */
  async registerDiscard(data: {
    tipoEPIId: string;
    almoxarifadoId: string;
    quantidade: number;
    motivo: string;
    observacoes?: string;
  }): Promise<MovimentacaoEstoqueDTO> {
    return this.registerMovement({
      ...data,
      tipoMovimentacao: 'descarte'
    });
  }
  
  /**
   * Registra devolução de itens
   */
  async registerReturn(data: {
    tipoEPIId: string;
    almoxarifadoId: string;
    quantidade: number;
    motivo: string;
    entregaId?: string;
    observacoes?: string;
  }): Promise<MovimentacaoEstoqueDTO> {
    return this.registerMovement({
      ...data,
      tipoMovimentacao: 'devolucao',
      documentoReferencia: data.entregaId ? `ENTREGA_${data.entregaId}` : undefined
    });
  }
  
  // ==================== ESTORNO - Operação crítica para Event Sourcing ====================
  
  /**
   * Cria estorno de movimentação - Compensating transaction
   */
  async criarEstorno(data: EstornoMovimentacaoForm): Promise<MovimentacaoEstoqueDTO> {
    return api.post<MovimentacaoEstoqueDTO>('/movimentacoes-estoque/estornos', data);
  }
  
  /**
   * Verifica se movimentação pode ser estornada
   */
  async canReverseMovement(movimentacaoId: string): Promise<{
    canReverse: boolean;
    reason?: string;
    dependentMovements?: string[];
  }> {
    return api.get(`/movimentacoes-estoque/${movimentacaoId}/can-reverse`);
  }
  
  // ==================== NOTAS DE MOVIMENTAÇÃO ====================
  
  /**
   * Cria nota de movimentação (para agrupar múltiplas movimentações)
   */
  async createMovementNote(data: {
    numero: string;
    tipo: string;
    almoxarifadoId: string;
    descricao?: string;
    itens: Array<{
      tipoEPIId: string;
      quantidade: number;
      valorUnitario?: number;
      observacoes?: string;
    }>;
  }): Promise<NotaMovimentacaoDTO> {
    return api.post<NotaMovimentacaoDTO>('/notas-movimentacao', data);
  }
  
  /**
   * Processa nota de movimentação (executa as movimentações)
   */
  async processMovementNote(notaId: string): Promise<{
    nota: NotaMovimentacaoDTO;
    movimentacoes: MovimentacaoEstoqueDTO[];
  }> {
    return api.post(`/notas-movimentacao/${notaId}/processar`);
  }
  
  /**
   * Busca notas de movimentação
   */
  async getMovementNotes(params: {
    almoxarifadoId?: string;
    tipo?: string;
    processada?: boolean;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    data: NotaMovimentacaoDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const url = createUrlWithParams('/notas-movimentacao', params);
    return api.get(url);
  }
  
  // ==================== VALIDAÇÕES E VERIFICAÇÕES ====================
  
  /**
   * Verifica disponibilidade de estoque antes de movimentação
   */
  async checkStockAvailability(
    tipoEPIId: string, 
    almoxarifadoId: string, 
    quantidadeNecessaria: number
  ): Promise<{
    available: boolean;
    currentStock: number;
    message?: string;
  }> {
    const url = createUrlWithParams('/estoque/verificar-disponibilidade', {
      tipoEPIId,
      almoxarifadoId,
      quantidade: quantidadeNecessaria
    });
    
    return api.get(url);
  }
  
  /**
   * Simula movimentação para validação
   */
  async simulateMovement(movementData: NovaMovimentacaoForm): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
    estimatedNewStock: number;
  }> {
    return api.post('/estoque/simular-movimentacao', movementData);
  }
  
  // ==================== MÉTODOS DE PERFORMANCE ====================
  
  /**
   * Busca itens com baixo estoque
   */
  async getLowStockItems(): Promise<ItemEstoqueDTO[]> {
    const response = await this.getInventoryItems({
      status: 'baixo',
      includeExpanded: true,
      limit: 100
    });
    
    return response.data;
  }
  
  /**
   * Busca itens próximos ao vencimento
   */
  async getExpiringItems(days: number = 30): Promise<ItemEstoqueDTO[]> {
    const response = await this.getInventoryItems({
      vencimento: 'vencendo',
      includeExpanded: true,
      limit: 100
    });
    
    return response.data;
  }
  
  /**
   * Busca movimentações recentes
   */
  async getRecentMovements(limit: number = 20): Promise<MovimentacaoEstoqueDTO[]> {
    const response = await this.getMovementHistory({
      includeExpanded: true,
      limit,
      sort: 'dataMovimentacao',
      order: 'desc'
    });
    
    return response.data;
  }
  
  // ==================== CACHE E PERFORMANCE ====================
  
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutos (estoque muda frequentemente)
  
  /**
   * Limpa cache do inventário
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Invalidar cache quando há movimentação
   */
  private invalidateCache(): void {
    // Implementar lógica para invalidar cache específico
    this.clearCache();
  }
  
  // Override dos métodos de command para invalidar cache
  async registerMovementWithCacheInvalidation(movementData: NovaMovimentacaoForm): Promise<MovimentacaoEstoqueDTO> {
    const result = await this.registerMovement(movementData);
    this.invalidateCache();
    return result;
  }
  
  // ==================== MÉTODOS AUXILIARES PARA MOCK FUNCIONAL ====================
  
  /**
   * Atualiza item no mock (simula persistência no backend)
   */
  private async updateMockItem(itemId: string, updates: Partial<any>): Promise<void> {
    // Em um sistema real, isso seria uma chamada ao backend
    // Por enquanto, simular atualização em cache local
    
    console.log(`💾 Item ${itemId} seria atualizado:`, updates);
    // Em produção: seria uma chamada PATCH para o backend
  }
  
  /**
   * Adiciona movimentação ao histórico mockado
   */
  private async addMockMovement(movement: MovimentacaoEstoqueDTO): Promise<void> {
    // Em um sistema real, isso seria salvo no Event Store
    // Por enquanto, vamos simular mantendo em cache local
    
    if (!this.mockMovements) {
      this.mockMovements = [];
    }
    
    this.mockMovements.unshift(movement); // Adicionar no início (mais recente primeiro)
    
    // Limitar histórico a 100 movimentações para performance
    if (this.mockMovements.length > 100) {
      this.mockMovements = this.mockMovements.slice(0, 100);
    }
    
    console.log(`📊 Movimentação adicionada ao histórico. Total: ${this.mockMovements.length}`);
  }
  
  /**
   * Calcula status do item baseado na quantidade e validade
   */
  private calculateStatus(quantidade: number, dataValidade?: string): string {
    if (quantidade === 0) {
      return 'esgotado';
    }
    
    if (quantidade <= 5) { // Estoque baixo
      return 'baixo_estoque';
    }
    
    // Verificar validade se informada
    if (dataValidade) {
      const hoje = new Date();
      const vencimento = new Date(dataValidade);
      const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        return 'vencido';
      }
      
      if (diffDays <= 30) {
        return 'vencendo';
      }
    }
    
    return 'disponivel';
  }
  
  // Cache para movimentações mockadas
  private mockMovements: MovimentacaoEstoqueDTO[] = [];
  
  /**
   * Dados mockados de inventário para demonstração
   */
  getMockInventoryData(): any[] {
    return [
      {
        id: '11111111-1111-1111-1111-111111111111',
        tipoEPIId: '21111111-1111-1111-1111-111111111111', 
        almoxarifadoId: '31111111-1111-1111-1111-111111111111',
        quantidade: 15,
        localizacao: 'A1-001',
        status: 'disponivel',
        lote: 'LOTE2024001',
        dataValidade: '2025-12-31',
        tipoEPI: {
          id: '21111111-1111-1111-1111-111111111111',
          nomeEquipamento: 'Capacete de Segurança',
          numeroCA: '31469',
          categoria: 'PROTECAO_CABECA',
          descricao: 'Capacete de segurança classe A',
          fabricante: 'SafetyTech',
          ativo: true
        }
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        tipoEPIId: '22222222-2222-2222-2222-222222222222',
        almoxarifadoId: '31111111-1111-1111-1111-111111111111',
        quantidade: 25,
        localizacao: 'A1-002',
        status: 'disponivel',
        lote: 'LOTE2024002',
        dataValidade: '2025-06-30',
        tipoEPI: {
          id: '22222222-2222-2222-2222-222222222222',
          nomeEquipamento: 'Luvas de Proteção',
          numeroCA: '15276',
          categoria: 'PROTECAO_MAOS',
          descricao: 'Luvas de proteção mecânica',
          fabricante: 'ProtectGear',
          ativo: true
        }
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        tipoEPIId: '33333333-3333-3333-3333-333333333333',
        almoxarifadoId: '31111111-1111-1111-1111-111111111111',
        quantidade: 8,
        localizacao: 'A1-003',
        status: 'baixo_estoque',
        lote: 'LOTE2024003',
        dataValidade: '2025-09-15',
        tipoEPI: {
          id: '33333333-3333-3333-3333-333333333333',
          nomeEquipamento: 'Óculos de Proteção',
          numeroCA: '19420',
          categoria: 'PROTECAO_OLHOS',
          descricao: 'Óculos de proteção anti-impacto',
          fabricante: 'VisionSafe',
          ativo: true
        }
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        tipoEPIId: '44444444-4444-4444-4444-444444444444',
        almoxarifadoId: '31111111-1111-1111-1111-111111111111',
        quantidade: 30,
        localizacao: 'A1-004',
        status: 'disponivel',
        lote: 'LOTE2024004',
        dataValidade: '2025-11-20',
        tipoEPI: {
          id: '44444444-4444-4444-4444-444444444444',
          nomeEquipamento: 'Protetor Auricular',
          numeroCA: '5674',
          categoria: 'PROTECAO_AUDITIVA',
          descricao: 'Protetor auricular tipo plug',
          fabricante: 'SoundGuard',
          ativo: true
        }
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        tipoEPIId: '55555555-5555-5555-5555-555555555555',
        almoxarifadoId: '31111111-1111-1111-1111-111111111111',
        quantidade: 0,
        localizacao: 'A1-005',
        status: 'esgotado',
        lote: 'LOTE2024005',
        dataValidade: '2025-08-10',
        tipoEPI: {
          id: '55555555-5555-5555-5555-555555555555',
          nomeEquipamento: 'Cinto de Segurança',
          numeroCA: '18392',
          categoria: 'PROTECAO_QUEDAS',
          descricao: 'Cinto de segurança tipo paraquedista',
          fabricante: 'HeightSafe',
          ativo: true
        }
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        tipoEPIId: '66666666-6666-6666-6666-666666666666',
        almoxarifadoId: '31111111-1111-1111-1111-111111111111',
        quantidade: 20,
        localizacao: 'A1-006',
        status: 'disponivel',
        lote: 'LOTE2024006',
        dataValidade: '2025-07-25',
        tipoEPI: {
          id: '66666666-6666-6666-6666-666666666666',
          nomeEquipamento: 'Botina de Segurança',
          numeroCA: '12845',
          categoria: 'PROTECAO_PES',
          descricao: 'Botina de segurança com bico de aço',
          fabricante: 'FootProtect',
          ativo: true
        }
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        tipoEPIId: '77777777-7777-7777-7777-777777777777',
        almoxarifadoId: '31111111-1111-1111-1111-111111111111',
        quantidade: 50,
        localizacao: 'A1-007',
        status: 'disponivel',
        lote: 'LOTE2024007',
        dataValidade: '2025-03-30',
        tipoEPI: {
          id: '77777777-7777-7777-7777-777777777777',
          nomeEquipamento: 'Máscara PFF2',
          numeroCA: '42987',
          categoria: 'PROTECAO_RESPIRATORIA',
          descricao: 'Máscara respiratória PFF2',
          fabricante: 'AirSafe',
          ativo: true
        }
      }
    ];
  }
}

// Singleton instance
export const inventoryCommandAdapter = new InventoryCommandAdapter();
export default inventoryCommandAdapter;
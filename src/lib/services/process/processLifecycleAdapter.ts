/**
 * Process Lifecycle Adapter
 *
 * Gerencia workflows complexos como assinaturas de entregas e devoluções.
 * Implementa state machines para PENDENTE_ASSINATURA → ASSINADA → DEVOLVIDO.
 */

import { api, createUrlWithParams } from "../core/apiClient";
import type {
  FichaEPIDTO,
  EntregaDTO,
  EntregaItemDTO,
  NovaEntregaForm,
  AssinaturaEntregaForm,
  DevolucaoForm,
  EntityParams,
} from "$lib/types/serviceTypes";
import type { PaginatedResponse } from "$lib/stores/paginatedStore";

// Types específicos para workflows
export interface WorkflowState {
  currentState: string;
  availableTransitions: string[];
  history: Array<{
    from: string;
    to: string;
    timestamp: string;
    userId?: string;
    reason?: string;
  }>;
}

export interface ProcessMetrics {
  totalProcesses: number;
  byStatus: Record<string, number>;
  averageProcessingTime: number;
  pendingCount: number;
}

class ProcessLifecycleAdapter {
  // ==================== FICHAS EPI ====================

  /**
   * Busca fichas EPI com paginação e filtros
   */
  async getFichasEPI(
    params: EntityParams = {},
  ): Promise<PaginatedResponse<FichaEPIDTO>> {
    const url = createUrlWithParams("/fichas-epi", {
      colaboradorId: params.filters?.colaboradorId,
      status: params.filters?.status,
      ativo: params.ativo,
      includeRelations: params.includeRelations,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order,
      search: params.search,
      ...(params.filters || {}),
    });

    return api.get<PaginatedResponse<FichaEPIDTO>>(url);
  }

  /**
   * Busca ficha EPI por ID com dados expandidos
   */
  async getFichaEPIById(
    id: string,
    includeRelations = true,
  ): Promise<FichaEPIDTO> {
    const url = createUrlWithParams(`/fichas-epi/${id}`, {
      includeRelations,
    });

    return api.get<FichaEPIDTO>(url);
  }

  /**
   * Cria nova ficha EPI
   */
  async createFichaEPI(data: {
    colaboradorId: string;
    dataValidade?: string;
    observacoes?: string;
  }): Promise<FichaEPIDTO> {
    return api.post<FichaEPIDTO>("/fichas-epi", {
      ...data,
      dataEmissao: new Date().toISOString(),
      status: "ativa",
      ativo: true,
    });
  }

  /**
   * Atualiza ficha EPI
   */
  async updateFichaEPI(
    id: string,
    data: Partial<FichaEPIDTO>,
  ): Promise<FichaEPIDTO> {
    return api.put<FichaEPIDTO>(`/fichas-epi/${id}`, data);
  }

  /**
   * Inativa ficha EPI
   */
  async inactivateFichaEPI(id: string, motivo: string): Promise<FichaEPIDTO> {
    return api.patch<FichaEPIDTO>(`/fichas-epi/${id}/inativar`, { motivo });
  }

  // ==================== ENTREGAS ====================

  /**
   * Busca entregas com paginação e filtros
   */
  async getEntregas(
    params: EntityParams & {
      fichaEPIId?: string;
      status?: string;
      dataInicio?: string;
      dataFim?: string;
    } = {},
  ): Promise<PaginatedResponse<EntregaDTO>> {
    const url = createUrlWithParams("/entregas", {
      fichaEPIId: params.fichaEPIId,
      status: params.status,
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      includeRelations: params.includeRelations,
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      order: params.order,
      search: params.search,
      ...(params.filters || {}),
    });

    return api.get<PaginatedResponse<EntregaDTO>>(url);
  }

  /**
   * Busca entrega por ID
   */
  async getEntregaById(
    id: string,
    includeRelations = true,
  ): Promise<EntregaDTO> {
    const url = createUrlWithParams(`/entregas/${id}`, {
      includeRelations,
    });

    return api.get<EntregaDTO>(url);
  }

  /**
   * Cria nova entrega
   */
  async createEntrega(data: NovaEntregaForm): Promise<EntregaDTO> {
    return api.post<EntregaDTO>("/entregas", {
      ...data,
      dataEntrega: new Date().toISOString(),
      status: "pendente_assinatura",
    });
  }

  /**
   * Atualiza entrega
   */
  async updateEntrega(
    id: string,
    data: Partial<EntregaDTO>,
  ): Promise<EntregaDTO> {
    return api.put<EntregaDTO>(`/entregas/${id}`, data);
  }

  // ==================== WORKFLOW DE ASSINATURA ====================

  /**
   * Registra assinatura digital da entrega
   * Transição: PENDENTE_ASSINATURA → ASSINADA
   */
  async registrarAssinatura(
    entregaId: string,
    assinaturaData: {
      assinatura: string;
    },
  ): Promise<EntregaDTO> {
    const result = await api.post<EntregaDTO>(
      `/entregas/${entregaId}/assinatura`,
      {
        ...assinaturaData,
        dataAssinatura: new Date().toISOString(),
      },
    );

    // Log da transição de estado
    console.log(`🖊️ Assinatura registrada para entrega ${entregaId}`);

    return result;
  }

  /**
   * Gera link para assinatura externa
   */
  async gerarLinkAssinatura(
    entregaId: string,
    expirationHours = 24,
  ): Promise<{
    linkAssinatura: string;
    qrCode: string;
    dataExpiracao: string;
  }> {
    return api.post(`/entregas/${entregaId}/gerar-link-assinatura`, {
      expirationHours,
    });
  }

  /**
   * Verifica se assinatura é válida
   */
  async validarAssinatura(
    entregaId: string,
    assinatura: string,
  ): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    return api.post(`/entregas/${entregaId}/validar-assinatura`, {
      assinatura,
    });
  }

  /**
   * Cancela entrega pendente
   * Transição: PENDENTE_ASSINATURA → CANCELADA
   */
  async cancelarEntrega(
    entregaId: string,
    motivo: string,
  ): Promise<EntregaDTO> {
    return api.patch<EntregaDTO>(`/entregas/${entregaId}/cancelar`, {
      motivo,
      dataCancelamento: new Date().toISOString(),
    });
  }

  // ==================== WORKFLOW DE DEVOLUÇÃO ====================

  /**
   * Processa devolução de entrega
   * Transição: ASSINADA → DEVOLVIDO
   */
  async processarDevolucao(
    entregaId: string,
    devolucaoData: {
      motivo: string;
      observacoes?: string;
    },
  ): Promise<EntregaDTO> {
    const result = await api.post<EntregaDTO>(
      `/entregas/${entregaId}/devolucao`,
      {
        ...devolucaoData,
        dataDevolucao: new Date().toISOString(),
      },
    );

    // Log da transição de estado
    console.log(
      `🔄 Devolução processada para entrega ${entregaId}: ${devolucaoData.motivo}`,
    );

    return result;
  }

  /**
   * Devolução parcial (apenas alguns itens)
   */
  async processarDevolucaoParcial(
    entregaId: string,
    data: {
      itens: Array<{
        itemId: string;
        quantidade: number;
        motivo: string;
      }>;
      observacoes?: string;
    },
  ): Promise<EntregaDTO> {
    return api.post<EntregaDTO>(`/entregas/${entregaId}/devolucao-parcial`, {
      ...data,
      dataDevolucao: new Date().toISOString(),
    });
  }

  /**
   * Marca item como perdido/danificado
   */
  async marcarItemPerdido(
    entregaId: string,
    itemId: string,
    data: {
      motivo: string;
      observacoes?: string;
    },
  ): Promise<EntregaDTO> {
    return api.patch<EntregaDTO>(
      `/entregas/${entregaId}/itens/${itemId}/perdido`,
      {
        ...data,
        dataOcorrencia: new Date().toISOString(),
      },
    );
  }

  // ==================== STATE MACHINE E WORKFLOW ====================

  /**
   * Busca estado atual do workflow
   */
  async getWorkflowState(entregaId: string): Promise<WorkflowState> {
    return api.get<WorkflowState>(`/entregas/${entregaId}/workflow-state`);
  }

  /**
   * Busca transições disponíveis para uma entrega
   */
  async getAvailableTransitions(entregaId: string): Promise<string[]> {
    const state = await this.getWorkflowState(entregaId);
    return state.availableTransitions;
  }

  /**
   * Executa transição de estado personalizada
   */
  async executeTransition(
    entregaId: string,
    transition: string,
    data?: any,
  ): Promise<EntregaDTO> {
    return api.post<EntregaDTO>(
      `/entregas/${entregaId}/transition/${transition}`,
      data,
    );
  }

  /**
   * Busca histórico completo de transições
   */
  async getWorkflowHistory(entregaId: string): Promise<
    Array<{
      from: string;
      to: string;
      timestamp: string;
      userId: string;
      userName: string;
      reason?: string;
      metadata?: any;
    }>
  > {
    return api.get(`/entregas/${entregaId}/workflow-history`);
  }

  // ==================== DASHBOARDS E MÉTRICAS ====================

  /**
   * Busca métricas de processo
   */
  async getProcessMetrics(
    params: {
      dataInicio?: string;
      dataFim?: string;
      colaboradorId?: string;
      fichaEPIId?: string;
    } = {},
  ): Promise<ProcessMetrics> {
    const url = createUrlWithParams("/entregas/metrics", params);
    return api.get<ProcessMetrics>(url);
  }

  /**
   * Busca entregas pendentes de assinatura
   */
  async getEntregasPendentesAssinatura(): Promise<EntregaDTO[]> {
    const response = await this.getEntregas({
      status: "pendente_assinatura",
      includeRelations: true,
      limit: 100,
    });

    return response.data;
  }

  /**
   * Busca entregas vencidas (sem assinatura há mais de X dias)
   */
  async getEntregasVencidas(days: number = 7): Promise<EntregaDTO[]> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - days);

    const response = await this.getEntregas({
      status: "pendente_assinatura",
      dataFim: dataLimite.toISOString(),
      includeRelations: true,
      limit: 100,
    });

    return response.data;
  }

  /**
   * Busca devoluções pendentes
   */
  async getDevolucoesPendentes(): Promise<
    Array<EntregaDTO & { diasSemDevolucao: number }>
  > {
    const entregas = await this.getEntregasPendentesDevolucao();

    return entregas.map((entrega) => ({
      ...entrega,
      diasSemDevolucao: this.calcularDiasSemDevolucao(entrega.dataEntrega),
    }));
  }

  private async getEntregasPendentesDevolucao(): Promise<EntregaDTO[]> {
    // Implementação específica para buscar entregas que deveriam ter sido devolvidas
    const response = await this.getEntregas({
      filters: { devolucaoPendente: true },
      includeRelations: true,
      limit: 100,
    });

    return response.data;
  }

  private calcularDiasSemDevolucao(dataEntrega: string): number {
    const hoje = new Date();
    const entrega = new Date(dataEntrega);
    const diffTime = Math.abs(hoje.getTime() - entrega.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ==================== NOTIFICAÇÕES E ALERTAS ====================

  /**
   * Envia lembrete de assinatura
   */
  async enviarLembreteAssinatura(entregaId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return api.post(`/entregas/${entregaId}/enviar-lembrete`);
  }

  /**
   * Agenda notificação de devolução
   */
  async agendarNotificacaoDevolucao(
    entregaId: string,
    diasAntecedencia: number = 7,
  ): Promise<{
    success: boolean;
    dataNotificacao: string;
  }> {
    return api.post(`/entregas/${entregaId}/agendar-notificacao-devolucao`, {
      diasAntecedencia,
    });
  }

  // ==================== RELATÓRIOS DE PROCESSO ====================

  /**
   * Gera relatório de entregas por período
   */
  async gerarRelatorioEntregas(params: {
    dataInicio: string;
    dataFim: string;
    colaboradorId?: string;
    status?: string;
  }): Promise<{
    totalEntregas: number;
    entregasAssinadas: number;
    entregasPendentes: number;
    entregasDevolvidas: number;
    tempoMedioAssinatura: number;
    entregas: EntregaDTO[];
  }> {
    const url = createUrlWithParams("/entregas/relatorio", params);
    return api.get(url);
  }

  /**
   * Gera relatório de devoluções
   */
  async gerarRelatorioDevolucoes(params: {
    dataInicio: string;
    dataFim: string;
    motivo?: string;
  }): Promise<{
    totalDevolucoes: number;
    motivosPrincipais: Array<{ motivo: string; quantidade: number }>;
    devolucoes: Array<EntregaDTO & { motivoDevolucao: string }>;
  }> {
    const url = createUrlWithParams("/entregas/relatorio-devolucoes", params);
    return api.get(url);
  }
}

// Singleton instance
export const processLifecycleAdapter = new ProcessLifecycleAdapter();
export default processLifecycleAdapter;

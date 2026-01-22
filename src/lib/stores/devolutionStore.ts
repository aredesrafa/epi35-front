/**
 * Devolution Store - Gerenciamento de Estado para Devoluções
 *
 * Store especializado para controle de devoluções de EPIs com:
 * - Cache de validações de devolução
 * - Tracking de status de processos
 * - Notificações automáticas
 * - Integração com outros stores (fichas, entregas)
 */

import { writable, derived, get } from "svelte/store";
import type {
  MovimentacaoEstoque,
  Entrega,
  FichaEPI,
} from "$lib/services/api/types";
import {
  devolutionAdapter,
  type DevolutionRequest,
  type DevolutionValidation,
  StatusDevolucao,
  CondicaoEquipamento,
} from "$lib/services/devolution/devolutionAdapter";
import { createPaginatedStore } from "./paginatedStore";

// Types para o store
interface DevolutionProcess {
  id: string;
  entregaId: string;
  fichaId: string;
  colaboradorId: string;
  status: StatusDevolucao;
  validation?: DevolutionValidation;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion?: Date;
}

interface DevolutionStats {
  total: number;
  solicitadas: number;
  emAnalise: number;
  aprovadas: number;
  finalizadas: number;
  rejeitadas: number;
  tempoMedioProcessamento: number; // em horas
}

// Store base para processos de devolução ativos
export const devolutionProcesses = writable<DevolutionProcess[]>([]);

// Store para estatísticas
export const devolutionStats = writable<DevolutionStats>({
  total: 0,
  solicitadas: 0,
  emAnalise: 0,
  aprovadas: 0,
  finalizadas: 0,
  rejeitadas: 0,
  tempoMedioProcessamento: 0,
});

// Store para cache de validações
export const validationCache = writable<Map<string, DevolutionValidation>>(
  new Map(),
);

// Store para equipamentos com colaboradores (COM_COLABORADOR)
export const equipmentWithCollaborators = createPaginatedStore<Entrega>(
  async (params) => {
    console.log("📋 Carregando equipamentos com colaboradores...", params);

    // Simular API call - buscar entregas com status COM_COLABORADOR
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockData: Entrega[] = [
      {
        id: "entrega-001",
        fichaId: "ficha-001",
        colaboradorId: "colab-001",
        dataEntrega: "2025-01-01T10:00:00Z",
        status: "COM_COLABORADOR",
        assinaturaColaborador: true,
        observacoes: "Entrega realizada com sucesso",
      },
      {
        id: "entrega-002",
        fichaId: "ficha-002",
        colaboradorId: "colab-002",
        dataEntrega: "2025-01-03T14:30:00Z",
        status: "COM_COLABORADOR",
        assinaturaColaborador: true,
        observacoes: "EPI de proteção respiratória",
      },
    ];

    return {
      data: mockData,
      total: mockData.length,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages: Math.ceil(mockData.length / (params.pageSize || 10)),
    };
  },
  10,
);

// Derived stores
export const pendingDevolutions = derived(devolutionProcesses, ($processes) =>
  $processes.filter(
    (p) =>
      p.status === StatusDevolucao.SOLICITADA ||
      p.status === StatusDevolucao.EM_ANALISE,
  ),
);

export const completedDevolutions = derived(devolutionProcesses, ($processes) =>
  $processes.filter((p) => p.status === StatusDevolucao.FINALIZADA),
);

export const devolutionsByStatus = derived(
  devolutionProcesses,
  ($processes) => {
    const byStatus = new Map<StatusDevolucao, DevolutionProcess[]>();

    Object.values(StatusDevolucao).forEach((status) => {
      byStatus.set(
        status,
        $processes.filter((p) => p.status === status),
      );
    });

    return byStatus;
  },
);

// Store Actions

/**
 * Valida se uma entrega pode ser devolvida
 */
export async function validateDevolutionRequest(
  entregaId: string,
): Promise<DevolutionValidation> {
  try {
    console.log("🔍 Validando devolução para entrega:", entregaId);

    // Verificar cache primeiro
    const cache = get(validationCache);
    if (cache.has(entregaId)) {
      const cached = cache.get(entregaId)!;
      console.log("💾 Usando validação em cache");
      return cached;
    }

    // Buscar validação via adapter
    const validation = await devolutionAdapter.validateDevolution(entregaId);

    // Salvar em cache por 5 minutos
    validationCache.update((cache) => {
      cache.set(entregaId, validation);
      setTimeout(
        () => {
          validationCache.update((c) => {
            c.delete(entregaId);
            return c;
          });
        },
        5 * 60 * 1000,
      );
      return cache;
    });

    return validation;
  } catch (error: any) {
    console.error("❌ Erro ao validar devolução:", error);
    throw error;
  }
}

/**
 * Solicita devolução de equipamento
 */
export async function requestDevolution(
  request: DevolutionRequest,
): Promise<string> {
  try {
    console.log("📋 Solicitando devolução:", request);

    // Validar antes de solicitar
    const validation = await validateDevolutionRequest(request.entregaId);
    if (!validation.canReturn) {
      throw new Error("Devolução bloqueada por restrições");
    }

    // Processar solicitação
    const processId = await devolutionAdapter.requestDevolution(request);

    // Adicionar processo ao store
    const newProcess: DevolutionProcess = {
      id: processId,
      entregaId: request.entregaId,
      fichaId: request.fichaId,
      colaboradorId: request.colaboradorId,
      status: StatusDevolucao.SOLICITADA,
      validation,
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedCompletion: new Date(
        Date.now() + validation.estimatedProcessingTime * 60 * 60 * 1000,
      ),
    };

    devolutionProcesses.update((processes) => [...processes, newProcess]);

    // Limpar cache de validação
    validationCache.update((cache) => {
      cache.delete(request.entregaId);
      return cache;
    });

    // Atualizar estatísticas
    updateDevolutionStats();

    console.log("✅ Devolução solicitada com sucesso");
    return processId;
  } catch (error: any) {
    console.error("❌ Erro ao solicitar devolução:", error);
    throw error;
  }
}

/**
 * Aprova uma devolução pendente
 */
export async function approveDevolution(
  processId: string,
  approverRole: string,
): Promise<void> {
  try {
    console.log("👍 Aprovando devolução:", processId);

    await devolutionAdapter.approveDevolution(processId, approverRole);

    // Atualizar processo no store
    devolutionProcesses.update((processes) =>
      processes.map((p) =>
        p.id === processId
          ? { ...p, status: StatusDevolucao.APROVADA, updatedAt: new Date() }
          : p,
      ),
    );

    updateDevolutionStats();
    console.log("✅ Devolução aprovada");
  } catch (error: any) {
    console.error("❌ Erro ao aprovar devolução:", error);
    throw error;
  }
}

/**
 * Finaliza processo de devolução
 */
export async function finalizeDevolution(
  processId: string,
  condition: CondicaoEquipamento,
): Promise<void> {
  try {
    console.log("🏁 Finalizando devolução:", processId);

    await devolutionAdapter.finalizeDevolution(processId, condition);

    // Atualizar processo no store
    devolutionProcesses.update((processes) =>
      processes.map((p) =>
        p.id === processId
          ? { ...p, status: StatusDevolucao.FINALIZADA, updatedAt: new Date() }
          : p,
      ),
    );

    updateDevolutionStats();

    // Recarregar equipamentos com colaboradores
    equipmentWithCollaborators.reload();

    console.log("✅ Devolução finalizada");
  } catch (error: any) {
    console.error("❌ Erro ao finalizar devolução:", error);
    throw error;
  }
}

/**
 * Carrega devoluções por status
 */
export async function loadDevolutionsByStatus(
  status: StatusDevolucao,
): Promise<void> {
  try {
    console.log("📋 Carregando devoluções com status:", status);

    const movimentacoes =
      await devolutionAdapter.listDevolutionsByStatus(status);

    // Converter movimentações em processos
    const processes: DevolutionProcess[] = movimentacoes.map((mov) => ({
      id: mov.id!,
      entregaId: mov.metadados?.entregaOriginal || "",
      fichaId: mov.fichaId,
      colaboradorId: mov.colaboradorId,
      status: status,
      createdAt: new Date(mov.dataMovimentacao),
      updatedAt: new Date(mov.dataMovimentacao),
    }));

    // Atualizar store (mesclar com existentes)
    devolutionProcesses.update((current) => {
      const filtered = current.filter((p) => p.status !== status);
      return [...filtered, ...processes];
    });

    console.log(`✅ ${processes.length} devoluções carregadas`);
  } catch (error: any) {
    console.error("❌ Erro ao carregar devoluções:", error);
    throw error;
  }
}

/**
 * Carrega devoluções de um colaborador
 */
export async function loadCollaboratorDevolutions(
  colaboradorId: string,
): Promise<DevolutionProcess[]> {
  try {
    console.log("👤 Carregando devoluções do colaborador:", colaboradorId);

    const movimentacoes =
      await devolutionAdapter.getDevolutionsByCollaborator(colaboradorId);

    return movimentacoes.map((mov) => ({
      id: mov.id!,
      entregaId: mov.metadados?.entregaOriginal || "",
      fichaId: mov.fichaId,
      colaboradorId: mov.colaboradorId,
      status: mov.status as StatusDevolucao,
      createdAt: new Date(mov.dataMovimentacao),
      updatedAt: new Date(mov.dataMovimentacao),
    }));
  } catch (error: any) {
    console.error("❌ Erro ao carregar devoluções do colaborador:", error);
    return [];
  }
}

/**
 * Atualiza estatísticas de devoluções
 */
function updateDevolutionStats(): void {
  const processes = get(devolutionProcesses);

  const stats: DevolutionStats = {
    total: processes.length,
    solicitadas: processes.filter(
      (p) => p.status === StatusDevolucao.SOLICITADA,
    ).length,
    emAnalise: processes.filter((p) => p.status === StatusDevolucao.EM_ANALISE)
      .length,
    aprovadas: processes.filter((p) => p.status === StatusDevolucao.APROVADA)
      .length,
    finalizadas: processes.filter(
      (p) => p.status === StatusDevolucao.FINALIZADA,
    ).length,
    rejeitadas: processes.filter((p) => p.status === StatusDevolucao.REJEITADA)
      .length,
    tempoMedioProcessamento: calculateAverageProcessingTime(processes),
  };

  devolutionStats.set(stats);
}

/**
 * Calcula tempo médio de processamento
 */
function calculateAverageProcessingTime(
  processes: DevolutionProcess[],
): number {
  const completed = processes.filter(
    (p) => p.status === StatusDevolucao.FINALIZADA,
  );

  if (completed.length === 0) return 0;

  const totalTime = completed.reduce((sum, process) => {
    const duration = process.updatedAt.getTime() - process.createdAt.getTime();
    return sum + duration / (1000 * 60 * 60); // converter para horas
  }, 0);

  return Math.round(totalTime / completed.length);
}

/**
 * Inicializa o store carregando dados essenciais
 */
export async function initializeDevolutionStore(): Promise<void> {
  try {
    console.log("🚀 Inicializando devolution store...");

    // Carregar devoluções pendentes
    await Promise.all([
      loadDevolutionsByStatus(StatusDevolucao.SOLICITADA),
      loadDevolutionsByStatus(StatusDevolucao.EM_ANALISE),
      loadDevolutionsByStatus(StatusDevolucao.APROVADA),
    ]);

    // Carregar equipamentos com colaboradores
    await equipmentWithCollaborators.loadPage(1);

    console.log("✅ Devolution store inicializado");
  } catch (error: any) {
    console.error("❌ Erro ao inicializar devolution store:", error);
  }
}

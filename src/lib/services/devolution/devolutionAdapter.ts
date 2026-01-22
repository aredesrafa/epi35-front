/**
 * Devolution Adapter - Gerenciamento Avançado de Devoluções
 *
 * Sistema especializado para controle de devoluções de EPIs com:
 * - Status COM_COLABORADOR/DEVOLVIDO
 * - Limitações por assinatura digital
 * - Workflow de aprovação de devoluções
 * - Tracking de tempo de posse
 * - Validação de condições do equipamento
 */

import type {
  FichaEPI,
  Entrega,
  MovimentacaoEstoque,
  StatusFicha,
  StatusEntrega,
  TipoMovimentacao,
} from "$lib/services/api/types";
import { api } from "$lib/services/core/apiClient";
import { TipoMovimentacao as TipoMovEnum } from "$lib/constants/enums";

// Tipos específicos para devoluções
export interface DevolutionRequest {
  entregaId: string;
  fichaId: string;
  colaboradorId: string;
  motivo: string;
  condicaoEquipamento: CondicaoEquipamento;
  observacoes?: string;
  datasAssinatura?: {
    colaborador: Date;
    responsavel?: Date;
  };
}

export interface DevolutionValidation {
  canReturn: boolean;
  restrictions: DevolutionRestriction[];
  requiredSignatures: RequiredSignature[];
  estimatedProcessingTime: number; // em horas
}

export interface DevolutionRestriction {
  type:
    | "SIGNATURE_PENDING"
    | "TIME_LIMIT"
    | "EQUIPMENT_CONDITION"
    | "APPROVAL_REQUIRED";
  description: string;
  blockingLevel: "WARNING" | "ERROR";
  resolutionSteps?: string[];
}

export interface RequiredSignature {
  role: "COLABORADOR" | "RESPONSAVEL" | "SUPERVISOR";
  description: string;
  required: boolean;
  completed: boolean;
  signedAt?: Date;
  signedBy?: string;
}

export enum CondicaoEquipamento {
  PERFEITA = "PERFEITA",
  BOA = "BOA",
  DANIFICADA = "DANIFICADA",
  PERDIDA = "PERDIDA",
  DESCARTADA = "DESCARTADA",
}

export enum StatusDevolucao {
  SOLICITADA = "SOLICITADA",
  EM_ANALISE = "EM_ANALISE",
  APROVADA = "APROVADA",
  REJEITADA = "REJEITADA",
  FINALIZADA = "FINALIZADA",
}

/**
 * Adapter especializado para operações de devolução
 */
export class DevolutionAdapter {
  /**
   * Valida se uma entrega pode ser devolvida
   */
  async validateDevolution(entregaId: string): Promise<DevolutionValidation> {
    try {
      console.log(
        "🔍 Validando possibilidade de devolução para entrega:",
        entregaId,
      );

      // Buscar dados da entrega
      const entrega = await api.get<Entrega>(`/api/v1/entregas/${entregaId}`);
      if (!entrega) {
        throw new Error("Entrega não encontrada");
      }

      // Buscar ficha relacionada
      const ficha = await api.get<FichaEPI>(
        `/api/v1/fichas/${entrega.fichaId}`,
      );
      if (!ficha) {
        throw new Error("Ficha não encontrada");
      }

      const restrictions: DevolutionRestriction[] = [];
      const requiredSignatures: RequiredSignature[] = [];

      // Validar assinaturas obrigatórias
      if (!entrega.assinaturaColaborador) {
        restrictions.push({
          type: "SIGNATURE_PENDING",
          description:
            "Assinatura do colaborador necessária antes da devolução",
          blockingLevel: "ERROR",
          resolutionSteps: ["Solicitar assinatura digital do colaborador"],
        });
      }

      requiredSignatures.push({
        role: "COLABORADOR",
        description: "Confirmação de devolução pelo colaborador",
        required: true,
        completed: false,
      });

      // Validar tempo mínimo de posse (se aplicável)
      const tempoPosse = this.calculatePossessionTime(entrega.dataEntrega);
      if (tempoPosse < 1) {
        // Menos de 1 dia
        restrictions.push({
          type: "TIME_LIMIT",
          description:
            "Equipamento deve permanecer com colaborador por ao menos 1 dia",
          blockingLevel: "WARNING",
          resolutionSteps: [
            "Aguardar tempo mínimo ou solicitar aprovação especial",
          ],
        });
      }

      // Verificar se precisa de aprovação do responsável
      if (
        ficha.categoria === "PROTECAO_RESPIRATORIA" ||
        ficha.categoria === "PROTECAO_QUEDAS"
      ) {
        requiredSignatures.push({
          role: "RESPONSAVEL",
          description: "Aprovação do responsável para equipamentos críticos",
          required: true,
          completed: false,
        });
      }

      const canReturn =
        restrictions.filter((r) => r.blockingLevel === "ERROR").length === 0;

      return {
        canReturn,
        restrictions,
        requiredSignatures,
        estimatedProcessingTime: this.calculateProcessingTime(
          restrictions,
          requiredSignatures,
        ),
      };
    } catch (error: any) {
      console.error("❌ Erro ao validar devolução:", error);
      throw error;
    }
  }

  /**
   * Solicita devolução de equipamento
   */
  async requestDevolution(request: DevolutionRequest): Promise<string> {
    try {
      console.log("📋 Solicitando devolução:", request);

      // Validar solicitação
      const validation = await this.validateDevolution(request.entregaId);
      if (!validation.canReturn) {
        throw new Error(
          "Devolução não pode ser processada devido a restrições",
        );
      }

      // Criar movimentação de devolução
      const movimentacao: Partial<MovimentacaoEstoque> = {
        tipoMovimentacao: TipoMovEnum.SAIDA_DEVOLUCAO,
        fichaId: request.fichaId,
        colaboradorId: request.colaboradorId,
        quantidade: 1,
        motivo: request.motivo,
        observacoes: request.observacoes,
        status: "SOLICITADA",
        dataMovimentacao: new Date().toISOString(),
        metadados: {
          entregaOriginal: request.entregaId,
          condicaoEquipamento: request.condicaoEquipamento,
          assinaturasRequeridas: validation.requiredSignatures.map(
            (s) => s.role,
          ),
        },
      };

      const resultado = await api.post<MovimentacaoEstoque>(
        "/api/v1/movimentacoes",
        movimentacao,
      );

      // Atualizar status da entrega para EM_DEVOLUCAO
      await api.patch<Entrega>(`/api/v1/entregas/${request.entregaId}`, {
        status: "EM_DEVOLUCAO" as StatusEntrega,
      });

      console.log("✅ Devolução solicitada com sucesso:", resultado.id);
      return resultado.id!;
    } catch (error: any) {
      console.error("❌ Erro ao solicitar devolução:", error);
      throw error;
    }
  }

  /**
   * Aprova devolução pendente
   */
  async approveDevolution(
    movimentacaoId: string,
    approverRole: string,
  ): Promise<void> {
    try {
      console.log(
        "👍 Aprovando devolução:",
        movimentacaoId,
        "por",
        approverRole,
      );

      await api.patch<MovimentacaoEstoque>(
        `/api/v1/movimentacoes/${movimentacaoId}`,
        {
          status: "APROVADA",
          metadados: {
            approvedBy: approverRole,
            approvedAt: new Date().toISOString(),
          },
        },
      );

      console.log("✅ Devolução aprovada com sucesso");
    } catch (error: any) {
      console.error("❌ Erro ao aprovar devolução:", error);
      throw error;
    }
  }

  /**
   * Finaliza processo de devolução
   */
  async finalizeDevolution(
    movimentacaoId: string,
    finalCondition: CondicaoEquipamento,
  ): Promise<void> {
    try {
      console.log("🏁 Finalizando devolução:", movimentacaoId);

      // Buscar movimentação
      const movimentacao = await api.get<MovimentacaoEstoque>(
        `/api/v1/movimentacoes/${movimentacaoId}`,
      );
      if (!movimentacao) {
        throw new Error("Movimentação não encontrada");
      }

      // Atualizar movimentação para finalizada
      await api.patch<MovimentacaoEstoque>(
        `/api/v1/movimentacoes/${movimentacaoId}`,
        {
          status: "FINALIZADA",
          metadados: {
            ...movimentacao.metadados,
            condicaoFinal: finalCondition,
            finalizedAt: new Date().toISOString(),
          },
        },
      );

      // Atualizar entrega para devolvida
      if (movimentacao.metadados?.entregaOriginal) {
        await api.patch<Entrega>(
          `/api/v1/entregas/${movimentacao.metadados.entregaOriginal}`,
          {
            status: "DEVOLVIDA" as StatusEntrega,
            dataDevolucao: new Date().toISOString(),
          },
        );
      }

      // Atualizar ficha para disponível se equipamento em boas condições
      if (
        finalCondition === CondicaoEquipamento.PERFEITA ||
        finalCondition === CondicaoEquipamento.BOA
      ) {
        await api.patch<FichaEPI>(`/api/v1/fichas/${movimentacao.fichaId}`, {
          status: "DISPONIVEL" as StatusFicha,
        });
      }

      console.log("✅ Devolução finalizada com sucesso");
    } catch (error: any) {
      console.error("❌ Erro ao finalizar devolução:", error);
      throw error;
    }
  }

  /**
   * Lista devoluções por status
   */
  async listDevolutionsByStatus(
    status: StatusDevolucao,
  ): Promise<MovimentacaoEstoque[]> {
    try {
      const movimentacoes = await api.get<MovimentacaoEstoque[]>(
        "/api/v1/movimentacoes",
        {
          params: {
            tipo: TipoMovEnum.SAIDA_DEVOLUCAO,
            status: status,
          },
        },
      );

      return movimentacoes || [];
    } catch (error: any) {
      console.error("❌ Erro ao listar devoluções:", error);
      return [];
    }
  }

  /**
   * Busca devoluções de um colaborador específico
   */
  async getDevolutionsByCollaborator(
    colaboradorId: string,
  ): Promise<MovimentacaoEstoque[]> {
    try {
      const movimentacoes = await api.get<MovimentacaoEstoque[]>(
        "/api/v1/movimentacoes",
        {
          params: {
            colaboradorId,
            tipo: TipoMovEnum.SAIDA_DEVOLUCAO,
          },
        },
      );

      return movimentacoes || [];
    } catch (error: any) {
      console.error("❌ Erro ao buscar devoluções do colaborador:", error);
      return [];
    }
  }

  // Métodos auxiliares privados

  private calculatePossessionTime(dataEntrega: string): number {
    const entrega = new Date(dataEntrega);
    const agora = new Date();
    const diffTime = Math.abs(agora.getTime() - entrega.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // dias
  }

  private calculateProcessingTime(
    restrictions: DevolutionRestriction[],
    signatures: RequiredSignature[],
  ): number {
    let baseTime = 2; // 2 horas base

    // Adicionar tempo por restrições
    const errorRestrictions = restrictions.filter(
      (r) => r.blockingLevel === "ERROR",
    );
    baseTime += errorRestrictions.length * 24; // 24h por erro

    // Adicionar tempo por assinaturas requeridas
    const pendingSignatures = signatures.filter(
      (s) => s.required && !s.completed,
    );
    baseTime += pendingSignatures.length * 4; // 4h por assinatura

    return baseTime;
  }
}

// Instância singleton
export const devolutionAdapter = new DevolutionAdapter();

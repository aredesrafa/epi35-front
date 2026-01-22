/**
 * Delivery Process Adapter - Operações de Entrega Simplificadas
 *
 * Responsabilidade: Operações de entrega com backend inteligente.
 * Backend faz expansão de itens, geração de IDs e cálculo de prazos.
 */

import { api } from "../../core/apiClient";
import { 
  isValidEntityId, 
  isValidUUID, 
  isValidEstoqueItemId, 
  normalizeId,
  getIdErrorMessage 
} from "$lib/utils/idValidation";
import { 
  validateAndMapDeliveryPayload,
  logIdMappingIssues 
} from "$lib/utils/idMapper";

// ==================== INTERFACES ====================

// Tipos migrados do fichaProcessAdapter legacy
export interface EPIDisponivel {
  id: string;
  nomeEquipamento: string;
  numeroCA: string;
  categoria: string;
  quantidadeDisponivel: number;
  disponivel: boolean;
  registroCA: string;
  // Propriedades faltantes identificadas nos erros TS
  quantidade: number;
  estoqueItemId: string;
  episDisponivelId: string;
  tipoEpiId: string;
  posicaoEstoqueId: string;
}

export interface NovaEntregaFormData {
  responsavel: string;
  usuarioResponsavelId: string;
  // Propriedades faltantes identificadas nos erros TS
  observacoes?: string;
  responsavelId: string;
  itens: Array<{
    episDisponivelId: string;
    nomeEquipamento: string;
    registroCA: string;
    quantidade: number;
    // Propriedades faltantes nos itens
    estoqueItemId: string;
  }>;
}

export interface CreateDeliveryPayload {
  fichaEpiId: string;
  responsavelId: string;
  itens: Array<{
    estoqueItemId: string;
    quantidade: number;
  }>;
  observacoes?: string;
}

export interface DeliveryCompleteResult {
  success: boolean;
  data: {
    entregaId: string;
    itensIndividuais: Array<{
      id: string;
      nomeEquipamento: string;
      numeroCA: string;
      dataLimiteDevolucao: string;
    }>;
    totalItens: number;
    statusEntrega: "pendente_assinatura";
  };
}

export interface ConfirmSignaturePayload {
  assinatura: string;
}

export interface CancelDeliveryPayload {
  motivo: string;
}

// ==================== ADAPTER CLASS ====================

class DeliveryProcessAdapter {
  /**
   * Criar entrega usando endpoint específico da ficha
   * Endpoint correto: /fichas-epi/:id/entregas
   */
  async createDelivery(
    payload: CreateDeliveryPayload,
  ): Promise<DeliveryCompleteResult> {
    console.log(
      "🚚 DeliveryProcessAdapter: Criando entrega via ficha específica...",
    );
    console.log("🔍 FichaEpiId:", payload.fichaEpiId);
    console.log("🔍 ResponsavelId:", payload.responsavelId);
    console.log("🔍 Itens count:", payload.itens?.length || 0);

    // Validar que temos dados essenciais
    if (!payload.fichaEpiId) {
      throw new Error("fichaEpiId é obrigatório");
    }
    if (!payload.responsavelId) {
      throw new Error("responsavelId é obrigatório");
    }
    if (!payload.itens || payload.itens.length === 0) {
      throw new Error("Pelo menos um item é obrigatório");
    }

    // ✅ VALIDAÇÃO E MAPEAMENTO DE IDS: Verificar se IDs estão no formato correto
    console.log("🔍 Validando e mapeando IDs do payload...");
    
    const mappingResult = validateAndMapDeliveryPayload(payload);
    
    if (mappingResult.warnings.length > 0) {
      console.warn("⚠️ Avisos no mapeamento de IDs:", mappingResult.warnings);
    }
    
    if (!mappingResult.isValid) {
      console.error("❌ Erro no mapeamento de IDs:", mappingResult.errors);
      throw new Error(`IDs inválidos: ${mappingResult.errors.join(', ')}`);
    }
    
    // Usar o payload mapeado se disponível
    const validatedPayload = mappingResult.mappedPayload || payload;
    console.log("✅ Payload validado e mapeado:", {
      original: {
        fichaEpiId: payload.fichaEpiId,
        responsavelId: payload.responsavelId,
        itemCount: payload.itens.length
      },
      mapped: {
        fichaEpiId: validatedPayload.fichaEpiId,
        responsavelId: validatedPayload.responsavelId,
        itemCount: validatedPayload.itens.length
      }
    });

    try {
      // Montar payload conforme implementação REAL do backend
      // CRÍTICO: Número de objetos em 'itens' deve ser IGUAL ao campo 'quantidade'
      const itensExpandidos: Array<{
        estoqueItemOrigemId: string;
        numeroSerie: string;
      }> = [];
      validatedPayload.itens.forEach((item: { estoqueItemId: string; quantidade: number; }) => {
        console.log('🔍 Processando item para expansão:', {
          estoqueItemId: item.estoqueItemId,
          quantidade: item.quantidade,
          isUUID: item.estoqueItemId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
          isCustomId: item.estoqueItemId?.match(/^[A-Z0-9]{6}$/i)
        });
        
        // Para cada quantidade, criar um objeto separado no array
        for (let i = 0; i < item.quantidade; i++) {
          const normalizedEstoqueItemId = normalizeId(item.estoqueItemId);
          itensExpandidos.push({
            estoqueItemOrigemId: normalizedEstoqueItemId,
            numeroSerie: `SER-${normalizedEstoqueItemId}-${i + 1}`, // Série única para cada item
          });
        }
      });

      const deliveryData = {
        fichaEpiId: normalizeId(validatedPayload.fichaEpiId), // NECESSÁRIO no body conforme validação do backend
        quantidade: itensExpandidos.length, // Deve ser igual ao número de objetos em itens
        itens: itensExpandidos,
        assinaturaColaborador: "placeholder_signature", // Temporary placeholder
        observacoes: payload.observacoes || "",
        usuarioId: normalizeId(validatedPayload.responsavelId), // ✅ CORREÇÃO FINAL: backend espera usuarioId
      };

      console.log("📋 Payload formatado para backend:", deliveryData);
      console.log("🔍 Validação de IDs no payload:", {
        fichaEpiId: {
          value: validatedPayload.fichaEpiId,
          isUUID: validatedPayload.fichaEpiId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
          isCustomId: validatedPayload.fichaEpiId?.match(/^[A-Z0-9]{6}$/i)
        },
        usuarioId: {
          value: validatedPayload.responsavelId,
          isUUID: validatedPayload.responsavelId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
          isCustomId: validatedPayload.responsavelId?.match(/^[A-Z0-9]{6}$/i)
        },
        estoqueItemIds: itensExpandidos.map(item => ({
          value: item.estoqueItemOrigemId,
          isUUID: item.estoqueItemOrigemId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
          isCustomId: item.estoqueItemOrigemId?.match(/^[A-Z0-9]{6}$/i)
        }))
      });

      const response = await api.post<DeliveryCompleteResult>(
        `/fichas-epi/${validatedPayload.fichaEpiId}/entregas`,
        deliveryData,
      );

      console.log("✅ Entrega criada via endpoint da ficha:");
      console.log(`  - Ficha ID: ${validatedPayload.fichaEpiId} (original: ${payload.fichaEpiId})`);
      console.log(`  - Response:`, response);

      return response;
    } catch (error: unknown) {
      console.error("❌ Erro ao criar entrega via ficha:", error);

      // Log mais detalhado do erro para debug
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as { response?: { data: any } };
        if (errorResponse.response?.data) {
          console.error("❌ Detalhes do erro do backend:", errorResponse.response.data);
        }
      }

      throw error;
    }
  }

  /**
   * Validar entrega antes de criar (opcional)
   */
  async validateDelivery(
    payload: CreateDeliveryPayload,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    console.log(
      "🔍 DeliveryProcessAdapter: Validando entrega antes de criar:",
      payload,
    );

    try {
      const response = await api.post(`/fichas-epi/entregas/validar`, payload) as any;
      console.log("✅ Validação da entrega concluída:", response);
      return response as { valid: boolean; errors?: string[] };
    } catch (error: any) {
      console.error("❌ Erro na validação da entrega:", error);
      throw error;
    }
  }

  /**
   * Confirmar assinatura de entrega
   * Endpoint correto: PUT /api/fichas-epi/entregas/:entregaId/assinar
   */
  async confirmSignature(
    entregaId: string,
    payload: ConfirmSignaturePayload,
  ): Promise<void> {
    console.log(
      "✍️ DeliveryProcessAdapter: Confirmando assinatura:",
      entregaId,
    );

    try {
      // Usar endpoint correto da documentação (seção 10.6)
      const assinaturaData = {
        assinaturaColaborador: payload.assinatura,
        observacoes: "Entrega assinada pelo colaborador",
      };

      await api.put(
        `/fichas-epi/entregas/${entregaId}/assinar`,
        assinaturaData,
      );
      console.log("✅ Assinatura confirmada");
    } catch (error: any) {
      console.error("❌ Erro ao confirmar assinatura:", error);
      throw error;
    }
  }

  /**
   * Cancelar entrega
   */
  async cancelDelivery(
    entregaId: string,
    payload: CancelDeliveryPayload,
  ): Promise<void> {
    console.log("❌ DeliveryProcessAdapter: Cancelando entrega:", entregaId);

    try {
      await api.post(`/entregas/${entregaId}/cancel`, payload);
      console.log("✅ Entrega cancelada");
    } catch (error: any) {
      console.error("❌ Erro ao cancelar entrega:", error);
      throw error;
    }
  }

  /**
   * Imprimir entrega (gerar PDF)
   */
  async printDelivery(entregaId: string): Promise<Blob> {
    console.log(
      "🖨️ DeliveryProcessAdapter: Gerando PDF da entrega:",
      entregaId,
    );

    try {
      const response = await api.get(`/entregas/${entregaId}/print`) as any;
      console.log("✅ PDF gerado");
      return response as Blob;
    } catch (error: any) {
      console.error("❌ Erro ao gerar PDF:", error);
      throw error;
    }
  }

  /**
   * Editar entrega (antes da assinatura)
   */
  async updateDelivery(
    entregaId: string,
    payload: Partial<CreateDeliveryPayload>,
  ): Promise<DeliveryCompleteResult> {
    console.log("✏️ DeliveryProcessAdapter: Editando entrega:", entregaId);

    try {
      const response = await api.put<DeliveryCompleteResult>(
        `/entregas/${entregaId}`,
        payload,
      );
      console.log("✅ Entrega editada");
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao editar entrega:", error);
      throw error;
    }
  }

  // ==================== DEVOLUÇÃO FUNCTIONALITY ====================

  /**
   * Criar devolução de EPI
   */
  async createDevolucao(
    entregaId: string,
    payload: {
      itens: Array<{
        itemEntregaId: string;
        quantidade: number;
        motivo: string;
        observacoes?: string;
      }>;
      responsavelId: string;
    },
  ): Promise<{
    success: boolean;
    data: {
      devolucaoId: string;
      itensProcessados: number;
      status: string;
    };
  }> {
    console.log(
      "🔄 DeliveryProcessAdapter: Criando devolução:",
      entregaId,
      payload,
    );

    try {
      const response = await api.post(
        `/fichas-epi/entregas/${entregaId}/devolucao`,
        payload,
      );
      console.log("✅ Devolução criada com sucesso:", response);
      return response as { success: boolean; data: { devolucaoId: string; itensProcessados: number; status: string; }; };
    } catch (error: any) {
      console.error("❌ Erro ao criar devolução:", error);
      throw error;
    }
  }

  /**
   * Validar devolução antes de processar
   */
  async validateDevolucao(
    entregaId: string,
    payload: {
      itens: Array<{
        itemEntregaId: string;
        quantidade: number;
      }>;
    },
  ): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    console.log(
      "🔍 DeliveryProcessAdapter: Validando devolução:",
      entregaId,
      payload,
    );

    try {
      const response = await api.post(
        `/fichas-epi/entregas/${entregaId}/devolucao/validar`,
        payload,
      );
      console.log("✅ Validação de devolução concluída:", response);
      return response as { valid: boolean; errors?: string[]; warnings?: string[]; };
    } catch (error: any) {
      console.error("❌ Erro na validação de devolução:", error);
      throw error;
    }
  }

  /**
   * Processar devolução em lote (múltiplas entregas)
   */
  async processBatchDevolucao(payload: {
    devolucoes: Array<{
      entregaId: string;
      itens: Array<{
        itemEntregaId: string;
        quantidade: number;
        motivo: string;
      }>;
    }>;
    responsavelId: string;
  }): Promise<{
    success: boolean;
    data: {
      totalProcessadas: number;
      resultados: Array<{
        entregaId: string;
        devolucaoId: string;
        status: string;
      }>;
    };
  }> {
    console.log(
      "🔄 DeliveryProcessAdapter: Processando devoluções em lote:",
      payload,
    );

    try {
      const response = await api.post("/devolucoes/process-batch", payload) as any;
      console.log("✅ Devoluções em lote processadas:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao processar devoluções em lote:", error);
      throw error;
    }
  }
}

// ==================== EXPORT ====================

export const deliveryProcessAdapter = new DeliveryProcessAdapter();

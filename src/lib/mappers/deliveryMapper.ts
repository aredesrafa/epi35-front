/**
 * Mappers para Entregas e Devoluções
 * 
 * Responsável por mapear os dados entre frontend e backend,
 * garantindo compatibilidade com os nomes de campos corretos
 */

import { validateEntregaForm, validateDevolucaoForm } from '../utils/formValidation';

// ==================== INTERFACES ====================

export interface FrontendEntregaPayload {
  fichaEpiId: string;
  responsavelId: string; // Frontend usa responsavelId
  itens: Array<{
    estoqueItemId: string; // Frontend usa estoqueItemId
    quantidade: number;
    numeroSerie?: string;
  }>;
  observacoes?: string;
}

export interface BackendEntregaPayload {
  quantidade: number;
  itens: Array<{
    estoqueItemOrigemId: string; // Backend espera estoqueItemOrigemId
    numeroSerie?: string;
  }>;
  assinaturaColaborador?: string;
  observacoes?: string;
  usuarioId: string; // Backend espera usuarioId
}

export interface FrontendDevolucaoPayload {
  fichaId: string;
  entregaId: string;
  responsavelId: string; // Frontend usa responsavelId
  itens: Array<{
    equipamentoId: string; // Frontend usa equipamentoId
    motivo: string;
    observacoes?: string;
  }>;
  observacoes?: string;
}

export interface BackendDevolucaoPayload {
  entregaId: string;
  itensParaDevolucao: Array<{
    itemId: string; // Backend espera itemId
    motivoDevolucao: string;
    destinoItem?: string;
  }>;
  usuarioId: string; // Backend espera usuarioId
  observacoes?: string;
}

// ==================== MAPPERS ====================

/**
 * Mapeia payload de entrega do frontend para backend
 */
export function mapEntregaPayload(frontendPayload: FrontendEntregaPayload): BackendEntregaPayload {
  // Validar payload antes de mapear
  const validationResult = validateEntregaForm({
    fichaEpiId: frontendPayload.fichaEpiId,
    itens: frontendPayload.itens.map(item => ({
      estoqueItemOrigemId: item.estoqueItemId,
      numeroSerie: item.numeroSerie
    })),
    usuarioId: frontendPayload.responsavelId,
    observacoes: frontendPayload.observacoes
  });

  if (!validationResult.isValid) {
    throw new Error(`Dados de entrega inválidos: ${validationResult.errors.map(e => e.message).join(', ')}`);
  }

  // Expandir itens para rastreabilidade unitária
  const itensExpandidos: Array<{
    estoqueItemOrigemId: string;
    numeroSerie?: string;
  }> = [];

  frontendPayload.itens.forEach((item) => {
    // Para cada quantidade, criar um objeto separado no array
    for (let i = 0; i < item.quantidade; i++) {
      itensExpandidos.push({
        estoqueItemOrigemId: item.estoqueItemId,
        numeroSerie: item.numeroSerie || `SER-${item.estoqueItemId}-${i + 1}`,
      });
    }
  });

  return {
    quantidade: itensExpandidos.length,
    itens: itensExpandidos,
    assinaturaColaborador: "placeholder_signature", // Será preenchido posteriormente
    observacoes: frontendPayload.observacoes || "",
    usuarioId: frontendPayload.responsavelId, // Frontend responsavelId → Backend usuarioId
  };
}

/**
 * Mapeia payload de devolução do frontend para backend
 */
export function mapDevolucaoPayload(
  frontendPayload: FrontendDevolucaoPayload
): BackendDevolucaoPayload {
  // Validar payload antes de mapear
  const validationResult = validateDevolucaoForm({
    fichaId: frontendPayload.fichaId,
    entregaId: frontendPayload.entregaId,
    itensParaDevolucao: frontendPayload.itens.map(item => ({
      itemId: item.equipamentoId,
      motivoDevolucao: item.motivo,
      destinoItem: "QUARENTENA" // Padrão do backend
    })),
    usuarioId: frontendPayload.responsavelId,
    observacoes: frontendPayload.observacoes
  });

  if (!validationResult.isValid) {
    throw new Error(`Dados de devolução inválidos: ${validationResult.errors.map(e => e.message).join(', ')}`);
  }

  return {
    entregaId: frontendPayload.entregaId,
    itensParaDevolucao: frontendPayload.itens.map(item => ({
      itemId: item.equipamentoId, // Frontend equipamentoId → Backend itemId
      motivoDevolucao: item.motivo,
      destinoItem: "QUARENTENA", // Padrão do backend: todos os itens devolvidos vão para quarentena
    })),
    usuarioId: frontendPayload.responsavelId, // Frontend responsavelId → Backend usuarioId
    observacoes: frontendPayload.observacoes || "",
  };
}

/**
 * Mapeia response de entrega do backend para frontend
 */
export function mapEntregaResponse(backendResponse: any): any {
  // Mapear campos se necessário
  if (backendResponse.data?.usuarioId) {
    backendResponse.data.responsavelId = backendResponse.data.usuarioId;
  }

  // Mapear itens se necessário
  if (backendResponse.data?.itens) {
    backendResponse.data.itens = backendResponse.data.itens.map((item: any) => ({
      ...item,
      estoqueItemId: item.estoqueItemOrigemId || item.estoqueItemId,
    }));
  }

  return backendResponse;
}

/**
 * Mapeia response de devolução do backend para frontend
 */
export function mapDevolucaoResponse(backendResponse: any): any {
  // Mapear campos se necessário
  if (backendResponse.data?.usuarioId) {
    backendResponse.data.responsavelId = backendResponse.data.usuarioId;
  }

  // Mapear itens se necessário
  if (backendResponse.data?.itensDevolucao) {
    backendResponse.data.itensDevolucao = backendResponse.data.itensDevolucao.map((item: any) => ({
      ...item,
      equipamentoId: item.itemId || item.equipamentoId,
    }));
  }

  return backendResponse;
}

// ==================== VALIDATION HELPERS ====================

/**
 * Valida se todos os campos obrigatórios estão presentes
 */
export function validateRequiredFields(payload: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !payload[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
  }
}

/**
 * Normaliza IDs para formato correto
 */
export function normalizeIds(payload: any): any {
  const normalized = { ...payload };
  
  // Normalizar IDs customizados para maiúsculas
  if (normalized.fichaEpiId && typeof normalized.fichaEpiId === 'string') {
    normalized.fichaEpiId = normalized.fichaEpiId.trim();
  }
  
  if (normalized.usuarioId && typeof normalized.usuarioId === 'string') {
    normalized.usuarioId = normalized.usuarioId.trim();
  }
  
  if (normalized.itens && Array.isArray(normalized.itens)) {
    normalized.itens = normalized.itens.map((item: any) => ({
      ...item,
      estoqueItemOrigemId: item.estoqueItemOrigemId?.trim?.() || item.estoqueItemOrigemId,
    }));
  }
  
  return normalized;
}

/**
 * Converte payload legacy para novo formato
 */
export function migrateLegacyPayload(legacyPayload: any): FrontendEntregaPayload | FrontendDevolucaoPayload {
  // Mapear campos antigos para novos
  const migrated: any = { ...legacyPayload };
  
  // Mapear usuarioResponsavelId → responsavelId
  if (migrated.usuarioResponsavelId) {
    migrated.responsavelId = migrated.usuarioResponsavelId;
    delete migrated.usuarioResponsavelId;
  }
  
  // Mapear episDisponivelId → estoqueItemId
  if (migrated.itens) {
    migrated.itens = migrated.itens.map((item: any) => ({
      ...item,
      estoqueItemId: item.episDisponivelId || item.estoqueItemId,
    }));
  }
  
  return migrated;
}
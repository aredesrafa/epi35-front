/**
 * Helpers para Notas de Movimentação - UI e Labels
 *
 * Funções utilitárias para exibição e formatação de notas
 * de movimentação na interface do usuário
 */

import type {
  TipoNotaEnum,
  StatusNotaEnum,
} from "$lib/services/process/notasMovimentacaoTypes";

// ==================== LABELS E TEXTOS ====================

/**
 * Obtém label amigável para tipo de nota
 */
export function getTipoNotaLabel(tipo: TipoNotaEnum): string {
  const labels: Record<TipoNotaEnum, string> = {
    ENTRADA: "Entrada",
    TRANSFERENCIA: "Transferência",
    DESCARTE: "Descarte",
    ENTRADA_AJUSTE: "Entrada (Ajuste)",
    SAIDA_AJUSTE: "Saída (Ajuste)",
  };
  return labels[tipo] || tipo;
}

/**
 * Obtém label amigável para status da nota
 */
export function getStatusNotaLabel(status: StatusNotaEnum): string {
  const labels: Record<StatusNotaEnum, string> = {
    RASCUNHO: "Rascunho",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  };
  return labels[status] || status;
}

// ==================== CORES E VISUAL ====================

/**
 * Obtém cor do badge para tipo de nota (Flowbite colors)
 */
export function getTipoNotaBadgeColor(
  tipo: TipoNotaEnum,
): "green" | "blue" | "red" | "yellow" | "dark" | "primary" | "purple" | "indigo" | "pink" | "none" {
  const colors: Record<
    TipoNotaEnum,
    "green" | "blue" | "red" | "yellow" | "dark" | "primary" | "purple" | "indigo" | "pink" | "none"
  > = {
    ENTRADA: "green",
    TRANSFERENCIA: "blue",
    DESCARTE: "red",
    ENTRADA_AJUSTE: "yellow",
    SAIDA_AJUSTE: "dark",
  };
  return colors[tipo] || "dark";
}

/**
 * Obtém cor do badge para status da nota (Flowbite colors)
 */
export function getStatusNotaBadgeColor(
  status: StatusNotaEnum,
):
  | "green"
  | "red"
  | "yellow"
  | "primary"
  | "blue"
  | "dark"
  | "purple"
  | "indigo"
  | "pink"
  | "none" {
  const colors: Record<
    StatusNotaEnum,
    | "green"
    | "red"
    | "yellow"
    | "primary"
    | "blue"
    | "dark"
    | "purple"
    | "indigo"
    | "pink"
    | "none"
  > = {
    RASCUNHO: "yellow",
    CONCLUIDA: "green",
    CANCELADA: "red",
  };
  return colors[status] || "dark";
}

// ==================== VALIDAÇÕES DE NEGÓCIO ====================

/**
 * Verifica se uma nota pode ser editada
 */
export function notaPodeSerEditada(status: StatusNotaEnum): boolean {
  return status === "RASCUNHO";
}

/**
 * Verifica se uma nota pode ser excluída
 */
export function notaPodeSerExcluida(status: StatusNotaEnum): boolean {
  return status === "RASCUNHO";
}

/**
 * Verifica se uma nota pode ser concluída
 */
export function notaPodeSerConcluida(status: StatusNotaEnum): boolean {
  return status === "RASCUNHO";
}

/**
 * Verifica se uma nota pode ser cancelada
 */
export function notaPodeSerCancelada(status: StatusNotaEnum): boolean {
  return status === "RASCUNHO" || status === "CONCLUIDA";
}

// ==================== FORMATAÇÃO ====================

/**
 * Formata número da nota para exibição
 */
export function formatarNumeroNota(numero: string): string {
  if (!numero) return "N/A";

  // Exemplo: ENT-2025-000001 → ENT-2025-000001 (mantém como está)
  return numero.toUpperCase();
}

/**
 * Formata data da nota para exibição brasileira
 */
export function formatarDataNota(data: string): string {
  if (!data) return "N/A";

  try {
    const date = new Date(data);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "Data inválida";
  }
}

/**
 * Formata valor monetário brasileiro
 */
export function formatarValorMonetario(valor: number): string {
  if (valor == null || isNaN(valor)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

// ==================== RESUMOS E ESTATÍSTICAS ====================

/**
 * Calcula resumo de uma nota
 */
export function calcularResumoNota(nota: {
  itens?: Array<{ quantidade: number; custo_unitario?: number }>;
}) {
  const itens = nota.itens || [];

  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);
  const valorTotal = itens.reduce((acc, item) => {
    const custo =
      item.custo_unitario != null &&
      typeof item.custo_unitario === "number" &&
      !isNaN(item.custo_unitario)
        ? item.custo_unitario
        : 0;
    return acc + custo * item.quantidade;
  }, 0);

  return {
    totalItens,
    valorTotal,
    mediaValorUnitario: totalItens > 0 ? valorTotal / totalItens : 0,
  };
}

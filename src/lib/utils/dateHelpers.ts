// Utilitários para manipulação de datas
// Portados do projeto React original

import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";

/**
 * Formata uma data para exibição
 * @param date - Data para formatar (string ISO ou Date)
 * @param fallback - Texto a exibir se a data for inválida
 * @returns Data formatada em formato brasileiro (dd/MM/yyyy)
 */
export function formatarData(
  date: string | Date | null | undefined,
  fallback = "-",
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy");
  } catch (error: any) {
    console.warn("Erro ao formatar data:", date, error);
    return fallback;
  }
}

/**
 * Formata uma data com hora para exibição no histórico
 * @param date - Data para formatar (string ISO ou Date)
 * @param fallback - Texto a exibir se a data for inválida
 * @returns Data formatada com hora (dd/MM/yyyy • HH:mm)
 */
export function formatarDataComHora(
  date: string | Date | null | undefined,
  fallback = "-",
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy • HH:mm");
  } catch (error: any) {
    console.warn("Erro ao formatar data com hora:", date, error);
    return fallback;
  }
}

/**
 * Formata uma data com hora para exibição
 * @param date - Data para formatar (string ISO ou Date)
 * @param fallback - Texto a exibir se a data for inválida
 * @returns Data formatada em formato brasileiro (dd/MM/yyyy HH:mm)
 */
export function formatarDataHora(
  date: string | Date | null | undefined,
  fallback = "-",
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy HH:mm");
  } catch (error: any) {
    console.warn("Erro ao formatar data e hora:", date, error);
    return fallback;
  }
}

/**
 * Formata um período relativo (ex: "há 3 dias", "em 2 dias")
 * @param date - Data para comparar
 * @returns Período relativo formatado
 */
export function formatarPeriodoRelativo(
  date: string | Date | null | undefined,
): string {
  if (!date) return "-";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const hoje = new Date();
    const dias = differenceInDays(dateObj, hoje);

    if (dias === 0) {
      return "hoje";
    } else if (dias === 1) {
      return "amanhã";
    } else if (dias === -1) {
      return "ontem";
    } else if (dias > 0) {
      return `em ${dias} dia${dias > 1 ? "s" : ""}`;
    } else {
      return `há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`;
    }
  } catch (error: any) {
    console.warn("Erro ao calcular período relativo:", date, error);
    return "-";
  }
}

/**
 * Alias para formatarData para compatibilidade com o modal
 */
export const formatDate = formatarData;

/**
 * Verifica se uma data está vencida
 * @param date - Data para verificar
 * @returns true se a data estiver vencida
 */
export function isDataVencida(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isBefore(dateObj, new Date());
  } catch (error: any) {
    console.warn("Erro ao verificar vencimento:", date, error);
    return false;
  }
}

/**
 * Verifica se uma data está próxima do vencimento
 * @param date - Data para verificar
 * @param diasAntecipacao - Número de dias de antecipação para considerar "próximo"
 * @returns true se a data estiver próxima do vencimento
 */
export function isProximoVencimento(
  date: string | Date | null | undefined,
  diasAntecipacao = 30,
): boolean {
  if (!date) return false;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const dataLimite = addDays(new Date(), diasAntecipacao);

    return isAfter(dateObj, new Date()) && isBefore(dateObj, dataLimite);
  } catch (error: any) {
    console.warn("Erro ao verificar proximidade do vencimento:", date, error);
    return false;
  }
}

/**
 * Calcula quantos dias faltam para o vencimento
 * @param date - Data de vencimento
 * @returns Número de dias (positivo = futuro, negativo = passado)
 */
export function diasParaVencimento(
  date: string | Date | null | undefined,
): number | null {
  if (!date) return null;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return differenceInDays(dateObj, new Date());
  } catch (error: any) {
    console.warn("Erro ao calcular dias para vencimento:", date, error);
    return null;
  }
}

/**
 * Formata um período em dias para exibição amigável
 * @param dias - Número de dias
 * @returns String formatada (ex: "3 anos", "6 meses", "15 dias")
 */
export function formatarPeriodoDias(dias: number): string {
  if (dias >= 365) {
    const anos = Math.floor(dias / 365);
    const mesesRestantes = Math.floor((dias % 365) / 30);

    let resultado = `${anos} ano${anos > 1 ? "s" : ""}`;
    if (mesesRestantes > 0) {
      resultado += ` e ${mesesRestantes} mês${mesesRestantes > 1 ? "es" : ""}`;
    }
    return resultado;
  } else if (dias >= 30) {
    const meses = Math.floor(dias / 30);
    const diasRestantes = dias % 30;

    let resultado = `${meses} mês${meses > 1 ? "es" : ""}`;
    if (diasRestantes > 0) {
      resultado += ` e ${diasRestantes} dia${diasRestantes > 1 ? "s" : ""}`;
    }
    return resultado;
  } else {
    return `${dias} dia${dias > 1 ? "s" : ""}`;
  }
}

/**
 * Obtém a cor apropriada para o status de vencimento
 * @param date - Data para verificar
 * @param diasAlerta - Dias para alerta (padrão: 30)
 * @returns Cor para o badge/status ('green', 'yellow', 'red')
 */
export function getCorVencimento(
  date: string | Date | null | undefined,
  diasAlerta = 30,
): "green" | "yellow" | "red" | "dark" {
  if (!date) return "dark";

  if (isDataVencida(date)) {
    return "red";
  } else if (isProximoVencimento(date, diasAlerta)) {
    return "yellow";
  } else {
    return "green";
  }
}

/**
 * Obtém o texto de status de vencimento
 * @param date - Data para verificar
 * @param diasAlerta - Dias para alerta (padrão: 30)
 * @returns Texto do status
 */
export function getStatusVencimento(
  date: string | Date | null | undefined,
  diasAlerta = 30,
): string {
  if (!date) return "Sem data";

  if (isDataVencida(date)) {
    const dias = Math.abs(diasParaVencimento(date) || 0);
    return `Vencido há ${dias} dia${dias > 1 ? "s" : ""}`;
  } else if (isProximoVencimento(date, diasAlerta)) {
    const dias = diasParaVencimento(date) || 0;
    return `Vence em ${dias} dia${dias > 1 ? "s" : ""}`;
  } else {
    const dias = diasParaVencimento(date) || 0;
    return `Válido por mais ${dias} dia${dias > 1 ? "s" : ""}`;
  }
}

/**
 * Converte uma data para o formato ISO string (para APIs)
 * @param date - Data para converter
 * @returns String ISO ou null se inválida
 */
export function toISOString(
  date: string | Date | null | undefined,
): string | null {
  if (!date) return null;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString();
  } catch (error: any) {
    console.warn("Erro ao converter para ISO string:", date, error);
    return null;
  }
}

/**
 * Obtém a data atual no formato brasileiro
 * @returns Data atual formatada (dd/MM/yyyy)
 */
export function getDataAtualFormatada(): string {
  return formatarData(new Date());
}

/**
 * Obtém a data atual no formato ISO
 * @returns Data atual em formato ISO
 */
export function getDataAtualISO(): string {
  return new Date().toISOString();
}

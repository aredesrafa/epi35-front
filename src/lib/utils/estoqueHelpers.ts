import type { ItemEstoque, EventoEstoque, TipoEPI } from "$lib/types";
import { api } from "$lib/services/core/apiClient";
import {
  isDataVencida,
  isProximoVencimento as isProximoVencimentoDate,
} from "./dateHelpers";

// Calcular status do item de estoque
export const calcularStatusEstoque = (
  item: ItemEstoque,
): "disponivel" | "baixo" | "vencendo" | "vencido" | "esgotado" => {
  // Verificar se esgotado
  if (item.quantidade === 0) {
    return "esgotado";
  }

  // Verificar se vencido usando helper
  if (isDataVencida(item.dataValidade)) {
    return "vencido";
  }

  // Verificar se próximo do vencimento
  if (isProximoVencimentoDate(item.dataValidade, 30)) {
    return "vencendo";
  }

  // Verificar se baixo estoque
  if (item.quantidade <= (item.quantidadeMinima || 5)) {
    return "baixo";
  }

  return "disponivel";
};

// Verificar se está próximo ao vencimento
export const isProximoVencimento = (
  item: ItemEstoque,
  diasAlerta: number = 30,
): boolean => {
  return isProximoVencimentoDate(item.dataValidade, diasAlerta);
};

// Funções simplificadas para evento (sem dependência do eventHelpers)
export const registrarEventoEstoque = async (
  evento: Partial<EventoEstoque>,
) => {
  try {
    // TODO: Implementar API de histórico quando disponível
    console.log("Evento de estoque registrado:", evento);
  } catch (error: any) {
    console.error("Erro ao registrar evento de estoque:", error);
  }
};

// Função para verificar alertas de estoque
export const verificarAlertasEstoque = async (): Promise<{
  baixoEstoque: ItemEstoque[];
  proximosVencimento: ItemEstoque[];
  vencidos: ItemEstoque[];
}> => {
  try {
    const response = await api.get("/estoque/posicao");
    const todosItens = response.data?.items || [];

    const baixoEstoque: ItemEstoque[] = [];
    const proximosVencimento: ItemEstoque[] = [];
    const vencidos: ItemEstoque[] = [];

    for (const item of todosItens) {
      const status = calcularStatusEstoque(item);

      if (status === "baixo") {
        baixoEstoque.push(item);
      } else if (status === "vencido") {
        vencidos.push(item);
      } else if (status === "vencendo") {
        proximosVencimento.push(item);
      }
    }

    return { baixoEstoque, proximosVencimento, vencidos };
  } catch (error: any) {
    console.error("Erro ao verificar alertas de estoque:", error);
    return { baixoEstoque: [], proximosVencimento: [], vencidos: [] };
  }
};

// Função para formatar histórico de movimentações
export const formatarHistoricoMovimentacao = (
  evento: EventoEstoque,
): string => {
  const tipos: Record<string, string> = {
    cadastro: "Cadastro",
    entrada: "Entrada",
    saida: "Saída",
    entrega: "Entrega",
    ajuste: "Ajuste",
    devolucao: "Devolução",
    perda: "Perda",
    vencimento: "Vencimento",
  };

  return tipos[evento.tipo] || evento.tipo;
};

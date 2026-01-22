/**
 * Store reativo para gerenciar dados de fichas de EPI
 * Permite atualizações dinâmicas durante devoluções e entregas
 */

import { writable } from "svelte/store";
import type { FichaDetailData } from "$lib/types/serviceTypes";
import type { EquipamentoEmPosseItem } from "$lib/types/serviceTypes";

// Interface para DevolucaoItem (usada pelo store)
export interface DevolucaoItem {
  id: string;
  equipamentoId: string;
  nomeEquipamento: string;
  registroCA: string;
  entregaId?: string;
  dataDevolucao: string;
  motivo: string;
  observacoes?: string;
  status?: "pendente" | "concluida" | "cancelada";
  quantidade: number;
  prazoOriginal: string;
  noPrazo: boolean;
  diasAtraso?: number;
}

// Store principal para cache de dados de fichas
export const fichaDataStore = writable<Map<string, FichaDetailData>>(new Map());

// Store para devoluções pendentes
export const devolucoesPendentesStore = writable<Map<string, DevolucaoItem[]>>(
  new Map(),
);

/**
 * Atualiza a ficha após uma devolução de equipamento
 */
export function updateFichaAfterDevolucao(
  fichaId: string,
  equipamentoId: string,
  motivo: string,
  observacoes?: string,
) {
  fichaDataStore.update((cache) => {
    const fichaData = cache.get(fichaId);
    if (!fichaData) return cache;

    // Encontrar o equipamento sendo devolvido
    const equipamentoIndex = fichaData.equipamentosEmPosse.findIndex(
      (eq) => eq.id === equipamentoId,
    );
    if (equipamentoIndex === -1) return cache;

    const equipamento = fichaData.equipamentosEmPosse[equipamentoIndex];

    // Remover equipamento da lista "Em Posse"
    fichaData.equipamentosEmPosse.splice(equipamentoIndex, 1);

    // Criar nova devolução
    const novaDevolucao: DevolucaoItem = {
      id: `dev-${Date.now()}`,
      equipamentoId: equipamento.id,
      nomeEquipamento: equipamento.nomeEquipamento,
      registroCA: equipamento.registroCA,
      entregaId: equipamento.entregaId,
      dataDevolucao: new Date().toISOString(),
      motivo: motivo,
      observacoes: observacoes || "",
      status: "concluida",
      quantidade: equipamento.quantidade,
      prazoOriginal: equipamento.prazoMaximoDevolucao || new Date().toISOString(),
      noPrazo: !equipamento.vencido,
      diasAtraso: equipamento.vencido ? equipamento.diasVencido : undefined,
    };

    // Adicionar à lista de devoluções (inicializa se não existir)
    if (!fichaData.devolucoes) {
      fichaData.devolucoes = [];
    }
    fichaData.devolucoes.unshift(novaDevolucao); // Adiciona no início

    // Atualizar contadores
    fichaData.totalEquipamentosEmPosse = fichaData.equipamentosEmPosse.length;
    fichaData.totalDevolucoes = fichaData.devolucoes.length;

    // Salvar no cache
    cache.set(fichaId, fichaData);
    return cache;
  });

  console.log("✅ Store atualizado após devolução:", {
    fichaId,
    equipamentoId,
    motivo,
  });
}

/**
 * Busca dados da ficha no cache
 */
export function getFichaFromCache(fichaId: string): FichaDetailData | null {
  let fichaData: FichaDetailData | null = null;

  fichaDataStore.subscribe((cache) => {
    fichaData = cache.get(fichaId) || null;
  })();

  return fichaData;
}

/**
 * Salva dados da ficha no cache
 */
export function setFichaInCache(fichaId: string, fichaData: FichaDetailData) {
  fichaDataStore.update((cache) => {
    cache.set(fichaId, fichaData);
    return cache;
  });
}

/**
 * Limpa o cache (útil para desenvolvimento)
 */
export function clearFichaCache() {
  fichaDataStore.set(new Map());
  devolucoesPendentesStore.set(new Map());
  console.log("🧹 Cache de fichas limpo");
}

/**
 * Adiciona equipamento após entrega (para implementação futura)
 */
export function updateFichaAfterEntrega(
  fichaId: string,
  novoEquipamento: EquipamentoEmPosseItem,
) {
  fichaDataStore.update((cache) => {
    const fichaData = cache.get(fichaId);
    if (!fichaData) return cache;

    // Adicionar novo equipamento
    fichaData.equipamentosEmPosse.push(novoEquipamento);
    fichaData.totalEquipamentosEmPosse = fichaData.equipamentosEmPosse.length;

    cache.set(fichaId, fichaData);
    return cache;
  });

  console.log("✅ Store atualizado após entrega:", {
    fichaId,
    equipamento: novoEquipamento.nomeEquipamento,
  });
}

/**
 * ENUMs do Backend - Fonte única da verdade
 * Baseado na documentação do backend EPI v3.5.4
 *
 * ⚠️ IMPORTANTE: Estes valores devem ser EXATAMENTE iguais aos ENUMs do backend
 * Qualquer alteração deve ser sincronizada com a equipe de backend
 */

// ==================== CATEGORIA EPI ====================
// Enum para categorização dos tipos de EPI (8 categorias)
export const CategoriaEPI = {
  PROTECAO_CABECA: "PROTECAO_CABECA",
  PROTECAO_OLHOS: "PROTECAO_OLHOS",
  PROTECAO_AUDITIVA: "PROTECAO_AUDITIVA",
  PROTECAO_RESPIRATORIA: "PROTECAO_RESPIRATORIA",
  PROTECAO_TRONCO: "PROTECAO_TRONCO",
  PROTECAO_MAOS: "PROTECAO_MAOS",
  PROTECAO_PES: "PROTECAO_PES",
  PROTECAO_QUEDAS: "PROTECAO_QUEDAS",
  OUTROS: "OUTROS",
} as const;

export type CategoriaEPIEnum = (typeof CategoriaEPI)[keyof typeof CategoriaEPI];

// ==================== STATUS TIPO EPI ====================
// Status para um tipo de EPI no catálogo
export const StatusTipoEPI = {
  ATIVO: "ATIVO",
  DESCONTINUADO: "DESCONTINUADO",
} as const;

export type StatusTipoEPIEnum =
  (typeof StatusTipoEPI)[keyof typeof StatusTipoEPI];

// ==================== STATUS ESTOQUE ITEM ====================
// Status de um item no estoque físico
export const StatusEstoqueItem = {
  DISPONIVEL: "DISPONIVEL",
  AGUARDANDO_INSPECAO: "AGUARDANDO_INSPECAO",
  QUARENTENA: "QUARENTENA",
} as const;

export type StatusEstoqueItemEnum =
  (typeof StatusEstoqueItem)[keyof typeof StatusEstoqueItem];

// ==================== TIPOS DE NOTA ====================
// Tipos de notas de movimentação
export const TipoNota = {
  ENTRADA: "ENTRADA",
  TRANSFERENCIA: "TRANSFERENCIA",
  DESCARTE: "DESCARTE",
  ENTRADA_AJUSTE: "ENTRADA_AJUSTE",
  SAIDA_AJUSTE: "SAIDA_AJUSTE",
} as const;

export type TipoNotaEnum = (typeof TipoNota)[keyof typeof TipoNota];

// ==================== STATUS NOTA ====================
// Status de uma nota de movimentação
export const StatusNota = {
  RASCUNHO: "RASCUNHO",
  CONCLUIDA: "CONCLUIDA",
  CANCELADA: "CANCELADA",
} as const;

export type StatusNotaEnum = (typeof StatusNota)[keyof typeof StatusNota];

// ==================== TIPOS DE MOVIMENTAÇÃO (EVENT SOURCING) ====================
// Tipos de movimentação no livro-razão (16 tipos incluindo estornos)
export const TipoMovimentacao = {
  // Movimentações Diretas
  ENTRADA_NOTA: "ENTRADA_NOTA",
  SAIDA_ENTREGA: "SAIDA_ENTREGA",
  ENTRADA_DEVOLUCAO: "ENTRADA_DEVOLUCAO",
  SAIDA_DEVOLUCAO: "SAIDA_DEVOLUCAO", // Propriedade faltante identificada nos erros TS
  SAIDA_TRANSFERENCIA: "SAIDA_TRANSFERENCIA",
  ENTRADA_TRANSFERENCIA: "ENTRADA_TRANSFERENCIA",
  SAIDA_DESCARTE: "SAIDA_DESCARTE",
  AJUSTE_POSITIVO: "AJUSTE_POSITIVO",
  AJUSTE_NEGATIVO: "AJUSTE_NEGATIVO",

  // Movimentações de Estorno/Cancelamento
  ESTORNO_ENTRADA_NOTA: "ESTORNO_ENTRADA_NOTA",
  ESTORNO_SAIDA_ENTREGA: "ESTORNO_SAIDA_ENTREGA",
  ESTORNO_ENTRADA_DEVOLUCAO: "ESTORNO_ENTRADA_DEVOLUCAO",
  ESTORNO_SAIDA_DEVOLUCAO: "ESTORNO_SAIDA_DEVOLUCAO", // Estorno para SAIDA_DEVOLUCAO
  ESTORNO_SAIDA_DESCARTE: "ESTORNO_SAIDA_DESCARTE",
  ESTORNO_SAIDA_TRANSFERENCIA: "ESTORNO_SAIDA_TRANSFERENCIA",
  ESTORNO_ENTRADA_TRANSFERENCIA: "ESTORNO_ENTRADA_TRANSFERENCIA",
  ESTORNO_AJUSTE_POSITIVO: "ESTORNO_AJUSTE_POSITIVO",
  ESTORNO_AJUSTE_NEGATIVO: "ESTORNO_AJUSTE_NEGATIVO",
} as const;

export type TipoMovimentacaoEnum =
  (typeof TipoMovimentacao)[keyof typeof TipoMovimentacao];

// ==================== STATUS FICHA ====================
// Status da ficha de EPI geral do colaborador
export const StatusFicha = {
  ATIVA: "ATIVA",
  INATIVA: "INATIVA",
} as const;

export type StatusFichaEnum = (typeof StatusFicha)[keyof typeof StatusFicha];

// ==================== STATUS ENTREGA ====================
// Status do evento de entrega
export const StatusEntrega = {
  PENDENTE_ASSINATURA: "PENDENTE_ASSINATURA",
  ASSINADA: "ASSINADA",
  CANCELADA: "CANCELADA",
} as const;

export type StatusEntregaEnum =
  (typeof StatusEntrega)[keyof typeof StatusEntrega];

// ==================== STATUS ENTREGA ITEM ====================
// Status de um item entregue a um colaborador (unitário)
export const StatusEntregaItem = {
  COM_COLABORADOR: "COM_COLABORADOR",
  DEVOLVIDO: "DEVOLVIDO",
  // Nota: DEVOLUCAO_ATRASADA é calculado dinamicamente em queries baseado na data_limite_devolucao
} as const;

export type StatusEntregaItemEnum =
  (typeof StatusEntregaItem)[keyof typeof StatusEntregaItem];

// ==================== CONFIGURAÇÕES DO SISTEMA ====================
// Chaves de configuração global
export const ConfiguracaoChave = {
  PERMITIR_ESTOQUE_NEGATIVO: "PERMITIR_ESTOQUE_NEGATIVO",
  PERMITIR_AJUSTES_FORCADOS: "PERMITIR_AJUSTES_FORCADOS",
  ESTOQUE_MINIMO_EQUIPAMENTO: "ESTOQUE_MINIMO_EQUIPAMENTO",
} as const;

export type ConfiguracaoChaveEnum =
  (typeof ConfiguracaoChave)[keyof typeof ConfiguracaoChave];

// ==================== HELPERS PARA UI ====================

/**
 * Traduz categoria EPI para texto amigável
 */
export function getHumanReadableCategory(categoria: CategoriaEPIEnum): string {
  const mapping: Record<CategoriaEPIEnum, string> = {
    [CategoriaEPI.PROTECAO_CABECA]: "Proteção da Cabeça",
    [CategoriaEPI.PROTECAO_OLHOS]: "Proteção dos Olhos",
    [CategoriaEPI.PROTECAO_AUDITIVA]: "Proteção Auditiva",
    [CategoriaEPI.PROTECAO_RESPIRATORIA]: "Proteção Respiratória",
    [CategoriaEPI.PROTECAO_TRONCO]: "Proteção do Tronco",
    [CategoriaEPI.PROTECAO_MAOS]: "Proteção das Mãos",
    [CategoriaEPI.PROTECAO_PES]: "Proteção dos Pés",
    [CategoriaEPI.PROTECAO_QUEDAS]: "Proteção Contra Quedas",
    [CategoriaEPI.OUTROS]: "Outros",
  };
  return mapping[categoria] || categoria;
}

/**
 * Traduz status de entrega para texto amigável
 */
export function getHumanReadableStatusEntrega(
  status: StatusEntregaEnum,
): string {
  const mapping: Record<StatusEntregaEnum, string> = {
    [StatusEntrega.PENDENTE_ASSINATURA]: "Pendente Assinatura",
    [StatusEntrega.ASSINADA]: "Assinada",
    [StatusEntrega.CANCELADA]: "Cancelada",
  };
  return mapping[status] || status;
}

/**
 * Traduz status de item entrega para texto amigável
 */
export function getHumanReadableStatusEntregaItem(
  status: StatusEntregaItemEnum,
): string {
  const mapping: Record<StatusEntregaItemEnum, string> = {
    [StatusEntregaItem.COM_COLABORADOR]: "Com Colaborador",
    [StatusEntregaItem.DEVOLVIDO]: "Devolvido",
  };
  return mapping[status] || status;
}

/**
 * Retorna ícone para tipo de movimentação (Event Sourcing)
 */
export function getMovementIcon(tipo: TipoMovimentacaoEnum): string {
  const icons: Record<TipoMovimentacaoEnum, string> = {
    [TipoMovimentacao.ENTRADA_NOTA]: "➡️",
    [TipoMovimentacao.SAIDA_ENTREGA]: "⬅️",
    [TipoMovimentacao.ENTRADA_DEVOLUCAO]: "🔄",
    [TipoMovimentacao.SAIDA_DEVOLUCAO]: "🔙", // Ícone para saída de devolução
    [TipoMovimentacao.SAIDA_TRANSFERENCIA]: "↗️",
    [TipoMovimentacao.ENTRADA_TRANSFERENCIA]: "↙️",
    [TipoMovimentacao.SAIDA_DESCARTE]: "🗑️",
    [TipoMovimentacao.AJUSTE_POSITIVO]: "➕",
    [TipoMovimentacao.AJUSTE_NEGATIVO]: "➖",
    [TipoMovimentacao.ESTORNO_ENTRADA_NOTA]: "↩️",
    [TipoMovimentacao.ESTORNO_SAIDA_ENTREGA]: "↪️",
    [TipoMovimentacao.ESTORNO_ENTRADA_DEVOLUCAO]: "🔁",
    [TipoMovimentacao.ESTORNO_SAIDA_DEVOLUCAO]: "🔀", // Estorno de saída de devolução
    [TipoMovimentacao.ESTORNO_SAIDA_DESCARTE]: "♻️",
    [TipoMovimentacao.ESTORNO_SAIDA_TRANSFERENCIA]: "⤴️",
    [TipoMovimentacao.ESTORNO_ENTRADA_TRANSFERENCIA]: "⤵️",
    [TipoMovimentacao.ESTORNO_AJUSTE_POSITIVO]: "⊖",
    [TipoMovimentacao.ESTORNO_AJUSTE_NEGATIVO]: "⊕",
  };
  return icons[tipo] || "📝";
}

/**
 * Verifica se um tipo de movimentação é um estorno
 */
export function isEstorno(tipo: TipoMovimentacaoEnum): boolean {
  return tipo.startsWith("ESTORNO_");
}

/**
 * Verifica se um tipo de movimentação é uma entrada (aumenta estoque)
 */
export function isEntrada(tipo: TipoMovimentacaoEnum): boolean {
  return tipo.includes("ENTRADA") || tipo === TipoMovimentacao.AJUSTE_POSITIVO;
}

/**
 * Verifica se um tipo de movimentação é uma saída (diminui estoque)
 */
export function isSaida(tipo: TipoMovimentacaoEnum): boolean {
  return tipo.includes("SAIDA") || tipo === TipoMovimentacao.AJUSTE_NEGATIVO;
}

// ==================== EXPORTAÇÃO CONSOLIDADA ====================
export const BackendEnums = {
  CategoriaEPI,
  StatusTipoEPI,
  StatusEstoqueItem,
  TipoNota,
  StatusNota,
  TipoMovimentacao,
  StatusFicha,
  StatusEntrega,
  StatusEntregaItem,
  ConfiguracaoChave,
} as const;

// ==================== TIPOS CONSOLIDADOS ====================
export type AllEnumTypes =
  | CategoriaEPIEnum
  | StatusTipoEPIEnum
  | StatusEstoqueItemEnum
  | TipoNotaEnum
  | StatusNotaEnum
  | TipoMovimentacaoEnum
  | StatusFichaEnum
  | StatusEntregaEnum
  | StatusEntregaItemEnum
  | ConfiguracaoChaveEnum;

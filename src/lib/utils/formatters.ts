/**
 * Utilitários de formatação para UI
 */

/**
 * Formata um valor monetário para BRL
 */
export function formatCurrency(value: number): string {
  if (value === undefined || value === null) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata uma data ISO para formato legível (DD/MM/AAAA)
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  } catch (e) {
    return dateString;
  }
}

/**
 * Formata uma data ISO para formato relativo (ex: "há 2 dias")
 * Simplificado para não depender de librarias externas por enquanto
 */
export function formatRelativeDate(
  dateString: string | undefined | null,
): string {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 30) return `${diffDays} dias atrás`;

    return formatDate(dateString);
  } catch (e) {
    return dateString;
  }
}

/**
 * Mapeamento de ENUMs para textos amigáveis
 */
const ENUM_MAP: Record<string, string> = {
  // Categorias de EPI
  PROTECAO_CABECA: "Proteção de Cabeça",
  PROTECAO_AUDITIVA: "Proteção Auditiva",
  PROTECAO_RESPIRATORIA: "Proteção Respiratória",
  PROTECAO_TRONCO: "Proteção do Tronco",
  PROTECAO_MEMBROS_SUPERIORES: "Membros Superiores",
  PROTECAO_MEMBROS_INFERIORES: "Membros Inferiores",
  PROTECAO_CONTRA_QUEDAS: "Proteção Contra Quedas",

  // Status
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  EM_USO: "Em Uso",
  DISPONIVEL: "Disponível",
  MANUTENCAO: "Em Manutenção",
  DESCARTADO: "Descartado",
  PERDIDO: "Perdido",
  ROUBADO: "Roubado",
  VENCIDO: "Vencido",
  CRITICO: "Crítico",
  BAIXO: "Baixo",
  NORMAL: "Normal",
  ALTO: "Alto",

  // Cargos (se vierem como chaves)
  ELETRICISTA: "Eletricista",
  SUPERVISOR: "Supervisor",
  HELPER: "Ajudante",
  TECNICO: "Técnico",
  MOTORISTA: "Motorista",
};

/**
 * Formata chaves de ENUM (SNAKE_CASE) para Título Legível
 * Ex: PROTECAO_CABECA -> Proteção de Cabeça
 */
export function formatEnum(value: string | undefined | null): string {
  if (!value) return "-";

  // Tentar encontrar no mapa direto
  if (ENUM_MAP[value]) return ENUM_MAP[value];
  if (ENUM_MAP[value.toUpperCase()]) return ENUM_MAP[value.toUpperCase()];

  // Fallback: Converter SNAKE_CASE ou camelCase para Title Case
  return value
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word
}

/**
 * Retorna classes de cor baseadas no status/categoria
 */
export function getSemanticColor(
  value: string | undefined | null,
): "green" | "red" | "yellow" | "blue" | "indigo" | "purple" | "gray" {
  if (!value) return "gray";

  const normalized = value.toUpperCase();

  // Sucesso / Bom
  if (
    ["ATIVO", "DISPONIVEL", "NORMAL", "ENTREGUE", "CONCLUIDO", "OK"].includes(
      normalized,
    )
  )
    return "green";

  // Perigo / Erro
  if (
    ["VENCIDO", "CRITICO", "DESCARTADO", "PERDIDO", "ROUBADO", "ERRO"].includes(
      normalized,
    )
  )
    return "red";

  // Atenção / Warning
  if (["MANUTENCAO", "BAIXO", "PENDENTE", "EM_ANALISE"].includes(normalized))
    return "yellow";

  // Info / Neutro
  if (["EM_USO", "ALTO"].includes(normalized)) return "blue";

  return "gray";
}

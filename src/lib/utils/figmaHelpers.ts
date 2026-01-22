// Utilitários para acessar designs do Figma via URL
// Este arquivo facilita o acesso a referências de design específicas

export interface FigmaReference {
  url: string;
  description: string;
  component?: string;
  section?: string;
}

// Referências de design do Figma organizadas por categoria
export const FIGMA_DESIGNS = {
  fichas: {
    detailDrawer: {
      url: "https://www.figma.com/design/TwCLRJsnzdrmozHkVPHSid/M%C3%B3dulo-EPI?node-id=28-6888&t=VEat8YEcS8xUozDT-4",
      description:
        "Drawer lateral de detalhes da ficha com informações do colaborador e tabs",
      component: "FichaDetailDrawer",
      section: "Fichas EPI",
    },
  },
  // Adicionar outras referências conforme necessário
  dashboard: {},
  estoque: {},
  relatorios: {},
} as const;

/**
 * Obtém uma referência específica do Figma
 * @param category Categoria do design (fichas, dashboard, etc.)
 * @param design Nome específico do design
 * @returns Referência do Figma ou null se não encontrada
 */
export function getFigmaReference(
  category: keyof typeof FIGMA_DESIGNS,
  design: string,
): FigmaReference | null {
  const categoryDesigns = FIGMA_DESIGNS[category];
  return (categoryDesigns as any)[design] || null;
}

/**
 * Abre uma URL do Figma em nova aba
 * @param category Categoria do design
 * @param design Nome do design
 */
export function openFigmaDesign(
  category: keyof typeof FIGMA_DESIGNS,
  design: string,
): void {
  const reference = getFigmaReference(category, design);
  if (reference) {
    window.open(reference.url, "_blank", "noopener,noreferrer");
  } else {
    console.warn(`Design não encontrado: ${category}.${design}`);
  }
}

/**
 * Lista todas as referências disponíveis para uma categoria
 * @param category Categoria do design
 * @returns Array com nomes dos designs disponíveis
 */
export function listFigmaDesigns(
  category: keyof typeof FIGMA_DESIGNS,
): string[] {
  return Object.keys(FIGMA_DESIGNS[category]);
}

/**
 * Extrai o node-id de uma URL do Figma
 * @param url URL do Figma
 * @returns Node ID ou null se não encontrado
 */
export function extractFigmaNodeId(url: string): string | null {
  const match = url.match(/node-id=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Gera um comentário de desenvolvimento com referência ao Figma
 * @param category Categoria do design
 * @param design Nome do design
 * @returns String com comentário formatado
 */
export function generateFigmaComment(
  category: keyof typeof FIGMA_DESIGNS,
  design: string,
): string {
  const reference = getFigmaReference(category, design);
  if (!reference) return "";

  return `// Design Reference: ${reference.description}\n// Figma: ${reference.url}`;
}

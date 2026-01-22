/**
 * UI Mapping Helpers - Mapeamentos Simples de UI
 *
 * Substituição das funções complexas de lógica de negócio por mapeamentos
 * simples entre dados semânticos (do backend) e elementos visuais (frontend).
 */

// ==================== MAPEAMENTOS DE ÍCONES ====================

/**
 * Mapear tipo de evento para ícone (15 linhas vs 46 linhas originais)
 */
export class UIMappingHelpers {
  static getEventIcon(tipo: string): string {
    const iconMap: Record<string, string> = {
      entrega: "TruckOutline",
      devolucao: "TrashBinOutline",
      assinatura: "PenOutline",
      cancelamento: "XCircleOutline",
      criacao: "DocumentPlusOutline",
      vencimento: "ClockOutline",
      edicao: "EditOutline",
    };

    return iconMap[tipo] || "ClockOutline";
  }

  /**
   * Mapear cor semântica para classes CSS (10 linhas vs 44 linhas originais)
   */
  static getColorClasses(cor: string): string {
    const colorMap: Record<string, string> = {
      green:
        "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900",
      red: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900",
      yellow:
        "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900",
      orange:
        "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900",
      blue: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900",
      gray: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800",
    };

    return colorMap[cor] || colorMap.gray;
  }

  /**
   * Mapear cor para badge color (compatível com Flowbite)
   */
  static getBadgeColor(
    cor: string,
  ): "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none" {
    const badgeColorMap: Record<
      string,
      "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none"
    > = {
      green: "green",
      red: "red",
      yellow: "yellow",
      orange: "yellow", // Orange não existe no Flowbite, usar yellow
      blue: "blue",
      gray: "dark", // Gray não existe no Flowbite, usar dark
      primary: "primary",
      purple: "purple",
      indigo: "indigo",
      pink: "pink",
      none: "none",
    };

    return badgeColorMap[cor] || "dark";
  }

  /**
   * Formatação de dias restantes (5 linhas vs 42 linhas originais)
   */
  static formatDaysRemaining(dias: number, status: string): string {
    if (status === "vencido" || dias < 0) {
      return `${Math.abs(dias)} dias atrasado`;
    }

    if (dias === 0) {
      return "Vence hoje";
    }

    return `${dias} dias restantes`;
  }

  /**
   * Obter iniciais do nome (mantido para compatibilidade)
   */
  static getInitials(nome: string): string {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Formatação condicional de texto
   */
  static formatConditionalText(valor: any, fallback: string = "-"): string {
    if (valor === null || valor === undefined || valor === "") {
      return fallback;
    }

    return String(valor);
  }

  /**
   * Mapear status para configuração visual completa
   */
  static getStatusConfig(status: string, cor: string) {
    return {
      color: this.getBadgeColor(cor),
      classes: this.getColorClasses(cor),
      text: status,
    };
  }

  /**
   * Mapear tipo de evento para configuração completa
   */
  static getEventConfig(tipo: string, cor: string) {
    return {
      icon: this.getEventIcon(tipo),
      color: this.getBadgeColor(cor),
      classes: this.getColorClasses(cor),
    };
  }
}

// ==================== EXPORT INDIVIDUAL ====================

export const getEventIcon = UIMappingHelpers.getEventIcon;
export const getColorClasses = UIMappingHelpers.getColorClasses;
export const getBadgeColor = UIMappingHelpers.getBadgeColor;
export const formatDaysRemaining = UIMappingHelpers.formatDaysRemaining;
export const getInitials = UIMappingHelpers.getInitials;
export const formatConditionalText = UIMappingHelpers.formatConditionalText;

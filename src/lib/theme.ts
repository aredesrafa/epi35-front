/**
 * Theme Bridge - DataLife EPI
 *
 * Design tokens e utilitários de tema compatíveis com cliente/servidor.
 * Mantém consistência com tailwind.config.mjs sem importação direta.
 */

// Paletas de cores personalizadas do DataLife EPI
export const primaryColors = {
  50: "#ebf5ff",
  100: "#e1effe",
  200: "#c3ddfd",
  300: "#a4cafe",
  400: "#76a9fa",
  500: "#3f83f8",
  600: "#1c64f2",
  700: "#1a56db",
  800: "#1e429f",
  900: "#233876",
  950: "#19295A",
} as const;

export const grayColors = {
  50: "#f9fafb",
  100: "#f1f2f4",
  200: "#e1e5ea",
  300: "#b9c1cc",
  400: "#8894a9",
  500: "#535d72",
  600: "#424a5c",
  700: "#31384a",
  800: "#252937",
  900: "#1c1e29",
  950: "#1b1e28",
} as const;

export const redColors = {
  50: "#fdf2f2",
  100: "#fde8e8",
  200: "#fbd5d5",
  300: "#f8b4b4",
  400: "#ff737c",
  500: "#ff4563",
  600: "#db324e",
  700: "#b72247",
  800: "#93163b",
  900: "#7a0d31",
  950: "#5f0827",
} as const;

export const yellowColors = {
  50: "#fdfdea",
  100: "#fdf6b2",
  200: "#fee688",
  300: "#fdc96a",
  400: "#fdaf39",
  500: "#d98c29",
  600: "#b66c1c",
  700: "#924f12",
  800: "#633112",
  900: "#633112",
  950: "#4a240d",
} as const;

export const greenColors = {
  50: "#e7fef4",
  100: "#cafce6",
  200: "#96fad7",
  300: "#60f2cc",
  400: "#1cd8b9",
  500: "#00b8aa",
  600: "#00a6a8",
  700: "#008898",
  800: "#00627a",
  900: "#004865",
  950: "#003550",
} as const;

export const orangeColors = {
  50: "#fff8f1",
  100: "#feecdc",
  200: "#fcd9bd",
  300: "#fdba8c",
  400: "#ff8a4c",
  500: "#ff5a1f",
  600: "#d03801",
  700: "#b43403",
  800: "#8a2c0d",
  900: "#771d1d",
  950: "#5c1516",
} as const;

// Cores base personalizadas para acesso programático
export const colors = {
  primary: primaryColors,
  gray: grayColors,
  red: redColors,
  yellow: yellowColors,
  green: greenColors,
  orange: orangeColors,
} as const;

// Mapeamento de cores semânticas com paletas personalizadas
export const semanticColors = {
  success: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
    button: "green",
    hex: greenColors[500], // #00b8aa
  },
  error: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    button: "red",
    hex: redColors[500], // #ff4563
  },
  warning: {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
    button: "yellow",
    hex: yellowColors[500], // #d98c29
  },
  info: {
    bg: "bg-primary-100 dark:bg-primary-900",
    text: "text-primary-700 dark:text-primary-300",
    border: "border-primary-200 dark:border-primary-800",
    button: "primary",
    hex: primaryColors[500], // #3f83f8
  },
  primary: {
    bg: "bg-primary-100 dark:bg-primary-900",
    text: "text-primary-700 dark:text-primary-300",
    border: "border-primary-200 dark:border-primary-800",
    button: "primary",
    hex: primaryColors[500], // #3f83f8
  },
  neutral: {
    bg: "bg-gray-100 dark:bg-gray-900",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-800",
    button: "alternative",
    hex: grayColors[500], // #535d72
  },
} as const;

// Espaçamentos padronizados baseados no tema
export const spacing = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

// Classes de espaçamento para uso direto
export const spacingClasses = {
  xs: "space-y-2",
  sm: "space-y-3",
  md: "space-y-4",
  lg: "space-y-6",
  xl: "space-y-8",
} as const;

// Padding classes padronizadas
export const paddingClasses = {
  xs: "p-2",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
} as const;

// Border radius padronizado
export const borderRadius = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} as const;

// Shadows padronizadas
export const shadows = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
} as const;

// Tipo para cores semânticas
type SemanticColorConfig = (typeof semanticColors)[keyof typeof semanticColors];

// Função helper para obter cor por status
export function getStatusColor(status: string): SemanticColorConfig {
  switch (status.toLowerCase()) {
    case "success":
    case "ativo":
    case "active":
    case "disponivel":
    case "assinado":
      return semanticColors.success;

    case "error":
    case "danger":
    case "vencido":
    case "expired":
    case "esgotado":
    case "desligado":
      return semanticColors.error;

    case "warning":
    case "baixo_estoque":
    case "low_stock":
    case "suspenso":
    case "afastado":
    case "nao_assinado":
    case "pendente":
      return semanticColors.warning;

    case "info":
    case "arquivado":
    case "inativo":
    case "inactive":
      return semanticColors.info;

    default:
      return semanticColors.neutral;
  }
}

// Função helper para obter cor Flowbite por status
export function getFlowbiteColor(status: string): string {
  return getStatusColor(status).button;
}

// Classes de formulário padronizadas
export const formClasses = {
  label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
  labelRequired:
    'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 after:content-["*"] after:text-red-500 after:ml-1',
  input: "rounded-sm",
  inputError:
    "rounded-sm border-red-500 focus:border-red-500 focus:ring-red-500",
  error: "text-sm text-red-600 dark:text-red-500 mt-1",
  helper: "text-sm text-gray-500 dark:text-gray-400 mt-1",
} as const;

// Classes de botão padronizadas
export const buttonClasses = {
  base: "rounded-sm font-medium focus:ring-2 focus:ring-offset-2 transition-colors duration-200",
  sizes: {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  },
} as const;

// Breakpoints responsivos
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Configurações centralizadas de cores para status
export const statusColors = {
  // Status de estoque
  DISPONIVEL: "green",
  disponivel: "green",
  BAIXO: "yellow",
  baixo: "yellow",
  INDISPONIVEL: "red",
  indisponivel: "red",
  ZERO: "red",
  zero: "red",

  // Status gerais
  ATIVO: "green",
  ativo: "green",
  ativa: "green", // Para fichas
  INATIVO: "gray",
  inativo: "gray",
  inativa: "gray", // Para fichas
  VENCIDO: "red",
  vencido: "red",
  vencida: "red", // Para fichas
  PENDENTE: "yellow",
  pendente: "yellow",

  // Status de fichas
  AGUARDANDO_ASSINATURA: "yellow",
  aguardando_assinatura: "yellow",
  ASSINADA: "green",
  assinada: "green",
  CANCELADA: "red",
  cancelada: "red",

  // Status de entrega
  COM_COLABORADOR: "blue",
  com_colaborador: "blue",
  DEVOLVIDO: "gray",
  devolvido: "gray",

  // Status de movimento
  entrada: "green",
  saida: "red",
  ajuste: "blue",
  transferencia: "blue",
} as const;

export const statusColorsHex = {
  ATIVO: greenColors[500], // #00B8AA
  ativo: greenColors[500],
  ativa: greenColors[500],
  INATIVO: grayColors[500], // #535D72
  inativo: grayColors[500],
  inativa: grayColors[500],
  VENCIDO: redColors[500], // #FF4563
  vencido: redColors[500],
  vencida: redColors[500],
  DISPONIVEL: greenColors[600], // #00a6a8
  disponivel: greenColors[600],
  BAIXO: yellowColors[500], // #d98c29
  baixo: yellowColors[500],
  INDISPONIVEL: redColors[600], // #db324e
  indisponivel: redColors[600],
} as const;

// Tipos TypeScript para type safety
export type SemanticColor = keyof typeof semanticColors;
export type SpacingSize = keyof typeof spacing;
export type PaddingClass = keyof typeof paddingClasses;
export type BorderRadiusClass = keyof typeof borderRadius;
export type ShadowClass = keyof typeof shadows;
export type ButtonSize = keyof typeof buttonClasses.sizes;
export type StatusColor = keyof typeof statusColors;

// Utilitários para trabalhar com fichas EPI
// Inclui funções para navegação, links diretos e manipulação de URLs

/**
 * Gera URL para abrir drawer de ficha específica
 * @param fichaId ID da ficha a ser visualizada
 * @returns URL completa para abrir drawer na página de fichas
 */
export function getFichaDrawerUrl(fichaId: string): string {
  return `/fichas?ficha=${encodeURIComponent(fichaId)}`;
}

/**
 * Gera URL para página completa da ficha
 * @param fichaId ID da ficha
 * @returns URL para página completa da ficha
 */
export function getFichaPageUrl(fichaId: string): string {
  return `/fichas/${encodeURIComponent(fichaId)}`;
}

/**
 * Extrai ID da ficha da URL atual
 * @param url URL object da página atual
 * @returns ID da ficha se presente na URL, null caso contrário
 */
export function extractFichaIdFromUrl(url: URL): string | null {
  return url.searchParams.get("ficha");
}

/**
 * Verifica se uma URL é de drawer de ficha
 * @param url URL object a ser verificada
 * @returns true se a URL contém parâmetro de ficha
 */
export function isDrawerUrl(url: URL): boolean {
  return url.searchParams.has("ficha");
}

/**
 * Cria link copiável para compartilhar ficha específica
 * @param fichaId ID da ficha
 * @param baseUrl URL base do site (ex: https://app.datalife.com)
 * @returns URL completa e copiável
 */
export function createShareableFichaLink(
  fichaId: string,
  baseUrl: string = "",
): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  return `${cleanBaseUrl}${getFichaDrawerUrl(fichaId)}`;
}

/**
 * Gera dados para QR Code de ficha
 * @param fichaId ID da ficha
 * @param colaboradorNome Nome do colaborador (opcional)
 * @param baseUrl URL base do site
 * @returns Objeto com dados para QR Code
 */
export function generateFichaQRData(
  fichaId: string,
  colaboradorNome?: string,
  baseUrl: string = "",
) {
  return {
    url: createShareableFichaLink(fichaId, baseUrl),
    data: {
      type: "ficha_epi",
      fichaId,
      colaboradorNome,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Valida se um ID de ficha tem formato válido
 * @param fichaId ID a ser validado
 * @returns true se o formato é válido
 */
export function isValidFichaId(fichaId: string): boolean {
  // Aceitar UUIDs ou IDs alfanuméricos com hífen/underscore
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const alphanumericRegex = /^[a-zA-Z0-9_-]+$/;

  return (
    fichaId.length > 0 &&
    (uuidRegex.test(fichaId) || alphanumericRegex.test(fichaId))
  );
}

/**
 * Gera objeto de navegação para use com SvelteKit goto
 * @param fichaId ID da ficha
 * @param currentUrl URL atual
 * @returns Objeto com pathname e search params
 */
export function buildFichaNavigation(fichaId: string, currentUrl: URL) {
  const url = new URL(currentUrl);
  url.pathname = "/fichas";
  url.searchParams.set("ficha", fichaId);

  return {
    pathname: url.pathname,
    search: url.search,
    fullUrl: url.toString(),
  };
}

// Constantes úteis
export const FICHA_URL_PATTERNS = {
  drawer: /^\/fichas\?.*ficha=([^&]+)/,
  page: /^\/fichas\/(.+)$/,
} as const;

/**
 * Analisa URL e determina tipo de visualização de ficha
 * @param pathname Pathname da URL
 * @param search Search params da URL
 * @returns Tipo de visualização e ID da ficha
 */
export function parseFichaUrl(pathname: string, search: string) {
  const fullPath = pathname + search;

  // Verificar se é drawer
  const drawerMatch = fullPath.match(FICHA_URL_PATTERNS.drawer);
  if (drawerMatch) {
    return {
      type: "drawer" as const,
      fichaId: decodeURIComponent(drawerMatch[1]),
    };
  }

  // Verificar se é página completa
  const pageMatch = pathname.match(FICHA_URL_PATTERNS.page);
  if (pageMatch) {
    return {
      type: "page" as const,
      fichaId: decodeURIComponent(pageMatch[1]),
    };
  }

  return {
    type: null,
    fichaId: null,
  };
}

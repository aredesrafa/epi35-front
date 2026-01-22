/**
 * Utilitários para gerar links diretos para fichas EPI
 */

import { base } from '$app/paths';

/**
 * Gera um link direto para uma ficha EPI
 * @param fichaId - ID da ficha
 * @param baseUrl - URL base (opcional, para uso em contextos sem SvelteKit)
 * @returns URL completa para a ficha
 */
export function generateFichaLink(fichaId: string, baseUrl?: string): string {
  const url = new URL('/fichas', baseUrl || window.location.origin);
  url.searchParams.set('ficha', fichaId);
  return url.toString();
}

/**
 * Gera um link direto para uma ficha EPI (versão relativa)
 * @param fichaId - ID da ficha
 * @returns URL relativa para a ficha
 */
export function generateFichaLinkRelative(fichaId: string): string {
  return `${base}/fichas?ficha=${fichaId}`;
}

/**
 * Extrai o ID da ficha de uma URL
 * @param url - URL ou string de search params
 * @returns ID da ficha ou null se não encontrado
 */
export function extractFichaIdFromUrl(url: string | URL): string | null {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  return urlObj.searchParams.get('ficha');
}

/**
 * Verifica se uma URL é um link direto para ficha
 * @param url - URL para verificar
 * @returns true se é um link direto para ficha
 */
export function isFichaDirectLink(url: string | URL): boolean {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  return urlObj.pathname.endsWith('/fichas') && urlObj.searchParams.has('ficha');
}

/**
 * Copia link da ficha para a área de transferência
 * @param fichaId - ID da ficha
 * @param baseUrl - URL base opcional
 * @returns Promise que resolve quando o link é copiado
 */
export async function copyFichaLink(fichaId: string, baseUrl?: string): Promise<void> {
  const link = generateFichaLink(fichaId, baseUrl);
  
  try {
    await navigator.clipboard.writeText(link);
    console.log('✅ Link da ficha copiado:', link);
  } catch (error: any) {
    console.error('❌ Erro ao copiar link da ficha:', error);
    
    // Fallback para browsers mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = link;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      console.log('✅ Link da ficha copiado (fallback):', link);
    } catch (fallbackError) {
      console.error('❌ Erro no fallback de cópia:', fallbackError);
      throw new Error('Não foi possível copiar o link');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}
/**
 * Page Load Function - Estoque
 * 
 * Define que esta página não possui form actions e é uma página regular.
 * Também desabilita SSR para evitar problemas de hidratação.
 */

import type { PageLoad } from './$types';

// Desabilitar SSR para esta página específica
export const ssr = false;
export const csr = true;

export const load: PageLoad = async () => {
  return {};
};
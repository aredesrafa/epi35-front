/**
 * Layout Load Function - Inicialização Global da Aplicação
 *
 * Carrega configurações globais e inicializa stores antes de renderizar qualquer página.
 * Garante que as configurações do backend estejam disponíveis em toda a aplicação.
 */

import type { LayoutLoad } from "./$types";

// Habilita prerendering para GitHub Pages
export const prerender = true;

export const load: LayoutLoad = async ({ fetch }) => {
  // Não carregar configurações durante SSR para evitar problemas de CORS
  // As configurações serão carregadas no cliente via +layout.svelte

  console.log("🚀 Inicializando aplicação - SSR mode");

  return {
    // Configurações padrão para SSR, serão substituídas no cliente
    configuration: {
      PERMITIR_ESTOQUE_NEGATIVO: false,
      PERMITIR_AJUSTES_FORCADOS: false,
      ESTOQUE_MINIMO_EQUIPAMENTO: 10,
      useV2Routes: false,
      enableAdvancedReports: true,
    },
  };
};

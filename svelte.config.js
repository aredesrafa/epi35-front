import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Configuração para GitHub Pages
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null,
      precompress: false,
      strict: false
    }),
    prerender: {
      handleHttpError: 'warn'
    },
    paths: {
      base: process.env.NODE_ENV === 'production' ? '/epi35-front' : '',
    },
  },
};

export default config;

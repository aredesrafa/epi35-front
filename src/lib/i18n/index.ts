import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('pt-BR', () => import('./locales/pt-BR.json'));
register('en-US', () => import('./locales/en-US.json'));

init({
  fallbackLocale: 'pt-BR',
  initialLocale: getLocaleFromNavigator(),
});

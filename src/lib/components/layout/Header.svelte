<script lang="ts">
  import { Button, Avatar, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import { BellOutline, MoonOutline, SunOutline, BarsOutline, GridOutline, LanguageOutline } from 'flowbite-svelte-icons';
  import { _, locale, locales } from 'svelte-i18n';
  import CompanySelector from '../common/CompanySelector.svelte';
  import { themeStore } from '$lib/stores/themeStore';
  import { selectedCompanyStore } from '$lib/stores/companyStore';
  import { writable, derived } from 'svelte/store';
  import { base } from '$app/paths';
  
  // Notificações reativas com store
  const notificationsStore = writable([
    { id: 1, title: 'EPI Vencendo', message: 'Capacete de João Silva vence em 5 dias', time: 'há 2 horas', read: false },
    { id: 2, title: 'Estoque Baixo', message: 'Luvas de segurança com apenas 3 unidades', time: 'há 4 horas', read: false },
    { id: 3, title: 'Nova Entrega', message: 'EPIs entregues para Maria Santos', time: 'há 1 dia', read: true }
  ]);
  
  // Derived store para contagem de não lidas
  const unreadCount = derived(notificationsStore, $notifications => 
    $notifications.filter(n => !n.read).length
  );
  
  
  function toggleTheme() {
    themeStore.toggle();
  }

  function changeLanguage(newLocale: string) {
    locale.set(newLocale);
  }
  
  function toggleSidebar() {
    // Dispatch custom event for MainLayout to handle
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }
  
  function handleAppsClick() {
    // Implementar navegação entre módulos futuramente
    console.log('Apps clicked - implementar navegação entre módulos');
  }
  
  // Reactive variables para detectar tipo da empresa
  $: companyBadge = $selectedCompanyStore.badge?.toLowerCase();
  $: isAdminCompany = companyBadge === 'admin';
  $: isHoldingCompany = companyBadge === 'holding';
  $: isContratadaCompany = companyBadge === 'contratada';
  
  // Classes do header baseadas no tipo da empresa
  $: headerClasses = (() => {
    if (isAdminCompany) {
      return 'bg-gray-800 border-gray-700 text-white';
    } else if (isHoldingCompany) {
      return 'bg-primary-900 border-primary-800 text-white';
    } else if (isContratadaCompany) {
      return 'bg-primary-800 border-primary-700 text-white';
    } else {
      return 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  })();
  
  // Classes dos botões baseadas no tipo da empresa
  $: buttonClasses = (() => {
    if (isAdminCompany) {
      return 'text-white hover:bg-gray-900 focus:ring-0 focus:outline-none';
    } else if (isHoldingCompany) {
      return 'text-white hover:bg-black/20 focus:ring-0 focus:outline-none';
    } else if (isContratadaCompany) {
      return 'text-white hover:bg-primary-900 focus:ring-0 focus:outline-none';
    } else {
      return 'hover:bg-gray-200 dark:hover:bg-gray-900 focus:ring-0 focus:outline-none';
    }
  })();
  
  $: needsCustomColor = isAdminCompany || isHoldingCompany || isContratadaCompany;
</script>

<!-- Header fixo -->
<header class="px-4 h-16 fixed left-0 right-0 top-0 z-50 border-b {headerClasses}">
  <div class="flex items-center w-full h-full">
    <!-- Mobile menu button -->
    <button 
      type="button" 
      class="lg:hidden rounded-sm p-2 {buttonClasses}" 
      on:click={toggleSidebar}
    >
      <BarsOutline class="w-5 h-5" />
    </button>
    
    <!-- Logo -->
    <div class="flex items-center">
      <div class="flex items-center mr-3">
        <img 
          src="{base}/logo-icon.svg" 
          alt="DataLife Logo" 
          class="w-8 h-8 mr-2"
        />
        <img 
          src="{base}/logo-text.svg" 
          alt="DataLife" 
          class="h-5"
        />
      </div>
    </div>
    
    <!-- Module Header - Componente único clicável -->
    <div class="hidden lg:flex items-center" style="margin-left: 108px;">
      <button 
        type="button" 
        class="flex items-center gap-2 p-2 rounded-sm {buttonClasses}" 
        on:click={handleAppsClick}
      >
        <GridOutline class="w-4 h-4" />
        <span class="text-base font-normal {needsCustomColor ? 'text-white' : 'text-gray-900 dark:text-white'}">
          Gestão de EPI
        </span>
      </button>
    </div>
    
    <!-- Spacer -->
    <div class="flex-1"></div>
    
    <!-- Right side actions -->
    <div class="flex items-center space-x-3">
      <!-- Company Selector -->
      <CompanySelector headerType={companyBadge} />
      
      <!-- Notifications -->
      <div class="relative">
        <button 
          type="button" 
          class="rounded-sm p-2 relative {buttonClasses}" 
        >
          <BellOutline class="w-5 h-5" />
          {#if $unreadCount > 0}
            <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
              {$unreadCount > 9 ? '9+' : $unreadCount}
            </span>
          {/if}
        </button>
        <Dropdown placement="bottom-end" class="w-80">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">{$_('header.notifications')}</h3>
        </div>
        {#each $notificationsStore as notification (notification.id)}
          <DropdownItem 
            class="flex flex-col items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-700 {!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
            on:click={() => {
              notificationsStore.update(notifications => 
                notifications.map(n => n.id === notification.id ? {...n, read: true} : n)
              );
            }}
          >
            <div class="flex items-start justify-between w-full">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-white text-sm">
                    {notification.title}
                  </p>
                  {#if !notification.read}
                    <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                  {/if}
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-xs mt-1">
                  {notification.message}
                </p>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {notification.time}
              </span>
            </div>
          </DropdownItem>
        {/each}
        <DropdownDivider />
        <DropdownItem class="text-center text-primary-600 hover:text-primary-700 dark:text-primary-400">
          {$_('header.view_all_notifications')}
        </DropdownItem>
      </Dropdown>
      </div>
      
      <!-- User menu otimizado -->
      <div class="relative">
        <Avatar 
          src="" 
          alt="Usuário do Sistema" 
          class="cursor-pointer ring-2 ring-transparent hover:ring-primary-500 transition-all duration-200 focus:ring-0 focus:outline-none" 
          size="sm"
        />
        <Dropdown placement="bottom-end" class="w-48">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-900 dark:text-white font-medium">Admin</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">admin@datalife.com</p>
          </div>
          <DropdownItem class="flex items-center gap-2 text-sm">
            <div class="w-4 h-4 bg-gray-400 rounded"></div>
            {$_('header.profile')}
          </DropdownItem>
          <DropdownItem class="flex items-center gap-2 text-sm" href="{base}/configuracoes">
            <div class="w-4 h-4 bg-gray-400 rounded"></div>
            {$_('header.settings')}
          </DropdownItem>
          <DropdownItem class="flex items-center gap-2 text-sm" on:click={toggleTheme}>
            {#if $themeStore === 'dark'}
              <SunOutline class="w-4 h-4" />
              {$_('header.theme_light')}
            {:else}
              <MoonOutline class="w-4 h-4" />
              {$_('header.theme_dark')}
            {/if}
          </DropdownItem>
          <DropdownItem class="flex items-center gap-2 text-sm">
             <LanguageOutline class="w-4 h-4" />
             <span class="mr-2">{$_('header.language')}</span>
             <div class="flex gap-2">
               <button 
                 class="px-2 py-0.5 text-xs rounded-sm transition-colors {$locale === 'pt-BR' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}"
                 on:click|stopPropagation={() => changeLanguage('pt-BR')}
               >
                 PT
               </button>
               <button 
                 class="px-2 py-0.5 text-xs rounded-sm transition-colors {$locale === 'en-US' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}"
                 on:click|stopPropagation={() => changeLanguage('en-US')}
               >
                 EN
               </button>
             </div>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem class="text-red-600 flex items-center gap-2 text-sm">
            <div class="w-4 h-4 bg-red-400 rounded"></div>
            {$_('header.logout')}
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  </div>
</header>
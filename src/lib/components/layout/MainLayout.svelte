<script lang="ts">
  import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper, SidebarDropdownWrapper, SidebarDropdownItem } from 'flowbite-svelte';
  import { 
    HomeOutline, 
    FileOutline, 
    CartOutline, 
    FileDocOutline,
    ChartOutline,
    ArrowRightAltOutline,
    FolderOpenOutline,
    CogOutline
  } from 'flowbite-svelte-icons';
  import Header from './Header.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  const menuItems = [
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: HomeOutline 
    },
    { 
      href: '/fichas', 
      label: 'Fichas EPI', 
      icon: FileDocOutline 
    },
    { 
      label: 'Gestão Estoque', 
      icon: FolderOpenOutline,
      dropdown: [
        { href: '/estoque', label: 'Estoque' },
        { href: '/notas', label: 'Notas' },
        { href: '/catalogo', label: 'Catálogo' }
      ]
    },
    { 
      label: 'Relatórios', 
      icon: ChartOutline,
      dropdown: [
        { href: '/relatorios/auditoria', label: 'Auditoria' }
      ]
    }
  ];
  
  $: currentPath = $page.url.pathname;
  let sidebarOpen = false;
  
  // Listen for sidebar toggle events from Header
  onMount(() => {
    const handleSidebarToggle = () => {
      sidebarOpen = !sidebarOpen;
    };
    
    // Custom event from Header component
    window.addEventListener('toggle-sidebar', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleSidebarToggle);
    };
  });
  
  function closeSidebar() {
    sidebarOpen = false;
  }
  
  // Close sidebar when clicking on a link (mobile)
  function handleSidebarLinkClick() {
    if (window.innerWidth < 1024) { // lg breakpoint
      sidebarOpen = false;
    }
  }
</script>

<!-- Header fixo no topo -->
<Header />

<!-- Mobile sidebar overlay -->
{#if sidebarOpen}
  <div
    class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed top-16 left-0 right-0 bottom-0 z-30 lg:hidden"
    on:click={closeSidebar}
    on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
    tabindex="-1"
    role="button"
    aria-label="Close sidebar"
  ></div>
{/if}

<!-- Sidebar fixo do lado esquerdo -->
<aside 
  class="fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] transition-transform {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0 dark:bg-gray-800 dark:border-gray-700" 
  id="drawer-navigation"
>
  <div class="h-full overflow-y-auto bg-white dark:bg-gray-800">
    <!-- Menu Items -->
    <Sidebar class="pb-6">
      <SidebarWrapper>
        <SidebarGroup>
          {#each menuItems as item}
            {#if item.dropdown}
              <SidebarDropdownWrapper 
                label={item.label}
                btnClass="flex items-center w-full p-2 text-sm text-gray-900 transition duration-75 rounded-sm group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <svelte:fragment slot="icon">
                  <svelte:component this={item.icon} class="w-5 h-5" />
                </svelte:fragment>
                
                {#each item.dropdown as dropdownItem}
                  <SidebarDropdownItem 
                    href={dropdownItem.href}
                    label={dropdownItem.label}
                    active={currentPath === dropdownItem.href}
                    class="text-sm {currentPath === dropdownItem.href ? 'text-primary-600 dark:text-primary-400' : ''}"
                    on:click={handleSidebarLinkClick}
                  />
                {/each}
              </SidebarDropdownWrapper>
            {:else}
              <SidebarItem 
                href={item.href}
                label={item.label}
                active={currentPath === item.href}
                class="text-sm {currentPath === item.href ? 'text-primary-600 dark:text-primary-400' : ''}"
                on:click={handleSidebarLinkClick}
              >
                <svelte:fragment slot="icon">
                  <svelte:component this={item.icon} class="w-5 h-5" />
                </svelte:fragment>
              </SidebarItem>
            {/if}
          {/each}
        </SidebarGroup>
      </SidebarWrapper>
    </Sidebar>
    
    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
      <a 
        href="/configuracoes" 
        class="flex items-center p-2 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-75 {currentPath === '/configuracoes' ? 'text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-700' : 'text-gray-900 dark:text-white'}"
        on:click={handleSidebarLinkClick}
      >
        <CogOutline class="w-5 h-5 mr-3" />
        <span>Configurações</span>
      </a>
    </div>
  </div>
</aside>

<!-- Main content area -->
<div class="p-4 lg:ml-64 bg-gray-50 dark:bg-gray-900 min-h-screen">
  <div class="pt-16">
    <slot />
  </div>
</div>
<script lang="ts">
  import { Button, Dropdown, DropdownItem, DropdownDivider, Badge, Input } from 'flowbite-svelte';
  import { ChevronDownOutline, BuildingOutline } from 'flowbite-svelte-icons';
  import { companies, selectedCompanyStore, type Company } from '$lib/stores/companyStore';
  
  // Props para integração com o header (usado pelo Header.svelte)
  export let headerType: 'admin' | 'holding' | 'contratada' | 'default' = 'default';

  // Função para selecionar empresa
  function selectCompany(company: Company) {
    selectedCompanyStore.set(company);
  }

  // Reactive variable para empresa atual
  $: selectedCompany = $selectedCompanyStore;
  
  // Estado da busca
  let searchTerm = '';
  
  // Filtrar empresas baseado na busca
  $: filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Agrupar empresas por tipo
  $: groupedCompanies = {
    admin: filteredCompanies.filter(company => company.badge.toLowerCase() === 'admin'),
    holding: filteredCompanies.filter(company => company.badge.toLowerCase() === 'holding'),
    contratada: filteredCompanies.filter(company => company.badge.toLowerCase() === 'contratada')
  };
  
  // Função para obter cor da badge
  function getBadgeColor(badge: string) {
    switch (badge.toLowerCase()) {
      case 'admin':
        return 'dark';
      default: // contratada, holding
        return 'gray';
    }
  }
  
  // Função para obter classes do botão baseado no header
  function getButtonClasses() {
    const badge = selectedCompany.badge.toLowerCase(); // Use selectedCompany.badge directly

    if (badge === 'admin') {
      return 'text-white hover:bg-gray-900 focus:ring-0 focus:outline-none';
    } else if (badge === 'holding') {
      return 'text-white hover:bg-black/20 focus:ring-0 focus:outline-none';
    } else if (badge === 'contratada') {
      return 'text-white hover:bg-primary-900 focus:ring-0 focus:outline-none';
    } else {
      // Default case, e.g., if no badge or unknown badge
      return 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-900 focus:ring-0 focus:outline-none';
    }
  }
  
  // Função para obter classes do texto
  function getTextClasses() {
    const badge = selectedCompany.badge.toLowerCase();
    
    if (badge === 'admin' || badge === 'holding' || badge === 'contratada') {
      return 'text-white';
    } else {
      return 'text-gray-900 dark:text-white';
    }
  }
  
  // Função para obter classes do ícone
  function getIconClasses() {
    const badge = selectedCompany.badge.toLowerCase();
    
    if (badge === 'admin' || badge === 'holding' || badge === 'contratada') {
      return 'text-white';
    } else {
      return 'text-gray-600 dark:text-gray-400';
    }
  }
</script>

<div class="relative">
  <button 
    type="button" 
    class="rounded-sm flex items-center gap-2 px-3 py-2 w-60 border-0 focus:ring-0 focus:outline-none {getButtonClasses()}"
  >
    <!-- Ícone (extremo esquerdo) -->
    <BuildingOutline class="w-4 h-4 flex-shrink-0 {getIconClasses()}" />
    
    <!-- Nome e Badge (área flexível) -->
    <div class="flex-1 flex items-center gap-2 min-w-0">
      <span class="text-sm font-medium {getTextClasses()} truncate">
        {selectedCompany.name}
      </span>
      <Badge 
        color={getBadgeColor(selectedCompany.badge)} 
        class="text-xs px-1 py-0.5 rounded-sm flex-shrink-0"
      >
        {selectedCompany.badge}
      </Badge>
    </div>
    
    <!-- Chevron (extremo direito) -->
    <ChevronDownOutline class="w-4 h-4 flex-shrink-0 {getIconClasses()}" />
  </button>

  <Dropdown placement="bottom-start" class="w-72">
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <Input 
        bind:value={searchTerm}
        placeholder="Buscar empresa..."
        size="sm"
        class="rounded-sm"
      />
    </div>

    <!-- Seção Admin -->
    {#if groupedCompanies.admin.length > 0}
      <div class="px-4 py-2">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Admin</h4>
      </div>
      {#each groupedCompanies.admin as company (company.id)}
        <DropdownItem 
          class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 {selectedCompany.id === company.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}"
          on:click={() => selectCompany(company)}
        >
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
              <BuildingOutline class="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {company.name}
            </span>
          </div>
          
          {#if selectedCompany.id === company.id}
            <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
          {/if}
        </DropdownItem>
      {/each}
    {/if}

    <!-- Seção Holdings -->
    {#if groupedCompanies.holding.length > 0}
      <div class="px-4 py-2 {groupedCompanies.admin.length > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Holdings</h4>
      </div>
      {#each groupedCompanies.holding as company (company.id)}
        <DropdownItem 
          class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 {selectedCompany.id === company.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}"
          on:click={() => selectCompany(company)}
        >
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
              <BuildingOutline class="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {company.name}
            </span>
          </div>
          
          {#if selectedCompany.id === company.id}
            <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
          {/if}
        </DropdownItem>
      {/each}
    {/if}

    <!-- Seção Contratadas -->
    {#if groupedCompanies.contratada.length > 0}
      <div class="px-4 py-2 {(groupedCompanies.admin.length > 0 || groupedCompanies.holding.length > 0) ? 'border-t border-gray-200 dark:border-gray-700' : ''}">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contratadas</h4>
      </div>
      {#each groupedCompanies.contratada as company (company.id)}
        <DropdownItem 
          class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 {selectedCompany.id === company.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}"
          on:click={() => selectCompany(company)}
        >
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
              <BuildingOutline class="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {company.name}
            </span>
          </div>
          
          {#if selectedCompany.id === company.id}
            <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
          {/if}
        </DropdownItem>
      {/each}
    {/if}

    <DropdownDivider />
    
    <DropdownItem class="text-center text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm">
      Gerenciar Empresas
    </DropdownItem>
  </Dropdown>
</div>
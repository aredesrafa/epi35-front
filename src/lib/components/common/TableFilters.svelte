<!--
  Componente de Filtros Padronizado para Tabelas
  
  Este componente implementa o padrão visual do Figma:
  - Filtros integrados dentro do container da tabela
  - Layout horizontal responsivo
  - Campo de busca expansível
  - Filtros com largura mínima consistente
  - Informações de resultado na parte inferior
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Input, Checkbox } from 'flowbite-svelte';
  import { SearchOutline, RefreshOutline } from 'flowbite-svelte-icons';
  import SearchableDropdown from './SearchableDropdown.svelte';
  
  // ==================== PROPS ====================
  
  export let searchValue: string = '';
  export let searchPlaceholder: string = 'Buscar...';
  export let filters: Array<{
    key: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    placeholder: string;
  }> = [];
  export let checkboxFilters: Array<{
    key: string;
    checked: boolean;
    label: string;
  }> = [];
  export let dateFilters: Record<string, string> | null = null;
  export let resultCount: number = 0;
  export let totalCount: number = 0;
  export let resultLabel: string = 'resultados';
  export let showClearButton: boolean = false;
  
  // ==================== EVENTS ====================
  
  const dispatch = createEventDispatcher<{
    searchChange: { value: string };
    filterChange: { key: string; value: string };
    checkboxChange: { key: string; checked: boolean };
    clearFilters: void;
  }>();
  
  // ==================== HANDLERS ====================
  
  function handleSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    dispatch('searchChange', { value });
  }
  
  function handleFilterChange(key: string, value: string): void {
    dispatch('filterChange', { key, value });
  }
  
  function handleCheckboxChange(key: string, checked: boolean): void {
    dispatch('checkboxChange', { key, checked });
  }

  // Função auxiliar para eventos de checkbox - compatível com Svelte
  function handleCheckboxEvent(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    handleCheckboxChange(key, target.checked);
  }
  
  function handleClearFilters(): void {
    dispatch('clearFilters');
  }
</script>

<!-- Filtros integrados no topo da tabela - Padrão Figma -->
<div class="p-4 border-b border-gray-100 dark:border-gray-700">
  <div class="flex items-center gap-4 flex-wrap">
    <!-- Campo de busca expansível -->
    <div class="relative flex-1 max-w-md">
      <SearchOutline class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <Input
        type="text"
        placeholder={searchPlaceholder}
        class="pl-10 rounded-sm h-10 text-sm"
        value={searchValue}
        on:input={handleSearchInput}
      />
    </div>
    
    <!-- Filtros dropdown -->
    {#each filters as filter}
      <SearchableDropdown
        options={filter.options}
        value={filter.value}
        placeholder={filter.placeholder}
        customClass="min-w-[140px]"
        on:change={(e) => handleFilterChange(filter.key, e.detail)}
      />
    {/each}

    <!-- Filtros de Data (Opcional) -->
    {#if dateFilters}
      <div class="flex items-center gap-2">
        <Input
          type="date"
          class="rounded-sm h-10 text-sm max-w-[150px]"
          placeholder="Data Início"
          value={dateFilters?.dataInicio || ''}
          on:input={(e) => dispatch('filterChange', { key: 'dataInicio', value: e.currentTarget.value })}
        />
        <span class="text-gray-400">-</span>
        <Input
          type="date"
          class="rounded-sm h-10 text-sm max-w-[150px]"
          placeholder="Data Fim"
          value={dateFilters?.dataFim || ''}
          on:input={(e) => dispatch('filterChange', { key: 'dataFim', value: e.currentTarget.value })}
        />
      </div>
    {/if}
    
    <!-- Filtros checkbox -->
    {#each checkboxFilters as checkboxFilter}
      <div class="flex items-center">
        <Checkbox 
          checked={checkboxFilter.checked}
          on:change={(e) => handleCheckboxEvent(checkboxFilter.key, e)}
          class="text-sm"
        >
          {checkboxFilter.label}
        </Checkbox>
      </div>
    {/each}
    
    <!-- Botão de limpar filtros -->
    {#if showClearButton}
      <button
        type="button"
        class="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        on:click={handleClearFilters}
        title="Limpar filtros"
      >
        <RefreshOutline class="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
    {/if}
  </div>

  <!-- Informações de resultado -->
  <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
    <div class="text-sm text-gray-600 dark:text-gray-400">
      {resultCount} de {totalCount} {resultLabel} encontrado{resultCount !== 1 ? 's' : ''}
    </div>
  </div>
</div>
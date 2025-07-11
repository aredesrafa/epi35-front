<!--
  Fichas Filters - Componente de Filtros
  Responsabilidade: Interface e lógica de filtros
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Input, Button, Select, Badge } from 'flowbite-svelte';
  import { SearchOutline, FilterOutline, RefreshOutline, CloseOutline } from 'flowbite-svelte-icons';
  
  import { 
    fichasFiltersStore, 
    fichasConfigStore, 
    hasActiveFilters, 
    activeFiltersCount, 
    filtersDisplay,
    dropdownOptions 
  } from '$lib/stores/fichas';

  const dispatch = createEventDispatcher();

  // ==================== REACTIVE STATEMENTS ====================
  
  $: filters = $fichasFiltersStore;
  $: options = $dropdownOptions;
  $: showActiveFilters = $hasActiveFilters;
  $: filtersCount = $activeFiltersCount;
  $: activeFiltersText = $filtersDisplay;

  // ==================== EVENT HANDLERS ====================
  
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    fichasFiltersStore.setSearch(target.value);
    dispatch('search', target.value);
  }

  function handleEmpresaChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const empresaOption = options.empresas.find(e => e.id === target.value);
    fichasFiltersStore.setEmpresa(target.value, empresaOption?.nome || '');
  }

  function handleCargoChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    fichasFiltersStore.setCargo(target.value);
  }

  function handleStatusChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    fichasFiltersStore.setStatus(target.value);
  }

  function handleDevolucaoPendenteChange(event: Event) {
    const target = event.target as HTMLInputElement;
    fichasFiltersStore.setDevolucaoPendente(target.checked ? true : null);
  }

  function handleClearFilters() {
    fichasFiltersStore.clear();
  }

  function handleRefresh() {
    dispatch('refresh');
  }

  // Carregar opções ao montar componente
  import { onMount } from 'svelte';
  
  onMount(() => {
    if (!$fichasConfigStore.lastUpdated.empresas) {
      fichasConfigStore.loadEmpresaOptions();
    }
    if (!$fichasConfigStore.lastUpdated.cargos) {
      fichasConfigStore.loadCargoOptions();
    }
  });
</script>

<!-- ==================== TEMPLATE ==================== -->

<div class="fichas-filters bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
  <!-- Linha principal de filtros -->
  <div class="flex flex-wrap items-center gap-4 mb-4">
    <!-- Busca -->
    <div class="flex-1 min-w-64">
      <Input 
        type="search"
        placeholder="Buscar por nome, CPF ou matrícula..."
        value={filters.search}
        size="sm"
        class="rounded-sm"
        on:input={handleSearchInput}
      >
        <SearchOutline slot="left" class="w-4 h-4 text-gray-500" />
      </Input>
    </div>

    <!-- Empresa -->
    <div class="min-w-48">
      <Select 
        value={filters.empresaId}
        size="sm"
        class="rounded-sm"
        on:change={handleEmpresaChange}
        disabled={$fichasConfigStore.loadingEmpresas}
      >
        {#each options.empresas as empresa}
          <option value={empresa.id}>{empresa.nome}</option>
        {/each}
      </Select>
    </div>

    <!-- Cargo -->
    <div class="min-w-40">
      <Select 
        value={filters.cargo}
        size="sm"
        class="rounded-sm"
        on:change={handleCargoChange}
        disabled={$fichasConfigStore.loadingCargos}
      >
        {#each options.cargos as cargo}
          <option value={cargo.value}>{cargo.label}</option>
        {/each}
      </Select>
    </div>

    <!-- Status -->
    <div class="min-w-40">
      <Select 
        value={filters.status}
        size="sm"
        class="rounded-sm"
        on:change={handleStatusChange}
      >
        {#each options.status as status}
          <option value={status.value}>{status.label}</option>
        {/each}
      </Select>
    </div>

    <!-- Devolução Pendente -->
    <label class="flex items-center gap-2 cursor-pointer">
      <input 
        type="checkbox"
        checked={filters.devolucaoPendente === true}
        on:change={handleDevolucaoPendenteChange}
        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <span class="text-sm text-gray-700 dark:text-gray-300">
        Devolução Pendente
      </span>
    </label>

    <!-- Ações -->
    <div class="flex items-center gap-2">
      <Button 
        size="sm" 
        color="alternative" 
        class="rounded-sm"
        on:click={handleRefresh}
        title="Atualizar"
      >
        <RefreshOutline class="w-4 h-4" />
      </Button>

      {#if showActiveFilters}
        <Button 
          size="sm" 
          color="alternative" 
          class="rounded-sm"
          on:click={handleClearFilters}
          title="Limpar Filtros"
        >
          <CloseOutline class="w-4 h-4 mr-1" />
          Limpar
        </Button>
      {/if}
    </div>
  </div>

  <!-- Indicadores de filtros ativos -->
  {#if showActiveFilters}
    <div class="flex items-center gap-2 text-sm">
      <FilterOutline class="w-4 h-4 text-gray-500" />
      <span class="text-gray-600 dark:text-gray-400">
        {filtersCount} filtro{filtersCount !== 1 ? 's' : ''} ativo{filtersCount !== 1 ? 's' : ''}:
      </span>
      
      {#each activeFiltersText as filterText}
        <Badge color="primary" class="text-xs rounded-sm">
          {filterText}
        </Badge>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fichas-filters {
    @apply transition-all duration-200;
  }
</style>
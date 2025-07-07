<!--
  EpiCategorySelectorDemo - Demonstração do EpiCategorySelector
  
  Página/componente de demonstração que mostra todas as variantes e usos
  do componente EpiCategorySelector. Útil para desenvolvimento e testes.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import EpiCategorySelector from './EpiCategorySelector.svelte';
  import { CategoriaEPI, type CategoriaEPIEnum } from '$lib/constants/enums';
  import { Card, Button, Alert, Badge } from 'flowbite-svelte';
  
  // Estados para as diferentes variantes
  let selectedSelect: CategoriaEPIEnum | null = null;
  let selectedRadio: CategoriaEPIEnum | null = null;
  let selectedChips: CategoriaEPIEnum[] = [];
  
  // Estados para demonstrar funcionalidades
  let disabled = false;
  let required = false;
  let showIcons = true;
  let showAll = false;
  
  // Log de eventos
  let eventLog: string[] = [];
  
  function logEvent(event: string, data: any) {
    const timestamp = new Date().toLocaleTimeString();
    eventLog = [`[${timestamp}] ${event}: ${JSON.stringify(data)}`, ...eventLog.slice(0, 9)];
  }
  
  function handleCategoryChange(event: any) {
    logEvent('change', event.detail);
  }
  
  function handleCategorySelect(event: any) {
    logEvent('select', event.detail);
  }
  
  function handleCategoryDeselect(event: any) {
    logEvent('deselect', event.detail);
  }
  
  function clearAll() {
    selectedSelect = null;
    selectedRadio = null;
    selectedChips = [];
    eventLog = [];
  }
  
  function selectRandomCategories() {
    const categories = Object.values(CategoriaEPI);
    const randomCount = Math.floor(Math.random() * 3) + 1;
    selectedChips = categories
      .sort(() => 0.5 - Math.random())
      .slice(0, randomCount);
  }
  
  onMount(() => {
    console.log('🎭 EpiCategorySelectorDemo carregado');
  });
</script>

<div class="space-y-6 p-6">
  <!-- Header -->
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
      EpiCategorySelector Demo
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Demonstração de todas as variantes e funcionalidades do componente
    </p>
  </div>
  
  <!-- Controles Globais -->
  <Card>
    <h2 class="text-xl font-semibold mb-4">Controles de Demonstração</h2>
    
    <div class="flex flex-wrap gap-4 mb-4">
      <label class="flex items-center">
        <input type="checkbox" bind:checked={disabled} class="mr-2" />
        Disabled
      </label>
      <label class="flex items-center">
        <input type="checkbox" bind:checked={required} class="mr-2" />
        Required
      </label>
      <label class="flex items-center">
        <input type="checkbox" bind:checked={showIcons} class="mr-2" />
        Show Icons
      </label>
      <label class="flex items-center">
        <input type="checkbox" bind:checked={showAll} class="mr-2" />
        Show "All" Option
      </label>
    </div>
    
    <div class="flex gap-2">
      <Button size="sm" color="light" class="rounded-sm" on:click={clearAll}>
        Limpar Tudo
      </Button>
      <Button size="sm" color="light" class="rounded-sm" on:click={selectRandomCategories}>
        Selecionar Aleatório (Chips)
      </Button>
    </div>
  </Card>
  
  <!-- Variant 1: Select Dropdown -->
  <Card>
    <h2 class="text-xl font-semibold mb-4">Variant: Select (Dropdown)</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      Seletor dropdown tradicional - ideal para formulários compactos
    </p>
    
    <div class="space-y-4">
      <EpiCategorySelector
        variant="select"
        bind:selected={selectedSelect}
        placeholder="Escolha uma categoria..."
        {disabled}
        {required}
        {showIcons}
        {showAll}
        on:change={handleCategoryChange}
        on:select={handleCategorySelect}
      />
      
      <div class="text-sm">
        <strong>Selecionado:</strong> 
        {#if selectedSelect}
          <Badge color="blue">{selectedSelect}</Badge>
        {:else}
          <span class="text-gray-500">Nenhum</span>
        {/if}
      </div>
    </div>
  </Card>
  
  <!-- Variant 2: Radio Buttons -->
  <Card>
    <h2 class="text-xl font-semibold mb-4">Variant: Radio Buttons</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      Radio buttons com ícones - ideal quando você quer mostrar todas as opções
    </p>
    
    <div class="space-y-4">
      <EpiCategorySelector
        variant="radio"
        bind:selected={selectedRadio}
        placeholder="Selecione uma categoria"
        {disabled}
        {required}
        {showIcons}
        {showAll}
        on:change={handleCategoryChange}
        on:select={handleCategorySelect}
      />
      
      <div class="text-sm">
        <strong>Selecionado:</strong> 
        {#if selectedRadio}
          <Badge color="green">{selectedRadio}</Badge>
        {:else}
          <span class="text-gray-500">Nenhum</span>
        {/if}
      </div>
    </div>
  </Card>
  
  <!-- Variant 3: Chips (Multiple Selection) -->
  <Card>
    <h2 class="text-xl font-semibold mb-4">Variant: Chips (Múltipla Seleção)</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      Chips clicáveis - ideal para filtros e seleção múltipla
    </p>
    
    <div class="space-y-4">
      <EpiCategorySelector
        variant="chips"
        bind:selectedMultiple={selectedChips}
        placeholder="Clique para selecionar múltiplas"
        {disabled}
        {showIcons}
        multiple={true}
        on:change={handleCategoryChange}
        on:select={handleCategorySelect}
        on:deselect={handleCategoryDeselect}
      />
      
      <div class="text-sm">
        <strong>Selecionados ({selectedChips.length}):</strong>
        {#if selectedChips.length > 0}
          <div class="flex flex-wrap gap-1 mt-1">
            {#each selectedChips as category}
              <Badge color="purple">{category}</Badge>
            {/each}
          </div>
        {:else}
          <span class="text-gray-500">Nenhum</span>
        {/if}
      </div>
    </div>
  </Card>
  
  <!-- Diferentes Tamanhos -->
  <Card>
    <h2 class="text-xl font-semibold mb-4">Diferentes Tamanhos</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <h3 class="font-medium mb-2">Small</h3>
        <EpiCategorySelector
          variant="select"
          size="sm"
          placeholder="Categoria (small)"
          {showIcons}
        />
      </div>
      
      <div>
        <h3 class="font-medium mb-2">Medium (padrão)</h3>
        <EpiCategorySelector
          variant="select"
          size="md"
          placeholder="Categoria (medium)"
          {showIcons}
        />
      </div>
      
      <div>
        <h3 class="font-medium mb-2">Large</h3>
        <EpiCategorySelector
          variant="select"
          size="lg"
          placeholder="Categoria (large)"
          {showIcons}
        />
      </div>
    </div>
  </Card>
  
  <!-- Event Log -->
  <Card>
    <h2 class="text-xl font-semibold mb-4">Event Log</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      Todos os eventos disparados pelos componentes acima
    </p>
    
    {#if eventLog.length === 0}
      <Alert color="blue">
        Nenhum evento ainda. Interaja com os seletores acima para ver os eventos.
      </Alert>
    {:else}
      <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
        <code class="text-sm">
          {#each eventLog as log}
            <div class="mb-1">{log}</div>
          {/each}
        </code>
      </div>
    {/if}
  </Card>
  
  <!-- Código de Uso -->
  <Card>
    <h2 class="text-xl font-semibold mb-4">Exemplos de Código</h2>
    
    <div class="space-y-4">
      <div>
        <h3 class="font-medium mb-2">Select básico:</h3>
        <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>{`<EpiCategorySelector
  variant="select"
  bind:selected={selectedCategory}
  placeholder="Selecione uma categoria"
  required={true}
  on:change={handleCategoryChange}
/>`}</code></pre>
      </div>
      
      <div>
        <h3 class="font-medium mb-2">Chips para múltipla seleção:</h3>
        <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>{`<EpiCategorySelector
  variant="chips"
  bind:selectedMultiple={selectedCategories}
  showIcons={true}
  on:select={handleCategorySelect}
  on:deselect={handleCategoryDeselect}
/>`}</code></pre>
      </div>
      
      <div>
        <h3 class="font-medium mb-2">Radio buttons com todas as opções:</h3>
        <pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>{`<EpiCategorySelector
  variant="radio"
  bind:selected={selectedCategory}
  showIcons={true}
  showAll={true}
  size="sm"
/>`}</code></pre>
      </div>
    </div>
  </Card>
</div>
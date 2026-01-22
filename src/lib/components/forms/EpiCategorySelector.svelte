<!--
  EpiCategorySelector - Seletor de Categoria EPI Type-Safe
  
  Componente reutilizável para seleção das 8 categorias de EPI do backend.
  Usa ENUMs tipados para garantir consistência com o backend.
  
  Features:
  - Type safety completa com ENUMs do backend
  - Labels traduzidos para português
  - Ícones específicos por categoria
  - Múltiplas variantes de UI (select, radio, chips)
  - Integração com configurationStore
  - Acessibilidade completa
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    CategoriaEPI, 
    getHumanReadableCategory,
    type CategoriaEPIEnum 
  } from '$lib/constants/enums';
  import { categoriasEPIOptions } from '$lib/stores/configurationStore';
  
  // Flowbite components
  import { Select, Radio, Badge, Label } from 'flowbite-svelte';
  
  // Icons (específicos por categoria)
  import { 
    ShieldCheckOutline,
    EyeOutline,
    SpeakerWaveOutline,
    MaskOutline,
    ShirtOutline,
    HandRaisedOutline,
    FootOutline,
    SafetyOutline,
    DotsHorizontalOutline
  } from 'flowbite-svelte-icons';
  
  // ==================== PROPS ====================
  
  export let selected: CategoriaEPIEnum | null = null;
  export let placeholder = 'Selecione uma categoria';
  export let variant: 'select' | 'radio' | 'chips' = 'select';
  export let multiple = false;
  export let disabled = false;
  export let required = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showIcons = true;
  export let showAll = false; // Mostrar opção "Todas"
  
  // Para múltipla seleção (apenas para variant='chips')
  export let selectedMultiple: CategoriaEPIEnum[] = [];
  
  // Styling
  export let containerClass = '';
  export let labelClass = '';
  export let inputClass = '';
  
  // ==================== EVENTOS ====================
  
  const dispatch = createEventDispatcher<{
    change: { 
      selected: CategoriaEPIEnum | null; 
      selectedMultiple: CategoriaEPIEnum[];
      value: CategoriaEPIEnum | CategoriaEPIEnum[] | null;
    };
    select: { category: CategoriaEPIEnum };
    deselect: { category: CategoriaEPIEnum };
  }>();
  
  // ==================== DADOS LOCAIS ====================
  
  // Mapeamento de ícones por categoria
  const categoryIcons: Record<CategoriaEPIEnum, any> = {
    [CategoriaEPI.PROTECAO_CABECA]: ShieldCheckOutline,
    [CategoriaEPI.PROTECAO_OLHOS]: EyeOutline,
    [CategoriaEPI.PROTECAO_AUDITIVA]: SpeakerWaveOutline,
    [CategoriaEPI.PROTECAO_RESPIRATORIA]: MaskOutline,
    [CategoriaEPI.PROTECAO_TRONCO]: ShirtOutline,
    [CategoriaEPI.PROTECAO_MAOS]: HandRaisedOutline,
    [CategoriaEPI.PROTECAO_PES]: FootOutline,
    [CategoriaEPI.PROTECAO_QUEDAS]: SafetyOutline,
    [CategoriaEPI.OUTROS]: DotsHorizontalOutline
  };
  
  // Cores por categoria (para variant='chips')
  const categoryColors: Record<CategoriaEPIEnum, string> = {
    [CategoriaEPI.PROTECAO_CABECA]: 'blue',
    [CategoriaEPI.PROTECAO_OLHOS]: 'green',
    [CategoriaEPI.PROTECAO_AUDITIVA]: 'purple',
    [CategoriaEPI.PROTECAO_RESPIRATORIA]: 'red',
    [CategoriaEPI.PROTECAO_TRONCO]: 'yellow',
    [CategoriaEPI.PROTECAO_MAOS]: 'pink',
    [CategoriaEPI.PROTECAO_PES]: 'indigo',
    [CategoriaEPI.PROTECAO_QUEDAS]: 'orange',
    [CategoriaEPI.OUTROS]: 'gray'
  };
  
  // Preparar opções das categorias
  $: categoryOptions = [
    ...(showAll ? [{ 
      value: '', 
      label: 'Todas as categorias',
      icon: DotsHorizontalOutline 
    }] : []),
    ...Object.entries(CategoriaEPI).map(([key, value]) => ({
      value,
      label: getHumanReadableCategory(value),
      icon: categoryIcons[value],
      color: categoryColors[value]
    }))
  ];
  
  // ==================== HANDLERS ====================
  
  function handleSingleSelect(value: string) {
    const newSelected = value === '' ? null : (value as CategoriaEPIEnum);
    selected = newSelected;
    
    dispatch('change', {
      selected: newSelected,
      selectedMultiple: selectedMultiple,
      value: newSelected
    });
    
    if (newSelected) {
      dispatch('select', { category: newSelected });
    }
  }

  // Função auxiliar para eventos de select - compatível com Svelte
  function handleSelectEvent(event: Event): void {
    const target = event.target as HTMLSelectElement;
    handleSingleSelect(target.value);
  }
  
  function handleMultipleSelect(category: CategoriaEPIEnum) {
    const isSelected = selectedMultiple.includes(category);
    
    if (isSelected) {
      selectedMultiple = selectedMultiple.filter(c => c !== category);
      dispatch('deselect', { category });
    } else {
      selectedMultiple = [...selectedMultiple, category];
      dispatch('select', { category });
    }
    
    dispatch('change', {
      selected: null,
      selectedMultiple: selectedMultiple,
      value: selectedMultiple
    });
  }
  
  function handleRadioSelect(value: string) {
    handleSingleSelect(value);
  }
  
  // ==================== COMPUTED ====================
  
  $: selectedValue = selected || '';
  
  // Para acessibilidade
  $: ariaLabel = required ? `${placeholder} (obrigatório)` : placeholder;
  
  // Classes CSS responsivas
  $: sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[size];
</script>

<!-- ==================== HTML ==================== -->

<div class="epi-category-selector {containerClass}">
  
  <!-- Variant: Select Dropdown -->
  {#if variant === 'select'}
    <Select
      bind:value={selectedValue}
      on:change={(e) => handleSelectEvent(e)}
      {placeholder}
      {disabled}
      {required}
      {size}
      class="epi-category-select {inputClass}"
      aria-label={ariaLabel}
    >
      {#each categoryOptions as option}
        <option value={option.value}>
          {option.label}
        </option>
      {/each}
    </Select>
    
  <!-- Variant: Radio Buttons -->
  {:else if variant === 'radio'}
    <fieldset class="epi-category-radio-group">
      <legend class="sr-only">{placeholder}</legend>
      
      <div class="space-y-2">
        {#each categoryOptions as option}
          <div class="flex items-center">
            <Radio
              bind:group={selectedValue}
              value={option.value}
              {disabled}
              {required}
              name="epi-category"
              class="epi-category-radio"
              id="category-{option.value || 'all'}"
              on:change={() => handleRadioSelect(option.value)}
            />
            
            <Label 
              for="category-{option.value || 'all'}"
              class="ml-2 flex items-center cursor-pointer {labelClass} {sizeClasses}"
            >
              {#if showIcons && option.icon}
                <svelte:component 
                  this={option.icon} 
                  class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
                />
              {/if}
              {option.label}
            </Label>
          </div>
        {/each}
      </div>
    </fieldset>
    
  <!-- Variant: Chips (para múltipla seleção) -->
  {:else if variant === 'chips'}
    <div class="epi-category-chips">
      <div class="flex flex-wrap gap-2">
        {#each categoryOptions as option}
          {#if option.value !== ''} <!-- Não mostrar "Todas" em chips -->
            {@const isSelected = selectedMultiple.includes(option.value as CategoriaEPIEnum)}
            {@const category = option.value as CategoriaEPIEnum}
            
            <button
              type="button"
              class="chip-button {sizeClasses}"
              class:selected={isSelected}
              class:disabled
              {disabled}
              on:click={() => !disabled && handleMultipleSelect(category)}
              aria-pressed={isSelected}
              title={option.label}
            >
              {#if showIcons && option.icon}
                <svelte:component 
                  this={option.icon} 
                  class="w-4 h-4 mr-1"
                />
              {/if}
              {option.label}
              
              {#if isSelected}
                <span class="ml-1 text-xs">✓</span>
              {/if}
            </button>
          {/if}
        {/each}
      </div>
      
      {#if selectedMultiple.length > 0}
        <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {selectedMultiple.length} categoria{selectedMultiple.length > 1 ? 's' : ''} selecionada{selectedMultiple.length > 1 ? 's' : ''}
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Valor selecionado (para debug) -->
  {#if process.env.NODE_ENV === 'development'}
    <div class="mt-2 text-xs text-gray-400">
      Debug: {JSON.stringify({ selected, selectedMultiple })}
    </div>
  {/if}
</div>

<!-- ==================== STYLES ==================== -->

<style>
  .epi-category-selector {
    @apply w-full;
  }
  
  .epi-category-radio-group {
    @apply border-0 p-0 m-0;
  }
  
  .epi-category-chips {
    @apply w-full;
  }
  
  .chip-button {
    @apply inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
           border border-gray-300 bg-white text-gray-700
           hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500
           transition-colors duration-200;
  }
  
  .chip-button.selected {
    @apply bg-primary-100 border-primary-300 text-primary-800
           hover:bg-primary-200;
  }
  
  .chip-button.disabled {
    @apply opacity-50 cursor-not-allowed hover:bg-white;
  }
  
  .dark .chip-button {
    @apply border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600;
  }
  
  .dark .chip-button.selected {
    @apply bg-primary-800 border-primary-600 text-primary-200 hover:bg-primary-700;
  }
  
  .dark .chip-button.disabled {
    @apply hover:bg-gray-700;
  }
  
  /* Animações suaves */
  .chip-button {
    transition: all 0.2s ease-in-out;
  }
  
  .chip-button:hover:not(.disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .chip-button.selected {
    transform: scale(1.05);
  }
</style>
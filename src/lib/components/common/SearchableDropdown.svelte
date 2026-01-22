<script lang="ts">
  import { Button, Input } from 'flowbite-svelte';
  import { ChevronDownOutline, SearchOutline } from 'flowbite-svelte-icons';
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  
  export let options: Array<{ value: string; label: string; disabled?: boolean }> = [];
  export let value: string = '';
  export let placeholder: string = 'Selecione uma opção';
  export let searchPlaceholder: string = 'Buscar...';
  export let disabled: boolean = false;
  export let color: 'light' | 'dark' | 'red' | 'blue' | 'green' | 'yellow' | 'none' | 'purple' | 'primary' | 'alternative' = 'alternative';
  export let noOptionsText: string = 'Nenhuma opção encontrada';
  export let allowClear: boolean = false;
  export let clearText: string = 'Limpar seleção';
  export let customClass: string = '';
  
  const dispatch = createEventDispatcher<{ change: string; clear: void }>();
  
  let searchTerm = '';
  let dropdownOpen = false;
  let dropdownElement: HTMLDivElement;
  let buttonElement: HTMLButtonElement | undefined; // Bound to the button inside component
  let dropdownPortalElement: HTMLDivElement;
  let dropdownStyle = '';
  
  $: filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  $: selectedOption = options.find(option => option.value === value);
  $: displayText = selectedOption?.label || placeholder;
  
  function handleSelect(optionValue: string) {
    value = optionValue;
    searchTerm = '';
    dropdownOpen = false;
    dispatch('change', optionValue);
  }
  
  function handleClear() {
    value = '';
    searchTerm = '';
    dropdownOpen = false;
    dispatch('clear');
  }
  
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchTerm = target.value;
  }
  
  async function updatePosition() {
    if (!dropdownOpen || !dropdownElement) return;
    
    // Find the button (trigger) element - it's the first child or the div itself
    const trigger = dropdownElement.querySelector('button') || dropdownElement;
    const rect = trigger.getBoundingClientRect();
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 300; // Estimated max height
    
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top = rect.bottom + 4;
    let maxHeight = Math.min(300, spaceBelow - 10);
    
    // Flip if not enough space below but enough above
    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
       top = rect.top - Math.min(dropdownHeight, spaceAbove - 10) - 4;
       maxHeight = Math.min(dropdownHeight, spaceAbove - 10);
    }

    // Calculate width with minimum
    const minWidth = 220;
    const width = Math.max(rect.width, minWidth);

    // Calculate horizontal position
    let left = rect.left;
    
    // Check right overflow
    if (left + width > viewportWidth - 10) {
      // Align to right edge of trigger if possible
      left = rect.right - width;
      
      // If still overflowing left (screen too small)
      if (left < 10) {
        left = 10;
        // Adjust width if screen is extremely narrow
        if (width > viewportWidth - 20) {
             // Let css handle max-width if needed, or set it here
             // But width is set below.
        }
      }
    }

    dropdownStyle = `
      position: fixed;
      top: ${top}px;
      left: ${left}px;
      width: ${width}px;
      max-height: ${maxHeight}px;
      z-index: 99999;
    `;
  }

  async function toggleDropdown() {
    if (!disabled) {
      dropdownOpen = !dropdownOpen;
      if (dropdownOpen) {
        await tick();
        updatePosition();
      }
    }
  }
  
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (dropdownElement && dropdownElement.contains(target)) return;
    if (dropdownPortalElement && dropdownPortalElement.contains(target)) return;
    dropdownOpen = false;
  }

  function handleResizeOrScroll() {
    if (dropdownOpen) updatePosition();
  }
</script>

<svelte:window on:click={handleClickOutside} on:resize={handleResizeOrScroll} on:scroll={handleResizeOrScroll} />

<div class="relative {customClass}" bind:this={dropdownElement}>
  <Button
    {color}
    {disabled}
    class="w-full justify-between rounded-sm text-left h-10 px-3 text-sm {selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}"
    on:click={toggleDropdown}
  >
    <span class="truncate">{displayText}</span>
    <ChevronDownOutline class="w-4 h-4 ml-2 flex-shrink-0 {dropdownOpen ? 'rotate-180' : ''} transition-transform" />
  </Button>
</div>

{#if dropdownOpen}
  <div 
    class="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden"
    style={dropdownStyle}
    bind:this={dropdownPortalElement}
  >
    <!-- Search input -->
    <div class="p-2 border-b border-gray-200 dark:border-gray-600">
      <div class="relative">
        <SearchOutline class="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          class="pl-8 text-sm rounded-sm h-8"
          value={searchTerm}
          on:input={handleSearchInput}
        />
      </div>
    </div>
    
    <!-- Content container com scroll -->
    <div class="overflow-y-auto" style="max-height: calc(100% - 60px);">
      {#if allowClear && value}
        <button
          type="button"
          class="w-full px-4 py-2 text-left text-red-600 hover:text-red-700 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600"
          on:click={handleClear}
        >
          {clearText}
        </button>
      {/if}
      
      {#if filteredOptions.length > 0}
        {#each filteredOptions as option}
          <button
            type="button"
            class="w-full px-4 py-2 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 {option.value === value ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'} {option.disabled ? 'opacity-50 cursor-not-allowed' : ''}"
            disabled={option.disabled}
            on:click={() => !option.disabled && handleSelect(option.value)}
          >
            <span class="truncate">{option.label}</span>
            {#if option.value === value}
              <div class="w-2 h-2 bg-primary-600 rounded-full ml-2 flex-shrink-0"></div>
            {/if}
          </button>
        {/each}
      {:else}
        <div class="px-4 py-2 text-gray-500 dark:text-gray-400">
          {noOptionsText}
        </div>
      {/if}
    </div>
  </div>
{/if}
<script lang="ts">
  // Componente reutilizável para headers de drawers
  // Baseado no design do Figma: https://www.figma.com/design/TwCLRJsnzdrmozHkVPHSid/M%C3%B3dulo-EPI?node-id=34-7100
  
  import { createEventDispatcher } from 'svelte';
  import { Button, Badge } from 'flowbite-svelte';
  import Icon from '$lib/components/common/Icon.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import { _ } from 'svelte-i18n';
  
  const dispatch = createEventDispatcher();

  // Props principais
  export let title: string; // Título principal (obrigatório)
  export let objectType: string = ''; // Texto em ALL CAPS (ex: "FICHA EPI")
  export let iconName: string = 'UserOutline'; // Ícone principal
  export let status: string = ''; // Status do objeto
  export const statusType: 'ficha' | 'colaborador' | 'entrega' | 'item' | 'movimento' | 'epi' = 'ficha';

  // Informações adicionais (linha inferior)
  export let additionalInfo: string[] = []; // Array de strings para info adicional

  // Botões de ação
  export let primaryAction: { text: string; icon?: string; disabled?: boolean } | null = null;
  export let secondaryAction: { text: string; icon?: string; disabled?: boolean } | null = null;
  export let tertiaryAction: { text: string; icon?: string; disabled?: boolean } | null = null;
  export let showMoreActions: boolean = false; // Botão de "..." (três pontos)

  // Configurações
  export let showCloseButton: boolean = true;
  export let truncateTitle: boolean = true; // Se deve truncar o título com "..."

  // Handlers
  function handleClose() {
    dispatch('close');
  }

  function handlePrimaryAction() {
    if (primaryAction && !primaryAction.disabled) {
      dispatch('primaryAction');
    }
  }

  function handleSecondaryAction() {
    if (secondaryAction && !secondaryAction.disabled) {
      dispatch('secondaryAction');
    }
  }

  function handleTertiaryAction() {
    if (tertiaryAction && !tertiaryAction.disabled) {
      dispatch('tertiaryAction');
    }
  }

  function handleMoreActions() {
    dispatch('moreActions');
  }
</script>

<!-- Drawer Header Redesigned (Iteration 4) -->
<div class="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
  
  <!-- Row 1: Close Button (Top Left) -->
  {#if showCloseButton}
    <div class="flex justify-start pt-2 px-6 pb-4">
      <button
        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 -ml-2"
        on:click={handleClose}
        title={$_('common.close')}
      >
        <Icon name="CloseOutline" size="w-6 h-6" />
      </button>
    </div>
  {/if}

  <!-- Row 2: Header Content -->
  <div class="flex items-start gap-4 px-6 pb-6 pt-0">
    <!-- Content Area -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-2">
        {#if objectType}
          <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {objectType}
          </span>
        {/if}
        {#if status}
          <StatusBadge {status} color="blue" label={status} extraClass="rounded-full px-2" />
        {/if}
      </div>

      <h2 class="text-3xl font-bold text-gray-900 dark:text-white truncate leading-tight mb-2">
        {title}
      </h2>

      {#if additionalInfo.length > 0}
        <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {#each additionalInfo as info, index}
            <span>{info}</span>
            {#if index < additionalInfo.length - 1}
              <span class="text-gray-300 dark:text-gray-600">•</span>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <!-- Actions (Right aligned, next to content) -->
    <div class="flex flex-col items-end gap-3 flex-shrink-0 mt-2">
       <div class="flex items-center gap-2">
         <!-- Tertiary Action (icon only with dots) -->
          {#if showMoreActions}
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm border border-gray-300 dark:border-gray-600 p-2"
              on:click={handleMoreActions}
            >
              <Icon name="EllipsisVerticalOutline" size="w-4 h-4" />
            </Button>
          {/if}

          <!-- Tertiary Action (custom) -->
          {#if tertiaryAction}
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm border border-gray-300 dark:border-gray-600"
              disabled={tertiaryAction.disabled}
              on:click={handleTertiaryAction}
            >
              {#if tertiaryAction.icon}
                <Icon name={tertiaryAction.icon} className="mr-2" size="w-4 h-4" />
              {/if}
              {tertiaryAction.text}
            </Button>
          {/if}

          <!-- Secondary Action -->
          {#if secondaryAction}
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm border border-gray-300 dark:border-gray-600"
              disabled={secondaryAction.disabled}
              on:click={handleSecondaryAction}
            >
              {#if secondaryAction.icon}
                <Icon name={secondaryAction.icon} className="mr-2" size="w-4 h-4" />
              {/if}
              {secondaryAction.text}
            </Button>
          {/if}

          <!-- Primary Action -->
          {#if primaryAction}
            <Button
              size="sm"
              color="primary"
              class="rounded-sm shadow-sm"
              disabled={primaryAction.disabled}
              on:click={handlePrimaryAction}
            >
              {#if primaryAction.icon}
                <Icon name={primaryAction.icon} className="mr-2" size="w-4 h-4" />
              {/if}
              {primaryAction.text}
            </Button>
          {/if}
       </div>
    </div>
  </div>
</div>

<style>
  /* Ensure text truncation works properly */
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
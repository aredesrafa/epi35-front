<script lang="ts">
  // Componente reutilizável para headers de drawers
  // Baseado no design do Figma: https://www.figma.com/design/TwCLRJsnzdrmozHkVPHSid/M%C3%B3dulo-EPI?node-id=34-7100
  
  import { createEventDispatcher } from 'svelte';
  import { Button, Badge } from 'flowbite-svelte';
  import Icon from '$lib/components/common/Icon.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  
  const dispatch = createEventDispatcher();

  // Props principais
  export let title: string; // Título principal (obrigatório)
  export let objectType: string = ''; // Texto em ALL CAPS (ex: "FICHA EPI")
  export let iconName: string = 'UserOutline'; // Ícone principal
  export let status: string = ''; // Status do objeto
  export let statusType: 'ficha' | 'colaborador' | 'entrega' | 'item' | 'movimento' | 'epi' = 'ficha';

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

<!-- Drawer Header -->
<div class="flex items-center gap-3 px-3 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
  <!-- Close Button (sempre à esquerda) -->
  {#if showCloseButton}
    <button
      class="rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      on:click={handleClose}
    >
      <Icon name="CloseOutline" size="w-5 h-5" className="text-gray-600 dark:text-gray-400" />
    </button>
  {/if}

  <!-- Content Area (expandir para preencher espaço disponível) -->
  <div class="flex-1 min-w-0 flex flex-col">
    <!-- Object Type (ALL CAPS) -->
    {#if objectType}
      <p class="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider mb-1" style="font-size: 11px;">
        {objectType}
      </p>
    {/if}

    <!-- Main Row: Icon + Title + Status + Actions -->
    <div class="flex items-center gap-2.5">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <Icon name={iconName} className="text-gray-900 dark:text-white" size="w-6 h-6" />
      </div>

      <!-- Title -->
      <h2 
        class="font-medium text-gray-900 dark:text-white {truncateTitle ? 'truncate' : ''} flex-1 min-w-0"
        style="font-size: 18px; line-height: 1.2;"
      >
        {title}
      </h2>

      <!-- Status -->
      {#if status}
        <div class="flex-shrink-0">
          <StatusBadge {status} type={statusType} dotMode={true} dotSize="md" />
        </div>
      {/if}

      <!-- Gap maior antes dos botões -->
      {#if status && (primaryAction || secondaryAction || tertiaryAction || showMoreActions)}
        <div class="w-4"></div>
      {/if}

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
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
            class="rounded-sm"
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

    <!-- Additional Info Row -->
    {#if additionalInfo.length > 0}
      <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1" style="font-size: 12px;">
        {#each additionalInfo as info, index}
          <span>{info}</span>
          {#if index < additionalInfo.length - 1}
            <span class="text-gray-400">•</span>
          {/if}
        {/each}
      </div>
    {/if}
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
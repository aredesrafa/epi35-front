<!--
  EPI Detail Drawer - Componente "Burro" para visualização/edição de EPIs
  
  Seguindo o padrão estabelecido pelo FichaDetailPresenter:
  - Drawer lateral com largura máxima de 940px
  - Header padronizado com DrawerHeader
  - Tabs para organizar informações
  - Estados de loading e erro
  - Formulário inline para edição
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Drawer, Button, Input, Textarea, Label, Select, Badge
  } from 'flowbite-svelte';
  import { 
    FloppyDiskOutline, PenOutline, EyeOutline, ChartLineUpOutline, 
    CheckCircleOutline
  } from 'flowbite-svelte-icons';
  import DrawerHeader from '$lib/components/common/DrawerHeader.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
  import type { TipoEPI } from '$lib/services/entity/catalogAdapter';
  import { formatarData } from '$lib/utils/dateHelpers';

  // ==================== PROPS ====================
  
  export let open = false;
  export let mode: 'view' | 'edit' | 'create' = 'view';
  export let epi: TipoEPI | null = null;
  export let loading = false;
  export let error: string | null = null;

  // ==================== STATE ====================
  
  let hidden = !open;
  
  // Form data for editing/creating
  let formData: Partial<TipoEPI> = {};
  let formErrors: Record<string, string> = {};
  
  // Opções para dropdowns - usando os valores corretos do backend
  const categoriaOptions = [
    { value: 'PROTECAO_CABECA', label: 'Proteção da Cabeça', name: 'Proteção da Cabeça' },
    { value: 'PROTECAO_OLHOS_ROSTO', label: 'Proteção dos Olhos e Rosto', name: 'Proteção dos Olhos e Rosto' },
    { value: 'PROTECAO_OUVIDOS', label: 'Proteção Auditiva', name: 'Proteção Auditiva' },
    { value: 'PROTECAO_RESPIRATORIA', label: 'Proteção Respiratória', name: 'Proteção Respiratória' },
    { value: 'PROTECAO_MAOS_BRACCOS', label: 'Proteção das Mãos e Braços', name: 'Proteção das Mãos e Braços' },
    { value: 'PROTECAO_PES', label: 'Proteção dos Pés', name: 'Proteção dos Pés' },
    { value: 'PROTECAO_CLIMATICA', label: 'Proteção Climática', name: 'Proteção Climática' },
    { value: 'ROUPA_APROXIMACAO', label: 'Roupa de Aproximação', name: 'Roupa de Aproximação' }
  ];

  const statusOptions = [
    { value: 'ATIVO', label: 'Ativo', name: 'Ativo' },
    { value: 'DESCONTINUADO', label: 'Descontinuado', name: 'Descontinuado' }
  ];

  // ==================== REACTIVE STATEMENTS ====================
  
  $: {
    hidden = !open;
  }

  // Resetar form quando EPI muda ou modo muda
  $: if (epi || mode) {
    resetForm();
  }

  // Informações adicionais para o header
  $: additionalInfo = epi ? [
    `CA ${epi.numeroCa}`,
    getCategoriaLabel(epi.categoria)
  ] : [];

  // ==================== HELPERS ====================
  
  function getCategoriaLabel(categoria: string): string {
    return categoriaOptions.find(opt => opt.value === categoria)?.label || categoria;
  }

  function resetForm(): void {
    if (mode === 'create') {
      formData = {
        nomeEquipamento: '',
        numeroCa: '',
        categoria: 'PROTECAO_CABECA',
        status: 'ATIVO',
        vidaUtilDias: 365,
        descricao: ''
      };
    } else if (epi) {
      formData = {
        nomeEquipamento: epi.nomeEquipamento,
        numeroCa: epi.numeroCa,
        categoria: epi.categoria,
        status: epi.status,
        vidaUtilDias: epi.vidaUtilDias || 365,
        descricao: epi.descricao || ''
      };
    }
    formErrors = {};
  }

  function validateForm(): boolean {
    formErrors = {};

    if (!formData.nomeEquipamento?.trim()) {
      formErrors.nomeEquipamento = 'Nome do equipamento é obrigatório';
    }

    if (!formData.numeroCa?.trim()) {
      formErrors.numeroCa = 'Número CA é obrigatório';
    } else if (!/^\d+$/.test(formData.numeroCa.trim())) {
      formErrors.numeroCa = 'Número CA deve conter apenas números';
    }

    if (!formData.categoria) {
      formErrors.categoria = 'Categoria é obrigatória';
    }

    if (!formData.status) {
      formErrors.status = 'Status é obrigatório';
    }

    if (formData.vidaUtilDias && (formData.vidaUtilDias < 1 || formData.vidaUtilDias > 3650)) {
      formErrors.vidaUtilDias = 'Vida útil deve estar entre 1 e 3650 dias';
    }

    return Object.keys(formErrors).length === 0;
  }

  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    close: void;
    save: Partial<TipoEPI>;
    edit: void;
  }>();

  // ==================== EVENT HANDLERS ====================
  
  function handleClose(): void {
    dispatch('close');
  }

  function handleEdit(): void {
    dispatch('edit');
  }

  function handleSave(): void {
    if (validateForm()) {
      // Mapear dados para o formato esperado pelo adapter
      const saveData = {
        nomeEquipamento: formData.nomeEquipamento,
        numeroCa: formData.numeroCa,
        categoria: formData.categoria,
        vidaUtilDias: Number(formData.vidaUtilDias) || 365,
        descricao: formData.descricao,
        ativo: formData.status === 'ATIVO'
      };
      
      dispatch('save', saveData);
    }
  }

  function handleCancel(): void {
    resetForm();
    if (mode === 'create') {
      handleClose();
    } else {
      dispatch('edit'); // Volta para o modo view
    }
  }

  // Handler para quando o Drawer for fechado externamente
  let lastHidden = hidden;
  $: if (hidden !== lastHidden) {
    if (hidden && open) {
      dispatch('close');
    }
    lastHidden = hidden;
  }
</script>

<style>
  :global(.drawer-epi) {
    top: 64px !important; /* Altura do header */
    height: calc(100vh - 64px) !important;
    max-width: 940px !important;
    z-index: 50 !important;
  }
  
  /* Ajustar backdrop para não cobrir header */
  :global([role="presentation"].fixed.top-0.start-0.z-50.w-full.h-full) {
    top: 64px !important;
    height: calc(100vh - 64px) !important;
  }
</style>

<!-- ==================== DRAWER PRINCIPAL ==================== -->
<Drawer 
  bind:hidden
  placement="right" 
  width="w-full max-w-[940px]"
  backdrop={true}
  activateClickOutside={true}
  bgOpacity="bg-black/50"
  position="fixed"
  id="epi-detail-drawer"
  class="drawer-epi"
>
  <!-- Header -->
  <DrawerHeader
    title={mode === 'create' ? 'Novo EPI' : (epi?.nomeEquipamento || 'EPI')}
    objectType="EPI"
    iconName="ShieldCheckOutline"
    status={epi?.status}
    statusType="epi"
    {additionalInfo}
    primaryAction={mode === 'view' ? { text: 'Editar', icon: 'PenOutline' } : 
                   mode === 'create' ? { text: 'Criar EPI', icon: 'FloppyDiskOutline' } :
                   { text: 'Salvar', icon: 'FloppyDiskOutline' }}
    secondaryAction={mode !== 'view' ? { text: 'Cancelar', icon: 'CloseOutline' } : null}
    on:close={handleClose}
    on:primaryAction={mode === 'view' ? handleEdit : handleSave}
    on:secondaryAction={handleCancel}
  />

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <LoadingSpinner />
    </div>
  {:else if error}
    <ErrorDisplay error={error} />
  {:else}

    <!-- ==================== CONTENT ==================== -->
    <div class="p-6">
      
      <!-- Conteúdo Principal -->
        <div class="space-y-6">
          
          {#if mode === 'view'}
            <!-- Modo Visualização -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Informações Básicas -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Informações Básicas
                </h3>
                
                <div class="space-y-3">
                  <div>
                    <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nome do Equipamento
                    </Label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">
                      {epi?.nomeEquipamento || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Número CA
                    </Label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">
                      {epi?.numeroCa || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Categoria
                    </Label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">
                      {getCategoriaLabel(epi?.categoria || '')}
                    </p>
                  </div>
                  
                  <div>
                    <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </Label>
                    <div class="mt-1">
                      <StatusBadge status={epi?.status || 'ATIVO'} color="green" label={epi?.status || 'ATIVO'} />
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Especificações -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Especificações
                </h3>
                
                <div class="space-y-3">
                  <div>
                    <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vida Útil
                    </Label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">
                      {epi?.vidaUtilDias || 'N/A'} dias
                    </p>
                  </div>
                  
                  <div>
                    <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Data de Criação
                    </Label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">
                      {epi?.createdAt ? formatarData(epi.createdAt) : 'N/A'}
                    </p>
                  </div>
                  
                  {#if epi?.updatedAt && epi.updatedAt !== epi.createdAt}
                    <div>
                      <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Última Atualização
                      </Label>
                      <p class="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatarData(epi.updatedAt)}
                      </p>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
            
            <!-- Descrição -->
            {#if epi?.descricao}
              <div>
                <Label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descrição
                </Label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {epi.descricao}
                </p>
              </div>
            {/if}
            
          {:else}
            <!-- Modo Edição/Criação -->
            <div class="space-y-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {mode === 'create' ? 'Novo EPI' : 'Editar EPI'}
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <!-- Nome do Equipamento -->
                <div class="md:col-span-2">
                  <Label for="nomeEquipamento" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome do Equipamento *
                  </Label>
                  <Input
                    id="nomeEquipamento"
                    bind:value={formData.nomeEquipamento}
                    placeholder="Ex: Capacete de Segurança Classe A"
                    class="mt-1 rounded-sm {formErrors.nomeEquipamento ? 'border-red-500' : ''}"
                  />
                  {#if formErrors.nomeEquipamento}
                    <p class="mt-1 text-sm text-red-600">{formErrors.nomeEquipamento}</p>
                  {/if}
                </div>
                
                <!-- Número CA -->
                <div>
                  <Label for="numeroCa" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Número CA *
                  </Label>
                  <Input
                    id="numeroCa"
                    bind:value={formData.numeroCa}
                    placeholder="Ex: 12345"
                    class="mt-1 rounded-sm {formErrors.numeroCa ? 'border-red-500' : ''}"
                  />
                  {#if formErrors.numeroCa}
                    <p class="mt-1 text-sm text-red-600">{formErrors.numeroCa}</p>
                  {/if}
                </div>
                
                <!-- Categoria -->
                <div>
                  <Label for="categoria" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoria *
                  </Label>
                  <Select
                    id="categoria"
                    bind:value={formData.categoria}
                    items={categoriaOptions}
                    class="mt-1 rounded-sm {formErrors.categoria ? 'border-red-500' : ''}"
                  />
                  {#if formErrors.categoria}
                    <p class="mt-1 text-sm text-red-600">{formErrors.categoria}</p>
                  {/if}
                </div>
                
                <!-- Status -->
                <div>
                  <Label for="status" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status *
                  </Label>
                  <Select
                    id="status"
                    bind:value={formData.status}
                    items={statusOptions}
                    class="mt-1 rounded-sm {formErrors.status ? 'border-red-500' : ''}"
                  />
                  {#if formErrors.status}
                    <p class="mt-1 text-sm text-red-600">{formErrors.status}</p>
                  {/if}
                </div>
                
                <!-- Vida Útil -->
                <div>
                  <Label for="vidaUtilDias" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vida Útil (dias)
                  </Label>
                  <Input
                    id="vidaUtilDias"
                    type="number"
                    min="1"
                    max="3650"
                    bind:value={formData.vidaUtilDias}
                    placeholder="365"
                    class="mt-1 rounded-sm {formErrors.vidaUtilDias ? 'border-red-500' : ''}"
                  />
                  {#if formErrors.vidaUtilDias}
                    <p class="mt-1 text-sm text-red-600">{formErrors.vidaUtilDias}</p>
                  {/if}
                </div>
                
                <!-- Descrição -->
                <div class="md:col-span-2">
                  <Label for="descricao" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    bind:value={formData.descricao}
                    placeholder="Descrição detalhada do equipamento..."
                    rows={4}
                    class="mt-1 rounded-sm"
                  />
                </div>
              </div>
              
            </div>
          {/if}
        </div>
      
    </div>
  {/if}
</Drawer>
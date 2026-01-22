<!--
  Modal para criação/edição de contratadas
  
  Suporte para dois modos:
  - Criação: contratada = null
  - Edição: contratada = objeto existente
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Button, 
    Modal, 
    Label, 
    Input, 
    Select, 
    Helper 
  } from 'flowbite-svelte';
  import type { Contratada } from '$lib/services/api/types';

  // Props
  export let show = false;
  export let contratada: Contratada | null = null;

  // Events
  const dispatch = createEventDispatcher<{
    success: Contratada;
    cancel: void;
  }>();

  // Form data
  let formData = {
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    status: 'ATIVO'
  };

  // Validation
  let errors: Record<string, string> = {};
  let isSubmitting = false;

  // Reactive: update form when contratada changes
  $: if (contratada) {
    formData = {
      nome: contratada.nome,
      cnpj: contratada.cnpj,
      telefone: contratada.telefone || '',
      email: contratada.email || '',
      endereco: contratada.endereco || '',
      status: contratada.status
    };
  } else {
    // Reset form for new contratada
    formData = {
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      status: 'ATIVO'
    };
  }

  // Computed
  $: isEditMode = !!contratada;
  $: modalTitle = isEditMode ? 'Editar Contratada' : 'Nova Contratada';
  $: submitButtonText = isEditMode ? 'Atualizar' : 'Criar';

  // CNPJ validation
  function validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanCNPJ.length === 14;
  }

  // Form validation
  function validateForm(): boolean {
    errors = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.cnpj.trim()) {
      errors.cnpj = 'CNPJ é obrigatório';
    } else if (!validateCNPJ(formData.cnpj)) {
      errors.cnpj = 'CNPJ deve ter 14 dígitos';
    }

    if (formData.email && !formData.email.includes('@')) {
      errors.email = 'Email deve ser válido';
    }

    return Object.keys(errors).length === 0;
  }

  // Handle submit
  async function handleSubmit() {
    if (!validateForm()) return;

    isSubmitting = true;
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result: Contratada = {
        id: contratada?.id || `contratada-${Date.now()}`,
        ...formData,
        createdAt: contratada?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dispatch('success', result);
      show = false;
    } catch (error: any) {
      console.error('Erro ao salvar contratada:', error);
    } finally {
      isSubmitting = false;
    }
  }

  // Handle cancel
  function handleCancel() {
    dispatch('cancel');
    show = false;
  }

  // Format CNPJ input
  function formatCNPJ(value: string): string {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  // Handle CNPJ input
  function handleCNPJInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const formatted = formatCNPJ(target.value);
    formData.cnpj = formatted;
  }
</script>

<Modal bind:open={show} size="md" class="min-w-fit">
  <svelte:fragment slot="header">
    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
      {modalTitle}
    </h3>
  </svelte:fragment>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <!-- Nome -->
    <div>
      <Label for="nome" class="mb-2">Nome da Empresa *</Label>
      <Input
        id="nome"
        type="text"
        bind:value={formData.nome}
        placeholder="Digite o nome da empresa"
        class="w-full"
        color={errors.nome ? 'red' : 'base'}
      />
      {#if errors.nome}
        <Helper class="text-red-600 dark:text-red-400">{errors.nome}</Helper>
      {/if}
    </div>

    <!-- CNPJ -->
    <div>
      <Label for="cnpj" class="mb-2">CNPJ *</Label>
      <Input
        id="cnpj"
        type="text"
        bind:value={formData.cnpj}
        on:input={handleCNPJInput}
        placeholder="00.000.000/0000-00"
        maxlength={18}
        class="w-full"
        color={errors.cnpj ? 'red' : 'base'}
      />
      {#if errors.cnpj}
        <Helper class="text-red-600 dark:text-red-400">{errors.cnpj}</Helper>
      {/if}
    </div>

    <!-- Telefone -->
    <div>
      <Label for="telefone" class="mb-2">Telefone</Label>
      <Input
        id="telefone"
        type="text"
        bind:value={formData.telefone}
        placeholder="(11) 99999-9999"
        class="w-full"
      />
    </div>

    <!-- Email -->
    <div>
      <Label for="email" class="mb-2">Email</Label>
      <Input
        id="email"
        type="email"
        bind:value={formData.email}
        placeholder="contato@empresa.com"
        class="w-full"
        color={errors.email ? 'red' : 'base'}
      />
      {#if errors.email}
        <Helper class="text-red-600 dark:text-red-400">{errors.email}</Helper>
      {/if}
    </div>

    <!-- Endereço -->
    <div>
      <Label for="endereco" class="mb-2">Endereço</Label>
      <Input
        id="endereco"
        type="text"
        bind:value={formData.endereco}
        placeholder="Rua, número, bairro, cidade"
        class="w-full"
      />
    </div>

    <!-- Status -->
    <div>
      <Label for="status" class="mb-2">Status</Label>
      <Select
        id="status"
        bind:value={formData.status}
        class="w-full"
      >
        <option value="ATIVO">Ativo</option>
        <option value="INATIVO">Inativo</option>
      </Select>
    </div>
  </form>

  <svelte:fragment slot="footer">
    <div class="flex justify-end gap-2">
      <Button
        color="light"
        on:click={handleCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      <Button
        color="primary"
        on:click={handleSubmit}
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          Salvando...
        {:else}
          {submitButtonText}
        {/if}
      </Button>
    </div>
  </svelte:fragment>
</Modal>
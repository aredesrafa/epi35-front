<script lang="ts">
  import {
    Label,
    Input,
    Select,
    Textarea,
    Fileupload
  } from 'flowbite-svelte';
  import type { TipoEPI } from '$lib/types';
  import { EPI_CATEGORIES, DEFAULT_VIDA_UTIL_DIAS } from '$lib/constants/epiConstants';

  export let formData: Partial<TipoEPI> = {};
  export let onChange: (field: keyof TipoEPI, value: string | number) => void = () => {};
  export let idPrefix: string = '';
  export let disabled: boolean = false;

  function getFieldId(field: string): string {
    return `${idPrefix}${field}`;
  }

  function handleNumberChange(field: keyof TipoEPI, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || DEFAULT_VIDA_UTIL_DIAS;
    onChange(field, value);
  }

  function handleChange(field: keyof TipoEPI, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    onChange(field, target.value);
  }
</script>

<div class="space-y-6">
  <!-- Nome do Equipamento -->
  <div>
    <Label for={getFieldId('nomeEquipamento')} class="text-gray-700 dark:text-gray-300 mb-2 block">
      Nome do Equipamento <span class="text-red-500">*</span>
    </Label>
    <Input
      id={getFieldId('nomeEquipamento')}
      bind:value={formData.nomeEquipamento}
      on:input={(e) => handleChange('nomeEquipamento', e)}
      placeholder="Ex: Capacete de Segurança Classe A"
      size="sm"
      class="rounded-sm"
      required
      {disabled}
    />
  </div>

  <!-- CA e Fabricante -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <Label for={getFieldId('numeroCA')} class="text-gray-700 dark:text-gray-300 mb-2 block">
        Número CA <span class="text-red-500">*</span>
      </Label>
      <Input
        id={getFieldId('numeroCA')}
        bind:value={formData.numeroCA}
        on:input={(e) => handleChange('numeroCA', e)}
        placeholder="Ex: 12345"
        size="sm"
        class="rounded-sm"
        required
        {disabled}
      />
    </div>
    <div>
      <Label for={getFieldId('fabricante')} class="text-gray-700 dark:text-gray-300 mb-2 block">
        Fabricante <span class="text-red-500">*</span>
      </Label>
      <Input
        id={getFieldId('fabricante')}
        bind:value={formData.fabricante}
        on:input={(e) => handleChange('fabricante', e)}
        placeholder="Ex: 3M do Brasil"
        size="sm"
        class="rounded-sm"
        required
        {disabled}
      />
    </div>
  </div>

  <!-- Categoria e Vida Útil -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <Label for={getFieldId('categoria')} class="text-gray-700 dark:text-gray-300 mb-2 block">
        Categoria <span class="text-red-500">*</span>
      </Label>
      <Select
        id={getFieldId('categoria')}
        bind:value={formData.categoria}
        on:change={(e) => handleChange('categoria', e)}
        size="sm"
        class="rounded-sm"
        required
        {disabled}
      >
        <option value="">Selecione uma categoria</option>
        {#each EPI_CATEGORIES as categoria}
          <option value={categoria}>{categoria}</option>
        {/each}
      </Select>
    </div>
    <div>
      <Label for={getFieldId('vidaUtilDias')} class="text-gray-700 dark:text-gray-300 mb-2 block">
        Vida Útil (dias) <span class="text-red-500">*</span>
      </Label>
      <Input
        id={getFieldId('vidaUtilDias')}
        type="number"
        min="1"
        bind:value={formData.vidaUtilDias}
        on:input={(e) => handleNumberChange('vidaUtilDias', e)}
        size="sm"
        class="rounded-sm"
        required
        {disabled}
      />
    </div>
  </div>

  <!-- Descrição -->
  <div>
    <Label for={getFieldId('descricao')} class="text-gray-700 dark:text-gray-300 mb-2 block">
      Descrição
    </Label>
    <Textarea
      id={getFieldId('descricao')}
      bind:value={formData.descricao}
      on:input={(e) => handleChange('descricao', e)}
      placeholder="Descreva as características e especificações do EPI..."
      rows={3}
      class="rounded-sm"
      {disabled}
    />
  </div>

  <!-- Foto -->
  <div>
    <Label for={getFieldId('foto')} class="text-gray-700 dark:text-gray-300 mb-2 block">
      Foto do Equipamento
    </Label>
    <Fileupload
      id={getFieldId('foto')}
      class="rounded-sm"
      {disabled}
    />
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
      Selecione uma imagem do equipamento (opcional)
    </p>
  </div>
</div>
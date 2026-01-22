<script lang="ts">
  import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button } from 'flowbite-svelte';
  import { 
    EyeOutline, 
    ClipboardListOutline, 
    TrashBinOutline 
  } from 'flowbite-svelte-icons';
  import type { TipoEPI } from '$lib/types';

  export let tipos: TipoEPI[] = [];
  export let onView: (tipo: TipoEPI) => void = () => {};
  export let onDuplicate: (tipo: TipoEPI) => void = () => {};
  export let onDelete: (tipo: TipoEPI) => void = () => {};

  async function handleDelete(tipo: TipoEPI) {
    if (confirm(`Deseja realmente excluir o tipo EPI "${tipo.nomeEquipamento}"?`)) {
      try {
        await onDelete(tipo);
      } catch (error: any) {
        console.error('Erro ao excluir tipo EPI:', error);
        alert('Erro ao excluir tipo EPI.');
      }
    }
  }

  function handleRowClick(tipo: TipoEPI) {
    onView(tipo);
  }
</script>

<Table hoverable>
    <TableHead>
      <TableHeadCell class="min-w-[200px]">Equipamento</TableHeadCell>
      <TableHeadCell class="min-w-[100px]">CA</TableHeadCell>
      <TableHeadCell class="min-w-[120px] hidden lg:table-cell">Fabricante</TableHeadCell>
      <TableHeadCell class="min-w-[120px] hidden xl:table-cell">Categoria</TableHeadCell>
      <TableHeadCell class="min-w-[100px]">Vida Útil</TableHeadCell>
      <TableHeadCell class="min-w-[120px]">Ações</TableHeadCell>
    </TableHead>
    <TableBody>
      {#if tipos.length > 0}
        {#each tipos as tipo (tipo.id)}
          <TableBodyRow 
            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            on:click={() => handleRowClick(tipo)}
          >
            <TableBodyCell class="min-w-[200px]">
              <div>
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {tipo.nomeEquipamento}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {tipo.descricao || 'Sem descrição'}
                </p>
                <!-- Mostrar fabricante em mobile quando coluna está oculta -->
                <p class="text-xs text-gray-500 dark:text-gray-400 lg:hidden mt-1">
                  {tipo.fabricante}
                </p>
                <!-- Mostrar categoria em mobile quando coluna está oculta -->
                <p class="text-xs text-gray-500 dark:text-gray-400 xl:hidden mt-1">
                  {tipo.categoria}
                </p>
              </div>
            </TableBodyCell>
            <TableBodyCell class="min-w-[100px]">
              <Badge color="dark" class="w-fit rounded-sm">
                {tipo.numeroCA}
              </Badge>
            </TableBodyCell>
            <TableBodyCell class="min-w-[120px] hidden lg:table-cell">
              <span class="text-sm text-gray-900 dark:text-white">
                {tipo.fabricante}
              </span>
            </TableBodyCell>
            <TableBodyCell class="min-w-[120px] hidden xl:table-cell">
              <Badge color="primary" class="w-fit rounded-sm">
                {tipo.categoria}
              </Badge>
            </TableBodyCell>
            <TableBodyCell class="min-w-[100px]">
              <span class="text-sm text-gray-900 dark:text-white">
                {tipo.vidaUtilDias} dias
              </span>
            </TableBodyCell>
            <TableBodyCell class="min-w-[120px]">
              <div class="flex space-x-1">
                <button
                  class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                  on:click={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onView(tipo);
                  }}
                  title="Ver detalhes"
                >
                  <EyeOutline class="w-5 h-5" />
                </button>
                <button
                  class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                  on:click={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDuplicate(tipo);
                  }}
                  title="Duplicar"
                >
                  <ClipboardListOutline class="w-5 h-5" />
                </button>
                <button
                  class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                  on:click={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(tipo);
                  }}
                  title="Excluir"
                >
                  <TrashBinOutline class="w-5 h-5 text-red-600" />
                </button>
              </div>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      {:else}
        <TableBodyRow>
          <TableBodyCell colspan={6} class="text-center py-12">
            <div class="text-gray-500 dark:text-gray-400">
              Nenhum tipo de EPI encontrado
            </div>
          </TableBodyCell>
        </TableBodyRow>
      {/if}
    </TableBody>
</Table>
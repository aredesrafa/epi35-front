<!--
  Colaborador Table Presenter - Sistema DataLife EPI
  
  Componente "burro" responsável apenas pela renderização da interface de colaboradores.
  Recebe dados via props e emite eventos para o Container pai.
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { 
    Card, Button, Input, Select, Table, TableHead, TableHeadCell, 
    TableBody, TableBodyRow, TableBodyCell, Label, Badge, Modal
  } from 'flowbite-svelte';
  import { 
    RefreshOutline, PlusOutline, EditOutline, TrashBinOutline
  } from 'flowbite-svelte-icons';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import type { ColaboradorDTO, ContratadaDTO } from '$lib/types/serviceTypes';
  import type { PaginationState, FilterState } from '$lib/stores/paginatedStore';
  
  // ==================== PROPS ====================
  
  export let items: ColaboradorDTO[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let pagination: PaginationState;
  export let filters: FilterState = {};
  export let contratadas: ContratadaDTO[] = [];
  export let embedded = false;
  export const showNovoColaboradorModal = false;
  export let showEditarColaboradorModal = false;
  export let colaboradorEdicao: ColaboradorDTO | null = null;
  
  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    pageChange: number;
    filterChange: { key: string; value: any };
    clearFilters: void;
    refresh: void;
    itemsPerPageChange: number;
    novoColaborador: void;
    editarColaborador: ColaboradorDTO;
    excluirColaborador: ColaboradorDTO;
    salvarColaborador: Partial<ColaboradorDTO>;
    atualizarColaborador: Partial<ColaboradorDTO>;
    cancelarModal: void;
  }>();
  
  // ==================== LOCAL STATE ====================
  
  let formData = {
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    cargo: '',
    dataAdmissao: '',
    contratadaId: ''
  };
  
  // ==================== COMPUTED VALUES ====================
  
  $: startIndex = (pagination.page - 1) * pagination.pageSize + 1;
  $: endIndex = Math.min(pagination.page * pagination.pageSize, pagination.total);
  $: hasFiltersApplied = Object.values(filters).some(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  // ==================== REACTIVE STATEMENTS ====================
  
  $: if (showEditarColaboradorModal && !colaboradorEdicao) {
    formData = {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      cargo: '',
      dataAdmissao: '',
      contratadaId: ''
    };
  }
  
  $: if (showEditarColaboradorModal && colaboradorEdicao) {
    formData = {
      nome: colaboradorEdicao.nome || '',
      cpf: colaboradorEdicao.cpf || '',
      email: colaboradorEdicao.email || '',
      telefone: colaboradorEdicao.telefone || '',
      cargo: colaboradorEdicao.cargo || '',
      dataAdmissao: colaboradorEdicao.dataAdmissao || '',
      contratadaId: colaboradorEdicao.contratadaId || ''
    };
  }
  
  // ==================== HELPER FUNCTIONS ====================
  
  function getStatusBadgeColor(ativo: boolean): 'green' | 'red' {
    return ativo ? 'green' : 'red';
  }
  
  function getStatusLabel(ativo: boolean): string {
    return ativo ? 'Ativo' : 'Inativo';
  }
  
  function formatCPF(cpf: string): string {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  function generatePageNumbers(): number[] {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  
  // ==================== EVENT HANDLERS ====================
  
  function handleFilterInput(key: string, value: any): void {
    dispatch('filterChange', { key, value });
  }
  
  function handlePageClick(page: number): void {
    dispatch('pageChange', page);
  }
  
  function handleSalvarColaborador(): void {
    const dados = { ...formData };
    
    if (colaboradorEdicao) {
      dispatch('atualizarColaborador', dados);
    } else {
      dispatch('salvarColaborador', dados);
    }
  }
  
  function handleEditClick(colaborador: ColaboradorDTO): void {
    dispatch('editarColaborador', colaborador);
  }
  
  function handleDeleteClick(colaborador: ColaboradorDTO): void {
    if (confirm(`Deseja realmente excluir o colaborador "${colaborador.nome}"?`)) {
      dispatch('excluirColaborador', colaborador);
    }
  }
</script>

<!-- ==================== TEMPLATE ==================== -->

<div class="space-y-6">
  <!-- Header -->
  {#if !embedded}
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Colaboradores</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie os colaboradores das empresas contratadas
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <Button 
          size="sm" 
          color="alternative" 
          class="rounded-sm"
          on:click={() => dispatch('refresh')}
          disabled={loading}
        >
          <RefreshOutline class="w-4 h-4 mr-2" />
          Atualizar
        </Button>
        <Button 
          size="sm" 
          color="primary" 
          class="rounded-sm"
          on:click={() => dispatch('novoColaborador')}
        >
          <PlusOutline class="w-4 h-4 mr-2" />
          Novo Colaborador
        </Button>
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Colaboradores
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Gerencie os colaboradores das empresas contratadas
        </p>
      </div>
      <Button 
        size="sm" 
        color="primary" 
        class="rounded-sm"
        on:click={() => dispatch('novoColaborador')}
      >
        <PlusOutline class="w-4 h-4 mr-2" />
        Colaborador
      </Button>
    </div>
  {/if}

  <!-- Filtros -->
  <Card class="p-4 rounded-sm !max-w-none">
    <div class="grid gap-4 md:grid-cols-3">
      <div>
        <Label for="filtro-nome" class="mb-2">Buscar por Nome</Label>
        <Input
          id="filtro-nome"
          value={filters.search || ''}
          on:input={(e) => handleFilterInput('search', e.target.value)}
          placeholder="Digite o nome do colaborador..."
          size="sm"
          class="rounded-sm"
        />
      </div>
      
      <div>
        <Label for="filtro-contratada" class="mb-2">Contratada</Label>
        <Select
          id="filtro-contratada"
          value={filters.contratadaId || ''}
          on:change={(e) => handleFilterInput('contratadaId', e.target.value)}
          size="sm"
          class="rounded-sm"
        >
          <option value="">Todas as contratadas</option>
          {#each contratadas as contratada}
            <option value={contratada.id}>{contratada.nome}</option>
          {/each}
        </Select>
      </div>
      
      <div>
        <Label for="filtro-status" class="mb-2">Status</Label>
        <Select
          id="filtro-status"
          value={filters.ativo || ''}
          on:change={(e) => handleFilterInput('ativo', e.target.value)}
          size="sm"
          class="rounded-sm"
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </Select>
      </div>
    </div>
    
    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">{pagination.total}</span> colaborador(es) encontrado(s)
      </div>
      
      {#if hasFiltersApplied}
        <Button 
          size="sm" 
          color="alternative" 
          class="rounded-sm"
          on:click={() => dispatch('clearFilters')}
        >
          <TrashBinOutline class="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      {/if}
    </div>
  </Card>

  <!-- Conteúdo Principal -->
  {#if loading}
    <Card class="rounded-sm !max-w-none">
      <div class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    </Card>
  {:else if error}
    <ErrorDisplay 
      message={error}
      onRetry={() => dispatch('refresh')}
    />
  {:else if items.length === 0}
    <Card class="rounded-sm !max-w-none">
      <div class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          {hasFiltersApplied 
            ? 'Nenhum colaborador encontrado com os filtros aplicados.' 
            : 'Nenhum colaborador cadastrado ainda.'}
        </div>
      </div>
    </Card>
  {:else}
    <!-- Tabela -->
    <Card class="rounded-sm !max-w-none overflow-hidden">
      <div class="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Nome</TableHeadCell>
            <TableHeadCell>CPF</TableHeadCell>
            <TableHeadCell>Cargo</TableHeadCell>
            <TableHeadCell>Contratada</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Ações</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each items as colaborador}
              <TableBodyRow>
                <TableBodyCell>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {colaborador.nome}
                  </div>
                  {#if colaborador.email}
                    <div class="text-sm text-blue-600 dark:text-blue-400">{colaborador.email}</div>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm">{formatCPF(colaborador.cpf)}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="text-sm">{colaborador.cargo}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="text-sm">{colaborador.contratada?.nome || '-'}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <Badge 
                    color={getStatusBadgeColor(colaborador.ativo)} 
                    class="w-fit rounded-sm"
                  >
                    {getStatusLabel(colaborador.ativo)}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex items-center space-x-1">
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={() => handleEditClick(colaborador)}
                      title="Editar"
                    >
                      <EditOutline class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={() => handleDeleteClick(colaborador)}
                      title="Excluir"
                    >
                      <TrashBinOutline class="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
      
      <!-- Paginação -->
      {#if pagination.totalPages > 1}
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {startIndex} a {endIndex} de {pagination.total} resultados
          </div>
          
          <div class="flex space-x-2">
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm"
              disabled={pagination.page <= 1}
              on:click={() => handlePageClick(pagination.page - 1)}
            >
              Anterior
            </Button>
            
            {#each generatePageNumbers() as pageNum}
              <Button
                size="sm"
                color={pageNum === pagination.page ? 'primary' : 'alternative'}
                class="rounded-sm min-w-[40px]"
                on:click={() => handlePageClick(pageNum)}
              >
                {pageNum}
              </Button>
            {/each}
            
            <Button
              size="sm"
              color="alternative"
              class="rounded-sm"
              disabled={pagination.page >= pagination.totalPages}
              on:click={() => handlePageClick(pagination.page + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      {/if}
    </Card>
  {/if}
</div>

<!-- Modal: Novo/Editar Colaborador -->
<Modal 
  bind:open={showEditarColaboradorModal}
  size="md"
  title={colaboradorEdicao ? 'Editar Colaborador' : 'Novo Colaborador'}
  class="rounded-sm"
>
  <div class="space-y-4">
    <div>
      <Label for="nome-colaborador" class="mb-2">Nome Completo</Label>
      <Input 
        id="nome-colaborador"
        bind:value={formData.nome}
        placeholder="Digite o nome completo"
        class="rounded-sm"
        required
      />
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <Label for="cpf-colaborador" class="mb-2">CPF</Label>
        <Input 
          id="cpf-colaborador"
          bind:value={formData.cpf}
          placeholder="000.000.000-00"
          class="rounded-sm"
          required
        />
      </div>
      
      <div>
        <Label for="cargo-colaborador" class="mb-2">Cargo</Label>
        <Input 
          id="cargo-colaborador"
          bind:value={formData.cargo}
          placeholder="Função/cargo"
          class="rounded-sm"
        />
      </div>
    </div>
    
    <div>
      <Label for="contratada-colaborador" class="mb-2">Contratada</Label>
      <Select
        id="contratada-colaborador"
        bind:value={formData.contratadaId}
        class="rounded-sm"
        required
      >
        <option value="">Selecione a contratada</option>
        {#each contratadas as contratada}
          <option value={contratada.id}>{contratada.nome}</option>
        {/each}
      </Select>
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <Label for="email-colaborador" class="mb-2">Email</Label>
        <Input 
          id="email-colaborador"
          type="email"
          bind:value={formData.email}
          placeholder="email@exemplo.com"
          class="rounded-sm"
        />
      </div>
      
      <div>
        <Label for="telefone-colaborador" class="mb-2">Telefone</Label>
        <Input 
          id="telefone-colaborador"
          bind:value={formData.telefone}
          placeholder="(00) 00000-0000"
          class="rounded-sm"
        />
      </div>
    </div>
    
    <div>
      <Label for="data-admissao" class="mb-2">Data de Admissão</Label>
      <Input 
        id="data-admissao"
        type="date"
        bind:value={formData.dataAdmissao}
        class="rounded-sm"
        required
      />
    </div>
  </div>
  
  <svelte:fragment slot="footer">
    <Button 
      color="alternative" 
      class="rounded-sm"
      on:click={() => dispatch('cancelarModal')}
    >
      Cancelar
    </Button>
    <Button 
      color="primary" 
      class="rounded-sm"
      on:click={handleSalvarColaborador}
      disabled={!formData.nome || !formData.cpf || !formData.contratadaId}
    >
      {colaboradorEdicao ? 'Atualizar' : 'Salvar'}
    </Button>
  </svelte:fragment>
</Modal>
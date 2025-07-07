<!--
  Contratada Table Presenter - Sistema DataLife EPI
  
  Componente "burro" responsável apenas pela renderização da interface de contratadas.
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
  import type { ContratadaDTO } from '$lib/types/serviceTypes';
  import type { PaginationState, FilterState } from '$lib/stores/paginatedStore';
  
  // ==================== PROPS ====================
  
  export let items: ContratadaDTO[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let pagination: PaginationState;
  export let filters: FilterState = {};
  export let embedded = false; // Para uso em tabs
  export let showNovaContratadaModal = false;
  export let showEditarContratadaModal = false;
  export let contratadaEdicao: ContratadaDTO | null = null;
  
  // ==================== EVENT DISPATCHER ====================
  
  const dispatch = createEventDispatcher<{
    pageChange: number;
    filterChange: { key: string; value: any };
    clearFilters: void;
    refresh: void;
    itemsPerPageChange: number;
    novaContratada: void;
    editarContratada: ContratadaDTO;
    excluirContratada: ContratadaDTO;
    salvarContratada: Partial<ContratadaDTO>;
    atualizarContratada: Partial<ContratadaDTO>;
    cancelarModal: void;
  }>();
  
  // ==================== LOCAL STATE ====================
  
  let itemsPerPageOptions = [
    { value: 5, label: '5 por página' },
    { value: 10, label: '10 por página' },
    { value: 25, label: '25 por página' },
    { value: 50, label: '50 por página' }
  ];
  
  let statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'true', label: 'Ativas' },
    { value: 'false', label: 'Inativas' }
  ];
  
  // Form data
  let formData = {
    nome: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    responsavel: ''
  };
  
  // ==================== COMPUTED VALUES ====================
  
  $: startIndex = (pagination.page - 1) * pagination.pageSize + 1;
  $: endIndex = Math.min(pagination.page * pagination.pageSize, pagination.total);
  $: hasFiltersApplied = Object.values(filters).some(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  // ==================== REACTIVE STATEMENTS ====================
  
  // Resetar form quando modal abre
  $: if (showNovaContratadaModal && !contratadaEdicao) {
    formData = {
      nome: '',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      responsavel: ''
    };
  }
  
  // Preencher form quando editando
  $: if (showEditarContratadaModal && contratadaEdicao) {
    formData = {
      nome: contratadaEdicao.nome || '',
      cnpj: contratadaEdicao.cnpj || '',
      endereco: contratadaEdicao.endereco || '',
      telefone: contratadaEdicao.telefone || '',
      email: contratadaEdicao.email || '',
      responsavel: contratadaEdicao.responsavel || ''
    };
  }
  
  // ==================== HELPER FUNCTIONS ====================
  
  function getStatusBadgeColor(ativo: boolean): 'green' | 'red' {
    return ativo ? 'green' : 'red';
  }
  
  function getStatusLabel(ativo: boolean): string {
    return ativo ? 'Ativa' : 'Inativa';
  }
  
  function formatCNPJ(cnpj: string): string {
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');
    
    // Aplica máscara XX.XXX.XXX/XXXX-XX
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
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
  
  function handleItemsPerPageChange(value: string): void {
    dispatch('itemsPerPageChange', parseInt(value));
  }
  
  function handleSalvarContratada(): void {
    const dados = { ...formData };
    
    if (contratadaEdicao) {
      dispatch('atualizarContratada', dados);
    } else {
      dispatch('salvarContratada', dados);
    }
  }
  
  function handleCancelarModal(): void {
    dispatch('cancelarModal');
  }
  
  function handleEditClick(contratada: ContratadaDTO): void {
    dispatch('editarContratada', contratada);
  }
  
  function handleDeleteClick(contratada: ContratadaDTO): void {
    if (confirm(`Deseja realmente excluir a contratada "${contratada.nome}"?`)) {
      dispatch('excluirContratada', contratada);
    }
  }
</script>

<!-- ==================== TEMPLATE ==================== -->

<div class="space-y-6">
  <!-- Header -->
  {#if !embedded}
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Empresas Contratadas</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie as empresas terceirizadas e seus contratos
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
          on:click={() => dispatch('novaContratada')}
        >
          <PlusOutline class="w-4 h-4 mr-2" />
          Nova Contratada
        </Button>
      </div>
    </div>
  {:else}
    <!-- Header simplificado para uso em tab -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Empresas Contratadas
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Gerencie as empresas terceirizadas e seus contratos
        </p>
      </div>
      <Button 
        size="sm" 
        color="primary" 
        class="rounded-sm"
        on:click={() => dispatch('novaContratada')}
      >
        <PlusOutline class="w-4 h-4 mr-2" />
        Contratada
      </Button>
    </div>
  {/if}

  <!-- Filtros -->
  <Card class="p-4 rounded-sm !max-w-none">
    <div class="grid gap-4 md:grid-cols-3">
      <!-- Busca por Nome -->
      <div>
        <Label for="filtro-nome" class="mb-2">Buscar por Nome</Label>
        <Input
          id="filtro-nome"
          value={filters.search || ''}
          on:input={(e) => handleFilterInput('search', e.target.value)}
          placeholder="Digite o nome da empresa..."
          size="sm"
          class="rounded-sm"
        />
      </div>
      
      <!-- Status -->
      <div>
        <Label for="filtro-status" class="mb-2">Status</Label>
        <Select
          id="filtro-status"
          value={filters.ativo || ''}
          on:change={(e) => handleFilterInput('ativo', e.target.value)}
          items={statusOptions}
          size="sm"
          class="rounded-sm"
        />
      </div>
      
      <!-- Ações -->
      <div class="flex items-end">
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
    </div>
    
    <!-- Contador de resultados -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">{pagination.total}</span> contratada(s) encontrada(s)
        {#if hasFiltersApplied}
          <span class="text-blue-600 dark:text-blue-400">com filtros aplicados</span>
        {/if}
      </div>
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
            ? 'Nenhuma contratada encontrada com os filtros aplicados.' 
            : 'Nenhuma contratada cadastrada ainda.'}
        </div>
        {#if !hasFiltersApplied}
          <Button 
            size="sm" 
            color="primary" 
            class="rounded-sm mt-4"
            on:click={() => dispatch('novaContratada')}
          >
            <PlusOutline class="w-4 h-4 mr-2" />
            Cadastrar Primeira Contratada
          </Button>
        {/if}
      </div>
    </Card>
  {:else}
    <!-- Tabela -->
    <Card class="rounded-sm !max-w-none overflow-hidden">
      <div class="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            <TableHeadCell>Empresa</TableHeadCell>
            <TableHeadCell>CNPJ</TableHeadCell>
            <TableHeadCell>Responsável</TableHeadCell>
            <TableHeadCell>Contato</TableHeadCell>
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Data Cadastro</TableHeadCell>
            <TableHeadCell>Ações</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each items as contratada}
              <TableBodyRow>
                <TableBodyCell>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {contratada.nome}
                  </div>
                  {#if contratada.endereco}
                    <div class="text-sm text-gray-500 dark:text-gray-400 max-w-48 truncate" title={contratada.endereco}>
                      {contratada.endereco}
                    </div>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  <span class="font-mono text-sm">{formatCNPJ(contratada.cnpj)}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="text-sm">{contratada.responsavel || '-'}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="text-sm">
                    {#if contratada.telefone}
                      <div>{contratada.telefone}</div>
                    {/if}
                    {#if contratada.email}
                      <div class="text-blue-600 dark:text-blue-400">{contratada.email}</div>
                    {/if}
                    {#if !contratada.telefone && !contratada.email}
                      <span class="text-gray-400">-</span>
                    {/if}
                  </div>
                </TableBodyCell>
                <TableBodyCell>
                  <Badge 
                    color={getStatusBadgeColor(contratada.ativo)} 
                    class="w-fit rounded-sm"
                  >
                    {getStatusLabel(contratada.ativo)}
                  </Badge>
                </TableBodyCell>
                <TableBodyCell>
                  <span class="text-sm">{new Date(contratada.createdAt).toLocaleDateString('pt-BR')}</span>
                </TableBodyCell>
                <TableBodyCell>
                  <div class="flex items-center space-x-1">
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={() => handleEditClick(contratada)}
                      title="Editar"
                    >
                      <EditOutline class="w-4 h-4" />
                    </button>
                    <button
                      class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                      on:click={() => handleDeleteClick(contratada)}
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
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {startIndex} a {endIndex} de {pagination.total} resultados
            </div>
            <Select
              value={pagination.pageSize.toString()}
              on:change={(e) => handleItemsPerPageChange(e.target.value)}
              items={itemsPerPageOptions}
              size="sm"
              class="w-36 rounded-sm"
            />
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
            
            <!-- Números das páginas -->
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

<!-- ==================== MODALS ==================== -->

<!-- Modal: Nova/Editar Contratada -->
<Modal 
  bind:open={showNovaContratadaModal}
  bind:open={showEditarContratadaModal}
  size="md"
  title={contratadaEdicao ? 'Editar Contratada' : 'Nova Contratada'}
  class="rounded-sm"
>
  <div class="space-y-4">
    <div>
      <Label for="nome-contratada" class="mb-2">Nome da Empresa</Label>
      <Input 
        id="nome-contratada"
        bind:value={formData.nome}
        placeholder="Digite o nome da empresa"
        class="rounded-sm"
        required
      />
    </div>
    
    <div>
      <Label for="cnpj-contratada" class="mb-2">CNPJ</Label>
      <Input 
        id="cnpj-contratada"
        bind:value={formData.cnpj}
        placeholder="00.000.000/0000-00"
        class="rounded-sm"
        required
      />
    </div>
    
    <div>
      <Label for="endereco-contratada" class="mb-2">Endereço</Label>
      <Input 
        id="endereco-contratada"
        bind:value={formData.endereco}
        placeholder="Endereço completo"
        class="rounded-sm"
      />
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <Label for="telefone-contratada" class="mb-2">Telefone</Label>
        <Input 
          id="telefone-contratada"
          bind:value={formData.telefone}
          placeholder="(00) 00000-0000"
          class="rounded-sm"
        />
      </div>
      
      <div>
        <Label for="email-contratada" class="mb-2">Email</Label>
        <Input 
          id="email-contratada"
          type="email"
          bind:value={formData.email}
          placeholder="contato@empresa.com"
          class="rounded-sm"
        />
      </div>
    </div>
    
    <div>
      <Label for="responsavel-contratada" class="mb-2">Responsável</Label>
      <Input 
        id="responsavel-contratada"
        bind:value={formData.responsavel}
        placeholder="Nome do responsável"
        class="rounded-sm"
      />
    </div>
  </div>
  
  <svelte:fragment slot="footer">
    <Button 
      color="alternative" 
      class="rounded-sm"
      on:click={handleCancelarModal}
    >
      Cancelar
    </Button>
    <Button 
      color="primary" 
      class="rounded-sm"
      on:click={handleSalvarContratada}
      disabled={!formData.nome || !formData.cnpj}
    >
      {contratadaEdicao ? 'Atualizar' : 'Salvar'}
    </Button>
  </svelte:fragment>
</Modal>
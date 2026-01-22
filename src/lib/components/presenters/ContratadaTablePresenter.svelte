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
  import TableContainer from '$lib/components/common/TableContainer.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import type { ContratadaDTO } from '$lib/types/serviceTypes';
  import type { PaginatedState } from '$lib/stores/paginatedStore';
  
  // ==================== PROPS ====================
  
  export let items: ContratadaDTO[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let pagination: any;
  export let filters: any = {};
  export let embedded = false; // Para uso em tabs
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
    { value: 5, label: '5 por página', name: '5' },
    { value: 10, label: '10 por página', name: '10' },
    { value: 25, label: '25 por página', name: '25' },
    { value: 50, label: '50 por página', name: '50' }
  ];
  
  
  // Form data simplificado - apenas campos obrigatórios
  let formData = {
    nome: '',
    cnpj: ''
  };
  
  // ==================== COMPUTED VALUES ====================
  
  $: startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
  $: endIndex = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
  $: hasFiltersApplied = Object.values(filters).some(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  // Debug logs
  $: console.log('🎨 ContratadaTablePresenter - items:', items.length, items);
  $: console.log('🎨 ContratadaTablePresenter - loading:', loading);
  $: console.log('🎨 ContratadaTablePresenter - pagination:', pagination);
  
  // ==================== REACTIVE STATEMENTS ====================
  
  // Resetar form quando modal abre
  $: if (showEditarContratadaModal && !contratadaEdicao) {
    formData = {
      nome: '',
      cnpj: ''
    };
  }
  
  // Preencher form quando editando
  $: if (showEditarContratadaModal && contratadaEdicao) {
    formData = {
      nome: contratadaEdicao.nome || '',
      cnpj: contratadaEdicao.cnpj || ''
    };
  }
  
  // ==================== HELPER FUNCTIONS ====================
  
  
  function formatCNPJ(cnpj: string): string {
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');
    
    // Aplica máscara XX.XXX.XXX/XXXX-XX
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  function generatePageNumbers(): number[] {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
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

  // Função auxiliar para eventos de select - compatível com Svelte
  function handleSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    handleItemsPerPageChange(target.value);
  }

  // Função auxiliar para eventos de input - compatível com Svelte
  function handleSearchInput(event: Event): void {
    const target = event.currentTarget as HTMLInputElement;
    handleFilterInput('search', target.value || '');
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
          on:click={() => { dispatch('novaContratada'); console.log('🚀 Botão Nova Contratada clicado'); }}
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
        on:click={() => { dispatch('novaContratada'); console.log('🚀 Botão Nova Contratada clicado'); }}
      >
        <PlusOutline class="w-4 h-4 mr-2" />
        Contratada
      </Button>
    </div>
  {/if}

  <!-- Filtros -->
  <div class={embedded ? 'p-4' : 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4'}>
    <div>
      <!-- Busca por Nome -->
      <div>
        <Label for="filtro-nome" class="mb-2">Buscar por Nome</Label>
        <Input
          id="filtro-nome"
          value={filters.search || ''}
          on:input={handleSearchInput}
          placeholder="Digite o nome da empresa..."
          size="sm"
          class="rounded-sm"
        />
      </div>
    </div>
    
    <!-- Contador de resultados -->
    <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-medium">{pagination.totalItems}</span> contratada(s) encontrada(s)
        {#if hasFiltersApplied}
          <span class="text-blue-600 dark:text-blue-400"> com filtros aplicados</span>
        {/if}
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
  </div>

  <!-- Conteúdo Principal -->
  <TableContainer
    {loading}
    {error}
    {embedded}
    isEmpty={items.length === 0}
    emptyTitle={hasFiltersApplied ? 'Nenhuma contratada encontrada com os filtros aplicados.' : 'Nenhuma contratada cadastrada ainda.'}
    emptyMessage={hasFiltersApplied ? 'Tente ajustar os filtros.' : 'Cadastre sua primeira empresa contratada.'}
    emptyActionLabel={!hasFiltersApplied ? 'Cadastrar Primeira Contratada' : ''}
    on:emptyAction={() => { dispatch('novaContratada'); console.log('🚀 Botão Nova Contratada clicado'); }}
  >
    <div class="overflow-x-auto">
      <Table hoverable>
        <TableHead>
          <TableHeadCell>Empresa</TableHeadCell>
          <TableHeadCell>CNPJ</TableHeadCell>
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
                <span class="text-sm">{new Date(contratada.createdAt).toLocaleDateString('pt-BR')}</span>
              </TableBodyCell>
              <TableBodyCell>
                <div class="flex items-center space-x-1">
                  <button
                    class="p-2 rounded-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors"
                    on:click={() => handleEditClick(contratada)}
                    title="Editar"
                  >
                    <EditOutline class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 rounded-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors"
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
            Mostrando {startIndex} a {endIndex} de {pagination.totalItems} resultados
          </div>
          <Select
            value={pagination.itemsPerPage.toString()}
            on:change={(e) => handleSelectChange(e)}
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
            disabled={pagination.currentPage <= 1}
            on:click={() => handlePageClick(pagination.currentPage - 1)}
          >
            Anterior
          </Button>
          
          <!-- Números das páginas -->
          {#each generatePageNumbers() as pageNum}
            <Button
              size="sm"
              color={pageNum === pagination.currentPage ? 'primary' : 'alternative'}
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
            disabled={pagination.currentPage >= pagination.totalPages}
            on:click={() => handlePageClick(pagination.currentPage + 1)}
          >
            Próximo
          </Button>
        </div>
      </div>
    {/if}
  </TableContainer>
</div>

<!-- ==================== MODALS ==================== -->

<!-- Modal: Nova/Editar Contratada (Formulário Simplificado) -->
<Modal 
  bind:open={showEditarContratadaModal}
  size="sm"
  title={contratadaEdicao ? 'Editar Contratada' : 'Nova Contratada'}
  class="rounded-sm"
>
  <div class="space-y-4">
    <div>
      <Label for="nome-contratada" class="mb-2">Nome da Empresa *</Label>
      <Input 
        id="nome-contratada"
        bind:value={formData.nome}
        placeholder="Digite o nome da empresa"
        class="rounded-sm"
        required
      />
    </div>
    
    <div>
      <Label for="cnpj-contratada" class="mb-2">CNPJ *</Label>
      <Input 
        id="cnpj-contratada"
        bind:value={formData.cnpj}
        placeholder="00.000.000/0000-00"
        class="rounded-sm"
        required
      />
    </div>
    
    <p class="text-sm text-gray-500 dark:text-gray-400">
      * Campos obrigatórios
    </p>
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
<!--
  DevolutionDashboard - Dashboard Avançado de Devoluções
  
  Funcionalidades:
  - Overview de equipamentos com colaboradores
  - Processos de devolução em andamento  
  - Validação automática de devoluções
  - Workflow de aprovação com assinaturas
  - Relatórios de tempo e condição
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Card, 
    Button, 
    Badge, 
    Table, 
    TableBody, 
    TableBodyCell, 
    TableBodyRow, 
    TableHead, 
    TableHeadCell,
    Tabs,
    TabItem,
    Alert,
    Modal,
    Label,
    Input,
    Textarea,
    Select,
    Spinner
  } from 'flowbite-svelte';
  import { 
    ClockOutline,
    CheckCircleOutline,
    ExclamationCircleOutline,
    UserOutline,
    FileDocOutline,
    ArrowLeftOutline
  } from 'flowbite-svelte-icons';
  
  // Stores
  import {
    devolutionProcesses,
    devolutionStats,
    equipmentWithCollaborators,
    pendingDevolutions,
    completedDevolutions,
    validateDevolutionRequest,
    requestDevolution,
    approveDevolution,
    finalizeDevolution,
    initializeDevolutionStore
  } from '$lib/stores/devolutionStore';
  import {
    CondicaoEquipamento,
    StatusDevolucao,
    type DevolutionRequest,
    type DevolutionValidation
  } from '$lib/services/devolution/devolutionAdapter';
  
  // Componentes
  import StatsCard from '$lib/components/common/StatsCard.svelte';
  import StatusBadge from '$lib/components/ui/StatusBadge.svelte';

  // Estado local
  let activeTab = 'overview';
  let loading = true;
  let error = '';
  
  // Modal de solicitação de devolução
  let showDevolutionModal = false;
  let selectedEntrega: any = null;
  let devolutionValidation: DevolutionValidation | null = null;
  let validationLoading = false;
  
  // Form de devolução
  let devolutionForm: Partial<DevolutionRequest> = {
    motivo: '',
    condicaoEquipamento: CondicaoEquipamento.BOA,
    observacoes: ''
  };
  
  // Modal de aprovação
  let showApprovalModal = false;
  let selectedProcess: any = null;
  let approvalRole = 'RESPONSAVEL';
  
  // Modal de finalização
  let showFinalizationModal = false;
  let finalCondition = CondicaoEquipamento.BOA;

  // Inicialização
  onMount(async () => {
    try {
      await initializeDevolutionStore();
    } catch (err) {
      error = 'Erro ao carregar dados de devoluções';
      console.error(err);
    } finally {
      loading = false;
    }
  });

  // Funções de manipulação

  async function openDevolutionModal(entrega: any) {
    selectedEntrega = entrega;
    devolutionForm = {
      entregaId: entrega.id,
      fichaId: entrega.fichaId,
      colaboradorId: entrega.colaboradorId,
      motivo: '',
      condicaoEquipamento: CondicaoEquipamento.BOA,
      observacoes: ''
    };
    
    // Validar devolução
    validationLoading = true;
    devolutionValidation = null;
    
    try {
      devolutionValidation = await validateDevolutionRequest(entrega.id);
    } catch (err) {
      error = 'Erro ao validar devolução';
      console.error(err);
    } finally {
      validationLoading = false;
    }
    
    showDevolutionModal = true;
  }

  async function submitDevolution() {
    if (!devolutionForm.entregaId) return;
    
    try {
      await requestDevolution(devolutionForm as DevolutionRequest);
      showDevolutionModal = false;
      selectedEntrega = null;
      devolutionValidation = null;
    } catch (err) {
      error = 'Erro ao solicitar devolução';
      console.error(err);
    }
  }

  async function openApprovalModal(process: any) {
    selectedProcess = process;
    showApprovalModal = true;
  }

  async function submitApproval() {
    if (!selectedProcess) return;
    
    try {
      await approveDevolution(selectedProcess.id, approvalRole);
      showApprovalModal = false;
      selectedProcess = null;
    } catch (err) {
      error = 'Erro ao aprovar devolução';
      console.error(err);
    }
  }

  async function openFinalizationModal(process: any) {
    selectedProcess = process;
    finalCondition = CondicaoEquipamento.BOA;
    showFinalizationModal = true;
  }

  async function submitFinalization() {
    if (!selectedProcess) return;
    
    try {
      await finalizeDevolution(selectedProcess.id, finalCondition);
      showFinalizationModal = false;
      selectedProcess = null;
    } catch (err) {
      error = 'Erro ao finalizar devolução';
      console.error(err);
    }
  }

  // Helpers
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  function calculateDaysWithCollaborator(dataEntrega: string): number {
    const entrega = new Date(dataEntrega);
    const hoje = new Date();
    return Math.ceil((hoje.getTime() - entrega.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getStatusColor(status: string): "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none" {
    const colors: Record<string, "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none"> = {
      'SOLICITADA': 'yellow',
      'EM_ANALISE': 'blue', 
      'APROVADA': 'green',
      'REJEITADA': 'red',
      'FINALIZADA': 'dark' // gray -> dark
    };
    return colors[status] || 'dark';
  }

  function getConditionColor(condition: CondicaoEquipamento): string {
    const colors: Record<CondicaoEquipamento, string> = {
      [CondicaoEquipamento.PERFEITA]: 'green',
      [CondicaoEquipamento.BOA]: 'blue',
      [CondicaoEquipamento.DANIFICADA]: 'yellow',
      [CondicaoEquipamento.PERDIDA]: 'red',
      [CondicaoEquipamento.DESCARTADA]: 'red'
    };
    return colors[condition];
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Gerenciamento de Devoluções
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Controle avançado de devoluções com validação e workflow
      </p>
    </div>
  </div>

  <!-- Stats Cards -->
  {#if $devolutionStats}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Equipamentos c/ Colaboradores"
        value={$equipmentWithCollaborators.data?.length || 0}
        icon="users"
        color="blue"
      />
      <StatsCard
        title="Devoluções Pendentes"
        value={$devolutionStats.solicitadas + $devolutionStats.emAnalise}
        icon="clock"
        color="yellow"
      />
      <StatsCard
        title="Finalizadas Este Mês"
        value={$devolutionStats.finalizadas}
        icon="check-circle"
        color="green"
      />
      <StatsCard
        title="Tempo Médio"
        value={$devolutionStats.tempoMedioProcessamento}
        suffix="horas"
        icon="chart"
        color="purple"
      />
    </div>
  {/if}

  <!-- Erro Global -->
  {#if error}
    <Alert color="red" dismissable on:close={() => error = ''}>
      <ExclamationCircleOutline slot="icon" class="w-5 h-5" />
      {error}
    </Alert>
  {/if}

  <!-- Loading -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <Spinner class="w-8 h-8" />
      <span class="ml-2">Carregando dados de devoluções...</span>
    </div>
  {:else}
    <!-- Tabs Navigation -->
    <Tabs bind:activeTabValue={activeTab} class="w-full">
      
      <!-- Tab 1: Overview com equipamentos -->
      <TabItem open value="overview" title="Equipamentos com Colaboradores">
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4">Equipamentos Atualmente com Colaboradores</h3>
            
            {#if $equipmentWithCollaborators.loading}
              <div class="flex justify-center py-8">
                <Spinner class="w-6 h-6" />
              </div>
            {:else if $equipmentWithCollaborators.data && $equipmentWithCollaborators.data.length > 0}
              <div class="overflow-x-auto">
                <Table hoverable>
                  <TableHead>
                    <TableHeadCell>Colaborador</TableHeadCell>
                    <TableHeadCell>Equipamento</TableHeadCell>
                    <TableHeadCell>Data Entrega</TableHeadCell>
                    <TableHeadCell>Dias com Colaborador</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Ações</TableHeadCell>
                  </TableHead>
                  <TableBody>
                    {#each $equipmentWithCollaborators.data as entrega (entrega.id)}
                      <TableBodyRow>
                        <TableBodyCell>
                          <div class="flex items-center gap-2">
                            <UserOutline class="w-4 h-4" />
                            {entrega.colaboradorId}
                          </div>
                        </TableBodyCell>
                        <TableBodyCell>
                          <div class="font-medium">
                            {entrega.fichaId}
                          </div>
                        </TableBodyCell>
                        <TableBodyCell>
                          {formatDate(entrega.dataEntrega)}
                        </TableBodyCell>
                        <TableBodyCell>
                          <Badge color={calculateDaysWithCollaborator(entrega.dataEntrega) > 30 ? 'red' : 'green'}>
                            {calculateDaysWithCollaborator(entrega.dataEntrega)} dias
                          </Badge>
                        </TableBodyCell>
                        <TableBodyCell>
                          <StatusBadge status={entrega.status} color="blue" label={entrega.status} />
                        </TableBodyCell>
                        <TableBodyCell>
                          <Button
                            size="sm"
                            color="primary"
                            on:click={() => openDevolutionModal(entrega)}
                          >
                            <ArrowLeftOutline class="w-4 h-4 mr-1" />
                            Solicitar Devolução
                          </Button>
                        </TableBodyCell>
                      </TableBodyRow>
                    {/each}
                  </TableBody>
                </Table>
              </div>
            {:else}
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhum equipamento com colaboradores no momento
              </div>
            {/if}
          </div>
        </Card>
      </TabItem>

      <!-- Tab 2: Devoluções Pendentes -->
      <TabItem value="pending" title="Devoluções Pendentes">
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4">Processos de Devolução em Andamento</h3>
            
            {#if $pendingDevolutions.length > 0}
              <div class="overflow-x-auto">
                <Table hoverable>
                  <TableHead>
                    <TableHeadCell>ID Processo</TableHeadCell>
                    <TableHeadCell>Colaborador</TableHeadCell>
                    <TableHeadCell>Equipamento</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Criado em</TableHeadCell>
                    <TableHeadCell>Ações</TableHeadCell>
                  </TableHead>
                  <TableBody>
                    {#each $pendingDevolutions as process (process.id)}
                      <TableBodyRow>
                        <TableBodyCell>
                          <code class="text-sm">{process.id}</code>
                        </TableBodyCell>
                        <TableBodyCell>{process.colaboradorId}</TableBodyCell>
                        <TableBodyCell>{process.fichaId}</TableBodyCell>
                        <TableBodyCell>
                          <Badge color={getStatusColor(process.status)}>
                            {process.status}
                          </Badge>
                        </TableBodyCell>
                        <TableBodyCell>
                          {formatDate(process.createdAt.toISOString())}
                        </TableBodyCell>
                        <TableBodyCell>
                          <div class="flex gap-1">
                            {#if process.status === StatusDevolucao.SOLICITADA}
                              <button
                                class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                                on:click={() => openApprovalModal(process)}
                                title="Aprovar"
                              >
                                <CheckCircleOutline class="w-4 h-4 text-green-600" />
                              </button>
                            {:else if process.status === StatusDevolucao.APROVADA}
                              <button
                                class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                                on:click={() => openFinalizationModal(process)}
                                title="Finalizar"
                              >
                                <FileDocOutline class="w-4 h-4" />
                              </button>
                            {/if}
                          </div>
                        </TableBodyCell>
                      </TableBodyRow>
                    {/each}
                  </TableBody>
                </Table>
              </div>
            {:else}
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhuma devolução pendente
              </div>
            {/if}
          </div>
        </Card>
      </TabItem>

      <!-- Tab 3: Devoluções Completas -->
      <TabItem value="completed" title="Devoluções Completas">
        <Card>
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-4">Devoluções Finalizadas</h3>
            
            {#if $completedDevolutions.length > 0}
              <div class="overflow-x-auto">
                <Table hoverable>
                  <TableHead>
                    <TableHeadCell>ID Processo</TableHeadCell>
                    <TableHeadCell>Colaborador</TableHeadCell>
                    <TableHeadCell>Equipamento</TableHeadCell>
                    <TableHeadCell>Finalizado em</TableHeadCell>
                    <TableHeadCell>Tempo Total</TableHeadCell>
                  </TableHead>
                  <TableBody>
                    {#each $completedDevolutions as process (process.id)}
                      <TableBodyRow>
                        <TableBodyCell>
                          <code class="text-sm">{process.id}</code>
                        </TableBodyCell>
                        <TableBodyCell>{process.colaboradorId}</TableBodyCell>
                        <TableBodyCell>{process.fichaId}</TableBodyCell>
                        <TableBodyCell>
                          {formatDate(process.updatedAt.toISOString())}
                        </TableBodyCell>
                        <TableBodyCell>
                          {Math.round((process.updatedAt.getTime() - process.createdAt.getTime()) / (1000 * 60 * 60))}h
                        </TableBodyCell>
                      </TableBodyRow>
                    {/each}
                  </TableBody>
                </Table>
              </div>
            {:else}
              <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhuma devolução finalizada
              </div>
            {/if}
          </div>
        </Card>
      </TabItem>
    </Tabs>
  {/if}
</div>

<!-- Modal de Solicitação de Devolução -->
<Modal bind:open={showDevolutionModal} size="lg" title="Solicitar Devolução">
  {#if selectedEntrega}
    <div class="space-y-4">
      <!-- Informações da Entrega -->
      <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 class="font-medium mb-2">Informações da Entrega</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600 dark:text-gray-400">Colaborador:</span>
            <span class="ml-2 font-medium">{selectedEntrega.colaboradorId}</span>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Equipamento:</span>
            <span class="ml-2 font-medium">{selectedEntrega.fichaId}</span>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Data Entrega:</span>
            <span class="ml-2">{formatDate(selectedEntrega.dataEntrega)}</span>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Dias com Colaborador:</span>
            <span class="ml-2">{calculateDaysWithCollaborator(selectedEntrega.dataEntrega)} dias</span>
          </div>
        </div>
      </div>

      <!-- Validação -->
      {#if validationLoading}
        <div class="flex items-center gap-2">
          <Spinner class="w-4 h-4" />
          <span>Validando possibilidade de devolução...</span>
        </div>
      {:else if devolutionValidation}
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            {#if devolutionValidation.canReturn}
              <CheckCircleOutline class="w-5 h-5 text-green-500" />
              <span class="text-green-700 dark:text-green-400 font-medium">
                Devolução pode ser processada
              </span>
            {:else}
              <ExclamationCircleOutline class="w-5 h-5 text-red-500" />
              <span class="text-red-700 dark:text-red-400 font-medium">
                Devolução bloqueada por restrições
              </span>
            {/if}
          </div>

          <!-- Restrições -->
          {#if devolutionValidation.restrictions.length > 0}
            <div class="space-y-2">
              <h5 class="font-medium text-gray-900 dark:text-white">Restrições:</h5>
              {#each devolutionValidation.restrictions as restriction}
                <Alert color={restriction.blockingLevel === 'ERROR' ? 'red' : 'yellow'}>
                  <span class="font-medium">{restriction.type}:</span>
                  {restriction.description}
                </Alert>
              {/each}
            </div>
          {/if}

          <!-- Assinaturas Requeridas -->
          {#if devolutionValidation.requiredSignatures.length > 0}
            <div class="space-y-2">
              <h5 class="font-medium text-gray-900 dark:text-white">Assinaturas Requeridas:</h5>
              <div class="space-y-1">
                {#each devolutionValidation.requiredSignatures as signature}
                  <div class="flex items-center gap-2 text-sm">
                    {#if signature.completed}
                      <CheckCircleOutline class="w-4 h-4 text-green-500" />
                    {:else}
                      <ClockOutline class="w-4 h-4 text-yellow-500" />
                    {/if}
                    <span>{signature.role}: {signature.description}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="text-sm text-gray-600 dark:text-gray-400">
            <ClockOutline class="w-4 h-4 inline mr-1" />
            Tempo estimado de processamento: {devolutionValidation.estimatedProcessingTime} horas
          </div>
        </div>
      {/if}

      <!-- Formulário -->
      {#if devolutionValidation?.canReturn}
        <div class="space-y-4">
          <div>
            <Label for="motivo">Motivo da Devolução *</Label>
            <Input
              id="motivo"
              bind:value={devolutionForm.motivo}
              placeholder="Ex: Fim do contrato, troca de equipamento..."
              required
            />
          </div>

          <div>
            <Label for="condicao">Condição do Equipamento *</Label>
            <Select id="condicao" bind:value={devolutionForm.condicaoEquipamento}>
              <option value={CondicaoEquipamento.PERFEITA}>Perfeita</option>
              <option value={CondicaoEquipamento.BOA}>Boa</option>
              <option value={CondicaoEquipamento.DANIFICADA}>Danificada</option>
              <option value={CondicaoEquipamento.PERDIDA}>Perdida</option>
              <option value={CondicaoEquipamento.DESCARTADA}>Descartada</option>
            </Select>
          </div>

          <div>
            <Label for="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              bind:value={devolutionForm.observacoes}
              placeholder="Observações adicionais sobre a devolução..."
              rows={3}
            />
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <div class="flex justify-end gap-2">
      <Button color="light" class="rounded-sm" on:click={() => showDevolutionModal = false}>
        Cancelar
      </Button>
      {#if devolutionValidation?.canReturn}
        <Button 
          color="primary" 
          class="rounded-sm"
          on:click={submitDevolution}
          disabled={!devolutionForm.motivo || !devolutionForm.condicaoEquipamento}
        >
          Solicitar Devolução
        </Button>
      {/if}
    </div>
  </svelte:fragment>
</Modal>

<!-- Modal de Aprovação -->
<Modal bind:open={showApprovalModal} size="md" title="Aprovar Devolução">
  {#if selectedProcess}
    <div class="space-y-4">
      <p>Aprovar processo de devolução:</p>
      <div class="bg-gray-50 dark:bg-gray-800 rounded p-3">
        <div class="text-sm space-y-1">
          <div><strong>ID:</strong> {selectedProcess.id}</div>
          <div><strong>Colaborador:</strong> {selectedProcess.colaboradorId}</div>
          <div><strong>Equipamento:</strong> {selectedProcess.fichaId}</div>
        </div>
      </div>
      
      <div>
        <Label for="approverRole">Função do Aprovador</Label>
        <Select id="approverRole" bind:value={approvalRole}>
          <option value="RESPONSAVEL">Responsável</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="GERENTE">Gerente</option>
        </Select>
      </div>
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <div class="flex justify-end gap-2">
      <Button color="light" class="rounded-sm" on:click={() => showApprovalModal = false}>
        Cancelar
      </Button>
      <Button color="green" class="rounded-sm" on:click={submitApproval}>
        Aprovar Devolução
      </Button>
    </div>
  </svelte:fragment>
</Modal>

<!-- Modal de Finalização -->
<Modal bind:open={showFinalizationModal} size="md" title="Finalizar Devolução">
  {#if selectedProcess}
    <div class="space-y-4">
      <p>Finalizar processo de devolução:</p>
      <div class="bg-gray-50 dark:bg-gray-800 rounded p-3">
        <div class="text-sm space-y-1">
          <div><strong>ID:</strong> {selectedProcess.id}</div>
          <div><strong>Colaborador:</strong> {selectedProcess.colaboradorId}</div>
          <div><strong>Equipamento:</strong> {selectedProcess.fichaId}</div>
        </div>
      </div>
      
      <div>
        <Label for="finalCondition">Condição Final do Equipamento</Label>
        <Select id="finalCondition" bind:value={finalCondition}>
          <option value={CondicaoEquipamento.PERFEITA}>Perfeita</option>
          <option value={CondicaoEquipamento.BOA}>Boa</option>
          <option value={CondicaoEquipamento.DANIFICADA}>Danificada</option>
          <option value={CondicaoEquipamento.PERDIDA}>Perdida</option>
          <option value={CondicaoEquipamento.DESCARTADA}>Descartada</option>
        </Select>
      </div>

      <Alert color="blue">
        <span class="font-medium">Atenção:</span>
        Equipamentos em condição "Perfeita" ou "Boa" retornarão automaticamente ao estoque disponível.
      </Alert>
    </div>
  {/if}

  <svelte:fragment slot="footer">
    <div class="flex justify-end gap-2">
      <Button color="light" class="rounded-sm" on:click={() => showFinalizationModal = false}>
        Cancelar
      </Button>
      <Button color="blue" class="rounded-sm" on:click={submitFinalization}>
        Finalizar Processo
      </Button>
    </div>
  </svelte:fragment>
</Modal>
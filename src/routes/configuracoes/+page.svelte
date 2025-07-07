<!--
  Página de Configurações - Sistema DataLife EPI
  
  Esta página permite configurar:
  - Configurações gerais do sistema (toggles)
  - Gestão de contratadas
  - Gestão de colaboradores
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card, Tabs, TabItem, Toggle, Badge, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Input, Label, Modal, Alert } from 'flowbite-svelte';
  import Icon from '$lib/components/common/Icon.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';
  import { notify } from '$lib/stores';
  
  // ✅ NOVO: Configurações conectadas ao backend real
  import { 
    getConfiguracoesSistema, 
    updateConfiguracaoBoolean, 
    CONFIG_KEYS,
    type ConfiguracaoSistemaDTO
  } from '$lib/services/core/configurationService';
  
  // ✅ NOVO: Containers para gestão de contratadas e colaboradores
  import ContratadaContainer from '$lib/components/containers/ContratadaContainer.svelte';
  import ColaboradorContainer from '$lib/components/containers/ColaboradorContainer.svelte';

  // ==================== STATE MANAGEMENT ====================
  
  // Estados de loading
  let configuracaoLoading = false;
  let contratadasLoading = false;
  let colaboradoresLoading = false;
  
  // Estados de erro
  let configuracaoError: string | null = null;
  let contratadasError: string | null = null;
  let colaboradoresError: string | null = null;
  
  // ==================== CONFIGURAÇÕES GERAIS ====================
  
  // ✅ NOVO: Configurações do sistema carregadas do backend real
  let configuracoesSistema: ConfiguracaoSistemaDTO[] = [];
  let permitirEstoqueNegativo = false;
  let permitirAjusteEstoqueDireto = true;
  let configuracoesSalvando = false;
  
  // ==================== CONTRATADAS & COLABORADORES ====================
  // ✅ REMOVIDO: Estado mockado das abas - agora usam Enhanced Paginated Store
  // As abas agora usam ContratadaContainer e ColaboradorContainer com arquitetura moderna
  
  // ==================== LIFECYCLE ====================
  
  onMount(() => {
    console.log('🔧 Inicializando página de configurações...');
    loadConfiguracoes();
  });
  
  // ==================== CONFIGURAÇÕES GERAIS ====================
  
  async function loadConfiguracoes(): Promise<void> {
    configuracaoLoading = true;
    configuracaoError = null;
    
    try {
      console.log('⚙️ Carregando configurações gerais do backend...');
      
      // ✅ CONECTADO AO BACKEND REAL: Carregar configurações
      configuracoesSistema = await getConfiguracoesSistema();
      
      // Mapear configurações específicas
      const estoqueNegativo = configuracoesSistema.find(
        config => config.chave === CONFIG_KEYS.PERMITIR_ESTOQUE_NEGATIVO
      );
      const ajustesForcados = configuracoesSistema.find(
        config => config.chave === CONFIG_KEYS.PERMITIR_AJUSTES_FORCADOS
      );
      
      permitirEstoqueNegativo = estoqueNegativo?.valorParsed === true;
      permitirAjusteEstoqueDireto = ajustesForcados?.valorParsed === true;
      
      console.log('✅ Configurações carregadas do backend:', {
        permitirEstoqueNegativo,
        permitirAjusteEstoqueDireto,
        totalConfiguracoes: configuracoesSistema.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      configuracaoError = 'Erro ao carregar configurações do sistema';
    } finally {
      configuracaoLoading = false;
    }
  }
  
  async function salvarConfiguracaoEstoqueNegativo(): Promise<void> {
    if (configuracoesSalvando) return;
    
    configuracoesSalvando = true;
    
    try {
      console.log('💾 Salvando configuração de estoque negativo:', permitirEstoqueNegativo);
      
      // ✅ CONECTADO AO BACKEND REAL: Atualizar configuração
      await updateConfiguracaoBoolean(CONFIG_KEYS.PERMITIR_ESTOQUE_NEGATIVO, permitirEstoqueNegativo);
      
      notify.success('Configuração salva', 'Permissão de estoque negativo atualizada');
      
    } catch (error) {
      console.error('❌ Erro ao salvar configuração de estoque negativo:', error);
      notify.error('Erro ao salvar', 'Não foi possível salvar a configuração');
      
      // Reverter mudança em caso de erro
      permitirEstoqueNegativo = !permitirEstoqueNegativo;
    } finally {
      configuracoesSalvando = false;
    }
  }
  
  async function salvarConfiguracaoAjustesDiretos(): Promise<void> {
    if (configuracoesSalvando) return;
    
    configuracoesSalvando = true;
    
    try {
      console.log('💾 Salvando configuração de ajustes diretos:', permitirAjusteEstoqueDireto);
      
      // ✅ CONECTADO AO BACKEND REAL: Atualizar configuração
      await updateConfiguracaoBoolean(CONFIG_KEYS.PERMITIR_AJUSTES_FORCADOS, permitirAjusteEstoqueDireto);
      
      notify.success('Configuração salva', 'Permissão de ajustes diretos atualizada');
      
    } catch (error) {
      console.error('❌ Erro ao salvar configuração de ajustes diretos:', error);
      notify.error('Erro ao salvar', 'Não foi possível salvar a configuração');
      
      // Reverter mudança em caso de erro
      permitirAjusteEstoqueDireto = !permitirAjusteEstoqueDireto;
    } finally {
      configuracoesSalvando = false;
    }
  }
</script>

<!-- SEO -->
<svelte:head>
  <title>Configurações - DataLife EPI</title>
  <meta name="description" content="Configure as opções do sistema, gerencie contratadas e colaboradores" />
</svelte:head>

<!-- Page Content -->
<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Configure as opções do sistema e gerencie recursos
      </p>
    </div>
    <div class="flex items-center space-x-2">
      <Icon name="CogOutline" className="text-gray-500" size="w-6 h-6" />
    </div>
  </div>

  <!-- Tabs Content -->
  <Card class="p-0 rounded-sm !max-w-none">
    <Tabs 
      tabStyle="underline" 
      contentClass="p-6"
    >
      
      <!-- Tab: Configurações Gerais -->
      <TabItem 
        open 
        title="Configurações Gerais"
      >
        {#if configuracaoLoading}
          <div class="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        {:else if configuracaoError}
          <ErrorDisplay message={configuracaoError} />
        {:else}
          <div class="space-y-6">
            <div class="grid gap-6 md:grid-cols-2">
              
              <!-- Configurações de Estoque -->
              <Card class="rounded-sm !max-w-none">
                <div class="flex items-center space-x-3 mb-4">
                  <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-sm">
                    <Icon name="CubeOutline" className="text-blue-600 dark:text-blue-400" size="w-5 h-5" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Gestão de Estoque
                  </h3>
                </div>
                
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <Label class="text-sm font-medium text-gray-900 dark:text-white">
                        Permitir estoque negativo
                      </Label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Permite que itens tenham quantidade negativa no estoque
                      </p>
                    </div>
                    <Toggle 
                      bind:checked={permitirEstoqueNegativo}
                      on:change={salvarConfiguracaoEstoqueNegativo}
                      disabled={configuracoesSalvando}
                    />
                  </div>
                  
                  <div class="flex items-center justify-between">
                    <div>
                      <Label class="text-sm font-medium text-gray-900 dark:text-white">
                        Permitir ajuste direto de estoque
                      </Label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Permite ajustes manuais de quantidade sem movimentação
                      </p>
                    </div>
                    <Toggle 
                      bind:checked={permitirAjusteEstoqueDireto}
                      on:change={salvarConfiguracaoAjustesDiretos}
                      disabled={configuracoesSalvando}
                    />
                  </div>
                </div>
              </Card>
              
              <!-- Status das Configurações -->
              <Card class="rounded-sm !max-w-none">
                <div class="flex items-center space-x-3 mb-4">
                  <div class="p-2 bg-green-100 dark:bg-green-900 rounded-sm">
                    <Icon name="CheckCircleOutline" className="text-green-600 dark:text-green-400" size="w-5 h-5" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Status do Sistema
                  </h3>
                </div>
                
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Backend conectado:</span>
                    <Badge color="green" class="w-fit rounded-sm">Online</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Base de dados:</span>
                    <Badge color="green" class="w-fit rounded-sm">PostgreSQL</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Configurações carregadas:</span>
                    <span class="text-sm text-gray-900 dark:text-white">{configuracoesSistema.length}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Última sincronização:</span>
                    <span class="text-sm text-gray-900 dark:text-white">Agora</span>
                  </div>
                </div>
              </Card>
              
            </div>
            
            <!-- Todas as Configurações -->
            {#if configuracoesSistema.length > 0}
              <Card class="rounded-sm !max-w-none">
                <div class="flex items-center space-x-3 mb-4">
                  <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-sm">
                    <Icon name="TableCellsOutline" className="text-blue-600 dark:text-blue-400" size="w-5 h-5" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Todas as Configurações
                  </h3>
                </div>
                
                <div class="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableHeadCell>Configuração</TableHeadCell>
                      <TableHeadCell>Valor</TableHeadCell>
                      <TableHeadCell>Tipo</TableHeadCell>
                      <TableHeadCell>Descrição</TableHeadCell>
                    </TableHead>
                    <TableBody>
                      {#each configuracoesSistema as config}
                        <TableBodyRow>
                          <TableBodyCell>
                            <span class="font-mono text-sm">{config.chave}</span>
                          </TableBodyCell>
                          <TableBodyCell>
                            <Badge 
                              color={config.tipo === 'BOOLEAN' ? (config.valorParsed ? 'green' : 'red') : 'blue'} 
                              class="w-fit rounded-sm"
                            >
                              {config.valor}
                            </Badge>
                          </TableBodyCell>
                          <TableBodyCell>
                            <span class="text-sm text-gray-600 dark:text-gray-400">{config.tipo}</span>
                          </TableBodyCell>
                          <TableBodyCell>
                            <span class="text-sm">{config.descricao}</span>
                          </TableBodyCell>
                        </TableBodyRow>
                      {/each}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            {/if}
            
            {#if configuracoesSalvando}
              <Alert color="blue" class="rounded-sm">
                <Icon name="InformationCircleOutline" slot="icon" className="w-4 h-4" />
                Salvando configurações...
              </Alert>
            {/if}
          </div>
        {/if}
      </TabItem>

      <!-- Tab: Contratadas -->
      <TabItem 
        title="Contratadas"
      >
        <!-- ✅ NOVA ARQUITETURA: Container/Presenter com Enhanced Paginated Store -->
        <ContratadaContainer 
          initialPageSize={10}
          embedded={true}
        />
      </TabItem>

      <!-- Tab: Colaboradores -->
      <TabItem 
        title="Colaboradores"
      >
        <!-- ✅ NOVA ARQUITETURA: Container/Presenter com Enhanced Paginated Store -->
        <ColaboradorContainer 
          initialPageSize={10}
          embedded={true}
        />
      </TabItem>

    </Tabs>
  </Card>
</div>
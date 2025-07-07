<!--
  Relatórios Personalizados - Sistema DataLife EPI
  
  Interface para criar, configurar e exportar relatórios personalizados.
  Sistema de construção de relatórios sob demanda.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Select, Input, Label, Checkbox, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell } from 'flowbite-svelte';
  import { DownloadOutline, PlayOutline, SaveOutline, EyeOutline } from 'flowbite-svelte-icons';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import { notify } from '$lib/stores';
  
  // Tipos para o builder
  interface ReportConfig {
    tipo: string;
    campos: string[];
    filtros: Record<string, any>;
    agrupamento?: string;
    ordenacao?: { campo: string; direcao: 'asc' | 'desc' };
    formato: 'pdf' | 'excel' | 'csv';
  }

  // State
  let loading = false;
  let previewData: any[] = [];
  let reportConfig: ReportConfig = {
    tipo: 'fichas',
    campos: [],
    filtros: {},
    formato: 'pdf'
  };
  
  // Opções disponíveis
  let tiposRelatorio = [
    { value: 'fichas', label: 'Fichas EPI' },
    { value: 'estoque', label: 'Estoque' },
    { value: 'entregas', label: 'Entregas' },
    { value: 'movimentacoes', label: 'Movimentações' },
    { value: 'colaboradores', label: 'Colaboradores' },
    { value: 'descartes', label: 'Descartes' }
  ];

  let formatosDisponiveis = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
  ];

  // Campos disponíveis por tipo de relatório
  let camposDisponiveis: Record<string, Array<{ value: string; label: string }>> = {
    fichas: [
      { value: 'colaborador', label: 'Colaborador' },
      { value: 'contratada', label: 'Contratada' },
      { value: 'equipamento', label: 'Equipamento' },
      { value: 'dataEntrega', label: 'Data Entrega' },
      { value: 'dataVencimento', label: 'Data Vencimento' },
      { value: 'status', label: 'Status' }
    ],
    estoque: [
      { value: 'equipamento', label: 'Equipamento' },
      { value: 'categoria', label: 'Categoria' },
      { value: 'quantidade', label: 'Quantidade' },
      { value: 'valor', label: 'Valor' },
      { value: 'almoxarifado', label: 'Almoxarifado' },
      { value: 'status', label: 'Status' }
    ],
    entregas: [
      { value: 'colaborador', label: 'Colaborador' },
      { value: 'equipamento', label: 'Equipamento' },
      { value: 'dataEntrega', label: 'Data Entrega' },
      { value: 'assinatura', label: 'Assinatura' },
      { value: 'responsavel', label: 'Responsável' }
    ]
  };

  $: camposAtuais = camposDisponiveis[reportConfig.tipo] || [];

  onMount(() => {
    console.log('📋 Inicializando builder de relatórios personalizados...');
  });

  async function gerarPreview(): Promise<void> {
    loading = true;
    
    try {
      console.log('👁️ Gerando preview do relatório...', reportConfig);
      
      // TODO: Implementar geração de preview
      // const preview = await reportingQueryAdapter.gerarPreview(reportConfig);
      
      // Mock data para demonstração
      previewData = [
        { colaborador: 'João Silva', equipamento: 'Capacete', status: 'Ativo' },
        { colaborador: 'Maria Santos', equipamento: 'Luvas', status: 'Vencido' },
        { colaborador: 'Pedro Costa', equipamento: 'Óculos', status: 'Ativo' }
      ];
      
      notify.success('Preview', 'Preview gerado com sucesso');
      
    } catch (err) {
      console.error('❌ Erro ao gerar preview:', err);
      notify.error('Erro', 'Não foi possível gerar o preview');
    } finally {
      loading = false;
    }
  }

  async function exportarRelatorio(): Promise<void> {
    loading = true;
    
    try {
      console.log('📥 Exportando relatório personalizado...', reportConfig);
      
      // TODO: Implementar exportação real
      notify.success('Exportação', `Relatório exportado em ${reportConfig.formato.toUpperCase()}`);
      
    } catch (err) {
      console.error('❌ Erro ao exportar relatório:', err);
      notify.error('Erro', 'Não foi possível exportar o relatório');
    } finally {
      loading = false;
    }
  }

  async function salvarTemplate(): Promise<void> {
    try {
      console.log('💾 Salvando template...', reportConfig);
      
      // TODO: Implementar salvamento de template
      notify.success('Template', 'Template salvo com sucesso');
      
    } catch (err) {
      console.error('❌ Erro ao salvar template:', err);
      notify.error('Erro', 'Não foi possível salvar o template');
    }
  }

  function handleCampoChange(campo: string, checked: boolean): void {
    if (checked) {
      reportConfig.campos = [...reportConfig.campos, campo];
    } else {
      reportConfig.campos = reportConfig.campos.filter(c => c !== campo);
    }
  }
</script>

<svelte:head>
  <title>Relatórios Personalizados - DataLife EPI</title>
  <meta name="description" content="Construtor de relatórios personalizados com filtros avançados e múltiplos formatos" />
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Relatórios Personalizados</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Construa relatórios sob medida com filtros e campos personalizados
      </p>
    </div>
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Builder de Relatório -->
    <div class="space-y-6">
      <!-- Configuração Básica -->
      <Card class="rounded-sm !max-w-none">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuração Básica</h3>
        
        <div class="space-y-4">
          <div>
            <Label for="tipoRelatorio" class="mb-2">Tipo de Relatório</Label>
            <Select 
              id="tipoRelatorio"
              bind:value={reportConfig.tipo}
              items={tiposRelatorio}
              class="rounded-sm"
            />
          </div>
          
          <div>
            <Label for="formato" class="mb-2">Formato de Exportação</Label>
            <Select 
              id="formato"
              bind:value={reportConfig.formato}
              items={formatosDisponiveis}
              class="rounded-sm"
            />
          </div>
        </div>
      </Card>

      <!-- Seleção de Campos -->
      <Card class="rounded-sm !max-w-none">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campos do Relatório</h3>
        
        <div class="space-y-3">
          {#each camposAtuais as campo}
            <div class="flex items-center">
              <Checkbox 
                checked={reportConfig.campos.includes(campo.value)}
                on:change={(e) => handleCampoChange(campo.value, e.target?.checked)}
                class="mr-3"
              />
              <Label class="cursor-pointer">{campo.label}</Label>
            </div>
          {/each}
        </div>
      </Card>

      <!-- Filtros -->
      <Card class="rounded-sm !max-w-none">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
        
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <Label for="dataInicio" class="mb-2">Data Início</Label>
            <Input 
              id="dataInicio"
              type="date"
              bind:value={reportConfig.filtros.dataInicio}
              class="rounded-sm"
            />
          </div>
          
          <div>
            <Label for="dataFim" class="mb-2">Data Fim</Label>
            <Input 
              id="dataFim"
              type="date"
              bind:value={reportConfig.filtros.dataFim}
              class="rounded-sm"
            />
          </div>
        </div>
      </Card>

      <!-- Ações -->
      <Card class="rounded-sm !max-w-none">
        <div class="flex flex-wrap gap-3">
          <Button 
            size="sm" 
            color="alternative" 
            class="rounded-sm"
            on:click={gerarPreview}
            disabled={loading || reportConfig.campos.length === 0}
          >
            <EyeOutline class="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Button 
            size="sm" 
            color="primary" 
            class="rounded-sm"
            on:click={exportarRelatorio}
            disabled={loading || reportConfig.campos.length === 0}
          >
            <DownloadOutline class="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button 
            size="sm" 
            color="green" 
            class="rounded-sm"
            on:click={salvarTemplate}
            disabled={loading || reportConfig.campos.length === 0}
          >
            <SaveOutline class="w-4 h-4 mr-2" />
            Salvar Template
          </Button>
        </div>
      </Card>
    </div>

    <!-- Preview -->
    <div>
      <Card class="rounded-sm !max-w-none">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
        
        {#if loading}
          <div class="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        {:else if previewData.length > 0}
          <div class="overflow-x-auto">
            <Table hoverable>
              <TableHead>
                {#each reportConfig.campos as campo}
                  <TableHeadCell>
                    {camposAtuais.find(c => c.value === campo)?.label || campo}
                  </TableHeadCell>
                {/each}
              </TableHead>
              <TableBody>
                {#each previewData as row}
                  <TableBodyRow>
                    {#each reportConfig.campos as campo}
                      <TableBodyCell>{row[campo] || '-'}</TableBodyCell>
                    {/each}
                  </TableBodyRow>
                {/each}
              </TableBody>
            </Table>
          </div>
        {:else}
          <div class="text-center py-12">
            <PlayOutline class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">
              Selecione os campos e clique em "Preview" para visualizar o relatório
            </p>
          </div>
        {/if}
      </Card>
    </div>
  </div>
</div>
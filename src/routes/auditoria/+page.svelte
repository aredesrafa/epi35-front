<!--
  Página de Auditoria - Sistema DataLife EPI
  
  ✅ MIGRADA para arquitetura Container/Presenter
  ✅ Enhanced Paginated Store com server-side pagination
  ✅ Conectada ao endpoint correto: /api/relatorios/movimentacoes
  ✅ Event Source completo (livro-razão imutável)
  ✅ Filtros avançados: almoxarifado, tipo EPI, usuário, período
  ✅ Tipos de movimentação atualizados conforme backend
  ✅ Cache inteligente e debounce otimizado
  
  ENDPOINT: GET /api/relatorios/movimentacoes
  - Event Source Completo (tabela movimentacoes_estoque)
  - Filtros: almoxarifadoId, tipoEpiId, tipoMovimentacao, usuarioId, dataInicio, dataFim
  - Tipos: ENTRADA_NOTA, SAIDA_ENTREGA, ENTRADA_DEVOLUCAO, etc.
  
  ANTES: 430 linhas com paginação manual no cliente
  DEPOIS: 15 linhas usando Container/Presenter pattern
-->

<script lang="ts">
  import AuditoriaContainer from '$lib/components/containers/AuditoriaContainer.svelte';
</script>

<svelte:head>
  <title>Auditoria de Movimentações - DataLife EPI</title>
  <meta name="description" content="Auditoria completa de movimentações de estoque com rastreabilidade e filtros avançados" />
</svelte:head>

<AuditoriaContainer 
  initialPageSize={10}
  autoRefresh={false}
/>
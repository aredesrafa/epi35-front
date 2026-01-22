<!--
  Página de Fichas EPI - Arquitetura Container/Presenter com Enhanced Store
  
  Migrada para usar:
  - Enhanced Paginated Store para performance otimizada
  - Container/Presenter Pattern
  - Service adapters para dados reais do backend
  - Cache inteligente e debounce automático
-->

<script lang="ts">
  import FichasContainer from '$lib/components/containers/FichasContainer.svelte';
</script>

<svelte:head>
  <title>Fichas de EPI - DataLife EPI</title>
</svelte:head>

<!-- Use the new Container/Presenter architecture -->
<FichasContainer 
  initialPageSize={10}
/>
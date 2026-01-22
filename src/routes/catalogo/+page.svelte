<script lang="ts">
  import CatalogContainer from '$lib/components/containers/CatalogContainer.svelte';
</script>

<!-- Use the new Container/Presenter architecture -->
<CatalogContainer 
  initialPageSize={10}
  autoRefresh={false}
/>
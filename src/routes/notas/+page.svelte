<script lang="ts">
  import NotesContainer from '$lib/components/containers/NotesContainer.svelte';
</script>

<!-- Use the new Container/Presenter architecture -->
<NotesContainer 
  initialPageSize={10}
/>
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirecionar para a página de auditoria (única sub-página existente)
    goto('/relatorios/auditoria');
  });
</script>

<!-- Redirecionamento automático -->
<div class="flex items-center justify-center min-h-screen">
  <p class="text-gray-500">Redirecionando para auditoria...</p>
</div>
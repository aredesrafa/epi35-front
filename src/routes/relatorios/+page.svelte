<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirecionar para o dashboard executivo
    goto('/relatorios/dashboard');
  });
</script>

<!-- Redirecionamento automático -->
<div class="flex items-center justify-center min-h-screen">
  <p class="text-gray-500">Redirecionando para o dashboard executivo...</p>
</div>
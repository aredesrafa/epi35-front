<!-- StatusBadge Temporário -->
<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  
  export let status: string;
  export let color: string;
  export let label: string;
</script>

<Badge {color} class="text-xs rounded-sm">
  {label}
</Badge>
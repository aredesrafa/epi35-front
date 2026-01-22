<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  
  export const status: string = '';
  export let color: "green" | "red" | "yellow" | "primary" | "blue" | "dark" | "purple" | "indigo" | "pink" | "none";
  export let label: string;
  export let extraClass: string = '';
</script>

<Badge {color} class="text-xs {extraClass || 'rounded-sm'}">
  {label}
</Badge>
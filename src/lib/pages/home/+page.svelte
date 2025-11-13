<script lang="ts">
  import { onMount } from "svelte";
  import { authService } from "$lib/services/AuthService";
  import { Button } from "$lib/components/ui/button/index.js";

  let userName = "Usuario";

  onMount(async () => {
    const currentUser = await authService.getCurrentUser();
    userName = currentUser?.name || "Usuario";
  });

  const handleLogout = async () => {
    await authService.logout();
  };
</script>

<div class="flex items-center justify-center min-h-screen bg-background">
  <div class="flex flex-col items-center gap-6">
    <h1 class="text-4xl font-bold">
      Bienvenido, {userName}
    </h1>

    <Button onclick={handleLogout} size="lg">Cerrar Sesión</Button>
  </div>
</div>

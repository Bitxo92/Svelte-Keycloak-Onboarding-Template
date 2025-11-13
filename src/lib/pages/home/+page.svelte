<script lang="ts">
  import { user } from "$lib/stores/auth";
  import { authService } from "$lib/services/AuthService";
  import { Button } from "$lib/components/ui/button/index.js";

  interface UserInfo {
    name?: string;
  }

  $: userName = ($user as unknown as UserInfo)?.name || "Usuario";

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

<script lang="ts">
  import LoginForm from "$lib/components/login-form.svelte";
  import { PanelsRightBottom } from "@lucide/svelte";
  import Logo from "../../../assets/triplealpha_logo.png";

  // Set to "color" or "image"
  const bgType: "color" | "image" = "color";
  const bgColor = "white";
  const bgImage = Logo;
</script>

<div
  class="flex items-center justify-center min-h-screen"
  style={bgType === "color"
    ? `background-color: ${bgColor};`
    : `background-image: url(${bgImage}); background-size: cover; background-position: center;`}
>
  <LoginForm
    class="w-full max-w-4xl"
    imageSrc={Logo}
    imageAlt="Logo"
    title="Bienvenido"
    bgColor={"rgba(0, 0, 0, 0.1)"}
    description="Introduce tus credenciales para iniciar sesión en tu cuenta."
  />
</div>

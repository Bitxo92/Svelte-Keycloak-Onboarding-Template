<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
    FieldSeparator,
  } from "$lib/components/ui/field/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import { UserRound, Lock, Eye, EyeOff } from "@lucide/svelte";
  import { authService } from "$lib/services/AuthService";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    imageSrc?: string;
    imageAlt?: string;
    title?: string;
    bgColor?: string;
    description?: string;
  }

  let {
    class: className,
    imageSrc = "/placeholder.svg",
    imageAlt = "placeholder",
    title = "Bienvenido",
    bgColor = "black",
    description = "Introduce tus credenciales para iniciar sesión en tu cuenta.",
    ...restProps
  }: Props = $props();

  const id = Math.random().toString(36).slice(2, 9);
  let showPassword = $state(false);
  let username = $state("");
  let password = $state("");
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    error = null;
    isLoading = true;

    try {
      await authService.login({
        username,
        password,
      });

      // Dispatch login success event for parent component to handle navigation
      window.dispatchEvent(new CustomEvent("login-success"));

      // Fallback navigation in case event isn't handled
      setTimeout(() => {
        window.location.href = "/home";
      }, 100);
    } catch (err: any) {
      error = err.message || "Error during login. Please try again.";
      console.error("Login error:", err);
    } finally {
      isLoading = false;
    }
  };
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
  <Card.Root class="overflow-hidden p-0 bg-transparent">
    <Card.Content class="grid p-0 md:grid-cols-2">
      <form class="p-6 md:p-8 bg-white" onsubmit={handleSubmit}>
        <FieldGroup>
          <div class="flex flex-col items-center gap-2 text-center">
            <h1 class="text-2xl font-bold">{title}</h1>
            <p class="text-muted-foreground text-balance">
              {description}
            </p>
          </div>

          {#if error}
            <div
              class="p-3 bg-destructive/10 text-destructive rounded-md text-sm"
            >
              {error}
            </div>
          {/if}

          <Field>
            <div class="flex items-center gap-2 ml-2">
              <UserRound class="h-4 w-4 text-muted-foreground" />
              <FieldLabel for="username-{id}">Usuario</FieldLabel>
            </div>
            <Input
              id="username-{id}"
              type="text"
              placeholder="tu_usuario"
              required
              disabled={isLoading}
              bind:value={username}
            />
          </Field>
          <Field>
            <div class="flex items-center">
              <div class="flex items-center gap-2 ml-2">
                <Lock class="h-4 w-4 text-muted-foreground" />
                <FieldLabel for="password-{id}">Contraseña</FieldLabel>
              </div>
              <a
                href="##"
                class="ml-auto text-sm underline-offset-2 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div class="relative flex items-center">
              <Input
                id="password-{id}"
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                bind:value={password}
              />
              <button
                type="button"
                onclick={() => (showPassword = !showPassword)}
                disabled={isLoading}
                class="absolute right-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {#if showPassword}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
          </Field>
          <Field>
            <Button type="submit" disabled={isLoading} class="w-full">
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <div
        class="relative hidden md:flex md:items-center md:justify-center"
        style="background-color: {bgColor};"
      >
        <img src={imageSrc} alt={imageAlt} class="h-50 w-auto object-cover" />
      </div>
    </Card.Content>
  </Card.Root>
</div>

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
        window.location.href = "/";
      }, 100);
    } catch (err: any) {
      error = err.message || "Error during login. Please try again.";
      console.error("Login error:", err);
    } finally {
      isLoading = false;
    }
  };
</script>

<div
  class={cn(
    "w-full flex items-center justify-center min-h-screen px-4",
    className
  )}
  {...restProps}
>
  <Card.Root
    class="overflow-hidden p-0 bg-transparent w-full max-w-lg md:max-w-4xl"
  >
    <Card.Content class="grid p-0 grid-cols-1 md:grid-cols-2">
      <form
        class="p-6 sm:p-8 md:p-10 bg-white space-y-4"
        onsubmit={handleSubmit}
      >
        <FieldGroup class="space-y-4">
          <div class="flex flex-col items-center gap-1 text-center">
            <h1 class=" sm:text-3xl md: text-4xl font-bold">{title}</h1>
            <p class="text-sm sm:text-base text-muted-foreground">
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
            <div class="flex items-center gap-2">
              <UserRound class="h-4 w-4 text-muted-foreground shrink-0" />
              <FieldLabel for="username-{id}">Usuario</FieldLabel>
            </div>
            <Input
              id="username-{id}"
              type="text"
              placeholder="tu nombre de usuario"
              required
              disabled={isLoading}
              bind:value={username}
              class="text-sm sm:text-base"
            />
          </Field>
          <Field>
            <div class="flex items-center gap-2">
              <Lock class="h-4 w-4 text-muted-foreground shrink-0" />
              <FieldLabel for="password-{id}">Contraseña</FieldLabel>
            </div>
            <div class="relative flex items-center">
              <Input
                id="password-{id}"
                type={showPassword ? "text" : "password"}
                required
                placeholder="tu contraseña"
                disabled={isLoading}
                bind:value={password}
                class="text-sm sm:text-base pr-10"
              />
              <button
                type="button"
                onclick={() => (showPassword = !showPassword)}
                disabled={isLoading}
                class="absolute right-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 hover:cursor-pointer p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {#if showPassword}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            <div class="flex justify-end pt-1">
              <button
                type="button"
                onclick={(e) => {
                  e.preventDefault();
                  // Implement password recovery logic here
                }}
                class="text-sm text-muted-foreground underline-offset-2 hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </Field>
          <Field class="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              class="w-full h-10 text-base hover:cursor-pointer"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <div
        class="relative hidden md:flex md:items-center md:justify-center bg-linear-to-br from-gray-900 to-gray-800 min-h-96"
        style="background-color: {bgColor};"
      >
        <img src={imageSrc} alt={imageAlt} class="w-full h-full object-cover" />
      </div>
    </Card.Content>
  </Card.Root>
</div>

<script lang="ts">
  import { onMount } from "svelte";
  import "./app.css";
  import HomePage from "$lib/pages/home/+page.svelte";
  import LoginPage from "$lib/pages/login/+page.svelte";
  import { isAuthenticated } from "$lib/stores/auth";
  import { authService } from "$lib/services/AuthService";

  let currentPage = $state("home");
  let authInitialized = $state(false);

  onMount(() => {
    // Initialize Keycloak authentication
    authService.initialize().then(() => {
      authInitialized = true;

      // Route based on authentication status
      const path = window.location.pathname;
      handleRouting(path);
    });

    const handleNavigation = () => {
      const path = window.location.pathname;
      handleRouting(path);
    };

    // Listen for successful login event from login form
    const handleLoginSuccess = () => {
      window.history.pushState(null, "", "/home");
      currentPage = "home";
    };

    // Listen for logout event
    const handleLogoutSuccess = () => {
      window.history.pushState(null, "", "/login");
      currentPage = "login";
    };

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("login-success", handleLoginSuccess);
    window.addEventListener("logout-success", handleLogoutSuccess);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("login-success", handleLoginSuccess);
      window.removeEventListener("logout-success", handleLogoutSuccess);
    };
  });

  const handleRouting = (path: string) => {
    const authenticated = $isAuthenticated;

    if (path === "/login") {
      currentPage = "login";
    } else if (path === "/" || path === "/home") {
      // Protect home page - redirect to login if not authenticated
      if (!authenticated) {
        window.history.pushState(null, "", "/login");
        currentPage = "login";
      } else {
        currentPage = "home";
      }
    } else {
      // Default to home, which will redirect to login if not authenticated
      if (!authenticated) {
        window.history.pushState(null, "", "/login");
        currentPage = "login";
      } else {
        currentPage = "home";
      }
    }
  };
</script>

{#if authInitialized}
  {#if currentPage === "home"}
    <HomePage />
  {:else if currentPage === "login"}
    <LoginPage />
  {/if}
{:else}
  <div class="flex items-center justify-center min-h-screen">
    <p class="text-muted-foreground">Loading...</p>
  </div>
{/if}

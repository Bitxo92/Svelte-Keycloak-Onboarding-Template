import { get } from "svelte/store";
import keycloak, { KEYCLOAK_CONFIG } from "$lib/utils/keycloak";
import {
  isAuthenticated,
  user,
  token,
  inactivityTimeRemaining,
} from "$lib/stores/auth";

// Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
  password_expiration: null | number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
  session_id: string;
}

export interface AuthError {
  code: string;
  message: string;
  details: any;
}

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Usuario o contraseña inválidos",
  UNAUTHORIZED_ACCESS: "Acceso no autorizado",
  TOKEN_EXPIRED: "El token ha expirado",
  UNKNOWN_ERROR: "Error desconocido en la autenticación",
};

// Token refresh interval ID
let tokenRefreshInterval: number | null = null;

// Inactivity timer variables
let inactivityTimeout: number | null = null;
let inactivityCountdownInterval: number | null = null;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

// LocalStorage keys for persisting auth data
const STORAGE_KEYS = {
  TOKEN: "keycloak_token",
  REFRESH_TOKEN: "keycloak_refresh_token",
  ID_TOKEN: "keycloak_id_token",
  TOKEN_PARSED: "keycloak_token_parsed",
} as const;

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * #########################################################################################################################################################
   * # Token Management in Local Storage
   * #########################################################################################################################################################
   */

  /**
   * Save tokens to localStorage
   */
  private saveTokensToStorage(data: any): void {
    if (!isBrowser) return;

    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      localStorage.setItem(STORAGE_KEYS.ID_TOKEN, data.id_token);
      if (data.tokenParsed) {
        localStorage.setItem(
          STORAGE_KEYS.TOKEN_PARSED,
          JSON.stringify(data.tokenParsed)
        );
      }
      console.log("💾 Tokens saved to localStorage");
    } catch (error) {
      console.error("Error saving tokens to localStorage:", error);
    }
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokensFromStorage(): any | null {
    if (!isBrowser) return null;

    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const idToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
      const tokenParsedStr = localStorage.getItem(STORAGE_KEYS.TOKEN_PARSED);

      if (token && refreshToken) {
        return {
          access_token: token,
          refresh_token: refreshToken,
          id_token: idToken,
          tokenParsed: tokenParsedStr ? JSON.parse(tokenParsedStr) : null,
        };
      }
      return null;
    } catch (error) {
      console.error("Error loading tokens from localStorage:", error);
      return null;
    }
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokensFromStorage(): void {
    if (!isBrowser) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_PARSED);
      console.log("🗑️ Tokens cleared from localStorage");
    } catch (error) {
      console.error("Error clearing tokens from localStorage:", error);
    }
  }

  /**
   * #########################################################################################################################################################
   * # Token Refresh Management
   * #########################################################################################################################################################
   */

  /**
   * Refresh token using the Keycloak token endpoint
   */
  private async refreshToken(): Promise<void> {
    if (!keycloak.refreshToken) return;

    try {
      const response = await fetch(
        `${KEYCLOAK_CONFIG.url}realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: KEYCLOAK_CONFIG.clientId,
            grant_type: "refresh_token",
            refresh_token: keycloak.refreshToken,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        keycloak.token = data.access_token;
        keycloak.refreshToken = data.refresh_token;
        keycloak.idToken = data.id_token;
        keycloak.authenticated = true;

        // ✅ Decode JWT correctly
        const tokenParts = data.access_token.split(".");
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(
              atob(tokenParts[1].replace(/-/g, "+").replace(/_/g, "/"))
            );
            keycloak.tokenParsed = payload;
          } catch (e) {
            console.error("Error decoding JWT:", e);
          }
        }

        // Update stores
        token.set(keycloak.token || null);
        user.set(keycloak.tokenParsed);

        // Save updated tokens to localStorage
        this.saveTokensToStorage({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          id_token: data.id_token,
          tokenParsed: keycloak.tokenParsed,
        });

        console.log("✅ Token refreshed successfully");
      } else {
        console.warn("Token refresh failed, logging out");
        this.logout();
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      this.logout();
    }
  }

  private startTokenRefresh(): void {
    if (tokenRefreshInterval) return; // Already running

    console.log("🔄 Starting automatic token refresh every 3 minutes");
    tokenRefreshInterval = setInterval(() => {
      if (keycloak.authenticated) {
        this.refreshToken();
        console.log("🔄 Attempting to refresh token...");
      }
    }, 3 * 60 * 1000);
  }

  /**
   * Stop automatic token refresh
   */
  private stopTokenRefresh(): void {
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      tokenRefreshInterval = null;
      console.log("⏹️ Stopped automatic token refresh");
    }
  }

  /**
   * #########################################################################################################################################################
   * # Inactivity Timeout Management
   * #########################################################################################################################################################
   */

  /**
   * Start inactivity timer - will logout user after 30 minutes of inactivity
   */
  private startInactivityTimer(): void {
    if (inactivityTimeout) return; // Already running

    console.log("⏱️ Starting inactivity timer (30 minutes)");
    let timeRemaining = INACTIVITY_TIMEOUT;

    // Update the countdown every second
    inactivityCountdownInterval = setInterval(() => {
      timeRemaining -= 1000;
      inactivityTimeRemaining.set(timeRemaining);

      if (timeRemaining <= 0) {
        this.stopInactivityTimer();
        console.warn("⚠️ User inactive for 30 minutes, logging out...");
        alert("⏱️ Usuario inactivo, cerrando sesión...");
        this.logout();
      }
    }, 1000);

    inactivityTimeRemaining.set(timeRemaining);
  }

  /**
   * Reset inactivity timer - call this on user activity
   */
  private resetInactivityTimer(): void {
    // Clear existing timers
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = null;
    }
    if (inactivityCountdownInterval) {
      clearInterval(inactivityCountdownInterval);
      inactivityCountdownInterval = null;
    }

    // Only restart if user is authenticated
    if (this.isAuthenticated()) {
      this.startInactivityTimer();
      console.log("🔄 Inactivity timer reset");
    }
  }

  /**
   * Stop inactivity timer
   */
  private stopInactivityTimer(): void {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = null;
    }
    if (inactivityCountdownInterval) {
      clearInterval(inactivityCountdownInterval);
      inactivityCountdownInterval = null;
    }
    inactivityTimeRemaining.set(null);
    console.log("⏹️ Stopped inactivity timer");
  }

  /**
   * Register activity listeners for inactivity tracking
   * Should be called from App.svelte to set up global activity listeners
   */
  registerActivityListeners(): void {
    if (!isBrowser) return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      if (this.isAuthenticated()) {
        this.resetInactivityTimer();
      }
    };

    // Attach listeners to all activity events
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    console.log("📡 Activity listeners registered for inactivity tracking");
  }

  /**
   * #########################################################################################################################################################
   * # Authentication Service Initialization
   * #########################################################################################################################################################
   */

  /**
   * Initialize authentication state
   * Check if there's an existing authenticated session (from Keycloak instance or localStorage)
   */
  async initialize(): Promise<void> {
    if (!isBrowser) return;

    try {
      // First, try to load tokens from localStorage
      const storedTokens = this.loadTokensFromStorage();

      if (storedTokens) {
        console.log("📦 Found stored tokens, restoring session...");
        // Restore tokens to Keycloak instance
        keycloak.token = storedTokens.access_token;
        keycloak.refreshToken = storedTokens.refresh_token;
        keycloak.idToken = storedTokens.id_token;
        keycloak.tokenParsed = storedTokens.tokenParsed;
        keycloak.authenticated = true;

        // Update stores
        isAuthenticated.set(true);
        user.set(keycloak.tokenParsed);
        token.set(keycloak.token || null);

        // Start automatic token refresh
        this.startTokenRefresh();

        // Start inactivity timeout
        this.startInactivityTimer();

        console.log("✅ Session restored from storage");
      } else if (keycloak.authenticated && keycloak.token) {
        // Session exists in Keycloak instance
        isAuthenticated.set(true);
        user.set(keycloak.tokenParsed);
        token.set(keycloak.token || null);

        // Start automatic token refresh
        this.startTokenRefresh();

        // Start inactivity timeout
        this.startInactivityTimer();
      } else {
        // No session, user needs to login
        isAuthenticated.set(false);
      }
    } catch (error) {
      console.error("Failed to initialize auth", error);
      isAuthenticated.set(false);
    }
  }

  /**
   * #########################################################################################################################################################
   * # Onboarding Methods
   * #########################################################################################################################################################
   */

  /**
   * Login with username and password using Direct Grant flow
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(
        `${KEYCLOAK_CONFIG.url}realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: KEYCLOAK_CONFIG.clientId,
            grant_type: "password",
            username: credentials.username,
            password: credentials.password,
            scope: "openid profile email",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: errorData.error_description || "Login failed",
          details: errorData,
        };
      }

      const data = await response.json();

      keycloak.token = data.access_token;
      keycloak.refreshToken = data.refresh_token;
      keycloak.idToken = data.id_token;
      keycloak.authenticated = true;

      // Decode JWT correctly
      const tokenParts = data.access_token.split(".");
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(
            atob(tokenParts[1].replace(/-/g, "+").replace(/_/g, "/"))
          );
          keycloak.tokenParsed = payload;
        } catch (e) {
          console.error("Error decoding JWT:", e);
        }
      }

      isAuthenticated.set(true);
      user.set(keycloak.tokenParsed);
      token.set(keycloak.token || null);

      // Save tokens to localStorage for persistence
      this.saveTokensToStorage({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id_token: data.id_token,
        tokenParsed: keycloak.tokenParsed,
      });

      // Initiate automatic token refresh
      this.startTokenRefresh();

      // Initiate inactivity timeout
      this.startInactivityTimer();

      const loginResponse: LoginResponse = {
        access_token: data.access_token,
        token_type: data.token_type || "Bearer",
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        user: {
          id: keycloak.tokenParsed?.sub || "",
          username:
            keycloak.tokenParsed?.preferred_username || credentials.username,
          email: keycloak.tokenParsed?.email || "",
          name: keycloak.tokenParsed?.name || "",
          roles: keycloak.tokenParsed?.realm_access?.roles || [],
          password_expiration: null,
        },
        session_id: keycloak.tokenParsed?.session_state || "",
      };

      return loginResponse;
    } catch (error: any) {
      const authError = this.mapApiErrorToAuthError(error);
      throw authError;
    }
  }

  /**
   * Logout and clear all authentication data
   */
  async logout(): Promise<void> {
    if (!isBrowser) return;

    // Stop automatic token refresh
    this.stopTokenRefresh();

    // Stop inactivity timer
    this.stopInactivityTimer();

    // Attempt to revoke the refresh token on the server
    if (keycloak.refreshToken) {
      fetch(
        `${KEYCLOAK_CONFIG.url}realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: KEYCLOAK_CONFIG.clientId,
            refresh_token: keycloak.refreshToken,
          }),
        }
      ).catch((error) => {
        console.warn("Error revoking token on server:", error);
      });
    }

    // Clear Keycloak instance
    keycloak.token = undefined;
    keycloak.refreshToken = undefined;
    keycloak.idToken = undefined;
    keycloak.authenticated = false;
    keycloak.tokenParsed = undefined;

    // Clear tokens from localStorage
    this.clearTokensFromStorage();

    // Clear stores
    isAuthenticated.set(false);
    user.set(null);
    token.set(null);

    // Dispatch logout event for app navigation
    window.dispatchEvent(new CustomEvent("logout-success"));

    // Redirect to login page
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  }

  /**
   * #########################################################################################################################################################
   * # Auth Helper Methods
   * #########################################################################################################################################################
   */
  /**
   * Get the current authenticated user
   */
  getCurrentUser(): User | null {
    const currentUser = get(user) as any;

    if (!currentUser || !keycloak.authenticated) {
      return null;
    }

    return {
      id: currentUser.sub || "",
      username: currentUser.preferred_username || "",
      email: currentUser.email || "",
      name: currentUser.name || "",
      roles:
        currentUser.resource_access?.[KEYCLOAK_CONFIG.clientId]?.roles || [],
      password_expiration: null,
    };
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return get(isAuthenticated) && keycloak.authenticated === true;
  }

  /**
   * Get the current access token
   */
  getToken(): string | null {
    return keycloak.token || null;
  }

  /**
   * Get user's assigned role based on client roles
   */
  getUserAssignedRole(clientId: string = KEYCLOAK_CONFIG.clientId): string {
    const clientRoles =
      keycloak.tokenParsed?.resource_access?.[clientId]?.roles || [];

    if (clientRoles.includes("admin")) {
      return "Administrador";
    } else if (clientRoles.includes("validacion")) {
      return "Validacion";
    } else if (clientRoles.includes("trazabilidad")) {
      return "Cocina";
    } else if (clientRoles.includes("calidad")) {
      return "Charqueria";
    }

    return "Sin rol asignado";
  }

  /**
   * Get authorization headers for API requests
   */
  getAuthHeaders(): { Authorization: string } | {} {
    const authToken = keycloak.token;
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }

  /**
   * Check if user has a realm role
   */
  hasRole(role: string): boolean {
    return keycloak.hasRealmRole(role);
  }

  /**
   * Check if user has any of the provided realm roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  /**
   * Check if user has a client role
   */
  hasClientRole(
    role: string,
    clientId: string = KEYCLOAK_CONFIG.clientId
  ): boolean {
    const clientRoles =
      keycloak.tokenParsed?.resource_access?.[clientId]?.roles || [];
    return clientRoles.includes(role);
  }

  /**
   * Check if user has any of the provided client roles
   */
  hasAnyClientRole(
    roles: string[],
    clientId: string = KEYCLOAK_CONFIG.clientId
  ): boolean {
    return roles.some((role) => this.hasClientRole(role, clientId));
  }

  /**
   * Map API errors to AuthError format
   */
  private mapApiErrorToAuthError(error: any): AuthError {
    if (
      error?.code &&
      AUTH_ERROR_CODES[error.code as keyof typeof AUTH_ERROR_CODES]
    ) {
      return error as AuthError;
    }

    if (error?.error) {
      const keycloakError = error.error;

      if (
        keycloakError === "invalid_grant" ||
        keycloakError === "unauthorized_client"
      ) {
        return {
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message:
            error.error_description ||
            AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS],
          details: error,
        };
      }

      if (keycloakError === "invalid_client") {
        return {
          code: AUTH_ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Client authentication failed",
          details: error,
        };
      }
    }

    if (error?.message) {
      const message = error.message.toLowerCase();

      if (message.includes("401") || message.includes("unauthorized")) {
        return {
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS],
          details: error,
        };
      }

      if (message.includes("403") || message.includes("forbidden")) {
        return {
          code: AUTH_ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.UNAUTHORIZED_ACCESS],
          details: error,
        };
      }
    }

    return {
      code: "UNKNOWN_ERROR",
      message:
        error?.error_description ||
        error?.message ||
        "Error desconocido en la autenticación",
      details: error,
    };
  }
}

export const authService = AuthService.getInstance();

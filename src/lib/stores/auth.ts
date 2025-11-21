import { writable } from "svelte/store";

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

// Stores for holding app state
// user and token accept any type to avoid type conflicts with Keycloak types
export const isAuthenticated = writable<boolean>(false);
export const user = writable<any>(null);
export const token = writable<string | null>(null);

// Inactivity timer store - tracks remaining time until auto logout (in milliseconds)
export const inactivityTimeRemaining = writable<number | null>(null);

/**
 * Utility functions for refreshing user session data
 */

import { authClient } from "./auth-client";

/**
 * Refresh the current user session
 * This will fetch the latest user data from the server
 */
export async function refreshUserSession() {
  try {
    // Force a session refresh by calling the auth client
    const result = await authClient.getSession();
    return result;
  } catch (error) {
    console.error("Failed to refresh session:", error);
    throw error;
  }
}

/**
 * Invalidate session cache and refresh
 * This ensures we get the most up-to-date user data
 */
export async function invalidateAndRefreshSession() {
  try {
    // Clear any cached session data
    if (typeof window !== 'undefined') {
      // Clear any localStorage/sessionStorage if needed
      localStorage.removeItem('better-auth.session');
    }
    
    // Refresh the session
    return await refreshUserSession();
  } catch (error) {
    console.error("Failed to invalidate and refresh session:", error);
    throw error;
  }
}

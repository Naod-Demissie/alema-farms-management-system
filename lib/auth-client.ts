import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

console.log('[AuthClient] Base URL:', baseURL);

export const authClient = createAuthClient({
    baseURL,
    // Add fetch options for network access
    fetchOptions: {
        credentials: 'include',
    },
});

export const { useSession, signIn, signOut, signUp } = authClient;
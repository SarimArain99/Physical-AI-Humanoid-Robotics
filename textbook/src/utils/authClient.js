import { createAuthClient } from "better-auth/react";
import { getApiUrl } from "./apiConfig";

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
});

export const { useSession, signIn, signUp, signOut } = authClient;

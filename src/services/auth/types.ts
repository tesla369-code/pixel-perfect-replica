import type { User } from "@/types";

export interface AuthResult {
  user: User | null;
  error: string | null;
}

/**
 * Auth contract, fully decoupled from the UI.
 * Swap `localAuthService` for a Supabase Auth implementation later.
 */
export interface AuthService {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

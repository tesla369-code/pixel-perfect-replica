import type { AuthResult, AuthService } from "@/services/auth/types";
import type { User } from "@/types";

const STORAGE_KEY = "quorum.auth.v1";

/** Prototype-only credentials. Replaced wholesale by Supabase Auth later. */
const DEMO_USER: User = { id: "user-1", email: "admin@agency.com", name: "Dana Reyes" };
const DEMO_PASSWORD = "admin123";

type Listener = (user: User | null) => void;

class LocalAuthService implements AuthService {
  private listeners = new Set<Listener>();

  private read(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private write(user: User | null) {
    if (typeof window === "undefined") return;
    if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(STORAGE_KEY);
    this.listeners.forEach((l) => l(user));
  }

  async getCurrentUser(): Promise<User | null> {
    return this.read();
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    await new Promise((r) => setTimeout(r, 350));
    if (email.trim().toLowerCase() !== DEMO_USER.email || password !== DEMO_PASSWORD) {
      return { user: null, error: "Invalid email or password." };
    }
    this.write(DEMO_USER);
    return { user: DEMO_USER, error: null };
  }

  async signOut(): Promise<void> {
    this.write(null);
  }

  onAuthStateChange(callback: Listener) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback) as unknown as void;
  }
}

export const localAuthService: AuthService = new LocalAuthService();
export const DEMO_CREDENTIALS = { email: DEMO_USER.email, password: DEMO_PASSWORD };

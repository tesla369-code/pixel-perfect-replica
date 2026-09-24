import type { AuthService } from "@/services/auth/types";
import { localAuthService } from "@/services/auth/localAuthService";

/** Single injection point for authentication. */
export const authService: AuthService = localAuthService;

export { DEMO_CREDENTIALS } from "@/services/auth/localAuthService";
export type { AuthService, AuthResult } from "@/services/auth/types";

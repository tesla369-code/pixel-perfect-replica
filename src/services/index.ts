import type { DataService } from "@/services/types";
import { mockDataService } from "@/services/mock/mockDataService";

/**
 * Single injection point for the app's data layer.
 * Replace `mockDataService` with a Supabase-backed implementation of
 * `DataService` and the entire UI keeps working unchanged.
 */
export const dataService: DataService = mockDataService;

export type { DataService };

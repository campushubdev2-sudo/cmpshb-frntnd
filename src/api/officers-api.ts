import apiClient from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface Officer {
  _id: string;
  userId?: { _id: string; username: string; firstName?: string; lastName?: string };
  position?: string;
  startTerm?: string;
  endTerm?: string;
  orgId?: { _id: string; orgName: string } | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface GetOfficersParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  orgId?: string;
  [key: string]: any;
}

export interface OfficerStats {
  total: number;
  [key: string]: any;
}

// Backend wrapped response format
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────
export const officersAPI = {
  /**
   * Fetch all officers with optional filtering (including by orgId)
   */
  getAll: (params?: GetOfficersParams) =>
    apiClient.get<ApiResponse<Officer[]>>("/officers", { params }),

  /**
   * Fetch single officer by ID
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Officer>>(`/officers/${id}`),

  /**
   * Create new officer
   */
  create: (data: Partial<Officer>) =>
    apiClient.post<ApiResponse<Officer>>("/officers", data),

  /**
   * Update officer
   */
  update: (id: string, data: Partial<Officer>) =>
    apiClient.put<ApiResponse<Officer>>(`/officers/${id}`, data),

  /**
   * Delete officer
   */
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/officers/${id}`),

  /**
   * Get officer statistics
   */
  getStats: () =>
    apiClient.get<ApiResponse<OfficerStats>>("/officers/stats/overview"),
};

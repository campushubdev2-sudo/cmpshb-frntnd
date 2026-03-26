import apiClient from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface Org {
  _id: string;
  orgName: string;
  name?: string;
  description?: string;
  adviserId?: string;
  adviser?: { _id: string; username: string; firstName?: string; lastName?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrgStats {
  total: number;
  [key: string]: number;
}

export interface User {
  _id: string;
  username: string;
  role: string;
  email?: string;
  firstName?: string;
  lastName?: string;
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
export const orgsAPI = {
  /**
   * Fetch all organizations with wrapped response format
   */
  getAll: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<Org[]>>("/orgs", { params }),

  /**
   * Fetch single organization by ID with wrapped response format
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Org>>(`/orgs/${id}`),

  /**
   * Create new organization with wrapped response format
   */
  create: (data: { orgName: string; description?: string; adviserId?: string }) =>
    apiClient.post<ApiResponse<Org>>("/orgs", data),

  /**
   * Update organization with wrapped response format
   */
  update: (
    id: string,
    data: { orgName?: string; description?: string; adviserId?: string },
  ) => apiClient.put<ApiResponse<Org>>(`/orgs/${id}`, data),

  /**
   * Delete organization with wrapped response format
   */
  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/orgs/${id}`),

  /**
   * Get organization statistics
   */
  getStats: () => apiClient.get<ApiResponse<OrgStats>>("/orgs/stats"),

  /**
   * Fetch advisers from users endpoint with role filter
   */
  getAdvisers: () => apiClient.get<ApiResponse<User[]>>("/users", { params: { role: "adviser" } }),
};

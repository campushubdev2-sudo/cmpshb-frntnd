import apiClient from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface UserInfo {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuditLog {
  _id: string;
  userId: string | UserInfo;
  action: string;
  createdAt: string;
  updatedAt: string;
}

// Backend wrapped response format
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Query parameters for listing audit logs
export interface AuditLogQueryParams {
  userId?: string;
  action?: string;
  sort?: string;
  fields?: string;
  limit?: number;
  page?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────
export const auditLogsAPI = {
  /**
   * Get all audit logs with optional filtering
   * Admin only
   */
  getAll: (params?: AuditLogQueryParams) =>
    apiClient.get<ApiResponse<AuditLog[]>>("/audit-logs", { params }),

  /**
   * Get single audit log by ID
   * Admin only
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`),

  /**
   * Delete single audit log by ID
   * Admin only
   */
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/audit-logs/${id}`),

  /**
   * Cleanup all audit logs
   * Admin only - use with caution
   */
  cleanup: () =>
    apiClient.delete<ApiResponse<{ deletedCount: number }>>("/audit-logs/cleanup"),
};

import apiClient from "./client";

export interface AuditLog {
  _id: string;
  action: string;
  userId?: string;
  createdAt: string;
  [key: string]: any;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  [key: string]: any;
}

export const logsAPI = {
  getAll: (params?: GetLogsParams) => apiClient.get<AuditLog[]>("/audit-logs", { params }),

  getById: (id: string) => apiClient.get<AuditLog>(`/audit-logs/${id}`),

  delete: (id: string) => apiClient.delete<void>(`/audit-logs/${id}`),

  cleanup: () => apiClient.delete<void>("/audit-logs/cleanup"),
};

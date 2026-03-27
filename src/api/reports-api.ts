import apiClient from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ReportStatus = "pending" | "approved" | "rejected";

export interface Report {
  _id: string;
  orgId?: { _id: string; orgName: string } | string;
  reportType?: string;
  status: ReportStatus;
  submittedBy?: { _id: string; username: string };
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  filePaths?: Array<{ name?: string; filename?: string }>;
  title?: string;
  message?: string;
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
export const reportsAPI = {
  /**
   * Fetch all reports with optional filtering (including by orgId)
   */
  getAll: (params?: { orgId?: string; [key: string]: any }) =>
    apiClient.get<ApiResponse<Report[]>>("/reports", { params }),

  /**
   * Fetch single report by ID
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Report>>(`/reports/${id}`),

  /**
   * Create new report (with file upload support)
   */
  create: (data: FormData) =>
    apiClient.post<ApiResponse<Report>>("/reports", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * Update report
   */
  update: (id: string, data: Partial<Report>) =>
    apiClient.put<ApiResponse<Report>>(`/reports/${id}`, data),

  /**
   * Delete report
   */
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/reports/${id}`),

  /**
   * Update report status (approve/reject)
   */
  updateStatus: (id: string, data: { status: string; message?: string }) =>
    apiClient.put<ApiResponse<Report>>(`/reports/${id}`, data),

  /**
   * Download report files (returns blob)
   */
  download: (id: string) =>
    apiClient.get(`/reports/${id}/download`, {
      responseType: "blob",
    }),
};

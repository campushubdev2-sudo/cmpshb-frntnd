import apiClient from "./client";

export type ReportStatus = "pending" | "approved" | "rejected";

export interface Report {
  _id: string;
  orgId?: { _id: string; orgName: string };
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

export const reportsAPI = {
  getAll: (params?: Record<string, any>) => apiClient.get<Report[]>("/reports", { params }),

  getById: (id: string) => apiClient.get<Report>(`/reports/${id}`),

  create: (data: FormData) =>
    apiClient.post<Report>("/reports", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: string, data: Partial<Report>) => apiClient.put<Report>(`/reports/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/reports/${id}`),

  updateStatus: (id: string, data: { status: string; message?: string }) =>
    apiClient.put<Report>(`/reports/${id}`, data),
};

import apiClient from "./client";

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

export const orgsAPI = {
  getAll: (params?: Record<string, any>) => apiClient.get<Org[]>("/orgs", { params }),

  getById: (id: string) => apiClient.get<Org>(`/orgs/${id}`),

  create: (data: { orgName: string; description?: string; adviserId?: string }) => apiClient.post<Org>("/orgs", data),

  update: (id: string, data: { orgName?: string; description?: string; adviserId?: string }) => apiClient.put<Org>(`/orgs/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/orgs/${id}`),

  getStats: () => apiClient.get<OrgStats>("/orgs/stats"),
};

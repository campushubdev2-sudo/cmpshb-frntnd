import apiClient from "./client";

export interface Officer {
  _id: string;
  name: string;
  position?: string;
  [key: string]: any;
}

export interface GetOfficersParams {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  [key: string]: any;
}

export interface OfficerStats {
  total: number;
  [key: string]: any;
}

export const officersAPI = {
  getAll: (params?: GetOfficersParams) => apiClient.get<Officer[]>("/officers", { params }),

  getById: (id: string) => apiClient.get<Officer>(`/officers/${id}`),

  create: (data: Partial<Officer>) => apiClient.post<Officer>("/officers", data),

  update: (id: string, data: Partial<Officer>) => apiClient.put<Officer>(`/officers/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/officers/${id}`),

  getStats: () => apiClient.get<OfficerStats>("/officers/stats/overview"),
};

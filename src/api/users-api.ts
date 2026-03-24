import apiClient from "./client";

export interface User {
  _id: string;
  username: string;
  role: string;
  [key: string]: any;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  [key: string]: any;
}

export const usersAPI = {
  getAll: (params?: GetUsersParams) => apiClient.get<User[]>("/users", { params }),

  getById: (id: string) => apiClient.get<User>(`/users/${id}`),

  create: (data: Partial<User>) => apiClient.post<User>("/users", data),

  update: (id: string, data: Partial<User>) => apiClient.put<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/users/${id}`),

  getStats: () => apiClient.get("/users/stats/overview"),
};

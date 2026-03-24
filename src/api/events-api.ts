import apiClient from "./client";

export interface Event {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  organizedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface GetEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

export interface EventStats {
  total: number;
  [key: string]: any;
}

export const eventsAPI = {
  getAll: (params?: GetEventsParams) => apiClient.get<Event[]>("/school-events", { params }),

  getById: (id: string) => apiClient.get<Event>(`/school-events/${id}`),

  create: (data: Partial<Event>) => apiClient.post<Event>("/school-events", data),

  update: (id: string, data: Partial<Event>) => apiClient.put<Event>(`/school-events/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/school-events/${id}`),

  getStats: () => apiClient.get<EventStats>("/school-events/stats"),
};

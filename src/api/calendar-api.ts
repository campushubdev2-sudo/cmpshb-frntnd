import apiClient from "./client";

export interface CalendarEntry {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export const calendarAPI = {
  getEntries: (params?: Record<string, any>) =>
    apiClient.get<CalendarEntry[]>("/calendar-entries", { params }),

  create: (data: Partial<CalendarEntry>) =>
    apiClient.post<CalendarEntry>("/calendar-entries", data),

  update: (id: string, data: Partial<CalendarEntry>) =>
    apiClient.put<CalendarEntry>(`/calendar-entries/${id}`, data),

  delete: (id: string) => apiClient.delete<void>(`/calendar-entries/${id}`),
};

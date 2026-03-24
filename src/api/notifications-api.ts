import apiClient from "./client";

// --- Types ---

export interface EventNotification {
  id: string;
  title: string;
  message: string;
  recipientId?: string;
  type: "info" | "warning" | "error" | "success";
  status: "sent" | "pending" | "failed";
  createdAt: string;
}

export interface NotificationQueryParams {
  limit?: number;
  page?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  recipientId?: string;
}

export interface CreateNotificationDto {
  eventId: string;
  recipientIds: string[];
  message: string;
}

// --- API Service ---

export const notificationsAPI = {
  getAll: (params?: NotificationQueryParams) =>
    apiClient.get<EventNotification[]>("/event-notifications", { params }),

  getById: (id: string) => apiClient.get<EventNotification>(`/event-notifications/${id}`),

  create: (data: CreateNotificationDto) =>
    apiClient.post<EventNotification>("/event-notifications", data),

  createBulk: (data: CreateNotificationDto[]) =>
    apiClient.post<EventNotification[]>("/event-notifications/bulk", data),

  delete: (id: string) => apiClient.delete<void>(`/event-notifications/${id}`),
};

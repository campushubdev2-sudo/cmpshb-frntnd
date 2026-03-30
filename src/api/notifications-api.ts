import apiClient from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type NotificationStatus = "sent" | "failed" | "read";

export interface EventNotification {
  _id: string;
  eventId: string | { _id: string; title: string };
  recipientId: string | { _id: string; username: string; phoneNumber?: string };
  message: string;
  status: NotificationStatus;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalNotifications: number;
  sentCount: number;
  failedCount: number;
  readCount: number;
}

export interface EventNotificationStats {
  eventId: string;
  totalNotifications: number;
  sentCount: number;
  failedCount: number;
  readCount: number;
}

// Backend wrapped response format
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// Query parameters for listing notifications
export interface NotificationQueryParams {
  eventId?: string;
  recipientId?: string;
  status?: NotificationStatus;
  sortBy?: string;
  order?: "asc" | "desc";
  fields?: string;
  limit?: number;
  page?: number;
}

// Create notification payload
export interface CreateNotificationPayload {
  eventId: string;
  recipientId: string;
  message: string;
  senderId?: string;
  status?: NotificationStatus;
}

// Create bulk notifications payload
export interface CreateBulkNotificationsPayload {
  eventId: string;
  recipientIds: string[];
  message: string;
  senderId?: string;
  status?: NotificationStatus;
}

// Update notification payload
export interface UpdateNotificationPayload {
  message?: string;
  status?: NotificationStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────
export const eventNotificationsAPI = {
  /**
   * Get all event notifications with optional filtering
   */
  getAll: (params?: NotificationQueryParams) =>
    apiClient.get<PaginatedResponse<EventNotification[]>>("/event-notifications", { params }),

  /**
   * Get single notification by ID
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<EventNotification>>(`/event-notifications/${id}`),

  /**
   * Create single notification
   */
  create: (data: CreateNotificationPayload) =>
    apiClient.post<ApiResponse<EventNotification>>("/event-notifications", data),

  /**
   * Create bulk notifications
   */
  createBulk: (data: CreateBulkNotificationsPayload) =>
    apiClient.post<ApiResponse<{ notifications: EventNotification[]; skippedDuplicates: number }>>(
      "/event-notifications/bulk",
      data,
    ),

  /**
   * Update notification
   */
  update: (id: string, data: UpdateNotificationPayload) =>
    apiClient.put<ApiResponse<EventNotification>>(`/event-notifications/${id}`, data),

  /**
   * Delete notification
   */
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/event-notifications/${id}`),

  /**
   * Get overall statistics (admin only)
   */
  getOverallStats: () =>
    apiClient.get<ApiResponse<NotificationStats>>("/event-notifications/stats/overall"),

  /**
   * Get event-specific statistics (admin only)
   */
  getEventStats: (eventId: string) =>
    apiClient.get<ApiResponse<EventNotificationStats>>(
      `/event-notifications/stats/event/${eventId}`,
    ),
};

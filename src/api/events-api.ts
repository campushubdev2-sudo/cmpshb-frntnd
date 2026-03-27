import apiClient from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Types - Matching backend API schema from docs.md
// ─────────────────────────────────────────────────────────────────────────────
export interface SchoolEvent {
  _id: string;
  title: string;           // Max 100 chars, required
  objective?: string;      // Max 2000 chars, optional
  allDay: boolean;         // Default: false
  startDate: string;       // ISO format (YYYY-MM-DD), required
  endDate: string;         // ISO format (YYYY-MM-DD), required (>= startDate)
  startTime?: string;      // HH:MM format, required if !allDay
  endTime?: string;        // HH:MM format, required if !allDay
  venue: string;           // Max 150 chars, required
  organizedBy: "admin" | "department";
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
}

// Input type for creating/updating events (all fields optional for updates)
export interface SchoolEventInput {
  title?: string;
  objective?: string;
  allDay?: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  organizedBy?: "admin" | "department";
  status?: string;
}

export interface GetEventsParams {
  paginate?: boolean;
  page?: number;
  limit?: number;
  title?: string;
  venue?: string;
  organizedBy?: string;
  startDate?: string;
  type?: "all" | "upcoming" | "past";
  sortBy?: "startDate" | "createdAt" | "title";
  order?: "asc" | "desc";
  [key: string]: any;
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  organizerBreakdown: {
    admin: number;
    department: number;
  };
  dateRange: {
    firstEvent: string;
    lastEvent: string;
  };
  [key: string]: any;
}

// Backend wrapped response format (per docs.md)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions - Endpoints from docs.md
// ─────────────────────────────────────────────────────────────────────────────
export const eventsAPI = {
  /**
   * GET / - Fetch all events with optional filtering and pagination
   * Auth: Optional (enhanced data for authenticated users)
   */
  getAll: (params?: GetEventsParams) =>
    apiClient.get<ApiResponse<SchoolEvent[] | { docs: SchoolEvent[]; total: number; page: number; limit: number; pages: number }>>(
      "/school-events",
      { params }
    ),

  /**
   * GET /:id - Fetch single event by ID
   * Auth: admin, adviser, officer
   */
  getById: (id: string) =>
    apiClient.get<ApiResponse<SchoolEvent>>(`/school-events/${id}`),

  /**
   * POST / - Create new event
   * Auth: admin, adviser
   * Validation: startDate cannot be in past, endDate >= startDate
   */
  create: (data: SchoolEventInput) =>
    apiClient.post<ApiResponse<SchoolEvent>>("/school-events", data),

  /**
   * PUT /:id - Update event (partial update)
   * Auth: admin, adviser
   * Validation: At least one field required, endDate >= startDate
   */
  update: (id: string, data: SchoolEventInput) =>
    apiClient.put<ApiResponse<SchoolEvent>>(`/school-events/${id}`, data),

  /**
   * DELETE /:id - Delete event by ID
   * Auth: admin, adviser
   */
  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/school-events/${id}`),

  /**
   * GET /stats - Get event statistics
   * Auth: admin, officer, adviser
   */
  getStats: () =>
    apiClient.get<ApiResponse<EventStats>>("/school-events/stats"),

  /**
   * GET /stats/monthly - Get monthly event counts
   * Auth: admin, adviser
   */
  getMonthlyStats: (year?: number) =>
    apiClient.get<ApiResponse<{ month: string; count: number; events: SchoolEvent[] }[]>>(
      "/school-events/stats/monthly",
      { params: year ? { year } : {} }
    ),

  /**
   * GET /stats/venues - Get venue statistics
   * Auth: admin, adviser
   */
  getVenueStats: () =>
    apiClient.get<ApiResponse<{ _id: string; eventCount: number; upcomingCount: number }[]>>(
      "/school-events/stats/venues"
    ),

  /**
   * GET /filter/date-range - Filter events by date range
   * Auth: admin, adviser
   */
  filterByDateRange: (startDate: string, endDate: string) =>
    apiClient.get<ApiResponse<SchoolEvent[]>>(
      "/school-events/filter/date-range",
      { params: { startDate, endDate } }
    ),

  /**
   * GET /recently-created - Get recently created events
   * Auth: admin
   */
  getRecentlyCreated: (limit?: number) =>
    apiClient.get<ApiResponse<SchoolEvent[]>>(
      "/school-events/recently-created",
      { params: limit ? { limit } : {} }
    ),
};

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarDays, CalendarCheck2, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarSection } from "@/components/ui/event-calendar";
import { useAuthentication } from "@/contexts/AuthContext";
import { ROLES } from "@/config/constants/roles";
import type { CalendarEvent } from "@ilamy/calendar";
import {
  eventService,
  normalizeToCalendarEvent,
  normalizeToSchoolEventInput,
} from "@/services/school-event-service";
import { Skeleton } from "@/components/ui/skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// Types - Normalized for ilamy Calendar
// ─────────────────────────────────────────────────────────────────────────────
interface CalendarSchoolEvent extends CalendarEvent {
  _id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  objective?: string;
  venue?: string;
  organizedBy?: string;
  allDay: boolean;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Configuration
// ─────────────────────────────────────────────────────────────────────────────
const STATS_CONFIG = [
  {
    label: "This Month",
    icon: Calendar,
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Upcoming",
    icon: Clock,
    color: "text-amber-600 bg-amber-50",
  },
  {
    label: "Completed",
    icon: CalendarCheck2,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Total Events",
    icon: CalendarDays,
    color: "text-violet-600 bg-violet-50",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Calculate event status based on dates
// ─────────────────────────────────────────────────────────────────────────────
const calculateEventStatus = (
  start: string | Date,
  end: string | Date,
): "upcoming" | "ongoing" | "completed" => {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (now < startDate) return "upcoming";
  if (now > endDate) return "completed";
  return "ongoing";
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Normalize backend event to calendar format
// ─────────────────────────────────────────────────────────────────────────────
const normalizeEvent = (event: BackendSchoolEvent): CalendarSchoolEvent => {
  const normalized = normalizeToCalendarEvent(event);
  return {
    ...normalized,
    start: event.startDate,
    end: event.endDate,
  } as CalendarSchoolEvent;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { authenticatedUser } = useAuthentication();
  const canManage = authenticatedUser?.role === ROLES.ADMIN;

  const [events, setEvents] = useState<CalendarSchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Events from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await eventService.getEvents({ limit: 100 });
      const apiResponse = response;

      if (apiResponse.success) {
        let eventsData: BackendSchoolEvent[] = [];

        // Handle different response structures
        if (Array.isArray(apiResponse.data)) {
          eventsData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          eventsData = apiResponse.data.items;
        } else if (apiResponse.data?.items) {
          eventsData = apiResponse.data.items;
        }

        // Normalize events for calendar
        const normalizedEvents = eventsData.map(normalizeEvent);
        setEvents(normalizedEvents);
      } else {
        toast.error(apiResponse.message || "Failed to fetch events");
        setEvents([]);
      }
    } catch (error: unknown) {
      console.error("Error fetching calendar events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Calculate stats from events data
  // ───────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const thisMonth = events.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate >= monthStart && eventDate <= monthEnd;
    }).length;

    const upcoming = events.filter((e) => {
      const startDate = new Date(e.start);
      return startDate >= now;
    }).length;

    const completed = events.filter((e) => {
      const endDate = new Date(e.end);
      return endDate < now;
    }).length;

    return {
      thisMonth,
      upcoming,
      completed,
      total: events.length,
    };
  }, [events, currentMonth]);

  // ───────────────────────────────────────────────────────────────────────────
  // Calendar navigation handler - wrapped to avoid setState during render
  // ───────────────────────────────────────────────────────────────────────────
  const handleDateChange = (date: Date) => {
    // Defer state update to avoid calling setState during another component's render
    requestAnimationFrame(() => {
      setCurrentMonth(date);
    });
  };

  // ───────────────────────────────────────────────────────────────────────────
  // ilamy calendar event handlers
  // ───────────────────────────────────────────────────────────────────────────
  const handleEventSave = async (eventData: any) => {
    console.log("📅 ilamy onEventSave called with:", eventData);

    if (!canManage) {
      toast.error("Only admins can manage calendar events");
      return;
    }

    try {
      setSubmitting(true);

      // Calculate event status based on dates
      const startDate =
        eventData.start instanceof Date
          ? eventData.start.toISOString().split("T")[0]
          : eventData.start;
      const endDate =
        eventData.end instanceof Date ? eventData.end.toISOString().split("T")[0] : eventData.end;
      const status = calculateEventStatus(startDate, endDate);

      // Normalize data for backend API using the service utility
      const payload = normalizeToSchoolEventInput(
        { ...eventData, status },
        undefined, // existingEvent not needed for this normalization
      );

      if (eventData._id || eventData.id) {
        // Update existing event - PUT (partial update)
        const eventId = eventData._id || eventData.id;
        console.log("✏️ PUT /school-events/:id with payload:", payload);

        const response = await eventService.updateEvent(eventId, payload);

        if (response.success) {
          toast.success(response.message || "Event updated successfully");
          fetchData();
        } else {
          toast.error(response.message || "Failed to update event");
        }
      } else {
        // Create new event - POST
        console.log("➕ POST /school-events with payload:", payload);

        const response = await eventService.createEvent(payload);

        if (response.success) {
          toast.success(response.message || "Event created successfully");
          fetchData();
        } else {
          toast.error(response.message || "Failed to create event");
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to save event";
      toast.error(message);
      console.error("Calendar event save error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    console.log("🗑️ ilamy onEventDelete called with eventId:", eventId);

    if (!canManage) {
      toast.error("Only admins can delete calendar events");
      return;
    }

    try {
      console.log("🗑️ Deleting event:", eventId);
      const response = await eventService.deleteEvent(eventId);

      if (response.success) {
        toast.success(response.message || "Event deleted successfully");
        fetchData();
      } else {
        toast.error(response.message || "Failed to delete event");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to delete event";
      toast.error(message);
      console.error("Calendar event delete error:", error);
      console.error("Error response:", error.response?.data);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-0">
              <CardContent className="flex items-center gap-3 p-3.5">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
            <div className="p-4">
              <Skeleton className="h-80 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <title>CampusHub | Calendar</title>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">View and track campus events by date</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS_CONFIG.map((stat, index) => {
            const values = [stats.thisMonth, stats.upcoming, stats.completed, stats.total];
            return (
              <Card key={stat.label} className="p-0">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      stat.color,
                    )}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl leading-none font-bold">{values[index]}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Calendar Section - Using ilamy Calendar */}
        <CalendarSection
          isAdmin={false}
          events={events}
          onEventSave={handleEventSave}
          onEventDelete={handleEventDelete}
          onDateChange={handleDateChange}
        />
      </div>
    </>
  );
}

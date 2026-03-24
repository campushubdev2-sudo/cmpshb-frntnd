import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Download, CalendarDays, CalendarCheck2, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarSection } from "@/components/ui/event-calendar";
import { useAuthentication } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { CampusEventDTO } from "@/services/school-event-service";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SchoolEvent extends CampusEventDTO {
  _id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  objective?: string;
  venue?: string;
  organizedBy?: string;
  allDay: boolean;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data - Pre-populated Events
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_EVENTS: SchoolEvent[] = [
  {
    _id: "67d8f2a1c9e8b3a4d5e6e001",
    title: "Welcome Orientation 2025",
    objective: "Introduce new students to campus life",
    start: "2025-03-01T09:00:00.000Z",
    end: "2025-03-01T17:00:00.000Z",
    allDay: false,
    venue: "Main Auditorium",
    organizedBy: "admin",
    status: "completed",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e002",
    title: "CS Department Career Fair",
    objective: "Connect students with tech companies",
    start: "2025-03-15T09:00:00.000Z",
    end: "2025-03-15T17:00:00.000Z",
    allDay: false,
    venue: "Engineering Building Lobby",
    organizedBy: "department",
    status: "ongoing",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e003",
    title: "Student Leadership Summit",
    objective: "Develop leadership skills",
    start: "2025-03-28T08:00:00.000Z",
    end: "2025-03-28T16:00:00.000Z",
    allDay: false,
    venue: "Conference Center Hall A",
    organizedBy: "admin",
    status: "upcoming",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e004",
    title: "Intramural Sports Festival",
    objective: "Promote physical fitness",
    start: "2025-04-05T00:00:00.000Z",
    end: "2025-04-06T23:59:59.000Z",
    allDay: true,
    venue: "University Sports Complex",
    organizedBy: "admin",
    status: "upcoming",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e005",
    title: "Research Symposium",
    objective: "Showcase research projects",
    start: "2025-04-20T10:00:00.000Z",
    end: "2025-04-20T18:00:00.000Z",
    allDay: false,
    venue: "Science Building Atrium",
    organizedBy: "department",
    status: "upcoming",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Store
// ─────────────────────────────────────────────────────────────────────────────
let eventsStore: SchoolEvent[] = [...INITIAL_EVENTS];

// ─────────────────────────────────────────────────────────────────────────────
// Mock API Functions
// ─────────────────────────────────────────────────────────────────────────────
const mockAPI = {
  getEvents(): Promise<{ data: SchoolEvent[] }> {
    return Promise.resolve({ data: [...eventsStore] });
  },

  createEvent(
    data: Omit<SchoolEvent, "_id" | "createdAt" | "updatedAt">,
  ): Promise<{ data: SchoolEvent }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString();
        const newEvent: SchoolEvent = {
          _id: `67d8f2a1c9e8b3a4d5e6e${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(3, "0")}`,
          ...data,
          start: data.start,
          end: data.end,
        } as SchoolEvent;
        eventsStore.push(newEvent);
        resolve({ data: newEvent });
      }, 300);
    });
  },

  updateEvent(id: string, data: Partial<SchoolEvent>): Promise<{ data: SchoolEvent }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = eventsStore.findIndex((e) => e._id === id);
        if (index === -1) {
          resolve({ data: {} as SchoolEvent });
          return;
        }
        const updated = { ...eventsStore[index], ...data };
        eventsStore[index] = updated;
        resolve({ data: updated });
      }, 300);
    });
  },

  deleteEvent(id: string): Promise<{ data: null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = eventsStore.findIndex((e) => e._id === id);
        if (index !== -1) {
          eventsStore.splice(index, 1);
        }
        resolve({ data: null });
      }, 200);
    });
  },
};

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
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { authenticatedUser } = useAuthentication();
  const canManage = authenticatedUser?.role === "admin" || authenticatedUser?.role === "adviser";

  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mockAPI.getEvents();
      setEvents(response.data || []);
    } catch (error: unknown) {
      console.error(error);
      setError(error);
      toast.error("Failed to fetch calendar data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats from events data
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonth = events.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate >= monthStart && eventDate <= monthEnd;
    }).length;

    const upcoming = events.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate >= now;
    }).length;

    const completed = events.filter((e) => {
      const eventDate = new Date(e.end);
      return eventDate < now;
    }).length;

    return {
      thisMonth,
      upcoming,
      completed,
      total: events.length,
    };
  }, [events]);

  // ilamy calendar event handlers
  const handleEventSave = async (eventData: any) => {
    try {
      setSubmitting(true);
      if (eventData._id) {
        // Update existing event
        const status = calculateEventStatus(eventData.start, eventData.end);
        await mockAPI.updateEvent(eventData._id, {
          title: eventData.title,
          start: eventData.start,
          end: eventData.end,
          allDay: eventData.allDay,
          venue: eventData.venue,
          objective: eventData.objective,
          status,
        });
        toast.success("Event updated successfully");
      } else {
        // Create new event
        const status = calculateEventStatus(eventData.start, eventData.end);
        await mockAPI.createEvent({
          title: eventData.title,
          start: eventData.start,
          end: eventData.end,
          allDay: eventData.allDay,
          venue: eventData.venue || "",
          objective: eventData.objective || "",
          organizedBy: "admin",
          status,
        });
        toast.success("Event created successfully");
      }
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await mockAPI.deleteEvent(eventId);
      toast.success("Event deleted successfully");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground text-sm">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load calendar data</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            Retry
          </Button>
          <Button variant="outline" onClick={() => console.error(error)}>
            <Download className="mr-2 h-4 w-4" />
            Download Error Log
          </Button>
        </div>
      </div>
    );
  }

  return (
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
        isAdmin={canManage}
        events={events}
        onEventSave={handleEventSave}
        onEventDelete={handleEventDelete}
      />
    </div>
  );
}

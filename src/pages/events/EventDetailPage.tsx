import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Calendar, User, Clock, Target } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching backend response shapes and EventsPage.tsx)
// ─────────────────────────────────────────────────────────────────────────────
interface SchoolEvent {
  _id: string;
  title: string;
  objective?: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  organizedBy: "admin" | "department";
  createdAt: string;
  updatedAt: string;
  description?: string;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
}

interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface FailResponse {
  success: false;
  status: "fail";
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared In-Memory Store (same as EventsPage.tsx)
// ─────────────────────────────────────────────────────────────────────────────
const SHARED_EVENTS: SchoolEvent[] = [
  {
    _id: "67d8f2a1c9e8b3a4d5e6e001",
    title: "Welcome Orientation 2025",
    objective: "Introduce new students to campus life and resources",
    allDay: true,
    startDate: "2025-03-01T00:00:00.000Z",
    endDate: "2025-03-01T23:59:59.000Z",
    venue: "Main Auditorium",
    organizedBy: "admin",
    createdAt: "2025-01-10T08:00:00.000Z",
    updatedAt: "2025-01-10T08:00:00.000Z",
    description: "Annual orientation program for freshmen",
    status: "completed",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e002",
    title: "CS Department Career Fair",
    objective: "Connect students with tech companies for internships and jobs",
    allDay: false,
    startDate: "2025-03-15T00:00:00.000Z",
    endDate: "2025-03-15T23:59:59.000Z",
    startTime: "09:00",
    endTime: "17:00",
    venue: "Engineering Building Lobby",
    organizedBy: "department",
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-02-01T14:30:00.000Z",
    description: "Spring 2025 Career Fair featuring 50+ tech companies",
    status: "ongoing",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e003",
    title: "Student Leadership Summit",
    objective: "Develop leadership skills among student officers",
    allDay: false,
    startDate: "2025-03-28T00:00:00.000Z",
    endDate: "2025-03-28T23:59:59.000Z",
    startTime: "08:00",
    endTime: "16:00",
    venue: "Conference Center Hall A",
    organizedBy: "admin",
    createdAt: "2025-02-01T09:00:00.000Z",
    updatedAt: "2025-02-10T11:00:00.000Z",
    description: "Full-day leadership training workshop",
    status: "upcoming",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e004",
    title: "Intramural Sports Festival",
    objective: "Promote physical fitness and team spirit",
    allDay: true,
    startDate: "2025-04-05T00:00:00.000Z",
    endDate: "2025-04-06T23:59:59.000Z",
    venue: "University Sports Complex",
    organizedBy: "admin",
    createdAt: "2025-02-05T13:00:00.000Z",
    updatedAt: "2025-02-05T13:00:00.000Z",
    description: "Annual sports competition with multiple events",
    status: "upcoming",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e005",
    title: "Research Symposium",
    objective: "Showcase undergraduate and graduate research projects",
    allDay: false,
    startDate: "2025-04-20T00:00:00.000Z",
    endDate: "2025-04-20T23:59:59.000Z",
    startTime: "10:00",
    endTime: "18:00",
    venue: "Science Building Atrium",
    organizedBy: "department",
    createdAt: "2025-02-10T08:30:00.000Z",
    updatedAt: "2025-02-15T16:00:00.000Z",
    description: "Present research findings to faculty and peers",
    status: "upcoming",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6e006",
    title: "Cultural Night 2025",
    objective: "Celebrate diversity through performances and food",
    allDay: false,
    startDate: "2025-02-14T00:00:00.000Z",
    endDate: "2025-02-14T23:59:59.000Z",
    startTime: "18:00",
    endTime: "22:00",
    venue: "Student Center Ballroom",
    organizedBy: "admin",
    createdAt: "2025-01-05T10:00:00.000Z",
    updatedAt: "2025-01-20T09:00:00.000Z",
    description: "Annual cultural celebration event - cancelled due to venue issues",
    status: "cancelled",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock API Functions
// ─────────────────────────────────────────────────────────────────────────────
const mockAPI = {
  getById(id: string): Promise<SuccessResponse<SchoolEvent> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const event = SHARED_EVENTS.find((e) => e._id === id);
        if (event) {
          resolve({
            success: true,
            message: "Event fetched successfully",
            data: { ...event },
          });
        } else {
          resolve({
            success: false,
            status: "fail",
            message: "Event not found",
          });
        }
      }, 200);
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge Configuration
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  upcoming: {
    label: "Upcoming",
    className:
      "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-400/20",
  },
  ongoing: {
    label: "Ongoing",
    className:
      "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-400/20",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-400/20",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-400 dark:ring-red-400/20",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SchoolEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        if (!id) {
          toast.error("Invalid event ID");
          return;
        }
        const response = await mockAPI.getById(id);
        if (response.success && "data" in response) {
          setEvent(response.data);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/events")}>
          Back to Events
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[event.status || "upcoming"] || STATUS_CONFIG.upcoming;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/events")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground mt-1">Event details and information</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Event Information</h2>
            <p className="text-muted-foreground text-sm">Overview of the event</p>
          </div>
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
        </div>

        {event.description && (
          <div className="mb-6 rounded-lg bg-muted p-4">
            <p className="text-muted-foreground text-sm">{event.description}</p>
          </div>
        )}

        {event.objective && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border p-4">
            <Target className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs font-medium">Objective</p>
              <p className="text-card-foreground mt-1 text-sm">{event.objective}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Calendar className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs font-medium">Date</p>
              <p className="text-card-foreground mt-1 text-sm font-medium">
                {event.startDate ? format(new Date(event.startDate), "MMMM dd, yyyy") : "—"}
              </p>
              {event.endDate && event.endDate !== event.startDate && (
                <p className="text-muted-foreground text-xs">
                  to {format(new Date(event.endDate), "MMMM dd, yyyy")}
                </p>
              )}
            </div>
          </div>

          {!event.allDay && (event.startTime || event.endTime) && (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Clock className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs font-medium">Time</p>
                <p className="text-card-foreground mt-1 text-sm font-medium">
                  {event.startTime || "N/A"} - {event.endTime || "N/A"}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <MapPin className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs font-medium">Venue</p>
              <p className="text-card-foreground mt-1 text-sm font-medium">{event.venue}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <User className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs font-medium">Organized By</p>
              <p className="text-card-foreground mt-1 text-sm font-medium capitalize">
                {event.organizedBy}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-6">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              Created: {event.createdAt ? format(new Date(event.createdAt), "MMMM dd, yyyy") : "—"}
            </span>
            <span>
              Updated: {event.updatedAt ? format(new Date(event.updatedAt), "MMMM dd, yyyy") : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

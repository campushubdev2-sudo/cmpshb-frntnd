import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Calendar, User, Clock, Target } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { eventsAPI, type SchoolEvent } from "@/api/events-api";

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

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Event from Backend
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        if (!id) {
          toast.error("Invalid event ID");
          return;
        }

        const response = await eventsAPI.getById(id);
        const apiResponse = response.data;

        if (apiResponse.success) {
          setEvent(apiResponse.data);
        } else {
          toast.error(apiResponse.message || "Failed to fetch event");
        }
      } catch (error: any) {
        console.error("Error fetching event:", error);
        toast.error("Failed to fetch event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Not Found State
  // ───────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
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

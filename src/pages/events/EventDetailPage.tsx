import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Calendar, User, Clock, Target, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { eventsAPI, type SchoolEvent } from "@/api/events-api";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Check if error is network-related
// ─────────────────────────────────────────────────────────────────────────────
const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  if (error.code === "ERR_NETWORK") return true;
  if (error.code === "ECONNREFUSED") return true;
  if (error.code === "ENOTFOUND") return true;
  if (error.message?.includes("NetworkError")) return true;
  if (error.message?.includes("Failed to fetch")) return true;
  if (error.message?.includes("Network request failed")) return true;
  if (!navigator.onLine) return true;
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Badge Configuration
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 ring-gray-600/20 dark:bg-gray-950 dark:text-gray-400 dark:ring-gray-400/20",
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-400/20",
  },
  approved: {
    label: "Approved",
    className:
      "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-400/20",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-400 dark:ring-red-400/20",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-400 dark:ring-red-400/20",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-400/20",
  },
  ongoing: {
    label: "Ongoing",
    className:
      "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-400/20",
  },
  upcoming: {
    label: "Upcoming",
    className:
      "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-400/20",
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
  const [networkError, setNetworkError] = useState<string | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Event from Backend
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setNetworkError(null);
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
        if (isNetworkError(error)) {
          setNetworkError("Unable to connect to the server. Please check your internet connection.");
          toast.error("No internet connection. Please check your network and try again.");
        } else {
          toast.error("Failed to fetch event details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // ───────────────────────────────────────────────────────────────────────────
  // Network Error State
  // ───────────────────────────────────────────────────────────────────────────
  if (networkError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <WifiOff className="text-muted-foreground h-16 w-16" />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Connection Issue</p>
          <p className="text-muted-foreground text-sm mt-1">{networkError}</p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setNetworkError(null);
                setLoading(true);
                const fetchEvent = async () => {
                  try {
                    if (!id) return;
                    const response = await eventsAPI.getById(id);
                    if (response.data.success) {
                      setEvent(response.data.data);
                    }
                  } catch (error) {
                    console.error("Retry failed:", error);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchEvent();
              }}
            >
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => navigate("/events")}>
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>

          <div className="mb-6 rounded-lg bg-muted p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-lg border p-4">
            <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-6">
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
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

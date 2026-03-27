import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Download, Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, type SelectOption } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/shared/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useAuthentication } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import { eventsAPI, type SchoolEvent } from "@/api/events-api";
import { ROLES } from "@/config/constants/roles";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CreateEventInput {
  title: string;
  objective?: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  organizedBy: "admin" | "department";
}

interface UpdateEventInput {
  title?: string;
  objective?: string;
  allDay?: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  organizedBy?: "admin" | "department";
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Configuration
// ─────────────────────────────────────────────────────────────────────────────
const ORGANIZED_BY_OPTIONS: SelectOption[] = [
  { value: "admin", label: "Admin" },
  { value: "department", label: "Department" },
];

const STATUS_CONFIG = {
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
// Form Validation Schema
// ─────────────────────────────────────────────────────────────────────────────
const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  objective: z.string().optional(),
  allDay: z.boolean(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().min(1, "Venue is required"),
  organizedBy: z.enum(["admin", "department"]),
});

type EventForm = z.infer<typeof eventSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Calculate event status based on dates
// ─────────────────────────────────────────────────────────────────────────────
const calculateEventStatus = (
  startDate: string,
  endDate: string,
): "upcoming" | "ongoing" | "completed" => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "ongoing";
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { authenticatedUser } = useAuthentication();
  const canManage = authenticatedUser?.role === ROLES.ADMIN || authenticatedUser?.role === ROLES.ADVISER;

  const [eventsList, setEventsList] = useState<SchoolEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isEditing = !!editingEvent;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      allDay: true,
      organizedBy: "admin",
    },
  });

  const allDay = watch("allDay");

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Events from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getAll({ limit: 100 });
      const apiResponse = response.data;

      let eventsData: SchoolEvent[] = [];

      if (apiResponse.success) {
        if (Array.isArray(apiResponse.data)) {
          eventsData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          eventsData = apiResponse.data.items;
        } else if (apiResponse.data?.items) {
          eventsData = apiResponse.data.items;
        }

        setEventsList(eventsData);
      } else {
        toast.error(apiResponse.message || "Failed to fetch events");
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    if (!canManage) {
      toast.error("You don't have permission to create events");
      return;
    }
    setEditingEvent(null);
    reset({
      title: "",
      objective: "",
      allDay: true,
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      venue: "",
      organizedBy: "admin",
    });
    setModalOpen(true);
  };

  const openEditModal = (event: SchoolEvent) => {
    if (!canManage) {
      toast.error("You don't have permission to edit events");
      return;
    }
    setEditingEvent(event);
    reset({
      title: event.title,
      objective: event.objective || "",
      allDay: event.allDay,
      startDate: event.startDate ? event.startDate.substring(0, 10) : "",
      endDate: event.endDate ? event.endDate.substring(0, 10) : "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      venue: event.venue,
      organizedBy: event.organizedBy,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    reset();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // CRUD Operations
  // ───────────────────────────────────────────────────────────────────────────
  const onSubmit = async (data: EventForm) => {
    if (!canManage) {
      toast.error("You don't have permission to manage events");
      return;
    }

    setSubmitting(true);
    try {
      const status = calculateEventStatus(data.startDate, data.endDate);

      const payload: CreateEventInput = {
        title: data.title,
        objective: data.objective,
        allDay: data.allDay,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.allDay ? undefined : data.startTime,
        endTime: data.allDay ? undefined : data.endTime,
        venue: data.venue,
        organizedBy: data.organizedBy,
      };

      let response;
      if (isEditing && editingEvent) {
        response = await eventsAPI.update(editingEvent._id, { ...payload, status } as UpdateEventInput & { status: string });
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success(apiResponse.message || "Event updated successfully");
          fetchEvents();
          closeModal();
        } else {
          toast.error(apiResponse.message || "Failed to update event");
        }
      } else {
        response = await eventsAPI.create({ ...payload, status } as CreateEventInput & { status: string });
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success(apiResponse.message || "Event created successfully");
          fetchEvents();
          closeModal();
        } else {
          toast.error(apiResponse.message || "Failed to create event");
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || (isEditing ? "Failed to update event" : "Failed to create event");
      toast.error(message);
      console.error("Event submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage || !deleteTarget) {
      toast.error("You don't have permission to delete events");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      const response = await eventsAPI.delete(deleteTarget._id);
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success(apiResponse.message || "Event deleted successfully");
        fetchEvents();
      } else {
        toast.error(apiResponse.message || "Failed to delete event");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to delete event";
      toast.error(message);
      console.error("Delete event error:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Table Columns
  // ───────────────────────────────────────────────────────────────────────────
  const columns: ColumnDef<SchoolEvent>[] = [
    {
      header: "Title",
      accessorKey: "title",
      cell: (row: SchoolEvent) => (
        <Link to={`/events/${row._id}`} className="text-primary hover:underline font-medium">
          {row.title || "—"}
        </Link>
      ),
    },
    {
      header: "Date",
      accessorKey: "startDate",
      cell: (row: SchoolEvent) => {
        const start = row.startDate;
        const end = row.endDate;
        const startDate = start ? format(new Date(start), "MMM dd, yyyy") : "";
        const endDate = end && end !== start ? ` - ${format(new Date(end), "MMM dd, yyyy")}` : "";
        return (
          <span>
            {startDate}
            {endDate}
            {row.allDay ? "" : ` (${row.startTime || "N/A"} - ${row.endTime || "N/A"})`}
          </span>
        );
      },
    },
    {
      header: "Venue",
      accessorKey: "venue",
      cell: (row: SchoolEvent) => row.venue || "—",
    },
    {
      header: "Organized By",
      accessorKey: "organizedBy",
      cell: (row: SchoolEvent) => <span className="capitalize">{row.organizedBy || "—"}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: SchoolEvent) => {
        const status = row?.status || "upcoming";
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
        return (
          <Badge variant="secondary" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    ...(canManage
      ? [
          {
            header: "Actions",
            accessorKey: "actions",
            cell: (row: SchoolEvent) => (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

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
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <title>CampusHub | Events Management</title>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-1">
              {canManage ? "Manage campus events" : "View campus events"}
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreateModal}>
              <div className="flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </div>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="bg-primary/10 rounded-lg p-2.5">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{eventsList.length}</p>
                <p className="text-muted-foreground text-xs">Total Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2.5">
                <Clock className="text-amber-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {eventsList.filter((e) => e.status === "upcoming").length}
                </p>
                <p className="text-muted-foreground text-xs">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2.5">
                <Users className="text-blue-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {eventsList.filter((e) => e.status === "ongoing").length}
                </p>
                <p className="text-muted-foreground text-xs">Ongoing</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-2.5">
                <MapPin className="text-emerald-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {eventsList.filter((e) => e.status === "completed").length}
                </p>
                <p className="text-muted-foreground text-xs">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DataTable columns={columns} data={eventsList} searchPlaceholder="Search events..." />

        {/* Create/Edit Event Modal */}
        {canManage && (
          <Modal
            isOpen={modalOpen}
            onClose={closeModal}
            title={isEditing ? "Edit Event" : "Add Event"}
            size="lg"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Event title" {...register("title")} />
                  {errors.title && (
                    <p className="text-destructive mt-1 text-sm">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective">Objective</Label>
                  <Input id="objective" placeholder="Event objective" {...register("objective")} />
                  {errors.objective && (
                    <p className="text-destructive mt-1 text-sm">{errors.objective.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" {...register("startDate")} />
                    {errors.startDate && (
                      <p className="text-destructive mt-1 text-sm">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" {...register("endDate")} />
                    {errors.endDate && (
                      <p className="text-destructive mt-1 text-sm">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
                {!allDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" type="time" {...register("startTime")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" type="time" {...register("endTime")} />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" placeholder="Event venue" {...register("venue")} />
                  {errors.venue && (
                    <p className="text-destructive mt-1 text-sm">{errors.venue.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizedBy">Organized By</Label>
                    <Select
                      id="organizedBy"
                      options={ORGANIZED_BY_OPTIONS}
                      placeholder="Select organizer"
                      {...register("organizedBy")}
                      error={errors.organizedBy?.message}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" {...register("allDay")} className="rounded" />
                      All Day Event
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation Dialog */}
        {canManage && (
          <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete Event"
            message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
            confirmText="Delete"
            loading={deleting}
          />
        )}
      </div>
    </>
  );
}

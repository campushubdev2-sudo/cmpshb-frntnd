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

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching backend response shapes)
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
  description?: string;
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
  description?: string;
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
// Mock Data - Pre-populated Events
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_EVENTS: SchoolEvent[] = [
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
// In-Memory Store (simulates database)
// ─────────────────────────────────────────────────────────────────────────────
let events: SchoolEvent[] = [...INITIAL_EVENTS];

// ─────────────────────────────────────────────────────────────────────────────
// Mock API Functions (returning backend-compatible responses)
// ─────────────────────────────────────────────────────────────────────────────
const mockAPI = {
  getAll(): Promise<SuccessResponse<SchoolEvent[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Events fetched successfully",
          data: [...events],
        });
      }, 300);
    });
  },

  getById(id: string): Promise<SuccessResponse<SchoolEvent> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const event = events.find((e) => e._id === id);
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

  create(
    input: CreateEventInput & { status?: string },
  ): Promise<SuccessResponse<SchoolEvent> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validate title is unique
        const existing = events.find((e) => e.title.toLowerCase() === input.title.toLowerCase());
        if (existing) {
          resolve({
            success: false,
            status: "fail",
            message: "Event with this title already exists",
          });
          return;
        }

        // Calculate status based on dates
        const status = input.status || calculateEventStatus(input.startDate, input.endDate);

        const now = new Date().toISOString();
        const newEvent: SchoolEvent = {
          _id: `67d8f2a1c9e8b3a4d5e6e${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(3, "0")}`,
          title: input.title,
          objective: input.objective,
          allDay: input.allDay,
          startDate: input.startDate,
          endDate: input.endDate,
          startTime: input.allDay ? undefined : input.startTime,
          endTime: input.allDay ? undefined : input.endTime,
          venue: input.venue,
          organizedBy: input.organizedBy,
          createdAt: now,
          updatedAt: now,
          description: input.description,
          status: status as "upcoming" | "ongoing" | "completed" | "cancelled",
        };
        events.push(newEvent);
        resolve({
          success: true,
          message: "Event created successfully",
          data: { ...newEvent },
        });
      }, 300);
    });
  },

  update(
    id: string,
    input: UpdateEventInput & { status?: string },
  ): Promise<SuccessResponse<SchoolEvent> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventIndex = events.findIndex((e) => e._id === id);
        if (eventIndex === -1) {
          resolve({
            success: false,
            status: "fail",
            message: "Event not found",
          });
          return;
        }

        // Allowed fields to update: title, objective, startDate, endDate, startTime, endTime, venue, organizedBy, allDay
        const allowedFields: (keyof UpdateEventInput)[] = [
          "title",
          "objective",
          "startDate",
          "endDate",
          "startTime",
          "endTime",
          "venue",
          "organizedBy",
          "allDay",
          "description",
        ];

        const updatedEvent: SchoolEvent = {
          ...events[eventIndex],
          updatedAt: new Date().toISOString(),
        };

        // Only update allowed fields that are provided
        allowedFields.forEach((field) => {
          if (input[field] !== undefined) {
            (updatedEvent as any)[field] = input[field];
          }
        });

        // If allDay is true, clear startTime and endTime
        if (updatedEvent.allDay) {
          updatedEvent.startTime = undefined;
          updatedEvent.endTime = undefined;
        }

        // Calculate status based on dates (auto-calculated, not user-provided)
        if (input.startDate || input.endDate) {
          updatedEvent.status = calculateEventStatus(
            input.startDate || updatedEvent.startDate,
            input.endDate || updatedEvent.endDate,
          );
        } else if (input.status) {
          updatedEvent.status = input.status as "upcoming" | "ongoing" | "completed";
        }

        events[eventIndex] = updatedEvent;
        resolve({
          success: true,
          message: "Event updated successfully",
          data: { ...updatedEvent },
        });
      }, 300);
    });
  },

  delete(id: string): Promise<SuccessResponse<SchoolEvent> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const eventIndex = events.findIndex((e) => e._id === id);
        if (eventIndex === -1) {
          resolve({
            success: false,
            status: "fail",
            message: "Event not found",
          });
          return;
        }
        const deletedEvent = events[eventIndex];
        events.splice(eventIndex, 1);
        resolve({
          success: true,
          message: "Event deleted successfully",
          data: { ...deletedEvent },
        });
      }, 300);
    });
  },
};

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
  description: z.string().optional(),
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
  const canManage = authenticatedUser?.role === "admin" || authenticatedUser?.role === "adviser";

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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await mockAPI.getAll();
      setEventsList(response.data);
    } catch (error) {
      toast.error("Failed to fetch events");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
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
      description: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (event: SchoolEvent) => {
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
      description: event.description || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    reset();
  };

  const onSubmit = async (data: EventForm) => {
    try {
      setSubmitting(true);
      // Calculate status based on dates
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
        description: data.description,
      };

      let response;
      if (isEditing && editingEvent) {
        response = await mockAPI.update(editingEvent._id, { ...payload, status });
        if (response.success) {
          toast.success("Event updated successfully");
        } else {
          toast.error(response.message);
          return;
        }
      } else {
        response = await mockAPI.create({ ...payload, status } as CreateEventInput & {
          status: string;
        });
        if (response.success) {
          toast.success("Event created successfully");
        } else {
          toast.error(response.message);
          return;
        }
      }
      closeModal();
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? "Failed to update event" : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      if (deleteTarget) {
        const response = await mockAPI.delete(deleteTarget._id);
        if (response.success) {
          toast.success("Event deleted successfully");
        } else {
          toast.error(response.message);
          return;
        }
      }
      setDeleteTarget(null);
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
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
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-destructive mt-1 text-sm">{errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" placeholder="Event venue" {...register("venue")} />
                {errors.venue && (
                  <p className="text-destructive mt-1 text-sm">{errors.venue.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizedBy">Organized By</Label>
                <Select
                  id="organizedBy"
                  options={ORGANIZED_BY_OPTIONS}
                  placeholder="Select organizer"
                  {...register("organizedBy")}
                />
                {errors.organizedBy && (
                  <p className="text-destructive mt-1 text-sm">{errors.organizedBy.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allDay" {...register("allDay")} className="h-4 w-4" />
                <Label htmlFor="allDay" className="cursor-pointer">
                  All Day Event
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...register("startDate")} />
                  {errors.startDate && (
                    <p className="text-destructive text-sm">{errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" {...register("endDate")} />
                  {errors.endDate && (
                    <p className="text-destructive text-sm">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
              {!allDay && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
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
  );
}

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar, MapPin, Users, Clock, WifiOff } from "lucide-react";
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
import { useAuthentication } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ColumnDef } from "@tanstack/react-table";
import { eventsAPI, type SchoolEvent } from "@/api/events-api";
import { orgsAPI, type Org } from "@/api/orgs-api";
import { ROLES } from "@/config/constants/roles";
import { Skeleton } from "@/components/ui/skeleton";

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
  status: "draft" | "pending" | "approved" | "rejected" | "cancelled" | "completed";
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
  status?: "draft" | "pending" | "approved" | "rejected" | "cancelled" | "completed";
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Configuration
// ─────────────────────────────────────────────────────────────────────────────
const ORGANIZED_BY_OPTIONS: SelectOption[] = [
  { value: "admin", label: "Admin" },
  { value: "department", label: "Department" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

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
  organizedBy: z.string(),
  status: z.enum(["draft", "pending", "approved", "rejected", "cancelled", "completed"]),
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
// Helper: Check if error is network-related
// ─────────────────────────────────────────────────────────────────────────────
const isNetworkError = (error: any): boolean => {
  // Check for common network error indicators
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
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function EventsPage() {
  const { authenticatedUser } = useAuthentication();
  const canManage =
    authenticatedUser?.role === ROLES.ADMIN || authenticatedUser?.role === ROLES.ADVISER;

  const [eventsList, setEventsList] = useState<SchoolEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // For adviser/officer - their organization
  const [myOrg, setMyOrg] = useState<{ _id: string; orgName: string } | null>(null);
  const [myOrgLoading, setMyOrgLoading] = useState(false);
  const [myOrgError, setMyOrgError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [allOrgs, setAllOrgs] = useState<Org[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [myOrgEvents, setMyOrgEvents] = useState<SchoolEvent[]>([]);
  const [myOrgEventsLoading, setMyOrgEventsLoading] = useState(false);

  const isAdviser = authenticatedUser?.role === ROLES.ADVISER;
  const isAdmin = authenticatedUser?.role === ROLES.ADMIN;
  const isOfficer = authenticatedUser?.role === ROLES.OFFICER;

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

  // Dynamic organized by options for admin (includes Admin + all departments)
  const organizedByOptions = useMemo(() => {
    const options: SelectOption[] = [{ value: "admin", label: "Admin" }];

    // Add departments (organizations with advisers)
    allOrgs.forEach((org) => {
      options.push({
        value: org._id,
        label: `Department (${org.orgName})`,
      });
    });

    return options;
  }, [allOrgs]);

  // Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setNetworkError(null);
      const response = await eventsAPI.getAll({ limit: 100 });
      const apiResponse = response.data;

      if (apiResponse.success) {
        let eventsData: SchoolEvent[] = [];
        if (Array.isArray(apiResponse.data)) {
          eventsData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          eventsData = apiResponse.data.items;
        }
        setEventsList(eventsData);
      } else {
        toast.error(apiResponse.message || "Failed to fetch events");
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
      if (isNetworkError(error)) {
        setNetworkError("Unable to connect to the server. Please check your internet connection.");
        toast.error("No internet connection. Please check your network and try again.");
      } else {
        toast.error("Failed to fetch events");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dropdown data (orgs) and adviser-specific data
  const fetchDropdownData = useCallback(async () => {
    try {
      // Fetch all organizations for admin dropdown
      const orgsRes = await orgsAPI.getAll({ limit: 100 });
      const orgsApiResponse = orgsRes.data;

      if (orgsApiResponse.success && Array.isArray(orgsApiResponse.data)) {
        setAllOrgs(orgsApiResponse.data);
      }

      // Fetch adviser's/officer's organization
      if (isAdviser || isOfficer) {
        setMyOrgLoading(true);
        setMyOrgError(null);
        try {
          const myOrgRes = await orgsAPI.getMyOrg();
          const myOrgData = myOrgRes.data;

          if (!myOrgData?.success || !myOrgData.data?._id || !myOrgData.data?.orgName) {
            throw new Error("Invalid organization data received");
          }

          const orgId = myOrgData.data._id;
          const orgName = myOrgData.data.orgName;

          setMyOrg({
            _id: orgId,
            orgName: orgName,
          });

          // Fetch events for this organization
          setMyOrgEventsLoading(true);
          const eventsRes = await eventsAPI.getByOrgId(orgId, { limit: 100 });
          const eventsData = eventsRes.data;

          if (eventsData.success && Array.isArray(eventsData.data)) {
            setMyOrgEvents(eventsData.data);
          } else {
            setMyOrgEvents([]);
          }
        } catch (error: any) {
          console.error("Failed to fetch organization:", error);
          if (isNetworkError(error)) {
            setNetworkError("Unable to connect to the server. Please check your internet connection.");
            setMyOrgError("No internet connection. Please check your network and try again.");
          } else {
            const errorMessage =
              error?.response?.data?.message || error?.message || "Failed to load your organization";
            setMyOrgError(errorMessage);
          }
          setMyOrg(null);
          setMyOrgEvents([]);
        } finally {
          setMyOrgLoading(false);
          setMyOrgEventsLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
      toast.error("Failed to load organizations");
    }
  }, [isAdviser, isOfficer]);

  useEffect(() => {
    fetchEvents();
    fetchDropdownData();
  }, []);

  // Refresh events list (for admin - refetch all events)
  const refreshEvents = useCallback(async () => {
    await fetchEvents();
  }, []);

  // Refresh organization events
  const refreshMyOrgEvents = useCallback(async () => {
    if (!myOrg) return;
    try {
      setMyOrgEventsLoading(true);
      const eventsRes = await eventsAPI.getByOrgId(myOrg._id, { limit: 100 });
      const eventsData = eventsRes.data;

      if (eventsData.success && Array.isArray(eventsData.data)) {
        setMyOrgEvents(eventsData.data);
      }
    } catch (error: any) {
      console.error("Error fetching organization events:", error);
      toast.error("Failed to fetch events");
    } finally {
      setMyOrgEventsLoading(false);
    }
  }, [myOrg]);

  // ───────────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    if (!canManage) {
      toast.error("You don't have permission to create events");
      return;
    }

    if ((isAdviser || isOfficer) && !myOrg) {
      if (myOrgLoading) {
        toast.error("Please wait, loading your organization...");
        return;
      }
      if (myOrgError) {
        toast.error(
          myOrgError || "Unable to load your organization. Please refresh the page.",
        );
        return;
      }
      toast.error("You are not assigned to any organization. Contact admin.");
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
      organizedBy: (isAdviser || isOfficer) ? "department" : "admin",
      status: "draft",
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
      organizedBy: (isAdviser || isOfficer) ? "department" : event.organizedBy,
      status: event.status || "draft",
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
      const status = data.status;
      
      // Determine organizedBy value
      // - For advisers/officers: always use their organization ID
      // - For admin: use "admin" if selected, otherwise use the selected org ID
      let organizedByValue: string;
      if ((isAdviser || isOfficer) && myOrg) {
        organizedByValue = myOrg._id;
      } else if (data.organizedBy === "admin") {
        organizedByValue = "admin";
      } else {
        // Admin selected a department, use the org ID
        organizedByValue = data.organizedBy;
      }

      const payload: CreateEventInput & { organizedBy?: string } = {
        title: data.title,
        objective: data.objective,
        allDay: data.allDay,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.allDay ? undefined : data.startTime,
        endTime: data.allDay ? undefined : data.endTime,
        venue: data.venue,
        organizedBy: organizedByValue,
        status: status,
      };

      let response;
      if (isEditing && editingEvent) {
        const updatePayload: UpdateEventInput = {
          title: payload.title,
          objective: payload.objective,
          allDay: payload.allDay,
          startDate: payload.startDate,
          endDate: payload.endDate,
          startTime: payload.startTime,
          endTime: payload.endTime,
          venue: payload.venue,
          status: payload.status,
        };
        // Include organizedBy for admin (adviser/officer can't change org)
        if (!(isAdviser || isOfficer)) {
          updatePayload.organizedBy = organizedByValue;
        }
        response = await eventsAPI.update(editingEvent._id, updatePayload);
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success(apiResponse.message || "Event updated successfully");
          (isAdviser || isOfficer) ? refreshMyOrgEvents() : refreshEvents();
          closeModal();
        } else {
          toast.error(apiResponse.message || "Failed to update event");
        }
      } else {
        response = await eventsAPI.create(payload as CreateEventInput);
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success(apiResponse.message || "Event created successfully");
          (isAdviser || isOfficer) ? refreshMyOrgEvents() : refreshEvents();
          closeModal();
        } else {
          toast.error(apiResponse.message || "Failed to create event");
        }
      }
    } catch (error: any) {
      console.error("Event submit error:", error);
      if (isNetworkError(error)) {
        toast.error("No internet connection. Please check your network and try again.");
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          (isEditing ? "Failed to update event" : "Failed to create event");
        toast.error(message);
      }
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
        (isAdviser || isOfficer) ? refreshMyOrgEvents() : refreshEvents();
      } else {
        toast.error(apiResponse.message || "Failed to delete event");
      }
    } catch (error: any) {
      console.error("Delete event error:", error);
      if (isNetworkError(error)) {
        toast.error("No internet connection. Please check your network and try again.");
      } else {
        const message = error?.response?.data?.message || error?.message || "Failed to delete event";
        toast.error(message);
      }
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
  // Network Error State
  // ───────────────────────────────────────────────────────────────────────────
  if (networkError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <WifiOff className="text-muted-foreground h-16 w-16" />
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Connection Issue</p>
          <p className="text-muted-foreground text-sm mt-1">{networkError}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setNetworkError(null);
              setLoading(true);
              refreshEvents();
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading || ((isAdviser || isOfficer) && (myOrgLoading || myOrgEventsLoading))) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 py-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-9 w-64" />
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Error State (Adviser/Officer)
  // ───────────────────────────────────────────────────────────────────────────
  if ((isAdviser || isOfficer) && myOrgError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">{myOrgError}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Please contact your administrator or refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // No Organization State (Adviser/Officer)
  // ───────────────────────────────────────────────────────────────────────────
  if ((isAdviser || isOfficer) && !myOrg && !myOrgError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">
            {isOfficer 
              ? "You are not registered as an officer. Please contact your organization adviser or administrator."
              : "You are not assigned to any organization. Contact admin."}
          </p>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  // Render organization-specific view for adviser/officer
  if ((isAdviser || isOfficer) && myOrg) {
    return (
      <>
        <title>CampusHub | {myOrg.orgName} Events</title>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{myOrg.orgName} Events</h1>
              <p className="text-muted-foreground mt-1">Your organization's events</p>
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
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="text-blue-600 bg-blue-50 flex h-11 w-11 items-center justify-center rounded-lg">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Events</p>
                  <p className="text-foreground text-xl font-bold">{myOrgEvents.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="text-amber-600 bg-amber-50 flex h-11 w-11 items-center justify-center rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Upcoming</p>
                  <p className="text-foreground text-xl font-bold">
                    {myOrgEvents.filter((e) => e.status === "upcoming").length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="text-emerald-600 bg-emerald-50 flex h-11 w-11 items-center justify-center rounded-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Organization</p>
                  <p className="text-foreground text-xl font-bold">{myOrg.orgName}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events List */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Events</h2>
              {myOrgEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground font-medium">No events found</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Add your first event to get started
                  </p>
                  {canManage && (
                    <Button onClick={openCreateModal} className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2 inline-flex" />
                      Add Event
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrgEvents.map((event) => {
                    const status = event?.status || "upcoming";
                    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                    return (
                      <div
                        key={event._id}
                        className="bg-muted flex items-center justify-between rounded-lg px-4 py-4 border cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-background flex h-10 w-10 items-center justify-center rounded-full border">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={config.className}>
                                {config.label}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {event.startDate
                                  ? format(new Date(event.startDate), "MMM dd, yyyy")
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">
                            {event.venue || "No venue"}
                          </p>
                          {canManage && (
                            <div className="flex gap-2 justify-end mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(event)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteTarget(event)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

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
                    <Input
                      id="objective"
                      placeholder="Event objective"
                      {...register("objective")}
                    />
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
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      id="status"
                      options={STATUS_OPTIONS}
                      placeholder="Select status"
                      {...register("status")}
                      error={errors.status?.message}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizedBy">Organized By</Label>
                      {(isAdviser || isOfficer) && myOrg ? (
                        <Input
                          id="organizedBy"
                          value={`Department (${myOrg.orgName})`}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                      ) : (
                        <Select
                          id="organizedBy"
                          options={organizedByOptions}
                          placeholder="Select organizer"
                          {...register("organizedBy")}
                          error={errors.organizedBy?.message}
                        />
                      )}
                      {isAdmin && orgsLoading && (
                        <p className="text-muted-foreground text-xs">Loading departments...</p>
                      )}
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

  // Render admin/guest view
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
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    options={STATUS_OPTIONS}
                    placeholder="Select status"
                    {...register("status")}
                    error={errors.status?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizedBy">Organized By</Label>
                    {(isAdviser || isOfficer) && myOrg ? (
                      <Input
                        id="organizedBy"
                        value={`Department (${myOrg.orgName})`}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    ) : (
                      <Select
                        id="organizedBy"
                        options={organizedByOptions}
                        placeholder="Select organizer"
                        {...register("organizedBy")}
                        error={errors.organizedBy?.message}
                      />
                    )}
                    {isAdmin && orgsLoading && (
                      <p className="text-muted-foreground text-xs">Loading departments...</p>
                    )}
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

import { useState, useMemo, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Send,
  Calendar,
  Users,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Search,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/shared/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useAuthentication } from "@/contexts/AuthContext";
import {
  eventNotificationsAPI,
  type EventNotification,
  type EventNotification as BackendNotification,
} from "@/api/notifications-api";
import { eventsAPI } from "@/api/events-api";
import { usersAPI, type User } from "@/api/users-api";
import { authApi } from "@/api/auth-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Event {
  _id: string;
  title: string;
}

interface Notification extends EventNotification {
  eventTitle?: string;
  recipientUsername?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Configuration
// ─────────────────────────────────────────────────────────────────────────────
const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive"> = {
  sent: "default",
  read: "secondary",
  failed: "destructive",
};

const MESSAGE_TEMPLATES = [
  {
    label: "Event Invitation",
    message: "You are invited to attend this event. We look forward to your participation!",
  },
  {
    label: "Event Reminder",
    message:
      "This is a friendly reminder about an upcoming event. Please make sure to attend on time.",
  },
  {
    label: "Event Update",
    message:
      "There has been an important update regarding this event. Please check the event details for more information.",
  },
  {
    label: "Event Cancellation",
    message:
      "We regret to inform you that this event has been cancelled. We apologize for any inconvenience.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Normalize backend notification
// ─────────────────────────────────────────────────────────────────────────────
const normalizeNotification = (notif: BackendNotification): Notification => {
  return {
    ...notif,
    eventTitle:
      typeof notif.eventId === "object" && notif.eventId !== null ? notif.eventId.title : undefined,
    recipientUsername:
      typeof notif.recipientId === "object" && notif.recipientId !== null
        ? notif.recipientId.username
        : undefined,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { authenticatedUser } = useAuthentication();
  const canManage = authenticatedUser?.role === "admin" || authenticatedUser?.role === "adviser";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eventOptions, setEventOptions] = useState<SelectOption[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [viewTarget, setViewTarget] = useState<Notification | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [senderId, setSenderId] = useState<string | null>(null);

  // Form state
  const [formEventId, setFormEventId] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Notifications
  // ───────────────────────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await eventNotificationsAPI.getAll({ limit: 100, order: "desc" });
      const apiResponse = response.data;

      if (apiResponse.success) {
        let notificationsData: any[] = [];

        // Handle different response structures
        if (Array.isArray(apiResponse.data)) {
          notificationsData = apiResponse.data;
        } else if (apiResponse.data?.docs && Array.isArray(apiResponse.data.docs)) {
          notificationsData = apiResponse.data.docs;
        }

        const normalized = notificationsData.map(normalizeNotification);
        setNotifications(normalized);
      } else {
        setNotifications([]);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      const message =
        error?.response?.data?.message || error?.message || "Failed to fetch notifications";
      toast.error(message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Events for dropdown
  // ───────────────────────────────────────────────────────────────────────────
  const fetchEvents = async () => {
    try {
      // Fetch all events without type filter to ensure we get events for the dropdown
      const response = await eventsAPI.getAll({ limit: 100, paginate: false });
      const apiResponse = response.data;

      if (apiResponse.success) {
        let eventsData: any[] = [];

        // Handle different response structures
        if (Array.isArray(apiResponse.data)) {
          eventsData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data.docs)) {
          eventsData = apiResponse.data.docs;
        }

        setEventOptions(
          eventsData.map((e) => ({
            value: e._id,
            label: e.title,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Users
  // ───────────────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll({ limit: 100 });
      const apiResponse = response.data;

      if (apiResponse.success && Array.isArray(apiResponse.data)) {
        setAllUsers(apiResponse.data);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setAllUsers([]);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Sender ID from profile
  // ───────────────────────────────────────────────────────────────────────────
  const fetchSenderId = async () => {
    try {
      const response = await authApi.getProfile();
      const apiResponse = response.data;

      if (apiResponse.success && apiResponse.data?._id) {
        setSenderId(apiResponse.data._id);
      }
    } catch (error) {
      console.error("Failed to fetch sender profile:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchEvents();
    fetchUsers();
    fetchSenderId();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Memoized filtered users
  // ───────────────────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers;
    const q = userSearch.toLowerCase();
    return allUsers.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

  // ───────────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const openModal = () => {
    setFormEventId("");
    setFormMessage("");
    setSelectedUserIds([]);
    setUserSearch("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredUsers.map((u) => u._id);
    setSelectedUserIds((prev) => {
      const combined = new Set([...prev, ...filteredIds]);
      return [...combined];
    });
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  const applyTemplate = (template: { message: string }) => {
    setFormMessage(template.message);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Form Submission
  // ───────────────────────────────────────────────────────────────────────────
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId) {
      toast.error("Please select an event");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!formMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    try {
      setSubmitting(true);

      // Use single create endpoint for one user, bulk for multiple
      if (selectedUserIds.length === 1) {
        const payload = {
          eventId: formEventId,
          recipientId: selectedUserIds[0],
          message: formMessage.trim(),
          senderId: senderId || undefined,
        };

        const response = await eventNotificationsAPI.create(payload);
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Notification sent successfully");
          closeModal();
          fetchNotifications();
        } else {
          toast.error(apiResponse.message || "Failed to send notification");
        }
      } else {
        const payload = {
          eventId: formEventId,
          recipientIds: selectedUserIds,
          message: formMessage.trim(),
          senderId: senderId || undefined,
        };

        const response = await eventNotificationsAPI.createBulk(payload);
        const apiResponse = response.data;

        if (apiResponse.success) {
          const count = apiResponse.data?.notifications?.length || selectedUserIds.length;
          toast.success(
            `Notification sent to ${count} recipient${count > 1 ? "s" : ""}${apiResponse.data?.skippedDuplicates ? ` (${apiResponse.data.skippedDuplicates} duplicates skipped)` : ""}`,
          );
          closeModal();
          fetchNotifications();
        } else {
          toast.error(apiResponse.message || "Failed to send notification");
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to send notification";
      toast.error(message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Delete Handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      if (deleteTarget) {
        const response = await eventNotificationsAPI.delete(deleteTarget._id);
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Notification deleted successfully");
          setDeleteTarget(null);
          fetchNotifications();
        } else {
          toast.error(apiResponse.message || "Failed to delete notification");
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to delete notification";
      toast.error(message);
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Helper functions
  // ───────────────────────────────────────────────────────────────────────────
  const getEventTitle = (eventId: string | object | null): string => {
    if (!eventId) return "—";
    if (typeof eventId === "object") {
      return (eventId as any).title || "—";
    }
    const event = eventOptions.find((e) => e.value === eventId);
    return event?.label || "—";
  };

  const getRecipientUsername = (recipientId: string | object | null): string => {
    if (!recipientId) return "—";
    if (typeof recipientId === "object") {
      return (recipientId as any).username || "—";
    }
    const user = allUsers.find((u) => u._id === recipientId);
    return user?.username || "—";
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Table Columns
  // ───────────────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Notification>[] = [
    {
      header: "Event",
      accessorKey: "eventId",
      cell: (row: Notification) => getEventTitle(row.eventId),
    },
    {
      header: "Recipient",
      accessorKey: "recipientId",
      cell: (row: Notification) => getRecipientUsername(row.recipientId),
    },
    {
      header: "Message",
      accessorKey: "message",
      cell: (row: Notification) =>
        row.message
          ? row.message.length > 50
            ? `${row.message.substring(0, 50)}...`
            : row.message
          : "—",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Notification) => (
        <Badge variant={statusBadgeVariant[row.status] || "default"}>{row.status}</Badge>
      ),
    },
    {
      header: "Sent At",
      accessorKey: "sentAt",
      cell: (row: Notification) => format(new Date(row.sentAt), "MMM dd, yyyy HH:mm"),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: Notification) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewTarget(row)}>
            <Eye className="mr-1 h-4 w-4 inline-flex" />
            View
          </Button>
          {canManage && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-44" />
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
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-10 w-36" />
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
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <title>CampusHub | Notifications</title>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {canManage ? "Manage event notifications" : "View event notifications"}
            </p>
          </div>
          {canManage && (
            <Button onClick={openModal}>
              <div className="flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Send Notification
              </div>
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={notifications}
          searchPlaceholder="Search notifications..."
        />

        {/* Send Notification Dialog - admin/adviser only */}
        {canManage && (
          <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Send className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle>Send Notification</DialogTitle>
                    <DialogDescription>
                      Send an event notification to selected users
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <Separator />
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Event Field */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                    Event
                  </Label>
                  <Select
                    options={eventOptions}
                    placeholder="Select an event..."
                    value={formEventId}
                    onChange={(e) => setFormEventId(e.target.value)}
                  />
                </div>

                {/* Recipients - Multi-select User List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Users className="text-muted-foreground h-3.5 w-3.5" />
                      Recipients
                    </Label>
                    {selectedUserIds.length > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {selectedUserIds.length} selected
                      </span>
                    )}
                  </div>

                  {/* Selected user chips */}
                  {selectedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUserIds.slice(0, 8).map((uid) => {
                        const u = allUsers.find((user) => user._id === uid);
                        return (
                          <span
                            key={uid}
                            className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                          >
                            {u?.username || uid}
                            <button
                              type="button"
                              onClick={() => toggleUser(uid)}
                              className="hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                      {selectedUserIds.length > 8 && (
                        <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-1 text-xs">
                          +{selectedUserIds.length - 8} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Search + actions bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="h-9 pl-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllFiltered}
                      className="h-9 shrink-0 text-xs"
                    >
                      Select all
                    </Button>
                    {selectedUserIds.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deselectAll}
                        className="h-9 shrink-0 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* User list */}
                  <div className="max-h-48 overflow-auto rounded-lg border">
                    {filteredUsers.length === 0 ? (
                      <p className="text-muted-foreground py-6 text-center text-sm">
                        No users found
                      </p>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u._id);
                        return (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => toggleUser(u._id)}
                            className={cn(
                              "flex w-full items-center gap-3 border-b px-3 py-2.5 text-sm transition-colors last:border-b-0",
                              isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-input",
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <span className="block truncate font-medium">{u.username}</span>
                              <span className="text-muted-foreground block truncate text-xs">
                                {u.email}
                              </span>
                            </div>
                            <Badge
                              variant={
                                u.role === "admin"
                                  ? "destructive"
                                  : u.role === "adviser"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="shrink-0 text-[10px]"
                            >
                              {u.role}
                            </Badge>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Message Templates */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <MessageSquare className="text-muted-foreground h-3.5 w-3.5" />
                    Message
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {MESSAGE_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          formMessage === tpl.message
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 hover:bg-muted text-foreground border-input",
                        )}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Write your notification message or select a template above..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    rows={4}
                    className={cn(!formMessage.trim() && "border-input")}
                  />
                  <div className="flex items-center justify-between">
                    {!formMessage.trim() ? (
                      <p className="text-muted-foreground flex items-center gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        Message is required
                      </p>
                    ) : (
                      <span />
                    )}
                    <p
                      className={cn(
                        "text-xs",
                        formMessage.length > 500 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {formMessage.length}/500
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={closeModal}>
                    Cancel
                  </Button>

                  <Button type="submit" loading={submitting} className="w-fit">
                    <Send className="h-4 w-4 inline-flex mr-1" />
                    Send to {selectedUserIds.length || 0} user
                    {selectedUserIds.length !== 1 ? "s" : ""}
                  </Button>

                  {/* <div className="flex items-center justify-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </div> */}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* View Notification Detail */}
        <Dialog open={!!viewTarget} onOpenChange={(open) => !open && setViewTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Notification Details</DialogTitle>
            </DialogHeader>
            <Separator />
            {viewTarget && (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground font-medium">Event:</span>{" "}
                  <span className="text-foreground">{getEventTitle(viewTarget.eventId)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Recipient:</span>{" "}
                  <span className="text-foreground">
                    {getRecipientUsername(viewTarget.recipientId)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Status:</span>{" "}
                  <Badge variant={statusBadgeVariant[viewTarget.status] || "default"}>
                    {viewTarget.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Sent At:</span>{" "}
                  <span className="text-foreground">
                    {format(new Date(viewTarget.sentAt), "MMMM dd, yyyy HH:mm")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground mb-1 block font-medium">Message:</span>
                  <p className="text-foreground bg-muted/50 rounded-md p-3">
                    {viewTarget.message || "—"}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation - admin/adviser only */}
        {canManage && (
          <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete Notification"
            message="Are you sure you want to delete this notification? This action cannot be undone."
            confirmText="Delete"
            loading={deleting}
          />
        )}
      </div>
    </>
  );
}

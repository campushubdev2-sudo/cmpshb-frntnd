import { useState, useMemo } from "react";
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

// --- Mock Data ---

interface MockEvent {
  _id: string;
  title: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  venue: string;
  organizedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface MockUser {
  _id: string;
  username: string;
  role: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

interface MockNotification {
  _id: string;
  eventId: string | MockEvent;
  recipientId: string | MockUser;
  message: string;
  status: "sent" | "failed" | "read";
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

const mockEvents: MockEvent[] = [
  {
    _id: "69c0728bb53b486ee677318d",
    title: "Annual Tech Summit 2026",
    allDay: true,
    startDate: "2026-03-23T00:00:00.000Z",
    endDate: "2026-03-25T00:00:00.000Z",
    venue: "Main Conference Hall",
    organizedBy: "admin",
    createdAt: "2026-03-22T22:51:55.310Z",
    updatedAt: "2026-03-22T22:51:55.310Z",
  },
  {
    _id: "69c0728bb53b486ee677318e",
    title: "Student Leadership Workshop",
    allDay: false,
    startDate: "2026-04-01T09:00:00.000Z",
    endDate: "2026-04-01T17:00:00.000Z",
    venue: "Room 301, Academic Building",
    organizedBy: "adviser",
    createdAt: "2026-03-20T10:30:00.000Z",
    updatedAt: "2026-03-20T10:30:00.000Z",
  },
  {
    _id: "69c0728bb53b486ee677318f",
    title: "Campus Career Fair",
    allDay: true,
    startDate: "2026-04-15T00:00:00.000Z",
    endDate: "2026-04-15T00:00:00.000Z",
    venue: "Student Center Plaza",
    organizedBy: "admin",
    createdAt: "2026-03-18T14:20:00.000Z",
    updatedAt: "2026-03-18T14:20:00.000Z",
  },
  {
    _id: "69c0728bb53b486ee6773190",
    title: "Research Symposium",
    allDay: false,
    startDate: "2026-05-10T08:00:00.000Z",
    endDate: "2026-05-10T18:00:00.000Z",
    venue: "Science Building Auditorium",
    organizedBy: "admin",
    createdAt: "2026-03-15T09:00:00.000Z",
    updatedAt: "2026-03-15T09:00:00.000Z",
  },
];

const mockUsers: MockUser[] = [
  {
    _id: "69be9188c8cbba2826335ced",
    username: "maria",
    role: "admin",
    email: "maria@gmail.com",
    phoneNumber: "+639052902433",
    createdAt: "2026-03-21T12:39:36.819Z",
    updatedAt: "2026-03-21T12:39:36.819Z",
  },
  {
    _id: "69be9188c8cbba2826335cee",
    username: "john_doe",
    role: "student",
    email: "john.doe@university.edu",
    phoneNumber: "+639123456789",
    createdAt: "2026-03-20T08:15:00.000Z",
    updatedAt: "2026-03-20T08:15:00.000Z",
  },
  {
    _id: "69be9188c8cbba2826335cef",
    username: "jane_smith",
    role: "faculty",
    email: "jane.smith@university.edu",
    phoneNumber: "+639987654321",
    createdAt: "2026-03-19T14:30:00.000Z",
    updatedAt: "2026-03-19T14:30:00.000Z",
  },
  {
    _id: "69be9188c8cbba2826335cf0",
    username: "alex_wong",
    role: "student",
    email: "alex.wong@university.edu",
    phoneNumber: "+639112233445",
    createdAt: "2026-03-18T11:00:00.000Z",
    updatedAt: "2026-03-18T11:00:00.000Z",
  },
  {
    _id: "69be9188c8cbba2826335cf1",
    username: "sarah_connor",
    role: "adviser",
    email: "sarah.connor@university.edu",
    phoneNumber: "+639556677889",
    createdAt: "2026-03-17T16:45:00.000Z",
    updatedAt: "2026-03-17T16:45:00.000Z",
  },
  {
    _id: "69be9188c8cbba2826335cf2",
    username: "mike_ross",
    role: "student",
    email: "mike.ross@university.edu",
    phoneNumber: "+639443322110",
    createdAt: "2026-03-16T09:20:00.000Z",
    updatedAt: "2026-03-16T09:20:00.000Z",
  },
  {
    _id: "69be9188c8cbba2826335cf3",
    username: "emily_chen",
    role: "faculty",
    email: "emily.chen@university.edu",
    phoneNumber: "+639887766554",
    createdAt: "2026-03-15T13:10:00.000Z",
    updatedAt: "2026-03-15T13:10:00.000Z",
  },
];

const generateMockNotifications = (): MockNotification[] => {
  const now = new Date();
  return [
    {
      _id: "69c2d99b6ea4ec8cd5e1046a",
      eventId: mockEvents[0],
      recipientId: mockUsers[0],
      message: "You are invited to attend this event. We look forward to your participation!",
      status: "sent",
      sentAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      _id: "69c2d99b6ea4ec8cd5e1046b",
      eventId: mockEvents[0],
      recipientId: mockUsers[1],
      message: "You are invited to attend this event. We look forward to your participation!",
      status: "read",
      sentAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 82800000).toISOString(),
    },
    {
      _id: "69c2d99b6ea4ec8cd5e1046c",
      eventId: mockEvents[1],
      recipientId: mockUsers[2],
      message:
        "This is a friendly reminder about an upcoming event. Please make sure to attend on time.",
      status: "sent",
      sentAt: new Date(now.getTime() - 172800000).toISOString(),
      createdAt: new Date(now.getTime() - 172800000).toISOString(),
      updatedAt: new Date(now.getTime() - 172800000).toISOString(),
    },
    {
      _id: "69c2d99b6ea4ec8cd5e1046d",
      eventId: mockEvents[2],
      recipientId: mockUsers[3],
      message:
        "There has been an important update regarding this event. Please check the event details for more information.",
      status: "failed",
      sentAt: new Date(now.getTime() - 259200000).toISOString(),
      createdAt: new Date(now.getTime() - 259200000).toISOString(),
      updatedAt: new Date(now.getTime() - 259200000).toISOString(),
    },
    {
      _id: "69c2d99b6ea4ec8cd5e1046e",
      eventId: mockEvents[3],
      recipientId: mockUsers[4],
      message: "You are invited to attend this event. We look forward to your participation!",
      status: "sent",
      sentAt: new Date(now.getTime() - 345600000).toISOString(),
      createdAt: new Date(now.getTime() - 345600000).toISOString(),
      updatedAt: new Date(now.getTime() - 345600000).toISOString(),
    },
    {
      _id: "69c2d99b6ea4ec8cd5e1046f",
      eventId: mockEvents[1],
      recipientId: mockUsers[5],
      message:
        "This is a friendly reminder about an upcoming event. Please make sure to attend on time.",
      status: "read",
      sentAt: new Date(now.getTime() - 432000000).toISOString(),
      createdAt: new Date(now.getTime() - 432000000).toISOString(),
      updatedAt: new Date(now.getTime() - 428400000).toISOString(),
    },
    {
      _id: "69c2d99b6ea4ec8cd5e10470",
      eventId: mockEvents[2],
      recipientId: mockUsers[6],
      message: "You are invited to attend this event. We look forward to your participation!",
      status: "sent",
      sentAt: new Date(now.getTime() - 518400000).toISOString(),
      createdAt: new Date(now.getTime() - 518400000).toISOString(),
      updatedAt: new Date(now.getTime() - 518400000).toISOString(),
    },
  ];
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

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
> = {
  sent: "default",
  read: "secondary",
  failed: "destructive",
};

export default function NotificationsPage() {
  const { authenticatedUser } = useAuthentication();
  const canManage = authenticatedUser?.role === "admin" || authenticatedUser?.role === "adviser";

  const [notifications, setNotifications] = useState<MockNotification[]>(() =>
    generateMockNotifications(),
  );
  const [eventOptions, setEventOptions] = useState<SelectOption[]>([]);
  const [allUsers, setAllUsers] = useState<MockUser[]>(mockUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MockNotification | null>(null);
  const [viewTarget, setViewTarget] = useState<MockNotification | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state (managed manually for multi-select support)
  const [formEventId, setFormEventId] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Initialize event options on mount
  useState(() => {
    setEventOptions(
      mockEvents.map((e) => ({
        value: e._id,
        label: e.title,
      })),
    );
  });

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers;
    const q = userSearch.toLowerCase();
    return allUsers.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

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

  const getEventById = (id: string): MockEvent | undefined => {
    return mockEvents.find((e) => e._id === id);
  };

  const getUserById = (id: string): MockUser | undefined => {
    return allUsers.find((u) => u._id === id);
  };

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

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const now = new Date().toISOString();
      const newNotifications: MockNotification[] = selectedUserIds.map((recipientId, index) => ({
        _id: `mock-${Date.now()}-${index}`,
        eventId: formEventId,
        recipientId,
        message: formMessage.trim(),
        status: "sent",
        sentAt: now,
        createdAt: now,
        updatedAt: now,
      }));

      setNotifications((prev) => [...newNotifications, ...prev]);

      toast.success(
        `Notification sent to ${selectedUserIds.length} recipient${selectedUserIds.length > 1 ? "s" : ""}`,
      );
      closeModal();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send notification";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (deleteTarget) {
        setNotifications((prev) => prev.filter((n) => n._id !== deleteTarget._id));
      }

      toast.success("Notification deleted successfully");
      setDeleteTarget(null);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete notification";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<MockNotification>[] = [
    {
      header: "Event",
      accessorKey: "eventId",
      cell: (row: MockNotification) => {
        const event = typeof row.eventId === "string" ? getEventById(row.eventId) : row.eventId;
        return event?.title || "—";
      },
    },
    {
      header: "Recipient",
      accessorKey: "recipientId",
      cell: (row: MockNotification) => {
        const user =
          typeof row.recipientId === "string" ? getUserById(row.recipientId) : row.recipientId;
        return user?.username || "—";
      },
    },
    {
      header: "Message",
      accessorKey: "message",
      cell: (row: MockNotification) =>
        row.message
          ? row.message.length > 50
            ? `${row.message.substring(0, 50)}...`
            : row.message
          : "—",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: MockNotification) => (
        <Badge variant={statusBadgeVariant[row.status] || "default"}>{row.status}</Badge>
      ),
    },
    {
      header: "Sent At",
      accessorKey: "sentAt",
      cell: (row: MockNotification) => format(new Date(row.sentAt), "MMM dd, yyyy HH:mm"),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: MockNotification) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewTarget(row)}>
            <Eye className="mr-1 h-4 w-4" />
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
              <Plus className="mr-2 h-4 w-4" />
              Send Notification
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
                        const u = getUserById(uid);
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
                  <Button type="submit" loading={submitting} className="gap-1.5">
                    <Send className="h-4 w-4" />
                    Send to {selectedUserIds.length || 0} user
                    {selectedUserIds.length !== 1 ? "s" : ""}
                  </Button>
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
                  <span className="text-foreground">
                    {typeof viewTarget.eventId === "string"
                      ? getEventById(viewTarget.eventId)?.title || "—"
                      : viewTarget.eventId?.title || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Recipient:</span>{" "}
                  <span className="text-foreground">
                    {typeof viewTarget.recipientId === "string"
                      ? getUserById(viewTarget.recipientId)?.username || "—"
                      : viewTarget.recipientId?.username || "—"}
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

import { useState, useEffect } from "react";
import { Trash2, Eye, User, Trash } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import DataTable from "../../components/shared/DataTable";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import type { ColumnDef, CellContext } from "@tanstack/react-table";

interface UserInfo {
  _id: string;
  username: string;
  role: string;
  email: string;
}

interface AuditLog {
  _id: string;
  userId: string | UserInfo;
  action: string;
  createdAt: string;
  updatedAt: string;
}

const mockLogs: AuditLog[] = [
  {
    _id: "69c311edd1f76e8cb0873f15",
    userId: {
      _id: "699d91d92b2b363622f359d6",
      username: "admin",
      role: "admin",
      email: "admin@example.com",
    },
    action: "Sign In",
    createdAt: "2026-03-24T22:36:29.118Z",
    updatedAt: "2026-03-24T22:36:29.118Z",
  },
  {
    _id: "69c2de456ea4ec8cd5e1048c",
    userId: {
      _id: "69bab6977197c4451af99063",
      username: "admin",
      role: "student",
      email: "admin@example.com",
    },
    action: "View User Details",
    createdAt: "2026-03-24T18:56:05.730Z",
    updatedAt: "2026-03-24T18:56:05.730Z",
  },
  {
    _id: "69c31200d1f76e8cb0873f16",
    userId: {
      _id: "69be9188c8cbba2826335ced",
      username: "maria",
      role: "admin",
      email: "maria@gmail.com",
    },
    action: "Create Report",
    createdAt: "2026-03-24T20:15:00.000Z",
    updatedAt: "2026-03-24T20:15:00.000Z",
  },
  {
    _id: "69c31210d1f76e8cb0873f17",
    userId: {
      _id: "699d91d92b2b363622f359d6",
      username: "admin",
      role: "admin",
      email: "admin@example.com",
    },
    action: "Update Event",
    createdAt: "2026-03-24T19:30:00.000Z",
    updatedAt: "2026-03-24T19:30:00.000Z",
  },
  {
    _id: "69c31220d1f76e8cb0873f18",
    userId: {
      _id: "69be9188c8cbba2826335ced",
      username: "maria",
      role: "admin",
      email: "maria@gmail.com",
    },
    action: "Delete Notification",
    createdAt: "2026-03-24T17:45:00.000Z",
    updatedAt: "2026-03-24T17:45:00.000Z",
  },
  {
    _id: "69c31230d1f76e8cb0873f19",
    userId: {
      _id: "699d91d92b2b363622f359d6",
      username: "admin",
      role: "admin",
      email: "admin@example.com",
    },
    action: "Export Data",
    createdAt: "2026-03-24T16:00:00.000Z",
    updatedAt: "2026-03-24T16:00:00.000Z",
  },
  {
    _id: "69c31240d1f76e8cb0873f20",
    userId: {
      _id: "69be9188c8cbba2826335ced",
      username: "maria",
      role: "admin",
      email: "maria@gmail.com",
    },
    action: "User Login",
    createdAt: "2026-03-24T14:30:00.000Z",
    updatedAt: "2026-03-24T14:30:00.000Z",
  },
  {
    _id: "69c31250d1f76e8cb0873f21",
    userId: {
      _id: "699d91d92b2b363622f359d6",
      username: "admin",
      role: "admin",
      email: "admin@example.com",
    },
    action: "Settings Updated",
    createdAt: "2026-03-24T12:00:00.000Z",
    updatedAt: "2026-03-24T12:00:00.000Z",
  },
];

const actionBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Sign In": "default",
  "User Login": "default",
  "Sign Out": "outline",
  "Create Report": "secondary",
  "Update Report": "secondary",
  "Delete Report": "destructive",
  "Update Event": "secondary",
  "Create Event": "secondary",
  "Delete Event": "destructive",
  "View User Details": "outline",
  "Delete Notification": "destructive",
  "Export Data": "secondary",
  "Settings Updated": "outline",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuditLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setLogs(mockLogs);
    } catch (error) {
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      if (deleteTarget) {
        setLogs((prev) => prev.filter((log) => log._id !== deleteTarget._id));
      }
      toast.success("Log deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Failed to delete log");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      setLogs((prev) => prev.filter((log) => !selectedIds.includes(log._id)));
      toast.success(`${selectedIds.length} logs deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (error) {
      toast.error("Failed to delete selected logs");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleteAllLoading(true);
      setLogs([]);
      toast.success("All logs deleted successfully");
      setSelectedIds([]);
      setDeleteAllOpen(false);
    } catch (error) {
      toast.error("Failed to delete all logs");
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map((log) => log._id));
    }
  };

  const getUserInfo = (userId: string | UserInfo): UserInfo | null => {
    if (typeof userId === "string") {
      return null;
    }
    return userId;
  };

  const columns = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={selectedIds.length === logs.length && logs.length > 0}
          onChange={toggleSelectAll}
          className="h-4 w-4"
        />
      ),
      cell: (row: AuditLog) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row._id)}
          onChange={() => toggleSelect(row._id)}
          className="h-4 w-4"
        />
      ),
    },
    {
      header: "Action",
      accessorKey: "action",
      cell: (row: AuditLog) => {
        const action = row.action;
        const variant = actionBadgeVariant[action] || "outline";
        return <Badge variant={variant}>{action}</Badge>;
      },
    },
    {
      header: "User",
      accessorKey: "userId",
      cell: (row: AuditLog) => {
        const userInfo = getUserInfo(row.userId);
        if (!userInfo) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <button
            onClick={() => setSelectedLog(row)}
            className="flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <User className="h-4 w-4" />
            {userInfo.username}
          </button>
        );
      },
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: (row: AuditLog) => {
        const userInfo = getUserInfo(row.userId);
        if (!userInfo) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <Badge variant="secondary">{userInfo.role}</Badge>;
      },
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (row: AuditLog) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy HH:mm:ss") : "—",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: AuditLog) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedLog(row)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ] as ColumnDef<AuditLog, unknown>[];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <title>CampusHub | System Logs</title>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">View and manage system audit logs</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setDeleteAllOpen(true)}
            disabled={logs.length === 0 || deleteAllLoading}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </div>

        <DataTable columns={columns} data={logs} searchPlaceholder="Search logs..." />

        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Log Details</DialogTitle>
                  <DialogDescription>
                    View detailed information about this log entry
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Separator />
            {selectedLog && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Action</p>
                    <p className="text-foreground font-medium">{selectedLog.action}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {typeof selectedLog.userId !== "string" && selectedLog.userId ? (
                        <span className="text-foreground">{selectedLog.userId.username}</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                  {typeof selectedLog.userId !== "string" && selectedLog.userId && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">User ID</p>
                        <p className="text-foreground font-mono text-sm">
                          {selectedLog.userId._id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-foreground">{selectedLog.userId.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Role</p>
                        <Badge variant="secondary">{selectedLog.userId.role}</Badge>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                    <p className="text-foreground">
                      {selectedLog.createdAt
                        ? format(new Date(selectedLog.createdAt), "MMMM dd, yyyy HH:mm:ss")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-foreground">
                      {selectedLog.updatedAt
                        ? format(new Date(selectedLog.updatedAt), "MMMM dd, yyyy HH:mm:ss")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Log"
          message="Are you sure you want to delete this log?"
          confirmText="Delete"
          loading={deleting}
        />

        <ConfirmDialog
          isOpen={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={handleBulkDelete}
          title="Bulk Delete"
          message={`Are you sure you want to delete ${selectedIds.length} logs?`}
          confirmText="Delete"
          loading={bulkDeleting}
        />

        <ConfirmDialog
          isOpen={deleteAllOpen}
          onClose={() => setDeleteAllOpen(false)}
          onConfirm={handleDeleteAll}
          title="Delete All Logs"
          message="Are you sure you want to delete all logs? This action cannot be undone."
          confirmText="Delete All"
          loading={deleteAllLoading}
        />
      </div>
    </>
  );
}

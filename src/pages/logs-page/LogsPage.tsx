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
import type { ColumnDef } from "@tanstack/react-table";
import { auditLogsAPI, type AuditLog as BackendAuditLog, type UserInfo } from "../../api/audit-logs-api";
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent } from "../../components/ui/card";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AuditLog extends BackendAuditLog {}

// ─────────────────────────────────────────────────────────────────────────────
// UI Configuration
// ─────────────────────────────────────────────────────────────────────────────
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
  "View Profile": "default",
  "Sign Up": "default",
  "Reset Password": "secondary",
  Logout: "outline",
  "Create User": "secondary",
  "View Users": "outline",
  "Update User": "secondary",
  "Delete User": "destructive",
  "Register Organization": "secondary",
  "Create Organization": "secondary",
  "View Organizations": "outline",
  "Update Organization": "secondary",
  "Delete Organization": "destructive",
  "View Events": "outline",
  "View Event Details": "outline",
  "Create Notification": "secondary",
  "View Notifications": "outline",
  "View Notification Details": "outline",
  "Update Notification": "secondary",
  "Download Reports": "secondary",
  "Update Report Status": "secondary",
  "View Report Details": "outline",
  "View Reports": "outline",
  "Create Calendar Entry": "secondary",
  "View Calendar Entries": "outline",
  "Update Calendar Entry": "secondary",
  "Delete Calendar Entry": "destructive",
  "View Calendar Entry Details": "outline",
  "Create Officer": "secondary",
  "View Officers": "outline",
  "View Officer Details": "outline",
  "Update Officer": "secondary",
  "Delete Officer": "destructive",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Normalize backend audit log
// ─────────────────────────────────────────────────────────────────────────────
const normalizeAuditLog = (log: BackendAuditLog): AuditLog => {
  return {
    ...log,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Audit Logs from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogsAPI.getAll({ sort: "-createdAt", limit: 100 });
      const apiResponse = response.data;

      if (apiResponse.success && Array.isArray(apiResponse.data)) {
        const normalized = apiResponse.data.map(normalizeAuditLog);
        setLogs(normalized);
      } else {
        setLogs([]);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to fetch audit logs";
      toast.error(message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Delete Single Log
  // ───────────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      if (deleteTarget) {
        const response = await auditLogsAPI.delete(deleteTarget._id);
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Log deleted successfully");
          setDeleteTarget(null);
          fetchLogs();
        } else {
          toast.error(apiResponse.message || "Failed to delete log");
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to delete log";
      toast.error(message);
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Bulk Delete (not implemented in API, client-side only for now)
  // ───────────────────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      // Delete each log individually since API doesn't support bulk delete
      const deletePromises = selectedIds.map((id) => auditLogsAPI.delete(id));
      await Promise.all(deletePromises);

      toast.success(`${selectedIds.length} logs deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchLogs();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to delete selected logs";
      toast.error(message);
      console.error(error);
    } finally {
      setBulkDeleting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Delete All Logs (Cleanup)
  // ───────────────────────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    try {
      setDeleteAllLoading(true);
      const response = await auditLogsAPI.cleanup();
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success(`All logs deleted successfully (${apiResponse.data.deletedCount} records)`);
        setSelectedIds([]);
        setDeleteAllOpen(false);
        fetchLogs();
      } else {
        toast.error(apiResponse.message || "Failed to delete all logs");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to delete all logs";
      toast.error(message);
      console.error(error);
    } finally {
      setDeleteAllLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Selection Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length && logs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map((log) => log._id));
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Helper Functions
  // ───────────────────────────────────────────────────────────────────────────
  const getUserInfo = (userId: string | UserInfo): UserInfo | null => {
    if (typeof userId === "string") {
      return null;
    }
    return userId ?? null;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Table Columns
  // ───────────────────────────────────────────────────────────────────────────
  const columns: ColumnDef<AuditLog>[] = [
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
      accessorKey: "action",
      header: "Action",
      cell: (row: AuditLog) => {
        const action = row.action;
        const variant = actionBadgeVariant[action] || "outline";
        return <Badge variant={variant}>{action}</Badge>;
      },
    },
    {
      accessorKey: "userId",
      header: "User",
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
      accessorKey: "role",
      header: "Role",
      cell: (row: AuditLog) => {
        const userInfo = getUserInfo(row.userId);
        if (!userInfo) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <Badge variant="secondary">{userInfo.role}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: (row: AuditLog) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy HH:mm:ss") : "—",
    },
    {
      id: "actions",
      header: "Actions",
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
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-9 w-64" />
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-36" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded" />
                    <Skeleton className="h-9 w-9 rounded" />
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
      <title>CampusHub | Audit Logs</title>
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
            <Trash className="h-4 w-4 mr-2 inline-flex" />
            Delete All
          </Button>
        </div>

        <DataTable columns={columns} data={logs} searchPlaceholder="Search logs..." />

        {/* View Log Details Dialog */}
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

        {/* Delete Single Log Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Log"
          message="Are you sure you want to delete this log?"
          confirmText="Delete"
          loading={deleting}
        />

        {/* Bulk Delete Confirmation */}
        <ConfirmDialog
          isOpen={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={handleBulkDelete}
          title="Bulk Delete"
          message={`Are you sure you want to delete ${selectedIds.length} logs?`}
          confirmText="Delete"
          loading={bulkDeleting}
        />

        {/* Delete All Confirmation */}
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

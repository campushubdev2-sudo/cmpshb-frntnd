import { useState, useEffect } from "react";
import { Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import Modal from "../../components/ui/Modal";
import DataTable from "../../components/shared/DataTable";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { logsAPI, type AuditLog } from "../../api/logs-api";
import type { ColumnDef, CellContext } from "@tanstack/react-table";

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
      const response = await logsAPI.getAll({ limit: 100 });
      setLogs(response.data || []);
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
        await logsAPI.delete(deleteTarget._id);
      }
      toast.success("Log deleted successfully");
      setDeleteTarget(null);
      fetchLogs();
    } catch (error) {
      toast.error("Failed to delete log");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      await Promise.all(selectedIds.map((id) => logsAPI.delete(id)));
      toast.success(`${selectedIds.length} logs deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchLogs();
    } catch (error) {
      toast.error("Failed to delete selected logs");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleteAllLoading(true);
      await logsAPI.cleanup();
      toast.success("All logs deleted successfully");
      setSelectedIds([]);
      setDeleteAllOpen(false);
      fetchLogs();
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

  const columns = [
    {
      header: () => (
        <input
          type="checkbox"
          checked={selectedIds.length === logs.length && logs.length > 0}
          onChange={toggleSelectAll}
          className="h-4 w-4"
        />
      ),
      accessorKey: "select",
      cell: ({ row }: CellContext<AuditLog, unknown>) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original._id)}
          onChange={() => toggleSelect(row.original._id)}
          className="h-4 w-4"
        />
      ),
    },
    {
      header: "Action",
      accessorKey: "action",
      cell: ({ row }: CellContext<AuditLog, unknown>) => row.original.action,
    },
    {
      header: "User",
      accessorKey: "userId",
      cell: ({ row }: CellContext<AuditLog, unknown>) => row.original.userId || "—",
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: ({ row }: CellContext<AuditLog, unknown>) =>
        row.original.createdAt ? format(new Date(row.original.createdAt), "MMM dd, yyyy") : "—",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: CellContext<AuditLog, unknown>) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedLog(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row.original)}>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">View and manage system audit logs</p>
      </div>

      <DataTable columns={columns} data={logs} searchPlaceholder="Search logs..." />

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Log Details"
      >
        {selectedLog && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Action</p>
              <p className="text-muted-foreground">{selectedLog.action}</p>
            </div>
            <div>
              <p className="text-sm font-medium">User ID</p>
              <p className="text-muted-foreground">{selectedLog.userId || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Timestamp</p>
              <p className="text-muted-foreground">
                {selectedLog.createdAt
                  ? format(new Date(selectedLog.createdAt), "MMMM dd, yyyy HH:mm:ss")
                  : "N/A"}
              </p>
            </div>
          </div>
        )}
      </Modal>

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
  );
}

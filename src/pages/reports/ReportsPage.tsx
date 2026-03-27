import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Eye, Upload, X, Pencil, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, type SelectOption } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/shared/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useAuthentication } from "@/contexts/AuthContext";
import { Link } from "react-router";
import { reportsAPI, type Report as BackendReport } from "@/api/reports-api";
import { orgsAPI, type Org } from "@/api/orgs-api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ReportStatus = "pending" | "approved" | "rejected";

interface Report {
  _id: string;
  orgId: { _id: string; orgName: string } | string;
  submittedBy: { _id: string; username: string; role: string; email?: string } | string;
  reportType: string;
  filePaths: string[];
  status: ReportStatus;
  submittedDate: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Configuration
// ─────────────────────────────────────────────────────────────────────────────
const statusBadgeVariant: Record<ReportStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const statusFilterOptions: SelectOption[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const typeFilterOptions: SelectOption[] = [
  { value: "", label: "All Types" },
  { value: "actionPlan", label: "Action Plan" },
  { value: "bylaws", label: "Bylaws" },
  { value: "financial", label: "Financial" },
  { value: "proposal", label: "Proposal" },
];

const reportTypeOptions: SelectOption[] = [
  { value: "actionPlan", label: "Action Plan" },
  { value: "bylaws", label: "Bylaws" },
  { value: "financial", label: "Financial" },
  { value: "proposal", label: "Proposal" },
];

const statusOptions: SelectOption[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Form Validation Schema
// ─────────────────────────────────────────────────────────────────────────────
const reportSchema = z.object({
  orgId: z.string().min(1, "Organization is required"),
  reportType: z.string().min(1, "Report type is required"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Normalize backend report to UI format
// ─────────────────────────────────────────────────────────────────────────────
const normalizeReport = (report: BackendReport): Report => {
  return {
    _id: report._id,
    orgId: report.orgId || "",
    submittedBy: report.submittedBy || "",
    reportType: report.reportType || "",
    filePaths: Array.isArray(report.filePaths)
      ? report.filePaths.map((fp) => (typeof fp === "string" ? fp : fp.filename || fp.name || ""))
      : [],
    status: report.status,
    submittedDate: report.createdAt || report.updatedAt || new Date().toISOString(),
    createdAt: report.createdAt || new Date().toISOString(),
    updatedAt: report.updatedAt || new Date().toISOString(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { authenticatedUser } = useAuthentication();
  const canDelete = authenticatedUser?.role === "admin";
  const canEdit = authenticatedUser?.role === "admin";

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [orgs, setOrgs] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const isEditing = !!editingReport;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reportSchema),
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Reports from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.reportType = typeFilter;

      const response = await reportsAPI.getAll(params);
      const apiResponse = response.data;

      if (apiResponse.success && Array.isArray(apiResponse.data)) {
        const normalizedReports = apiResponse.data.map(normalizeReport);
        setReports(normalizedReports);
      } else {
        setReports([]);
      }
    } catch (error: unknown) {
      toast.error("Failed to fetch reports");
      console.error(error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Organizations from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchOrgs = async () => {
    try {
      const response = await orgsAPI.getAll();
      const apiResponse = response.data;

      if (apiResponse.success && Array.isArray(apiResponse.data)) {
        setOrgs(apiResponse.data.map((o: Org) => ({ value: o._id, label: o.orgName })));
      }
    } catch (error: unknown) {
      console.error("Failed to fetch organizations:", error);
      setOrgs([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchOrgs();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingReport(null);
    reset({ orgId: "", reportType: "" });
    setFiles([]);
    setModalOpen(true);
  };

  const openEditModal = (report: Report) => {
    setEditingReport(report);
    setEditStatus(report.status || "pending");
    setEditMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingReport(null);
    reset();
    setFiles([]);
    setEditStatus("");
    setEditMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Form Submissions
  // ───────────────────────────────────────────────────────────────────────────
  const onSubmit = async (data: { orgId: string; reportType: string }) => {
    if (!isEditing && files.length === 0) {
      toast.error("Please attach at least one file");
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("orgId", data.orgId);
      formData.append("reportType", data.reportType);
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await reportsAPI.create(formData);
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success("Report submitted successfully");
        closeModal();
        fetchReports();
      } else {
        toast.error(apiResponse.message || "Failed to submit report");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to submit report";
      toast.error(message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const onEditStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStatus) {
      toast.error("Please select a status");
      return;
    }
    try {
      setSubmitting(true);
      const payload = { status: editStatus, message: editMessage.trim() || undefined };

      if (editingReport) {
        const response = await reportsAPI.updateStatus(editingReport._id, payload);
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Report status updated successfully");
          closeModal();
          fetchReports();
        } else {
          toast.error(apiResponse.message || "Failed to update report status");
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to update report status";
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
        const response = await reportsAPI.delete(deleteTarget._id);
        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Report deleted successfully");
          setDeleteTarget(null);
          fetchReports();
        } else {
          toast.error(apiResponse.message || "Failed to delete report");
        }
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to delete report";
      toast.error(message);
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Table Columns
  // ───────────────────────────────────────────────────────────────────────────
  const columns: ColumnDef<Report>[] = [
    {
      header: "Organization",
      accessorKey: "orgId",
      cell: (row) => {
        const orgId = row.orgId as any;
        return typeof orgId === "object" ? orgId.orgName : "—";
      },
    },
    {
      header: "Type",
      accessorKey: "reportType",
      cell: (row) => (
        <Badge variant="secondary" className="capitalize">
          {row.reportType === "actionPlan" ? "Action Plan" : row.reportType}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <Badge variant={statusBadgeVariant[row.status as ReportStatus] || "default"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Submitted By",
      accessorKey: "submittedBy",
      cell: (row) => {
        const submittedBy = row.submittedBy as any;
        return typeof submittedBy === "object" ? submittedBy.username : "—";
      },
    },
    {
      header: "Date",
      accessorKey: "submittedDate",
      cell: (row) =>
        row.submittedDate ? format(new Date(row.submittedDate), "MMM dd, yyyy") : "—",
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/reports/${row._id}`)}>
            <div className="flex items-center justify-center">
              <Eye className="mr-1 h-4 w-4" />
              View
            </div>
          </Button>
          {canEdit && (
            <Button variant="outline" onClick={() => openEditModal(row)}>
              <div className="flex items-center justify-center">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </div>
            </Button>
          )}
          {canDelete && (
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
      <title>CampusHub | Reports</title>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Manage organization reports and submissions
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <div className="flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </div>
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
            >
              {statusFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
            >
              {typeFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable columns={columns} data={reports} searchPlaceholder="Search reports..." />

        {/* Create Report Modal */}
        <Modal isOpen={modalOpen && !isEditing} onClose={closeModal} title="Submit New Report">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgId">Organization</Label>
              <Select
                id="orgId"
                options={orgs}
                placeholder="Select an organization"
                {...register("orgId")}
              />
              {errors.orgId && (
                <p className="text-destructive mt-1 text-sm">{errors.orgId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                id="reportType"
                options={reportTypeOptions}
                placeholder="Select report type"
                {...register("reportType")}
              />
              {errors.reportType && (
                <p className="text-destructive mt-1 text-sm">{errors.reportType.message}</p>
              )}
            </div>

            <div>
              <Label className="mb-1.5 block">Attachments</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-border hover:border-primary/50 cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-colors"
              >
                <Upload className="text-muted-foreground/50 mx-auto mb-2 h-7 w-7" />
                <p className="text-muted-foreground text-sm">Click to upload files</p>
                <p className="text-muted-foreground/70 mt-1 text-xs">
                  PDF, DOC, DOCX, XLS, XLSX (Max 5 files, 10MB each)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
              />
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive/80 ml-2 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Submit Report
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Status Modal */}
        <Modal isOpen={modalOpen && isEditing} onClose={closeModal} title="Update Report Status">
          <form onSubmit={onEditStatusSubmit} className="space-y-4">
            <div className="text-muted-foreground border-border space-y-1 border-b pb-2 text-sm">
              <p>
                <span className="text-foreground font-medium">Organization:</span>{" "}
                {editingReport?.orgId && typeof editingReport.orgId === "object"
                  ? editingReport.orgId.orgName
                  : "—"}
              </p>
              <p>
                <span className="text-foreground font-medium">Type:</span>{" "}
                {editingReport?.reportType === "actionPlan"
                  ? "Action Plan"
                  : editingReport?.reportType || "—"}
              </p>
              <p>
                <span className="text-foreground font-medium">Submitted By:</span>{" "}
                {editingReport?.submittedBy && typeof editingReport.submittedBy === "object"
                  ? editingReport.submittedBy.username
                  : "—"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                options={statusOptions}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Message (optional)</Label>
              <Textarea
                placeholder="Add a note for the submitter..."
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Update Status
              </Button>
            </div>
          </form>
        </Modal>

        {canDelete && (
          <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete Report"
            message="Are you sure you want to delete this report? This action cannot be undone."
            confirmText="Delete"
            loading={deleting}
          />
        )}
      </div>
    </>
  );
}

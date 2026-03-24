import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Download, CheckCircle, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useAuthentication } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching backend response shapes)
// ─────────────────────────────────────────────────────────────────────────────
type ReportStatus = "pending" | "approved" | "rejected";

interface Report {
  _id: string;
  orgId: { _id: string; orgName: string } | string;
  submittedBy: { _id: string; username: string; role: string; email: string } | string;
  reportType: string;
  filePaths: string[];
  status: ReportStatus;
  submittedDate: string;
  createdAt: string;
  updatedAt: string;
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
// Mock Data - Pre-populated Reports (same as ReportsPage.tsx)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  {
    _id: "69c2cf55d1f76e8cb0873e57",
    orgId: { _id: "69c2cf29d1f76e8cb0873e51", orgName: "Executive Vice President" },
    submittedBy: { _id: "699d91d92b2b363622f359d6", username: "admin", role: "admin", email: "admin@example.com" },
    reportType: "bylaws",
    filePaths: ["uploads/reports/bylaws/report-1774374741366-736122495.docx"],
    status: "approved",
    submittedDate: "2026-03-24T17:52:21.378Z",
    createdAt: "2026-03-24T17:52:21.379Z",
    updatedAt: "2026-03-24T17:55:24.879Z",
  },
  {
    _id: "69c2cf55d1f76e8cb0873e58",
    orgId: { _id: "69c2cf29d1f76e8cb0873e52", orgName: "Computer Science Society" },
    submittedBy: { _id: "699d91d92b2b363622f359d7", username: "cs_officer", role: "officer", email: "cs@example.com" },
    reportType: "actionPlan",
    filePaths: ["uploads/reports/actionplan/report-1774374741366-736122496.pdf"],
    status: "pending",
    submittedDate: "2026-03-23T10:00:00.000Z",
    createdAt: "2026-03-23T10:00:00.001Z",
    updatedAt: "2026-03-23T10:00:00.001Z",
  },
  {
    _id: "69c2cf55d1f76e8cb0873e59",
    orgId: { _id: "69c2cf29d1f76e8cb0873e53", orgName: "Business Club" },
    submittedBy: { _id: "699d91d92b2b363622f359d8", username: "biz_pres", role: "officer", email: "biz@example.com" },
    reportType: "financial",
    filePaths: ["uploads/reports/financial/report-1774374741366-736122497.xlsx"],
    status: "rejected",
    submittedDate: "2026-03-22T14:30:00.000Z",
    createdAt: "2026-03-22T14:30:00.001Z",
    updatedAt: "2026-03-23T09:00:00.000Z",
  },
  {
    _id: "69c2cf55d1f76e8cb0873e60",
    orgId: { _id: "69c2cf29d1f76e8cb0873e54", orgName: "Engineering Society" },
    submittedBy: { _id: "699d91d92b2b363622f359d9", username: "eng_chair", role: "officer", email: "eng@example.com" },
    reportType: "proposal",
    filePaths: ["uploads/reports/proposal/report-1774374741366-736122498.pdf"],
    status: "pending",
    submittedDate: "2026-03-24T08:00:00.000Z",
    createdAt: "2026-03-24T08:00:00.001Z",
    updatedAt: "2026-03-24T08:00:00.001Z",
  },
  {
    _id: "69c2cf55d1f76e8cb0873e61",
    orgId: { _id: "69c2cf29d1f76e8cb0873e55", orgName: "Math Club" },
    submittedBy: { _id: "699d91d92b2b363622f359da", username: "math_lead", role: "officer", email: "math@example.com" },
    reportType: "bylaws",
    filePaths: ["uploads/reports/bylaws/report-1774374741366-736122499.docx"],
    status: "approved",
    submittedDate: "2026-03-20T11:00:00.000Z",
    createdAt: "2026-03-20T11:00:00.001Z",
    updatedAt: "2026-03-21T10:00:00.000Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock API Functions
// ─────────────────────────────────────────────────────────────────────────────
const mockAPI = {
  getById(id: string): Promise<SuccessResponse<Report> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const report = MOCK_REPORTS.find((r) => r._id === id);
        if (report) {
          resolve({
            success: true,
            message: "Report fetched successfully",
            data: { ...report },
          });
        } else {
          resolve({
            success: false,
            status: "fail",
            message: "Report not found",
          });
        }
      }, 200);
    });
  },

  updateStatus(id: string, data: { status: string; message?: string }): Promise<SuccessResponse<Report> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = MOCK_REPORTS.findIndex((r) => r._id === id);
        if (index === -1) {
          resolve({
            success: false,
            status: "fail",
            message: "Report not found",
          });
          return;
        }
        const updated = {
          ...MOCK_REPORTS[index],
          status: data.status as ReportStatus,
          updatedAt: new Date().toISOString(),
        };
        MOCK_REPORTS[index] = updated;
        resolve({
          success: true,
          message: "Report status updated successfully",
          data: { ...updated },
        });
      }, 200);
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// UI Configuration
// ─────────────────────────────────────────────────────────────────────────────
const statusBadgeVariant: Record<ReportStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticatedUser } = useAuthentication();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isAdmin = authenticatedUser?.role === "admin";

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        if (!id) {
          toast.error("Invalid report ID");
          return;
        }
        const response = await mockAPI.getById(id);
        if (response.success && "data" in response) {
          setReport(response.data);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch report details");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Simulate download delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Download started (mock - no actual file)");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download files");
    } finally {
      setDownloading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setUpdating(true);
      if (!id) return;
      const response = await mockAPI.updateStatus(id, { status });
      if (response.success) {
        setReport((prev) => (prev ? { ...prev, status: status as ReportStatus } : null));
        toast.success(`Report ${status} successfully`);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${status} report`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    );
  }

  const orgName = typeof report.orgId === "object" ? report.orgId.orgName : "—";
  const submittedByUsername = typeof report.submittedBy === "object" ? report.submittedBy.username : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">Report Details</h1>
          <p className="text-muted-foreground mt-1">View and manage report submission</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">Organization</h3>
            <p className="text-foreground text-lg font-semibold">{orgName}</p>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">Status</h3>
            <div className="mt-1">
              <Badge variant={statusBadgeVariant[report.status] || "default"}>
                {report.status}
              </Badge>
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">Report Type</h3>
            <p className="text-foreground text-lg font-semibold capitalize">
              {report.reportType === "actionPlan" ? "Action Plan" : report.reportType || "—"}
            </p>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">Submitted By</h3>
            <p className="text-foreground text-lg font-semibold">{submittedByUsername}</p>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">Submitted On</h3>
            <p className="text-foreground text-lg font-semibold">
              {report.submittedDate ? format(new Date(report.submittedDate), "MMMM dd, yyyy") : "—"}
            </p>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">Last Updated</h3>
            <p className="text-foreground text-lg font-semibold">
              {report.updatedAt ? format(new Date(report.updatedAt), "MMMM dd, yyyy") : "—"}
            </p>
          </div>
        </div>

        {report.description && (
          <div className="border-border mt-6 pt-6 border-t">
            <h3 className="text-muted-foreground mb-2 text-sm font-medium">Description</h3>
            <p className="text-foreground">{report.description}</p>
          </div>
        )}

        {report.filePaths && report.filePaths.length > 0 && (
          <div className="border-border mt-6 pt-6 border-t">
            <h3 className="text-muted-foreground mb-4 text-sm font-medium">
              Attached Files ({report.filePaths.length})
            </h3>
            <Button
              variant="outline"
              onClick={handleDownload}
              loading={downloading}
              disabled={downloading}
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Download {report.filePaths.length > 1 ? "All (ZIP)" : "File"}
            </Button>
            <div className="mt-4 space-y-2">
              {report.filePaths.map((file, index) => {
                const fileName = file.split("/").pop() || `File ${index + 1}`;
                return (
                  <div
                    key={index}
                    className="bg-muted flex items-center justify-between rounded-md px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <span className="text-foreground">{fileName}</span>
                    </div>
                    <Download className="text-muted-foreground h-4 w-4" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAdmin && report.status === "pending" && (
          <div className="border-border mt-6 flex gap-3 pt-6 border-t">
            <Button
              onClick={() => handleStatusUpdate("approved")}
              loading={updating}
              disabled={updating}
              className="flex-1 md:flex-none"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate("rejected")}
              loading={updating}
              disabled={updating}
              className="flex-1 md:flex-none"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Download, CheckCircle, XCircle, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useAuthentication } from "@/contexts/AuthContext";
import { reportsAPI, type Report as BackendReport } from "@/api/reports-api";

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
// Helper: Get file extension from path
// ─────────────────────────────────────────────────────────────────────────────
const getFileExtension = (filePath: string): string => {
  const parts = filePath.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Check if file is viewable in browser
// ─────────────────────────────────────────────────────────────────────────────
const isViewableFile = (filePath: string): boolean => {
  const ext = getFileExtension(filePath);
  return ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get file icon based on extension
// ─────────────────────────────────────────────────────────────────────────────
const getFileIcon = (filePath: string): string => {
  const ext = getFileExtension(filePath);
  if (["pdf"].includes(ext)) return "PDF";
  if (["doc", "docx"].includes(ext)) return "DOC";
  if (["xls", "xlsx"].includes(ext)) return "XLS";
  if (["ppt", "pptx"].includes(ext)) return "PPT";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "IMG";
  return "FILE";
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Build file URL from file path
// ─────────────────────────────────────────────────────────────────────────────
const buildFileUrl = (filePath: string): string => {
  // API base URL is for API endpoints like /api/v1/reports
  // Static files (uploads) are served at the root level, not under /api/v1
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  
  // Get the server root URL by removing /api/v1 or /api from the base URL
  // e.g., "http://localhost:5000/api" -> "http://localhost:5000"
  // e.g., "http://localhost:5000/api/v1" -> "http://localhost:5000"
  // e.g., "https://cmpshb-bcknd.onrender.com/api/v1" -> "https://cmpshb-bcknd.onrender.com"
  const serverRoot = apiBaseURL.replace(/\/api(\/v1)?$/i, "");
  
  // Remove leading slashes from file path to avoid double slashes
  const cleanPath = filePath.replace(/^\/+/, "");
  
  return `${serverRoot}/${cleanPath}`;
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
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [iframeError, setIframeError] = useState(false);

  const isAdmin = authenticatedUser?.role === "admin";

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Report from Backend
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        if (!id) {
          toast.error("Invalid report ID");
          return;
        }
        const response = await reportsAPI.getById(id);
        const apiResponse = response.data;

        if (apiResponse.success) {
          const normalized = normalizeReport(apiResponse.data);
          setReport(normalized);
        } else {
          toast.error(apiResponse.message || "Failed to fetch report");
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || "Failed to fetch report details";
        toast.error(message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  // ───────────────────────────────────────────────────────────────────────────
  // Download Handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!id || !report) return;

    try {
      setDownloading(true);
      const response = await reportsAPI.download(id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${report.reportType}-report`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to download files";
      toast.error(message);
      console.error(error);
    } finally {
      setDownloading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Status Update Handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (status: ReportStatus) => {
    if (!id || !report) return;

    try {
      setUpdating(true);
      const response = await reportsAPI.updateStatus(id, { status });
      const apiResponse = response.data;

      if (apiResponse.success) {
        setReport((prev) => (prev ? { ...prev, status } : null));
        toast.success(`Report ${status} successfully`);
      } else {
        toast.error(apiResponse.message || `Failed to ${status} report`);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || `Failed to ${status} report`;
      toast.error(message);
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

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

  if (!report) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Report not found</p>
      </div>
    );
  }

  const orgName = typeof report.orgId === "object" ? report.orgId.orgName : "—";
  const submittedByUsername = typeof report.submittedBy === "object" ? report.submittedBy.username : "—";
  const hasFiles = report.filePaths.length > 0;
  const selectedFile = report.filePaths[selectedFileIndex];

  return (
    <>
      <title>CampusHub | Report Details</title>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-foreground text-2xl font-bold">Report Details</h1>
            <p className="text-muted-foreground mt-1">View and manage report submission</p>
          </div>
        </div>

        {/* Report Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">Organization</h3>
                <p className="text-foreground text-base font-semibold">{orgName}</p>
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
                <p className="text-foreground text-base font-semibold capitalize">
                  {report.reportType === "actionPlan" ? "Action Plan" : report.reportType}
                </p>
              </div>

              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">Submitted By</h3>
                <p className="text-foreground text-base font-semibold">{submittedByUsername}</p>
              </div>

              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">Submitted On</h3>
                <p className="text-foreground text-base font-semibold">
                  {format(new Date(report.submittedDate), "MMMM dd, yyyy")}
                </p>
              </div>

              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">Last Updated</h3>
                <p className="text-foreground text-base font-semibold">
                  {format(new Date(report.updatedAt), "MMMM dd, yyyy")}
                </p>
              </div>
            </div>

            {/* Admin Actions */}
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
          </CardContent>
        </Card>

        {/* File Preview Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-muted-foreground text-sm font-medium">File Preview</h3>
                <p className="text-muted-foreground/70 mt-1 text-xs">
                  {hasFiles
                    ? `${report.filePaths.length} file(s) attached to this report`
                    : "No files attached"}
                </p>
              </div>
              {hasFiles && (
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  loading={downloading}
                  disabled={downloading}
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {report.filePaths.length > 1 ? "All (ZIP)" : "File"}
                </Button>
              )}
            </div>

            {/* Empty State - No Files */}
            {!hasFiles && (
              <div className="border-muted-foreground/20 flex flex-col items-center justify-center rounded-lg border bg-muted/30 py-16">
                <FileText className="text-muted-foreground/50 mb-4 h-12 w-12" />
                <p className="text-muted-foreground font-medium">No files attached</p>
                <p className="text-muted-foreground/70 mt-1 text-sm">
                  This report does not have any attached files.
                </p>
              </div>
            )}

            {/* File Preview with Tabs */}
            {hasFiles && (
              <div className="space-y-4">
                {/* File Selector Tabs */}
                {report.filePaths.length > 1 && (
                  <Tabs
                    defaultValue="0"
                    onValueChange={(value) => {
                      setSelectedFileIndex(parseInt(value, 10));
                      setIframeError(false);
                    }}
                    className="w-full"
                  >
                    <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b rounded-none h-auto p-0">
                      {report.filePaths.map((filePath, index) => {
                        const fileName = filePath.split("/").pop() || `File ${index + 1}`;
                        const fileIcon = getFileIcon(filePath);
                        const isViewable = isViewableFile(filePath);
                        return (
                          <TabsTrigger
                            key={index}
                            value={index.toString()}
                            className={cn(
                              "flex items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded text-xs font-medium",
                                isViewable
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {fileIcon}
                            </div>
                            <span className="max-w-[200px] truncate text-sm">{fileName}</span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>
                )}

                {/* Single file info when only one file */}
                {report.filePaths.length === 1 && (
                  <div className="bg-muted flex items-center gap-3 rounded-md px-4 py-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded text-sm font-medium",
                        isViewableFile(report.filePaths[0])
                          ? "bg-primary/10 text-primary"
                          : "bg-background text-muted-foreground border",
                      )}
                    >
                      {getFileIcon(report.filePaths[0])}
                    </div>
                    <span className="text-foreground font-medium">
                      {report.filePaths[0].split("/").pop()}
                    </span>
                  </div>
                )}

                {/* Iframe Preview */}
                {selectedFile && report._id && (
                  <FilePreviewSection
                    filePath={selectedFile}
                    index={selectedFileIndex}
                    onIframeError={setIframeError}
                    reportId={report._id}
                  />
                )}
              </div>
            )}

            {/* File List - Always show all files for reference */}
            {hasFiles && (
              <div className="border-border mt-6 pt-6 border-t">
                <h4 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
                  All Attached Files
                </h4>
                <div className="space-y-2">
                  {report.filePaths.map((file, index) => {
                    const fileName = file.split("/").pop() || `File ${index + 1}`;
                    const fileIcon = getFileIcon(file);
                    const isViewable = isViewableFile(file);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedFileIndex(index);
                          setIframeError(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-4 py-3 text-sm transition-colors",
                          index === selectedFileIndex
                            ? "bg-primary/5 border-primary"
                            : "bg-muted hover:bg-muted/80 border-transparent",
                          "border",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded text-sm font-medium",
                              isViewable
                                ? "bg-primary/10 text-primary"
                                : "bg-background text-muted-foreground border",
                            )}
                          >
                            {fileIcon}
                          </div>
                          <div className="text-left">
                            <p
                              className={cn(
                                "font-medium",
                                index === selectedFileIndex
                                  ? "text-primary"
                                  : "text-foreground",
                              )}
                            >
                              {fileName}
                            </p>
                            <p className="text-muted-foreground/70 text-xs">
                              {isViewable ? "Preview available" : "Download to view"}
                            </p>
                          </div>
                        </div>
                        {index === selectedFileIndex && (
                          <div className="flex items-center gap-2 text-primary">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-xs font-medium">Selected</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File Preview Section Component
// ─────────────────────────────────────────────────────────────────────────────
interface FilePreviewSectionProps {
  filePath: string;
  index: number;
  onIframeError: (error: boolean) => void;
  reportId?: string; // Added reportId to use download endpoint
}

function FilePreviewSection({ filePath, index, onIframeError, reportId }: FilePreviewSectionProps) {
  const ext = getFileExtension(filePath);
  const isViewable = isViewableFile(filePath);
  const fileName = filePath.split("/").pop() || "Unknown file";
  const [loadError, setLoadError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch file via download endpoint for viewable files
  useEffect(() => {
    if (!reportId || !isViewable || loadError) return;

    const fetchFile = async () => {
      setIsLoading(true);
      try {
        const response = await reportsAPI.download(reportId);
        const blob = new Blob([response.data], { type: response.headers["content-type"] });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoadError(false);
      } catch (error) {
        console.error("Failed to fetch file:", error);
        setLoadError(true);
        onIframeError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();

    // Cleanup blob URL on unmount or when reportId changes
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [reportId, isViewable, loadError, onIframeError]);

  // Handle iframe load error
  const handleIframeError = () => {
    setLoadError(true);
    onIframeError(true);
  };

  // Not a viewable file type
  if (!isViewable) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-lg border bg-muted/30">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-background">
          <span className="text-lg font-bold text-muted-foreground">{getFileIcon(filePath)}</span>
        </div>
        <p className="mt-4 font-medium text-muted-foreground">Preview not available</p>
        <p className="mt-1 max-w-md text-center text-sm text-muted-foreground/70">
          This file type cannot be previewed in the browser. Please download the file to view it.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/50">{fileName}</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-lg border bg-muted/30">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  // Error state for viewable files
  if (loadError || !blobUrl) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-lg border bg-muted/30">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">Failed to load preview</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Unable to display this file. Please download to view.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.open(buildFileUrl(filePath), "_blank")}
        >
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  }

  // PDF viewer
  if (ext === "pdf") {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border bg-muted/30">
          <iframe
            key={`${index}-${blobUrl}`}
            src={blobUrl}
            className="h-[600px] w-full"
            title={`PDF Preview: ${fileName}`}
            onError={handleIframeError}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground/70">
          Having trouble viewing?{" "}
          <a
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:no-underline"
          >
            Open PDF in new tab
          </a>
        </p>
      </div>
    );
  }

  // Image viewer
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
          <img
            key={`${index}-${blobUrl}`}
            src={blobUrl}
            alt={fileName}
            className="max-h-[600px] w-auto object-contain"
            onError={handleIframeError}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground/70">{fileName}</p>
      </div>
    );
  }

  // Fallback using object tag
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        <object
          key={`${index}-${blobUrl}`}
          data={blobUrl}
          type="application/octet-stream"
          className="h-[600px] w-full"
          title={`File Preview: ${fileName}`}
          onError={handleIframeError}
        >
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">Unable to preview this file</p>
            <p className="mt-1 text-sm text-muted-foreground/70">{fileName}</p>
          </div>
        </object>
      </div>
      <p className="text-center text-xs text-muted-foreground/70">
        If the preview doesn&apos;t load,{" "}
        <a
          href={blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline"
        >
          click here to open the file
        </a>
      </p>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { orgsAPI, type Org } from "@/api/orgs-api";
import { officersAPI, type Officer } from "@/api/officers-api";
import { reportsAPI, type Report } from "@/api/reports-api";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Org | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Organization Details
  // ───────────────────────────────────────────────────────────────────────────
  const fetchOrganization = async (orgId: string) => {
    try {
      const response = await orgsAPI.getById(orgId);

      const apiResponse = response.data;

      if (apiResponse.success) {
        setOrg(apiResponse.data);
      } else {
        toast.error(apiResponse.message || "Failed to fetch organization");
      }
    } catch (error) {
      toast.error("Failed to fetch organization");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Officers for Organization
  // ───────────────────────────────────────────────────────────────────────────
  const fetchOfficers = async (orgId: string) => {
    try {
      const response = await officersAPI.getAll({ orgId });

      const apiResponse = response.data;

      // Handle different response structures
      let officersData: Officer[] = [];

      if (apiResponse.success) {
        // Case 1: Direct array in data
        if (Array.isArray(apiResponse.data)) {
          officersData = apiResponse.data;
        }
        // Case 2: Paginated response with items array
        else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          officersData = apiResponse.data.items;
        }
        // Case 3: data is an object with items property
        else if (apiResponse.data?.items) {
          officersData = apiResponse.data.items;
        }

        setOfficers(officersData);
      } else {
        toast.error(apiResponse.message || "Failed to fetch officers");
      }
    } catch (error) {
      toast.error("Failed to fetch officers");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Reports for Organization
  // ───────────────────────────────────────────────────────────────────────────
  const fetchReports = async (orgId: string) => {
    try {
      const response = await reportsAPI.getAll({ orgId });

      const apiResponse = response.data;

      // Handle different response structures
      let reportsData: Report[] = [];

      if (apiResponse.success) {
        // Case 1: Direct array in data
        if (Array.isArray(apiResponse.data)) {
          reportsData = apiResponse.data;
        }
        // Case 2: Paginated response with items array
        else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          reportsData = apiResponse.data.items;
        }
        // Case 3: data is an object with items property
        else if (apiResponse.data?.items) {
          reportsData = apiResponse.data.items;
        }

        setReports(reportsData);
      } else {
        toast.error(apiResponse.message || "Failed to fetch reports");
      }
    } catch (error) {
      toast.error("Failed to fetch reports");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Load All Data
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) {
          toast.error("Invalid organization ID");
          return;
        }

        await Promise.all([
          fetchOrganization(id),
          fetchOfficers(id),
          fetchReports(id),
        ]);
      } catch (error) {
        toast.error("Failed to fetch organization details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-6">
          <Skeleton className="mb-4 h-6 w-48" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <Skeleton className="mb-4 h-6 w-24" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Not Found State
  // ───────────────────────────────────────────────────────────────────────────
  if (!org) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Helper: Get adviser name
  // ───────────────────────────────────────────────────────────────────────────
  const getAdviserName = () => {
    if (typeof org.adviser === "object" && org.adviser !== null) {
      return org.adviser.username || org.adviser.firstName || "N/A";
    }
    if (typeof org.adviser === "string") {
      return org.adviser;
    }
    return "N/A";
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/organizations")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-foreground text-2xl font-bold">{org.orgName}</h1>
          <p className="text-muted-foreground mt-1">Organization overview and statistics</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <CardWrapper
          icon={Users}
          label="Total Officers"
          value={officers.length}
          color="text-blue-600 bg-blue-50"
        />
        <CardWrapper
          icon={FileText}
          label="Total Reports"
          value={reports.length}
          color="text-emerald-600 bg-emerald-50"
        />
        <CardWrapper
          icon={Users}
          label="Adviser"
          value={getAdviserName()}
          color="text-violet-600 bg-violet-50"
        />
      </div>

      <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Organization Details</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-muted-foreground text-sm font-medium">Description</dt>
            <dd className="text-foreground mt-1">{org.description || "No description provided"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm font-medium">Created On</dt>
            <dd className="text-foreground mt-1">
              {org.createdAt ? format(new Date(org.createdAt), "MMMM dd, yyyy") : "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm font-medium">Last Updated</dt>
            <dd className="text-foreground mt-1">
              {org.updatedAt ? format(new Date(org.updatedAt), "MMMM dd, yyyy") : "N/A"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Officers</h2>
        {officers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No officers found</p>
        ) : (
          <div className="space-y-2">
            {officers.map((officer) => (
              <div
                key={officer._id}
                className="bg-muted flex items-center justify-between rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {officer.userId?.username ||
                      officer.userId?.firstName ||
                      officer.name ||
                      "Unknown"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {officer.position || "Officer"}
                  </p>
                </div>
                <div className="text-muted-foreground text-xs">
                  {officer.startTerm && officer.endTerm
                    ? `${format(new Date(officer.startTerm), "MMM yyyy")} - ${format(new Date(officer.endTerm), "MMM yyyy")}`
                    : "No term specified"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Recent Reports</h2>
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reports found</p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 5).map((report) => (
              <div
                key={report._id}
                className="bg-muted flex items-center justify-between rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium">{report.reportType || report.title || "Unknown"}</p>
                  <p className="text-muted-foreground text-sm">
                    {report.submittedBy?.username || "Unknown"}
                  </p>
                </div>
                <Badge
                  variant={
                    report.status === "approved"
                      ? "default"
                      : report.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {report.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardWrapper Component
// ─────────────────────────────────────────────────────────────────────────────
function CardWrapper({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="text-foreground text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

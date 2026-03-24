import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching backend response shapes)
// ─────────────────────────────────────────────────────────────────────────────
interface Organization {
  _id: string;
  orgName: string;
  description?: string;
  adviserId?: string;
  adviser?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Officer {
  _id: string;
  userId?: { username: string };
  position?: string;
  startTerm?: string;
  endTerm?: string;
  orgId?: string;
}

interface Report {
  _id: string;
  orgId?: { _id: string; orgName: string } | string;
  reportType?: string;
  status: "pending" | "approved" | "rejected";
  submittedBy?: { _id: string; username: string };
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  title?: string;
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
// Shared In-Memory Store (same as OrganizationsPage.tsx)
// ─────────────────────────────────────────────────────────────────────────────
const SHARED_ORGANIZATIONS: Organization[] = [
  {
    _id: "67d8f2a1c9e8b3a4d5e6f701",
    orgName: "Computer Science Society",
    description: "A community for CS students to collaborate and learn together.",
    adviserId: "67d8f2a1c9e8b3a4d5e6f7a8",
    adviser: "john_doe",
    createdAt: "2025-01-15T08:00:00.000Z",
    updatedAt: "2025-01-15T08:00:00.000Z",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f702",
    orgName: "Business Club",
    description: "Networking and professional development for business students.",
    adviserId: "67d8f2a1c9e8b3a4d5e6f7a9",
    adviser: "jane_smith",
    createdAt: "2025-01-20T10:30:00.000Z",
    updatedAt: "2025-02-01T14:00:00.000Z",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f703",
    orgName: "Engineering Society",
    description: "Promoting excellence in engineering education and practice.",
    adviserId: "67d8f2a1c9e8b3a4d5e6f7aa",
    adviser: "mike_adviser",
    createdAt: "2025-02-05T09:15:00.000Z",
    updatedAt: "2025-02-10T11:45:00.000Z",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f704",
    orgName: "Math Club",
    description: "Exploring the beauty of mathematics through problem-solving and competitions.",
    adviserId: "67d8f2a1c9e8b3a4d5e6f7ab",
    adviser: "sarah_connor",
    createdAt: "2025-02-12T13:00:00.000Z",
    updatedAt: "2025-02-12T13:00:00.000Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data - Pre-populated Officers (per organization)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_OFFICERS: Officer[] = [
  {
    _id: "67d8f2a1c9e8b3a4d5e6f801",
    userId: { username: "alice_president" },
    position: "President",
    startTerm: "2025-01-01T00:00:00.000Z",
    endTerm: "2025-12-31T23:59:59.000Z",
    orgId: "67d8f2a1c9e8b3a4d5e6f701",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f802",
    userId: { username: "bob_vp" },
    position: "Vice President",
    startTerm: "2025-01-01T00:00:00.000Z",
    endTerm: "2025-12-31T23:59:59.000Z",
    orgId: "67d8f2a1c9e8b3a4d5e6f701",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f803",
    userId: { username: "charlie_treasurer" },
    position: "Treasurer",
    startTerm: "2025-01-01T00:00:00.000Z",
    endTerm: "2025-12-31T23:59:59.000Z",
    orgId: "67d8f2a1c9e8b3a4d5e6f701",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f804",
    userId: { username: "diana_chair" },
    position: "Chairperson",
    startTerm: "2025-02-01T00:00:00.000Z",
    endTerm: "2026-01-31T23:59:59.000Z",
    orgId: "67d8f2a1c9e8b3a4d5e6f702",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f805",
    userId: { username: "eve_secretary" },
    position: "Secretary",
    startTerm: "2025-02-01T00:00:00.000Z",
    endTerm: "2026-01-31T23:59:59.000Z",
    orgId: "67d8f2a1c9e8b3a4d5e6f702",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f806",
    userId: { username: "frank_lead" },
    position: "Lead Engineer",
    startTerm: "2025-02-05T00:00:00.000Z",
    endTerm: "2026-02-04T23:59:59.000Z",
    orgId: "67d8f2a1c9e8b3a4d5e6f703",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data - Pre-populated Reports (per organization)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  {
    _id: "67d8f2a1c9e8b3a4d5e6f901",
    orgId: { _id: "67d8f2a1c9e8b3a4d5e6f701", orgName: "Computer Science Society" },
    reportType: "Monthly Activity Report",
    status: "approved",
    submittedBy: { _id: "67d8f2a1c9e8b3a4d5e6f801", username: "alice_president" },
    createdAt: "2025-02-01T10:00:00.000Z",
    description: "Summary of February activities and events",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f902",
    orgId: { _id: "67d8f2a1c9e8b3a4d5e6f701", orgName: "Computer Science Society" },
    reportType: "Event Report",
    status: "pending",
    submittedBy: { _id: "67d8f2a1c9e8b3a4d5e6f802", username: "bob_vp" },
    createdAt: "2025-02-15T14:30:00.000Z",
    description: "Code-a-thon event summary",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f903",
    orgId: { _id: "67d8f2a1c9e8b3a4d5e6f702", orgName: "Business Club" },
    reportType: "Financial Report",
    status: "approved",
    submittedBy: { _id: "67d8f2a1c9e8b3a4d5e6f804", username: "diana_chair" },
    createdAt: "2025-02-10T09:00:00.000Z",
    description: "Q1 financial summary",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f904",
    orgId: { _id: "67d8f2a1c9e8b3a4d5e6f702", orgName: "Business Club" },
    reportType: "Monthly Activity Report",
    status: "rejected",
    submittedBy: { _id: "67d8f2a1c9e8b3a4d5e6f805", username: "eve_secretary" },
    createdAt: "2025-02-20T11:00:00.000Z",
    description: "Networking event report - needs revision",
  },
  {
    _id: "67d8f2a1c9e8b3a4d5e6f905",
    orgId: { _id: "67d8f2a1c9e8b3a4d5e6f703", orgName: "Engineering Society" },
    reportType: "Project Report",
    status: "pending",
    submittedBy: { _id: "67d8f2a1c9e8b3a4d5e6f806", username: "frank_lead" },
    createdAt: "2025-02-18T16:00:00.000Z",
    description: "Bridge design competition results",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock API Functions
// ─────────────────────────────────────────────────────────────────────────────
const mockAPI = {
  getById(id: string): Promise<SuccessResponse<Organization> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const org = SHARED_ORGANIZATIONS.find((o) => o._id === id);
        if (org) {
          resolve({
            success: true,
            message: "Organization fetched successfully",
            data: { ...org },
          });
        } else {
          resolve({
            success: false,
            status: "fail",
            message: "Organization not found",
          });
        }
      }, 200);
    });
  },

  getOfficersByOrgId(orgId: string): Promise<Officer[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const officers = MOCK_OFFICERS.filter((o) => o.orgId === orgId);
        resolve(officers);
      }, 200);
    });
  },

  getReportsByOrgId(orgId: string): Promise<Report[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reports = MOCK_REPORTS.filter(
          (r) => r.orgId === orgId || (typeof r.orgId === "object" && r.orgId._id === orgId),
        );
        resolve(reports);
      }, 200);
    });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) {
          toast.error("Invalid organization ID");
          return;
        }

        const [orgRes, officersData, reportsData] = await Promise.all([
          mockAPI.getById(id),
          mockAPI.getOfficersByOrgId(id),
          mockAPI.getReportsByOrgId(id),
        ]);

        if (orgRes.success && "data" in orgRes) {
          setOrg(orgRes.data);
        } else {
          toast.error(orgRes.message);
        }

        setOfficers(officersData);
        setReports(reportsData);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch organization details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

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
          value={org.adviser || "N/A"}
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
                  <p className="font-medium">{officer.userId?.username || "Unknown"}</p>
                  <p className="text-muted-foreground text-sm">{officer.position || "Officer"}</p>
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
                  <p className="font-medium">{report.reportType || "Unknown"}</p>
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

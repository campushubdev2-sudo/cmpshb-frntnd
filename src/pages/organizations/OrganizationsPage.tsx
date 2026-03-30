import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import z from "zod";
import { format } from "date-fns";
import { Plus, Users, FileText } from "lucide-react";
import DataTable from "@/components/shared/DataTable";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal";
import { orgsAPI, type Org, type User } from "@/api/orgs-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { officersAPI, type Officer } from "@/api/officers-api";
import { reportsAPI, type Report } from "@/api/reports-api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Organization {
  _id: string;
  orgName: string;
  description?: string;
  adviserId?: string;
  adviser?: string | { _id: string; username?: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrgInput {
  orgName: string;
  description?: string;
  adviserId: string;
}

interface UpdateOrgInput {
  orgName?: string;
  description?: string;
  adviserId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Validation Schema
// ─────────────────────────────────────────────────────────────────────────────
const orgSchema = z.object({
  orgName: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  adviserId: z.string().min(1, "Adviser is required"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const OrganizationsPage = () => {
  const { authenticatedUser } = useAuthentication();
  const isOfficer = authenticatedUser?.role === "officer";
  const isAdviser = authenticatedUser?.role === "adviser";
  const isAdmin = authenticatedUser?.role === "admin";
  const canManage = isAdmin;

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [advisers, setAdvisers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Adviser's/Officer's organization detail state
  const [myOrg, setMyOrg] = useState<Organization | null>(null);
  const [myOrgOfficers, setMyOrgOfficers] = useState<Officer[]>([]);
  const [myOrgReports, setMyOrgReports] = useState<Report[]>([]);
  const [myOrgLoading, setMyOrgLoading] = useState(false);

  const isEditing = !!editingOrg;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orgSchema),
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Organizations from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const response = await orgsAPI.getAll();

      // Backend returns wrapped format: { success, message, data }
      const apiResponse = response.data;

      // Handle different response structures
      let organizationsData: Organization[] = [];

      if (apiResponse.success) {
        // Case 1: Direct array in data
        if (Array.isArray(apiResponse.data)) {
          organizationsData = apiResponse.data;
        }
        // Case 2: Paginated response with items array
        else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          organizationsData = apiResponse.data.items;
        }
        // Case 3: data is an object with items property
        else if (apiResponse.data?.items) {
          organizationsData = apiResponse.data.items;
        }

        setOrgs(organizationsData);
      } else {
        toast.error(apiResponse.message || "Unexpected response from server");
      }
    } catch (error) {
      toast.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Adviser's Organization (for adviser/officer role)
  // ───────────────────────────────────────────────────────────────────────────
  const fetchMyOrganization = async () => {
    try {
      setMyOrgLoading(true);
      const response = await orgsAPI.getMyOrg();
      const apiResponse = response.data;

      if (apiResponse.success && apiResponse.data) {
        setMyOrg(apiResponse.data);

        // Fetch officers and reports for this organization
        const orgId = apiResponse.data._id;
        const [officersRes, reportsRes] = await Promise.all([
          officersAPI.getAll({ orgId }).catch(() => ({ data: { success: false } })),
          reportsAPI.getAll({ orgId }).catch(() => ({ data: { success: false } })),
        ]);

        if (officersRes.data?.success && Array.isArray(officersRes.data.data)) {
          setMyOrgOfficers(officersRes.data.data);
        } else {
          setMyOrgOfficers([]);
        }
        if (reportsRes.data?.success && Array.isArray(reportsRes.data.data)) {
          setMyOrgReports(reportsRes.data.data);
        } else {
          setMyOrgReports([]);
        }
      } else {
        setMyOrg(null);
        setMyOrgOfficers([]);
        setMyOrgReports([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch my organization:", error);
      
      // Handle 400/404 errors gracefully
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      
      if (status === 400 || status === 404) {
        toast.error(message || "No organization assigned to your account");
      } else {
        toast.error("Failed to fetch organization");
      }
      
      setMyOrg(null);
      setMyOrgOfficers([]);
      setMyOrgReports([]);
    } finally {
      setMyOrgLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Advisers from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchAdvisers = async () => {
    try {
      const response = await orgsAPI.getAdvisers();

      // Backend returns wrapped format: { success, message, data }
      const apiResponse = response.data;

      // Handle different response structures
      let adviserUsers: User[] = [];

      if (apiResponse.success) {
        // Case 1: Direct array in data
        if (Array.isArray(apiResponse.data)) {
          adviserUsers = apiResponse.data;
        }
        // Case 2: Paginated response with items array
        else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          adviserUsers = apiResponse.data.items;
        }
        // Case 3: data is an object with items property
        else if (apiResponse.data?.items) {
          adviserUsers = apiResponse.data.items;
        }

        const formattedAdvisers = adviserUsers.map((user: User) => ({
          value: user._id,
          label: user.username,
        }));
        setAdvisers(formattedAdvisers);
      } else {
        toast.error(apiResponse.message || "Failed to load advisers");
      }
    } catch (error) {
      toast.error("Failed to fetch advisers");
    }
  };

  useEffect(() => {
    if (isAdviser || isOfficer) {
      fetchMyOrganization();
    } else {
      fetchOrgs();
    }
    fetchAdvisers();
  }, [isAdviser, isOfficer]);

  // ───────────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingOrg(null);
    reset({ orgName: "", description: "", adviserId: "" });
    setModalOpen(true);
  };

  const openEditModal = (org: Organization) => {
    // Extract adviser ID - handle both string and object cases
    let adviserIdValue = "";

    // Priority 1: Use adviserId if available
    if (org.adviserId) {
      adviserIdValue = org.adviserId;
    }
    // Priority 2: If adviser is an object, use its _id
    else if (typeof org.adviser === "object" && org.adviser !== null) {
      adviserIdValue = org.adviser._id;
    }
    // Priority 3: If adviser is a username string, find the corresponding _id from advisers list
    else if (typeof org.adviser === "string") {
      const matchedAdviser = advisers.find((a) => a.label === org.adviser);
      if (matchedAdviser) {
        adviserIdValue = matchedAdviser.value;
      }
    }

    setEditingOrg(org);
    reset({
      orgName: org.orgName,
      description: org.description || "",
      adviserId: adviserIdValue,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOrg(null);
    reset();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Helper: Get adviser name
  // ───────────────────────────────────────────────────────────────────────────
  const getAdviserName = () => {
    if (!myOrg) return "N/A";
    if (typeof myOrg.adviser === "object" && myOrg.adviser !== null) {
      return myOrg.adviser.username || myOrg.adviser.firstName || "N/A";
    }
    if (typeof myOrg.adviser === "string") {
      return myOrg.adviser;
    }
    return "N/A";
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Submit Handler (Create/Update)
  // ───────────────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CreateOrgInput) => {
    try {
      setSubmitting(true);
      let response;

      if (isEditing && editingOrg) {
        response = await orgsAPI.update(editingOrg._id, data);

        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Organization updated successfully");
        } else {
          toast.error(apiResponse.message);
          return;
        }
      } else {
        response = await orgsAPI.create(data);

        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Organization created successfully");
        } else {
          toast.error(apiResponse.message);
          return;
        }
      }

      closeModal();
      fetchOrgs();
    } catch (error) {
      toast.error(isEditing ? "Failed to update organization" : "Failed to create organization");
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
        const response = await orgsAPI.delete(deleteTarget._id);

        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success("Organization deleted successfully");
        } else {
          toast.error(apiResponse.message);
          return;
        }
      }
      setDeleteTarget(null);
      fetchOrgs();
    } catch (error) {
      toast.error("Failed to delete organization");
    } finally {
      setDeleting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Table Columns
  // ───────────────────────────────────────────────────────────────────────────
  const columns = [
    {
      header: "Name",
      accessorKey: "orgName",
      cell: (row: Organization) => (
        <Link to={`/organizations/${row._id}`} className="text-primary hover:underline font-medium">
          {row.orgName}
        </Link>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (row: Organization) =>
        row.description
          ? row.description.length > 60
            ? `${row.description.substring(0, 60)}...`
            : row.description
          : "—",
    },
    {
      header: "Adviser",
      accessorKey: "adviser",
      cell: (row: Organization) => row.adviser || "—",
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: (row: Organization) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy") : "—",
    },
    ...(canManage
      ? [
          {
            header: "Actions",
            accessorKey: "actions",
            cell: (row: Organization) => (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(row)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(row)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (myOrgLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          {canManage && <Skeleton className="h-10 w-40" />}
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
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-28" />
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
  // Adviser/Officer View - Organization Detail
  // ───────────────────────────────────────────────────────────────────────────
  if (isAdviser || isOfficer) {
    if (!myOrg) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-lg">No organization assigned</p>
            <p className="text-muted-foreground text-sm mt-2">
              {isOfficer 
                ? "You are not registered as an officer. Please contact your organization adviser or administrator."
                : "You are not assigned as an adviser. Please contact your administrator."}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              {myOrg?.orgName || "My Organization"}
            </h1>
            <p className="text-muted-foreground mt-1">Organization overview and statistics</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="text-blue-600 bg-blue-50 flex h-11 w-11 items-center justify-center rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Officers</p>
                <p className="text-foreground text-xl font-bold">{myOrgOfficers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="text-emerald-600 bg-emerald-50 flex h-11 w-11 items-center justify-center rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Reports</p>
                <p className="text-foreground text-xl font-bold">{myOrgReports.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="text-violet-600 bg-violet-50 flex h-11 w-11 items-center justify-center rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Adviser</p>
                <p className="text-foreground text-xl font-bold">{getAdviserName()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Organization Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-muted-foreground text-sm font-medium">Description</dt>
              <dd className="text-foreground mt-1">
                {myOrg?.description || "No description provided"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">Created On</dt>
              <dd className="text-foreground mt-1">
                {myOrg?.createdAt ? format(new Date(myOrg.createdAt), "MMMM dd, yyyy") : "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">Last Updated</dt>
              <dd className="text-foreground mt-1">
                {myOrg?.updatedAt ? format(new Date(myOrg.updatedAt), "MMMM dd, yyyy") : "N/A"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Officers</h2>
          {myOrgOfficers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No officers found</p>
          ) : (
            <div className="space-y-2">
              {myOrgOfficers.map((officer) => (
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
          {myOrgReports.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reports found</p>
          ) : (
            <div className="space-y-2">
              {myOrgReports.slice(0, 5).map((report) => (
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            {canManage ? "Manage student organizations" : "Your organization"}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreateModal}>
            <div className="flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </div>
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={orgs} searchPlaceholder="Search organizations..." />

      {canManage && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={isEditing ? "Edit Organization" : "Add Organization"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Name</Label>
              <Input id="orgName" placeholder="Organization name" {...register("orgName")} />
              {errors.orgName && (
                <p className="text-sm text-destructive mt-1">{errors.orgName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description (optional)"
                {...register("description")}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adviserId">Adviser</Label>
              <Select
                id="adviserId"
                options={advisers}
                placeholder="Select an adviser"
                {...register("adviserId")}
              />
              {errors.adviserId && (
                <p className="text-sm text-destructive mt-1">{errors.adviserId.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <Modal isOpen={true} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
          <div className="space-y-4">
            <p>
              Are you sure you want to delete <strong>{deleteTarget.orgName}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} loading={deleting}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrganizationsPage;

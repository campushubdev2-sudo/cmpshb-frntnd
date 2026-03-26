import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import z from "zod";
import { format } from "date-fns";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Plus } from "lucide-react";
import DataTable from "@/components/shared/DataTable";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal";
import { orgsAPI, type Org, type User } from "@/api/orgs-api";

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
  const canManage = authenticatedUser?.role === "admin";

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [advisers, setAdvisers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    fetchOrgs();
    fetchAdvisers();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
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

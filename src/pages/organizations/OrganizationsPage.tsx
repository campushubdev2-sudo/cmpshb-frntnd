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

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching backend response shapes)
// ─────────────────────────────────────────────────────────────────────────────
interface User {
  username: string;
  password: string;
  role: "admin" | "adviser" | "officer" | "student";
  email: string;
  phoneNumber?: string | null | undefined;
  passwordResetToken?: string | null | undefined;
  passwordResetExpires?: Date | null | undefined;
}

interface Organization {
  _id: string;
  orgName: string;
  description?: string;
  adviserId?: string;
  adviser?: string | null;
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
// Mock Data - Pre-populated Users (advisers)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_USERS: User[] = [
  {
    username: "john_doe",
    password: "hashed_password_123",
    role: "adviser",
    email: "john.doe@university.edu",
    phoneNumber: "+1-555-0101",
  },
  {
    username: "jane_smith",
    password: "hashed_password_456",
    role: "adviser",
    email: "jane.smith@university.edu",
    phoneNumber: "+1-555-0102",
  },
  {
    username: "mike_adviser",
    password: "hashed_password_789",
    role: "adviser",
    email: "mike.adviser@university.edu",
    phoneNumber: null,
  },
  {
    username: "sarah_connor",
    password: "hashed_password_abc",
    role: "adviser",
    email: "sarah.connor@university.edu",
    phoneNumber: "+1-555-0104",
  },
  {
    username: "admin_user",
    password: "hashed_password_admin",
    role: "admin",
    email: "admin@university.edu",
  },
  {
    username: "officer_user",
    password: "hashed_password_officer",
    role: "officer",
    email: "officer@university.edu",
  },
  {
    username: "student_user",
    password: "hashed_password_student",
    role: "student",
    email: "student@university.edu",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data - Pre-populated Organizations
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_ORGANIZATIONS: Organization[] = [
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
// In-Memory Store (simulates database)
// ─────────────────────────────────────────────────────────────────────────────
let organizations: Organization[] = [...INITIAL_ORGANIZATIONS];

// ─────────────────────────────────────────────────────────────────────────────
// Mock API Functions (returning backend-compatible responses)
// ─────────────────────────────────────────────────────────────────────────────
const mockAPI = {
  getAll(): Promise<SuccessResponse<Organization[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Organizations fetched successfully",
          data: [...organizations],
        });
      }, 300);
    });
  },

  getById(id: string): Promise<SuccessResponse<Organization> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const org = organizations.find((o) => o._id === id);
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

  create(input: CreateOrgInput): Promise<SuccessResponse<Organization> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validate adviser exists
        const adviser = MOCK_USERS.find(
          (u) => u.username === input.adviserId || u.username === input.adviserId,
        );
        if (!adviser) {
          resolve({
            success: false,
            status: "fail",
            message: "Adviser not found",
          });
          return;
        }

        // Validate orgName is unique
        const existing = organizations.find((o) => o.orgName.toLowerCase() === input.orgName.toLowerCase());
        if (existing) {
          resolve({
            success: false,
            status: "fail",
            message: "Organization with this name already exists",
          });
          return;
        }

        const now = new Date().toISOString();
        const newOrg: Organization = {
          _id: `67d8f2a1c9e8b3a4d5e6f${Math.floor(Math.random() * 10000).toString().padStart(3, "0")}`,
          orgName: input.orgName,
          description: input.description,
          adviserId: input.adviserId,
          adviser: input.adviserId,
          createdAt: now,
          updatedAt: now,
        };
        organizations.push(newOrg);
        resolve({
          success: true,
          message: "Organization created successfully",
          data: { ...newOrg },
        });
      }, 300);
    });
  },

  update(id: string, input: UpdateOrgInput): Promise<SuccessResponse<Organization> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const orgIndex = organizations.findIndex((o) => o._id === id);
        if (orgIndex === -1) {
          resolve({
            success: false,
            status: "fail",
            message: "Organization not found",
          });
          return;
        }

        // Validate adviser if provided
        if (input.adviserId) {
          const adviser = MOCK_USERS.find((u) => u.username === input.adviserId);
          if (!adviser) {
            resolve({
              success: false,
              status: "fail",
              message: "Adviser not found",
            });
            return;
          }
        }

        const updatedOrg: Organization = {
          ...organizations[orgIndex],
          ...input,
          adviser: input.adviserId ?? organizations[orgIndex].adviser,
          updatedAt: new Date().toISOString(),
        };
        organizations[orgIndex] = updatedOrg;
        resolve({
          success: true,
          message: "Organization updated successfully",
          data: { ...updatedOrg },
        });
      }, 300);
    });
  },

  delete(id: string): Promise<SuccessResponse<null> | FailResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const orgIndex = organizations.findIndex((o) => o._id === id);
        if (orgIndex === -1) {
          resolve({
            success: false,
            status: "fail",
            message: "Organization not found",
          });
          return;
        }
        organizations.splice(orgIndex, 1);
        resolve({
          success: true,
          message: "Organization deleted successfully",
          data: null,
        });
      }, 300);
    });
  },
};

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
  const [advisers, setAdvisers] = useState<{ id: string; label: string }[]>([]);
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

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const response = await mockAPI.getAll();
      setOrgs(response.data);
    } catch (error) {
      toast.error("Failed to fetch organizations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisers = async () => {
    // Filter only users with adviser role
    const adviserUsers = MOCK_USERS.filter((u) => u.role === "adviser");
    setAdvisers(
      adviserUsers.map((user) => ({
        id: user.username,
        label: user.username,
      })),
    );
  };

  useEffect(() => {
    fetchOrgs();
    fetchAdvisers();
  }, []);

  const openCreateModal = () => {
    setEditingOrg(null);
    reset({ orgName: "", description: "", adviserId: "" });
    setModalOpen(true);
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    reset({
      orgName: org.orgName,
      description: org.description || "",
      adviserId: org.adviser || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOrg(null);
    reset();
  };

  const onSubmit = async (data: CreateOrgInput) => {
    try {
      setSubmitting(true);
      let response;
      if (isEditing && editingOrg) {
        response = await mockAPI.update(editingOrg._id, data);
        if (response.success) {
          toast.success("Organization updated successfully");
        } else {
          toast.error(response.message);
          return;
        }
      } else {
        response = await mockAPI.create(data);
        if (response.success) {
          toast.success("Organization created successfully");
        } else {
          toast.error(response.message);
          return;
        }
      }
      closeModal();
      fetchOrgs();
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? "Failed to update organization" : "Failed to create organization");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      if (deleteTarget) {
        const response = await mockAPI.delete(deleteTarget._id);
        if (response.success) {
          toast.success("Organization deleted successfully");
        } else {
          toast.error(response.message);
          return;
        }
      }
      setDeleteTarget(null);
      fetchOrgs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete organization");
    } finally {
      setDeleting(false);
    }
  };

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
      cell: (row: Organization) => (row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy") : "—"),
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
              Are you sure you want to delete <strong>{deleteTarget.orgName}</strong>? This action cannot be undone.
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

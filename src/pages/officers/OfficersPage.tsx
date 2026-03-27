import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { format } from "date-fns";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Plus } from "lucide-react";
import DataTable from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { officersAPI, type Officer } from "@/api/officers-api";
import { orgsAPI, type Org } from "@/api/orgs-api";
import { usersAPI, type User } from "@/api/users-api";
import { ROLES } from "@/config/constants/roles";
import apiClient from "@/api/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface OfficerPosition {
  positionValue: string;
  positionLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────
const createOfficerSchema = z.object({
  userId: z.string().min(1, "User is required"),
  orgId: z.string().min(1, "Organization is required"),
  position: z.string().min(1, "Position is required"),
  startTerm: z.string().min(1, "Term start is required"),
  endTerm: z.string().min(1, "Term end is required"),
});

const editOfficerSchema = z.object({
  position: z.string().min(1, "Position is required"),
  startTerm: z.string().min(1, "Term start is required"),
  endTerm: z.string().min(1, "Term end is required"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type CreateOfficerFormData = z.infer<typeof createOfficerSchema>;
type EditOfficerFormData = z.infer<typeof editOfficerSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const OfficersPage = () => {
  const { authenticatedUser } = useAuthentication();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [allOrgs, setAllOrgs] = useState<Org[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [positionOptions, setPositionOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Officer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!editingOfficer;
  const isAdmin = authenticatedUser?.role === ROLES.ADMIN;
  const isAdviser = authenticatedUser?.role === ROLES.ADVISER;
  const isOfficer = authenticatedUser?.role === ROLES.OFFICER;
  const canManage = isAdmin || isAdviser;

  // ───────────────────────────────────────────────────────────────────────────
  // RBAC: Derive user's org IDs for filtering
  // ───────────────────────────────────────────────────────────────────────────
  const userOrgIds = useMemo(() => {
    if (isAdmin) return null;

    if (isAdviser) {
      return allOrgs
        .filter((o) => {
          const adviserId = typeof o.adviser === "string" ? o.adviser : o.adviser?._id;
          return adviserId === authenticatedUser?._id;
        })
        .map((o) => o._id?.toString());
    }

    if (isOfficer) {
      const myOrgIds = officers
        .filter((off) => {
          const offUserId = typeof off.userId === "string" ? off.userId : off.userId?._id;
          return offUserId === authenticatedUser?._id;
        })
        .map((off) => {
          const orgId = typeof off.orgId === "string" ? off.orgId : off.orgId?._id;
          return orgId?.toString();
        });
      return [...new Set(myOrgIds)];
    }

    return [];
  }, [isAdmin, isAdviser, isOfficer, allOrgs, officers, authenticatedUser]);

  // ───────────────────────────────────────────────────────────────────────────
  // RBAC: Filter officers based on role
  // ───────────────────────────────────────────────────────────────────────────
  const filteredOfficers = useMemo(() => {
    if (isAdmin || !userOrgIds) return officers;
    return officers.filter((off) => {
      const orgId = (typeof off.orgId === "string" ? off.orgId : off.orgId?._id)?.toString();
      return userOrgIds.includes(orgId);
    });
  }, [officers, userOrgIds, isAdmin]);

  // ───────────────────────────────────────────────────────────────────────────
  // RBAC: Filter org options for dropdown
  // ───────────────────────────────────────────────────────────────────────────
  const orgOptions = useMemo(() => {
    const mapped = allOrgs.map((o) => ({
      value: o._id?.toString(),
      label: o.orgName,
    }));
    if (isAdmin || !userOrgIds) return mapped;
    return mapped.filter((o) => userOrgIds.includes(o.value));
  }, [allOrgs, userOrgIds, isAdmin]);

  const userOptions = useMemo(() => {
    return users.map((u) => ({
      value: u._id?.toString(),
      label: u.username,
    }));
  }, [users]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditing ? editOfficerSchema : createOfficerSchema),
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Officers from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const response = await officersAPI.getAll({ limit: 100 });
      const apiResponse = response.data;

      let officersData: Officer[] = [];

      if (apiResponse.success) {
        if (Array.isArray(apiResponse.data)) {
          officersData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          officersData = apiResponse.data.items;
        } else if (apiResponse.data?.items) {
          officersData = apiResponse.data.items;
        }

        setOfficers(officersData);
      } else {
        toast.error(apiResponse.message || "Failed to fetch officers");
      }
    } catch (error: any) {
      console.error("Error fetching officers:", error);
      toast.error("Failed to fetch officers");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Dropdown Data (Users, Organizations & Positions)
  // ───────────────────────────────────────────────────────────────────────────
  const fetchDropdownData = async () => {
    try {
      const [usersRes, orgsRes, positionsRes] = await Promise.all([
        usersAPI.getAll({ limit: 100 }),
        orgsAPI.getAll({ limit: 100 }),
        apiClient.get("/officers/meta/positions"),
      ]);

      const usersApiResponse = usersRes.data;
      const orgsApiResponse = orgsRes.data;
      const positionsApiResponse = positionsRes.data;

      // Handle users response (direct array in data)
      let usersData: User[] = [];
      if (usersApiResponse.success && Array.isArray(usersApiResponse.data)) {
        usersData = usersApiResponse.data;
      }

      // Handle orgs response (direct array in data)
      let orgsData: Org[] = [];
      if (orgsApiResponse.success && Array.isArray(orgsApiResponse.data)) {
        orgsData = orgsApiResponse.data;
      }

      // Handle positions response (direct array in data)
      let positionsData: OfficerPosition[] = [];
      if (positionsApiResponse.success && Array.isArray(positionsApiResponse.data)) {
        positionsData = positionsApiResponse.data;
      }

      setUsers(usersData);
      setAllOrgs(orgsData);
      setPositionOptions(
        positionsData.map((p) => ({
          value: p.positionValue,
          label: p.positionLabel,
        })),
      );
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
      toast.error("Failed to load users, organizations, or positions");
    }
  };

  useEffect(() => {
    fetchOfficers();
    fetchDropdownData();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    if (!canManage) {
      toast.error("You don't have permission to add officers");
      return;
    }
    setEditingOfficer(null);
    reset({
      userId: "",
      orgId: "",
      position: "",
      startTerm: "",
      endTerm: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (officer: Officer) => {
    if (!canManage) {
      toast.error("You don't have permission to edit officers");
      return;
    }
    setEditingOfficer(officer);
    reset({
      userId: !officer.userId
        ? ""
        : typeof officer.userId === "string"
          ? officer.userId
          : officer.userId?._id || "",
      orgId: !officer.orgId
        ? ""
        : typeof officer.orgId === "string"
          ? officer.orgId
          : officer.orgId?._id || "",
      position: officer.position || "",
      startTerm: officer.startTerm ? officer.startTerm.substring(0, 10) : "",
      endTerm: officer.endTerm ? officer.endTerm.substring(0, 10) : "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOfficer(null);
    reset();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // CRUD Operations
  // ───────────────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CreateOfficerFormData | EditOfficerFormData) => {
    if (!canManage) {
      toast.error("You don't have permission to manage officers");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && editingOfficer) {
        const editData = data as EditOfficerFormData;
        const response = await officersAPI.update(editingOfficer._id, {
          position: editData.position,
          startTerm: editData.startTerm,
          endTerm: editData.endTerm,
        });

        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success(apiResponse.message || "Officer updated successfully");
          fetchOfficers();
          closeModal();
        } else {
          toast.error(apiResponse.message || "Failed to update officer");
        }
      } else {
        const createData = data as CreateOfficerFormData;
        const response = await officersAPI.create(createData);

        const apiResponse = response.data;

        if (apiResponse.success) {
          toast.success(apiResponse.message || "Officer created successfully");
          fetchOfficers();
          closeModal();
        } else {
          toast.error(apiResponse.message || "Failed to create officer");
        }
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (isEditing ? "Failed to update officer" : "Failed to create officer");
      toast.error(message);
      console.error("Officer submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage || !deleteTarget) {
      toast.error("You don't have permission to delete officers");
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      const response = await officersAPI.delete(deleteTarget._id);
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success(apiResponse.message || "Officer deleted successfully");
        fetchOfficers();
      } else {
        toast.error(apiResponse.message || "Failed to delete officer");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to delete officer";
      toast.error(message);
      console.error("Delete officer error:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Table Columns
  // ───────────────────────────────────────────────────────────────────────────
  const columns = [
    {
      header: "User",
      accessorKey: "userId",
      cell: (row: Officer) => {
        // Handle null/undefined userId
        if (!row.userId) return "N/A";
        if (typeof row.userId === "string") return `User #${row.userId}`;
        return row.userId?.username || row.userId?._id || "N/A";
      },
    },
    {
      header: "Organization",
      accessorKey: "orgId",
      cell: (row: Officer) => {
        // Handle null/undefined orgId
        if (!row.orgId) return "N/A";
        if (typeof row.orgId === "string") return `Org #${row.orgId}`;
        return row.orgId?.orgName || row.orgId?._id || "N/A";
      },
    },
    {
      header: "Position",
      accessorKey: "position",
    },
    {
      header: "Term Start",
      accessorKey: "startTerm",
      cell: (row: Officer) =>
        row.startTerm ? format(new Date(row.startTerm), "MMM dd, yyyy") : "—",
    },
    {
      header: "Term End",
      accessorKey: "endTerm",
      cell: (row: Officer) => (row.endTerm ? format(new Date(row.endTerm), "MMM dd, yyyy") : "—"),
    },
    ...(canManage
      ? [
          {
            header: "Actions",
            accessorKey: "actions",
            cell: (row: Officer) => (
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

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <title>CampusHub | Officer Management</title>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Officers</h1>
            <p className="text-muted-foreground mt-1">
              {canManage ? "Manage organization officers" : "View organization officers"}
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreateModal}>
              <div className="flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Officer
              </div>
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={filteredOfficers}
          searchPlaceholder="Search officers..."
        />

        {/* Create/Edit Officer Modal */}
        {canManage && (
          <Modal
            isOpen={modalOpen}
            onClose={closeModal}
            title={isEditing ? "Edit Officer" : "Add Officer"}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select
                label="User"
                options={userOptions}
                placeholder="Select a user"
                {...register("userId")}
                error={errors.userId?.message}
                disabled={isEditing}
              />
              <Select
                label="Organization"
                options={orgOptions}
                placeholder="Select an organization"
                {...register("orgId")}
                error={errors.orgId?.message}
                disabled={isEditing}
              />
              <Select
                label="Position"
                options={positionOptions}
                placeholder="Select a position"
                {...register("position")}
                error={errors.position?.message}
              />
              <div className="space-y-2">
                <Label htmlFor="startTerm">Term Start</Label>
                <Input id="startTerm" type="date" {...register("startTerm")} />
                {errors.startTerm && (
                  <p className="text-sm text-destructive">{errors.startTerm.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTerm">Term End</Label>
                <Input id="endTerm" type="date" {...register("endTerm")} />
                {errors.endTerm && (
                  <p className="text-sm text-destructive">{errors.endTerm.message}</p>
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
        {canManage && (
          <ConfirmDialog
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete Officer"
            message={`Are you sure you want to delete this officer record? This action cannot be undone.`}
            confirmText="Delete"
            loading={deleting}
          />
        )}
      </div>
    </>
  );
};

export default OfficersPage;

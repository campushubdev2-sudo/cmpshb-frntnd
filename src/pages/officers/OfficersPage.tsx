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

const ALL_OFFICER_POSITIONS = [
  // BSBA
  "President",
  "Executive Vice President",
  "General Secretary",
  "Secretary Board",
  "Vp For Academics",
  "Member Of Vp For Academics",
  "Vp For Finance",
  "Member Of Vp For Finance",
  "Vp For Audit",
  "Member Of Vp For Audit",
  "Vp For Membership",
  "Member Of Vp For Membership",
  "Vp For Communication",
  "Member Of Vp For Communication",
  "Vp For Logistics",
  "Member Of Vp For Logistics",
  "Vp For Graphics And Publications",
  "Member Of Vp For Graphics And Publications",
  "Vp For Non-Academics (Sociocultural Committee)",
  "Member Of Vp For Non-Academics (Sociocultural Committee)",
  "Vp For Non-Academics (Sports Committee)",
  "Member Of Vp For Non-Academics (Sports Committee)",
  "Representative 1st year FM-A",
  "Representative 1st year FM-B",
  "Representative 1st year MM-A",
  "Representative 1st year MM-B",
  "Representative 1st year HRDM",
  "Representative 2nd year FM-A",
  "Representative 2nd year FM-B",
  "Representative 2nd year MM",
  "Representative 3rd year FM",
  "Representative 3rd year MM",
  "Representative 3rd year HRDM",
  "Representative 4th year FM",
  "Representative 4th year MM",
  "Representative 4th year HRDM",
  // BSHM
  "Vice President",
  "Secretary",
  "Assistant Secretary",
  "Treasurer",
  "Auditor",
  "PRO",
  "Business Manager",
  "Documentation",
  "1st Year Blk 2 Representative",
  "1st Year Blk 1 Representative",
  "2nd Year Blk 2 Representative",
  "2nd Year Blk 1 Representative",
  "3rd Year Representative",
  "4th Year Representative",
  // JUNIOR_PHILIPPINE_BSA
  "Vice-President for Administration",
  "Vice-President for Academics",
  "Vice-President for Culture and Arts",
  "Vice-President for Games and Sports",
  "Vice-President for Finance",
  "Vice-President for Audit",
  "Vice-President for Communications",
  "Vice-President for Membership",
  "Vice-President for Documentation",
  "Representatives - 1st Year",
  "Representatives - 2nd Year",
  "Representatives - 3rd Year",
  "Representatives - 4th Year",
  // SUPREME_STUDENT_COUNCIL
  "Board Secretary",
  "SSC Documentary Officer",
  "SSC Senator",
  "SSC Representative",
  // BSCRIM
  "Governor",
  "Vice Governor Internal",
  "Vice Governor External",
  "Minutes Secretary",
  "File Secretary",
  "Peace Officer",
  "Press Relation Officer",
  "Academic Coordinator",
  "Sports Coordinator",
  "Business Manager Internal",
  "Business Manager External",
  "1st Year Representative",
  "2nd Year Representative",
  "3rd Year Representative",
  "4th Year Representative",
  // MODERN_YOUNG_EDUCATORS
  "Vice President for Academics",
  "Vice President for Communication",
  "Vice President for Culture and Arts",
  "Vice President for Sports and Games",
  "Vice President for Documentation",
  "Vice President for Finance",
  "First-Year Representative",
  "Second-Year Representative",
  "Third-Year Representative",
  "Fourth-Year Representative",
  "Logistics Committee",
  "Graphic Artist",
  // COLLEGE_OF_TEACHER
  "First Year Assistant Secretary",
  "Second Year Assistant Secretary",
  "Third Year-Assistant Secretary",
  "BEEd 4th Year- Assistant Secretary",
  "BSEd 4th Year-Assistant Secretary",
  "MYES, Advisor",
  "Dean, College of Teacher Education",
  "OSAS-Director",
  "Vice President for Academic Affairs",
  "EVP/VPA/Principal, Basic Education",
  "President and Chairman of the Board",
  // ELEM
  "P.I.O",
  "Grade 1 Rep.",
  "Grade 2 Rep.",
  "Grade 3 Rep.",
  "Grade 4 Rep.",
  "Grade 5 Rep.",
  "Grade 6 Rep.",
  // SSLG
  "P.I.O JHS - Science Class",
  "P.I.O JHS - Regular Class",
  "P.I.O SHS",
  "Peace Officer JHS",
  "Peace Officer SHS",
  "Business Managers",
  // YWAV
  "Public Relation Officer (PRO)",
  // JPCS
  "Asst. Secretary",
  "Asst. Treasurer",
  "PIO (Academic)",
  "PIO (Non-Academic)",
];

const positionOptions = [...new Set(ALL_OFFICER_POSITIONS)].map((p) => ({ value: p, label: p }));

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

// --- MOCK DATA ---
const MOCK_USERS = [
  {
    _id: "user1",
    username: "john_doe",
    role: "officer",
    email: "john@example.com",
    phoneNumber: "1234567890",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user2",
    username: "jane_smith",
    role: "officer",
    email: "jane@example.com",
    phoneNumber: "0987654321",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user3",
    username: "alice_wonder",
    role: "adviser",
    email: "alice@example.com",
    phoneNumber: "1122334455",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user4",
    username: "bob_builder",
    role: "student",
    email: "bob@example.com",
    phoneNumber: "5566778899",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const MOCK_ORGS = [
  {
    _id: "org1",
    orgName: "Computer Science Society",
    description: "For CS students",
    adviser: "user3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "org2",
    orgName: "Business Club",
    description: "For business students",
    adviser: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let MOCK_OFFICERS = [
  {
    _id: "off1",
    userId: { ...MOCK_USERS[0], password: undefined },
    orgId: { ...MOCK_ORGS[0] },
    position: "President",
    startTerm: "2024-01-01",
    endTerm: "2024-12-31",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "off2",
    userId: { ...MOCK_USERS[1], password: undefined },
    orgId: { ...MOCK_ORGS[1] },
    position: "Secretary",
    startTerm: "2024-02-01",
    endTerm: "2024-11-30",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to simulate async API calls
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
const mockOfficersAPI = {
  getAll: async () => {
    await delay();
    return { data: MOCK_OFFICERS };
  },
  create: async (data: any) => {
    await delay();
    const { userId, orgId, position, startTerm, endTerm } = data;
    const foundUser = MOCK_USERS.find((u) => u._id === userId);
    const foundOrg = MOCK_ORGS.find((o) => o._id === orgId);
    if (!foundUser || !foundOrg) {
      return {
        success: false,
        status: "fail",
        message: "User or Organization not found",
      };
    }
    const newOfficer = {
      _id: `off${Date.now()}`,
      userId: { ...foundUser, password: undefined },
      orgId: { ...foundOrg },
      position,
      startTerm,
      endTerm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_OFFICERS.push(newOfficer);
    return {
      success: true,
      message: "Officer created successfully",
      data: newOfficer,
    };
  },
  update: async (id: string, data: any) => {
    await delay();
    const index = MOCK_OFFICERS.findIndex((o) => o._id === id);
    if (index === -1) {
      return {
        success: false,
        status: "fail",
        message: "Officer not found",
      };
    }
    const existing = MOCK_OFFICERS[index];
    // Simulate business rules
    if (data.startTerm && new Date(data.startTerm) > new Date(existing.startTerm)) {
      return {
        success: false,
        status: "fail",
        message: "Cannot set start term after it has already begun",
      };
    }
    if (data.endTerm && new Date(data.endTerm) < new Date(existing.endTerm)) {
      return {
        success: false,
        status: "fail",
        message: "Cannot shorten end term past the existing date",
      };
    }
    if (data.startTerm && data.endTerm && new Date(data.startTerm) >= new Date(data.endTerm)) {
      return {
        success: false,
        status: "fail",
        message: "End term must be after start term",
      };
    }

    const updatedOfficer = {
      ...existing,
      position: data.position ?? existing.position,
      startTerm: data.startTerm ?? existing.startTerm,
      endTerm: data.endTerm ?? existing.endTerm,
      updatedAt: new Date().toISOString(),
    };
    MOCK_OFFICERS[index] = updatedOfficer;
    return {
      success: true,
      message: "Officer updated successfully",
      data: updatedOfficer,
    };
  },
  delete: async (id: string) => {
    await delay();
    const index = MOCK_OFFICERS.findIndex((o) => o._id === id);
    if (index === -1) {
      return {
        success: false,
        status: "fail",
        message: "Officer not found",
      };
    }
    const deletedOfficer = MOCK_OFFICERS[index];
    MOCK_OFFICERS = MOCK_OFFICERS.filter((o) => o._id !== id);
    return {
      success: true,
      message: "Officer deleted successfully",
      data: deletedOfficer,
    };
  },
};

const OfficersPage = () => {
  const { authenticatedUser } = useAuthentication();
  const [officers, setOfficers] = useState([]);
  const [allOrgs, setAllOrgs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!editingOfficer;
  const isAdmin = authenticatedUser?.role === "admin";
  const isAdviser = authenticatedUser?.role === "adviser";
  const isOfficer = authenticatedUser?.role === "officer";
  const canManage = isAdmin || isAdviser;

  // Derive the user's org IDs for filtering
  const userOrgIds = useMemo(() => {
    if (isAdmin) return null; // admin sees all
    if (isAdviser) {
      // Adviser's orgs: orgs where adviser matches the user
      return allOrgs
        .filter((o) => {
          const adviserId = o.adviser?._id || o.adviser;
          return adviserId === authenticatedUser?._id;
        })
        .map((o) => o._id?.toString());
    }
    if (isOfficer) {
      // Officer's orgs: derive from officer records where userId matches
      const myOrgIds = officers
        .filter((off) => {
          const offUserId = off.userId?._id || off.userId;
          return offUserId === authenticatedUser?._id;
        })
        .map((off) => {
          const orgId = off.orgId?._id || off.orgId;
          return orgId?.toString();
        });
      return [...new Set(myOrgIds)];
    }
    return [];
  }, [isAdmin, isAdviser, isOfficer, allOrgs, officers, authenticatedUser]);

  // Filtered officers based on role
  const filteredOfficers = useMemo(() => {
    if (isAdmin || !userOrgIds) return officers;
    return officers.filter((off) => {
      const orgId = (off.orgId?._id || off.orgId)?.toString();
      return userOrgIds.includes(orgId);
    });
  }, [officers, userOrgIds, isAdmin]);

  // Filtered org options for the dropdown (adviser only sees their orgs)
  const orgOptions = useMemo(() => {
    const mapped = allOrgs.map((o) => ({
      value: o._id?.toString(),
      label: o.orgName,
    }));
    if (isAdmin || !userOrgIds) return mapped;
    return mapped.filter((o) => userOrgIds.includes(o.value));
  }, [allOrgs, userOrgIds, isAdmin]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditing ? editOfficerSchema : createOfficerSchema),
  });

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const response = await mockOfficersAPI.getAll();
      setOfficers(response.data);
    } catch (error) {
      toast.error("Failed to fetch officers");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Simulate fetching users and orgs
      await delay();
      setUsers(
        MOCK_USERS.map((u) => ({
          value: u._id?.toString(),
          label: u.username,
        })),
      );
      setAllOrgs(MOCK_ORGS);
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchOfficers();
    fetchDropdownData();
  }, []);

  const openCreateModal = () => {
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

  const openEditModal = (officer) => {
    setEditingOfficer(officer);
    reset({
      userId: officer.userId?._id || officer.userId || "",
      orgId: officer.orgId?._id || officer.orgId || "",
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

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      if (isEditing) {
        const { position, startTerm, endTerm } = data;
        const response = await mockOfficersAPI.update(editingOfficer._id, {
          position,
          startTerm,
          endTerm,
        });
        if (!response.success) {
          throw new Error(response.message);
        }
        toast.success(response.message);
      } else {
        const response = await mockOfficersAPI.create(data);
        if (!response.success) {
          throw new Error(response.message);
        }
        toast.success(response.message);
      }
      closeModal();
      fetchOfficers();
    } catch (error) {
      const message =
        error.message || (isEditing ? "Failed to update officer" : "Failed to create officer");
      toast.error(message);
      console.error("Officer submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await mockOfficersAPI.delete(deleteTarget._id);
      if (!response.success) {
        throw new Error(response.message);
      }
      toast.success(response.message);
      setDeleteTarget(null);
      fetchOfficers();
    } catch (error) {
      toast.error(error.message || "Failed to delete officer");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: "User",
      accessorKey: "userId",
      cell: (row) => row.userId?.username || `User #${row.userId}`,
    },
    {
      header: "Organization",
      accessorKey: "orgId",
      cell: (row) => row.orgId?.orgName || `Org #${row.orgId}`,
    },
    {
      header: "Position",
      accessorKey: "position",
    },
    {
      header: "Term Start",
      accessorKey: "startTerm",
      cell: (row) => (row.startTerm ? format(new Date(row.startTerm), "MMM dd, yyyy") : "—"),
    },
    {
      header: "Term End",
      accessorKey: "endTerm",
      cell: (row) => (row.endTerm ? format(new Date(row.endTerm), "MMM dd, yyyy") : "—"),
    },
    ...(canManage
      ? [
          {
            header: "Actions",
            accessorKey: "actions",
            cell: (row) => (
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
        <LoadingSpinner />
      </div>
    );
  }

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

        {canManage && (
          <Modal
            isOpen={modalOpen}
            onClose={closeModal}
            title={isEditing ? "Edit Officer" : "Add Officer"}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Select
                label="User"
                options={users}
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

        {/* Delete Confirmation - only for admin/adviser */}
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

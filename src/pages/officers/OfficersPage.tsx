import { Button } from "@/components/ui/button";
import { useAuthentication } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { format } from "date-fns";
import { Plus, Users, Calendar, Briefcase } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfficerPosition {
  positionValue: string;
  positionLabel: string;
}

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

type CreateOfficerFormData = z.infer<typeof createOfficerSchema>;
type EditOfficerFormData = z.infer<typeof editOfficerSchema>;

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

  // For adviser/officer - their organization
  const [myOrg, setMyOrg] = useState<{ _id: string; orgName: string } | null>(null);
  const [myOrgLoading, setMyOrgLoading] = useState(false);
  const [myOrgError, setMyOrgError] = useState<string | null>(null);

  // For adviser - their organization's officers
  const [myOrgOfficers, setMyOrgOfficers] = useState<Officer[]>([]);
  const [myOrgOfficersLoading, setMyOrgOfficersLoading] = useState(false);

  const isEditing = !!editingOfficer;
  const isAdmin = authenticatedUser?.role === ROLES.ADMIN;
  const isAdviser = authenticatedUser?.role === ROLES.ADVISER;
  const isOfficer = authenticatedUser?.role === ROLES.OFFICER;
  const canManage = isAdmin || isAdviser;

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

  const filteredOfficers = useMemo(() => {
    if (isAdmin || !userOrgIds) return officers;
    return officers.filter((off) => {
      const orgId = (typeof off.orgId === "string" ? off.orgId : off.orgId?._id)?.toString();
      return userOrgIds.includes(orgId);
    });
  }, [officers, userOrgIds, isAdmin]);

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

  const fetchDropdownData = async () => {
    try {
      const [usersRes, orgsRes, positionsRes] = await Promise.all([
        usersAPI.getAll({ limit: 100, role: "officer" }),
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

      // Fetch adviser's/officer's organization
      if (isAdviser || isOfficer) {
        setMyOrgLoading(true);
        setMyOrgError(null);
        try {
          const myOrgRes = await orgsAPI.getMyOrg();
          const myOrgData = myOrgRes.data;

          // Handle various response scenarios
          if (!myOrgData) {
            throw new Error("Empty response from server");
          }

          if (!myOrgData.success) {
            throw new Error(myOrgData.message || "Failed to fetch organization");
          }

          if (!myOrgData.data || !myOrgData.data._id || !myOrgData.data.orgName) {
            throw new Error("Invalid organization data received");
          }

          const orgId = myOrgData.data._id;
          const orgName = myOrgData.data.orgName;

          setMyOrg({
            _id: orgId,
            orgName: orgName,
          });

          // Fetch officers for this organization
          setMyOrgOfficersLoading(true);
          const officersRes = await officersAPI.getByOrgId(orgId);
          const officersData = officersRes.data;

          if (officersData.success && officersData.data) {
            setMyOrgOfficers(officersData.data.officers || []);
          } else {
            setMyOrgOfficers([]);
          }
        } catch (error: any) {
          console.error("Failed to fetch organization:", error);
          const errorMessage =
            error?.response?.data?.message || error?.message || "Failed to load your organization";
          setMyOrgError(errorMessage);
          setMyOrg(null);
          setMyOrgOfficers([]);
        } finally {
          setMyOrgLoading(false);
          setMyOrgOfficersLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
      toast.error("Failed to load users, organizations, or positions");
    }
  };

  useEffect(() => {
    fetchOfficers();
    fetchDropdownData();
  }, []);

  const openCreateModal = () => {
    if (!canManage) {
      toast.error("You don't have permission to add officers");
      return;
    }

    if ((isAdviser || isOfficer) && !myOrg) {
      if (myOrgLoading) {
        toast.error("Please wait, loading your organization...");
        return;
      }
      if (myOrgError) {
        toast.error(
          myOrgError || "Unable to load your organization. Please refresh the page.",
        );
        return;
      }
      toast.error("You are not assigned to any organization. Contact admin.");
      return;
    }

    setEditingOfficer(null);
    reset({
      userId: "",
      orgId: (isAdviser || isOfficer) && myOrg ? myOrg._id : "",
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
      const message =
        error?.response?.data?.message || error?.message || "Failed to delete officer";
      toast.error(message);
      console.error("Delete officer error:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

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

  if (loading || ((isAdviser || isOfficer) && myOrgOfficersLoading)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-9 w-64" />
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-28" />
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

  if (isAdviser || isOfficer) {
    if (myOrgError) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg font-medium">{myOrgError}</p>
            <p className="text-muted-foreground text-sm mt-2">
              Please contact your administrator or refresh the page.
            </p>
          </div>
        </div>
      );
    }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{myOrg.orgName}</h1>
            <p className="text-muted-foreground mt-1">Your organization's officers</p>
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

        {/* Stats Cards */}
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
              <div className="text-violet-600 bg-violet-50 flex h-11 w-11 items-center justify-center rounded-lg">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Organization</p>
                <p className="text-foreground text-xl font-bold">{myOrg.orgName}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="text-emerald-600 bg-emerald-50 flex h-11 w-11 items-center justify-center rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Active Term</p>
                <p className="text-foreground text-xl font-bold">
                  {
                    myOrgOfficers.filter((off) => {
                      const now = new Date();
                      const start = off.startTerm ? new Date(off.startTerm) : null;
                      const end = off.endTerm ? new Date(off.endTerm) : null;
                      return (!start || now >= start) && (!end || now <= end);
                    }).length
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Officers List */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Officers</h2>
            {myOrgOfficers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">No officers found</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {canManage ? "Add your first officer to get started" : "Your organization has no officers"}
                </p>
                {canManage && (
                  <Button onClick={openCreateModal} className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2 inline-flex" />
                    Add Officer
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {myOrgOfficers.map((officer) => {
                  const now = new Date();
                  const start = officer.startTerm ? new Date(officer.startTerm) : null;
                  const end = officer.endTerm ? new Date(officer.endTerm) : null;
                  const isActive = (!start || now >= start) && (!end || now <= end);

                  return (
                    <div
                      key={officer._id}
                      className="bg-muted flex items-center justify-between rounded-lg px-4 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-background flex h-10 w-10 items-center justify-center rounded-full border">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {officer.userId?.username || officer.userId?.firstName || "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                              {officer.position || "Officer"}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {officer.userId?.email || ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">
                          {officer.startTerm && officer.endTerm
                            ? `${format(new Date(officer.startTerm), "MMM yyyy")} - ${format(new Date(officer.endTerm), "MMM yyyy")}`
                            : "No term specified"}
                        </p>
                        <Badge variant={isActive ? "outline" : "outline"} className="text-xs mt-1">
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Officer Modal - Admin/Adviser only */}
        {canManage && (
          <Modal
            isOpen={modalOpen}
            onClose={closeModal}
            title={isEditing ? "Edit Officer" : "Add Officer"}
            size="lg"
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
              <div className="space-y-2">
                <Label htmlFor="orgId">Organization</Label>
                {(isAdviser || isOfficer) && myOrgLoading ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : (isAdviser || isOfficer) && myOrgError ? (
                  <div className="text-destructive text-sm">
                    <p>{myOrgError}</p>
                    <p className="text-xs mt-1">Cannot add officers without an organization</p>
                  </div>
                ) : (isAdviser || isOfficer) && myOrg ? (
                  <div className="space-y-1">
                    <Input
                      id="orgId"
                      value={myOrg.orgName}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Organization is locked to your assigned organization
                    </p>
                  </div>
                ) : (
                  <>
                    <Select
                      id="orgId"
                      options={orgOptions}
                      placeholder="Select an organization"
                      {...register("orgId")}
                      error={errors.orgId?.message}
                      disabled={isEditing}
                    />
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">
                        Organization cannot be changed when editing
                      </p>
                    )}
                  </>
                )}
              </div>
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

        {/* Create/Edit Officer Modal */}
        {canManage && (
          <Modal
            size="lg"
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
              <div className="space-y-2">
                <Label htmlFor="orgId">Organization</Label>
                {isAdviser && adviserOrgLoading ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : isAdviser && adviserOrgError ? (
                  <div className="text-destructive text-sm">
                    <p>{adviserOrgError}</p>
                    <p className="text-xs mt-1">Cannot add officers without an organization</p>
                  </div>
                ) : isAdviser && adviserOrg ? (
                  <div className="space-y-1">
                    <Input
                      id="orgId"
                      value={adviserOrg.orgName}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Organization is locked to your assigned organization
                    </p>
                  </div>
                ) : (
                  <>
                    <Select
                      id="orgId"
                      options={orgOptions}
                      placeholder="Select an organization"
                      {...register("orgId")}
                      error={errors.orgId?.message}
                      disabled={isEditing}
                    />
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">
                        Organization cannot be changed when editing
                      </p>
                    )}
                  </>
                )}
              </div>
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

import DataTable from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Phone, Plus, Shield, User as UserIcon, UserPen, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuthentication } from "@/contexts/AuthContext";
import { usersAPI, type User } from "@/api/users-api";
import { ROLES } from "@/config/constants/roles";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const roleOptions = [
  { value: ROLES.ADMIN, label: "Admin" },
  { value: ROLES.ADVISER, label: "Adviser" },
  { value: ROLES.OFFICER, label: "Officer" },
  { value: ROLES.STUDENT, label: "Student" },
];

const roleBadgeVariant = {
  admin: "destructive",
  adviser: "secondary",
  officer: "secondary",
  student: "default",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────
const phoneTransform = (val: string) => {
  if (!val) return val;
  if (val.startsWith("0")) return "+63" + val.slice(1);
  return val;
};

const phoneValidation = (val: string) => !val || /^\+[1-9]\d{1,14}$/.test(val);
const phoneMessage = "Please enter a valid phone number (e.g., 09082861144 or +639082861144)";

const phoneFieldOptional = z
  .string()
  .optional()
  .transform((val) => (val ? phoneTransform(val) : val))
  .refine((val) => !val || phoneValidation(val), { message: phoneMessage });

const phoneFieldRequired = z
  .string()
  .min(1, "Phone number is required")
  .transform(phoneTransform)
  .refine(phoneValidation, { message: phoneMessage });

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().min(1, "Role is required"),
  phoneNumber: phoneFieldRequired,
});

const editUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  phoneNumber: phoneFieldOptional,
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: "Password must be at least 8 characters",
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const UsersPage = () => {
  const { authenticatedUser } = useAuthentication();
  const canManageUsers = authenticatedUser?.role === ROLES.ADMIN;

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const isEditing = !!editingUser;

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: "", email: "", password: "", role: "", phoneNumber: "" },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { username: "", email: "", password: "", role: "", phoneNumber: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = isEditing ? editForm : createForm;

  // ───────────────────────────────────────────────────────────────────────────
  // Fetch Users from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({ limit: 100 });
      const apiResponse = response.data;

      // Handle different response structures
      let usersData: User[] = [];
      
      if (apiResponse.success) {
        if (Array.isArray(apiResponse.data)) {
          usersData = apiResponse.data;
        } else if (apiResponse.data && Array.isArray(apiResponse.data.items)) {
          usersData = apiResponse.data.items;
        } else if (apiResponse.data?.items) {
          usersData = apiResponse.data.items;
        }

        setUsers(usersData);
      } else {
        toast.error(apiResponse.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    createForm.reset();
    editForm.reset();
  };

  const openCreateModal = () => {
    if (!canManageUsers) {
      toast.error("You don't have permission to create users");
      return;
    }
    setEditingUser(null);
    createForm.reset();
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    if (!canManageUsers) {
      toast.error("You don't have permission to edit users");
      return;
    }
    setEditingUser(user);
    editForm.reset({
      username: user.username,
      email: user.email || "",
      role: user.role,
      phoneNumber: user.phoneNumber || "",
      password: "",
    });
    setModalOpen(true);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // CRUD Operations
  // ───────────────────────────────────────────────────────────────────────────
  const onCreate = async (data: CreateUserFormData) => {
    if (!canManageUsers) {
      toast.error("You don't have permission to create users");
      return;
    }

    setSubmitting(true);
    try {
      const response = await usersAPI.create(data);
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success("User created successfully");
        fetchUsers();
        closeModal();
      } else {
        // Display the actual backend error message
        toast.error(apiResponse.message || "Failed to create user");
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      // Try to extract error message from response
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = async (data: EditUserFormData) => {
    if (!canManageUsers || !editingUser) {
      toast.error("You don't have permission to edit users");
      return;
    }

    setSubmitting(true);
    try {
      // Only include password if it was provided
      const updateData: Partial<User> = {
        username: data.username,
        email: data.email,
        role: data.role,
        phoneNumber: data.phoneNumber,
      };

      if (data.password) {
        updateData.password = data.password;
      }

      const response = await usersAPI.update(editingUser._id, updateData);
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success("User updated successfully");
        fetchUsers();
        closeModal();
      } else {
        toast.error(apiResponse.message || "Failed to update user");
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update user";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!canManageUsers || !deleteTarget) {
      toast.error("You don't have permission to delete users");
      setDeleteTarget(null);
      return;
    }

    try {
      const response = await usersAPI.delete(deleteTarget._id);
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        toast.error(apiResponse.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete user";
      toast.error(errorMessage);
    } finally {
      setDeleteTarget(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Table Columns
  // ───────────────────────────────────────────────────────────────────────────
  const columns: any[] = [
    { header: "Username", accessorKey: "username" },
    { header: "Email", accessorKey: "email" },
    {
      header: "Role",
      accessorKey: "role",
      cell: (row: User) => (
        <Badge variant={roleBadgeVariant[row.role as keyof typeof roleBadgeVariant] || "default"}>
          {row.role}
        </Badge>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phoneNumber",
      cell: (row: User) => row.phoneNumber || "—",
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: (row: User) => (row.createdAt ? format(new Date(row.createdAt), "MMM dd, yyyy") : "—"),
    },
    ...(canManageUsers
      ? [
          {
            header: "Actions",
            accessorKey: "actions",
            cell: (row: User) => (
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
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <>
      <title>CampusHub | User Management</title>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage platform users</p>
          </div>
          {canManageUsers && (
            <Button onClick={openCreateModal}>
              <div className="flex items-center justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </div>
            </Button>
          )}
        </div>

        <DataTable columns={columns} data={users} searchPlaceholder="Search users..." />

        {/* Create/Edit User Dialog */}
        <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isEditing ? "bg-amber-500/10" : "bg-primary/10",
                  )}
                >
                  {isEditing ? (
                    <UserPen className="h-5 w-5 text-amber-600" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? `Update details for ${editingUser?.username}`
                      : "Create a new user account on the platform"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Separator />
            <form
              onSubmit={
                isEditing ? editForm.handleSubmit(onEdit) : createForm.handleSubmit(onCreate)
              }
              className="space-y-5"
            >
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account Information
                </p>
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="Enter username..."
                    {...register("username")}
                    error={errors.username?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register("email")}
                    error={errors.email?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Password
                    {isEditing && (
                      <span className="text-muted-foreground/60 font-normal">
                        (leave blank to keep current)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={isEditing ? "Enter new password..." : "Min. 8 characters"}
                    {...register("password")}
                    error={errors.password?.message}
                  />
                  {!isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Must include uppercase, lowercase, number, and special character
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role & Contact
                </p>
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-1.5 text-sm font-medium">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    Role
                  </Label>
                  <Select
                    id="role"
                    options={roleOptions}
                    placeholder="Select a role..."
                    {...register("role")}
                    error={errors.role?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="phoneNumber"
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="09082861144"
                    {...register("phoneNumber")}
                    error={errors.phoneNumber?.message}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} className="gap-1.5">
                  {isEditing ? (
                    <>
                      <div className="flex items-center justify-center">
                        <UserPen className="h-4 w-4" />
                        Update User
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </div>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">{deleteTarget?.username}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default UsersPage;

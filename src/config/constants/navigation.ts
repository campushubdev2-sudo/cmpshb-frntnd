import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  CalendarDays,
  UserCog,
  FileText,
  Bell,
  ScrollText,
} from "lucide-react";
import { ROLES } from "./roles";

export const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN],
  },
  {
    label: "Users",
    path: "/users",
    icon: Users,
    roles: [ROLES.ADMIN],
    group: "Management",
  },
  {
    label: "Organizations",
    path: "/organizations",
    icon: Building2,
    roles: [ROLES.ADMIN, ROLES.ADVISER, ROLES.OFFICER],
    group: "Management",
  },
  {
    label: "Officers",
    path: "/officers",
    icon: UserCog,
    roles: [ROLES.ADMIN, ROLES.ADVISER, ROLES.OFFICER],
    group: "Management",
  },
  {
    label: "Events",
    path: "/events",
    icon: CalendarDays,
    roles: [ROLES.ADMIN, ROLES.ADVISER, ROLES.OFFICER, ROLES.STUDENT],
    group: "Content",
  },
  {
    label: "Calendar",
    path: "/calendar",
    icon: Calendar,
    roles: [ROLES.ADMIN, ROLES.ADVISER, ROLES.OFFICER, ROLES.STUDENT],
    group: "Content",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
    roles: [ROLES.ADMIN, ROLES.ADVISER, ROLES.OFFICER],
    group: "Content",
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
    roles: [ROLES.ADMIN, ROLES.ADVISER, ROLES.OFFICER],
    group: "System",
  },
  {
    label: "System Logs",
    path: "/logs",
    icon: ScrollText,
    roles: [ROLES.ADMIN],
    group: "System",
  },
];

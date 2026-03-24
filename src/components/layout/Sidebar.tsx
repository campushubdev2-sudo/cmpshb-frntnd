import { type ReactElement } from "react";
import { NavLink } from "react-router";
import { ChevronLeft, ChevronRight, GraduationCap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/config/constants/navigation";
import { useAuthentication } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/config/constants/roles";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/contexts/SidebarContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  group?: string;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export default function Sidebar(): ReactElement {
  const { isCollapsed, isOpen: isMobileOpen, closeMobile, toggleCollapse } = useSidebar();

  const { authenticatedUser } = useAuthentication();
  const userRole: string = authenticatedUser?.role || "student";
  const filteredItems = (NAV_ITEMS as NavItem[]).filter((item) => item.roles.includes(userRole));

  const groups: NavGroup[] = [];
  const ungrouped = filteredItems.filter((item) => !item.group);
  if (ungrouped.length > 0) groups.push({ label: null, items: ungrouped });

  const groupOrder = ["Management", "Content", "System"] as const;
  groupOrder.forEach((groupName) => {
    const items = filteredItems.filter((item) => item.group === groupName);
    if (items.length > 0) groups.push({ label: groupName, items });
  });

  const renderNavLink = (item: NavItem): ReactElement => (
    <NavLink
      to={item.path}
      onClick={closeMobile}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          isCollapsed && "md:justify-center md:px-2",
        )
      }
    >
      <item.icon className="h-4.5 w-4.5 shrink-0" />
      {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
    </NavLink>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "bg-background/80 fixed inset-0 z-40 backdrop-blur-sm transition-opacity md:hidden",
          isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMobile}
      />

      <aside
        className={cn(
          "bg-card fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r transition-all duration-300 md:sticky md:top-0 md:z-0",
          // Width Logic
          isCollapsed ? "md:w-16" : "md:w-64",
          // Mobile Transform
          isMobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-3 px-4",
            isCollapsed && "md:justify-center md:px-0",
          )}
        >
          <GraduationCap className="text-primary h-7 w-7 shrink-0" />
          {(!isCollapsed || isMobileOpen) && (
            <span className="text-lg font-bold tracking-tight">CampusHub</span>
          )}
        </div>
        <Separator />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group, gi) => (
            <div key={group.label || "main"} className={cn(gi > 0 && "mt-6")}>
              {group.label && (!isCollapsed || isMobileOpen) && (
                <p className="text-muted-foreground/70 mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                  {group.label}
                </p>
              )}
              {group.label && isCollapsed && !isMobileOpen && (
                <Separator className="mx-auto my-2 w-8" />
              )}

              <div className="space-y-1">
                {group.items.map((item) =>
                  isCollapsed && !isMobileOpen ? (
                    <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>{renderNavLink(item)}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={item.path}>{renderNavLink(item)}</div>
                  ),
                )}
              </div>
            </div>
          ))}
        </nav>

        <Separator />

        {/* Desktop-only Footer & Toggle */}
        <div className="space-y-2 p-3">
          <div
            className={cn(
              "flex items-center gap-3 px-2 py-2",
              isCollapsed && "md:justify-center md:px-0",
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {authenticatedUser?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{authenticatedUser?.username}</p>
                <p className="text-muted-foreground text-xs">
                  {authenticatedUser?.role
                    ? ROLE_LABELS[authenticatedUser.role as keyof typeof ROLE_LABELS] ||
                      authenticatedUser.role
                    : "Student"}
                </p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="hidden h-8 w-full md:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

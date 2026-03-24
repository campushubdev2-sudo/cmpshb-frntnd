import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";

import { LayoutDashboard, BarChart3, FileText, User, CreditCard, Users } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar className="[--sidebar-width-mobile:200px] md:[--sidebar-width:auto]">
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-2">
          <LayoutDashboard className="text-primary size-5" />

          <h2 className="text-sm font-semibold tracking-tight">CampusHub</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <LayoutDashboard className="size-4" />
                  <span>Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart3 className="size-4" />
                  <span>Organizations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <FileText className="size-4" />
                  <span>Officers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs font-medium">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User className="size-4" />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <CreditCard className="size-4" />
                  <span>Billing</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Users className="size-4" />
                  <span>Team</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <div className="p-3">
          <p className="text-muted-foreground text-xs">© 2026 My App</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

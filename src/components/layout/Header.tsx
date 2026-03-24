import { useNavigate } from "react-router";
import { LogOut, ChevronDown, Sun, Moon, Monitor, Menu } from "lucide-react";
import { useAuthentication } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ROLE_LABELS } from "@/config/constants/roles";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { authenticatedUser, logout } = useAuthentication();
  const { theme, setTheme } = useTheme();
  const { toggleMobile } = useSidebar(); // Access toggle logic
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-card/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Section: Mobile Trigger + Welcome */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden" // Only shows on mobile
            onClick={toggleMobile}
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="max-w-[150px] truncate text-sm font-semibold sm:max-w-none sm:text-lg">
            Welcome back, {authenticatedUser?.username || "User"}
          </h1>
        </div>

        {/* Right Section: Theme + Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="hover:bg-accent rounded-lg p-2 transition-colors outline-none"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : theme === "light" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors outline-none sm:px-3 sm:py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {authenticatedUser?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm leading-none font-medium">{authenticatedUser?.username}</p>
                  <p className="text-muted-foreground mt-1 text-[10px] uppercase">
                    {ROLE_LABELS[authenticatedUser?.role as keyof typeof ROLE_LABELS] ||
                      authenticatedUser?.role}
                  </p>
                </div>
                <ChevronDown className="text-muted-foreground hidden h-4 w-4 sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{authenticatedUser?.username}</p>
                  <p className="text-muted-foreground text-xs">{authenticatedUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { TooltipProvider } from "../../components/ui/tooltip";
import { SidebarProvider } from "../../contexts/SidebarContext";

export default function MainLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

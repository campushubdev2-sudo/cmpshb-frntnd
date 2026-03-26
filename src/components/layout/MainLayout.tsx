import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { TooltipProvider } from "../../components/ui/tooltip";
import { SidebarProvider } from "../../contexts/SidebarContext";

// G25: Semantic Constants for layout predictability
const MAX_CONTENT_WIDTH = "max-w-7xl";
const LAYOUT_CONTAINER_CLASSES = "flex min-h-screen bg-background";
const CONTENT_AREA_CLASSES = "flex flex-1 flex-col min-w-0 overflow-hidden";
const MAIN_PADDING_CLASSES = "flex-1 p-4 md:p-6 lg:p-8";

export default function MainLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className={LAYOUT_CONTAINER_CLASSES}>
          {/* Persistent Navigation */}
          <Sidebar />

          <div className={CONTENT_AREA_CLASSES}>
            <Header />

            {/* Predictable Content Shell:
                Ensures content doesn't stretch infinitely on wide screens 
                and maintains consistent internal gutters.
            */}
            <main className={MAIN_PADDING_CLASSES}>
              <div className={`mx-auto w-full ${MAX_CONTENT_WIDTH}`}>
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}

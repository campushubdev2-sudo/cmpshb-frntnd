import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import { TooltipProvider } from "../../components/ui/tooltip";
import { SidebarProvider } from "../../contexts/SidebarContext";
import { lazy, Suspense } from "react";

const MAX_CONTENT_WIDTH = "max-w-7xl";
const LAYOUT_CONTAINER_CLASSES = "flex min-h-screen bg-background";
const CONTENT_AREA_CLASSES = "flex flex-1 flex-col min-w-0 overflow-hidden";
const MAIN_PADDING_CLASSES = "flex-1 p-4 md:p-6 lg:p-8";

export default function MainLayout() {
  const Header = lazy(() => import("./Header"));
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className={LAYOUT_CONTAINER_CLASSES}>
          <Sidebar />
          <div className={CONTENT_AREA_CLASSES}>
            <Suspense>
              <Header />
            </Suspense>
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

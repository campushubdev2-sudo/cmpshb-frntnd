import { Routes, Route, Navigate } from "react-router";
import { lazy, Suspense } from "react";

// Layout & Route Guards (Keep these eager as they are structural)
import ProtectedRoute from "./routes/ProtectedRoutes";
import MainLayout from "./components/layout/MainLayout";

// --- Lazy Loaded Pages ---

// Auth
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));

// Landing
const LandingPage = lazy(() => import("./pages/landing/LandingPage"));

// Main
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const UsersPage = lazy(() => import("./pages/users/UsersPage"));
const OrganizationsPage = lazy(() => import("./pages/organizations/OrganizationsPage"));
const OrganizationDetailPage = lazy(() => import("./pages/organizations/OrganizationDetailPage"));
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/events/EventDetailPage"));
const OfficersPage = lazy(() => import("./pages/officers/OfficersPage"));
const CalendarPage = lazy(() => import("./pages/calendar/CalendarPage"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const ReportDetailPage = lazy(() => import("./pages/reports/ReportDetailPage"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const LogsPage = lazy(() => import("./pages/logs-page/LogsPage"));

const App = () => {
  return (
    <Suspense
      fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "adviser", "officer"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations"
            element={
              <ProtectedRoute allowedRoles={["admin", "adviser", "officer"]}>
                <OrganizationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizations/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "adviser", "officer"]}>
                <OrganizationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route
            path="/officers"
            element={
              <ProtectedRoute allowedRoles={["admin", "adviser", "officer"]}>
                <OfficersPage />
              </ProtectedRoute>
            }
          />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "adviser", "officer"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "adviser", "officer"]}>
                <ReportDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["admin", "adviser", "officer"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <LogsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;

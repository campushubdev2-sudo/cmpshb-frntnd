import { Routes, Route, Navigate } from "react-router";
import ProtectedRoute from "./routes/ProtectedRoutes";
import MainLayout from "./components/layout/MainLayout";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Landing page
import LandingPage from "./pages/landing/LandingPage";

// Main pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/users/UsersPage";
import OrganizationsPage from "./pages/organizations/OrganizationsPage";
import OrganizationDetailPage from "./pages/organizations/OrganizationDetailPage";
import EventsPage from "./pages/events/EventsPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import OfficersPage from "./pages/officers/OfficersPage";
import CalendarPage from "./pages/calendar/CalendarPage";
import ReportsPage from "./pages/reports/ReportsPage";
import ReportDetailPage from "./pages/reports/ReportDetailPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import LogsPage from "./pages/logs-page/LogsPage.tsx";

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
            <ProtectedRoute allowedRoles={["admin", "officer", "adviser"]}>
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
  );
};

export default App;

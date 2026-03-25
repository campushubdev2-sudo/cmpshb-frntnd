import { Navigate, useLocation } from "react-router";
import { useEffect, useState, type ReactNode, type ReactElement } from "react";
import { useAuthentication } from "../contexts/AuthContext";
import { authApi } from "../api/auth-api";
import LoadingSpinner from "../components/shared/LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps): ReactElement | null {
  const { isAuthenticated, authenticatedUser, logout } = useAuthentication();
  const location = useLocation();
  const [verifying, setVerifying] = useState<boolean>(true);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated, redirect immediately
    if (!isAuthenticated) {
      setVerifying(false);
      return;
    }

    // Only verify profile if allowedRoles is specified (role-based protection)
    if (!allowedRoles) {
      setVerifying(false);
      return;
    }

    // Verify profile for role-based routes
    authApi
      .getProfile()
      .then(() => {
        setVerifying(false);
      })
      .catch((error: any) => {
        const status = error.response?.status;
        const message: string = error.response?.data?.message || "";
        
        console.log("[ProtectedRoute] Profile fetch failed:", { status, message });
        setProfileError(message);

        // Logout on 401 error
        if (status === 401) {
          logout();
          setTokenExpired(true);
        } else {
          // For other errors, still allow access if user is logged in
          setVerifying(false);
        }
      });
  }, [isAuthenticated, allowedRoles, logout]);

  if (verifying) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || tokenExpired) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(authenticatedUser?.role || "")) {
    const redirectPath = authenticatedUser?.role === "student" ? "/calendar" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

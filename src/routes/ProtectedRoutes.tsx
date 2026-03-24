import { Navigate } from "react-router";
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
  const [verifying, setVerifying] = useState<boolean>(true);
  const [tokenExpired, setTokenExpired] = useState<boolean>(false);

  useEffect(() => {
    // Skip profile check when this instance is only doing a role check.
    // The outer (no-allowedRoles) ProtectedRoute already handles session validation.
    if (!isAuthenticated || allowedRoles) {
      setVerifying(false);
      return;
    }

    authApi
      .getProfile()
      .catch((error: any) => {
        const message: string = error.response?.data?.message || "";
        const isTokenExpired = message
          .toLowerCase()
          .includes("your token has expired. please log in again.");

        if (isTokenExpired) {
          logout();
          setTokenExpired(true);
        }
      })
      .finally(() => setVerifying(false));
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

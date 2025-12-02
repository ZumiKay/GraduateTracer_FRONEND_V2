import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useUserSession } from "../hooks/useUserSession";
import { setPendingRedirect } from "../utils/authRedirect";

interface PrivateRouteProps {
  redirectPath?: string;
}

export const PublichRoute = () => {
  const { pathname } = useLocation();
  const { data: sessionData } = useUserSession({ enabled: pathname !== "/" });
  const isAuthenticated = sessionData?.isAuthenticated ?? false;

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to="/dashboard" />;
};

/**
 * Private Route Component
 *
 * *Protect Route From Unauthenticated access
 * @param redirectPath: string
 *
 *
 */

const PrivateRoute: React.FC<PrivateRouteProps> = ({ redirectPath = "/" }) => {
  const location = useLocation();
  const { data: sessionData } = useUserSession();
  const isAuthenticated = sessionData?.isAuthenticated ?? false;

  useEffect(() => {
    console.log("Testing Private Route", sessionData);
  }, [sessionData]);

  if (!isAuthenticated) {
    // Store the current URL (including search params) to redirect back after login
    const fullUrl = location.pathname + location.search;
    setPendingRedirect(fullUrl);

    return <Navigate to={redirectPath} />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default PrivateRoute;

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { Navigate, Outlet } from "react-router";
import { RootState } from "../redux/store";
import ContainerLoading from "../component/Loading/ContainerLoading";

interface PrivateRouteProps {
  redirectPath?: string;
}

export const PublichRoute = () => {
  const { isAuthenticated, loading } = useSelector(
    (root: RootState) => root.usersession
  );

  if (loading) {
    return <ContainerLoading />;
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to="/dashboard" />;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ redirectPath = "/" }) => {
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.usersession
  );

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  if (loading || !isReady) {
    return <ContainerLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default PrivateRoute;

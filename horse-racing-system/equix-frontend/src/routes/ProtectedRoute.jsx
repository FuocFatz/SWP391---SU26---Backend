import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

function ProtectedRoute() {
  const { isAuthenticated, sessionLoading } = useAuth();
  const location = useLocation();

  if (sessionLoading) {
    return <div className="route-loading" aria-label="Đang khôi phục phiên"><span className="spinner spinner-lg" /></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}

export default ProtectedRoute;

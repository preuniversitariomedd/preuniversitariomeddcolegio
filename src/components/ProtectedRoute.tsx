import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rol requerido. Si se omite, basta con estar autenticado. */
  requireRole?: "admin" | "estudiante";
}

export function ProtectedRoute({ children, requireRole }: Props) {
  const { user, role, activo, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!activo) {
    return <Navigate to="/unauthorized?reason=blocked" replace />;
  }

  if (requireRole && role !== requireRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ============================================================
// ErrorBoundary global — atrapa errores cross-browser y permite
// recargar sin perder la sesión.
// © 2020-2026 PreUniversitario MEDD — Víctor Cañizares González
// ============================================================
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log mínimo, sin exponer datos sensibles
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-display font-bold">
            Ocurrió un error inesperado
          </h1>
          <p className="text-sm text-muted-foreground">
            La aplicación encontró un problema. Recarga la página para continuar.
          </p>
          <Button onClick={this.handleReload} className="touch-target">
            <RefreshCw className="h-4 w-4 mr-2" /> Recargar
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

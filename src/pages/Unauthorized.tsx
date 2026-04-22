import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";

export default function Unauthorized() {
  const [params] = useSearchParams();
  const reason = params.get("reason");

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <section className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="h-8 w-8 text-destructive" aria-hidden />
        </div>
        <h1 className="font-display text-3xl font-bold">Acceso no autorizado</h1>
        <p className="text-muted-foreground">
          {reason === "blocked"
            ? "Tu cuenta está bloqueada. Contacta al administrador del PreUniversitario MEDD."
            : "No tienes permisos para acceder a esta sección. Si crees que es un error, contacta al administrador."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/login">Ir al inicio de sesión</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

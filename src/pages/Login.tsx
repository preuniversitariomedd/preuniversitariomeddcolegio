import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ChangePassword from "@/components/ChangePassword";
import logoMedd from "@/assets/logo-medd.png";

export default function Login() {
  const { user, profile, role, loading } = useAuth();
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(() => {
    const r = sessionStorage.getItem("medd_logout_reason");
    if (r === "inactividad") return "Sesión cerrada por inactividad. Vuelve a iniciar sesión.";
    if (r === "expirada") return "Tu sesión ha expirado. Por favor inicia sesión nuevamente.";
    return "";
  });
  const [submitting, setSubmitting] = useState(false);
  const [needsChange, setNeedsChange] = useState(false);
  const { signIn } = useAuth();

  if (info) {
    // Limpiar para que no reaparezca en el próximo login
    sessionStorage.removeItem("medd_logout_reason");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (user && profile?.password_changed) {
    return <Navigate to={role === "admin" ? "/admin" : "/student"} replace />;
  }

  if (needsChange || (user && profile && !profile.password_changed)) {
    return <ChangePassword />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(cedula)) { setError("La cédula debe tener 10 dígitos."); return; }
    setSubmitting(true);
    const result = await signIn(cedula, password);
    setSubmitting(false);
    if (result.error) setError(result.error);
    if (result.needsPasswordChange) setNeedsChange(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center space-y-4">
            <img src={logoMedd} alt="MEDD Logo" className="mx-auto w-24 h-24 rounded-full object-cover" />
            <CardTitle className="text-2xl font-display">PREUNIVERSITARIO MEDD</CardTitle>
            <p className="text-muted-foreground text-sm">Metodología Educativa Didáctica a Distancia</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input id="cedula" placeholder="0930620109" value={cedula} onChange={e => setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {info && <p className="text-sm bg-muted border border-border text-foreground rounded-md p-3 leading-relaxed">{info}</p>}
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full" variant="neon" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

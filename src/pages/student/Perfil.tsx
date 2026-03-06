import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, User } from "lucide-react";

const checks = [
  { label: "8+ caracteres", test: (p: string) => p.length >= 8 },
  { label: "1 mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 número", test: (p: string) => /\d/.test(p) },
  { label: "1 carácter especial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function StudentPerfil() {
  const { profile, changePassword } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const allPassed = checks.every(c => c.test(password)) && password === confirm && confirm.length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPassed) return;
    setSubmitting(true);
    const { error } = await changePassword(password);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error, variant: "destructive" });
    else { toast({ title: "Contraseña actualizada" }); setPassword(""); setConfirm(""); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-display font-bold">Mi Perfil</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            {profile?.nombre} {profile?.apellidos}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Cédula:</span> <span className="font-mono">{profile?.cedula}</span></div>
            <div><span className="text-muted-foreground">Fecha de nacimiento:</span> {profile?.fecha_nacimiento || "—"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Cambiar Contraseña</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div><Label>Nueva contraseña</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
            <div><Label>Confirmar</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
            <div className="space-y-1">
              {checks.map(c => (
                <div key={c.label} className="flex items-center gap-2 text-sm">
                  {c.test(password) ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />}
                  <span className={c.test(password) ? "text-success" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
            </div>
            <Button type="submit" variant="neon" disabled={!allPassed || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

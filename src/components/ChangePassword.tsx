import { useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { passwordStrength } from "@/lib/security";

const STRENGTH_META = {
  debil:  { label: "Débil",  color: "bg-destructive", width: "w-1/3" },
  media:  { label: "Media",  color: "bg-accent",      width: "w-2/3" },
  fuerte: { label: "Fuerte", color: "bg-success",     width: "w-full" },
} as const;

const checks = [
  { label: "8+ caracteres", test: (p: string) => p.length >= 8 },
  { label: "1 mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 número", test: (p: string) => /\d/.test(p) },
  { label: "1 carácter especial", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { changePassword, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = useMemo(() => passwordStrength(password), [password]);
  const meta = STRENGTH_META[strength];

  const allPassed = checks.every(c => c.test(password)) && password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPassed) return;
    setSubmitting(true);
    const { error } = await changePassword(password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Contraseña actualizada" });
      navigate(role === "admin" ? "/admin" : "/student");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-display">Cambiar Contraseña</CardTitle>
            <p className="text-muted-foreground text-sm">Debes cambiar tu contraseña antes de continuar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input type="password" placeholder="Nueva contraseña" value={password} onChange={e => setPassword(e.target.value)} />
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                    <div className={`h-full ${meta.color} ${meta.width} transition-all`} />
                  </div>
                  <p className="text-xs text-muted-foreground">Fortaleza: <span className="font-medium text-foreground">{meta.label}</span></p>
                </div>
              )}
              <Input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} />
              <div className="space-y-1">
                {checks.map(c => (
                  <div key={c.label} className="flex items-center gap-2 text-sm">
                    {c.test(password) ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-destructive" />}
                    <span className={c.test(password) ? "text-success" : "text-muted-foreground"}>{c.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  {password === confirm && confirm.length > 0 ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-destructive" />}
                  <span className={password === confirm && confirm.length > 0 ? "text-success" : "text-muted-foreground"}>Contraseñas coinciden</span>
                </div>
              </div>
              <Button type="submit" className="w-full" variant="neon" disabled={!allPassed || submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { APP_INFO } from "@/App";
import { passwordStrength } from "@/lib/security";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, User, Camera, Info } from "lucide-react";

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

export default function AdminPerfil() {
  const { user, profile, changePassword, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allPassed = checks.every(c => c.test(password)) && password === confirm && confirm.length > 0;
  const strength = useMemo(() => passwordStrength(password), [password]);
  const meta = STRENGTH_META[strength];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allPassed) return;
    setSubmitting(true);
    const { error } = await changePassword(password);
    setSubmitting(false);
    if (error) toast({ title: "Error", description: error, variant: "destructive" });
    else { toast({ title: "Contraseña actualizada" }); setPassword(""); setConfirm(""); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Solo se permiten imágenes", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Máximo 2 MB", variant: "destructive" }); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast({ title: "Error al subir imagen", description: uploadErr.message, variant: "destructive" }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: `${publicUrl}?t=${Date.now()}` }).eq("id", user.id);
    await refreshProfile();
    setUploading(false);
    toast({ title: "Foto actualizada" });
  };

  const avatarSrc = profile?.avatar_url;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-display font-bold">Mi Perfil</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                {avatarSrc ? <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" /> : <User className="h-8 w-8 text-primary" />}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <div>{profile?.nombre} {profile?.apellidos}</div>
              <p className="text-sm text-muted-foreground font-normal">Toca la foto para cambiarla</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-muted rounded overflow-hidden">
                  <div className={`h-full ${meta.color} ${meta.width} transition-all`} />
                </div>
                <p className="text-xs text-muted-foreground">Fortaleza: <span className="font-medium text-foreground">{meta.label}</span></p>
              </div>
            )}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> Información del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="font-medium">{APP_INFO.nombre}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Versión</dt>
              <dd className="font-mono">{APP_INFO.version}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Autor</dt>
              <dd className="font-medium">{APP_INFO.autor}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-muted-foreground">Fecha de fundación</dt>
              <dd>9 de enero de 2020</dd>
            </div>
            <div className="flex justify-between sm:block sm:col-span-2">
              <dt className="text-muted-foreground">Copyright</dt>
              <dd>{APP_INFO.copyright}</dd>
            </div>
            <div className="sm:col-span-2 pt-2 mt-2 border-t border-border text-xs text-muted-foreground">
              Todos los derechos reservados — Software propietario.
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

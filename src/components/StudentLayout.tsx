import { useAuth } from "@/components/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, LayoutDashboard, BookOpen, Library, MessageSquare, User, Moon, Sun, Zap, ShieldCheck, Brain, Target, Compass, Columns3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playNotification } from "@/lib/sounds";
import logoMedd from "@/assets/logo-medd.png";

// Context to share the "viewed as" student ID with child pages
const ViewAsStudentContext = createContext<string | null>(null);
export function useViewAsStudent() {
  return useContext(ViewAsStudentContext);
}

const studentLinks = [
  { title: "Inicio", url: "/student", icon: LayoutDashboard },
  { title: "Cursos", url: "/student/cursos", icon: BookOpen },
  { title: "Competencia", url: "/student/competencia", icon: Zap },
  { title: "Biblioteca", url: "/student/biblioteca", icon: Library },
  { title: "Psicometría", url: "/student/psicometria", icon: Brain },
  { title: "Concentración", url: "/student/concentracion", icon: Target },
  { title: "Orientación", url: "/student/orientacion-vocacional", icon: Compass },
  { title: "Mensajes", url: "/student/mensajes", icon: MessageSquare },
  { title: "Perfil", url: "/student/perfil", icon: User },
];

export default function StudentLayout() {
  const { user, role, loading, profile, signOut } = useAuth();
  const isAdminPreview = role === "admin";
  const location = useLocation();
  const { toast } = useToast();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [viewAsStudentId, setViewAsStudentId] = useState<string | null>(null);

  // Fetch students list for admin preview selector
  const { data: students } = useQuery({
    queryKey: ["all-students-for-selector"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("rol", "estudiante").eq("activo", true);
      if (!roles?.length) return [];
      const ids = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, nombre, apellidos").in("id", ids).order("apellidos");
      return profiles || [];
    },
    enabled: isAdminPreview,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Presence tracking
  useEffect(() => {
    if (!user) return;
    const updatePresence = async () => {
      const ua = navigator.userAgent;
      const dispositivo = /Mobile|Android|iPhone/i.test(ua) ? "móvil" : "escritorio";
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const { ip } = await res.json();
        await supabase.from("presencia").upsert({ user_id: user.id, last_seen: new Date().toISOString(), dispositivo, ip, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      } catch {
        await supabase.from("presencia").upsert({ user_id: user.id, last_seen: new Date().toISOString(), dispositivo, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      }
    };
    updatePresence();
    const interval = setInterval(updatePresence, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Realtime: new competition notification
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("new-competitions")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "competencias" }, (payload) => {
        const comp = payload.new as any;
        playNotification();
        toast({
          title: "🎮 ¡Nueva Competencia en Vivo!",
          description: `"${comp.titulo}" — Código: ${comp.codigo}`,
          duration: 10000,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, toast]);

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("mensajes").select("*", { count: "exact", head: true }).eq("destinatario_id", user!.id).eq("leido", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.password_changed) return <Navigate to="/login" replace />;
  // Allow admin to preview student view (don't redirect)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isAdminPreview && (
        <div className="bg-accent text-accent-foreground text-sm py-1.5 flex items-center justify-center gap-2 font-medium flex-wrap px-4">
          <ShieldCheck className="h-4 w-4" />
          Vista previa como estudiante
          <Select value={viewAsStudentId || "self"} onValueChange={(v) => setViewAsStudentId(v === "self" ? null : v)}>
            <SelectTrigger className="h-7 w-auto min-w-[180px] text-xs bg-background border-border">
              <SelectValue placeholder="Tú mismo (admin)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">Tú mismo (admin)</SelectItem>
              {students?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.apellidos}, {s.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <a href="/admin" className="underline ml-2 hover:text-primary">← Volver al panel</a>
        </div>
      )}
      <header className="hidden md:flex h-14 items-center border-b border-border px-6 bg-card justify-between">
        <div className="flex items-center gap-4">
          <img src={logoMedd} alt="MEDD" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <h1 className="font-display font-bold text-primary text-lg leading-tight">MEDD</h1>
            <p className="text-[9px] text-muted-foreground leading-tight">Metodología Educativa Didáctica a Distancia</p>
          </div>
          <nav className="flex gap-1">
            {studentLinks.map(item => (
              <NavLink key={item.url} to={item.url} end={item.url === "/student"}
                className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
                activeClassName="bg-primary/10 text-primary font-medium">
                <item.icon className="h-4 w-4" />
                {item.title}
                {item.url === "/student/mensajes" && (unreadCount || 0) > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] h-4 min-w-4 px-1 absolute -top-1 -right-1">{unreadCount}</Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-muted-foreground">{profile?.nombre}</span>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-destructive">Salir</Button>
        </div>
      </header>

      <ViewAsStudentContext.Provider value={viewAsStudentId}>
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          <Outlet />
        </main>
      </ViewAsStudentContext.Provider>

      <footer className="hidden md:block border-t border-border bg-card/50 py-3 px-6 text-[11px] text-muted-foreground text-center">
        © 2020-2026 PreUniversitario MEDD · Víctor Cañizares González · Fundado el 9 de enero de 2020 · Todos los derechos reservados
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50">
        {studentLinks.map(item => {
          const isActive = item.url === "/student" ? location.pathname === "/student" : location.pathname.startsWith(item.url);
          return (
            <NavLink key={item.url} to={item.url} end={item.url === "/student"}
              className="flex flex-col items-center gap-1 p-1 text-muted-foreground relative"
              activeClassName="text-primary">
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.title}</span>
              {item.url === "/student/mensajes" && (unreadCount || 0) > 0 && (
                <span className="absolute -top-1 right-0 bg-destructive text-destructive-foreground text-[9px] rounded-full h-4 min-w-4 flex items-center justify-center px-1">{unreadCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

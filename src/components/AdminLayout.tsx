import { useAuth } from "@/components/AuthProvider";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Users, BookOpen, FileText, HelpCircle, Library, MessageSquare, LogOut, Moon, Sun, Zap, User, Eye, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoMedd from "@/assets/logo-medd.png";

const adminLinks = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Estudiantes", url: "/admin/estudiantes", icon: Users },
  { title: "Cursos", url: "/admin/cursos", icon: BookOpen },
  { title: "Grupos", url: "/admin/grupos", icon: UsersRound },
  { title: "Contenido", url: "/admin/contenido", icon: FileText },
  { title: "Quiz", url: "/admin/quiz", icon: HelpCircle },
  { title: "Competencia", url: "/admin/competencia", icon: Zap },
  { title: "Biblioteca", url: "/admin/biblioteca", icon: Library },
  { title: "Mensajes", url: "/admin/mensajes", icon: MessageSquare },
  { title: "Mi Perfil", url: "/admin/perfil", icon: User },
];

function AdminSidebar() {
  const { signOut, profile } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-display font-bold text-primary text-lg leading-tight">MEDD</h2>
              <p className="text-[10px] text-muted-foreground leading-tight">Metodología Educativa Didáctica a Distancia</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.nombre} {profile?.apellidos}</p>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminLinks.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-3 space-y-2 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-start text-accent-foreground" asChild>
            <a href="/student" target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              {!collapsed && "Vista Estudiante"}
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {!collapsed && (dark ? "Modo claro" : "Modo oscuro")}
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Cerrar sesión"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { user, role, loading, profile } = useAuth();
  const { toast } = useToast();

  // Realtime quiz completion notifications
  useEffect(() => {
    if (role !== "admin") return;
    const channel = supabase
      .channel('quiz-completions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quiz_respuestas' },
        async (payload) => {
          const resp = payload.new as any;
          const { data: student } = await supabase.from("profiles").select("nombre, apellidos").eq("id", resp.user_id).single();
          const name = student ? `${student.nombre} ${student.apellidos}` : "Un estudiante";
          toast({
            title: "📝 Respuesta de Quiz",
            description: `${name} respondió ${resp.correcta ? "✅ correctamente" : "❌ incorrectamente"}`,
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [role, toast]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.password_changed) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/student" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-3 font-display font-semibold text-lg">Panel de Administración</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">{profile?.nombre} {profile?.apellidos}</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

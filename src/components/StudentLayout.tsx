import { useAuth } from "@/components/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, LayoutDashboard, BookOpen, Library, MessageSquare, User, Moon, Sun } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoMedd from "@/assets/logo-medd.png";

const studentLinks = [
  { title: "Inicio", url: "/student", icon: LayoutDashboard },
  { title: "Cursos", url: "/student/cursos", icon: BookOpen },
  { title: "Biblioteca", url: "/student/biblioteca", icon: Library },
  { title: "Mensajes", url: "/student/mensajes", icon: MessageSquare },
  { title: "Perfil", url: "/student/perfil", icon: User },
];

export default function StudentLayout() {
  const { user, role, loading, profile, signOut } = useAuth();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

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
  if (role === "admin") return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="hidden md:flex h-14 items-center border-b border-border px-6 bg-card justify-between">
        <div className="flex items-center gap-4">
          <img src={logoMedd} alt="MEDD" className="w-8 h-8 rounded-full object-cover" />
          <h1 className="font-display font-bold text-primary text-lg">MEDD</h1>
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-destructive">Salir</Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
        <Outlet />
      </main>

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

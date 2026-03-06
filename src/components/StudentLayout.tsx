import { useAuth } from "@/components/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, LayoutDashboard, BookOpen, Library, MessageSquare, User, Moon, Sun } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.password_changed) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar desktop */}
      <header className="hidden md:flex h-14 items-center border-b border-border px-6 bg-card justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-display font-bold text-primary text-lg">MEDD</h1>
          <nav className="flex gap-1">
            {studentLinks.map(item => (
              <NavLink key={item.url} to={item.url} end={item.url === "/student"}
                className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium">
                <item.icon className="h-4 w-4" />
                {item.title}
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

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom bar mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50">
        {studentLinks.map(item => {
          const isActive = item.url === "/student" ? location.pathname === "/student" : location.pathname.startsWith(item.url);
          return (
            <NavLink key={item.url} to={item.url} end={item.url === "/student"}
              className="flex flex-col items-center gap-1 p-1 text-muted-foreground"
              activeClassName="text-primary">
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

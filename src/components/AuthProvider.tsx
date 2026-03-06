import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  cedula: string;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  avatar_url: string | null;
  password_changed: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  activo: boolean;
  loading: boolean;
  signIn: (cedula: string, password: string) => Promise<{ error?: string; needsPasswordChange?: boolean }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
    const { data: r } = await supabase.from("user_roles").select("rol, activo").eq("user_id", userId).single();
    if (p) setProfile(p as Profile);
    if (r) {
      setRole(r.rol);
      setActivo(r.activo ?? true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (cedula: string, password: string) => {
    const email = `${cedula}@medd.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login")) return { error: "Cédula o contraseña incorrecta." };
      return { error: error.message };
    }
    // After sign in, check profile
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      await fetchProfile(u.id);
      const { data: p } = await supabase.from("profiles").select("password_changed").eq("id", u.id).single();
      if (p && !p.password_changed) return { needsPasswordChange: true };

      const { data: r } = await supabase.from("user_roles").select("activo").eq("user_id", u.id).single();
      if (r && !r.activo) {
        await supabase.auth.signOut();
        return { error: "Cuenta bloqueada. Contacte al administrador." };
      }
    }
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    if (user) {
      await supabase.from("profiles").update({ password_changed: true }).eq("id", user.id);
      setProfile(prev => prev ? { ...prev, password_changed: true } : null);
    }
    return {};
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, activo, loading, signIn, signOut, changePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

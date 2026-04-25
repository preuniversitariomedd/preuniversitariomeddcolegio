import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { encodeStorage, decodeStorage } from "@/lib/security";

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
  signOut: (reason?: "manual" | "inactividad" | "expirada") => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ── Rate limiting (B1 + B7 ofuscación) ───────────────────────────────
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const keyIntentos = (c: string) => `medd_int_${c}`;
const keyBloqueo = (c: string) => `medd_blk_${c}`;

function leerIntentos(cedula: string): number {
  const raw = localStorage.getItem(keyIntentos(cedula));
  if (!raw) return 0;
  const dec = decodeStorage(raw);
  const n = parseInt(dec, 10);
  return Number.isFinite(n) ? n : 0;
}
function escribirIntentos(cedula: string, n: number) {
  localStorage.setItem(keyIntentos(cedula), encodeStorage(String(n)));
}
function leerBloqueo(cedula: string): number {
  const raw = localStorage.getItem(keyBloqueo(cedula));
  if (!raw) return 0;
  const dec = decodeStorage(raw);
  const n = parseInt(dec, 10);
  return Number.isFinite(n) ? n : 0;
}
function escribirBloqueo(cedula: string, ts: number) {
  localStorage.setItem(keyBloqueo(cedula), encodeStorage(String(ts)));
}
function limpiarRateLimit(cedula: string) {
  localStorage.removeItem(keyIntentos(cedula));
  localStorage.removeItem(keyBloqueo(cedula));
}

// ── Timeout de inactividad (B9) ──────────────────────────────────────
const INACTIVIDAD_MS = 60 * 60 * 1000; // 60 min

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const inactividadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
    const { data: r } = await supabase.from("user_roles").select("rol, activo").eq("user_id", userId).single();
    if (p) setProfile(p as Profile);
    if (r) {
      setRole(r.rol);
      setActivo(r.activo ?? true);
    }
  };

  const signOut = useCallback(async (reason: "manual" | "inactividad" | "expirada" = "manual") => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    if (reason !== "manual") {
      sessionStorage.setItem("medd_logout_reason", reason);
    }
  }, []);

  const resetInactividad = useCallback(() => {
    if (inactividadTimer.current) clearTimeout(inactividadTimer.current);
    inactividadTimer.current = setTimeout(() => {
      signOut("inactividad");
    }, INACTIVIDAD_MS);
  }, [signOut]);

  // ── Listeners de actividad cuando hay sesión ──
  useEffect(() => {
    if (!user) {
      if (inactividadTimer.current) clearTimeout(inactividadTimer.current);
      return;
    }
    resetInactividad();
    const events: (keyof DocumentEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handler = () => resetInactividad();
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
      if (inactividadTimer.current) clearTimeout(inactividadTimer.current);
    };
  }, [user, resetInactividad]);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED" && !session) {
        // Refresh falló → sesión expirada
        sessionStorage.setItem("medd_logout_reason", "expirada");
      }
      if (session?.user) {
        setUser(session.user);
        // Use setTimeout to avoid Supabase deadlock on simultaneous calls
        setTimeout(() => fetchProfile(session.user.id).then(() => setLoading(false)), 0);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Then check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (cedula: string, password: string) => {
    // ── Rate limit ──
    const ahora = Date.now();
    const bloqueadoHasta = leerBloqueo(cedula);
    if (bloqueadoHasta > ahora) {
      const min = Math.ceil((bloqueadoHasta - ahora) / 60000);
      return { error: `Cuenta bloqueada por demasiados intentos. Espera ${min} ${min === 1 ? "minuto" : "minutos"}.` };
    }
    if (bloqueadoHasta && bloqueadoHasta <= ahora) {
      limpiarRateLimit(cedula);
    }

    const email = `${cedula}@medd.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const intentos = leerIntentos(cedula) + 1;
      if (intentos >= MAX_INTENTOS) {
        escribirBloqueo(cedula, ahora + BLOQUEO_MS);
        escribirIntentos(cedula, 0);
        return { error: "Cuenta bloqueada por 15 minutos tras 5 intentos fallidos." };
      }
      escribirIntentos(cedula, intentos);
      const restantes = MAX_INTENTOS - intentos;
      if (error.message.includes("Invalid login")) {
        return { error: `Cédula o contraseña incorrecta. Te quedan ${restantes} ${restantes === 1 ? "intento" : "intentos"}.` };
      }
      return { error: error.message };
    }

    // Éxito → limpiar rate-limit
    limpiarRateLimit(cedula);

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

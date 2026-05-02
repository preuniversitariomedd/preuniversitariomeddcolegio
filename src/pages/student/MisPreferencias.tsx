// ============================================================
// Mis Preferencias — favoritas, filtros guardados y top 5 personal
// © 2020-2026 PreUniversitario MEDD — Víctor Cañizares González
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ExternalLink, Trash2, Save, Sparkles, Columns3, Compass, History, Check, Loader2 } from "lucide-react";
import { CARRERAS_ESPOL, AREAS_CARRERA, getCarreraById, type AreaCarrera } from "@/data/carrerasEspol";
import { calcularCompatibilidad, normalizarPerfil } from "@/lib/compatibilidadVocacional";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Preferencias = {
  ciudades: string[];
  tipoCosto: "publica" | "privada" | "ambas";
  modalidad: "presencial" | "online" | "semipresencial" | "todas";
  areas: AreaCarrera[];
};

const DEFAULT_PREFS: Preferencias = {
  ciudades: [],
  tipoCosto: "ambas",
  modalidad: "todas",
  areas: [],
};

const CIUDADES = ["Guayaquil", "Quito", "Cuenca", "Manta", "Loja", "Ambato"];

export default function MisPreferencias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [prefs, setPrefs] = useState<Preferencias>(DEFAULT_PREFS);
  const [notas, setNotas] = useState<Record<string, string>>({});

  // Perfil: preferencias guardadas
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile-prefs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferencias_carrera")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const p = (profile as any)?.preferencias_carrera;
    if (p) setPrefs({ ...DEFAULT_PREFS, ...p });
  }, [profile]);

  // Favoritas
  const { data: favoritas, isLoading: loadingFavs } = useQuery({
    queryKey: ["favoritas-detalle", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carreras_favoritas")
        .select("carrera_id, notas")
        .eq("user_id", user!.id)
        .order("fecha", { ascending: false });
      if (error) throw error;
      const init: Record<string, string> = {};
      (data || []).forEach((r) => { init[r.carrera_id] = r.notas || ""; });
      setNotas(init);
      return data || [];
    },
    enabled: !!user,
  });

  // Resultados de tests
  const { data: resultados } = useQuery({
    queryKey: ["resultados-tests-prefs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_tests")
        .select("test_id, puntaje_total, fecha")
        .eq("user_id", user!.id)
        .eq("completado", true)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const guardarPrefs = useMutation({
    mutationFn: async (p: Preferencias) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("profiles")
        .update({ preferencias_carrera: p as any })
        .eq("id", user.id);
      if (error) throw error;
    },
    onMutate: () => setAutosaveState("saving"),
    onSuccess: () => {
      setAutosaveState("saved");
      qc.invalidateQueries({ queryKey: ["profile-prefs", user?.id] });
      setTimeout(() => setAutosaveState("idle"), 1500);
    },
    onError: (e: any) => {
      setAutosaveState("idle");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Auto-save con debounce: ignora la primera carga (cuando profile carga prefs en estado)
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => {
    if (profile && !hidratado) setHidratado(true);
  }, [profile, hidratado]);
  useEffect(() => {
    if (!hidratado || !user) return;
    const t = setTimeout(() => guardarPrefs.mutate(prefs), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, hidratado, user]);

  // Historial de comparaciones
  const { data: historial } = useQuery({
    queryKey: ["historial-comparaciones", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historial_comparaciones" as any)
        .select("id, carrera_ids, fecha")
        .eq("user_id", user!.id)
        .order("fecha", { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!user,
  });

  const eliminarHistorial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("historial_comparaciones" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["historial-comparaciones", user?.id] }),
  });

  const guardarNota = useMutation({
    mutationFn: async ({ carreraId, texto }: { carreraId: string; texto: string }) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("carreras_favoritas")
        .update({ notas: texto.slice(0, 500) })
        .eq("user_id", user.id)
        .eq("carrera_id", carreraId);
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Nota guardada" }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const eliminarFav = useMutation({
    mutationFn: async (carreraId: string) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("carreras_favoritas")
        .delete()
        .eq("user_id", user.id)
        .eq("carrera_id", carreraId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Eliminada de favoritas" });
      qc.invalidateQueries({ queryKey: ["favoritas-detalle", user?.id] });
      qc.invalidateQueries({ queryKey: ["favoritas", user?.id] });
    },
  });

  // Recomendaciones: top 5 que cumplen prefs + perfil psicológico
  const recomendaciones = useMemo(() => {
    const { perfil } = normalizarPerfil(resultados || []);
    const ranking = calcularCompatibilidad(perfil, CARRERAS_ESPOL);

    const cumpleArea = (tags: string[] | undefined) => {
      if (!prefs.areas.length) return true;
      if (!tags) return false;
      return prefs.areas.some((a) => tags.includes(a));
    };
    const cumpleCiudad = (ciudades: string[] | undefined) => {
      if (!prefs.ciudades.length) return true;
      if (!ciudades) return false;
      return prefs.ciudades.some((c) => ciudades.includes(c));
    };
    const cumpleTipo = (t?: "publica" | "privada") =>
      prefs.tipoCosto === "ambas" || t === prefs.tipoCosto;
    const cumpleModal = (m?: string[]) =>
      prefs.modalidad === "todas" || (m && m.includes(prefs.modalidad));

    return ranking
      .filter((r) =>
        cumpleArea(r.carrera.tags) &&
        cumpleCiudad(r.carrera.ciudad) &&
        cumpleTipo(r.carrera.tipoCosto) &&
        cumpleModal(r.carrera.modalidad),
      )
      .slice(0, 5);
  }, [resultados, prefs]);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const compararFavoritas = () => {
    const ids = (favoritas ?? []).slice(0, 3).map((f) => f.carrera_id);
    if (!ids.length) return;
    // Pasamos la primera; las otras quedan disponibles en el selector
    navigate(`/student/comparar-carreras?carrera=${encodeURIComponent(ids[0])}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Heart className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Mis preferencias</h1>
            <p className="text-sm text-muted-foreground">Guarda tus carreras favoritas y filtros personales.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/student/orientacion-vocacional">
              <Compass className="h-4 w-4 mr-1" /> Orientación
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/student/comparar-carreras">
              <Columns3 className="h-4 w-4 mr-1" /> Comparar
            </Link>
          </Button>
        </div>
      </header>

      {/* FILTROS PERSONALES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de búsqueda</CardTitle>
          <CardDescription>Estos filtros se usarán al recomendarte carreras.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium mb-2">Ciudad preferida</p>
            <div className="flex flex-wrap gap-1.5">
              {CIUDADES.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={prefs.ciudades.includes(c) ? "default" : "outline"}
                  onClick={() => setPrefs({ ...prefs, ciudades: toggle(prefs.ciudades, c) })}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2">Tipo de universidad</p>
            <div className="flex flex-wrap gap-1.5">
              {(["ambas", "publica", "privada"] as const).map((t) => (
                <Button key={t} size="sm" variant={prefs.tipoCosto === t ? "default" : "outline"}
                  onClick={() => setPrefs({ ...prefs, tipoCosto: t })} className="capitalize">
                  {t === "ambas" ? "Ambas" : t === "publica" ? "Pública" : "Privada"}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2">Modalidad</p>
            <div className="flex flex-wrap gap-1.5">
              {(["todas", "presencial", "online", "semipresencial"] as const).map((m) => (
                <Button key={m} size="sm" variant={prefs.modalidad === m ? "default" : "outline"}
                  onClick={() => setPrefs({ ...prefs, modalidad: m })} className="capitalize">
                  {m}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2">Áreas de interés</p>
            <div className="flex flex-wrap gap-1.5">
              {AREAS_CARRERA.map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={prefs.areas.includes(a) ? "default" : "outline"}
                  onClick={() => setPrefs({ ...prefs, areas: toggle(prefs.areas, a) })}
                  className="capitalize"
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
          <div className="pt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            {autosaveState === "saving" && (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…</>)}
            {autosaveState === "saved" && (<><Check className="h-3.5 w-3.5 text-emerald-500" /> Guardado automáticamente</>)}
            {autosaveState === "idle" && hidratado && (<span>Los cambios se guardan automáticamente.</span>)}
          </div>
        </CardContent>
      </Card>

      {/* RECOMENDACIONES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Recomendadas para ti
          </CardTitle>
          <CardDescription>
            Top 5 que combinan tus filtros + tu perfil psicológico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recomendaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin coincidencias. Prueba ampliando los filtros.
            </p>
          ) : (
            recomendaciones.map((r, i) => (
              <div key={r.carrera.id}
                className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card hover:bg-accent transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}.</span>
                  <span className="text-2xl">{r.carrera.icono}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.carrera.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.carrera.siglaUniversidad ?? "ESPOL"} · {r.carrera.siglaFacultad}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary">{r.porcentaje}%</Badge>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to={`/student/comparar-carreras?carrera=${r.carrera.id}`}>
                      <Columns3 className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* FAVORITAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Mis carreras favoritas</CardTitle>
              <CardDescription>{favoritas?.length ?? 0} carrera(s) guardada(s).</CardDescription>
            </div>
            {(favoritas?.length ?? 0) > 0 && (
              <Button size="sm" variant="outline" onClick={compararFavoritas}>
                <Columns3 className="h-4 w-4 mr-1" /> Comparar seleccionadas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingFavs && (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          )}
          {!loadingFavs && (favoritas?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Aún no tienes carreras favoritas. Agrégalas desde la comparación o la orientación vocacional.
            </p>
          )}
          {(favoritas ?? []).map((f) => {
            const c = getCarreraById(f.carrera_id);
            if (!c) return null;
            return (
              <div key={f.carrera_id} className="p-4 rounded-md border bg-card space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl">{c.icono}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.siglaUniversidad ?? "ESPOL"} · {c.siglaFacultad}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {c.urlCarrera && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={c.urlCarrera} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/student/comparar-carreras?carrera=${c.id}`}>
                        <Columns3 className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => eliminarFav.mutate(c.id)} disabled={eliminarFav.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mis notas</label>
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={notas[c.id] ?? ""}
                    onChange={(e) => setNotas({ ...notas, [c.id]: e.target.value })}
                    placeholder="¿Por qué te interesa esta carrera?"
                    className="mt-1 text-sm"
                  />
                  <div className="flex justify-end mt-1">
                    <Button size="sm" variant="ghost"
                      onClick={() => guardarNota.mutate({ carreraId: c.id, texto: notas[c.id] ?? "" })}
                      disabled={guardarNota.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Guardar nota
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

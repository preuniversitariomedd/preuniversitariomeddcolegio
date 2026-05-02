// ============================================================
// Comparar carreras (hasta 3) — tabla lado a lado, compatibilidad
// con perfil del estudiante, favoritas y enlaces oficiales.
// © 2020-2026 PreUniversitario MEDD — Víctor Cañizares González
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, X, Columns3, ExternalLink, Heart, AlertCircle, Search, FileDown, ChevronDown, Info,
} from "lucide-react";
import { CARRERAS_ESPOL, getCarreraById, type CarreraEspol } from "@/data/carrerasEspol";
import { calcularCompatibilidad, normalizarPerfil, type DesgloseIndicador } from "@/lib/compatibilidadVocacional";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Slot = CarreraEspol | null;

function CarreraPicker({ onSelect, exclude }: { onSelect: (c: CarreraEspol) => void; exclude: string[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [universidad, setUniversidad] = useState<string>("todas");

  const universidades = useMemo(() => {
    const set = new Set<string>();
    CARRERAS_ESPOL.forEach((c) => c.siglaUniversidad && set.add(c.siglaUniversidad));
    return Array.from(set);
  }, []);

  const list = useMemo(
    () =>
      CARRERAS_ESPOL.filter((c) => {
        if (exclude.includes(c.id)) return false;
        if (universidad !== "todas" && c.siglaUniversidad !== universidad) return false;
        if (q && !c.nombre.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [q, exclude, universidad],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full h-32 border-dashed">
          <Plus className="h-5 w-5 mr-2" /> Seleccionar carrera
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Elegir carrera</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant={universidad === "todas" ? "default" : "outline"} onClick={() => setUniversidad("todas")}>
              Todas
            </Button>
            {universidades.map((u) => (
              <Button key={u} size="sm" variant={universidad === u ? "default" : "outline"} onClick={() => setUniversidad(u)}>
                {u}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-220px)] mt-4">
          <div className="space-y-2 pr-3">
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelect(c); setOpen(false); }}
                className="w-full text-left p-3 rounded-md border bg-card hover:bg-accent transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">{c.icono}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.nombre}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.siglaUniversidad ?? "ESPOL"} · {c.siglaFacultad}
                  </div>
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin resultados.</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

const demandaColor: Record<string, string> = {
  alta: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  baja: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function DemandaBadge({ d }: { d?: "alta" | "media" | "baja" }) {
  if (!d) return <span className="text-muted-foreground">—</span>;
  const emoji = d === "alta" ? "🟢" : d === "media" ? "🟡" : "🔴";
  return (
    <Badge variant="outline" className={`${demandaColor[d]} border-0 capitalize`}>
      {emoji} {d}
    </Badge>
  );
}

function FilaTabla({ label, values, render, header }: {
  label: string;
  values: (CarreraEspol | null)[];
  render?: (c: CarreraEspol) => React.ReactNode;
  header?: boolean;
}) {
  if (header) {
    return (
      <tr className="bg-muted/50">
        <td colSpan={values.length + 1} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </td>
      </tr>
    );
  }
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 text-xs font-medium text-muted-foreground align-top whitespace-nowrap">{label}</td>
      {values.map((c, i) => (
        <td key={i} className="px-3 py-2 text-sm align-top">
          {c && render ? render(c) : <span className="text-muted-foreground">—</span>}
        </td>
      ))}
    </tr>
  );
}

export default function CompararCarreras() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const carreraInicialId = searchParams.get("carrera");

  const [slots, setSlots] = useState<[Slot, Slot, Slot]>([null, null, null]);

  // Preselección por query params (puede haber varios ?carrera=)
  useEffect(() => {
    const ids = searchParams.getAll("carrera");
    if (!ids.length) return;
    setSlots((prev) => {
      const next = [...prev] as [Slot, Slot, Slot];
      ids.forEach((id) => {
        const c = getCarreraById(id);
        if (!c) return;
        if (next.some((s) => s?.id === c.id)) return;
        const empty = next.findIndex((s) => s === null);
        if (empty >= 0) next[empty] = c;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carreraInicialId]);

  // Resultados de tests para compatibilidad
  const { data: resultados } = useQuery({
    queryKey: ["resultados-tests-compare", user?.id],
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

  // Favoritas
  const { data: favoritas } = useQuery({
    queryKey: ["favoritas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carreras_favoritas")
        .select("carrera_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data || []).map((r) => r.carrera_id));
    },
    enabled: !!user,
  });

  const toggleFav = useMutation({
    mutationFn: async (carreraId: string) => {
      if (!user) throw new Error("No autenticado");
      if (favoritas?.has(carreraId)) {
        const { error } = await supabase
          .from("carreras_favoritas")
          .delete()
          .eq("user_id", user.id)
          .eq("carrera_id", carreraId);
        if (error) throw error;
        return "removed";
      } else {
        const { error } = await supabase
          .from("carreras_favoritas")
          .insert({ user_id: user.id, carrera_id: carreraId });
        if (error) throw error;
        return "added";
      }
    },
    onSuccess: (r) => {
      toast({ title: r === "added" ? "Agregada a favoritas" : "Quitada de favoritas" });
      qc.invalidateQueries({ queryKey: ["favoritas", user?.id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const { perfil, testsUsados, ranking } = useMemo(() => {
    const r = resultados || [];
    const { perfil, testsUsados } = normalizarPerfil(r);
    const ranking = calcularCompatibilidad(perfil, CARRERAS_ESPOL);
    return { perfil, testsUsados, ranking };
  }, [resultados]);

  const compatibilidadDe = (id: string) =>
    ranking.find((r) => r.carrera.id === id)?.porcentaje ?? null;

  const setSlot = (i: 0 | 1 | 2, c: Slot) => {
    setSlots((prev) => {
      const next = [...prev] as [Slot, Slot, Slot];
      next[i] = c;
      return next;
    });
  };

  const excluded = slots.filter(Boolean).map((c) => c!.id);
  const algunaSeleccionada = slots.some(Boolean);
  const sinTests = testsUsados === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Columns3 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Comparar carreras</h1>
            <p className="text-sm text-muted-foreground">Compara hasta 3 carreras lado a lado.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/student/mis-preferencias">
            <Heart className="h-4 w-4 mr-1" /> Mis preferencias
          </Link>
        </Button>
      </header>

      {sinTests && algunaSeleccionada && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tu compatibilidad no está disponible</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
            <span>Completa los tests psicológicos para ver tu compatibilidad con cada carrera.</span>
            <Button size="sm" variant="outline" onClick={() => navigate("/student/psicometria")}>
              Ir a tests →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* SELECTOR DE CARRERAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => {
          const c = slots[i as 0 | 1 | 2];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            >
              {!c ? (
                <CarreraPicker onSelect={(x) => setSlot(i as 0 | 1 | 2, x)} exclude={excluded} />
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-3xl">{c.icono}</span>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{c.nombre}</CardTitle>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.siglaUniversidad ?? "ESPOL"} · {c.siglaFacultad}
                          </p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setSlot(i as 0 | 1 | 2, null)} aria-label="Quitar">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(c.tags ?? []).slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {c.urlCarrera && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={c.urlCarrera} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver más
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={favoritas?.has(c.id) ? "default" : "outline"}
                        onClick={() => toggleFav.mutate(c.id)}
                        disabled={toggleFav.isPending}
                      >
                        <Heart className={`h-3.5 w-3.5 mr-1 ${favoritas?.has(c.id) ? "fill-current" : ""}`} />
                        {favoritas?.has(c.id) ? "Favorita" : "Favorita"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* TABLA DE COMPARACIÓN */}
      {algunaSeleccionada && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Tabla comparativa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <FilaTabla label="Información general" values={slots} header />
                  <FilaTabla label="Universidad" values={slots}
                    render={(c) => <span className="font-medium">{c.siglaUniversidad ?? "ESPOL"}</span>} />
                  <FilaTabla label="Facultad" values={slots} render={(c) => c.siglaFacultad} />
                  <FilaTabla label="Ciudad" values={slots} render={(c) => (c.ciudad ?? ["Guayaquil"]).join(", ")} />
                  <FilaTabla label="Tipo" values={slots}
                    render={(c) => (
                      <Badge variant="outline" className="capitalize">
                        {c.tipoCosto === "privada" ? "Privada" : "Pública"}
                      </Badge>
                    )} />
                  <FilaTabla label="Modalidad" values={slots}
                    render={(c) => (c.modalidad ?? ["presencial"]).map((m) => (
                      <Badge key={m} variant="secondary" className="mr-1 capitalize text-[10px]">{m}</Badge>
                    ))} />
                  <FilaTabla label="Duración" values={slots} render={(c) => c.duracion ?? "—"} />
                  <FilaTabla label="Costo aprox." values={slots}
                    render={(c) => c.tipoCosto === "privada"
                      ? <span className="text-amber-700 dark:text-amber-300">Privada (consultar)</span>
                      : <span className="text-emerald-700 dark:text-emerald-300">Gratuita (SENESCYT)</span>} />

                  <FilaTabla label="Campo laboral" values={slots} header />
                  <FilaTabla label="Lugares de trabajo" values={slots}
                    render={(c) => (
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                        {c.campoLaboral.slice(0, 5).map((x) => <li key={x}>{x}</li>)}
                      </ul>
                    )} />
                  <FilaTabla label="Demanda laboral" values={slots} render={(c) => <DemandaBadge d={c.demandaLaboral} />} />
                  <FilaTabla label="Salario promedio" values={slots}
                    render={(c) => <span className="font-mono text-xs">{c.salarioPromedioEcuador ?? "—"}</span>} />

                  <FilaTabla label="Compatibilidad con tu perfil" values={slots} header />
                  <FilaTabla label="% compatibilidad" values={slots}
                    render={(c) => {
                      const pct = compatibilidadDe(c.id);
                      if (pct === null || sinTests) return <span className="text-muted-foreground text-xs">Completa los tests</span>;
                      return (
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-primary">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    }} />
                  <FilaTabla label="Estilos sugeridos" values={slots}
                    render={(c) => (c.estilosAprendizaje ?? []).length
                      ? (c.estilosAprendizaje ?? []).map((e) => (
                          <Badge key={e} variant="outline" className="mr-1 text-[10px]">{e}</Badge>
                        ))
                      : "—"} />
                  <FilaTabla label="Empatía requerida" values={slots}
                    render={(c) => (
                      <div className="min-w-[100px]">
                        <Progress value={c.perfilIdeal.empatia} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground">{c.perfilIdeal.empatia}%</span>
                      </div>
                    )} />
                  <FilaTabla label="H. sociales" values={slots}
                    render={(c) => (
                      <div className="min-w-[100px]">
                        <Progress value={c.perfilIdeal.habilidadesSociales} className="h-1.5" />
                        <span className="text-[10px] text-muted-foreground">{c.perfilIdeal.habilidadesSociales}%</span>
                      </div>
                    )} />

                  <FilaTabla label="Examen de admisión" values={slots} header />
                  <FilaTabla label="Materias clave" values={slots}
                    render={(c) => (
                      <div className="flex flex-wrap gap-1">
                        {c.materiasClaveESPOL.map((m) => <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>)}
                      </div>
                    )} />
                  <FilaTabla label="Información oficial" values={slots}
                    render={(c) => c.urlCarrera ? (
                      <a href={c.urlCarrera} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center text-primary hover:underline text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" /> Ver carrera
                      </a>
                    ) : "—"} />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!algunaSeleccionada && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Selecciona al menos una carrera para comenzar la comparación.
        </p>
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Datos referenciales basados en información pública de la ESPOL.
        Los salarios y demanda laboral son estimaciones del mercado ecuatoriano.
      </p>
    </div>
  );
}

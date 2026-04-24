import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Sparkles, Download, Save, ChevronDown, Compass } from "lucide-react";
import { CARRERAS_ESPOL } from "@/data/carrerasEspol";
import {
  calcularCompatibilidad,
  normalizarPerfil,
  type ResultadoCompatibilidad,
} from "@/lib/compatibilidadVocacional";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

// Anillo SVG circular animado
function RingPercentage({ value, size = 110, stroke = 10, color = "hsl(var(--primary))" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  const offset = c - (shown / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" className="fill-foreground font-display font-bold" fontSize={size / 4}>
        {shown}%
      </text>
    </svg>
  );
}

function CarreraCard({ resultado, rank, expanded, onToggle }: { resultado: ResultadoCompatibilidad; rank: number; expanded: boolean; onToggle: () => void }) {
  const { carrera, porcentaje, factoresPositivos, factoresADesarrollar } = resultado;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.1 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <RingPercentage value={porcentaje} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl">{carrera.icono}</span>
                    <h3 className="font-display font-bold text-lg leading-tight">{carrera.nombre}</h3>
                    {rank === 0 && (
                      <Badge className="bg-primary text-primary-foreground"><Sparkles className="h-3 w-3 mr-1" />Recomendada</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{carrera.facultad} <span className="opacity-60">· {carrera.siglaFacultad}</span></p>
                </div>
              </div>
              <Progress value={porcentaje} className="mt-3 h-2" />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {factoresPositivos.map((f) => (
                  <Badge key={f} variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[11px]">{f}</Badge>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={onToggle} className="mt-2 -ml-2 h-7 text-xs">
                {expanded ? "Ocultar detalles" : "Ver detalles"}
                <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border space-y-3 text-sm">
              <p className="text-muted-foreground italic">{carrera.descripcion}</p>
              <div>
                <h4 className="font-semibold mb-1">Campo laboral</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {carrera.campoLaboral.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Materias clave en ESPOL</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {carrera.materiasClaveESPOL.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
                </div>
              </div>
              {factoresADesarrollar.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-1 text-amber-700 dark:text-amber-400">A desarrollar</h4>
                  <div className="flex gap-1.5 flex-wrap">
                    {factoresADesarrollar.map((f) => <Badge key={f} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">{f}</Badge>)}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OrientacionVocacional() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Resultados de tests del estudiante
  const { data: resultados, isLoading } = useQuery({
    queryKey: ["resultados-tests-mios", user?.id],
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

  // Orientación guardada (si existe)
  const { data: orientacionGuardada } = useQuery({
    queryKey: ["orientacion-vocacional", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orientacion_vocacional")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { perfil, testsUsados, ranking, fechaMasReciente } = useMemo(() => {
    const r = resultados || [];
    const { perfil, testsUsados } = normalizarPerfil(r);
    const ranking = calcularCompatibilidad(perfil, CARRERAS_ESPOL);
    const fecha = r.length > 0 ? new Date(r[0].fecha).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" }) : null;
    return { perfil, testsUsados, ranking, fechaMasReciente: fecha };
  }, [resultados]);

  const guardarMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No autenticado");
      const top5 = ranking.slice(0, 5).map((r) => ({ id: r.carrera.id, nombre: r.carrera.nombre, porcentaje: r.porcentaje }));
      const { error } = await supabase.from("orientacion_vocacional").upsert(
        {
          user_id: user.id,
          top_carreras: top5,
          carrera_elegida: ranking[0]?.carrera.id ?? null,
          perfil_normalizado: perfil as any,
          tests_usados: testsUsados,
          fecha_calculo: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Resultados guardados", description: "Tu orientación vocacional fue actualizada." });
      qc.invalidateQueries({ queryKey: ["orientacion-vocacional", user?.id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function descargarTexto() {
    const lineas: string[] = [];
    lineas.push("ORIENTACIÓN VOCACIONAL — MEDD / ESPOL");
    lineas.push(`Generado: ${new Date().toLocaleString("es-EC")}`);
    lineas.push(`Tests utilizados: ${testsUsados} de 3`);
    lineas.push(`\nPerfil: Empatía ${perfil.empatia}% · Prosocial ${perfil.prosocial}% · Habilidades sociales ${perfil.habilidadesSociales}%\n`);
    lineas.push("TOP 5 CARRERAS:");
    ranking.slice(0, 5).forEach((r, i) => {
      lineas.push(`${i + 1}. ${r.carrera.nombre} — ${r.porcentaje}%`);
      lineas.push(`   Facultad: ${r.carrera.facultad}`);
      lineas.push(`   Positivos: ${r.factoresPositivos.join(", ") || "—"}`);
      lineas.push(`   A desarrollar: ${r.factoresADesarrollar.join(", ") || "—"}\n`);
    });
    if (ranking[0]) {
      lineas.push("PLAN DE ACCIÓN (3 meses):");
      lineas.push(`Mes 1: Conversa con un profesional de ${ranking[0].carrera.nombre} y busca alumnos ESPOL en LinkedIn.`);
      lineas.push(`Mes 2: Refuerza ${ranking[0].carrera.materiasClaveESPOL.join(", ")}.`);
      lineas.push("Mes 3: Realiza al menos 3 simulacros completos del examen ESPOL.");
    }
    const blob = new Blob([lineas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "orientacion-vocacional.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const insuficientes = testsUsados < 3;
  const facultades = useMemo(() => {
    const map = new Map<string, { sigla: string; carreras: ResultadoCompatibilidad[] }>();
    for (const r of ranking) {
      const key = r.carrera.facultad;
      if (!map.has(key)) map.set(key, { sigla: r.carrera.siglaFacultad, carreras: [] });
      map.get(key)!.carreras.push(r);
    }
    return Array.from(map.entries()).map(([nombre, v]) => ({
      nombre, sigla: v.sigla, carreras: v.carreras,
      promedio: Math.round(v.carreras.reduce((s, x) => s + x.porcentaje, 0) / v.carreras.length),
    })).sort((a, b) => b.promedio - a.promedio);
  }, [ranking]);

  const radarData = [
    { dim: "Empatía", valor: perfil.empatia },
    { dim: "Prosocial", valor: perfil.prosocial },
    { dim: "H. Sociales", valor: perfil.habilidadesSociales },
  ];

  const top1 = ranking[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl flex items-center gap-2">
            <Compass className="h-7 w-7 text-primary" /> Orientación Vocacional
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Compatibilidad con las carreras de ESPOL según tu perfil psicológico.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={descargarTexto}><Download className="h-4 w-4 mr-1" />Descargar</Button>
          <Button size="sm" onClick={() => guardarMut.mutate()} disabled={guardarMut.isPending}>
            {guardarMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar mis resultados
          </Button>
        </div>
      </div>

      {insuficientes && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Resultados parciales</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
            <span>Para obtener resultados más precisos, completa al menos 3 de los tests psicológicos disponibles. Tienes <b>{testsUsados}</b> completado(s) de los 3 que usa el algoritmo (IRI, EHS, Prosocial).</span>
            <Button size="sm" variant="outline" onClick={() => navigate("/student/psicometria")}>Ir a tests</Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="carreras">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="carreras">Mis carreras</TabsTrigger>
          <TabsTrigger value="perfil">Factores de mi perfil</TabsTrigger>
          <TabsTrigger value="mapa">Mapa ESPOL</TabsTrigger>
          <TabsTrigger value="plan">Plan de acción</TabsTrigger>
        </TabsList>

        <TabsContent value="carreras" className="space-y-3">
          {(showAll ? ranking : ranking.slice(0, 5)).map((r, i) => (
            <CarreraCard key={r.carrera.id} resultado={r} rank={i}
              expanded={expandedId === r.carrera.id}
              onToggle={() => setExpandedId(expandedId === r.carrera.id ? null : r.carrera.id)} />
          ))}
          <div className="text-center pt-2">
            <Button variant="outline" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Ver solo top 5" : `Ver todas las carreras (${ranking.length})`}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tus dimensiones</CardTitle>
              <CardDescription>{fechaMasReciente ? `Basado en tus resultados al ${fechaMasReciente}.` : "Sin resultados aún. Se usan valores neutros (50%)."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Empatía (IRI)", val: perfil.empatia, desc: "Capacidad de entender y compartir lo que sienten otros. Alta en carreras de salud, educación y psicología." },
                { label: "Conducta prosocial", val: perfil.prosocial, desc: "Disposición a ayudar y cooperar. Importante en medicina, educación y trabajo social." },
                { label: "Habilidades sociales (EHS)", val: perfil.habilidadesSociales, desc: "Comunicación efectiva y manejo interpersonal. Clave en administración, educación y psicología." },
              ].map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{d.label}</span>
                    <span className="text-muted-foreground">{d.val}%</span>
                  </div>
                  <Progress value={d.val} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mapa de tu perfil</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dim" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.45} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapa" className="space-y-3">
          {facultades.map((f) => (
            <Card key={f.nombre}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{f.nombre}</CardTitle>
                    <CardDescription>{f.sigla} · {f.carreras.length} carrera(s)</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-display font-bold text-primary">{f.promedio}%</span>
                  </div>
                </div>
                <Progress value={f.promedio} className="h-2 mt-2" />
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {f.carreras.map((c) => (
                  <div key={c.carrera.id} className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
                    <span>{c.carrera.icono} {c.carrera.nombre}</span>
                    <Badge variant="secondary">{c.porcentaje}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          {!top1 ? (
            <p className="text-muted-foreground">Completa los tests para generar tu plan personalizado.</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Plan de acción de 3 meses</CardTitle>
                  <CardDescription>Basado en tu carrera #1: <b>{top1.carrera.nombre}</b> ({top1.porcentaje}% de compatibilidad)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-primary mb-1">Mes 1 — Confirmación vocacional</h4>
                    <p>Conversa con un profesional de <b>{top1.carrera.nombre}</b>. Busca en LinkedIn alumnos ESPOL de esa carrera y pregúntales por su día a día y los retos del primer año.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-1">Mes 2 — Refuerzo académico</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {top1.carrera.materiasClaveESPOL.map((m) => (
                        <li key={m}><b>{m}:</b> dedica al menos 3 horas semanales con ejercicios resueltos paso a paso.</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-1">Mes 3 — Simulacros ESPOL</h4>
                    <p>Realiza mínimo 3 simulacros completos del examen de admisión. Cronometra cada bloque y revisa cada error.</p>
                  </div>
                  {top1.factoresADesarrollar.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <h4 className="font-semibold mb-1">Bonus — Desarrollo personal</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {top1.factoresADesarrollar.map((f) => (
                          <li key={f}>Mejora tu <b>{f.toLowerCase()}</b>: practica el ejercicio sugerido en el test correspondiente y vuelve a tomarlo en 1 mes.</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
        Esta orientación es una guía educativa basada en tus características personales. La decisión final siempre es tuya.
      </p>
      {orientacionGuardada && (
        <p className="text-xs text-muted-foreground text-center">Última versión guardada: {new Date(orientacionGuardada.fecha_calculo).toLocaleString("es-EC")}</p>
      )}
    </div>
  );
}

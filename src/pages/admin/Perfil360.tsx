import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, Brain, Sparkles, GraduationCap, Target, AlertTriangle, Lightbulb, Heart, BookOpen } from "lucide-react";
import { construirPerfil360, type ResultadoTest } from "@/lib/perfil360";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AdminPerfil360() {
  const { id } = useParams();

  const { data: profile, isLoading: lp } = useQuery({
    queryKey: ["profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: resultados, isLoading: lr } = useQuery({
    queryKey: ["resultados-tests", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_tests")
        .select("test_id, puntaje_por_subescala, puntaje_total, fecha")
        .eq("user_id", id!)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data || []) as ResultadoTest[];
    },
  });

  const perfil = useMemo(
    () => (resultados ? construirPerfil360(resultados, profile?.fecha_nacimiento ?? null) : null),
    [resultados, profile],
  );

  if (lp || lr) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">Estudiante no encontrado.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/estudiantes"><ArrowLeft className="h-4 w-4 mr-1" /> Estudiantes</Link>
        </Button>
      </div>

      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> Perfil 360°
        </h1>
        <p className="text-muted-foreground">
          {profile.nombre} {profile.apellidos} · CI {profile.cedula}
        </p>
      </header>

      {!perfil || perfil.testsCompletados === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">El estudiante aún no ha completado ningún test psicométrico.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header de completitud */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Completitud del perfil</span>
                <span className="text-muted-foreground">{perfil.testsCompletados} tests · {perfil.porcentajeCompletitud}%</span>
              </div>
              <Progress value={perfil.porcentajeCompletitud} />
              <p className="text-xs text-muted-foreground">
                Confianza del análisis: {perfil.porcentajeCompletitud >= 60 ? "Alta" : perfil.porcentajeCompletitud >= 30 ? "Media" : "Parcial"}
              </p>
            </CardContent>
          </Card>

          {/* Edad mental + Estilo DUA */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Brain className="h-5 w-5 text-primary" /> Edad mental estimada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {perfil.edadMental ? (
                  <>
                    <div className="text-center py-3 bg-muted rounded-lg">
                      <p className="text-5xl font-bold text-primary">{perfil.edadMental.valor}</p>
                      <p className="text-xs text-muted-foreground mt-1">años · {perfil.edadMental.rango}</p>
                    </div>
                    <p className="text-sm leading-relaxed">{perfil.edadMental.interpretacion}</p>
                    <p className="text-xs text-muted-foreground">
                      Factores usados: {perfil.edadMental.factoresUsados.join(", ")}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Faltan tests para calcularla. Necesarios: Metacognición, Inteligencia Emocional, Pensamiento Analítico, Autoestima o Big Five.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5 text-accent-foreground" /> Estilo de aprendizaje (DUA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span className="font-medium">Representación</span><Badge variant="outline" className="capitalize">{perfil.dua.representacion.canal}</Badge></div>
                  <Progress value={perfil.dua.representacion.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{perfil.dua.representacion.descripcion}</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="font-medium">Acción y expresión</span><Badge variant="outline">{perfil.dua.accion.tipo}</Badge></div>
                  <Progress value={perfil.dua.accion.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{perfil.dua.accion.descripcion}</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="font-medium">Motivación</span><Badge variant="outline">{perfil.dua.motivacion.tipo}</Badge></div>
                  <Progress value={perfil.dua.motivacion.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{perfil.dua.motivacion.descripcion}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inteligencias Múltiples */}
          {perfil.inteligenciasTop.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-5 w-5 text-primary" /> Inteligencias múltiples (Gardner)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={perfil.inteligenciasTop.map(i => ({ subject: i.nombre, A: i.valor }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Rasgos consolidados */}
          {perfil.rasgos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-5 w-5 text-primary" /> Rasgos de personalidad consolidados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, perfil.rasgos.length * 28)}>
                  <BarChart data={perfil.rasgos} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="nombre" width={140} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Vocacional */}
          {perfil.vocacional && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-primary" /> Perfil vocacional Holland</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="text-lg px-3 py-1 font-mono">{perfil.vocacional.codigo}</Badge>
                  <div className="flex gap-1 flex-wrap">
                    {perfil.vocacional.top3.map(t => (
                      <Badge key={t.codigo} variant="outline">{t.nombre} {t.valor}%</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Carreras compatibles:</p>
                  <div className="flex gap-1 flex-wrap">
                    {perfil.vocacional.carreras.map(c => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adaptaciones DUA */}
          {perfil.adaptaciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-primary" /> Adaptaciones DUA recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {perfil.adaptaciones.map((a, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{a.titulo}</p>
                        <Badge variant={a.prioridad === "alta" ? "default" : "secondary"} className="text-[10px]">{a.prioridad}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{a.descripcion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {perfil.alertas.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive"><AlertTriangle className="h-5 w-5" /> Alertas psicopedagógicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {perfil.alertas.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-destructive/5 rounded-md border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium capitalize">{a.tipo} — nivel {a.nivel}</p>
                      <p className="text-xs text-muted-foreground">{a.mensaje}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detalle por subescala */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle por subescala ({perfil.subescalas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {perfil.subescalas.map((s, i) => (
                  <div key={i} className="text-xs space-y-1 p-2 border rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{s.subescalaNombre}</span>
                      <span className="font-mono">{s.porcentaje}%</span>
                    </div>
                    <Progress value={s.porcentaje} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">{s.testNombre}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

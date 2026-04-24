import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Clock,
  Play,
  Eye,
  Search,
  Brain,
  Timer,
  BookOpen,
  Grid3x3,
  Flame,
  Award,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { EJERCICIOS_CONCENTRACION } from "@/data/testdata";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const HABILITADOS = new Set(["stroop"]);

const ICONOS: Record<string, { icon: any; color: string }> = {
  stroop: { icon: Target, color: "text-violet-500" },
  span_digitos: { icon: Brain, color: "text-purple-500" },
  n_back: { icon: Brain, color: "text-fuchsia-500" },
  matrices_d2: { icon: Grid3x3, color: "text-indigo-500" },
  respiracion_coherencia: { icon: Timer, color: "text-amber-500" },
  schulte: { icon: Grid3x3, color: "text-blue-500" },
  punto_focal: { icon: Eye, color: "text-blue-500" },
  busqueda_rapida: { icon: Search, color: "text-green-500" },
  memoria_visual: { icon: Brain, color: "text-purple-500" },
  pomodoro: { icon: Timer, color: "text-amber-500" },
  regla_20_20_20: { icon: Clock, color: "text-orange-500" },
  lectura_rapida: { icon: BookOpen, color: "text-teal-500" },
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Resultado {
  ejercicio_id: string;
  fecha: string;
  metricas: any;
  completado: boolean;
}

export default function StudentConcentracion() {
  const { user } = useAuth();
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - 30);
      const { data } = await supabase
        .from("resultados_ejercicios_concentracion")
        .select("ejercicio_id, fecha, metricas, completado")
        .eq("user_id", user.id)
        .gte("fecha", desde.toISOString())
        .order("fecha", { ascending: false });
      setResultados((data as Resultado[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Días con al menos una sesión completada
    const diasActivos = new Set(
      resultados
        .filter((r) => r.completado)
        .map((r) => new Date(r.fecha).toDateString()),
    );

    // Racha consecutiva contando hacia atrás desde hoy
    let racha = 0;
    const cursor = new Date(hoy);
    while (diasActivos.has(cursor.toDateString())) {
      racha++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Minutos hoy: suma duracion_segundos del día
    const segHoy = resultados
      .filter((r) => new Date(r.fecha).toDateString() === hoy.toDateString())
      .reduce((acc, r) => acc + (Number(r.metricas?.duracion_segundos) || 0), 0);
    const minutosHoy = Math.round(segHoy / 60);

    // Precisión media (aciertos / (aciertos+errores)) sobre últimos 7 días
    const semana = new Date(hoy);
    semana.setDate(semana.getDate() - 7);
    const recientes = resultados.filter((r) => new Date(r.fecha) >= semana);
    let aciertos = 0;
    let errores = 0;
    recientes.forEach((r) => {
      aciertos += Number(r.metricas?.aciertos) || 0;
      errores += Number(r.metricas?.errores) || 0;
    });
    const precision = aciertos + errores > 0 ? Math.round((aciertos / (aciertos + errores)) * 100) : 0;

    // Datos gráfico semanal: minutos por día (lunes a domingo de la semana actual)
    const inicioSemana = new Date(hoy);
    const dow = (inicioSemana.getDay() + 6) % 7; // lunes=0
    inicioSemana.setDate(inicioSemana.getDate() - dow);
    const semanal = DIAS.map((label, i) => {
      const d = new Date(inicioSemana);
      d.setDate(d.getDate() + i);
      const seg = resultados
        .filter((r) => new Date(r.fecha).toDateString() === d.toDateString())
        .reduce((acc, r) => acc + (Number(r.metricas?.duracion_segundos) || 0), 0);
      return { dia: label, minutos: Math.round(seg / 60) };
    });

    // Logros
    const ejerciciosHoy = new Set(
      resultados
        .filter((r) => new Date(r.fecha).toDateString() === hoy.toDateString() && r.completado)
        .map((r) => r.ejercicio_id),
    );
    const logros = [
      { id: "primera", nombre: "Primera sesión", desbloqueado: resultados.some((r) => r.completado) },
      { id: "3dias", nombre: "3 días seguidos", desbloqueado: racha >= 3 },
      { id: "7dias", nombre: "7 días seguidos", desbloqueado: racha >= 7 },
      {
        id: "maestro",
        nombre: "Maestro del enfoque",
        desbloqueado: ejerciciosHoy.size >= EJERCICIOS_CONCENTRACION.length,
      },
    ];

    return { racha, minutosHoy, precision, semanal, logros };
  }, [resultados]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" /> Concentración Visual
            </h1>
            <p className="text-muted-foreground">
              Entrena tu mente para el examen ESPOL.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            Racha: {stats.racha} {stats.racha === 1 ? "día" : "días"}
          </Badge>
        </div>
      </header>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Días seguidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              {stats.racha}
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Minutos hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.minutosHoy} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">Precisión (7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.precision}%</div>
            <Progress value={stats.precision} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Ejercicios */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Ejercicios de hoy</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {EJERCICIOS_CONCENTRACION.map((e, idx) => {
            const habilitado = HABILITADOS.has(e.id);
            const meta = ICONOS[e.id] || { icon: Target, color: "text-primary" };
            const Icon = meta.icon;
            const completadosHoy = resultados.some(
              (r) =>
                r.ejercicio_id === e.id &&
                r.completado &&
                new Date(r.fecha).toDateString() === new Date().toDateString(),
            );
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                        <CardTitle className="text-lg">{e.nombre}</CardTitle>
                      </div>
                      <div className="flex gap-1 items-center">
                        {completadosHoy && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> Hoy
                          </Badge>
                        )}
                        <Badge variant={e.prioridad === "alta" ? "default" : "secondary"} className="text-xs">
                          {e.prioridad === "alta" ? "Alta" : "Media"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{e.descripcion}</p>
                  </CardHeader>
                  <CardContent className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {e.tiempo_estimado} min
                    </div>
                    {habilitado ? (
                      <Button asChild size="sm">
                        <Link to={`/student/concentracion/${e.id}`}>
                          <Play className="h-3 w-3 mr-1" /> Empezar
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        Próximamente
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Progreso semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progreso semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.semanal}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="dia" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: any) => [`${v} min`, "Minutos"]}
                />
                <Bar dataKey="minutos" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Logros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" /> Racha y logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {stats.logros.map((l) => (
              <div
                key={l.id}
                className={`flex flex-col items-center text-center p-4 rounded-lg border ${
                  l.desbloqueado ? "bg-primary/5 border-primary/30" : "bg-muted/30 opacity-60"
                }`}
              >
                {l.desbloqueado ? (
                  <Award className="h-8 w-8 text-amber-500 mb-2" />
                ) : (
                  <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                )}
                <span className="text-xs font-medium">{l.nombre}</span>
              </div>
            ))}
          </div>
          {loading && <p className="text-xs text-muted-foreground mt-3">Cargando datos…</p>}
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, BookOpen, HelpCircle, BarChart3, Award, Clock, Target, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalStudents },
        { count: activeStudents },
        { data: progreso },
        { count: totalQuestions },
        { count: totalSesiones },
        { count: totalCursos },
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("rol", "estudiante"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("rol", "estudiante").eq("activo", true),
        supabase.from("progreso_estudiante").select("porcentaje, preguntas_correctas, intentos_quiz, sesion_id, user_id, tiempo_invertido"),
        supabase.from("quiz_preguntas").select("*", { count: "exact", head: true }),
        supabase.from("sesiones").select("*", { count: "exact", head: true }),
        supabase.from("cursos").select("*", { count: "exact", head: true }),
      ]);

      const avgProgress = progreso?.length ? Math.round(progreso.reduce((a, b) => a + (b.porcentaje || 0), 0) / progreso.length) : 0;
      const quizUsers = progreso?.filter(p => (p.intentos_quiz || 0) > 0) || [];
      const avgQuiz = quizUsers.length ? Math.round(quizUsers.reduce((a, b) => a + ((b.preguntas_correctas || 0) / Math.max(b.intentos_quiz || 1, 1)) * 100, 0) / quizUsers.length) : 0;
      const totalTime = progreso?.reduce((a, b) => a + (b.tiempo_invertido || 0), 0) || 0;
      const completedSessions = progreso?.filter(p => (p.porcentaje || 0) >= 100).length || 0;

      return {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        avgProgress,
        avgQuiz,
        totalQuestions: totalQuestions || 0,
        totalSesiones: totalSesiones || 0,
        totalCursos: totalCursos || 0,
        totalTime,
        completedSessions,
        progreso: progreso || [],
      };
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ["admin-charts"],
    queryFn: async () => {
      const { data: sesiones } = await supabase.from("sesiones").select("id, titulo, orden").order("orden");
      const { data: progreso } = await supabase.from("progreso_estudiante").select("sesion_id, porcentaje, user_id, preguntas_correctas, intentos_quiz");
      const { data: profiles } = await supabase.from("profiles").select("id, nombre, apellidos");
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("rol", "estudiante");

      const studentIds = new Set(roles?.map(r => r.user_id) || []);

      // Bar chart: avg progress per session
      const barData = (sesiones || []).map(s => {
        const sessionProgress = (progreso || []).filter(p => p.sesion_id === s.id);
        const avg = sessionProgress.length ? Math.round(sessionProgress.reduce((a, b) => a + (b.porcentaje || 0), 0) / sessionProgress.length) : 0;
        return { name: `S${s.orden}`, fullName: s.titulo, progreso: avg };
      });

      // Donut: status distribution
      const allProgress = progreso || [];
      const completed = allProgress.filter(p => (p.porcentaje || 0) >= 100).length;
      const inProgress = allProgress.filter(p => (p.porcentaje || 0) > 0 && (p.porcentaje || 0) < 100).length;
      const notStarted = Math.max(0, (sesiones?.length || 0) * studentIds.size - completed - inProgress);
      const donutData = [
        { name: "Completadas", value: completed },
        { name: "En progreso", value: inProgress },
        { name: "Sin iniciar", value: notStarted },
      ];

      // Ranking students by avg progress
      const studentMap = new Map<string, { porcentajes: number[]; correctas: number; intentos: number }>();
      (progreso || []).forEach(p => {
        if (studentIds.has(p.user_id)) {
          if (!studentMap.has(p.user_id)) studentMap.set(p.user_id, { porcentajes: [], correctas: 0, intentos: 0 });
          const entry = studentMap.get(p.user_id)!;
          entry.porcentajes.push(p.porcentaje || 0);
          entry.correctas += p.preguntas_correctas || 0;
          entry.intentos += p.intentos_quiz || 0;
        }
      });
      const rankingData = Array.from(studentMap.entries())
        .map(([userId, vals]) => {
          const p = profiles?.find(pr => pr.id === userId);
          const promedio = Math.round(vals.porcentajes.reduce((a, b) => a + b, 0) / vals.porcentajes.length);
          return {
            name: p ? `${p.nombre} ${p.apellidos?.charAt(0) || ""}.` : "—",
            promedio,
            sesiones: vals.porcentajes.length,
          };
        })
        .sort((a, b) => b.promedio - a.promedio)
        .slice(0, 10);

      // Performance distribution
      const perfData = [
        { range: "0-25%", count: allProgress.filter(p => (p.porcentaje || 0) <= 25).length },
        { range: "26-50%", count: allProgress.filter(p => (p.porcentaje || 0) > 25 && (p.porcentaje || 0) <= 50).length },
        { range: "51-75%", count: allProgress.filter(p => (p.porcentaje || 0) > 50 && (p.porcentaje || 0) <= 75).length },
        { range: "76-100%", count: allProgress.filter(p => (p.porcentaje || 0) > 75).length },
      ];

      return { barData, donutData, rankingData, perfData };
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const inactiveStudents = (stats?.totalStudents || 0) - (stats?.activeStudents || 0);
  const activeRate = stats?.totalStudents ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0;

  const cards = [
    { title: "Total Estudiantes", value: stats?.totalStudents, icon: Users, color: "text-primary", subtitle: `${stats?.activeStudents} activos` },
    { title: "Tasa de Actividad", value: `${activeRate}%`, icon: TrendingUp, color: "text-success", subtitle: `${inactiveStudents} inactivos` },
    { title: "Avance Promedio", value: `${stats?.avgProgress}%`, icon: BarChart3, color: "text-progress", subtitle: `${stats?.completedSessions} sesiones completadas` },
    { title: "Puntaje Quiz", value: `${stats?.avgQuiz}%`, icon: Award, color: "text-secondary", subtitle: "promedio general" },
    { title: "Cursos / Sesiones", value: `${stats?.totalCursos} / ${stats?.totalSesiones}`, icon: BookOpen, color: "text-primary", subtitle: `${stats?.totalQuestions} preguntas` },
  ];

  const DONUT_COLORS = ["hsl(var(--success))", "hsl(var(--progress))", "hsl(var(--muted))"];
  const PERF_COLORS = ["hsl(var(--destructive))", "hsl(var(--progress))", "hsl(var(--secondary))", "hsl(var(--success))"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Resumen general de la plataforma</p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Actualizado en tiempo real
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(c => (
          <Card key={c.title} className="border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-display font-bold">{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress overview bar */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Avance General de la Plataforma</span>
            </div>
            <span className="text-sm font-bold text-primary">{stats?.avgProgress}%</span>
          </div>
          <Progress value={stats?.avgProgress || 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Progreso por Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.barData && chartData.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.barData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(value: number) => [`${value}%`, "Progreso"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="progreso" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-12">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Estado General de Sesiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.donutData && chartData.donutData.some(d => d.value > 0) ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={chartData.donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {chartData.donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 text-xs justify-center">
                  {chartData.donutData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-muted-foreground text-sm text-center py-12">Sin datos</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Distribución de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.perfData && chartData.perfData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.perfData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" name="Estudiantes" radius={[6, 6, 0, 0]}>
                    {chartData.perfData.map((_, i) => <Cell key={i} fill={PERF_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-12">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Award className="h-4 w-4 text-secondary" />
              Top 10 Estudiantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.rankingData && chartData.rankingData.length > 0 ? (
              <div className="space-y-2.5 max-h-[280px] overflow-auto pr-1">
                {chartData.rankingData.map((student, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-yellow-500/20 text-yellow-600" :
                      i === 1 ? "bg-gray-300/30 text-gray-500" :
                      i === 2 ? "bg-orange-400/20 text-orange-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground">{student.sesiones} sesiones</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Progress value={student.promedio} className="w-16 h-2" />
                      <span className="text-sm font-bold w-10 text-right">{student.promedio}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm text-center py-12">Sin datos</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

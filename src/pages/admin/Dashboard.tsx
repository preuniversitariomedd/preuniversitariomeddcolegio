import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, BookOpen, HelpCircle, BarChart3, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalStudents },
        { count: activeStudents },
        { data: progreso },
        { count: totalQuestions },
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("rol", "estudiante"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("rol", "estudiante").eq("activo", true),
        supabase.from("progreso_estudiante").select("porcentaje, preguntas_correctas, intentos_quiz, sesion_id, user_id"),
        supabase.from("quiz_preguntas").select("*", { count: "exact", head: true }),
      ]);

      const avgProgress = progreso?.length ? Math.round(progreso.reduce((a, b) => a + (b.porcentaje || 0), 0) / progreso.length) : 0;
      const quizUsers = progreso?.filter(p => (p.intentos_quiz || 0) > 0) || [];
      const avgQuiz = quizUsers.length ? Math.round(quizUsers.reduce((a, b) => a + ((b.preguntas_correctas || 0) / Math.max(b.intentos_quiz || 1, 1)) * 100, 0) / quizUsers.length) : 0;

      return {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        avgProgress,
        avgQuiz,
        totalQuestions: totalQuestions || 0,
        progreso: progreso || [],
      };
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ["admin-charts"],
    queryFn: async () => {
      const { data: sesiones } = await supabase.from("sesiones").select("id, titulo, orden").order("orden");
      const { data: progreso } = await supabase.from("progreso_estudiante").select("sesion_id, porcentaje, user_id");
      const { data: profiles } = await supabase.from("profiles").select("id, nombre, apellidos");
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("rol", "estudiante");

      const studentIds = new Set(roles?.map(r => r.user_id) || []);

      // Bar chart: avg progress per session
      const barData = (sesiones || []).map(s => {
        const sessionProgress = (progreso || []).filter(p => p.sesion_id === s.id);
        const avg = sessionProgress.length ? Math.round(sessionProgress.reduce((a, b) => a + (b.porcentaje || 0), 0) / sessionProgress.length) : 0;
        return { name: `S${s.orden}`, progreso: avg };
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

      // Area: ranking students by avg progress
      const studentMap = new Map<string, number[]>();
      (progreso || []).forEach(p => {
        if (studentIds.has(p.user_id)) {
          if (!studentMap.has(p.user_id)) studentMap.set(p.user_id, []);
          studentMap.get(p.user_id)!.push(p.porcentaje || 0);
        }
      });
      const rankingData = Array.from(studentMap.entries())
        .map(([userId, vals]) => {
          const p = profiles?.find(pr => pr.id === userId);
          return { name: p ? `${p.nombre} ${p.apellidos?.charAt(0)}.` : "—", promedio: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) };
        })
        .sort((a, b) => b.promedio - a.promedio)
        .slice(0, 10);

      return { barData, donutData, rankingData };
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { title: "Total Estudiantes", value: stats?.totalStudents, icon: Users, color: "text-primary" },
    { title: "Activos", value: stats?.activeStudents, icon: TrendingUp, color: "text-success" },
    { title: "Avance Promedio", value: `${stats?.avgProgress}%`, icon: BarChart3, color: "text-progress" },
    { title: "Puntaje Quiz Prom.", value: `${stats?.avgQuiz}%`, icon: Award, color: "text-secondary" },
    { title: "Preguntas en Banco", value: stats?.totalQuestions, icon: HelpCircle, color: "text-pink" },
  ];

  const DONUT_COLORS = ["hsl(var(--success))", "hsl(var(--progress))", "hsl(var(--muted))"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(c => (
          <Card key={c.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-display font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Progreso por Sesión</CardTitle></CardHeader>
          <CardContent>
            {chartData?.barData && chartData.barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="progreso" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-12">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Estado General</CardTitle></CardHeader>
          <CardContent>
            {chartData?.donutData && chartData.donutData.some(d => d.value > 0) ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData.donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {chartData.donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 text-xs">
                  {chartData.donutData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-muted-foreground text-sm text-center py-12">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Area/Ranking Chart */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Ranking Estudiantes</CardTitle></CardHeader>
          <CardContent>
            {chartData?.rankingData && chartData.rankingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData.rankingData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="promedio" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-12">Sin datos</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

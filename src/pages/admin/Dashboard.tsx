import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, BookOpen, HelpCircle, BarChart3, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
        supabase.from("progreso_estudiante").select("porcentaje, preguntas_correctas, intentos_quiz"),
        supabase.from("quiz_preguntas").select("*", { count: "exact", head: true }),
      ]);

      const avgProgress = progreso?.length ? Math.round(progreso.reduce((a, b) => a + (b.porcentaje || 0), 0) / progreso.length) : 0;
      const avgQuiz = progreso?.length ? Math.round(progreso.filter(p => (p.intentos_quiz || 0) > 0).reduce((a, b) => a + ((b.preguntas_correctas || 0) / Math.max(b.intentos_quiz || 1, 1)) * 100, 0) / Math.max(progreso.filter(p => (p.intentos_quiz || 0) > 0).length, 1)) : 0;

      return {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        avgProgress,
        avgQuiz,
        totalQuestions: totalQuestions || 0,
      };
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
      <Card>
        <CardHeader><CardTitle className="text-lg font-display">Rendimiento de Estudiantes</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Los gráficos detallados se mostrarán cuando haya datos de estudiantes.</p>
        </CardContent>
      </Card>
    </div>
  );
}

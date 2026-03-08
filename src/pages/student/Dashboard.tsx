import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useViewAsStudent } from "@/components/StudentLayout";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "¡Buenos días";
  if (h < 18) return "¡Buenas tardes";
  return "¡Buenas noches";
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const viewAsId = useViewAsStudent();
  const targetId = viewAsId || profile?.id;

  const { data: viewProfile } = useQuery({
    queryKey: ["view-as-profile", viewAsId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("nombre, apellidos").eq("id", viewAsId!).single();
      return data;
    },
    enabled: !!viewAsId,
  });

  const displayName = viewAsId ? viewProfile?.nombre : profile?.nombre;

  const { data: cursos, isLoading } = useQuery({
    queryKey: ["student-cursos", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("inscripciones")
        .select("curso_id, cursos(id, titulo, color, descripcion)")
        .eq("user_id", targetId!);
      return data?.map(d => (d.cursos as any)) || [];
    },
    enabled: !!targetId,
  });

  const { data: progreso } = useQuery({
    queryKey: ["student-progreso-global", targetId],
    queryFn: async () => {
      const { data } = await supabase.from("progreso_estudiante").select("porcentaje").eq("user_id", targetId!);
      if (!data?.length) return 0;
      return Math.round(data.reduce((a, b) => a + (b.porcentaje || 0), 0) / data.length);
    },
    enabled: !!targetId,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-display font-bold">{getGreeting()}, {displayName}!</h2>
        <p className="text-muted-foreground">Tu progreso general</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso Global</span>
              <span className="text-sm font-bold text-primary">{progreso || 0}%</span>
            </div>
            <Progress value={progreso || 0} className="h-3" />
          </CardContent>
        </Card>
      </motion.div>

      <h3 className="text-lg font-display font-semibold">Mis Cursos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cursos?.map((curso: any) => (
          <Link key={curso.id} to={`/student/cursos`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer border-l-4" style={{ borderLeftColor: curso.color || "#8B5CF6" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" style={{ color: curso.color }} />
                  {curso.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{curso.descripcion || "Sin descripción"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!cursos || cursos.length === 0) && (
          <p className="text-muted-foreground col-span-full text-center py-8">No estás inscrito en ningún curso aún.</p>
        )}
      </div>
    </div>
  );
}

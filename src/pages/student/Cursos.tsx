import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentCursos() {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["student-cursos-sesiones"],
    queryFn: async () => {
      const { data: inscr } = await supabase
        .from("inscripciones")
        .select("cursos(id, titulo, color, sesiones(id, titulo, orden, estado))")
        .eq("user_id", profile!.id);
      return inscr?.map(i => (i.cursos as any)) || [];
    },
    enabled: !!profile,
  });

  const { data: progreso } = useQuery({
    queryKey: ["student-progreso"],
    queryFn: async () => {
      const { data } = await supabase.from("progreso_estudiante").select("sesion_id, porcentaje").eq("user_id", profile!.id);
      const map: Record<string, number> = {};
      data?.forEach(p => { map[p.sesion_id] = p.porcentaje || 0; });
      return map;
    },
    enabled: !!profile,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Mis Cursos</h2>
      {data?.map((curso: any) => (
        <div key={curso.id} className="space-y-3">
          <h3 className="text-lg font-display font-semibold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: curso.color }} />
            {curso.titulo}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(curso.sesiones as any[])?.sort((a: any, b: any) => a.orden - b.orden).map((s: any) => {
              const p = progreso?.[s.id] || 0;
              const blocked = s.estado === "bloqueada";
              return blocked ? (
                <Card key={s.id} className="opacity-50 cursor-not-allowed">
                  <CardContent className="py-4 flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{s.orden}. {s.titulo}</span>
                  </CardContent>
                </Card>
              ) : (
                <Link key={s.id} to={`/student/sesion/${s.id}`}>
                  <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${p >= 100 ? "border-success/50" : p > 0 ? "border-progress/50" : ""}`}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {p >= 100 ? <CheckCircle className="h-5 w-5 text-success" /> : p > 0 ? <Clock className="h-5 w-5 text-progress" /> : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}
                        <span className="text-sm font-medium">{s.orden}. {s.titulo}</span>
                      </div>
                      {p > 0 && <Badge variant="secondary">{p}%</Badge>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

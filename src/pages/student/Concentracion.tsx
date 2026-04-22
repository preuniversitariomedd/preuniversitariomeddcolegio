import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Clock, Play } from "lucide-react";
import { EJERCICIOS_CONCENTRACION } from "@/data/testdata";

const HABILITADOS = new Set(["stroop"]);

export default function StudentConcentracion() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Target className="h-7 w-7 text-primary" /> Concentración Visual
        </h1>
        <p className="text-muted-foreground">
          Ejercicios cognitivos para entrenar atención, memoria de trabajo y control inhibitorio.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {EJERCICIOS_CONCENTRACION.map((e) => {
          const habilitado = HABILITADOS.has(e.id);
          return (
            <Card key={e.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{e.nombre}</CardTitle>
                  <Badge variant={e.prioridad === "alta" ? "default" : "secondary"} className="text-xs">
                    {e.prioridad === "alta" ? "Alta prioridad" : "Media"}
                  </Badge>
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
          );
        })}
      </div>
    </div>
  );
}

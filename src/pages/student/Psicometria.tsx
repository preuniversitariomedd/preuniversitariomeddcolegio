import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Clock, ArrowRight } from "lucide-react";
import { TESTS } from "@/data/testdata";
import { Link } from "react-router-dom";

export default function StudentPsicometria() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" /> Psicometría
        </h1>
        <p className="text-muted-foreground">
          Tests psicológicos validados para conocerte mejor antes del examen de admisión.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {TESTS.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{t.nombre}</CardTitle>
                {t.estado === "pendiente" && (
                  <Badge variant="outline" className="text-xs">Próximamente</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t.descripcion}</p>
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {t.tiempo_estimado} min
                {t.preguntas.length > 0 && <span>· {t.preguntas.length} ítems</span>}
              </div>
              <Button
                size="sm"
                disabled={t.estado === "pendiente"}
                asChild={t.estado === "completo"}
              >
                {t.estado === "completo" ? (
                  <Link to={`/student/psicometria/${t.id}`}>
                    Iniciar <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <span>Iniciar</span>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

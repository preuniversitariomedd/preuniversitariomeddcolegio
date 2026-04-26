import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Clock, ArrowRight, Search } from "lucide-react";
import { TESTS } from "@/data/testdata";
import { Link } from "react-router-dom";

const CATEGORIAS = [
  { id: "todas", label: "Todas" },
  { id: "psicometria", label: "Psicométricos" },
  { id: "vocacional", label: "Vocacionales" },
  { id: "personalidad", label: "Personalidad" },
  { id: "inteligencias", label: "Inteligencias" },
] as const;

export default function StudentPsicometria() {
  const [cat, setCat] = useState<string>("todas");
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    return TESTS.filter((t) => {
      if (cat !== "todas" && t.categoria !== cat) return false;
      if (q && !t.nombre.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [cat, q]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" /> Psicometría 360°
        </h1>
        <p className="text-muted-foreground">
          {TESTS.length} tests psicológicos validados: vocacionales, personalidad e inteligencias múltiples.
        </p>
      </header>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Tabs value={cat} onValueChange={setCat} className="flex-1">
          <TabsList className="flex-wrap h-auto">
            {CATEGORIAS.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="text-xs md:text-sm">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative md:w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar test…" className="pl-8" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtrados.length} test(s)</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((t) => {
          const icono = (t as any).icono ?? "🧠";
          const subtitulo = (t as any).subtitulo ?? "";
          return (
            <Card key={t.id} className="flex flex-col hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{icono}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{t.categoria}</Badge>
                    </div>
                    <CardTitle className="text-base leading-tight">{t.nombre}</CardTitle>
                    {subtitulo && <p className="text-xs text-muted-foreground mt-1">{subtitulo}</p>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{t.descripcion}</p>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {t.tiempo_estimado} min · {t.preguntas.length} ítems
                </div>
                <Button size="sm" disabled={t.estado === "pendiente"} asChild={t.estado === "completo"}>
                  {t.estado === "completo" ? (
                    <Link to={`/student/psicometria/${t.id}`}>
                      Iniciar <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span>Próximamente</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {!filtrados.length && (
          <p className="col-span-full text-center text-muted-foreground py-12 text-sm">No hay tests con esos filtros.</p>
        )}
      </div>
    </div>
  );
}

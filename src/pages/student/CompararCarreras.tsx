import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Columns3 } from "lucide-react";
import { CARRERAS_ESPOL, type CarreraEspol } from "@/data/carrerasEspol";

type Slot = CarreraEspol | null;

function CarreraPicker({ onSelect, exclude }: { onSelect: (c: CarreraEspol) => void; exclude: string[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(
    () =>
      CARRERAS_ESPOL.filter(
        (c) => !exclude.includes(c.id) && c.nombre.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, exclude],
  );
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full h-32 border-dashed">
          <Plus className="h-5 w-5 mr-2" /> Seleccionar carrera
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Elegir carrera ESPOL</SheetTitle>
        </SheetHeader>
        <Input
          placeholder="Buscar por nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-4"
        />
        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          <div className="space-y-2 pr-3">
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full text-left p-3 rounded-md border bg-card hover:bg-accent transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">{c.icono}</span>
                <div>
                  <div className="font-medium text-sm">{c.nombre}</div>
                  <div className="text-xs text-muted-foreground">{c.siglaFacultad}</div>
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Sin resultados.</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function CarreraColumna({
  carrera,
  onClear,
  onPick,
  excluded,
  index,
}: {
  carrera: Slot;
  onClear: () => void;
  onPick: (c: CarreraEspol) => void;
  excluded: string[];
  index: number;
}) {
  if (!carrera) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.15 }}
      >
        <CarreraPicker onSelect={onPick} exclude={excluded} />
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{carrera.icono}</span>
              <div>
                <CardTitle className="text-base">{carrera.nombre}</CardTitle>
                <p className="text-xs text-muted-foreground">{carrera.siglaFacultad}</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={onClear} aria-label="Quitar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Facultad</p>
            <p>{carrera.facultad}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
            <p className="text-muted-foreground">{carrera.descripcion}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Materias clave</p>
            <div className="flex flex-wrap gap-1">
              {carrera.materiasClaveESPOL.map((m) => (
                <Badge key={m} variant="secondary">{m}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Campo laboral</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {carrera.campoLaboral.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Perfil ideal</p>
            {(["empatia", "prosocial", "habilidadesSociales"] as const).map((k) => (
              <div key={k}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                  <span className="text-muted-foreground">{carrera.perfilIdeal[k]}%</span>
                </div>
                <Progress value={carrera.perfilIdeal[k]} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CompararCarreras() {
  const [slots, setSlots] = useState<[Slot, Slot]>([null, null]);

  const setSlot = (i: 0 | 1, c: Slot) => {
    setSlots((prev) => {
      const next = [...prev] as [Slot, Slot];
      next[i] = c;
      return next;
    });
  };

  const excluded = slots.filter(Boolean).map((c) => c!.id);

  const diferencias = useMemo(() => {
    const [a, b] = slots;
    if (!a || !b) return null;
    const dif: { campo: string; a: number; b: number; delta: number }[] = [];
    (["empatia", "prosocial", "habilidadesSociales"] as const).forEach((k) => {
      dif.push({
        campo: k.replace(/([A-Z])/g, " $1"),
        a: a.perfilIdeal[k],
        b: b.perfilIdeal[k],
        delta: Math.abs(a.perfilIdeal[k] - b.perfilIdeal[k]),
      });
    });
    const materiasComunes = a.materiasClaveESPOL.filter((m) =>
      b.materiasClaveESPOL.includes(m),
    );
    return { dif, materiasComunes };
  }, [slots]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Columns3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-display">Comparar carreras</h1>
          <p className="text-sm text-muted-foreground">Compara hasta 2 carreras de ESPOL lado a lado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <CarreraColumna
            key={i}
            index={i}
            carrera={slots[i as 0 | 1]}
            onClear={() => setSlot(i as 0 | 1, null)}
            onPick={(c) => setSlot(i as 0 | 1, c)}
            excluded={excluded}
          />
        ))}
      </div>

      {diferencias && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Diferencias de perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {diferencias.dif.map((d) => (
                <div key={d.campo} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <span className="capitalize">{d.campo}</span>
                  <Badge variant={d.delta > 20 ? "destructive" : d.delta > 10 ? "default" : "secondary"}>
                    Δ {d.delta}
                  </Badge>
                </div>
              ))}
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Materias en común
                </p>
                {diferencias.materiasComunes.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No comparten materias clave.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {diferencias.materiasComunes.map((m) => (
                      <Badge key={m} variant="secondary">{m}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

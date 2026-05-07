import { useParams, useNavigate, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { getTestById, calcularResultado } from "@/data/testdata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, CheckCircle2, FileDown, AlertTriangle, Sparkles, Target, Eye, EyeOff, Copy, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { NIVEL_TEXTOS } from "@/lib/perfil360";
import { NivelBadge, NIVEL_BAR_COLOR, NIVEL_CARD_STYLE, type Nivel } from "@/components/NivelBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { usePersistedToggle } from "@/hooks/usePersistedToggle";

export const LS_MOSTRAR_FORTALEZAS = "medd:mostrarFortalezas";
export const LS_MOSTRAR_AREAS = "medd:mostrarAreas";

export default function StudentPsicometriaTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const test = useMemo(() => (testId ? getTestById(testId) : undefined), [testId]);

  const [idx, setIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [start] = useState(() => Date.now());
  const [resultado, setResultado] = useState<ReturnType<typeof calcularResultado> | null>(null);
  const [saving, setSaving] = useState(false);
  const [mostrarFortalezas, setMostrarFortalezas] = usePersistedToggle(LS_MOSTRAR_FORTALEZAS, true);
  const [mostrarAreas, setMostrarAreas] = usePersistedToggle(LS_MOSTRAR_AREAS, true);

  useEffect(() => {
    if (test && test.estado !== "completo") navigate("/student/psicometria");
  }, [test, navigate]);

  if (!test) return <div className="p-6">Test no encontrado.</div>;

  const total = test.preguntas.length;
  const pregunta = test.preguntas[idx];
  const respondidas = Object.keys(respuestas).length;
  const progreso = (respondidas / total) * 100;

  const handleResponder = (valor: number) => {
    setRespuestas((prev) => ({ ...prev, [pregunta.id]: valor }));
  };

  const finalizar = async () => {
    if (!user) return;
    setSaving(true);
    const r = calcularResultado(test as any, respuestas);
    const tiempo = Math.round((Date.now() - start) / 1000);

    const { error } = await supabase.from("resultados_tests").insert({
      user_id: user.id,
      test_id: test.id,
      puntaje_total: r.puntaje_total,
      puntaje_por_subescala: r.puntaje_por_subescala,
      interpretacion: r.interpretacion,
      tiempo_real_segundos: tiempo,
      completado: true,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      return;
    }
    setResultado(r);
  };

  if (resultado) {
    const t: any = test;
    const opVals = test.opciones.map((o) => o.valor);
    const maxOp = Math.max(...opVals);
    const minOp = Math.min(...opVals);
    const subList = (t.subescalas ?? []) as { id: string; nombre: string }[];
    type SubInfo = { pct: number; nivel: Nivel; texto: string; faltaMapeo: boolean };
    const subInterps: Record<string, SubInfo> = {};
    const faltantes: string[] = [];
    if (resultado.puntaje_por_subescala) {
      for (const s of subList) {
        const items = test.preguntas.filter((p: any) => p.subescala === s.id);
        if (!items.length) continue;
        const max = items.length * maxOp;
        const min = items.length * minOp;
        const raw = resultado.puntaje_por_subescala[s.id] ?? 0;
        const pct = max === min ? 0 : Math.round(((raw - min) / (max - min)) * 100);
        const nivel: Nivel = pct < 40 ? "bajo" : pct <= 70 ? "medio" : "alto";
        const textos = NIVEL_TEXTOS[s.id];
        const faltaMapeo = !textos;
        if (faltaMapeo) faltantes.push(s.id);
        const fallback =
          nivel === "alto"
            ? `Fortaleza marcada en ${s.nombre}.`
            : nivel === "medio"
              ? `Nivel funcional en ${s.nombre}, con espacio para crecer.`
              : `${s.nombre}: área a fortalecer con apoyo psicopedagógico.`;
        const texto = textos?.[nivel] ?? fallback;
        subInterps[s.id] = { pct, nivel, texto, faltaMapeo };
      }
    }

    const ordenados = subList
      .map((s) => ({ s, info: subInterps[s.id] }))
      .filter((x) => x.info);
    const fortalezas = ordenados.filter((x) => x.info.nivel === "alto");
    const aFortalecer = ordenados.filter((x) => x.info.nivel === "bajo");

    const exportarPDF = () => {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageW, 26, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(test.nombre, margin, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Resultado psicométrico · MEDD · ${new Date().toLocaleDateString("es-EC")}`, margin, 19);
      y = 34;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Puntaje total: ${resultado.puntaje_total}`, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const interpL = doc.splitTextToSize(test.interpretacion[resultado.interpretacion] ?? "", pageW - 2 * margin);
      doc.text(interpL, margin, y);
      y += interpL.length * 4 + 4;

      if (ordenados.length) {
        autoTable(doc, {
          startY: y,
          head: [["Subescala", "Nivel", "%", "Interpretación"]],
          body: ordenados.map(({ s, info }) => [s.nombre, info.nivel.toUpperCase(), `${info.pct}%`, info.texto]),
          styles: { fontSize: 8, cellPadding: 2, valign: "top" },
          headStyles: { fillColor: [30, 41, 59] },
          columnStyles: { 0: { cellWidth: 40 }, 3: { cellWidth: 95 } },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 1) {
              const v = String(data.cell.raw).toLowerCase();
              if (v === "alto") data.cell.styles.fillColor = [220, 252, 231];
              else if (v === "medio") data.cell.styles.fillColor = [254, 243, 199];
              else if (v === "bajo") data.cell.styles.fillColor = [254, 226, 226];
            }
          },
          margin: { left: margin, right: margin },
        });
      }
      doc.save(`${test.id}-resultado.pdf`);
      toast({ title: "PDF generado", description: "Descarga iniciada." });
    };

    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary" /> {test.nombre} — Resultado
              </span>
              {ordenados.length > 0 && (
                <Button size="sm" variant="outline" onClick={exportarPDF}>
                  <FileDown className="h-4 w-4 mr-1" /> PDF
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Puntaje total</p>
              <p className="text-4xl font-bold text-primary">{resultado.puntaje_total}</p>
              <p className="text-sm font-medium mt-1 capitalize">Nivel global: {resultado.interpretacion}</p>
            </div>

            {faltantes.length > 0 && (
              <Collapsible>
                <Alert variant="destructive" data-testid="alert-faltantes">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Interpretaciones genéricas ({faltantes.length})</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Faltan mapeos en NIVEL_TEXTOS. Se está usando texto de respaldo.</p>
                    <div className="flex gap-2 flex-wrap">
                      <CollapsibleTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <ChevronDown className="h-3.5 w-3.5 mr-1" /> Ver IDs
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={async () => {
                          const txt = faltantes.join("\n");
                          try {
                            await navigator.clipboard.writeText(txt);
                            toast({ title: "Copiado", description: `${faltantes.length} IDs al portapapeles.` });
                          } catch {
                            toast({ title: "No se pudo copiar", description: txt, variant: "destructive" });
                          }
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                      </Button>
                    </div>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      <ul className="mt-2 text-xs font-mono space-y-0.5 max-h-48 overflow-y-auto">
                        {faltantes.map((id) => {
                          const s = subList.find((x) => x.id === id);
                          return <li key={id}>{id} {s ? `— ${s.nombre}` : ""}</li>;
                        })}
                      </ul>
                    </CollapsibleContent>
                  </AlertDescription>
                </Alert>
              </Collapsible>
            )}

            {(fortalezas.length > 0 || aFortalecer.length > 0) && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  {fortalezas.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Switch id="toggle-fortalezas" checked={mostrarFortalezas} onCheckedChange={setMostrarFortalezas} />
                      <Label htmlFor="toggle-fortalezas" className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                        {mostrarFortalezas ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        Fortalezas ({fortalezas.length})
                      </Label>
                    </div>
                  )}
                  {aFortalecer.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Switch id="toggle-areas" checked={mostrarAreas} onCheckedChange={setMostrarAreas} />
                      <Label htmlFor="toggle-areas" className="flex items-center gap-1 text-xs font-medium cursor-pointer">
                        {mostrarAreas ? <Eye className="h-3.5 w-3.5 text-red-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        Áreas a fortalecer ({aFortalecer.length})
                      </Label>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {fortalezas.length > 0 && (
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${mostrarFortalezas ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3">
                        <p className="text-sm font-semibold flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                          <Sparkles className="h-4 w-4" /> Fortalezas
                        </p>
                        <ul className="mt-1 text-xs space-y-0.5 list-disc pl-5">
                          {fortalezas.map(({ s, info }) => (
                            <li key={s.id}>{s.nombre} <span className="font-mono opacity-70">{info.pct}%</span></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {aFortalecer.length > 0 && (
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${mostrarAreas ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3">
                        <p className="text-sm font-semibold flex items-center gap-1 text-red-700 dark:text-red-300">
                          <Target className="h-4 w-4" /> Áreas a fortalecer
                        </p>
                        <ul className="mt-1 text-xs space-y-0.5 list-disc pl-5">
                          {aFortalecer.map(({ s, info }) => (
                            <li key={s.id}>{s.nombre} <span className="font-mono opacity-70">{info.pct}%</span></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {ordenados.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Desglose por subescala:</p>
                {ordenados.map(({ s, info }) => (
                  <div key={s.id} className={`border rounded-md p-3 space-y-1.5 ${NIVEL_CARD_STYLE[info.nivel]}`}>
                    <div className="flex justify-between items-center text-sm gap-2">
                      <span className="font-medium">{s.nombre}</span>
                      <NivelBadge nivel={info.nivel} porcentaje={info.pct} />
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${NIVEL_BAR_COLOR[info.nivel]}`} style={{ width: `${info.pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{info.texto}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm leading-relaxed bg-accent/30 p-3 rounded-md">
              {test.interpretacion[resultado.interpretacion]}
            </p>
            <div className="flex justify-end">
              <Button asChild>
                <Link to="/student/psicometria">Volver a tests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  if (idx === 0 && respondidas === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{test.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground">{test.descripcion}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{test.instrucciones}</p>
            <div className="text-xs text-muted-foreground">
              {total} ítems · ≈ {test.tiempo_estimado} min
            </div>
            <div className="flex justify-between">
              <Button variant="outline" asChild>
                <Link to="/student/psicometria"><ArrowLeft className="h-4 w-4 mr-1" /> Cancelar</Link>
              </Button>
              <Button onClick={() => setIdx(0)}>Comenzar <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Pregunta {idx + 1} de {total}</span>
            <span>{Math.round(progreso)}%</span>
          </div>
          <Progress value={progreso} />
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-base font-medium leading-relaxed">{pregunta.texto}</p>
          <RadioGroup
            value={respuestas[pregunta.id]?.toString() ?? ""}
            onValueChange={(v) => handleResponder(Number(v))}
          >
            {(pregunta.opciones ?? test.opciones).map((op) => (
              <div key={op.valor} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => handleResponder(op.valor)}>
                <RadioGroupItem value={op.valor.toString()} id={`${pregunta.id}-${op.valor}`} />
                <Label htmlFor={`${pregunta.id}-${op.valor}`} className="cursor-pointer flex-1">
                  {op.etiqueta}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            {idx < total - 1 ? (
              <Button onClick={() => setIdx((i) => i + 1)} disabled={respuestas[pregunta.id] == null}>
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finalizar} disabled={respondidas < total || saving}>
                {saving ? "Guardando..." : "Finalizar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useParams, useNavigate, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { getTestById, calcularResultado } from "@/data/testdata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

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
    const r = calcularResultado(test, respuestas);
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
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" /> {test.nombre} — Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Puntaje total</p>
              <p className="text-4xl font-bold text-primary">{resultado.puntaje_total}</p>
              <p className="text-sm font-medium mt-1 capitalize">Nivel: {resultado.interpretacion}</p>
            </div>
            {resultado.puntaje_por_subescala && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Por subescala:</p>
                {Object.entries(resultado.puntaje_por_subescala).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b pb-1">
                    <span className="capitalize">{k}</span>
                    <span className="font-mono">{v}</span>
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

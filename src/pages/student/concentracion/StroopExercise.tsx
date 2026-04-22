import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Play, RotateCcw, Trophy } from "lucide-react";

type Color = "rojo" | "azul" | "verde" | "amarillo";

const COLORS: Color[] = ["rojo", "azul", "verde", "amarillo"];

// Tokens semánticos definidos en index.css con fallback a colores planos
const COLOR_STYLE: Record<Color, string> = {
  rojo: "hsl(0 84% 55%)",
  azul: "hsl(220 90% 56%)",
  verde: "hsl(142 71% 40%)",
  amarillo: "hsl(48 96% 50%)",
};

const COLOR_LABEL: Record<Color, string> = {
  rojo: "ROJO",
  azul: "AZUL",
  verde: "VERDE",
  amarillo: "AMARILLO",
};

const TOTAL_TRIALS = 40;

interface Trial {
  word: Color;       // lo que dice la palabra
  ink: Color;        // color de la tinta (respuesta correcta)
  congruent: boolean;
}

function buildTrials(): Trial[] {
  const trials: Trial[] = [];
  // 50% congruentes, 50% incongruentes
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    const congruent = i < TOTAL_TRIALS / 2;
    const ink = COLORS[Math.floor(Math.random() * COLORS.length)];
    let word: Color;
    if (congruent) {
      word = ink;
    } else {
      const others = COLORS.filter((c) => c !== ink);
      word = others[Math.floor(Math.random() * others.length)];
    }
    trials.push({ word, ink, congruent });
  }
  // mezclar
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

interface Response {
  trial: Trial;
  selected: Color;
  correct: boolean;
  rt_ms: number;
}

export default function StroopExercise() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Response[]>([]);
  const [saving, setSaving] = useState(false);
  const startedAt = useRef<number>(0);
  const trialStart = useRef<number>(0);

  useEffect(() => {
    if (phase === "running") {
      trialStart.current = performance.now();
    }
  }, [phase, index]);

  const start = () => {
    setTrials(buildTrials());
    setResponses([]);
    setIndex(0);
    startedAt.current = performance.now();
    setPhase("running");
  };

  const handleAnswer = (color: Color) => {
    if (phase !== "running") return;
    const trial = trials[index];
    const rt = Math.round(performance.now() - trialStart.current);
    const resp: Response = {
      trial,
      selected: color,
      correct: color === trial.ink,
      rt_ms: rt,
    };
    const next = [...responses, resp];
    setResponses(next);
    if (index + 1 >= TOTAL_TRIALS) {
      setPhase("done");
      void saveResults(next);
    } else {
      setIndex(index + 1);
    }
  };

  const metrics = useMemo(() => {
    const total = responses.length;
    const aciertos = responses.filter((r) => r.correct).length;
    const errores = total - aciertos;
    const tiempos = responses.map((r) => r.rt_ms);
    const tiempo_promedio_ms = total ? Math.round(tiempos.reduce((a, b) => a + b, 0) / total) : 0;
    const cong = responses.filter((r) => r.trial.congruent);
    const inc = responses.filter((r) => !r.trial.congruent);
    const congMs = cong.length ? cong.reduce((a, b) => a + b.rt_ms, 0) / cong.length : 0;
    const incMs = inc.length ? inc.reduce((a, b) => a + b.rt_ms, 0) / inc.length : 0;
    return {
      ensayos_totales: total,
      aciertos,
      errores,
      precision_pct: total ? Math.round((aciertos / total) * 100) : 0,
      tiempo_promedio_ms,
      ensayos_congruentes_aciertos: cong.filter((r) => r.correct).length,
      ensayos_incongruentes_aciertos: inc.filter((r) => r.correct).length,
      tiempo_congruente_ms: Math.round(congMs),
      tiempo_incongruente_ms: Math.round(incMs),
      efecto_stroop_ms: Math.round(incMs - congMs),
      duracion_segundos: Math.round((performance.now() - startedAt.current) / 1000),
    };
  }, [responses]);

  async function saveResults(finalResponses: Response[]) {
    if (!user) return;
    setSaving(true);
    try {
      // recalcular sobre finalResponses para asegurar consistencia
      const total = finalResponses.length;
      const aciertos = finalResponses.filter((r) => r.correct).length;
      const cong = finalResponses.filter((r) => r.trial.congruent);
      const inc = finalResponses.filter((r) => !r.trial.congruent);
      const congMs = cong.length ? cong.reduce((a, b) => a + b.rt_ms, 0) / cong.length : 0;
      const incMs = inc.length ? inc.reduce((a, b) => a + b.rt_ms, 0) / inc.length : 0;
      const tiempos = finalResponses.map((r) => r.rt_ms);
      const tiempo_promedio_ms = total ? Math.round(tiempos.reduce((a, b) => a + b, 0) / total) : 0;

      const payload = {
        user_id: user.id,
        ejercicio_id: "stroop",
        completado: true,
        metricas: {
          ensayos_totales: total,
          aciertos,
          errores: total - aciertos,
          precision_pct: total ? Math.round((aciertos / total) * 100) : 0,
          tiempo_promedio_ms,
          ensayos_congruentes_aciertos: cong.filter((r) => r.correct).length,
          ensayos_incongruentes_aciertos: inc.filter((r) => r.correct).length,
          tiempo_congruente_ms: Math.round(congMs),
          tiempo_incongruente_ms: Math.round(incMs),
          efecto_stroop_ms: Math.round(incMs - congMs),
          duracion_segundos: Math.round((performance.now() - startedAt.current) / 1000),
        },
      };
      const { error } = await supabase.from("resultados_ejercicios_concentracion").insert(payload);
      if (error) throw error;
      toast({ title: "Resultados guardados", description: "Tus métricas Stroop quedaron registradas." });
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const reset = () => {
    setPhase("intro");
    setResponses([]);
    setIndex(0);
  };

  // INTRO ---------------------------------------------------------
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/student/concentracion")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Stroop Color-Palabra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Verás <strong>{TOTAL_TRIALS} palabras</strong> escritas en distintos colores de tinta.
              Tu tarea es responder con el <strong>COLOR DE LA TINTA</strong>, ignorando lo que dice la palabra.
            </p>
            <p className="text-muted-foreground">
              Por ejemplo: si ves la palabra <span style={{ color: COLOR_STYLE.azul, fontWeight: 700 }}>ROJO</span>{" "}
              escrita en azul, debes pulsar <strong>AZUL</strong>.
            </p>
            <p className="text-muted-foreground">
              Sé lo más rápido y preciso posible. Tu tiempo de reacción se mide automáticamente.
            </p>
            <Button onClick={start} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" /> Comenzar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // DONE ---------------------------------------------------------
  if (phase === "done") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Trophy className="h-6 w-6 text-primary" /> Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Stat label="Aciertos" value={`${metrics.aciertos} / ${metrics.ensayos_totales}`} />
            <Stat label="Precisión" value={`${metrics.precision_pct}%`} />
            <Stat label="Tiempo medio de reacción" value={`${metrics.tiempo_promedio_ms} ms`} />
            <Stat label="Tiempo medio (congruentes)" value={`${metrics.tiempo_congruente_ms} ms`} />
            <Stat label="Tiempo medio (incongruentes)" value={`${metrics.tiempo_incongruente_ms} ms`} />
            <Stat
              label="Efecto Stroop"
              value={`${metrics.efecto_stroop_ms} ms`}
              hint="Diferencia incongruente − congruente. Valores menores indican mejor control inhibitorio."
            />
            <Stat label="Duración total" value={`${metrics.duracion_segundos} s`} />
            <div className="flex gap-2 pt-2">
              <Button onClick={reset} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" /> Repetir
              </Button>
              <Button onClick={() => navigate("/student/concentracion")} className="flex-1" disabled={saving}>
                {saving ? "Guardando..." : "Finalizar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // RUNNING ------------------------------------------------------
  const trial = trials[index];
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Progress value={((index) / TOTAL_TRIALS) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          Ensayo {index + 1} / {TOTAL_TRIALS}
        </p>
      </div>

      <Card className="aspect-[3/2] flex items-center justify-center">
        <div
          aria-live="polite"
          className="font-display font-extrabold text-6xl md:text-7xl select-none"
          style={{ color: COLOR_STYLE[trial.ink] }}
        >
          {COLOR_LABEL[trial.word]}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {COLORS.map((c) => (
          <Button
            key={c}
            onClick={() => handleAnswer(c)}
            size="lg"
            variant="outline"
            className="h-16 text-base font-semibold border-2"
            style={{ borderColor: COLOR_STYLE[c], color: COLOR_STYLE[c] }}
          >
            {COLOR_LABEL[c]}
          </Button>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Pulsa el botón del COLOR de la tinta, no de la palabra.
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between items-start gap-3 border-b border-border pb-2">
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground/70 max-w-xs">{hint}</p>}
      </div>
      <p className="font-mono font-semibold">{value}</p>
    </div>
  );
}

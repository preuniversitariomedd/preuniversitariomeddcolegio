import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Zap, Users, Clock, Trophy, Snowflake, Divide, LogIn, Loader2, CheckCircle, XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type CompState = {
  id: string; titulo: string; codigo: string; estado: string;
  pregunta_actual: number;
};
type Pregunta = {
  id: string; pregunta: string; opciones: string[];
  respuesta_correcta: number; orden: number; tiempo_limite: number;
  imagen_url: string | null; explicacion: string | null;
};
type Participante = {
  id: string; user_id: string; puntos: number; racha: number; powerups: any;
  profiles?: { nombre: string; apellidos: string };
};

const OPTION_COLORS = [
  "bg-red-500/80 hover:bg-red-500",
  "bg-blue-500/80 hover:bg-blue-500",
  "bg-yellow-500/80 hover:bg-yellow-500",
  "bg-green-500/80 hover:bg-green-500",
  "bg-purple-500/80 hover:bg-purple-500",
];

export default function StudentCompetencia() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [comp, setComp] = useState<CompState | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [hidden, setHidden] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [penaltyX5, setPenaltyX5] = useState(false);
  const [myPowerups, setMyPowerups] = useState<any>({ congelar: 1, "50_50": 1, x2: 1 });
  const [showResult, setShowResult] = useState<{ correct: boolean; points: number } | null>(null);
  const startTimeRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout>();

  // Join competition
  const joinComp = useCallback(async () => {
    if (!code.trim() || !user) return;
    setLoading(true);
    const { data: found } = await supabase.from("competencias").select("*").eq("codigo", code.toUpperCase()).single();
    if (!found) { toast({ title: "Código no encontrado", variant: "destructive" }); setLoading(false); return; }
    if (found.estado === "finalizada") { toast({ title: "Esta competencia ya terminó", variant: "destructive" }); setLoading(false); return; }

    setComp(found as CompState);

    // Join as participant
    await supabase.from("competencia_participantes").upsert(
      { competencia_id: found.id, user_id: user.id },
      { onConflict: "competencia_id,user_id" }
    );

    // Load questions & participants
    const { data: qs } = await supabase.from("competencia_preguntas").select("*").eq("competencia_id", found.id).order("orden");
    setPreguntas((qs || []) as Pregunta[]);

    const { data: parts } = await supabase.from("competencia_participantes").select("*, profiles(nombre, apellidos)").eq("competencia_id", found.id).order("puntos", { ascending: false });
    setParticipantes((parts || []) as Participante[]);

    // Check existing powerups
    const me = (parts || []).find((p: any) => p.user_id === user.id);
    if (me?.powerups) setMyPowerups(me.powerups as any);

    setJoined(true);
    setLoading(false);
  }, [code, user, toast]);

  // Realtime: competition state changes
  useEffect(() => {
    if (!comp) return;

    const ch1 = supabase.channel(`comp-state-${comp.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "competencias", filter: `id=eq.${comp.id}` }, (payload) => {
        const updated = payload.new as CompState;
        setComp(updated);
        if (updated.estado === "pregunta") {
          setAnswered(false);
          setSelectedAnswer(null);
          setShowResult(null);
          setHidden([]);
          setMultiplier(1);
          setPenaltyX5(false);
          setFrozen(false);
        }
        if (updated.estado === "finalizada") {
          confetti({ particleCount: 200, spread: 100 });
        }
      })
      .subscribe();

    const ch2 = supabase.channel(`comp-parts-${comp.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competencia_participantes", filter: `competencia_id=eq.${comp.id}` }, async () => {
        const { data } = await supabase.from("competencia_participantes").select("*, profiles(nombre, apellidos)").eq("competencia_id", comp.id).order("puntos", { ascending: false });
        setParticipantes((data || []) as Participante[]);
      })
      .subscribe();

    // Game broadcast channel for power-ups
    const ch3 = supabase.channel(`game-${comp.id}`)
      .on("broadcast", { event: "powerup" }, ({ payload }) => {
        const { tipo, target } = payload;
        if (target !== "all" && target !== user?.id) return;
        switch (tipo) {
          case "congelar": setFrozen(true); toast({ title: "❄️ ¡Tiempo congelado!" }); setTimeout(() => setFrozen(false), 5000); break;
          case "50_50": apply5050(); toast({ title: "✂️ ¡50/50 activado!" }); break;
          case "x2": setMultiplier(2); toast({ title: "✨ ¡x2 Puntos!" }); break;
          case "x5_penalty": setPenaltyX5(true); toast({ title: "💀 ¡x5 Penalización activa!", variant: "destructive" }); break;
          case "skip":
            if (target === user?.id) {
              toast({ title: "⏭️ ¡El admin te ha pasado la pregunta!", description: "Recibes 50 puntos de regalo" });
              submitAnswer(-2); // special skip code
            }
            break;
        }
      })
      .on("broadcast", { event: "state_change" }, ({ payload }) => {
        setComp(prev => prev ? { ...prev, estado: payload.estado, pregunta_actual: payload.pregunta_actual } : null);
        if (payload.estado === "pregunta") {
          setAnswered(false);
          setSelectedAnswer(null);
          setShowResult(null);
          setHidden([]);
          setMultiplier(1);
          setPenaltyX5(false);
          setFrozen(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
    };
  }, [comp?.id, user?.id, toast]);

  // Timer
  useEffect(() => {
    if (!comp || comp.estado !== "pregunta" || answered) return;
    const currentQ = preguntas[comp.pregunta_actual - 1];
    if (!currentQ) return;

    setTimeLeft(currentQ.tiempo_limite);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (frozen) return;
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-submit wrong if not answered
          if (!answered) submitAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [comp?.estado, comp?.pregunta_actual, answered, frozen]);

  const apply5050 = useCallback(() => {
    if (!comp) return;
    const currentQ = preguntas[comp.pregunta_actual - 1];
    if (!currentQ) return;
    const wrong = (currentQ.opciones as string[]).map((_, i) => i).filter(i => i !== currentQ.respuesta_correcta);
    const toHide = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setHidden(toHide);
  }, [comp, preguntas]);

  const submitAnswer = useCallback(async (answerIdx: number) => {
    if (!comp || !user || answered) return;
    const currentQ = preguntas[comp.pregunta_actual - 1];
    if (!currentQ) return;

    setAnswered(true);
    setSelectedAnswer(answerIdx);
    clearInterval(timerRef.current);

    const tiempoUsado = Math.round((Date.now() - startTimeRef.current) / 1000);
    const isSkip = answerIdx === -2;
    const correcta = !isSkip && answerIdx === currentQ.respuesta_correcta;

    let puntos = 0;
    if (isSkip) {
      puntos = 50; // gift points for being skipped
    } else if (correcta) {
      const timeBonus = Math.max(0, currentQ.tiempo_limite - tiempoUsado);
      puntos = Math.round((100 + timeBonus * 5) * multiplier);
    } else if (penaltyX5) {
      puntos = -500;
    }

    setShowResult({ correct: isSkip || correcta, points: puntos });

    await supabase.from("competencia_respuestas").insert({
      competencia_id: comp.id,
      pregunta_id: currentQ.id,
      user_id: user.id,
      respuesta: answerIdx,
      correcta,
      tiempo_usado: tiempoUsado,
      puntos_ganados: puntos,
    });

    // Update participant points & streak
    const me = participantes.find(p => p.user_id === user.id);
    if (me) {
      const newRacha = correcta ? me.racha + 1 : 0;
      const rachaBonus = correcta && newRacha >= 3 ? newRacha * 10 : 0;
      await supabase.from("competencia_participantes").update({
        puntos: me.puntos + puntos + rachaBonus,
        racha: newRacha,
      }).eq("id", me.id);
    }

    if (correcta) confetti({ particleCount: 50, spread: 60 });
  }, [comp, user, answered, preguntas, multiplier, penaltyX5, participantes]);

  // Use personal power-up
  const useMyPowerup = useCallback(async (tipo: string) => {
    if (myPowerups[tipo] <= 0) { toast({ title: "Sin usos disponibles", variant: "destructive" }); return; }
    const updated = { ...myPowerups, [tipo]: myPowerups[tipo] - 1 };
    setMyPowerups(updated);

    const me = participantes.find(p => p.user_id === user?.id);
    if (me) {
      await supabase.from("competencia_participantes").update({ powerups: updated }).eq("id", me.id);
    }

    switch (tipo) {
      case "congelar": setFrozen(true); toast({ title: "❄️ Tiempo congelado 5s" }); setTimeout(() => setFrozen(false), 5000); break;
      case "50_50": apply5050(); toast({ title: "✂️ 50/50 activado" }); break;
      case "x2": setMultiplier(2); toast({ title: "✨ x2 puntos activado" }); break;
    }
  }, [myPowerups, participantes, user, toast, apply5050]);

  const currentQ = comp ? preguntas[comp.pregunta_actual - 1] : null;
  const leaderboard = [...participantes].sort((a, b) => b.puntos - a.puntos);
  const myRank = leaderboard.findIndex(p => p.user_id === user?.id) + 1;
  const myPoints = participantes.find(p => p.user_id === user?.id)?.puntos || 0;

  // Not joined yet
  if (!joined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Competencia en Vivo</h2>
                <p className="text-sm text-muted-foreground mt-1">Ingresa el código para unirte</p>
              </div>
              <Input
                value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO" maxLength={6}
                className="text-center text-2xl font-mono tracking-[0.3em] h-14"
                onKeyDown={e => e.key === "Enter" && joinComp()}
              />
              <Button onClick={joinComp} disabled={loading || code.length < 4} className="w-full gap-2" size="lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Unirse
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Lobby
  if (comp?.estado === "lobby") {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Zap className="h-12 w-12 text-primary mx-auto animate-pulse" />
              <h2 className="text-2xl font-display font-bold">{comp.titulo}</h2>
              <p className="text-muted-foreground">Esperando que el administrador inicie...</p>
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">{participantes.length} participantes</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <AnimatePresence>
                  {participantes.map(p => (
                    <motion.div key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 bg-muted rounded-full px-3 py-1">
                      <span className="text-sm">{p.profiles?.nombre}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Question
  if (comp?.estado === "pregunta" && currentQ) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline">Pregunta {comp.pregunta_actual}/{preguntas.length}</Badge>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">#{myRank} · {myPoints} pts</span>
            <div className={`flex items-center gap-1 text-lg font-mono font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse" : ""} ${frozen ? "text-blue-400" : ""}`}>
              <Clock className="h-5 w-5" /> {timeLeft}s {frozen && "❄️"}
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <Progress value={currentQ.tiempo_limite > 0 ? (timeLeft / currentQ.tiempo_limite) * 100 : 0} className="h-2" />

        {/* Question */}
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-center">{currentQ.pregunta}</h3>
            {currentQ.imagen_url && <img src={currentQ.imagen_url} alt="" className="max-h-40 mx-auto mt-3 rounded-lg object-contain" />}
          </CardContent>
        </Card>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(currentQ.opciones as string[]).map((op, i) => {
            const isHidden = hidden.includes(i);
            const isSelected = selectedAnswer === i;
            const isCorrect = i === currentQ.respuesta_correcta;

            if (isHidden) return <div key={i} className="h-16 rounded-xl bg-muted/30 border-2 border-dashed border-muted" />;

            return (
              <motion.button
                key={i}
                whileHover={!answered ? { scale: 1.02 } : {}}
                whileTap={!answered ? { scale: 0.98 } : {}}
                disabled={answered}
                onClick={() => submitAnswer(i)}
                className={`relative p-4 rounded-xl text-white font-medium text-left transition-all ${OPTION_COLORS[i]}
                  ${answered && isCorrect ? "ring-4 ring-green-300" : ""}
                  ${answered && isSelected && !isCorrect ? "ring-4 ring-red-300 opacity-70" : ""}
                  ${answered && !isSelected && !isCorrect ? "opacity-40" : ""}
                  disabled:cursor-default`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)})</span> {op}
                {answered && isCorrect && <CheckCircle className="absolute top-2 right-2 h-5 w-5" />}
                {answered && isSelected && !isCorrect && <XCircle className="absolute top-2 right-2 h-5 w-5" />}
              </motion.button>
            );
          })}
        </div>

        {/* Result feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className={showResult.correct ? "border-accent bg-accent/5" : "border-destructive bg-destructive/5"}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{showResult.correct ? "✅ ¡Correcto!" : "❌ Incorrecto"}</p>
                  <p className="text-lg font-mono">{showResult.points > 0 ? "+" : ""}{showResult.points} puntos</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Power-ups */}
        {!answered && (
          <div className="flex justify-center gap-2">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => useMyPowerup("congelar")} disabled={myPowerups.congelar <= 0} className="gap-1">
                <Snowflake className="h-4 w-4 text-blue-400" /> {myPowerups.congelar}
              </Button>
            </TooltipTrigger><TooltipContent>Congelar tiempo 5s</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => useMyPowerup("50_50")} disabled={myPowerups["50_50"] <= 0} className="gap-1">
                <Divide className="h-4 w-4 text-orange-400" /> {myPowerups["50_50"]}
              </Button>
            </TooltipTrigger><TooltipContent>Eliminar 2 opciones</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => useMyPowerup("x2")} disabled={myPowerups.x2 <= 0} className="gap-1">
                <Zap className="h-4 w-4 text-green-400" /> {myPowerups.x2}
              </Button>
            </TooltipTrigger><TooltipContent>Duplicar puntos</TooltipContent></Tooltip>
          </div>
        )}
      </div>
    );
  }

  // Results between questions
  if (comp?.estado === "resultados") {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-1">Clasificación</h3>
            <p className="text-muted-foreground text-sm mb-4">Esperando siguiente pregunta...</p>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((p, i) => (
                <motion.div key={p.id} initial={{ x: -20 }} animate={{ x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${p.user_id === user?.id ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/50"}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-6 text-center">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                    <span className="text-sm font-medium">{p.profiles?.nombre} {p.profiles?.apellidos}</span>
                    {p.racha >= 3 && <Badge variant="secondary" className="text-[10px]">🔥{p.racha}</Badge>}
                  </div>
                  <span className="font-mono font-bold">{p.puntos}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Finalized - podium
  if (comp?.estado === "finalizada") {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <Card className="overflow-hidden">
          <CardContent className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold mb-2">🎉 ¡Competencia Finalizada!</h2>
            <p className="text-muted-foreground mb-6">{comp.titulo}</p>

            {/* Podium */}
            <div className="flex justify-center items-end gap-3 mb-8">
              {[1, 0, 2].map(pos => {
                const p = leaderboard[pos];
                if (!p) return null;
                const heights = ["h-28", "h-20", "h-16"];
                const colors = ["bg-neon-orange", "bg-muted-foreground", "bg-progress"];
                const medals = ["🥇", "🥈", "🥉"];
                const actualPos = pos === 1 ? 0 : pos === 0 ? 1 : 2;
                return (
                  <motion.div key={p.id} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: actualPos * 0.4, type: "spring" }} className="flex flex-col items-center">
                    <span className="text-4xl mb-1">{medals[actualPos]}</span>
                    <p className="font-bold text-sm">{p.profiles?.nombre}</p>
                    <p className="text-xs text-muted-foreground mb-2">{p.puntos} pts</p>
                    <div className={`${heights[actualPos]} w-16 ${colors[actualPos]} rounded-t-lg flex items-end justify-center pb-2`}>
                      <span className="text-white font-bold">{actualPos + 1}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* My result */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Tu posición</p>
                <p className="text-2xl font-bold">#{myRank} — {myPoints} puntos</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import katex from "katex";
import "katex/dist/katex.min.css";

function RenderContent({ text }: { text: string | null }) {
  if (!text) return null;
  // Render LaTeX: $$...$$ for block, $...$ for inline
  const html = text
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
      try { return `<div class="my-2 text-center">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })}</div>`; }
      catch { return tex; }
    })
    .replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
      try { return katex.renderToString(tex.trim(), { throwOnError: false }); }
      catch { return tex; }
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\n/g, '<br/>');
  return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

function YouTubeEmbed({ url }: { url: string }) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (!match) return <a href={url} target="_blank" rel="noreferrer" className="text-secondary underline">{url}</a>;
  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe src={`https://www.youtube.com/embed/${match[1]}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  );
}

function Flashcard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="cursor-pointer perspective-1000" onClick={() => setFlipped(!flipped)}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }} className="relative w-full min-h-[150px]" style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0 bg-card border rounded-lg p-4 flex items-center justify-center backface-hidden">
          <RenderContent text={front} />
        </div>
        <div className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <RenderContent text={back} />
        </div>
      </motion.div>
    </div>
  );
}

function QuizComponent({ sesionId }: { sesionId: string }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [finished, setFinished] = useState(false);

  const { data: allQuestions, isLoading } = useQuery({
    queryKey: ["quiz-questions", sesionId],
    queryFn: async () => {
      const { data: answered } = await supabase.from("quiz_respuestas").select("pregunta_id").eq("user_id", profile!.id);
      const answeredIds = new Set(answered?.map(a => a.pregunta_id) || []);
      const { data: all } = await supabase.from("quiz_preguntas").select("*").eq("sesion_id", sesionId);
      let available = (all || []).filter(q => !answeredIds.has(q.id));
      if (available.length === 0) available = all || [];
      return available.sort(() => Math.random() - 0.5).slice(0, 10);
    },
    enabled: !!profile,
  });

  useEffect(() => { if (allQuestions) setQuestions(allQuestions); }, [allQuestions]);

  useEffect(() => {
    if (finished || showResult || questions.length === 0) return;
    const q = questions[current];
    setTimeLeft(q?.tiempo_limite || 60);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); handleAnswer(-1); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [current, finished, showResult, questions]);

  const saveMutation = useMutation({
    mutationFn: async ({ preguntaId, correcta, tiempo }: { preguntaId: string; correcta: boolean; tiempo: number }) => {
      await supabase.from("quiz_respuestas").insert({ user_id: profile!.id, pregunta_id: preguntaId, correcta, tiempo_usado: tiempo });
    },
  });

  const handleAnswer = useCallback((optionIdx: number) => {
    if (showResult) return;
    const q = questions[current];
    const correct = optionIdx === q.respuesta_correcta;
    setSelected(optionIdx);
    setShowResult(true);
    setResults(prev => [...prev, correct]);
    saveMutation.mutate({ preguntaId: q.id, correcta: correct, tiempo: (q.tiempo_limite || 60) - timeLeft });
  }, [current, questions, showResult, timeLeft]);

  const next = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      const score = results.filter(Boolean).length / questions.length;
      if (score > 0.9) confetti({ particleCount: 200, spread: 100 });
    } else {
      setCurrent(prev => prev + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (questions.length === 0) return <p className="text-center text-muted-foreground py-8">No hay preguntas disponibles para esta sesión.</p>;

  if (finished) {
    const correct = results.filter(Boolean).length;
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-8">
        <h3 className="text-2xl font-display font-bold">Resultado del Quiz</h3>
        <div className="w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center" style={{ borderColor: pct >= 90 ? "hsl(var(--success))" : pct >= 60 ? "hsl(var(--progress))" : "hsl(var(--destructive))" }}>
          <span className="text-3xl font-bold">{pct}%</span>
        </div>
        <p className="text-muted-foreground">{correct} de {questions.length} correctas</p>
        <Button variant="neon" onClick={() => { setCurrent(0); setSelected(null); setShowResult(false); setResults([]); setFinished(false); qc.invalidateQueries({ queryKey: ["quiz-questions", sesionId] }); }}>
          <RotateCcw className="h-4 w-4 mr-2" />Intentar de nuevo
        </Button>
      </motion.div>
    );
  }

  const q = questions[current];
  const opciones = (q.opciones as string[]) || [];
  const timerPct = (timeLeft / (q.tiempo_limite || 60)) * 100;
  const timerColor = timerPct > 50 ? "bg-success" : timerPct > 25 ? "bg-progress" : "bg-destructive";

  return (
    <div className="quiz-no-copy space-y-4" onContextMenu={e => e.preventDefault()} onCopy={e => e.preventDefault()}>
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{current + 1} / {questions.length}</Badge>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
          </div>
          <span className="text-sm font-mono">{timeLeft}s</span>
        </div>
      </div>

      <Card>
        <CardContent className="py-6 quiz-no-copy" onCopy={e => e.preventDefault()}>
          <div className="text-lg font-medium mb-6"><RenderContent text={q.pregunta} /></div>
          <div className="grid gap-3">
            {opciones.map((opt: string, i: number) => {
              const letters = ["A", "B", "C", "D", "E", "F"];
              let cls = "p-4 rounded-lg border text-left transition-all cursor-pointer text-sm";
              if (showResult) {
                if (i === q.respuesta_correcta) cls += " border-success bg-success/10";
                else if (i === selected) cls += " border-destructive bg-destructive/10";
                else cls += " border-border opacity-50";
              } else if (selected === i) {
                cls += " border-primary bg-primary/10";
              } else {
                cls += " border-border hover:border-primary/50";
              }
              return (
                <button key={i} className={cls} onClick={() => !showResult && handleAnswer(i)} disabled={showResult}>
                  <span className="font-bold mr-2">{letters[i] || i})</span> <RenderContent text={opt} />
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {showResult && q.explicacion && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 p-3 rounded-lg bg-muted text-sm">
                <p className="font-semibold mb-1">Explicación:</p>
                <RenderContent text={q.explicacion} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {showResult && (
        <Button variant="neon" className="w-full" onClick={next}>
          {current + 1 >= questions.length ? "Ver Resultado" : "Siguiente →"}
        </Button>
      )}
    </div>
  );
}

function ExerciseCard({ content }: { content: any }) {
  const [showSolution, setShowSolution] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          {content.titulo || "Ejercicio"}
          {content.solucion && (
            <Button variant="ghost" size="sm" onClick={() => setShowSolution(!showSolution)}>
              {showSolution ? <><EyeOff className="h-4 w-4 mr-1" />Ocultar</> : <><Eye className="h-4 w-4 mr-1" />Solución</>}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <RenderContent text={content.texto} />
        <AnimatePresence>
          {showSolution && content.solucion && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm font-semibold mb-1 text-success">Solución:</p>
              <RenderContent text={content.solucion} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function StudentSesion() {
  const { id } = useParams<{ id: string }>();

  const { data: sesion, isLoading } = useQuery({
    queryKey: ["sesion-detail", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("sesiones")
        .select("*, pestanas(*, contenido(*))")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!sesion) return <p className="text-center text-muted-foreground py-8">Sesión no encontrada</p>;

  const tabs = ((sesion.pestanas as any[]) || []).sort((a: any, b: any) => a.orden - b.orden);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">{sesion.titulo}</h2>
      <Tabs defaultValue={tabs[0]?.id}>
        <TabsList className="flex-wrap">
          {tabs.map((t: any) => <TabsTrigger key={t.id} value={t.id}>{t.nombre}</TabsTrigger>)}
        </TabsList>
        {tabs.map((tab: any) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.nombre.toLowerCase() === "quiz" ? (
              <QuizComponent sesionId={id!} />
            ) : tab.nombre.toLowerCase() === "trucos" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {((tab.contenido as any[]) || []).sort((a: any, b: any) => a.orden - b.orden).map((c: any) => (
                  <Flashcard key={c.id} front={c.titulo || "Truco"} back={c.texto || ""} />
                ))}
                {(!tab.contenido || (tab.contenido as any[]).length === 0) && <p className="text-muted-foreground col-span-full text-center py-8">Sin trucos todavía.</p>}
              </div>
            ) : tab.nombre.toLowerCase() === "ejercicios" ? (
              <div className="space-y-4">
                {((tab.contenido as any[]) || []).sort((a: any, b: any) => a.orden - b.orden).map((c: any) => (
                  <ExerciseCard key={c.id} content={c} />
                ))}
                {(!tab.contenido || (tab.contenido as any[]).length === 0) && <p className="text-muted-foreground text-center py-8">Sin ejercicios todavía.</p>}
              </div>
            ) : (
              <div className="space-y-6">
                {((tab.contenido as any[]) || []).sort((a: any, b: any) => a.orden - b.orden).map((c: any) => (
                  <Card key={c.id}>
                    <CardHeader><CardTitle className="text-lg">{c.titulo}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <RenderContent text={c.texto} />
                      {c.video_url && <YouTubeEmbed url={c.video_url} />}
                    </CardContent>
                  </Card>
                ))}
                {(!tab.contenido || (tab.contenido as any[]).length === 0) && <p className="text-muted-foreground text-center py-8">Sin contenido todavía.</p>}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

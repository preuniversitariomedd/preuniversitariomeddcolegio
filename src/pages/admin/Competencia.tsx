import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Play, Square, Trophy, Users, Clock, Zap, Copy, Trash2, Import,
  Snowflake, Divide, X2, ArrowRight, SkipForward, Megaphone, CheckCircle, XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type Competencia = {
  id: string; titulo: string; codigo: string; estado: string;
  pregunta_actual: number; created_by: string; config: any; created_at: string;
};
type CompPregunta = {
  id: string; competencia_id: string; pregunta: string; opciones: string[];
  respuesta_correcta: number; orden: number; tiempo_limite: number;
  imagen_url: string | null; explicacion: string | null;
};
type Participante = {
  id: string; competencia_id: string; user_id: string; puntos: number;
  racha: number; powerups: any; joined_at: string;
  profiles?: { nombre: string; apellidos: string; avatar_url: string | null };
};
type CompRespuesta = {
  id: string; pregunta_id: string; user_id: string; respuesta: number;
  correcta: boolean; tiempo_usado: number; puntos_ganados: number;
};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AdminCompetencia() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [importSesionId, setImportSesionId] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [tiempoDefault, setTiempoDefault] = useState(30);

  // Queries
  const { data: competencias = [] } = useQuery({
    queryKey: ["competencias"],
    queryFn: async () => {
      const { data } = await supabase.from("competencias").select("*").order("created_at", { ascending: false });
      return (data || []) as Competencia[];
    },
  });

  const comp = competencias.find(c => c.id === selected);

  const { data: preguntas = [] } = useQuery({
    queryKey: ["comp-preguntas", selected],
    queryFn: async () => {
      const { data } = await supabase.from("competencia_preguntas").select("*").eq("competencia_id", selected!).order("orden");
      return (data || []) as CompPregunta[];
    },
    enabled: !!selected,
  });

  const { data: participantes = [] } = useQuery({
    queryKey: ["comp-participantes", selected],
    queryFn: async () => {
      const { data } = await supabase.from("competencia_participantes").select("*, profiles(nombre, apellidos, avatar_url)").eq("competencia_id", selected!).order("puntos", { ascending: false });
      return (data || []) as Participante[];
    },
    enabled: !!selected,
  });

  const { data: respuestas = [] } = useQuery({
    queryKey: ["comp-respuestas", selected],
    queryFn: async () => {
      const { data } = await supabase.from("competencia_respuestas").select("*").eq("competencia_id", selected!);
      return (data || []) as CompRespuesta[];
    },
    enabled: !!selected,
  });

  const { data: sesiones = [] } = useQuery({
    queryKey: ["all-sesiones"],
    queryFn: async () => {
      const { data } = await supabase.from("sesiones").select("id, titulo, curso_id, cursos(titulo)").order("orden");
      return data || [];
    },
  });

  // Realtime
  useEffect(() => {
    if (!selected) return;
    const ch = supabase.channel(`comp-${selected}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competencia_participantes", filter: `competencia_id=eq.${selected}` }, () => {
        qc.invalidateQueries({ queryKey: ["comp-participantes", selected] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "competencia_respuestas", filter: `competencia_id=eq.${selected}` }, () => {
        qc.invalidateQueries({ queryKey: ["comp-respuestas", selected] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "competencias", filter: `id=eq.${selected}` }, () => {
        qc.invalidateQueries({ queryKey: ["competencias"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selected, qc]);

  // Mutations
  const createMut = useMutation({
    mutationFn: async () => {
      const codigo = generateCode();
      const { data, error } = await supabase.from("competencias").insert({ titulo, codigo, created_by: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["competencias"] });
      setSelected(data.id);
      setCreateOpen(false);
      setTitulo("");
      toast({ title: "Competencia creada", description: `Código: ${data.codigo}` });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("competencias").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["competencias"] });
      setSelected(null);
    },
  });

  const updateEstado = useCallback(async (estado: string, preguntaActual?: number) => {
    if (!selected) return;
    const upd: any = { estado };
    if (preguntaActual !== undefined) upd.pregunta_actual = preguntaActual;
    await supabase.from("competencias").update(upd).eq("id", selected);
    qc.invalidateQueries({ queryKey: ["competencias"] });

    // Broadcast state change to students
    supabase.channel(`game-${selected}`).send({
      type: "broadcast",
      event: "state_change",
      payload: { estado, pregunta_actual: preguntaActual ?? comp?.pregunta_actual },
    });
  }, [selected, qc, comp]);

  const importFromSession = useMutation({
    mutationFn: async (sesionId: string) => {
      const { data: quizPreguntas } = await supabase.from("quiz_preguntas").select("*").eq("sesion_id", sesionId);
      if (!quizPreguntas?.length) throw new Error("No hay preguntas en esa sesión");
      const existing = preguntas.length;
      const inserts = quizPreguntas.map((q, i) => ({
        competencia_id: selected!,
        pregunta: q.pregunta,
        opciones: q.opciones,
        respuesta_correcta: q.respuesta_correcta,
        orden: existing + i + 1,
        tiempo_limite: q.tiempo_limite || tiempoDefault,
        imagen_url: q.imagen_url,
        explicacion: q.explicacion,
      }));
      const { error } = await supabase.from("competencia_preguntas").insert(inserts);
      if (error) throw error;
      return inserts.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["comp-preguntas", selected] });
      setImportOpen(false);
      toast({ title: `${count} preguntas importadas` });
    },
  });

  const smartPaste = useCallback(() => {
    if (!pasteText.trim() || !selected) return;
    const bloques = pasteText.split(/---|\n\n\n/).map(b => b.trim()).filter(Boolean);
    const newQs: any[] = [];
    const existing = preguntas.length;

    for (const bloque of bloques) {
      const lines = bloque.split("\n").map(l => l.trim()).filter(Boolean);
      let pregunta = "";
      const opciones: string[] = [];
      let correcta = -1;
      let explicacion = "";

      for (const line of lines) {
        const opMatch = line.match(/^([A-Ea-e])\)\s*(.+)/);
        const corrMatch = line.match(/^(?:CORRECTA|RESPUESTA|CORRECT):\s*([A-Ea-e])/i);
        const expMatch = line.match(/^(?:EXPLICACION|EXPLICACIÓN|EXPLANATION):\s*(.+)/i);

        if (corrMatch) {
          correcta = corrMatch[1].toUpperCase().charCodeAt(0) - 65;
        } else if (expMatch) {
          explicacion = expMatch[1];
        } else if (opMatch) {
          opciones.push(opMatch[2]);
        } else if (opciones.length === 0 && correcta === -1) {
          pregunta += (pregunta ? " " : "") + line.replace(/^(?:PREGUNTA:\s*)/i, "");
        }
      }

      if (pregunta && opciones.length >= 2) {
        newQs.push({
          competencia_id: selected,
          pregunta,
          opciones,
          respuesta_correcta: correcta >= 0 ? correcta : 0,
          orden: existing + newQs.length + 1,
          tiempo_limite: tiempoDefault,
          explicacion: explicacion || null,
        });
      }
    }

    if (newQs.length === 0) {
      toast({ title: "No se detectaron preguntas", variant: "destructive" });
      return;
    }

    supabase.from("competencia_preguntas").insert(newQs).then(({ error }) => {
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      qc.invalidateQueries({ queryKey: ["comp-preguntas", selected] });
      setPasteText("");
      toast({ title: `${newQs.length} preguntas agregadas` });
    });
  }, [pasteText, selected, preguntas, tiempoDefault, qc, toast]);

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("competencia_preguntas").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comp-preguntas", selected] }),
  });

  // Power-up broadcast
  const sendPowerUp = useCallback((tipo: string, targetUserId?: string) => {
    if (!selected) return;
    supabase.channel(`game-${selected}`).send({
      type: "broadcast",
      event: "powerup",
      payload: { tipo, from: "admin", target: targetUserId || "all" },
    });
    toast({ title: `⚡ Power-up: ${tipo}`, description: targetUserId ? "Enviado al estudiante" : "Enviado a todos" });
  }, [selected, toast]);

  // Game control
  const startGame = () => {
    if (preguntas.length === 0) { toast({ title: "Agrega preguntas primero", variant: "destructive" }); return; }
    updateEstado("pregunta", 1);
  };
  const nextQuestion = () => {
    if (!comp) return;
    if (comp.pregunta_actual >= preguntas.length) {
      updateEstado("finalizada");
      confetti({ particleCount: 200, spread: 100 });
    } else {
      updateEstado("pregunta", comp.pregunta_actual + 1);
    }
  };
  const showResults = () => updateEstado("resultados");
  const endGame = () => { updateEstado("finalizada"); confetti({ particleCount: 200, spread: 100 }); };

  const currentQ = comp && preguntas[comp.pregunta_actual - 1];
  const currentResponses = currentQ ? respuestas.filter(r => r.pregunta_id === currentQ.id) : [];
  const answeredCount = currentResponses.length;
  const correctCount = currentResponses.filter(r => r.correcta).length;

  const leaderboard = [...participantes].sort((a, b) => b.puntos - a.puntos);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" /> Competencia en Vivo
        </h1>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nueva Competencia</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Competition List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Competencias</h3>
          {competencias.map(c => (
            <Card key={c.id} className={`cursor-pointer transition-all ${selected === c.id ? "ring-2 ring-primary" : "hover:shadow-md"}`} onClick={() => setSelected(c.id)}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{c.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={c.estado === "lobby" ? "secondary" : c.estado === "finalizada" ? "outline" : "default"} className="text-[10px]">
                        {c.estado === "lobby" ? "Esperando" : c.estado === "pregunta" ? "En vivo" : c.estado === "resultados" ? "Resultados" : "Finalizada"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{c.codigo}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); deleteMut.mutate(c.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {competencias.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay competencias</p>}
        </div>

        {/* Main Area */}
        <div className="lg:col-span-3">
          {!comp ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">Selecciona o crea una competencia</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{comp.titulo}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-sm"><Users className="h-4 w-4" /> {participantes.length} participantes</span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">{preguntas.length} preguntas</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                        <span className="text-lg font-mono font-bold tracking-widest">{comp.codigo}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(comp.codigo); toast({ title: "Código copiado" }); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {comp.estado === "lobby" && <Button onClick={startGame} className="gap-2"><Play className="h-4 w-4" /> Iniciar</Button>}
                      {comp.estado === "pregunta" && <Button onClick={showResults} variant="secondary" className="gap-2"><Square className="h-4 w-4" /> Ver Resultados</Button>}
                      {comp.estado === "resultados" && <Button onClick={nextQuestion} className="gap-2"><ArrowRight className="h-4 w-4" /> {comp.pregunta_actual >= preguntas.length ? "Finalizar" : "Siguiente"}</Button>}
                      {(comp.estado === "pregunta" || comp.estado === "resultados") && <Button onClick={endGame} variant="destructive" size="sm">Terminar</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Game View */}
              {(comp.estado === "pregunta" || comp.estado === "resultados") && currentQ && (
                <Card className="border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="text-sm">Pregunta {comp.pregunta_actual} de {preguntas.length}</Badge>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" /> {currentQ.tiempo_limite}s
                        <span className="ml-2">Respondidas: {answeredCount}/{participantes.length}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-4">{currentQ.pregunta}</h3>
                    {currentQ.imagen_url && <img src={currentQ.imagen_url} alt="" className="max-h-48 rounded-lg mb-4 object-contain" />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(currentQ.opciones as string[]).map((op, i) => {
                        const isCorrect = i === currentQ.respuesta_correcta;
                        const showCorrect = comp.estado === "resultados";
                        return (
                          <div key={i} className={`p-3 rounded-lg border-2 transition-all ${showCorrect ? (isCorrect ? "border-green-500 bg-green-500/10" : "border-border opacity-60") : "border-border"}`}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + i)})</span> {op}
                            {showCorrect && isCorrect && <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />}
                          </div>
                        );
                      })}
                    </div>
                    {comp.estado === "resultados" && (
                      <div className="mt-4 flex items-center gap-4">
                        <Progress value={participantes.length > 0 ? (correctCount / participantes.length) * 100 : 0} className="flex-1" />
                        <span className="text-sm font-medium">{correctCount}/{answeredCount} correctas ({answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%)</span>
                      </div>
                    )}
                    {currentQ.explicacion && comp.estado === "resultados" && (
                      <p className="mt-3 text-sm text-muted-foreground bg-muted p-3 rounded-lg">💡 {currentQ.explicacion}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Admin Power-ups */}
              {(comp.estado === "pregunta" || comp.estado === "resultados") && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Potenciadores (Admin)</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => sendPowerUp("congelar")} className="gap-1"><Snowflake className="h-4 w-4 text-blue-400" /> Congelar</Button>
                    </TooltipTrigger><TooltipContent>Congela el tiempo para todos</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => sendPowerUp("50_50")} className="gap-1"><Divide className="h-4 w-4 text-orange-400" /> 50/50</Button>
                    </TooltipTrigger><TooltipContent>Elimina 2 opciones incorrectas para todos</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => sendPowerUp("x2")} className="gap-1"><X2 className="h-4 w-4 text-green-400" /> x2 Puntos</Button>
                    </TooltipTrigger><TooltipContent>Duplica puntos para la siguiente correcta (todos)</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => sendPowerUp("x5_penalty")} className="gap-1 text-destructive"><XCircle className="h-4 w-4" /> x5 Penalización</Button>
                    </TooltipTrigger><TooltipContent>x5 puntos negativos por incorrecta (todos)</TooltipContent></Tooltip>
                  </CardContent>
                </Card>
              )}

              {/* Finalized - Podium */}
              {comp.estado === "finalizada" && leaderboard.length > 0 && (
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2"><Trophy className="h-6 w-6 text-yellow-500" /> Podio Final</h3>
                    <div className="flex justify-center items-end gap-4 mb-8">
                      {[1, 0, 2].map(pos => {
                        const p = leaderboard[pos];
                        if (!p) return null;
                        const heights = ["h-32", "h-24", "h-20"];
                        const colors = ["bg-yellow-500", "bg-gray-400", "bg-amber-700"];
                        const medals = ["🥇", "🥈", "🥉"];
                        const actualPos = pos === 1 ? 0 : pos === 0 ? 1 : 2;
                        return (
                          <motion.div key={p.id} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: actualPos * 0.3 }} className="flex flex-col items-center">
                            <span className="text-3xl mb-1">{medals[actualPos]}</span>
                            <p className="font-bold text-sm mb-1">{p.profiles?.nombre}</p>
                            <p className="text-xs text-muted-foreground mb-2">{p.puntos} pts</p>
                            <div className={`${heights[actualPos]} w-20 ${colors[actualPos]} rounded-t-lg flex items-end justify-center pb-2`}>
                              <span className="text-white font-bold text-lg">{actualPos + 1}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="space-y-1">
                      {leaderboard.slice(3).map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted">
                          <span className="text-sm"><span className="font-bold mr-2">{i + 4}.</span> {p.profiles?.nombre} {p.profiles?.apellidos}</span>
                          <span className="text-sm font-mono">{p.puntos} pts</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Leaderboard (live) */}
              {(comp.estado === "pregunta" || comp.estado === "resultados") && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Clasificación en Vivo</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-60 overflow-auto">
                      {leaderboard.map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm w-6">{i + 1}</span>
                            <span className="text-sm">{p.profiles?.nombre} {p.profiles?.apellidos}</span>
                            {p.racha >= 3 && <Badge variant="secondary" className="text-[10px]">🔥 {p.racha}</Badge>}
                          </div>
                          <span className="font-mono text-sm">{p.puntos}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lobby - Participants & Questions Setup */}
              {comp.estado === "lobby" && (
                <Tabs defaultValue="preguntas">
                  <TabsList><TabsTrigger value="preguntas">Preguntas ({preguntas.length})</TabsTrigger><TabsTrigger value="participantes">Participantes ({participantes.length})</TabsTrigger></TabsList>

                  <TabsContent value="preguntas" className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Import className="h-4 w-4 mr-1" /> Importar de sesión</Button>
                      <div className="flex-1" />
                      <Input type="number" className="w-20" value={tiempoDefault} onChange={e => setTiempoDefault(+e.target.value)} min={5} max={120} />
                      <span className="text-sm text-muted-foreground self-center">seg/pregunta</span>
                    </div>

                    {/* Smart Paste */}
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm font-medium">📋 Pegado Inteligente</p>
                        <Textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={6}
                          placeholder={"Pregunta aquí\nA) Opción 1\nB) Opción 2\nC) Opción 3\nD) Opción 4\nCORRECTA: B\nEXPLICACION: Texto\n---\nSiguiente pregunta..."} />
                        <Button size="sm" onClick={smartPaste} disabled={!pasteText.trim()}>Agregar preguntas</Button>
                      </CardContent>
                    </Card>

                    {/* Questions list */}
                    {preguntas.map((q, i) => (
                      <Card key={q.id}>
                        <CardContent className="p-3 flex items-start gap-3">
                          <Badge variant="outline" className="mt-1 shrink-0">{i + 1}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{q.pregunta}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {(q.opciones as string[]).map((o, j) => (
                                <Badge key={j} variant={j === q.respuesta_correcta ? "default" : "secondary"} className="text-[10px]">
                                  {String.fromCharCode(65 + j)}) {o.substring(0, 30)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteQuestion.mutate(q.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="participantes">
                    <div className="space-y-2">
                      <AnimatePresence>
                        {participantes.map(p => (
                          <motion.div key={p.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                              {p.profiles?.nombre?.[0]}
                            </div>
                            <span className="text-sm">{p.profiles?.nombre} {p.profiles?.apellidos}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {participantes.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>Esperando participantes...</p>
                          <p className="text-sm mt-1">Comparte el código <span className="font-mono font-bold">{comp.codigo}</span></p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Competencia</DialogTitle></DialogHeader>
          <Input placeholder="Título de la competencia" value={titulo} onChange={e => setTitulo(e.target.value)} />
          <DialogFooter><Button onClick={() => createMut.mutate()} disabled={!titulo.trim()}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from session dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar preguntas de sesión</DialogTitle></DialogHeader>
          <Select value={importSesionId} onValueChange={setImportSesionId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar sesión" /></SelectTrigger>
            <SelectContent>
              {sesiones.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.cursos?.titulo} — {s.titulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter><Button onClick={() => importFromSession.mutate(importSesionId)} disabled={!importSesionId}>Importar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

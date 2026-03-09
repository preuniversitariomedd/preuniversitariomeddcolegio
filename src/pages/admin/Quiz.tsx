import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClipboardImage } from "@/hooks/useClipboardImage";
import { Loader2, Plus, Trash2, Upload, Wand2, ClipboardPaste, Copy, Sparkles, Search, Download, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadCSV } from "@/lib/exportUtils";

function parseSmartQuestion(text: string) {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  const opciones: string[] = [];
  let pregunta = "";
  const optRegex = /^([a-eA-E])\)\s*(.+)/;

  let questionLines: string[] = [];
  let foundOption = false;

  for (const line of lines) {
    const match = line.match(optRegex);
    if (match) {
      foundOption = true;
      opciones.push(match[2].trim());
    } else if (!foundOption) {
      questionLines.push(line);
    }
  }

  pregunta = questionLines.join("\n").trim();
  return { pregunta, opciones };
}

export default function AdminQuiz() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sesionId, setSesionId] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openSmart, setOpenSmart] = useState(false);
  const [openCopyFrom, setOpenCopyFrom] = useState(false);
  const [copyFromSesion, setCopyFromSesion] = useState("");
  const [importText, setImportText] = useState("");
  const [smartText, setSmartText] = useState("");
  const [smartParsed, setSmartParsed] = useState<{ pregunta: string; opciones: string[] } | null>(null);
  const [smartCorrecta, setSmartCorrecta] = useState("0");
  const [smartExplicacion, setSmartExplicacion] = useState("");
  const [smartTiempo, setSmartTiempo] = useState("60");
  const [form, setForm] = useState({ pregunta: "", opcA: "", opcB: "", opcC: "", opcD: "", correcta: "0", explicacion: "", tiempo: "60", imagen_url: "" });
  const [searchFilter, setSearchFilter] = useState("");
  const [tiempoFilter, setTiempoFilter] = useState("all");
  const [openAI, setOpenAI] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [reviewData, setReviewData] = useState<{ revisiones: any[]; resumen: string } | null>(null);
  const [aiTema, setAiTema] = useState("");
  const [aiContexto, setAiContexto] = useState("");
  const [aiCantidad, setAiCantidad] = useState("5");
  
  const { handlePaste: handleSmartPaste } = useClipboardImage(useCallback((url: string) => {
    toast({ title: "Imagen pegada desde portapapeles" });
    // For smart import — we don't have imagen_url there, so just notify
  }, [toast]));

  const { handlePaste: handleFormPaste } = useClipboardImage(useCallback((url: string) => {
    setForm(prev => ({ ...prev, imagen_url: url }));
    toast({ title: "Imagen pegada desde portapapeles" });
  }, [toast]));

  const { data: sesiones } = useQuery({
    queryKey: ["all-sesiones"],
    queryFn: async () => {
      const { data } = await supabase.from("sesiones").select("id, titulo, orden, cursos(titulo)").order("orden");
      return data || [];
    },
  });

  const { data: preguntas, isLoading } = useQuery({
    queryKey: ["quiz-preguntas", sesionId],
    queryFn: async () => {
      if (!sesionId) return [];
      const { data } = await supabase.from("quiz_preguntas").select("*").eq("sesion_id", sesionId);
      return data || [];
    },
    enabled: !!sesionId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quiz_preguntas").insert({
        sesion_id: sesionId,
        pregunta: form.pregunta,
        opciones: [form.opcA, form.opcB, form.opcC, form.opcD],
        respuesta_correcta: parseInt(form.correcta),
        explicacion: form.explicacion || null,
        tiempo_limite: parseInt(form.tiempo),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pregunta añadida" });
      setOpenAdd(false);
      setForm({ pregunta: "", opcA: "", opcB: "", opcC: "", opcD: "", correcta: "0", explicacion: "", tiempo: "60", imagen_url: "" });
      qc.invalidateQueries({ queryKey: ["quiz-preguntas", sesionId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const smartAddMutation = useMutation({
    mutationFn: async () => {
      if (!smartParsed) return;
      const { error } = await supabase.from("quiz_preguntas").insert({
        sesion_id: sesionId,
        pregunta: smartParsed.pregunta,
        opciones: smartParsed.opciones,
        respuesta_correcta: parseInt(smartCorrecta),
        explicacion: smartExplicacion || null,
        tiempo_limite: parseInt(smartTiempo),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pregunta añadida automáticamente" });
      setOpenSmart(false);
      setSmartText("");
      setSmartParsed(null);
      setSmartExplicacion("");
      setSmartCorrecta("0");
      qc.invalidateQueries({ queryKey: ["quiz-preguntas", sesionId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("importar-quiz", {
        body: { sesion_id: sesionId, texto: importText },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `✅ ${data.importadas} preguntas importadas${data.errores?.length ? `, ❌ ${data.errores.length} con errores` : ""}` });
      setOpenImport(false);
      setImportText("");
      qc.invalidateQueries({ queryKey: ["quiz-preguntas", sesionId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quiz_preguntas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quiz-preguntas", sesionId] }),
  });

  const copyFromMutation = useMutation({
    mutationFn: async () => {
      if (!copyFromSesion || !sesionId) return;
      const { data: sourceQuestions } = await supabase.from("quiz_preguntas").select("*").eq("sesion_id", copyFromSesion);
      if (!sourceQuestions?.length) throw new Error("No hay preguntas en la sesión origen");
      let count = 0;
      for (const q of sourceQuestions) {
        await supabase.from("quiz_preguntas").insert({
          sesion_id: sesionId,
          pregunta: q.pregunta,
          opciones: q.opciones,
          respuesta_correcta: q.respuesta_correcta,
          explicacion: q.explicacion,
          tiempo_limite: q.tiempo_limite,
          imagen_url: q.imagen_url,
        });
        count++;
      }
      return count;
    },
    onSuccess: (count) => {
      toast({ title: `${count} preguntas importadas` });
      setOpenCopyFrom(false);
      setCopyFromSesion("");
      qc.invalidateQueries({ queryKey: ["quiz-preguntas", sesionId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const aiMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generar-quiz-ai", {
        body: { sesion_id: sesionId, tema: aiTema, cantidad: parseInt(aiCantidad), contexto: aiContexto },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `✅ ${data.insertadas} preguntas generadas con IA` });
      setOpenAI(false);
      setAiTema("");
      setAiContexto("");
      qc.invalidateQueries({ queryKey: ["quiz-preguntas", sesionId] });
    },
    onError: (e: Error) => toast({ title: "Error IA", description: e.message, variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!preguntas?.length) throw new Error("No hay preguntas para revisar");
      const { data, error } = await supabase.functions.invoke("revisar-quiz-ai", {
        body: { preguntas: preguntas.map(p => ({ pregunta: p.pregunta, opciones: p.opciones, respuesta_correcta: p.respuesta_correcta, explicacion: p.explicacion })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setReviewData(data);
      setOpenReview(true);
    },
    onError: (e: Error) => toast({ title: "Error revisión IA", description: e.message, variant: "destructive" }),
  });

  const getCalifIcon = (cal: string) => {
    switch (cal) {
      case "excelente": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "buena": return <Star className="h-5 w-5 text-blue-500" />;
      case "mejorable": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "problematica": return <XCircle className="h-5 w-5 text-destructive" />;
      default: return null;
    }
  };

  const getCalifColor = (cal: string) => {
    switch (cal) {
      case "excelente": return "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400";
      case "buena": return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
      case "mejorable": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400";
      case "problematica": return "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400";
      default: return "";
    }
  };


  const handleSmartParse = () => {
    const parsed = parseSmartQuestion(smartText);
    if (!parsed.pregunta || parsed.opciones.length < 2) {
      toast({ title: "No se detectó pregunta/opciones", description: "Asegúrate de que las opciones estén en formato a) b) c) d) e)", variant: "destructive" });
      return;
    }
    setSmartParsed(parsed);
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Gestión de Quiz</h2>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-80">
          <Label>Sesión</Label>
          <Select value={sesionId} onValueChange={setSesionId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar sesión" /></SelectTrigger>
            <SelectContent>
              {sesiones?.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.orden}. {s.titulo} ({(s.cursos as any)?.titulo})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {sesionId && (
          <div className="flex gap-2 flex-wrap">
            <Dialog open={openSmart} onOpenChange={v => { setOpenSmart(v); if (!v) { setSmartParsed(null); setSmartText(""); } }}>
              <DialogTrigger asChild><Button variant="neon" size="sm"><Wand2 className="h-4 w-4 mr-1" />Pegar Pregunta</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Importación Inteligente</DialogTitle></DialogHeader>
                {!smartParsed ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Pega la pregunta completa con opciones a) b) c) d) e). El sistema detectará automáticamente la estructura.</p>
                    <Textarea rows={10} value={smartText} onChange={e => setSmartText(e.target.value)} placeholder={"Determine cuál de las siguientes afirmaciones...\n\na) opción 1\nb) opción 2\nc) opción 3\nd) opción 4\ne) opción 5"} />
                    <Button variant="neon" className="w-full" onClick={handleSmartParse} disabled={!smartText.trim()}>
                      <Wand2 className="h-4 w-4 mr-1" />Detectar estructura
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm font-semibold mb-2">Pregunta detectada:</p>
                      <p className="text-sm">{smartParsed.pregunta}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Opciones detectadas ({smartParsed.opciones.length}):</p>
                      {smartParsed.opciones.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                          <Badge variant="outline">{letters[i]}</Badge>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Respuesta Correcta</Label>
                        <Select value={smartCorrecta} onValueChange={setSmartCorrecta}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {smartParsed.opciones.map((_, i) => (
                              <SelectItem key={i} value={String(i)}>{letters[i]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tiempo (s)</Label>
                        <Input type="number" value={smartTiempo} onChange={e => setSmartTiempo(e.target.value)} min={10} max={300} />
                      </div>
                    </div>
                    <div>
                      <Label>Explicación</Label>
                      <Textarea rows={3} value={smartExplicacion} onChange={e => setSmartExplicacion(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setSmartParsed(null)}>← Volver</Button>
                      <Button variant="neon" className="flex-1" onClick={() => smartAddMutation.mutate()} disabled={smartAddMutation.isPending}>
                        {smartAddMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Pregunta"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Manual</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nueva Pregunta</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4" onPaste={handleFormPaste}>
                  <div><Label>Pregunta (Markdown + LaTeX)</Label><Textarea rows={3} value={form.pregunta} onChange={e => setForm({ ...form, pregunta: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>A)</Label><Input value={form.opcA} onChange={e => setForm({ ...form, opcA: e.target.value })} required /></div>
                    <div><Label>B)</Label><Input value={form.opcB} onChange={e => setForm({ ...form, opcB: e.target.value })} required /></div>
                    <div><Label>C)</Label><Input value={form.opcC} onChange={e => setForm({ ...form, opcC: e.target.value })} required /></div>
                    <div><Label>D)</Label><Input value={form.opcD} onChange={e => setForm({ ...form, opcD: e.target.value })} required /></div>
                  </div>
                  {form.imagen_url && (
                    <div className="relative">
                      <img src={form.imagen_url} alt="Preview" className="max-h-32 rounded border" />
                      <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => setForm({ ...form, imagen_url: "" })}>✕</Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><ClipboardPaste className="h-3 w-3" /> Pega una imagen (Ctrl+V) para adjuntarla</p>
                  <div className="flex gap-4">
                    <div>
                      <Label>Correcta</Label>
                      <Select value={form.correcta} onValueChange={v => setForm({ ...form, correcta: v })}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">A</SelectItem>
                          <SelectItem value="1">B</SelectItem>
                          <SelectItem value="2">C</SelectItem>
                          <SelectItem value="3">D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Tiempo (s)</Label><Input type="number" value={form.tiempo} onChange={e => setForm({ ...form, tiempo: e.target.value })} min={10} max={300} className="w-24" /></div>
                  </div>
                  <div><Label>Explicación</Label><Textarea rows={2} value={form.explicacion} onChange={e => setForm({ ...form, explicacion: e.target.value })} /></div>
                  <Button type="submit" className="w-full" variant="neon" disabled={addMutation.isPending}>Guardar</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openImport} onOpenChange={setOpenImport}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" />Pegar Quiz</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Importar Quiz (Pegar texto)</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Textarea rows={12} value={importText} onChange={e => setImportText(e.target.value)} placeholder={"PREGUNTA: ¿Cuál es...?\nA) opción\nB) opción\nC) opción\nD) opción\nCORRECTA: A\nEXPLICACION: ...\nTIEMPO: 60\n---"} />
                  <Button onClick={() => importMutation.mutate()} className="w-full" variant="neon" disabled={importMutation.isPending || !importText.trim()}>
                    {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openCopyFrom} onOpenChange={v => { setOpenCopyFrom(v); if (!v) setCopyFromSesion(""); }}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Copy className="h-4 w-4 mr-1" />De otra sesión</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Importar preguntas de otra sesión</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Sesión origen</Label>
                    <Select value={copyFromSesion} onValueChange={setCopyFromSesion}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar sesión" /></SelectTrigger>
                      <SelectContent>
                        {sesiones?.filter(s => s.id !== sesionId).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.orden}. {s.titulo} ({(s.cursos as any)?.titulo})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="neon" className="w-full" onClick={() => copyFromMutation.mutate()} disabled={copyFromMutation.isPending || !copyFromSesion}>
                    {copyFromMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar preguntas"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openAI} onOpenChange={v => { setOpenAI(v); if (!v) { setAiTema(""); setAiContexto(""); } }}>
              <DialogTrigger asChild><Button variant="neon" size="sm" className="bg-gradient-to-r from-primary to-accent"><Sparkles className="h-4 w-4 mr-1" />Generar con IA</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generar preguntas con IA</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Tema *</Label><Input value={aiTema} onChange={e => setAiTema(e.target.value)} placeholder="Ej: Tabla periódica, enlaces químicos" /></div>
                  <div><Label>Contexto adicional (opcional)</Label><Textarea rows={3} value={aiContexto} onChange={e => setAiContexto(e.target.value)} placeholder="Nivel de dificultad, subtemas específicos..." /></div>
                  <div><Label>Cantidad de preguntas</Label>
                    <Select value={aiCantidad} onValueChange={setAiCantidad}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[3, 5, 7, 10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="neon" className="w-full" onClick={() => aiMutation.mutate()} disabled={aiMutation.isPending || !aiTema.trim()}>
                    {aiMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Generando...</> : <><Sparkles className="h-4 w-4 mr-1" />Generar</>}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {sesionId && (() => {
        const filteredPreguntas = preguntas?.filter(p => {
          const matchText = !searchFilter || p.pregunta.toLowerCase().includes(searchFilter.toLowerCase());
          const matchTiempo = tiempoFilter === "all" || String(p.tiempo_limite) === tiempoFilter;
          return matchText && matchTiempo;
        });
        const tiempoOptions = [...new Set(preguntas?.map(p => p.tiempo_limite).filter(Boolean))].sort((a, b) => (a ?? 0) - (b ?? 0));
        return (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">{filteredPreguntas?.length || 0} de {preguntas?.length || 0} preguntas</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filtrar preguntas..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="pl-8 h-9" />
              </div>
              <Select value={tiempoFilter} onValueChange={setTiempoFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Tiempo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo tiempo</SelectItem>
                  {tiempoOptions.map(t => <SelectItem key={t} value={String(t)}>{t}s</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => {
                if (!filteredPreguntas?.length) return;
                downloadCSV(filteredPreguntas.map((p, i) => {
                  const opcs = (p.opciones as string[]) || [];
                  return {
                    "#": i + 1,
                    Pregunta: p.pregunta,
                    "Opción A": opcs[0] || "",
                    "Opción B": opcs[1] || "",
                    "Opción C": opcs[2] || "",
                    "Opción D": opcs[3] || "",
                    Correcta: letters[p.respuesta_correcta] || "?",
                    Tiempo: `${p.tiempo_limite}s`,
                    Explicación: p.explicacion || "",
                  };
                }), "quiz-preguntas");
              }}><Download className="h-4 w-4 mr-1" />CSV</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Pregunta</TableHead>
                    <TableHead className="w-20">Opciones</TableHead>
                    <TableHead className="w-20">Correcta</TableHead>
                    <TableHead className="w-20">Tiempo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPreguntas?.map((p, i) => {
                    const opcs = (p.opciones as any[]) || [];
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="max-w-md truncate">{p.pregunta}</TableCell>
                        <TableCell>{opcs.length}</TableCell>
                        <TableCell><Badge>{letters[p.respuesta_correcta] || "?"}</Badge></TableCell>
                        <TableCell>{p.tiempo_limite}s</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {(!filteredPreguntas || filteredPreguntas.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchFilter ? "No se encontraron preguntas con ese filtro" : "No hay preguntas en esta sesión"}
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        );
      })()}
    </div>
  );
}

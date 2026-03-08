import { useState } from "react";
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
import { Loader2, Plus, Trash2, Upload, Wand2 } from "lucide-react";

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
  const [importText, setImportText] = useState("");
  const [smartText, setSmartText] = useState("");
  const [smartParsed, setSmartParsed] = useState<{ pregunta: string; opciones: string[] } | null>(null);
  const [smartCorrecta, setSmartCorrecta] = useState("0");
  const [smartExplicacion, setSmartExplicacion] = useState("");
  const [smartTiempo, setSmartTiempo] = useState("60");
  const [form, setForm] = useState({ pregunta: "", opcA: "", opcB: "", opcC: "", opcD: "", correcta: "0", explicacion: "", tiempo: "60" });

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
      setForm({ pregunta: "", opcA: "", opcB: "", opcC: "", opcD: "", correcta: "0", explicacion: "", tiempo: "60" });
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
                <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
                  <div><Label>Pregunta (Markdown + LaTeX)</Label><Textarea rows={3} value={form.pregunta} onChange={e => setForm({ ...form, pregunta: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>A)</Label><Input value={form.opcA} onChange={e => setForm({ ...form, opcA: e.target.value })} required /></div>
                    <div><Label>B)</Label><Input value={form.opcB} onChange={e => setForm({ ...form, opcB: e.target.value })} required /></div>
                    <div><Label>C)</Label><Input value={form.opcC} onChange={e => setForm({ ...form, opcC: e.target.value })} required /></div>
                    <div><Label>D)</Label><Input value={form.opcD} onChange={e => setForm({ ...form, opcD: e.target.value })} required /></div>
                  </div>
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
          </div>
        )}
      </div>

      {sesionId && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{preguntas?.length || 0} preguntas</CardTitle></CardHeader>
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
                  {preguntas?.map((p, i) => {
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
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

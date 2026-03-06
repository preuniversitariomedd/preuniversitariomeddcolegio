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
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

export default function AdminQuiz() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sesionId, setSesionId] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [importText, setImportText] = useState("");
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
          <div className="flex gap-2">
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild><Button variant="neon" size="sm"><Plus className="h-4 w-4 mr-1" />Pregunta</Button></DialogTrigger>
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
                    <TableHead className="w-20">Correcta</TableHead>
                    <TableHead className="w-20">Tiempo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preguntas?.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="max-w-md truncate">{p.pregunta}</TableCell>
                      <TableCell><Badge>{["A", "B", "C", "D"][p.respuesta_correcta]}</Badge></TableCell>
                      <TableCell>{p.tiempo_limite}s</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

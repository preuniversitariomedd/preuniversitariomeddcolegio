import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminContenido() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [cursoId, setCursoId] = useState("");
  const [sesionId, setSesionId] = useState("");
  const [openContent, setOpenContent] = useState(false);
  const [contentForm, setContentForm] = useState({ titulo: "", texto: "", solucion: "", video_url: "", pestana_id: "", orden: 0 });

  const { data: cursos } = useQuery({
    queryKey: ["cursos-list"],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("id, titulo").order("orden");
      return data || [];
    },
  });

  const { data: sesiones } = useQuery({
    queryKey: ["sesiones-list", cursoId],
    queryFn: async () => {
      if (!cursoId) return [];
      const { data } = await supabase.from("sesiones").select("id, titulo, orden").eq("curso_id", cursoId).order("orden");
      return data || [];
    },
    enabled: !!cursoId,
  });

  const { data: pestanas } = useQuery({
    queryKey: ["pestanas-list", sesionId],
    queryFn: async () => {
      if (!sesionId) return [];
      const { data } = await supabase.from("pestanas").select("*, contenido(*)").eq("sesion_id", sesionId).order("orden");
      return data || [];
    },
    enabled: !!sesionId,
  });

  const addTabMutation = useMutation({
    mutationFn: async (nombre: string) => {
      const { error } = await supabase.from("pestanas").insert({ sesion_id: sesionId, nombre, orden: (pestanas?.length || 0) + 1 });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pestanas-list", sesionId] }),
  });

  const addContentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contenido").insert(contentForm);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Contenido añadido" });
      setOpenContent(false);
      setContentForm({ titulo: "", texto: "", solucion: "", video_url: "", pestana_id: "", orden: 0 });
      qc.invalidateQueries({ queryKey: ["pestanas-list", sesionId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contenido").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pestanas-list", sesionId] }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Gestión de Contenido</h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Label>Curso</Label>
          <Select value={cursoId} onValueChange={v => { setCursoId(v); setSesionId(""); }}>
            <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
            <SelectContent>{cursos?.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <Label>Sesión</Label>
          <Select value={sesionId} onValueChange={setSesionId} disabled={!cursoId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar sesión" /></SelectTrigger>
            <SelectContent>{sesiones?.map(s => <SelectItem key={s.id} value={s.id}>{s.orden}. {s.titulo}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {sesionId && pestanas && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              const name = prompt("Nombre de la nueva pestaña:");
              if (name) addTabMutation.mutate(name);
            }}>
              <Plus className="h-3 w-3 mr-1" />Pestaña
            </Button>
          </div>

          <Tabs defaultValue={pestanas[0]?.id}>
            <TabsList className="flex-wrap">
              {pestanas.map(p => <TabsTrigger key={p.id} value={p.id}>{p.nombre}</TabsTrigger>)}
            </TabsList>
            {pestanas.map(p => (
              <TabsContent key={p.id} value={p.id} className="space-y-4">
                <div className="flex justify-end">
                  <Dialog open={openContent && contentForm.pestana_id === p.id} onOpenChange={v => { setOpenContent(v); setContentForm({ ...contentForm, pestana_id: p.id, orden: ((p.contenido as any[])?.length || 0) + 1 }); }}>
                    <DialogTrigger asChild><Button size="sm" variant="neon"><Plus className="h-3 w-3 mr-1" />Contenido</Button></DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Nuevo Contenido</DialogTitle></DialogHeader>
                      <form onSubmit={e => { e.preventDefault(); addContentMutation.mutate(); }} className="space-y-4">
                        <div><Label>Título</Label><Input value={contentForm.titulo} onChange={e => setContentForm({ ...contentForm, titulo: e.target.value })} /></div>
                        <div><Label>Texto (Markdown + LaTeX)</Label><Textarea rows={8} value={contentForm.texto} onChange={e => setContentForm({ ...contentForm, texto: e.target.value })} placeholder="Usa $x^2$ para LaTeX inline y $$\int_0^1 f(x)dx$$ para bloques" /></div>
                        <div><Label>Solución (opcional)</Label><Textarea rows={4} value={contentForm.solucion} onChange={e => setContentForm({ ...contentForm, solucion: e.target.value })} /></div>
                        <div><Label>Video YouTube URL</Label><Input value={contentForm.video_url} onChange={e => setContentForm({ ...contentForm, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></div>
                        <Button type="submit" className="w-full" variant="neon" disabled={addContentMutation.isPending}>Guardar</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {((p.contenido as any[]) || []).sort((a: any, b: any) => a.orden - b.orden).map((c: any) => (
                  <Card key={c.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">{c.titulo || "Sin título"}</CardTitle>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteContentMutation.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{c.texto?.substring(0, 200)}...</p>
                      {c.video_url && <p className="text-xs text-secondary mt-1">🎥 {c.video_url}</p>}
                    </CardContent>
                  </Card>
                ))}
                {(!p.contenido || (p.contenido as any[]).length === 0) && (
                  <p className="text-center text-muted-foreground py-8">Sin contenido. Agrega contenido con el botón de arriba.</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ChevronDown, ChevronUp, Lock, Unlock, Pencil, Trash2, Copy } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminCursos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openCurso, setOpenCurso] = useState(false);
  const [cursoForm, setCursoForm] = useState({ titulo: "", descripcion: "", color: "#8B5CF6", orden: 1 });
  const [sesionForm, setSesionForm] = useState({ titulo: "", descripcion: "", curso_id: "", orden: 1 });
  const [openSesion, setOpenSesion] = useState(false);
  const [expandedCurso, setExpandedCurso] = useState<string | null>(null);
  const [editCursoId, setEditCursoId] = useState<string | null>(null);
  const [editCursoForm, setEditCursoForm] = useState({ titulo: "", descripcion: "" });
  const [editSesionId, setEditSesionId] = useState<string | null>(null);
  const [editSesionForm, setEditSesionForm] = useState({ titulo: "", descripcion: "" });

  const { data: cursos, isLoading } = useQuery({
    queryKey: ["admin-cursos"],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("*, sesiones(*)").order("orden");
      return data || [];
    },
  });

  const createCursoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cursos").insert(cursoForm);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Curso creado" });
      setOpenCurso(false);
      setCursoForm({ titulo: "", descripcion: "", color: "#8B5CF6", orden: (cursos?.length || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCursoMutation = useMutation({
    mutationFn: async () => {
      if (!editCursoId) return;
      const { error } = await supabase.from("cursos").update({ titulo: editCursoForm.titulo, descripcion: editCursoForm.descripcion }).eq("id", editCursoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Curso actualizado" });
      setEditCursoId(null);
      qc.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
  });

  const deleteCursoMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete sesiones first (cascade should handle but be safe)
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Curso eliminado" });
      qc.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createSesionMutation = useMutation({
    mutationFn: async () => {
      const { data: sesion, error } = await supabase.from("sesiones").insert({
        titulo: sesionForm.titulo,
        curso_id: sesionForm.curso_id,
        orden: sesionForm.orden,
      }).select().single();
      if (error) throw error;
      const defaultTabs = ["Teoría", "Trucos", "Ejercicios", "Quiz"];
      for (let i = 0; i < defaultTabs.length; i++) {
        await supabase.from("pestanas").insert({ sesion_id: sesion.id, nombre: defaultTabs[i], orden: i + 1 });
      }
    },
    onSuccess: () => {
      toast({ title: "Sesión creada con pestañas por defecto" });
      setOpenSesion(false);
      qc.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateSesionMutation = useMutation({
    mutationFn: async () => {
      if (!editSesionId) return;
      const { error } = await supabase.from("sesiones").update({ titulo: editSesionForm.titulo, descripcion: editSesionForm.descripcion || null } as any).eq("id", editSesionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sesión actualizada" });
      setEditSesionId(null);
      qc.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
  });

  const deleteSesionMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete pestanas & contenido first
      const { data: tabs } = await supabase.from("pestanas").select("id").eq("sesion_id", id);
      if (tabs) {
        for (const t of tabs) {
          await supabase.from("contenido").delete().eq("pestana_id", t.id);
        }
        await supabase.from("pestanas").delete().eq("sesion_id", id);
      }
      await supabase.from("quiz_preguntas").delete().eq("sesion_id", id);
      const { error } = await supabase.from("sesiones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sesión eliminada" });
      qc.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleSesionMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("sesiones").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cursos"] }),
  });

  const toggleCursoMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from("cursos").update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cursos"] }),
  });

  const duplicateCursoMutation = useMutation({
    mutationFn: async (cursoId: string) => {
      const curso = cursos?.find(c => c.id === cursoId);
      if (!curso) throw new Error("Curso no encontrado");
      // Create new curso
      const { data: newCurso, error: ce } = await supabase.from("cursos").insert({
        titulo: `${curso.titulo} (Copia)`,
        descripcion: curso.descripcion,
        color: curso.color,
        orden: (cursos?.length || 0) + 1,
        activo: false,
      }).select().single();
      if (ce) throw ce;
      // Copy sesiones
      const sesiones = ((curso.sesiones as any[]) || []).sort((a: any, b: any) => a.orden - b.orden);
      for (const s of sesiones) {
        const { data: newSes, error: se } = await supabase.from("sesiones").insert({
          curso_id: newCurso.id,
          titulo: s.titulo,
          orden: s.orden,
          estado: "bloqueada",
          descripcion: s.descripcion,
        }).select().single();
        if (se) throw se;
        // Copy pestanas & contenido
        const { data: tabs } = await supabase.from("pestanas").select("*").eq("sesion_id", s.id).order("orden");
        for (const t of (tabs || [])) {
          const { data: newTab } = await supabase.from("pestanas").insert({
            sesion_id: newSes.id,
            nombre: t.nombre,
            orden: t.orden,
            activa: t.activa,
          }).select().single();
          if (newTab) {
            const { data: contenidos } = await supabase.from("contenido").select("*").eq("pestana_id", t.id).order("orden");
            for (const c of (contenidos || [])) {
              await supabase.from("contenido").insert({
                pestana_id: newTab.id,
                titulo: c.titulo,
                texto: c.texto,
                imagen_url: c.imagen_url,
                video_url: c.video_url,
                solucion: c.solucion,
                grupo: c.grupo,
                orden: c.orden,
              });
            }
          }
        }
        // Copy quiz questions
        const { data: preguntas } = await supabase.from("quiz_preguntas").select("*").eq("sesion_id", s.id);
        for (const p of (preguntas || [])) {
          await supabase.from("quiz_preguntas").insert({
            sesion_id: newSes.id,
            pregunta: p.pregunta,
            opciones: p.opciones,
            respuesta_correcta: p.respuesta_correcta,
            explicacion: p.explicacion,
            imagen_url: p.imagen_url,
            tiempo_limite: p.tiempo_limite,
          });
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Curso duplicado", description: "Se creó una copia sin inscripciones" });
      qc.invalidateQueries({ queryKey: ["admin-cursos"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Gestión de Cursos</h2>
        <Dialog open={openCurso} onOpenChange={setOpenCurso}>
          <DialogTrigger asChild><Button variant="neon"><Plus className="h-4 w-4 mr-2" />Nuevo Curso</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Curso</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createCursoMutation.mutate(); }} className="space-y-4">
              <div><Label>Título</Label><Input value={cursoForm.titulo} onChange={e => setCursoForm({ ...cursoForm, titulo: e.target.value })} required /></div>
              <div><Label>Descripción</Label><Textarea value={cursoForm.descripcion} onChange={e => setCursoForm({ ...cursoForm, descripcion: e.target.value })} /></div>
              <div className="flex gap-4">
                <div><Label>Color</Label><Input type="color" value={cursoForm.color} onChange={e => setCursoForm({ ...cursoForm, color: e.target.value })} className="h-10 w-20" /></div>
                <div><Label>Orden</Label><Input type="number" value={cursoForm.orden} onChange={e => setCursoForm({ ...cursoForm, orden: parseInt(e.target.value) })} min={1} /></div>
              </div>
              <Button type="submit" className="w-full" variant="neon" disabled={createCursoMutation.isPending}>Crear Curso</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit curso dialog */}
      <Dialog open={!!editCursoId} onOpenChange={v => { if (!v) setEditCursoId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Curso</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={editCursoForm.titulo} onChange={e => setEditCursoForm({ ...editCursoForm, titulo: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={editCursoForm.descripcion} onChange={e => setEditCursoForm({ ...editCursoForm, descripcion: e.target.value })} /></div>
            <Button variant="neon" className="w-full" onClick={() => updateCursoMutation.mutate()}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit sesion dialog */}
      <Dialog open={!!editSesionId} onOpenChange={v => { if (!v) setEditSesionId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Sesión</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={editSesionForm.titulo} onChange={e => setEditSesionForm({ ...editSesionForm, titulo: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={editSesionForm.descripcion} onChange={e => setEditSesionForm({ ...editSesionForm, descripcion: e.target.value })} /></div>
            <Button variant="neon" className="w-full" onClick={() => updateSesionMutation.mutate()}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {cursos?.map(curso => (
          <Card key={curso.id} className="border-l-4" style={{ borderLeftColor: curso.color || "#8B5CF6" }}>
            <Collapsible open={expandedCurso === curso.id} onOpenChange={open => setExpandedCurso(open ? curso.id : null)}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CollapsibleTrigger className="hover:bg-muted p-1 rounded">
                    {expandedCurso === curso.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {curso.titulo}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditCursoId(curso.id); setEditCursoForm({ titulo: curso.titulo, descripcion: curso.descripcion || "" }); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Duplicar curso" onClick={() => { if (confirm("¿Duplicar este curso con todo su contenido (sin inscripciones)?")) duplicateCursoMutation.mutate(curso.id); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("¿Eliminar este curso y todas sus sesiones?")) deleteCursoMutation.mutate(curso.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{(curso.sesiones as any[])?.length || 0} sesiones{curso.descripcion ? ` — ${curso.descripcion}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={curso.activo ?? true} onCheckedChange={v => toggleCursoMutation.mutate({ id: curso.id, activo: v })} />
                  <Badge variant={curso.activo ? "default" : "secondary"}>{curso.activo ? "Activo" : "Inactivo"}</Badge>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  <div className="flex justify-end">
                    <Dialog open={openSesion && sesionForm.curso_id === curso.id} onOpenChange={v => { setOpenSesion(v); setSesionForm({ ...sesionForm, curso_id: curso.id, orden: ((curso.sesiones as any[])?.length || 0) + 1 }); }}>
                      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Nueva Sesión</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Nueva Sesión</DialogTitle></DialogHeader>
                        <form onSubmit={e => { e.preventDefault(); createSesionMutation.mutate(); }} className="space-y-4">
                          <div><Label>Título</Label><Input value={sesionForm.titulo} onChange={e => setSesionForm({ ...sesionForm, titulo: e.target.value })} required /></div>
                          <div><Label>Orden</Label><Input type="number" value={sesionForm.orden} onChange={e => setSesionForm({ ...sesionForm, orden: parseInt(e.target.value) })} min={1} /></div>
                          <Button type="submit" className="w-full" variant="neon" disabled={createSesionMutation.isPending}>Crear Sesión</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {((curso.sesiones as any[]) || []).sort((a: any, b: any) => a.orden - b.orden).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {s.estado === "abierta" ? <Unlock className="h-4 w-4 text-success" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm font-medium">{s.orden}. {s.titulo}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditSesionId(s.id); setEditSesionForm({ titulo: s.titulo, descripcion: s.descripcion || "" }); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleSesionMutation.mutate({ id: s.id, estado: s.estado === "abierta" ? "bloqueada" : "abierta" })}>
                          {s.estado === "abierta" ? "Bloquear" : "Desbloquear"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`¿Eliminar sesión "${s.titulo}" y todo su contenido?`)) deleteSesionMutation.mutate(s.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminCursos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openCurso, setOpenCurso] = useState(false);
  const [cursoForm, setCursoForm] = useState({ titulo: "", descripcion: "", color: "#8B5CF6", orden: 1 });
  const [sesionForm, setSesionForm] = useState({ titulo: "", curso_id: "", orden: 1 });
  const [openSesion, setOpenSesion] = useState(false);
  const [expandedCurso, setExpandedCurso] = useState<string | null>(null);

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

  const createSesionMutation = useMutation({
    mutationFn: async () => {
      // Create session
      const { data: sesion, error } = await supabase.from("sesiones").insert(sesionForm).select().single();
      if (error) throw error;
      // Create default tabs
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
              <div><Label>Descripción</Label><Input value={cursoForm.descripcion} onChange={e => setCursoForm({ ...cursoForm, descripcion: e.target.value })} /></div>
              <div className="flex gap-4">
                <div><Label>Color</Label><Input type="color" value={cursoForm.color} onChange={e => setCursoForm({ ...cursoForm, color: e.target.value })} className="h-10 w-20" /></div>
                <div><Label>Orden</Label><Input type="number" value={cursoForm.orden} onChange={e => setCursoForm({ ...cursoForm, orden: parseInt(e.target.value) })} min={1} /></div>
              </div>
              <Button type="submit" className="w-full" variant="neon" disabled={createCursoMutation.isPending}>Crear Curso</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                    <CardTitle className="text-lg">{curso.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground">{(curso.sesiones as any[])?.length || 0} sesiones</p>
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
                      <Button size="sm" variant="ghost" onClick={() => toggleSesionMutation.mutate({ id: s.id, estado: s.estado === "abierta" ? "bloqueada" : "abierta" })}>
                        {s.estado === "abierta" ? "Bloquear" : "Desbloquear"}
                      </Button>
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

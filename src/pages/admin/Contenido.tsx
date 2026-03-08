import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClipboardImage } from "@/hooks/useClipboardImage";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Pencil, Copy, GripVertical, ClipboardPaste } from "lucide-react";

export default function AdminContenido() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [cursoId, setCursoId] = useState("");
  const [sesionId, setSesionId] = useState("");
  const [openContent, setOpenContent] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editingTab, setEditingTab] = useState<any>(null);
  const [editTabOpen, setEditTabOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importTargetSesion, setImportTargetSesion] = useState("");
  const [importSourceTab, setImportSourceTab] = useState("");
  const [editCursoOpen, setEditCursoOpen] = useState(false);
  const [editCursoName, setEditCursoName] = useState("");
  const [contentForm, setContentForm] = useState({ titulo: "", texto: "", solucion: "", video_url: "", imagen_url: "", grupo: "", pestana_id: "", orden: 0 });

  const { handlePaste: handleContentPaste } = useClipboardImage(useCallback((url: string) => {
    setContentForm(prev => ({ ...prev, imagen_url: url }));
    toast({ title: "Imagen pegada desde portapapeles" });
  }, [toast]));

  const { data: cursos } = useQuery({
    queryKey: ["cursos-list"],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("id, titulo, sesiones(id)").order("orden");
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

  const { data: allSesiones } = useQuery({
    queryKey: ["all-sesiones-import"],
    queryFn: async () => {
      const { data } = await supabase.from("sesiones").select("id, titulo, orden, curso_id, cursos(titulo)").order("orden");
      return data || [];
    },
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

  const invalidate = () => qc.invalidateQueries({ queryKey: ["pestanas-list", sesionId] });

  // Course name edit
  const editCursoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cursos").update({ titulo: editCursoName }).eq("id", cursoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Nombre del curso actualizado" });
      setEditCursoOpen(false);
      qc.invalidateQueries({ queryKey: ["cursos-list"] });
    },
  });

  // Tab mutations
  const addTabMutation = useMutation({
    mutationFn: async (nombre: string) => {
      const { error } = await supabase.from("pestanas").insert({ sesion_id: sesionId, nombre, orden: (pestanas?.length || 0) + 1 });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTabMutation = useMutation({
    mutationFn: async ({ id, nombre }: { id: string; nombre: string }) => {
      const { error } = await supabase.from("pestanas").update({ nombre }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEditTabOpen(false); },
  });

  const deleteTabMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("contenido").delete().eq("pestana_id", id);
      const { error } = await supabase.from("pestanas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const moveTabMutation = useMutation({
    mutationFn: async ({ id, newOrden }: { id: string; newOrden: number }) => {
      const { error } = await supabase.from("pestanas").update({ orden: newOrden }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Content mutations
  const addContentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contenido").insert({
        ...contentForm,
        grupo: contentForm.grupo || null,
        imagen_url: contentForm.imagen_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Contenido añadido" });
      setOpenContent(false);
      resetForm();
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateContentMutation = useMutation({
    mutationFn: async () => {
      if (!editingContent) return;
      const { error } = await supabase.from("contenido").update({
        titulo: contentForm.titulo,
        texto: contentForm.texto,
        solucion: contentForm.solucion || null,
        video_url: contentForm.video_url || null,
        imagen_url: contentForm.imagen_url || null,
        grupo: contentForm.grupo || null,
        orden: contentForm.orden,
      }).eq("id", editingContent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Contenido actualizado" });
      setOpenContent(false);
      setEditingContent(null);
      resetForm();
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contenido").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const moveContentMutation = useMutation({
    mutationFn: async ({ id, newOrden }: { id: string; newOrden: number }) => {
      const { error } = await supabase.from("contenido").update({ orden: newOrden }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Import content from one tab to other sessions
  const importContentMutation = useMutation({
    mutationFn: async () => {
      if (!importSourceTab || !importTargetSesion) return;
      // Get source tab content
      const { data: sourceContent } = await supabase.from("contenido").select("*").eq("pestana_id", importSourceTab);
      if (!sourceContent || sourceContent.length === 0) throw new Error("No hay contenido para importar");
      
      // Get or find matching tab in target session
      const sourceTab = pestanas?.find(p => p.id === importSourceTab);
      if (!sourceTab) throw new Error("Pestaña no encontrada");
      
      const { data: targetTabs } = await supabase.from("pestanas").select("id, nombre").eq("sesion_id", importTargetSesion);
      let targetTab = targetTabs?.find(t => t.nombre === sourceTab.nombre);
      
      if (!targetTab) {
        const { data: newTab, error } = await supabase.from("pestanas").insert({ sesion_id: importTargetSesion, nombre: sourceTab.nombre, orden: (targetTabs?.length || 0) + 1 }).select().single();
        if (error) throw error;
        targetTab = newTab;
      }
      
      // Copy content
      for (const c of sourceContent) {
        await supabase.from("contenido").insert({
          pestana_id: targetTab!.id,
          titulo: c.titulo,
          texto: c.texto,
          solucion: c.solucion,
          video_url: c.video_url,
          imagen_url: c.imagen_url,
          orden: c.orden,
        });
      }
      return sourceContent.length;
    },
    onSuccess: (count) => {
      toast({ title: `${count} contenidos importados` });
      setImportOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => setContentForm({ titulo: "", texto: "", solucion: "", video_url: "", imagen_url: "", grupo: "", pestana_id: "", orden: 0 });

  const openEditContent = (c: any) => {
    setEditingContent(c);
    setContentForm({
      titulo: c.titulo || "",
      texto: c.texto || "",
      solucion: c.solucion || "",
      video_url: c.video_url || "",
      imagen_url: c.imagen_url || "",
      grupo: c.grupo || "",
      pestana_id: c.pestana_id,
      orden: c.orden || 0,
    });
    setOpenContent(true);
  };

  const selectedCurso = cursos?.find(c => c.id === cursoId);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Gestión de Contenido</h2>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-64">
          <Label>Curso</Label>
          <Select value={cursoId} onValueChange={v => { setCursoId(v); setSesionId(""); }}>
            <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
            <SelectContent>{cursos?.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo} ({(c.sesiones as any[])?.length || 0} ses.)</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {cursoId && (
          <>
            <Button variant="outline" size="sm" onClick={() => { setEditCursoName(selectedCurso?.titulo || ""); setEditCursoOpen(true); }}>
              <Pencil className="h-3 w-3 mr-1" />Editar nombre
            </Button>
            <Dialog open={editCursoOpen} onOpenChange={setEditCursoOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>Editar nombre del curso</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input value={editCursoName} onChange={e => setEditCursoName(e.target.value)} />
                  <Button variant="neon" className="w-full" onClick={() => editCursoMutation.mutate()}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => {
              const name = prompt("Nombre de la nueva pestaña:");
              if (name) addTabMutation.mutate(name);
            }}>
              <Plus className="h-3 w-3 mr-1" />Pestaña
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Copy className="h-3 w-3 mr-1" />Importar a otra sesión
            </Button>
          </div>

          {/* Import dialog */}
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Importar contenido a otra sesión</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Pestaña origen (de esta sesión)</Label>
                  <Select value={importSourceTab} onValueChange={setImportSourceTab}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar pestaña" /></SelectTrigger>
                    <SelectContent>{pestanas.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} ({((p.contenido as any[]) || []).length} items)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sesión destino</Label>
                  <Select value={importTargetSesion} onValueChange={setImportTargetSesion}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar sesión" /></SelectTrigger>
                    <SelectContent>
                      {allSesiones?.filter(s => s.id !== sesionId).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.orden}. {s.titulo} ({(s.cursos as any)?.titulo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="neon" className="w-full" onClick={() => importContentMutation.mutate()} disabled={importContentMutation.isPending || !importSourceTab || !importTargetSesion}>
                  {importContentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit tab dialog */}
          <Dialog open={editTabOpen} onOpenChange={setEditTabOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar pestaña</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input value={editingTab?.nombre || ""} onChange={e => setEditingTab({ ...editingTab, nombre: e.target.value })} />
                <div className="flex gap-2">
                  <Button variant="neon" className="flex-1" onClick={() => updateTabMutation.mutate({ id: editingTab.id, nombre: editingTab.nombre })}>Guardar</Button>
                  <Button variant="destructive" onClick={() => { if (confirm("¿Eliminar pestaña y todo su contenido?")) { deleteTabMutation.mutate(editingTab.id); setEditTabOpen(false); } }}>Eliminar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Tabs defaultValue={pestanas[0]?.id}>
            <TabsList className="flex-wrap">
              {pestanas.map((p, i) => (
                <div key={p.id} className="flex items-center gap-0.5">
                  {i > 0 && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    const prev = pestanas[i - 1];
                    moveTabMutation.mutate({ id: p.id, newOrden: prev.orden });
                    moveTabMutation.mutate({ id: prev.id, newOrden: p.orden });
                  }}><ArrowUp className="h-3 w-3" /></Button>}
                  <TabsTrigger value={p.id} onDoubleClick={() => { setEditingTab(p); setEditTabOpen(true); }}>{p.nombre}</TabsTrigger>
                  {i < pestanas.length - 1 && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    const next = pestanas[i + 1];
                    moveTabMutation.mutate({ id: p.id, newOrden: next.orden });
                    moveTabMutation.mutate({ id: next.id, newOrden: p.orden });
                  }}><ArrowDown className="h-3 w-3" /></Button>}
                </div>
              ))}
            </TabsList>
            {pestanas.map(p => (
              <TabsContent key={p.id} value={p.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingTab(p); setEditTabOpen(true); }}>
                      <Pencil className="h-3 w-3 mr-1" />Editar pestaña
                    </Button>
                  </div>
                  <Button size="sm" variant="neon" onClick={() => {
                    setEditingContent(null);
                    resetForm();
                    setContentForm(prev => ({ ...prev, pestana_id: p.id, orden: ((p.contenido as any[])?.length || 0) + 1 }));
                    setOpenContent(true);
                  }}>
                    <Plus className="h-3 w-3 mr-1" />Contenido
                  </Button>
                </div>

                {/* Content form dialog */}
                <Dialog open={openContent && (contentForm.pestana_id === p.id || editingContent?.pestana_id === p.id)} onOpenChange={v => { if (!v) { setOpenContent(false); setEditingContent(null); resetForm(); } }}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editingContent ? "Editar Contenido" : "Nuevo Contenido"}</DialogTitle></DialogHeader>
                    <form onSubmit={e => { e.preventDefault(); editingContent ? updateContentMutation.mutate() : addContentMutation.mutate(); }} className="space-y-4">
                      <div><Label>Título</Label><Input value={contentForm.titulo} onChange={e => setContentForm({ ...contentForm, titulo: e.target.value })} /></div>
                      <div><Label>Texto / Contenido (Markdown + LaTeX)</Label><Textarea rows={8} value={contentForm.texto} onChange={e => setContentForm({ ...contentForm, texto: e.target.value })} placeholder="Usa $x^2$ para LaTeX inline y $$\int_0^1 f(x)dx$$ para bloques" /></div>
                      <div><Label>Solución (opcional)</Label><Textarea rows={4} value={contentForm.solucion} onChange={e => setContentForm({ ...contentForm, solucion: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>URL (link, PDF, video)</Label><Input value={contentForm.video_url} onChange={e => setContentForm({ ...contentForm, video_url: e.target.value })} placeholder="https://..." /></div>
                        <div><Label>URL de Imagen</Label><Input value={contentForm.imagen_url} onChange={e => setContentForm({ ...contentForm, imagen_url: e.target.value })} placeholder="https://..." /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Grupo (para agrupar en desplegable)</Label><Input value={contentForm.grupo} onChange={e => setContentForm({ ...contentForm, grupo: e.target.value })} placeholder="Ej: Fórmulas, Teoremas..." /></div>
                        <div><Label>Orden</Label><Input type="number" value={contentForm.orden} onChange={e => setContentForm({ ...contentForm, orden: parseInt(e.target.value) || 0 })} /></div>
                      </div>
                      <Button type="submit" className="w-full" variant="neon" disabled={addContentMutation.isPending || updateContentMutation.isPending}>
                        {editingContent ? "Actualizar" : "Guardar"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                {((p.contenido as any[]) || []).sort((a: any, b: any) => a.orden - b.orden).map((c: any, idx: number, arr: any[]) => (
                  <Card key={c.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                        <CardTitle className="text-base">{c.titulo || "Sin título"}</CardTitle>
                        {c.grupo && <Badge variant="outline" className="text-xs">{c.grupo}</Badge>}
                      </div>
                      <div className="flex gap-1">
                        {idx > 0 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            const prev = arr[idx - 1];
                            moveContentMutation.mutate({ id: c.id, newOrden: prev.orden });
                            moveContentMutation.mutate({ id: prev.id, newOrden: c.orden });
                          }}><ArrowUp className="h-3 w-3" /></Button>
                        )}
                        {idx < arr.length - 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            const next = arr[idx + 1];
                            moveContentMutation.mutate({ id: c.id, newOrden: next.orden });
                            moveContentMutation.mutate({ id: next.id, newOrden: c.orden });
                          }}><ArrowDown className="h-3 w-3" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditContent(c)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("¿Eliminar este contenido?")) deleteContentMutation.mutate(c.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{c.texto?.substring(0, 200)}...</p>
                      <div className="flex gap-2 mt-2">
                        {c.video_url && <Badge variant="secondary" className="text-xs">🔗 URL</Badge>}
                        {c.imagen_url && <Badge variant="secondary" className="text-xs">🖼️ Imagen</Badge>}
                        {c.solucion && <Badge variant="secondary" className="text-xs">✅ Solución</Badge>}
                      </div>
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

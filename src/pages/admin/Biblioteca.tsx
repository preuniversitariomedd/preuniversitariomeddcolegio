import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminBiblioteca() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ titulo: "", descripcion: "", tipo: "pdf" as string, url: "", categoria: "", curso_id: "" });
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-biblioteca"],
    queryFn: async () => {
      const { data } = await supabase.from("biblioteca").select("*, cursos(titulo)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: cursos } = useQuery({
    queryKey: ["cursos-list"],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("id, titulo").order("orden");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("biblioteca").insert({
        ...form,
        curso_id: form.curso_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Recurso añadido" });
      setOpen(false);
      setForm({ titulo: "", descripcion: "", tipo: "pdf", url: "", categoria: "", curso_id: "" });
      qc.invalidateQueries({ queryKey: ["admin-biblioteca"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("biblioteca").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-biblioteca"] }),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editItem) return;
      const { error } = await supabase.from("biblioteca").update({
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        tipo: form.tipo,
        url: form.url,
        categoria: form.categoria || null,
        curso_id: form.curso_id || null,
      }).eq("id", editItem.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Recurso actualizado" });
      setEditItem(null);
      qc.invalidateQueries({ queryKey: ["admin-biblioteca"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (item: any) => {
    setForm({ titulo: item.titulo, descripcion: item.descripcion || "", tipo: item.tipo, url: item.url, categoria: item.categoria || "", curso_id: item.curso_id || "" });
    setEditItem(item);
  };

  const tipoBadgeColor: Record<string, string> = { pdf: "bg-destructive/20 text-destructive", video: "bg-secondary/20 text-secondary", link: "bg-primary/20 text-primary", imagen: "bg-success/20 text-success", documento: "bg-progress/20 text-progress" };

  // Group by category
  const grouped = (items || []).reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.categoria || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(item);
    return acc;
  }, {});

  const toggleCat = (cat: string) => {
    const next = new Set(expandedCats);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    setExpandedCats(next);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Biblioteca</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="neon"><Plus className="h-4 w-4 mr-2" />Recurso</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Recurso</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
              <div><Label>Título</Label><Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required /></div>
              <div><Label>Descripción</Label><Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="imagen">Imagen</SelectItem>
                      <SelectItem value="documento">Documento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1"><Label>Categoría</Label><Input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Formularios, Libros..." /></div>
              </div>
              <div><Label>URL</Label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required /></div>
              <div>
                <Label>Curso (opcional)</Label>
                <Select value={form.curso_id || "none"} onValueChange={v => setForm({ ...form, curso_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin curso" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin curso</SelectItem>
                    {cursos?.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" variant="neon" disabled={addMutation.isPending}>Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, catItems]) => (
          <Collapsible key={cat} open={expandedCats.has(cat)} onOpenChange={() => toggleCat(cat)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {expandedCats.has(cat) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="font-medium">{cat}</span>
                    <Badge variant="secondary">{catItems!.length}</Badge>
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-4 space-y-2">
                  {catItems!.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge className={tipoBadgeColor[item.tipo] || ""} variant="secondary">{item.tipo}</Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.titulo}</p>
                          {item.descripcion && <p className="text-xs text-muted-foreground truncate">{item.descripcion}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild><a href={item.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
        {Object.keys(grouped).length === 0 && <p className="text-center text-muted-foreground py-8">No hay recursos en la biblioteca.</p>}
      </div>
    </div>
  );
}

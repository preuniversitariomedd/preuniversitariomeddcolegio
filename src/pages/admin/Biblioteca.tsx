import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ExternalLink } from "lucide-react";

export default function AdminBiblioteca() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descripcion: "", tipo: "pdf" as string, url: "", categoria: "", curso_id: "" });

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

  const tipoBadgeColor: Record<string, string> = { pdf: "bg-destructive/20 text-destructive", video: "bg-secondary/20 text-secondary", link: "bg-primary/20 text-primary", imagen: "bg-success/20 text-success", documento: "bg-progress/20 text-progress" };

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
                <Select value={form.curso_id} onValueChange={v => setForm({ ...form, curso_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sin curso" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin curso</SelectItem>
                    {cursos?.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" variant="neon" disabled={addMutation.isPending}>Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titulo}</TableCell>
                    <TableCell><Badge className={tipoBadgeColor[item.tipo] || ""}>{item.tipo}</Badge></TableCell>
                    <TableCell>{item.categoria || "—"}</TableCell>
                    <TableCell>{(item.cursos as any)?.titulo || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild><a href={item.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

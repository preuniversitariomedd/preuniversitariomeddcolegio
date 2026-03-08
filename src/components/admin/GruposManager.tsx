import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, ChevronUp, Users, Pencil, Search } from "lucide-react";

export default function GruposManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [newForm, setNewForm] = useState({ nombre: "", descripcion: "" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedForAdd, setSelectedForAdd] = useState<Set<string>>(new Set());

  const { data: grupos, isLoading } = useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data } = await supabase.from("grupos").select("*, grupo_miembros(user_id, profiles!inner(id, nombre, apellidos, cedula))").order("nombre");
      return data || [];
    },
  });

  const { data: allStudents } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(id, nombre, apellidos, cedula)")
        .eq("rol", "estudiante")
        .eq("activo", true);
      return (data || []).map((r: any) => ({ id: r.user_id, ...r.profiles }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("grupos").insert({ nombre: newForm.nombre, descripcion: newForm.descripcion || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Grupo creado" });
      setOpenNew(false);
      setNewForm({ nombre: "", descripcion: "" });
      qc.invalidateQueries({ queryKey: ["grupos"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grupos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Grupo eliminado" });
      qc.invalidateQueries({ queryKey: ["grupos"] });
    },
  });

  const addMembersMutation = useMutation({
    mutationFn: async ({ grupoId, userIds }: { grupoId: string; userIds: string[] }) => {
      const rows = userIds.map((user_id) => ({ grupo_id: grupoId, user_id }));
      const { error } = await supabase.from("grupo_miembros").upsert(rows, { onConflict: "grupo_id,user_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Miembros agregados" });
      setSelectedForAdd(new Set());
      qc.invalidateQueries({ queryKey: ["grupos"] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ grupoId, userId }: { grupoId: string; userId: string }) => {
      const { error } = await supabase.from("grupo_miembros").delete().eq("grupo_id", grupoId).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Grupos de Estudiantes</h2>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button variant="neon"><Plus className="h-4 w-4 mr-2" />Nuevo Grupo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Grupo</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div><Label>Nombre</Label><Input value={newForm.nombre} onChange={(e) => setNewForm({ ...newForm, nombre: e.target.value })} placeholder="Ej: Grupo 10mo A" required /></div>
              <div><Label>Descripción</Label><Input value={newForm.descripcion} onChange={(e) => setNewForm({ ...newForm, descripcion: e.target.value })} placeholder="Opcional" /></div>
              <Button type="submit" className="w-full" variant="neon" disabled={createMutation.isPending}>Crear Grupo</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {(grupos || []).map((grupo: any) => {
          const members = (grupo.grupo_miembros || []).map((m: any) => ({ id: m.user_id, ...m.profiles }));
          const memberIds = new Set(members.map((m: any) => m.id));
          const isExpanded = expanded === grupo.id;

          const nonMembers = (allStudents || []).filter((s: any) =>
            !memberIds.has(s.id) && `${s.nombre} ${s.apellidos} ${s.cedula}`.toLowerCase().includes(memberSearch.toLowerCase())
          );

          return (
            <Card key={grupo.id}>
              <Collapsible open={isExpanded} onOpenChange={(v) => { setExpanded(v ? grupo.id : null); setSelectedForAdd(new Set()); setMemberSearch(""); }}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CollapsibleTrigger className="hover:bg-muted p-1 rounded">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-4 w-4" /> {grupo.nombre}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { if (confirm(`¿Eliminar grupo "${grupo.nombre}"?`)) deleteMutation.mutate(grupo.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{members.length} miembros{grupo.descripcion ? ` — ${grupo.descripcion}` : ""}</p>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Current members */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Miembros actuales</h4>
                      <div className="flex flex-wrap gap-2">
                        {members.map((m: any) => (
                          <Badge key={m.id} variant="secondary" className="flex items-center gap-1 pr-1">
                            {m.nombre} {m.apellidos}
                            <button onClick={() => removeMemberMutation.mutate({ grupoId: grupo.id, userId: m.id })} className="ml-1 hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {members.length === 0 && <p className="text-sm text-muted-foreground">Sin miembros</p>}
                      </div>
                    </div>

                    {/* Add members */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Agregar miembros</h4>
                      <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Buscar estudiante..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-8" />
                        </div>
                        <Button size="sm" variant="neon" disabled={selectedForAdd.size === 0} onClick={() => addMembersMutation.mutate({ grupoId: grupo.id, userIds: Array.from(selectedForAdd) })}>
                          <Plus className="h-3 w-3 mr-1" />Agregar ({selectedForAdd.size})
                        </Button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto border rounded-md">
                        <Table>
                          <TableBody>
                            {nonMembers.slice(0, 20).map((s: any) => (
                              <TableRow key={s.id}>
                                <TableCell className="w-10">
                                  <Checkbox checked={selectedForAdd.has(s.id)} onCheckedChange={() => {
                                    const next = new Set(selectedForAdd);
                                    next.has(s.id) ? next.delete(s.id) : next.add(s.id);
                                    setSelectedForAdd(next);
                                  }} />
                                </TableCell>
                                <TableCell className="text-sm">{s.nombre} {s.apellidos}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{s.cedula}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

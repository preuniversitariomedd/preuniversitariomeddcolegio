import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RotateCcw, Trash2, UserPlus, BookOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

function calcAge(dob: string | null) {
  if (!dob) return "—";
  const b = new Date(dob);
  const now = new Date();
  
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  let days = now.getDate() - b.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years}a ${months}m ${days}d`;
}

export default function AdminEstudiantes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", apellidos: "", cedula: "", fecha_nacimiento: "" });
  const [search, setSearch] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, user_roles(id, rol, activo)")
        .order("created_at", { ascending: false });
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

  const { data: inscripciones } = useQuery({
    queryKey: ["all-inscripciones"],
    queryFn: async () => {
      const { data } = await supabase.from("inscripciones").select("user_id, curso_id");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "crear", ...form },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Estudiante creado", description: `Cédula: ${form.cedula}, Contraseña: 123*789*h` });
      setForm({ nombre: "", apellidos: "", cedula: "", fecha_nacimiento: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "resetear", user_id: userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast({ title: "Contraseña reseteada a 123*789*h" }); qc.invalidateQueries({ queryKey: ["admin-students"] }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "eliminar", user_id: userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { toast({ title: "Estudiante eliminado" }); qc.invalidateQueries({ queryKey: ["admin-students"] }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, activo }: { userId: string; activo: boolean }) => {
      const { data, error } = await supabase.functions.invoke("manage-users", { body: { action: "toggle_activo", user_id: userId, activo } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-students"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, rol }: { roleId: string; rol: string }) => {
      const { error } = await supabase.from("user_roles").update({ rol }).eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-students"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignCourseMutation = useMutation({
    mutationFn: async ({ userId, cursoId, assign }: { userId: string; cursoId: string; assign: boolean }) => {
      if (assign) {
        const { error } = await supabase.from("inscripciones").insert({ user_id: userId, curso_id: cursoId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inscripciones").delete().eq("user_id", userId).eq("curso_id", cursoId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-inscripciones"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = students?.filter(s =>
    !search || s.nombre.toLowerCase().includes(search.toLowerCase()) || s.cedula.includes(search) || s.apellidos.toLowerCase().includes(search.toLowerCase())
  );

  const getUserCourses = (userId: string) => inscripciones?.filter(i => i.user_id === userId).map(i => i.curso_id) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold">Gestión de Estudiantes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="neon"><UserPlus className="h-4 w-4 mr-2" />Agregar Estudiante</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Estudiante</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
                <div><Label>Apellidos</Label><Input value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} required /></div>
              </div>
              <div><Label>Cédula (10 dígitos)</Label><Input value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} required /></div>
              <div><Label>Fecha de Nacimiento</Label><Input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} /></div>
              {form.fecha_nacimiento && <p className="text-sm text-muted-foreground">Edad: {calcAge(form.fecha_nacimiento)}</p>}
              <Button type="submit" className="w-full" variant="neon" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Estudiante"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Buscar por nombre o cédula..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Cursos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map(s => {
                    const role = (s.user_roles as any)?.[0] || (s.user_roles as any);
                    const userCourses = getUserCourses(s.id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm">{s.cedula}</TableCell>
                        <TableCell>{s.nombre} {s.apellidos}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{calcAge(s.fecha_nacimiento)}</TableCell>
                        <TableCell>
                          {role?.id ? (
                            <Select defaultValue={role.rol} onValueChange={v => updateRoleMutation.mutate({ roleId: role.id, rol: v })}>
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="docente">Docente</SelectItem>
                                <SelectItem value="estudiante">Estudiante</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : <Badge variant="secondary">Sin rol</Badge>}
                        </TableCell>
                        <TableCell>
                          <Dialog open={assignOpen === s.id} onOpenChange={v => setAssignOpen(v ? s.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <BookOpen className="h-3 w-3 mr-1" />{userCourses.length}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Asignar Cursos — {s.nombre}</DialogTitle></DialogHeader>
                              <div className="space-y-3">
                                {cursos?.map(c => {
                                  const enrolled = userCourses.includes(c.id);
                                  return (
                                    <div key={c.id} className="flex items-center gap-3">
                                      <Checkbox checked={enrolled} onCheckedChange={v => assignCourseMutation.mutate({ userId: s.id, cursoId: c.id, assign: !!v })} />
                                      <span className="text-sm">{c.titulo}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          {role?.id ? <Switch checked={role.activo} onCheckedChange={v => toggleMutation.mutate({ userId: s.id, activo: v })} /> : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Resetear contraseña" onClick={() => resetMutation.mutate(s.id)}>
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción es irreversible. Se eliminará {s.nombre} {s.apellidos} y todos sus datos.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!filtered || filtered.length === 0) && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay estudiantes registrados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

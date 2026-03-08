import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, UserMinus, ArrowRightLeft, Lock, Unlock, Search, Users } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  curso: { id: string; titulo: string } | null;
}

export default function CursoGestionDialog({ open, onOpenChange, curso }: Props) {
  if (!curso) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⚙️ Gestión: {curso.titulo}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="estudiantes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="estudiantes">Estudiantes</TabsTrigger>
            <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
            <TabsTrigger value="progreso">Progreso</TabsTrigger>
          </TabsList>
          <TabsContent value="estudiantes"><TabEstudiantes cursoId={curso.id} /></TabsContent>
          <TabsContent value="sesiones"><TabSesiones cursoId={curso.id} /></TabsContent>
          <TabsContent value="progreso"><TabProgreso cursoId={curso.id} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ─── TAB ESTUDIANTES ─── */
function TabEstudiantes({ cursoId }: { cursoId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState<string>("all");
  const [moveTarget, setMoveTarget] = useState<string>("");

  const { data: allStudents, isLoading: loadingStudents } = useQuery({
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

  const { data: enrolled } = useQuery({
    queryKey: ["inscripciones", cursoId],
    queryFn: async () => {
      const { data } = await supabase.from("inscripciones").select("user_id").eq("curso_id", cursoId);
      return new Set((data || []).map((i) => i.user_id));
    },
  });

  const { data: grupos } = useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data } = await supabase.from("grupos").select("*, grupo_miembros(user_id)").order("nombre");
      return data || [];
    },
  });

  const { data: otherCursos } = useQuery({
    queryKey: ["other-cursos", cursoId],
    queryFn: async () => {
      const { data } = await supabase.from("cursos").select("id, titulo").neq("id", cursoId).order("orden");
      return data || [];
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      for (const user_id of userIds) {
        const { error } = await supabase.from("inscripciones").upsert(
          { user_id, curso_id: cursoId },
          { onConflict: "user_id,curso_id", ignoreDuplicates: true }
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Estudiantes inscritos" });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["inscripciones", cursoId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { error } = await supabase.from("inscripciones").delete().eq("curso_id", cursoId).in("user_id", userIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estudiantes removidos" });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["inscripciones", cursoId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ userIds, targetCursoId }: { userIds: string[]; targetCursoId: string }) => {
      await supabase.from("inscripciones").delete().eq("curso_id", cursoId).in("user_id", userIds);
      for (const user_id of userIds) {
        const { error } = await supabase.from("inscripciones").upsert(
          { user_id, curso_id: targetCursoId },
          { onConflict: "user_id,curso_id", ignoreDuplicates: true }
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Estudiantes movidos" });
      setSelected(new Set());
      setMoveTarget("");
      qc.invalidateQueries({ queryKey: ["inscripciones", cursoId] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const enrolledSet = enrolled || new Set<string>();

  const grupoMemberIds = selectedGrupo !== "all"
    ? new Set((grupos?.find((g: any) => g.id === selectedGrupo)?.grupo_miembros || []).map((m: any) => m.user_id))
    : null;

  const filtered = (allStudents || []).filter((s: any) => {
    const matchSearch = `${s.nombre} ${s.apellidos} ${s.cedula}`.toLowerCase().includes(search.toLowerCase());
    const matchGrupo = !grupoMemberIds || grupoMemberIds.has(s.id);
    return matchSearch && matchGrupo;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const selectAll = () => setSelected(new Set(filtered.map((s: any) => s.id)));
  const clearAll = () => setSelected(new Set());

  const selectGrupo = (grupoId: string) => {
    const members = (grupos?.find((g: any) => g.id === grupoId)?.grupo_miembros || []).map((m: any) => m.user_id);
    setSelected(new Set(members));
  };

  if (loadingStudents) return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar estudiante..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={selectedGrupo} onValueChange={setSelectedGrupo}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar grupo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(grupos || []).map((g: any) => (
              <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enrollment counter for selected group */}
      {selectedGrupo !== "all" && grupoMemberIds && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <Users className="h-4 w-4 text-primary" />
          <div className="text-sm">
            <span className="font-medium">{(grupos?.find((g: any) => g.id === selectedGrupo) as any)?.nombre}:</span>
            {" "}
            <Badge variant="default" className="mx-1">{Array.from(grupoMemberIds).filter((id) => enrolledSet.has(id as string)).length} inscritos</Badge>
            <Badge variant="secondary" className="mx-1">{Array.from(grupoMemberIds).filter((id) => !enrolledSet.has(id as string)).length} faltan</Badge>
            <span className="text-muted-foreground">de {grupoMemberIds.size} total</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={selectAll}>Marcar todos</Button>
        <Button size="sm" variant="outline" onClick={clearAll}>Limpiar</Button>
        <Button size="sm" variant="outline" onClick={() => setSelected(new Set(filtered.filter((s: any) => enrolledSet.has(s.id)).map((s: any) => s.id)))}>Solo inscritos</Button>
        <Button size="sm" variant="outline" onClick={() => setSelected(new Set(filtered.filter((s: any) => !enrolledSet.has(s.id)).map((s: any) => s.id)))}>Solo no inscritos</Button>
        {(grupos || []).map((g: any) => (
          <Button key={g.id} size="sm" variant="secondary" onClick={() => selectGrupo(g.id)}>
            <Users className="h-3 w-3 mr-1" />{g.nombre}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="secondary">{selected.size} seleccionados</Badge>
        <Button size="sm" variant="neon" disabled={selected.size === 0 || enrollMutation.isPending} onClick={() => enrollMutation.mutate(Array.from(selected))}>
          <UserPlus className="h-3 w-3 mr-1" />Inscribir
        </Button>
        <Button size="sm" variant="destructive" disabled={selected.size === 0 || removeMutation.isPending} onClick={() => removeMutation.mutate(Array.from(selected))}>
          <UserMinus className="h-3 w-3 mr-1" />Remover
        </Button>
        <div className="flex items-center gap-1">
          <Select value={moveTarget} onValueChange={setMoveTarget}>
            <SelectTrigger className="w-[160px] h-8"><SelectValue placeholder="Mover a..." /></SelectTrigger>
            <SelectContent>
              {(otherCursos || []).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" disabled={selected.size === 0 || !moveTarget || moveMutation.isPending} onClick={() => moveMutation.mutate({ userIds: Array.from(selected), targetCursoId: moveTarget })}>
            <ArrowRightLeft className="h-3 w-3 mr-1" />Mover
          </Button>
        </div>
      </div>

      <div className="max-h-[40vh] overflow-y-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={(v) => v ? selectAll() : clearAll()}
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s: any) => (
              <TableRow key={s.id} className={enrolledSet.has(s.id) ? "bg-primary/5" : ""}>
                <TableCell>
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                </TableCell>
                <TableCell className="font-medium">{s.nombre} {s.apellidos}</TableCell>
                <TableCell>{s.cedula}</TableCell>
                <TableCell>
                  <Badge variant={enrolledSet.has(s.id) ? "default" : "secondary"}>
                    {enrolledSet.has(s.id) ? "Inscrito" : "No inscrito"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No se encontraron estudiantes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ─── TAB SESIONES ─── */
function TabSesiones({ cursoId }: { cursoId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedSesion, setSelectedSesion] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const { data: sesiones } = useQuery({
    queryKey: ["curso-sesiones", cursoId],
    queryFn: async () => {
      const { data } = await supabase.from("sesiones").select("*").eq("curso_id", cursoId).order("orden");
      return data || [];
    },
  });

  const { data: enrolled } = useQuery({
    queryKey: ["enrolled-users", cursoId],
    queryFn: async () => {
      const { data } = await supabase.from("inscripciones").select("user_id, profiles!inner(id, nombre, apellidos)").eq("curso_id", cursoId);
      return (data || []).map((i: any) => ({ id: i.user_id, ...i.profiles }));
    },
  });

  const { data: userSesiones, refetch: refetchUS } = useQuery({
    queryKey: ["sesiones-usuarios", cursoId, selectedSesion],
    enabled: !!selectedSesion,
    queryFn: async () => {
      const { data } = await supabase.from("sesiones_usuarios").select("*").eq("sesion_id", selectedSesion);
      return data || [];
    },
  });

  const isUnlocked = (userId: string) =>
    (userSesiones || []).some((su: any) => su.user_id === userId && su.desbloqueada);

  const toggleMutation = useMutation({
    mutationFn: async ({ userId, unlock }: { userId: string; unlock: boolean }) => {
      if (unlock) {
        await supabase.from("sesiones_usuarios").upsert(
          { sesion_id: selectedSesion, user_id: userId, desbloqueada: true },
          { onConflict: "sesion_id,user_id" }
        );
      } else {
        await supabase.from("sesiones_usuarios").delete().eq("sesion_id", selectedSesion).eq("user_id", userId);
      }
    },
    onSuccess: () => {
      refetchUS();
      qc.invalidateQueries({ queryKey: ["sesiones-usuarios"] });
    },
  });

  const batchMutation = useMutation({
    mutationFn: async ({ userIds, unlock }: { userIds: string[]; unlock: boolean }) => {
      if (unlock) {
        for (const user_id of userIds) {
          await supabase.from("sesiones_usuarios").upsert(
            { sesion_id: selectedSesion, user_id, desbloqueada: true },
            { onConflict: "sesion_id,user_id" }
          );
        }
      } else {
        await supabase.from("sesiones_usuarios").delete().eq("sesion_id", selectedSesion).in("user_id", userIds);
      }
    },
    onSuccess: () => {
      toast({ title: "Acceso actualizado" });
      setSelectedUsers(new Set());
      refetchUS();
    },
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedUsers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedUsers(next);
  };

  return (
    <div className="space-y-4 mt-4">
      <Select value={selectedSesion} onValueChange={setSelectedSesion}>
        <SelectTrigger><SelectValue placeholder="Seleccionar sesión..." /></SelectTrigger>
        <SelectContent>
          {(sesiones || []).map((s: any) => (
            <SelectItem key={s.id} value={s.id}>{s.orden}. {s.titulo}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedSesion && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">{selectedUsers.size} seleccionados</Badge>
            <Button size="sm" variant="outline" onClick={() => setSelectedUsers(new Set((enrolled || []).map((e: any) => e.id)))}>
              Marcar todos
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedUsers(new Set())}>
              Limpiar
            </Button>
            <Button size="sm" variant="neon" disabled={selectedUsers.size === 0} onClick={() => batchMutation.mutate({ userIds: Array.from(selectedUsers), unlock: true })}>
              <Unlock className="h-3 w-3 mr-1" />Desbloquear
            </Button>
            <Button size="sm" variant="destructive" disabled={selectedUsers.size === 0} onClick={() => batchMutation.mutate({ userIds: Array.from(selectedUsers), unlock: false })}>
              <Lock className="h-3 w-3 mr-1" />Bloquear
            </Button>
          </div>

          <div className="max-h-[40vh] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedUsers.size === (enrolled || []).length && (enrolled || []).length > 0}
                      onCheckedChange={(v) => v ? setSelectedUsers(new Set((enrolled || []).map((e: any) => e.id))) : setSelectedUsers(new Set())}
                    />
                  </TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Acceso</TableHead>
                  <TableHead className="w-20">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(enrolled || []).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Checkbox checked={selectedUsers.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{s.nombre} {s.apellidos}</TableCell>
                    <TableCell>
                      <Badge variant={isUnlocked(s.id) ? "default" : "secondary"}>
                        {isUnlocked(s.id) ? (
                          <><Unlock className="h-3 w-3 mr-1" />Desbloqueada</>
                        ) : (
                          <><Lock className="h-3 w-3 mr-1" />Bloqueada</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={isUnlocked(s.id)} onCheckedChange={(v) => toggleMutation.mutate({ userId: s.id, unlock: v })} />
                    </TableCell>
                  </TableRow>
                ))}
                {(enrolled || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay estudiantes inscritos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── TAB PROGRESO ─── */
function TabProgreso({ cursoId }: { cursoId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["curso-progreso", cursoId],
    queryFn: async () => {
      const { data: sesiones } = await supabase.from("sesiones").select("id, titulo, orden").eq("curso_id", cursoId).order("orden");
      const { data: inscritos } = await supabase.from("inscripciones").select("user_id, profiles!inner(id, nombre, apellidos)").eq("curso_id", cursoId);
      const sesionIds = (sesiones || []).map((s) => s.id);
      let progreso: any[] = [];
      if (sesionIds.length > 0) {
        const { data: p } = await supabase.from("progreso_estudiante").select("*").in("sesion_id", sesionIds);
        progreso = p || [];
      }

      return {
        sesiones: sesiones || [],
        estudiantes: (inscritos || []).map((i: any) => {
          const userProgreso = progreso.filter((p) => p.user_id === i.user_id);
          const completadas = userProgreso.filter((p) => (p.porcentaje || 0) >= 80).length;
          const totalSesiones = (sesiones || []).length;
          const avgPorcentaje = totalSesiones > 0 && userProgreso.length > 0
            ? Math.round(userProgreso.reduce((sum, p) => sum + (p.porcentaje || 0), 0) / totalSesiones)
            : 0;
          const currentSesion = userProgreso.length > 0
            ? Math.max(...userProgreso.map((p) => {
                const s = (sesiones || []).find((se) => se.id === p.sesion_id);
                return s ? s.orden : 0;
              }))
            : 0;
          return {
            id: i.user_id,
            nombre: `${i.profiles.nombre} ${i.profiles.apellidos}`,
            completadas,
            totalSesiones,
            avgPorcentaje,
            currentSesion,
          };
        }),
      };
    },
  });

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="max-h-[50vh] overflow-y-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Sesión actual</TableHead>
              <TableHead>Completadas</TableHead>
              <TableHead>Progreso general</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.estudiantes || []).map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nombre}</TableCell>
                <TableCell>
                  <Badge variant="outline">Sesión {e.currentSesion || "—"}</Badge>
                </TableCell>
                <TableCell>{e.completadas}/{e.totalSesiones}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={e.avgPorcentaje} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{e.avgPorcentaje}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(data?.estudiantes || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay estudiantes inscritos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, FileText, Image as ImageIcon, X, Trash2, Megaphone, Loader2, Monitor, Smartphone } from "lucide-react";

export default function AdminMensajes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: students } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, nombre, apellidos, cedula");
      return data || [];
    },
  });

  const { data: presencia } = useQuery({
    queryKey: ["presencia", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return null;
      const { data } = await supabase.from("presencia").select("*").eq("user_id", selectedUser).maybeSingle();
      return data;
    },
    enabled: !!selectedUser,
    refetchInterval: 30000,
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-messages", selectedUser],
    queryFn: async () => {
      let query = supabase.from("mensajes").select("*, remitente:profiles!mensajes_remitente_id_fkey(nombre, apellidos), destinatario:profiles!mensajes_destinatario_id_fkey(nombre, apellidos)").order("created_at", { ascending: true });
      if (selectedUser) {
        query = query.or(`remitente_id.eq.${selectedUser},destinatario_id.eq.${selectedUser}`);
      }
      const { data } = await query.limit(200);
      return data || [];
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    const ext = file.name.split(".").pop();
    const path = `mensajes/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 15, 90)), 200);
    const { error } = await supabase.storage.from("contenido").upload(path, file);
    clearInterval(interval);
    if (error) { setUploading(false); setUploadProgress(0); return; }
    const { data: urlData } = supabase.storage.from("contenido").getPublicUrl(path);
    setAttachedFile({ url: urlData.publicUrl, name: file.name });
    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || (!newMsg.trim() && !attachedFile)) return;
      const { error } = await supabase.from("mensajes").insert({
        remitente_id: user!.id,
        destinatario_id: selectedUser,
        contenido: newMsg.trim() || (attachedFile ? `📎 ${attachedFile.name}` : ""),
        archivo_url: attachedFile?.url || null,
        archivo_nombre: attachedFile?.name || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMsg("");
      setAttachedFile(null);
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
  });

  const deleteMsgMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("mensajes").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Mensajes eliminados" });
      setSelectedMsgs(new Set());
      setSelectMode(false);
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      const { error } = await supabase.from("mensajes").delete().or(`and(remitente_id.eq.${selectedUser},destinatario_id.eq.${user!.id}),and(remitente_id.eq.${user!.id},destinatario_id.eq.${selectedUser})`);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Conversación eliminada" });
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (!broadcastMsg.trim()) return;
      const activeStudents = students?.filter(s => s.id !== user!.id) || [];
      for (const s of activeStudents) {
        await supabase.from("mensajes").insert({
          remitente_id: user!.id,
          destinatario_id: s.id,
          contenido: broadcastMsg.trim(),
        } as any);
      }
      return activeStudents.length;
    },
    onSuccess: (count) => {
      toast({ title: `Mensaje enviado a ${count} estudiantes` });
      setBroadcastOpen(false);
      setBroadcastMsg("");
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedMsgs);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedMsgs(next);
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  const isOnline = presencia && (Date.now() - new Date(presencia.last_seen).getTime() < 120000);
  const selectedStudent = students?.find(s => s.id === selectedUser);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Mensajería</h2>
      <div className="flex gap-4 flex-wrap items-center">
        <div className="w-64">
          <Select value={selectedUser || "all"} onValueChange={v => { setSelectedUser(v === "all" ? "" : v); setSelectMode(false); setSelectedMsgs(new Set()); }}>
            <SelectTrigger><SelectValue placeholder="Filtrar por usuario" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {students?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} {s.apellidos}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Presence indicator */}
        {selectedUser && selectedStudent && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"}`} />
                  {presencia?.dispositivo === "móvil" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  <span className="font-medium">{selectedStudent.nombre}</span>
                  <span className="text-xs text-muted-foreground">{isOnline ? "En línea" : "Desconectado"}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs space-y-1">
                <p><strong>IP:</strong> {presencia?.ip || "Desconocida"}</p>
                <p><strong>Dispositivo:</strong> {presencia?.dispositivo || "Desconocido"}</p>
                <p><strong>Última conexión:</strong> {presencia?.last_seen ? new Date(presencia.last_seen).toLocaleString("es-EC") : "—"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Button variant="outline" size="sm" onClick={() => setBroadcastOpen(true)}>
          <Megaphone className="h-4 w-4 mr-1" />Mensaje masivo
        </Button>
        {selectedUser && (
          <>
            <Button variant="outline" size="sm" onClick={() => { setSelectMode(!selectMode); setSelectedMsgs(new Set()); }}>
              {selectMode ? "Cancelar selección" : "Seleccionar mensajes"}
            </Button>
            {selectMode && selectedMsgs.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => deleteMsgMutation.mutate(Array.from(selectedMsgs))}>
                <Trash2 className="h-4 w-4 mr-1" />Eliminar ({selectedMsgs.size})
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("¿Eliminar toda la conversación?")) deleteConversationMutation.mutate(); }}>
              <Trash2 className="h-4 w-4 mr-1" />Borrar conversación
            </Button>
          </>
        )}
      </div>

      {/* Broadcast dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>📢 Mensaje Masivo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Este mensaje se enviará a todos los estudiantes ({students?.filter(s => s.id !== user?.id).length || 0}).</p>
            <Textarea rows={4} value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Escribe tu mensaje..." />
            <Button variant="neon" className="w-full" onClick={() => broadcastMutation.mutate()} disabled={broadcastMutation.isPending || !broadcastMsg.trim()}>
              {broadcastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Megaphone className="h-4 w-4 mr-1" />}
              Enviar a todos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="h-[60vh] flex flex-col">
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages?.map(m => (
                <div key={m.id} className={`flex ${m.remitente_id === user?.id ? "justify-end" : "justify-start"} gap-2 items-start`}>
                  {selectMode && (
                    <Checkbox checked={selectedMsgs.has(m.id)} onCheckedChange={() => toggleSelect(m.id)} className="mt-3" />
                  )}
                  <div className={`max-w-[70%] p-3 rounded-lg text-sm ${m.remitente_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="text-xs opacity-70 mb-1">{(m.remitente as any)?.nombre} → {(m.destinatario as any)?.nombre}</p>
                    <p>{m.contenido}</p>
                    {m.archivo_url && (
                      <div className="mt-2">
                        {isImage(m.archivo_nombre || "") ? (
                          <img src={m.archivo_url} alt="" className="max-w-full rounded max-h-48" />
                        ) : (
                          <a href={m.archivo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline text-xs">
                            <FileText className="h-3 w-3" />{m.archivo_nombre}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        {selectedUser && (
          <div className="p-4 border-t border-border space-y-2">
            {uploading && <Progress value={uploadProgress} className="h-2" />}
            {attachedFile && (
              <div className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                <Paperclip className="h-3 w-3" />
                <span className="truncate flex-1">{attachedFile.name}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachedFile(null)}><X className="h-3 w-3" /></Button>
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Escribe un mensaje..." onKeyDown={e => e.key === "Enter" && sendMutation.mutate()} className="flex-1" />
              <Button variant="neon" size="icon" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

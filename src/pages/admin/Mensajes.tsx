import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, FileText, Image as ImageIcon, X } from "lucide-react";

export default function AdminMensajes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: students } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, nombre, apellidos, cedula");
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-messages", selectedUser],
    queryFn: async () => {
      let query = supabase.from("mensajes").select("*, remitente:profiles!mensajes_remitente_id_fkey(nombre, apellidos), destinatario:profiles!mensajes_destinatario_id_fkey(nombre, apellidos)").order("created_at", { ascending: true });
      if (selectedUser) {
        query = query.or(`remitente_id.eq.${selectedUser},destinatario_id.eq.${selectedUser}`);
      }
      const { data } = await query.limit(100);
      return data || [];
    },
    refetchInterval: 10000,
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `mensajes/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("contenido").upload(path, file);
    if (error) { setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("contenido").getPublicUrl(path);
    setAttachedFile({ url: urlData.publicUrl, name: file.name });
    setUploading(false);
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

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Mensajería</h2>
      <div className="flex gap-4">
        <div className="w-64">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger><SelectValue placeholder="Filtrar por usuario" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {students?.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre} {s.apellidos}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="h-[60vh] flex flex-col">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {messages?.map(m => (
                <div key={m.id} className={`flex ${m.remitente_id === user?.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg text-sm ${m.remitente_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="text-xs opacity-70 mb-1">{(m.remitente as any)?.nombre} → {(m.destinatario as any)?.nombre}</p>
                    <p>{m.contenido}</p>
                    {(m as any).archivo_url && (
                      <div className="mt-2">
                        {isImage((m as any).archivo_nombre || "") ? (
                          <img src={(m as any).archivo_url} alt="" className="max-w-full rounded max-h-48" />
                        ) : (
                          <a href={(m as any).archivo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline text-xs">
                            <FileText className="h-3 w-3" />{(m as any).archivo_nombre}
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

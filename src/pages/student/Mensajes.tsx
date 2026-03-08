import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Send, Paperclip, FileText, X, Eye } from "lucide-react";
import { useViewAsStudent } from "@/components/StudentLayout";

export default function StudentMensajes() {
  const { user } = useAuth();
  const viewAsId = useViewAsStudent();
  const targetId = viewAsId || user?.id;
  const isViewingOther = !!viewAsId;
  const qc = useQueryClient();
  const [newMsg, setNewMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: adminId } = useQuery({
    queryKey: ["admin-id"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("rol", "admin").limit(1);
      return data?.[0]?.user_id || null;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["student-messages", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("mensajes")
        .select("*")
        .or(`remitente_id.eq.${targetId},destinatario_id.eq.${targetId}`)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data && !isViewingOther) {
        const unread = data.filter(m => m.destinatario_id === user!.id && !m.leido);
        if (unread.length > 0) {
          await supabase.from("mensajes").update({ leido: true }).in("id", unread.map(m => m.id));
          qc.invalidateQueries({ queryKey: ["unread-messages"] });
        }
      }
      return data || [];
    },
    enabled: !!targetId,
    refetchInterval: 10000,
  });

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
      if (!adminId || (!newMsg.trim() && !attachedFile)) return;
      const { error } = await supabase.from("mensajes").insert({
        remitente_id: user!.id,
        destinatario_id: adminId,
        contenido: newMsg.trim() || (attachedFile ? `📎 ${attachedFile.name}` : ""),
        archivo_url: attachedFile?.url || null,
        archivo_nombre: attachedFile?.name || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMsg("");
      setAttachedFile(null);
      qc.invalidateQueries({ queryKey: ["student-messages"] });
    },
  });

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-display font-bold">Mensajes</h2>
      <Card className="h-[60vh] flex flex-col">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {messages?.map(m => (
                <div key={m.id} className={`flex ${m.remitente_id === targetId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.remitente_id === targetId ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
              {messages?.length === 0 && <p className="text-center text-muted-foreground py-8">Sin mensajes</p>}
            </div>
          </ScrollArea>
        </CardContent>
        {isViewingOther ? (
          <div className="p-4 border-t border-border text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Eye className="h-4 w-4" /> Solo lectura — estás viendo los mensajes de otro estudiante
          </div>
        ) : (
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
              <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1" onKeyDown={e => e.key === "Enter" && sendMutation.mutate()} />
              <Button variant="neon" size="icon" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

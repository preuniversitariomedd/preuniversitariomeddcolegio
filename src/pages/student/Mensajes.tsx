import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";

export default function StudentMensajes() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [newMsg, setNewMsg] = useState("");

  // Get admin users to message
  const { data: admins } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, profiles(id, nombre, apellidos)").eq("rol", "admin");
      return data?.map(d => (d.profiles as any)) || [];
    },
  });

  const [recipientId, setRecipientId] = useState("");

  const { data: messages, isLoading } = useQuery({
    queryKey: ["student-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mensajes")
        .select("*, remitente:profiles!mensajes_remitente_id_fkey(nombre), destinatario:profiles!mensajes_destinatario_id_fkey(nombre)")
        .order("created_at", { ascending: true })
        .limit(100);
      return data || [];
    },
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const target = recipientId || admins?.[0]?.id;
      if (!target || !newMsg.trim()) return;
      await supabase.from("mensajes").insert({
        remitente_id: user!.id,
        destinatario_id: target,
        contenido: newMsg.trim(),
      });
    },
    onSuccess: () => {
      setNewMsg("");
      qc.invalidateQueries({ queryKey: ["student-messages"] });
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-display font-bold">Mensajes</h2>

      <Card className="h-[60vh] flex flex-col">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-3">
              {messages?.map(m => (
                <div key={m.id} className={`flex ${m.remitente_id === user?.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.remitente_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className="text-xs opacity-70 mb-1">{(m.remitente as any)?.nombre}</p>
                    <p>{m.contenido}</p>
                  </div>
                </div>
              ))}
              {messages?.length === 0 && <p className="text-center text-muted-foreground py-8">Sin mensajes</p>}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="p-4 border-t border-border flex gap-2">
          {admins && admins.length > 1 && (
            <Select value={recipientId || admins[0]?.id} onValueChange={setRecipientId}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{admins.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1" onKeyDown={e => e.key === "Enter" && sendMutation.mutate()} />
          <Button variant="neon" size="icon" onClick={() => sendMutation.mutate()}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";

export default function AdminMensajes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedUser, setSelectedUser] = useState("");
  const [newMsg, setNewMsg] = useState("");

  const { data: students } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, nombre, apellidos, cedula");
      return data || [];
    },
  });

  const { data: messages, isLoading } = useQuery({
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

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !newMsg.trim()) return;
      const { error } = await supabase.from("mensajes").insert({
        remitente_id: user!.id,
        destinatario_id: selectedUser,
        contenido: newMsg.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMsg("");
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
    },
  });

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
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        {selectedUser && (
          <div className="p-4 border-t border-border flex gap-2">
            <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Escribe un mensaje..." onKeyDown={e => e.key === "Enter" && sendMutation.mutate()} />
            <Button variant="neon" size="icon" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}><Send className="h-4 w-4" /></Button>
          </div>
        )}
      </Card>
    </div>
  );
}

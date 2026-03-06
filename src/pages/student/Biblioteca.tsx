import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, FileText, Video, Link as LinkIcon, Image, File, Loader2 } from "lucide-react";
import { useState } from "react";

const typeIcons: Record<string, any> = { pdf: FileText, video: Video, link: LinkIcon, imagen: Image, documento: File };

export default function StudentBiblioteca() {
  const [tipo, setTipo] = useState("");
  const [search, setSearch] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["student-biblioteca"],
    queryFn: async () => {
      const { data } = await supabase.from("biblioteca").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = items?.filter(i =>
    (!tipo || i.tipo === tipo) && (!search || i.titulo.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Biblioteca</h2>
      <div className="flex gap-4 flex-wrap">
        <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="imagen">Imagen</SelectItem>
            <SelectItem value="documento">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered?.map(item => {
          const Icon = typeIcons[item.tipo] || File;
          return (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="py-4 flex items-start gap-3">
                  <Icon className="h-8 w-8 text-primary shrink-0 mt-1" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.titulo}</p>
                    {item.descripcion && <p className="text-xs text-muted-foreground line-clamp-2">{item.descripcion}</p>}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{item.tipo}</Badge>
                      {item.categoria && <Badge variant="outline" className="text-xs">{item.categoria}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}

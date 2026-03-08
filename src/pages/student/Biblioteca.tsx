import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, FileText, Video, Link as LinkIcon, Image, File, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const typeIcons: Record<string, any> = { pdf: FileText, video: Video, link: LinkIcon, imagen: Image, documento: File };

export default function StudentBiblioteca() {
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const { data: items, isLoading } = useQuery({
    queryKey: ["student-biblioteca"],
    queryFn: async () => {
      const { data } = await supabase.from("biblioteca").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = items?.filter(i =>
    !search || i.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = (filtered || []).reduce<Record<string, typeof filtered>>((acc, item) => {
    const cat = item.categoria || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(item);
    return acc;
  }, {});

  const toggleCat = (cat: string) => {
    const next = new Set(expandedCats);
    next.has(cat) ? next.delete(cat) : next.add(cat);
    setExpandedCats(next);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Biblioteca</h2>
      <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, catItems]) => (
          <Collapsible key={cat} open={expandedCats.has(cat)} onOpenChange={() => toggleCat(cat)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardContent className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {expandedCats.has(cat) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="font-medium">{cat}</span>
                    <Badge variant="secondary">{catItems!.length}</Badge>
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 grid gap-3 sm:grid-cols-2">
                  {catItems!.map(item => {
                    const Icon = typeIcons[item.tipo] || File;
                    return (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <Icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{item.titulo}</p>
                            {item.descripcion && <p className="text-xs text-muted-foreground line-clamp-2">{item.descripcion}</p>}
                            <Badge variant="secondary" className="text-xs mt-1">{item.tipo}</Badge>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
        {Object.keys(grouped).length === 0 && <p className="text-center text-muted-foreground py-8">No hay recursos disponibles.</p>}
      </div>
    </div>
  );
}

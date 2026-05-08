import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Send, RotateCcw, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import katex from "katex";
import "katex/dist/katex.min.css";

function renderMath(text: string) {
  if (!text) return "";
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, t) => {
      try { return `<div class="my-3 text-center overflow-x-auto">${katex.renderToString(t.trim(), { displayMode: true, throwOnError: false })}</div>`; }
      catch { return t; }
    })
    .replace(/\$([^\$\n]+?)\$/g, (_, t) => {
      try { return katex.renderToString(t.trim(), { throwOnError: false }); }
      catch { return t; }
    })
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-primary">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2 text-primary">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2 text-primary">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\n/g, '<br/>');
}

export default function TutorMate() {
  const [ejercicio, setEjercicio] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [cargando, setCargando] = useState(false);
  const { toast } = useToast();
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight; }, [respuesta]);

  const enviar = async () => {
    if (!ejercicio.trim() || cargando) return;
    setCargando(true);
    setRespuesta("");
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-mate`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ ejercicio: ejercicio.trim() }),
      });
      if (!resp.ok || !resp.body) {
        const data = await resp.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "No se pudo contactar al tutor", variant: "destructive" });
        setCargando(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim()) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) setRespuesta(prev => prev + c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      toast({ title: "Error", description: "Falla de red", variant: "destructive" });
    } finally {
      setCargando(false);
    }
  };

  const reset = () => { setEjercicio(""); setRespuesta(""); };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Mr. VICTOR L3 — Tutor IA</h2>
          <p className="text-sm text-muted-foreground">Pega un ejercicio matemático y recibe pasos + 5 ejercicios progresivos.</p>
        </div>
        <Badge variant="secondary" className="ml-auto"><Sparkles className="h-3 w-3 mr-1" />Gratis</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu ejercicio matriz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={ejercicio}
            onChange={e => setEjercicio(e.target.value)}
            placeholder="Ej: Resuelve 3x + 5 = 2x - 7    o    Calcula la derivada de f(x) = x^2·sin(x)"
            className="min-h-[120px] font-mono text-sm"
            disabled={cargando}
            maxLength={4000}
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={enviar} disabled={cargando || !ejercicio.trim()} variant="neon">
              {cargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {cargando ? "Resolviendo..." : "Resolver con Mr. VICTOR L3"}
            </Button>
            {(respuesta || ejercicio) && (
              <Button onClick={reset} variant="outline" disabled={cargando}>
                <RotateCcw className="h-4 w-4 mr-2" />Nuevo
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Soporta LaTeX: usa $...$ para fórmulas inline y $$...$$ para bloques.</p>
        </CardContent>
      </Card>

      {(respuesta || cargando) && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Solución y ejercicios progresivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={outRef}
              className="prose prose-sm dark:prose-invert max-w-none max-h-[70vh] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderMath(respuesta) || (cargando ? '<p class="text-muted-foreground">Pensando...</p>' : "") }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

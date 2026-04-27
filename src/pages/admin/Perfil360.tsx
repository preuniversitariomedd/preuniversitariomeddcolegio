import { useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, ArrowLeft, Brain, Sparkles, GraduationCap, Target, AlertTriangle,
  Lightbulb, Heart, BookOpen, FileDown, Wand2, CheckCircle2, TrendingUp, Calendar,
} from "lucide-react";
import { construirPerfil360, type ResultadoTest } from "@/lib/perfil360";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AnalisisIA {
  resumen_ejecutivo: string;
  justificacion_edad_mental?: string;
  fortalezas_clave: string[];
  areas_desarrollo: string[];
  estilo_aprendizaje_detallado: string;
  recomendaciones_dua: { principio: string; titulo: string; accion_concreta: string; prioridad: string }[];
  orientacion_vocacional: string;
  alertas_psicopedagogicas?: { tipo: string; nivel: string; intervencion_sugerida: string }[];
  plan_30_dias: string[];
}

export default function AdminPerfil360() {
  const { id } = useParams();
  const [analisisIA, setAnalisisIA] = useState<AnalisisIA | null>(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: profile, isLoading: lp } = useQuery({
    queryKey: ["profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: resultados, isLoading: lr } = useQuery({
    queryKey: ["resultados-tests", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_tests")
        .select("test_id, puntaje_por_subescala, puntaje_total, fecha")
        .eq("user_id", id!)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data || []) as ResultadoTest[];
    },
  });

  const perfil = useMemo(
    () => (resultados ? construirPerfil360(resultados, profile?.fecha_nacimiento ?? null) : null),
    [resultados, profile],
  );

  async function ejecutarAnalisisIA() {
    if (!perfil || !profile) return;
    setCargandoIA(true);
    try {
      const edadCron = profile.fecha_nacimiento
        ? Math.floor((Date.now() - new Date(profile.fecha_nacimiento).getTime()) / (365.25 * 24 * 3600 * 1000))
        : null;
      const resumen = {
        estudiante: { nombre: profile.nombre, apellidos: profile.apellidos, edad_cronologica: edadCron },
        edadMental: perfil.edadMental,
        rasgos: perfil.rasgos,
        inteligenciasTop: perfil.inteligenciasTop,
        dua: perfil.dua,
        vocacional: perfil.vocacional,
        adaptaciones: perfil.adaptaciones,
        alertas: perfil.alertas,
        subescalas: perfil.subescalas.map((s) => ({
          testNombre: s.testNombre, subescalaNombre: s.subescalaNombre, porcentaje: s.porcentaje,
        })),
        testsCompletados: perfil.testsCompletados,
        porcentajeCompletitud: perfil.porcentajeCompletitud,
      };
      const { data, error } = await supabase.functions.invoke("analizar-perfil-360", {
        body: { perfil: resumen },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalisisIA(data.analisis);
      toast({ title: "Análisis IA listo", description: "Recomendaciones generadas correctamente." });
    } catch (e: any) {
      toast({ title: "Error en análisis IA", description: e.message ?? "Intenta nuevamente.", variant: "destructive" });
    } finally {
      setCargandoIA(false);
    }
  }

  function exportarPDF() {
    if (!perfil || !profile) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // Encabezado
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Perfil 360°", margin, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Análisis psicopedagógico integral · MEDD", margin, 19);
    doc.text(new Date().toLocaleDateString("es-EC"), pageW - margin - 25, 19);

    y = 38;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${profile.nombre ?? ""} ${profile.apellidos ?? ""}`, margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`CI: ${profile.cedula ?? "—"}  ·  Tests completados: ${perfil.testsCompletados}  ·  Completitud: ${perfil.porcentajeCompletitud}%`, margin, y);
    y += 10;

    // Edad mental
    if (perfil.edadMental) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Edad mental estimada", margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${perfil.edadMental.valor} años — ${perfil.edadMental.rango}`, margin, y);
      y += 5;
      const interpLines = doc.splitTextToSize(perfil.edadMental.interpretacion, pageW - 2 * margin);
      doc.text(interpLines, margin, y);
      y += interpLines.length * 4.5 + 4;
    }

    // DUA
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Estilo de aprendizaje (DUA)", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Eje", "Tipo", "Score", "Descripción"]],
      body: [
        ["Representación", perfil.dua.representacion.canal, `${perfil.dua.representacion.score}%`, perfil.dua.representacion.descripcion],
        ["Acción/expresión", perfil.dua.accion.tipo, `${perfil.dua.accion.score}%`, perfil.dua.accion.descripcion],
        ["Motivación", perfil.dua.motivacion.tipo, `${perfil.dua.motivacion.score}%`, perfil.dua.motivacion.descripcion],
      ],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 3: { cellWidth: 90 } },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Vocacional
    if (perfil.vocacional) {
      if (y > 250) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Holland: ${perfil.vocacional.codigo}`, margin, y);
      y += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const carrLines = doc.splitTextToSize("Carreras compatibles: " + perfil.vocacional.carreras.join(", "), pageW - 2 * margin);
      doc.text(carrLines, margin, y);
      y += carrLines.length * 4 + 6;
    }

    // Inteligencias top
    if (perfil.inteligenciasTop.length) {
      if (y > 240) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Inteligencias múltiples (top)", margin, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Inteligencia", "Nivel"]],
        body: perfil.inteligenciasTop.map((i) => [i.nombre, `${i.valor}%`]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Adaptaciones
    if (perfil.adaptaciones.length) {
      if (y > 230) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Adaptaciones DUA recomendadas", margin, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Prioridad", "Adaptación", "Descripción"]],
        body: perfil.adaptaciones.map((a) => [a.prioridad, a.titulo, a.descripcion]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59] },
        columnStyles: { 2: { cellWidth: 110 } },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Alertas
    if (perfil.alertas.length) {
      if (y > 240) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 30, 40);
      doc.text("Alertas psicopedagógicas", margin, y);
      doc.setTextColor(15, 23, 42);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Tipo", "Nivel", "Mensaje"]],
        body: perfil.alertas.map((a) => [a.tipo, a.nivel, a.mensaje]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [180, 30, 40] },
        columnStyles: { 2: { cellWidth: 120 } },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Análisis IA
    if (analisisIA) {
      doc.addPage(); y = margin;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Análisis cualitativo (IA)", margin, y);
      y += 8;

      const block = (titulo: string, texto: string) => {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(titulo, margin, y);
        y += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(texto, pageW - 2 * margin);
        doc.text(lines, margin, y);
        y += lines.length * 4.2 + 5;
      };

      block("Resumen ejecutivo", analisisIA.resumen_ejecutivo);
      if (analisisIA.justificacion_edad_mental) block("Justificación edad mental", analisisIA.justificacion_edad_mental);
      block("Estilo de aprendizaje", analisisIA.estilo_aprendizaje_detallado);
      block("Orientación vocacional", analisisIA.orientacion_vocacional);
      block("Fortalezas clave", analisisIA.fortalezas_clave.map((f) => "• " + f).join("\n"));
      block("Áreas de desarrollo", analisisIA.areas_desarrollo.map((f) => "• " + f).join("\n"));

      if (y > 220) { doc.addPage(); y = margin; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Recomendaciones DUA", margin, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Principio", "Prioridad", "Acción concreta"]],
        body: analisisIA.recomendaciones_dua.map((r) => [r.principio.replace("_", " "), r.prioridad, `${r.titulo}: ${r.accion_concreta}`]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59] },
        columnStyles: { 2: { cellWidth: 120 } },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      block("Plan a 30 días", analisisIA.plan_30_dias.map((p, i) => `${i + 1}. ${p}`).join("\n"));
    }

    // Pie
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`MEDD · Perfil 360° · Página ${i}/${pageCount}`, pageW / 2, 290, { align: "center" });
    }

    doc.save(`perfil-360-${profile.cedula ?? id}.pdf`);
    toast({ title: "PDF generado", description: "Descarga iniciada." });
  }

  if (lp || lr) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">Estudiante no encontrado.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" ref={reportRef}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/estudiantes"><ArrowLeft className="h-4 w-4 mr-1" /> Estudiantes</Link>
        </Button>
        {perfil && perfil.testsCompletados > 0 && (
          <div className="flex gap-2">
            <Button onClick={ejecutarAnalisisIA} disabled={cargandoIA} size="sm" variant="default">
              {cargandoIA ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1" />}
              {analisisIA ? "Re-analizar IA" : "Analizar con IA"}
            </Button>
            <Button onClick={exportarPDF} size="sm" variant="outline">
              <FileDown className="h-4 w-4 mr-1" /> Exportar PDF
            </Button>
          </div>
        )}
      </div>

      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> Perfil 360°
        </h1>
        <p className="text-muted-foreground">
          {profile.nombre} {profile.apellidos} · CI {profile.cedula}
        </p>
      </header>

      {!perfil || perfil.testsCompletados === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">El estudiante aún no ha completado ningún test psicométrico.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header de completitud */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Completitud del perfil</span>
                <span className="text-muted-foreground">{perfil.testsCompletados} tests · {perfil.porcentajeCompletitud}%</span>
              </div>
              <Progress value={perfil.porcentajeCompletitud} />
              <p className="text-xs text-muted-foreground">
                Confianza del análisis: {perfil.porcentajeCompletitud >= 60 ? "Alta" : perfil.porcentajeCompletitud >= 30 ? "Media" : "Parcial"}
              </p>
            </CardContent>
          </Card>

          {/* Análisis IA */}
          {analisisIA && (
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="h-5 w-5 text-primary" /> Análisis cualitativo (IA)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Resumen ejecutivo</p>
                  <p className="text-muted-foreground leading-relaxed">{analisisIA.resumen_ejecutivo}</p>
                </div>
                {analisisIA.justificacion_edad_mental && (
                  <div>
                    <p className="font-medium mb-1">Justificación de la edad mental</p>
                    <p className="text-muted-foreground leading-relaxed">{analisisIA.justificacion_edad_mental}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> Fortalezas</p>
                    <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                      {analisisIA.fortalezas_clave.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-1"><TrendingUp className="h-4 w-4 text-amber-600" /> Áreas de desarrollo</p>
                    <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                      {analisisIA.areas_desarrollo.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-1">Estilo de aprendizaje detallado</p>
                  <p className="text-muted-foreground leading-relaxed">{analisisIA.estilo_aprendizaje_detallado}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Orientación vocacional</p>
                  <p className="text-muted-foreground leading-relaxed">{analisisIA.orientacion_vocacional}</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Recomendaciones DUA priorizadas</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {analisisIA.recomendaciones_dua.map((r, i) => (
                      <div key={i} className="border rounded-md p-2 bg-background space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">{r.titulo}</p>
                          <Badge variant={r.prioridad === "alta" ? "default" : "secondary"} className="text-[10px]">{r.prioridad}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground capitalize">{r.principio.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{r.accion_concreta}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {analisisIA.alertas_psicopedagogicas && analisisIA.alertas_psicopedagogicas.length > 0 && (
                  <div>
                    <p className="font-medium mb-1 flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-destructive" /> Alertas e intervenciones IA</p>
                    <div className="space-y-2">
                      {analisisIA.alertas_psicopedagogicas.map((a, i) => (
                        <div key={i} className="text-xs p-2 rounded-md bg-destructive/5 border border-destructive/20">
                          <p className="font-medium capitalize">{a.tipo} — nivel {a.nivel}</p>
                          <p className="text-muted-foreground">{a.intervencion_sugerida}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-medium mb-1 flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" /> Plan a 30 días</p>
                  <ol className="text-xs text-muted-foreground list-decimal pl-5 space-y-0.5">
                    {analisisIA.plan_30_dias.map((p, i) => <li key={i}>{p}</li>)}
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edad mental + Estilo DUA */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Brain className="h-5 w-5 text-primary" /> Edad mental estimada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {perfil.edadMental ? (
                  <>
                    <div className="text-center py-3 bg-muted rounded-lg">
                      <p className="text-5xl font-bold text-primary">{perfil.edadMental.valor}</p>
                      <p className="text-xs text-muted-foreground mt-1">años · {perfil.edadMental.rango}</p>
                    </div>
                    <p className="text-sm leading-relaxed">{perfil.edadMental.interpretacion}</p>
                    <p className="text-xs text-muted-foreground">
                      Factores usados: {perfil.edadMental.factoresUsados.join(", ")}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Faltan tests para calcularla. Necesarios: Metacognición, Inteligencia Emocional, Pensamiento Analítico, Autoestima o Big Five.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-5 w-5 text-accent-foreground" /> Estilo de aprendizaje (DUA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span className="font-medium">Representación</span><Badge variant="outline" className="capitalize">{perfil.dua.representacion.canal}</Badge></div>
                  <Progress value={perfil.dua.representacion.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{perfil.dua.representacion.descripcion}</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="font-medium">Acción y expresión</span><Badge variant="outline">{perfil.dua.accion.tipo}</Badge></div>
                  <Progress value={perfil.dua.accion.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{perfil.dua.accion.descripcion}</p>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="font-medium">Motivación</span><Badge variant="outline">{perfil.dua.motivacion.tipo}</Badge></div>
                  <Progress value={perfil.dua.motivacion.score} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{perfil.dua.motivacion.descripcion}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inteligencias Múltiples */}
          {perfil.inteligenciasTop.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-5 w-5 text-primary" /> Inteligencias múltiples (Gardner)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={perfil.inteligenciasTop.map(i => ({ subject: i.nombre, A: i.valor }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Rasgos consolidados */}
          {perfil.rasgos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-5 w-5 text-primary" /> Rasgos de personalidad consolidados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, perfil.rasgos.length * 28)}>
                  <BarChart data={perfil.rasgos} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis type="category" dataKey="nombre" width={140} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Vocacional */}
          {perfil.vocacional && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-primary" /> Perfil vocacional Holland</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="text-lg px-3 py-1 font-mono">{perfil.vocacional.codigo}</Badge>
                  <div className="flex gap-1 flex-wrap">
                    {perfil.vocacional.top3.map(t => (
                      <Badge key={t.codigo} variant="outline">{t.nombre} {t.valor}%</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Carreras compatibles:</p>
                  <div className="flex gap-1 flex-wrap">
                    {perfil.vocacional.carreras.map(c => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Adaptaciones DUA */}
          {perfil.adaptaciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-primary" /> Adaptaciones DUA recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {perfil.adaptaciones.map((a, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{a.titulo}</p>
                        <Badge variant={a.prioridad === "alta" ? "default" : "secondary"} className="text-[10px]">{a.prioridad}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{a.descripcion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alertas */}
          {perfil.alertas.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive"><AlertTriangle className="h-5 w-5" /> Alertas psicopedagógicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {perfil.alertas.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-destructive/5 rounded-md border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium capitalize">{a.tipo} — nivel {a.nivel}</p>
                      <p className="text-xs text-muted-foreground">{a.mensaje}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detalle por subescala */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle por subescala ({perfil.subescalas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {perfil.subescalas.map((s, i) => (
                  <div key={i} className="text-xs space-y-1 p-2 border rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{s.subescalaNombre}</span>
                      <span className="font-mono">{s.porcentaje}%</span>
                    </div>
                    <Progress value={s.porcentaje} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">{s.testNombre}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

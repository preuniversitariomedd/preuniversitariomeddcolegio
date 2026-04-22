import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target, BarChart3 } from "lucide-react";
import { TESTS, EJERCICIOS_CONCENTRACION, getTestById, getEjercicioById } from "@/data/testdata";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminPsicometria() {
  const { data: resultadosTests } = useQuery({
    queryKey: ["admin-resultados-tests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("resultados_tests")
        .select("*, profiles!inner(nombre, apellidos, cedula)")
        .order("fecha", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const { data: resultadosEjercicios } = useQuery({
    queryKey: ["admin-resultados-ejercicios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("resultados_ejercicios_concentracion")
        .select("*, profiles!inner(nombre, apellidos, cedula)")
        .order("fecha", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const distribucion = useMemo(() => {
    if (!resultadosTests) return [];
    const map = new Map<string, { test: string; bajo: number; medio: number; alto: number; total: number }>();
    for (const r of resultadosTests as any[]) {
      const nombre = getTestById(r.test_id)?.nombre || r.test_id;
      const cur = map.get(r.test_id) || { test: nombre, bajo: 0, medio: 0, alto: 0, total: 0 };
      const nivel = (r.interpretacion || "").toString().toLowerCase();
      if (nivel === "bajo" || nivel === "medio" || nivel === "alto") {
        (cur as any)[nivel] += 1;
        cur.total += 1;
      }
      map.set(r.test_id, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [resultadosTests]);

  const totalesGlobales = useMemo(() => {
    const acc = { bajo: 0, medio: 0, alto: 0 };
    for (const d of distribucion) { acc.bajo += d.bajo; acc.medio += d.medio; acc.alto += d.alto; }
    return [
      { name: "Bajo", value: acc.bajo, color: "hsl(var(--destructive))" },
      { name: "Medio", value: acc.medio, color: "hsl(var(--muted-foreground))" },
      { name: "Alto", value: acc.alto, color: "hsl(var(--primary))" },
    ];
  }, [distribucion]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Psicometría y Concentración</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de instrumentos disponibles y resultados de los estudiantes.
        </p>
      </header>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="resultados-tests">Resultados de tests</TabsTrigger>
          <TabsTrigger value="resultados-ejercicios">Resultados de ejercicios</TabsTrigger>
        </TabsList>

        <TabsContent value="graficos" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Distribución de niveles por test</CardTitle>
            </CardHeader>
            <CardContent>
              {distribucion.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Aún no hay resultados para graficar.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(280, distribucion.length * 56)}>
                  <BarChart data={distribucion} layout="vertical" margin={{ left: 24, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="test" width={180} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="bajo" stackId="a" fill="hsl(var(--destructive))" name="Bajo" />
                    <Bar dataKey="medio" stackId="a" fill="hsl(var(--muted-foreground))" name="Medio" />
                    <Bar dataKey="alto" stackId="a" fill="hsl(var(--primary))" name="Alto" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Distribución global</CardTitle></CardHeader>
              <CardContent>
                {totalesGlobales.every(t => t.value === 0) ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">Sin datos.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={totalesGlobales} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.value}`}>
                        {totalesGlobales.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Resumen por test</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead className="text-right">Bajo</TableHead>
                      <TableHead className="text-right">Medio</TableHead>
                      <TableHead className="text-right">Alto</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distribucion.map((d) => (
                      <TableRow key={d.test}>
                        <TableCell className="text-xs">{d.test}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{d.bajo}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{d.medio}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{d.alto}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{d.total}</TableCell>
                      </TableRow>
                    ))}
                    {!distribucion.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-xs">Sin datos</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> Tests psicométricos ({TESTS.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {TESTS.map((t) => (
                  <div key={t.id} className="border rounded-lg p-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground">{t.tiempo_estimado} min · {t.preguntas.length} ítems</p>
                    </div>
                    <Badge variant={t.estado === "completo" ? "default" : "outline"} className="text-xs">
                      {t.estado === "completo" ? "Disponible" : "Pendiente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Ejercicios de concentración ({EJERCICIOS_CONCENTRACION.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {EJERCICIOS_CONCENTRACION.map((e) => (
                  <div key={e.id} className="border rounded-lg p-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground">{e.tiempo_estimado} min</p>
                    </div>
                    <Badge variant={e.prioridad === "alta" ? "default" : "secondary"} className="text-xs">
                      {e.prioridad}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultados-tests" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Puntaje</TableHead>
                    <TableHead>Nivel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultadosTests?.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.profiles?.apellidos}, {r.profiles?.nombre}</TableCell>
                      <TableCell>{getTestById(r.test_id)?.nombre || r.test_id}</TableCell>
                      <TableCell className="text-xs">{new Date(r.fecha).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">{r.puntaje_total}</TableCell>
                      <TableCell><Badge variant="outline">{r.interpretacion}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {!resultadosTests?.length && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin resultados aún</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultados-ejercicios" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Ejercicio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Métricas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultadosEjercicios?.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.profiles?.apellidos}, {r.profiles?.nombre}</TableCell>
                      <TableCell>{getEjercicioById(r.ejercicio_id)?.nombre || r.ejercicio_id}</TableCell>
                      <TableCell className="text-xs">{new Date(r.fecha).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs max-w-md truncate">{JSON.stringify(r.metricas)}</TableCell>
                    </TableRow>
                  ))}
                  {!resultadosEjercicios?.length && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin resultados aún</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

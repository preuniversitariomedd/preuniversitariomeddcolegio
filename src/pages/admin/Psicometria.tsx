import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target } from "lucide-react";
import { TESTS, EJERCICIOS_CONCENTRACION, getTestById, getEjercicioById } from "@/data/testdata";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <TabsTrigger value="resultados-tests">Resultados de tests</TabsTrigger>
          <TabsTrigger value="resultados-ejercicios">Resultados de ejercicios</TabsTrigger>
        </TabsList>

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

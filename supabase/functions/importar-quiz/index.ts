import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("rol")
    .eq("user_id", caller.id)
    .eq("activo", true)
    .single();

  if (roleData?.rol !== "admin") {
    return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
  }

  try {
    const { sesion_id, texto } = await req.json();
    if (!sesion_id || !texto) throw new Error("Missing sesion_id or texto");

    const bloques = texto.split("---").map((b: string) => b.trim()).filter(Boolean);
    const resultados: { importadas: number; errores: { bloque: number; error: string }[] } = { importadas: 0, errores: [] };

    for (let i = 0; i < bloques.length; i++) {
      try {
        const bloque = bloques[i];
        const preguntaMatch = bloque.match(/PREGUNTA:\s*(.+?)(?=\nA\))/s);
        const opcionA = bloque.match(/A\)\s*(.+)/);
        const opcionB = bloque.match(/B\)\s*(.+)/);
        const opcionC = bloque.match(/C\)\s*(.+)/);
        const opcionD = bloque.match(/D\)\s*(.+)/);
        const correctaMatch = bloque.match(/CORRECTA:\s*([A-D])/);
        const explicacionMatch = bloque.match(/EXPLICACION:\s*(.+?)(?=\nTIEMPO:|$)/s);
        const tiempoMatch = bloque.match(/TIEMPO:\s*(\d+)/);

        if (!preguntaMatch || !opcionA || !opcionB || !opcionC || !opcionD || !correctaMatch) {
          throw new Error("Missing required fields");
        }

        const correctaMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

        await supabase.from("quiz_preguntas").insert({
          sesion_id,
          pregunta: preguntaMatch[1].trim(),
          opciones: [opcionA[1].trim(), opcionB[1].trim(), opcionC[1].trim(), opcionD[1].trim()],
          respuesta_correcta: correctaMap[correctaMatch[1]],
          explicacion: explicacionMatch ? explicacionMatch[1].trim() : null,
          tiempo_limite: tiempoMatch ? Math.min(300, Math.max(10, parseInt(tiempoMatch[1]))) : 60,
        });

        resultados.importadas++;
      } catch (e) {
        resultados.errores.push({ bloque: i + 1, error: e.message });
      }
    }

    return new Response(JSON.stringify(resultados), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

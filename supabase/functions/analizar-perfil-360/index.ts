// Edge function: análisis psicopedagógico cualitativo del Perfil 360 vía Lovable AI Gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PerfilResumen {
  estudiante: { nombre?: string; apellidos?: string; edad_cronologica?: number | null };
  edadMental?: { valor: number; rango: string; factoresUsados: string[] } | null;
  rasgos: { nombre: string; valor: number; fuente: string }[];
  inteligenciasTop: { nombre: string; valor: number }[];
  dua: any;
  vocacional?: { codigo: string; top3: { nombre: string; valor: number }[]; carreras: string[] } | null;
  adaptaciones: { titulo: string; descripcion: string; prioridad: string }[];
  alertas: { tipo: string; nivel: string; mensaje: string }[];
  subescalas: { testNombre: string; subescalaNombre: string; porcentaje: number }[];
  testsCompletados: number;
  porcentajeCompletitud: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verificar JWT y rol admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: esAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!esAdmin) {
      return new Response(JSON.stringify({ error: "Solo administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as { perfil: PerfilResumen };
    const perfil = body.perfil;
    if (!perfil) {
      return new Response(JSON.stringify({ error: "Falta perfil" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const systemPrompt = `Eres un psicopedagogo experto en orientación vocacional, DUA (Diseño Universal para el Aprendizaje), psicometría adolescente y joven adulto. Analizas resultados de tests psicológicos para producir recomendaciones puntuales, accionables, basadas en evidencia y con tono empático profesional. Responde SIEMPRE en español neutro, sin tecnicismos innecesarios, dirigido a docentes y tutores.`;

    const userPrompt = `Analiza este perfil psicopedagógico de un estudiante preuniversitario y devuelve un análisis estructurado.

PERFIL:
${JSON.stringify(perfil, null, 2)}

Genera un análisis cualitativo que complemente los cálculos heurísticos.`;

    const tool = {
      type: "function",
      function: {
        name: "generar_analisis_psicopedagogico",
        description: "Devuelve un análisis cualitativo estructurado del perfil 360°",
        parameters: {
          type: "object",
          properties: {
            resumen_ejecutivo: { type: "string", description: "Síntesis 3-4 frases del perfil global" },
            justificacion_edad_mental: { type: "string", description: "Explicación cualitativa de la edad mental estimada y su coherencia con la edad cronológica" },
            fortalezas_clave: { type: "array", items: { type: "string" }, description: "3-5 fortalezas observadas" },
            areas_desarrollo: { type: "array", items: { type: "string" }, description: "3-5 áreas a fortalecer" },
            estilo_aprendizaje_detallado: { type: "string", description: "Descripción del estilo predominante y cómo capitalizarlo" },
            recomendaciones_dua: {
              type: "array",
              description: "Recomendaciones DUA puntuales y accionables (5-8)",
              items: {
                type: "object",
                properties: {
                  principio: { type: "string", enum: ["representacion", "accion_expresion", "motivacion"] },
                  titulo: { type: "string" },
                  accion_concreta: { type: "string" },
                  prioridad: { type: "string", enum: ["alta", "media", "baja"] },
                },
                required: ["principio", "titulo", "accion_concreta", "prioridad"],
                additionalProperties: false,
              },
            },
            orientacion_vocacional: { type: "string", description: "Comentario sobre afinidades y carreras compatibles" },
            alertas_psicopedagogicas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string" },
                  nivel: { type: "string", enum: ["alto", "medio", "bajo"] },
                  intervencion_sugerida: { type: "string" },
                },
                required: ["tipo", "nivel", "intervencion_sugerida"],
                additionalProperties: false,
              },
            },
            plan_30_dias: { type: "array", items: { type: "string" }, description: "5-7 acciones concretas para los próximos 30 días" },
          },
          required: [
            "resumen_ejecutivo",
            "fortalezas_clave",
            "areas_desarrollo",
            "estilo_aprendizaje_detallado",
            "recomendaciones_dua",
            "orientacion_vocacional",
            "plan_30_dias",
          ],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "generar_analisis_psicopedagogico" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso alcanzado. Intenta en unos minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos AI agotados. Recarga en Configuración → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("Sin tool_call en respuesta:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Respuesta IA inválida" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const analisis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analisis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analizar-perfil-360 error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

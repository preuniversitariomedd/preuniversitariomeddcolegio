import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Solo administradores pueden generar preguntas con IA");

    const { sesion_id, tema, cantidad, contexto } = await req.json();
    if (!sesion_id || !tema) throw new Error("Faltan parámetros: sesion_id y tema");

    const numPreguntas = Math.min(cantidad || 5, 10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const systemPrompt = `Eres un generador de preguntas de quiz educativo de alta calidad. Genera exactamente ${numPreguntas} preguntas de opción múltiple sobre el tema indicado. Las preguntas deben ser claras, precisas y apropiadas para estudiantes.`;

    const userPrompt = `Genera ${numPreguntas} preguntas de opción múltiple sobre: "${tema}"${contexto ? `\n\nContexto adicional: ${contexto}` : ""}

Cada pregunta debe tener exactamente 4 opciones (A, B, C, D).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generar_preguntas",
              description: "Genera preguntas de quiz con opciones múltiples",
              parameters: {
                type: "object",
                properties: {
                  preguntas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pregunta: { type: "string", description: "Texto de la pregunta" },
                        opciones: {
                          type: "array",
                          items: { type: "string" },
                          description: "Exactamente 4 opciones de respuesta",
                        },
                        respuesta_correcta: { type: "integer", description: "Índice de la respuesta correcta (0-3)" },
                        explicacion: { type: "string", description: "Explicación breve de por qué esa es la respuesta correcta" },
                      },
                      required: ["pregunta", "opciones", "respuesta_correcta", "explicacion"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["preguntas"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generar_preguntas" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados. Agrega fondos en Configuración." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Error al comunicarse con la IA");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("La IA no generó preguntas válidas");

    const parsed = JSON.parse(toolCall.function.arguments);
    const preguntas = parsed.preguntas;

    if (!preguntas?.length) throw new Error("No se generaron preguntas");

    // Insert into DB using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let insertadas = 0;
    for (const p of preguntas) {
      const opciones = (p.opciones || []).slice(0, 4);
      if (opciones.length < 2) continue;
      const correcta = Math.min(Math.max(p.respuesta_correcta || 0, 0), opciones.length - 1);

      const { error } = await supabaseAdmin.from("quiz_preguntas").insert({
        sesion_id,
        pregunta: p.pregunta,
        opciones,
        respuesta_correcta: correcta,
        explicacion: p.explicacion || null,
        tiempo_limite: 60,
      });
      if (!error) insertadas++;
    }

    return new Response(JSON.stringify({ insertadas, total: preguntas.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generar-quiz-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

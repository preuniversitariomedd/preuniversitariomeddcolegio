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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Solo administradores");

    const { preguntas } = await req.json();
    if (!preguntas?.length) throw new Error("No hay preguntas para revisar");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const letters = ["A", "B", "C", "D", "E"];
    const preguntasTexto = preguntas.map((p: any, i: number) => {
      const opcs = (p.opciones || []).map((o: string, j: number) => `  ${letters[j]}) ${o}`).join("\n");
      return `Pregunta ${i + 1}: ${p.pregunta}\n${opcs}\nRespuesta correcta: ${letters[p.respuesta_correcta]}\nExplicación: ${p.explicacion || "Sin explicación"}`;
    }).join("\n\n---\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un revisor experto de preguntas de quiz educativo. Analiza cada pregunta y evalúa:
1. Claridad: ¿La pregunta está bien redactada y es comprensible?
2. Correctitud: ¿La respuesta marcada como correcta es realmente correcta?
3. Opciones: ¿Los distractores son plausibles pero incorrectos? ¿Hay ambigüedades?
4. Explicación: ¿La explicación es adecuada?
5. Sugerencias de mejora si aplican.
Sé conciso y directo.`,
          },
          {
            role: "user",
            content: `Revisa las siguientes ${preguntas.length} preguntas de quiz:\n\n${preguntasTexto}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "revision_quiz",
              description: "Devuelve la revisión detallada de cada pregunta del quiz",
              parameters: {
                type: "object",
                properties: {
                  revisiones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        numero: { type: "integer", description: "Número de la pregunta (1-indexed)" },
                        calificacion: { type: "string", enum: ["excelente", "buena", "mejorable", "problematica"], description: "Calificación general" },
                        respuesta_correcta_ok: { type: "boolean", description: "Si la respuesta marcada como correcta es efectivamente correcta" },
                        observaciones: { type: "string", description: "Comentarios sobre claridad, redacción, opciones" },
                        sugerencia: { type: "string", description: "Sugerencia concreta de mejora, o vacío si no aplica" },
                      },
                      required: ["numero", "calificacion", "respuesta_correcta_ok", "observaciones", "sugerencia"],
                      additionalProperties: false,
                    },
                  },
                  resumen: { type: "string", description: "Resumen general del quiz en 1-2 oraciones" },
                },
                required: ["revisiones", "resumen"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "revision_quiz" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Error al comunicarse con la IA");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("La IA no generó una revisión válida");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("revisar-quiz-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

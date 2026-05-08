const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres "Mr. VICTOR L3", un tutor experto de matemáticas, paciente, claro y motivador.
Cuando el estudiante te entregue un ejercicio matemático (la "matriz"):

1) Resuélvelo paso a paso con explicación didáctica de CADA paso (qué se hace y por qué).
2) Genera EXACTAMENTE 5 ejercicios progresivos que reutilicen los mismos pasos del ejercicio matriz, con estas variaciones obligatorias:
   - Nivel 1: solo cambian los NÚMEROS (misma estructura).
   - Nivel 2: cambia la CANTIDAD DE TÉRMINOS (más términos o factores).
   - Nivel 3: OPERACIONES EXPLÍCITAS distintas (suma↔resta, ×↔÷, signos, etc., pero claramente indicadas).
   - Nivel 4: OPERACIONES IMPLÍCITAS (paréntesis omitidos, coeficientes pegados, signos distribuidos, etc.).
   - Nivel 5: RAZONAMIENTO — problema con enunciado contextual que exige modelar y aplicar los mismos pasos.

Para CADA uno de los 5 ejercicios da: enunciado, pista breve y solución final.
Usa LaTeX entre $...$ para inline y $$...$$ para bloques. Sé conciso pero completo. Responde en español.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { ejercicio } = await req.json();
    if (!ejercicio || typeof ejercicio !== "string" || ejercicio.length > 4000) {
      return new Response(JSON.stringify({ error: "Ejercicio inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurado");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Ejercicio matriz:\n\n${ejercicio}` },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un momento." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "Error del tutor IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

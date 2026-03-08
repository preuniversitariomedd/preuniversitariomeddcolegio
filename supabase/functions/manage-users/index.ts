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

  // Verify caller is admin
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

  const { action, ...payload } = await req.json();

  try {
    if (action === "crear") {
      const { cedula, nombre, apellidos, fecha_nacimiento, colegio } = payload;
      const email = `${cedula}@medd.local`;
      const password = "123*789*h";

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authError) throw authError;

      const userId = authUser.user.id;

      await supabase.from("profiles").insert({
        id: userId,
        cedula,
        nombre,
        apellidos,
        fecha_nacimiento: fecha_nacimiento || null,
        colegio: colegio || null,
        password_changed: false,
      });

      await supabase.from("user_roles").insert({
        user_id: userId,
        rol: "estudiante",
        activo: true,
      });

      return new Response(JSON.stringify({ success: true, user_id: userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "resetear") {
      const { user_id } = payload;
      const { data: profile } = await supabase.from("profiles").select("cedula").eq("id", user_id).single();
      if (!profile) throw new Error("User not found");

      const email = `${profile.cedula}@medd.local`;
      await supabase.auth.admin.updateUserById(user_id, { password: "123*789*h" });
      await supabase.from("profiles").update({ password_changed: false }).eq("id", user_id);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "eliminar") {
      const { user_id } = payload;
      await supabase.auth.admin.deleteUser(user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "toggle_activo") {
      const { user_id, activo } = payload;
      await supabase.from("user_roles").update({ activo }).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

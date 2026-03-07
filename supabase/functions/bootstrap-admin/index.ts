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

  // Check if admin already exists
  const { data: existing } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("rol", "admin")
    .limit(1);

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ message: "Admin already exists", exists: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create admin auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: "0930620109@medd.local",
    password: "L097480256p",
    email_confirm: true,
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = authUser.user.id;

  // Create profile
  await supabase.from("profiles").insert({
    id: userId,
    cedula: "0930620109",
    nombre: "Admin",
    apellidos: "MEDD",
    password_changed: true,
  });

  // Create role
  await supabase.from("user_roles").insert({
    user_id: userId,
    rol: "admin",
    activo: true,
  });

  return new Response(JSON.stringify({ success: true, user_id: userId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

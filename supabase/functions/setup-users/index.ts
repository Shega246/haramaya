import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupRequest {
  action: 'create_admin' | 'create_ticker';
  email: string;
  password: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { action, email, password } = await req.json() as SetupRequest;

    // Create user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) {
      // If user already exists, try to get their ID
      if (userError.message.includes('already') || userError.message.includes('exists')) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);
        
        if (existingUser) {
          // Add role if not exists
          const role = action === 'create_admin' ? 'admin' : 'ticker';
          await supabaseAdmin.from('user_roles').upsert({
            user_id: existingUser.id,
            role
          }, { onConflict: 'user_id,role' });

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `User already exists. ${role} role ensured.`,
              userId: existingUser.id 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      throw userError;
    }

    // Add role
    const role = action === 'create_admin' ? 'admin' : 'ticker';
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: userData.user.id,
      role
    });

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${role} user created successfully`,
        userId: userData.user.id,
        email
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

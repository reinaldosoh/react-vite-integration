import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data, error } = await supabase
    .from("intimacoes")
    .delete()
    .eq("user_id", "a70c71c7-a395-435f-9069-de72c065ca79")
    .select("id")

  return new Response(JSON.stringify({ deleted: data?.length ?? 0, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  })
})

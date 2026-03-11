import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Cliente } from "@/lib/agenda-utils";

export function useClientes() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["clientes"],
    queryFn: async (): Promise<Cliente[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user.id)
        .order("nome");
      if (error) throw error;
      return (data || []) as Cliente[];
    },
  });

  const criar = useMutation({
    mutationFn: async (c: Omit<Cliente, "id" | "user_id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("clientes").insert({ ...c, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...c }: Partial<Cliente> & { id: string }) => {
      const { error } = await supabase.from("clientes").update(c).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });

  return { ...query, clientes: query.data || [], criar, atualizar, excluir };
}

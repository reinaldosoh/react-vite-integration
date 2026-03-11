import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Compromisso } from "@/lib/agenda-utils";

export function useCompromissos(weekStart?: string, weekEnd?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["compromissos", weekStart, weekEnd],
    queryFn: async (): Promise<Compromisso[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      let q = supabase
        .from("compromissos")
        .select("*, clientes(id, nome)")
        .eq("user_id", user.id)
        .order("data")
        .order("hora_inicio");
      if (weekStart) q = q.gte("data", weekStart);
      if (weekEnd) q = q.lte("data", weekEnd);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        lembretes: d.lembretes || [],
        recorrente: d.recorrente || false,
        lembrete_ativo: d.lembrete_ativo ?? true,
        cliente: d.clientes || null,
      })) as Compromisso[];
    },
    enabled: !!weekStart && !!weekEnd,
  });

  const criar = useMutation({
    mutationFn: async (c: Omit<Compromisso, "id" | "user_id" | "created_at" | "updated_at" | "cliente">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("compromissos").insert({
        ...c,
        user_id: user.id,
        lembretes: c.lembretes as any,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compromissos"] }),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...c }: Partial<Compromisso> & { id: string }) => {
      const { cliente, ...rest } = c as any;
      const { error } = await supabase.from("compromissos").update({
        ...rest,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compromissos"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("compromissos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compromissos"] }),
  });

  return { ...query, compromissos: query.data || [], criar, atualizar, excluir };
}

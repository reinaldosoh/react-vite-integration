import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tarefa, Etiqueta, LogTarefa } from "./tipos_tarefas";

export function useTarefas() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["tarefas"],
    queryFn: async (): Promise<Tarefa[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("tarefas")
        .select("*, clientes(nome), equipes(nome), colaboradores(nome)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const tarefaIds = (data || []).map((t: any) => t.id);
      let etiquetasMap: Record<string, Etiqueta[]> = {};
      if (tarefaIds.length > 0) {
        const { data: te } = await supabase
          .from("tarefas_etiquetas")
          .select("tarefa_id, etiquetas_tarefas(*)")
          .in("tarefa_id", tarefaIds);
        (te || []).forEach((r: any) => {
          if (!etiquetasMap[r.tarefa_id]) etiquetasMap[r.tarefa_id] = [];
          if (r.etiquetas_tarefas) etiquetasMap[r.tarefa_id].push(r.etiquetas_tarefas);
        });
      }

      return (data || []).map((t: any) => ({
        ...t,
        cliente_nome: t.clientes?.nome || "",
        equipe_nome: t.equipes?.nome || "",
        responsavel_nome: t.colaboradores?.nome || "",
        etiquetas: etiquetasMap[t.id] || [],
      })) as Tarefa[];
    },
  });

  const salvar = useMutation({
    mutationFn: async ({ etiqueta_ids, ...t }: Partial<Tarefa> & { titulo: string; etiqueta_ids?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { cliente_nome, equipe_nome, responsavel_nome, etiquetas, ...clean } = t as any;

      let tarefaId = clean.id;
      if (tarefaId) {
        const { id, user_id, created_at, ...upd } = clean;
        const { error } = await supabase.from("tarefas").update({ ...upd, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("tarefas").insert({ ...clean, user_id: user.id }).select("id").single();
        if (error) throw error;
        tarefaId = data.id;
      }

      // Sync etiquetas
      if (etiqueta_ids !== undefined) {
        await supabase.from("tarefas_etiquetas").delete().eq("tarefa_id", tarefaId);
        if (etiqueta_ids.length > 0) {
          await supabase.from("tarefas_etiquetas").insert(
            etiqueta_ids.map(eid => ({ tarefa_id: tarefaId, etiqueta_id: eid, user_id: user.id }))
          );
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tarefas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });

  const alterarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const tarefa = query.data?.find(t => t.id === id);
      const { error } = await supabase.from("tarefas").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      // Log
      await supabase.from("logs_tarefas").insert({
        tarefa_id: id,
        user_id: user.id,
        campo: "status",
        valor_anterior: tarefa?.status || "",
        valor_novo: status,
        nome_usuario: user.email || "",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tarefas"] }),
  });

  return { ...query, tarefas: query.data || [], salvar, excluir, alterarStatus };
}

export function useEtiquetas() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["etiquetas_tarefas"],
    queryFn: async (): Promise<Etiqueta[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("etiquetas_tarefas").select("*").eq("user_id", user.id).order("nome");
      if (error) throw error;
      return (data || []) as Etiqueta[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (e: Partial<Etiqueta> & { nome: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      if (e.id) {
        const { id, user_id, created_at, ...rest } = e as any;
        const { error } = await supabase.from("etiquetas_tarefas").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("etiquetas_tarefas").insert({ nome: e.nome, cor: e.cor || "#3B82F6", user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etiquetas_tarefas"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("etiquetas_tarefas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etiquetas_tarefas"] }),
  });

  return { ...query, etiquetas: query.data || [], salvar, excluir };
}

export function useLogsTarefa(tarefaId?: string) {
  return useQuery({
    queryKey: ["logs_tarefas", tarefaId],
    enabled: !!tarefaId,
    queryFn: async (): Promise<LogTarefa[]> => {
      const { data, error } = await supabase
        .from("logs_tarefas")
        .select("*")
        .eq("tarefa_id", tarefaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LogTarefa[];
    },
  });
}

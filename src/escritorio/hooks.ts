import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FuncaoEscritorio, Colaborador, Equipe, EquipeColaborador } from "./tipos_escritorio";

// ─── Funções ──────────────────────────────────────────────────────────────────
export function useFuncoes() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["funcoes_escritorio"],
    queryFn: async (): Promise<FuncaoEscritorio[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("funcoes_escritorio").select("*").eq("user_id", user.id).order("nome");
      if (error) throw error;
      return (data || []) as FuncaoEscritorio[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (f: Partial<FuncaoEscritorio> & { nome: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      if (f.id) {
        const { id, user_id, created_at, ...rest } = f as any;
        const { error } = await supabase.from("funcoes_escritorio").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("funcoes_escritorio").insert({ nome: f.nome, salario_base: f.salario_base || 0, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funcoes_escritorio"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("funcoes_escritorio").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funcoes_escritorio"] }),
  });

  return { ...query, funcoes: query.data || [], salvar, excluir };
}

// ─── Colaboradores ────────────────────────────────────────────────────────────
export function useColaboradores() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async (): Promise<Colaborador[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("colaboradores").select("*, funcoes_escritorio(nome)").eq("user_id", user.id).order("nome");
      if (error) throw error;
      return (data || []).map((c: any) => ({ ...c, funcao_nome: c.funcoes_escritorio?.nome || "" })) as Colaborador[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (c: Partial<Colaborador> & { nome: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { funcao_nome, ...rest } = c as any;
      if (c.id) {
        const { id, user_id, created_at, ...upd } = rest;
        const { error } = await supabase.from("colaboradores").update({ ...upd, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("colaboradores").insert({ ...rest, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colaboradores"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colaboradores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colaboradores"] }),
  });

  return { ...query, colaboradores: query.data || [], salvar, excluir };
}

// ─── Equipes ──────────────────────────────────────────────────────────────────
export function useEquipes() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["equipes"],
    queryFn: async (): Promise<Equipe[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("equipes").select("*").eq("user_id", user.id).order("nome");
      if (error) throw error;
      return (data || []) as Equipe[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (e: Partial<Equipe> & { nome: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      if (e.id) {
        const { id, user_id, created_at, membros, ...rest } = e as any;
        const { error } = await supabase.from("equipes").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      } else {
        const { membros, ...rest } = e as any;
        const { error } = await supabase.from("equipes").insert({ ...rest, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipes"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipes"] }),
  });

  return { ...query, equipes: query.data || [], salvar, excluir };
}

// ─── Membros de equipe ────────────────────────────────────────────────────────
export function useEquipeMembros(equipeId?: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["equipes_colaboradores", equipeId],
    enabled: !!equipeId,
    queryFn: async (): Promise<EquipeColaborador[]> => {
      const { data, error } = await supabase.from("equipes_colaboradores").select("*").eq("equipe_id", equipeId!);
      if (error) throw error;
      return (data || []) as EquipeColaborador[];
    },
  });

  const adicionar = useMutation({
    mutationFn: async (colaboradorId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("equipes_colaboradores").insert({ equipe_id: equipeId!, colaborador_id: colaboradorId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipes_colaboradores", equipeId] }),
  });

  const remover = useMutation({
    mutationFn: async (colaboradorId: string) => {
      const { error } = await supabase.from("equipes_colaboradores").delete().eq("equipe_id", equipeId!).eq("colaborador_id", colaboradorId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipes_colaboradores", equipeId] }),
  });

  return { ...query, membros: query.data || [], adicionar, remover };
}

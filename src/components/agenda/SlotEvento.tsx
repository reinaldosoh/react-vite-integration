import { getCategoria, type Compromisso } from "@/lib/agenda-utils";

interface Props {
  compromisso: Compromisso;
  onClick: (c: Compromisso) => void;
}

export default function SlotEvento({ compromisso, onClick }: Props) {
  const cat = getCategoria(compromisso.categoria);
  const inicio = compromisso.hora_inicio.slice(0, 5);
  const fim = compromisso.hora_fim.slice(0, 5);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(compromisso); }}
      className={`w-full text-left rounded-xl px-2.5 py-1.5 border-l-[3px] text-xs transition hover:opacity-80 active:scale-[0.97] truncate ${cat.bg}`}
      style={{ borderLeftColor: `var(--tw-${cat.dot})` }}
      title={compromisso.titulo}
    >
      <span className="font-semibold truncate block">{compromisso.titulo}</span>
      <span className="opacity-70">{inicio}–{fim}</span>
      {compromisso.cliente && <span className="opacity-60 ml-1">· {compromisso.cliente.nome}</span>}
    </button>
  );
}

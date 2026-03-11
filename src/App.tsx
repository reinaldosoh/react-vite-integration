import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import {
  fetchTodasIntimacoes,
  iniciarBusca,
  fetchStatus,
  sincronizarTodasRemoto,
  deletarIntimacao,
  type Intimacao,
} from "./lib/api";
import CronPage from "./pages/CronPage";
import DatePicker from "./components/DatePicker";

// ─── Helpers de leitura/não-lida (localStorage) ───────────────────────────────
function getChave(i: Intimacao) {
  return `${i.numero_processo || ""}|${i.tribunal || ""}|${i.data_disponibilizacao || ""}`;
}
function isVista(i: Intimacao) {
  return localStorage.getItem("jr_" + getChave(i)) === "1";
}
function marcarVista(i: Intimacao) {
  localStorage.setItem("jr_" + getChave(i), "1");
}

function toSortDate(d?: string) {
  if (!d) return "";
  const p = d.split("/");
  return p.length === 3 ? p[2] + p[1] + p[0] : d;
}

type FiltroTab = "todas" | "novas" | "visualizadas";
type MainView = "home" | "detalhe" | "cron";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onHide }: { msg: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, [onHide]);
  return (
    <div className="fixed top-4 left-4 right-4 z-[60] toast-anim flex justify-center">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm max-w-sm w-full">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="flex-1">{msg}</span>
      </div>
    </div>
  );
}

// ─── Modal de confirmação ─────────────────────────────────────────────────────
function ModalConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-sm w-full overflow-hidden slide-up md:mx-4" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="bg-red-50 px-6 pt-6 pb-4 flex flex-col items-center text-center">
          <div className="bg-red-100 rounded-full p-3 mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">Excluir consulta?</h3>
          <p className="text-sm text-gray-500">Todas as intimações desta consulta serão removidas.</p>
        </div>
        <div className="px-6 py-4 flex gap-3 justify-center">
          <button onClick={onCancel} className="flex-1 px-5 py-3 rounded-xl border text-gray-600 hover:bg-gray-50 text-sm font-medium transition active:scale-95">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition active:scale-95">Excluir</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal zero resultados ────────────────────────────────────────────────────
function ModalZeroResultados({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-sm w-full overflow-hidden slide-up md:mx-4" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
          <div className="bg-amber-50 rounded-full p-4 mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">Nenhuma intimação nova encontrada</h3>
          <p className="text-sm text-gray-500">Todas as intimações encontradas já existem no sistema.</p>
        </div>
        <div className="px-6 py-4 flex justify-center">
          <button onClick={onClose} className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl text-sm font-medium transition active:scale-95">Entendi</button>
        </div>
      </div>
    </div>
  );
}

// ─── Painel de busca (fullscreen no mobile) ──────────────────────────────────
function PainelBusca({ onClose, onBuscar, loading }: { onClose: () => void; onBuscar: (oab: string, uf: string, inicio: string, fim: string) => void; loading: boolean }) {
  const [oab, setOab] = useState("");
  const [uf, setUf] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!oab || !inicio || !fim) return;
    onBuscar(oab.trim(), uf.trim().toUpperCase(), inicio, fim);
  }

  return (
    <>
      {/* Mobile: fullscreen overlay */}
      <div className="md:hidden fixed inset-0 z-40 bg-white flex flex-col slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-base font-bold text-gray-900">Nova Consulta</h2>
          <button onClick={onClose} className="p-2 -m-2 hover:bg-gray-100 rounded-xl active:scale-95">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">N. da OAB</label>
            <input
              type="text" required placeholder="Digite a OAB" autoComplete="off" value={oab} onChange={(e) => setOab(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">UF da OAB</label>
            <input
              type="text" maxLength={2} placeholder="Ex: SP" autoComplete="off" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none uppercase"
            />
          </div>
          <DatePicker label="Data Início" value={inicio} onChange={setInicio} required placeholder="Selecione" />
          <DatePicker label="Data Fim" value={fim} onChange={setFim} required placeholder="Selecione" />
        </form>
        <div className="px-4 py-4 border-t" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          <button
            type="button"
            onClick={(e) => { const form = (e.target as HTMLElement).closest('.fixed')?.querySelector('form'); form?.requestSubmit(); }}
            disabled={loading || !oab || !inicio || !fim}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading ? "Buscando..." : "Buscar Intimações"}
          </button>
        </div>
      </div>

      {/* Desktop: inline panel */}
      <div className="hidden md:block mb-6 fade-in">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Nova Consulta</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={submit} className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-gray-500 mb-1">N. da OAB</label>
              <input type="text" required placeholder="Digite a OAB" autoComplete="off" value={oab} onChange={(e) => setOab(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none font-semibold" />
            </div>
            <div className="min-w-[80px] max-w-[100px]">
              <label className="block text-xs text-gray-500 mb-1">UF da OAB</label>
              <input type="text" maxLength={2} placeholder="Ex: SP" autoComplete="off" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none uppercase" />
            </div>
            <DatePicker label="Data Início" value={inicio} onChange={setInicio} required minWidth="140px" placeholder="Selecione" />
            <DatePicker label="Data Fim" value={fim} onChange={setFim} required minWidth="140px" placeholder="Selecione" />
            <button type="submit" disabled={loading}
              className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingBusca({ log }: { log: string }) {
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);
  return (
    <div className="mb-4 mx-0">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-5 h-5 text-blue-600 spinner flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h3 className="text-sm font-semibold text-blue-900 loading-dots">Buscando nos tribunais</h3>
        </div>
        <p className="text-blue-700 text-xs mb-3">Rastreando intimações. Isso pode levar alguns instantes.</p>
        <details className="text-xs">
          <summary className="text-blue-400 cursor-pointer hover:text-blue-600">Log técnico</summary>
          <div ref={logRef} className="log-box bg-white border rounded-lg p-2 mt-2 text-gray-600">{log}</div>
        </details>
      </div>
    </div>
  );
}

// ─── Erro ─────────────────────────────────────────────────────────────────────
function ErroBusca({ msg }: { msg: string }) {
  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-red-800">Erro na busca</p>
          <p className="text-red-600 text-xs mt-0.5">{msg}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Agrupamentos ─────────────────────────────────────────────────────────────
function agruparPorOAB(ints: Intimacao[]): [string, Intimacao[]][] {
  const g: Record<string, Intimacao[]> = {};
  ints.forEach((i) => { const oab = i.oab || "Desconhecida"; if (!g[oab]) g[oab] = []; g[oab].push(i); });
  return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
}

function processosDeOAB(ints: Intimacao[]): [string, Intimacao[]][] {
  const g: Record<string, Intimacao[]> = {};
  ints.forEach((i) => { const k = i.numero_processo || "desconhecido"; if (!g[k]) g[k] = []; g[k].push(i); });
  Object.values(g).forEach((arr) => arr.sort((a, b) => toSortDate(b.data_disponibilizacao).localeCompare(toSortDate(a.data_disponibilizacao))));
  return Object.entries(g).sort((a, b) => toSortDate(b[1][0].data_disponibilizacao).localeCompare(toSortDate(a[1][0].data_disponibilizacao)));
}

// ─── Tela Home (lista de intimações) ─────────────────────────────────────────
function TelaHome({ intimacoes, onVerDetalhe }: { intimacoes: Intimacao[]; onVerDetalhe: (proc: string) => void }) {
  const [filtroTab, setFiltroTab] = useState<FiltroTab>("todas");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [, forceUpdate] = useState(0);

  let filtered = [...intimacoes];
  if (filtroTab === "novas") filtered = filtered.filter((i) => !isVista(i));
  if (filtroTab === "visualizadas") filtered = filtered.filter((i) => isVista(i));
  if (filtroTexto) {
    const q = filtroTexto.toLowerCase();
    filtered = filtered.filter((i) =>
      [i.numero_processo, i.orgao, i.tribunal, i.tipo_comunicacao, i.inteiro_teor, i.oab, ...(i.partes || []), ...(i.advogados || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }

  const totalNovas = intimacoes.filter((i) => !isVista(i)).length;
  const totalVistas = intimacoes.filter((i) => isVista(i)).length;
  const oabGroups = agruparPorOAB(filtered);
  const totalProcs = oabGroups.reduce((s, [, ints]) => s + processosDeOAB(ints).length, 0);

  function handleVerDetalhe(proc: string) {
    const ints = intimacoes.filter((i) => i.numero_processo === proc);
    ints.forEach((i) => marcarVista(i));
    forceUpdate((n) => n + 1);
    onVerDetalhe(proc);
  }

  const tabData: { key: FiltroTab; label: string; count: number; color: string }[] = [
    { key: "todas", label: "Todas", count: intimacoes.length, color: "bg-gray-100 text-gray-600" },
    { key: "novas", label: "Novas", count: totalNovas, color: "bg-blue-100 text-blue-700" },
    { key: "visualizadas", label: "Vistas", count: totalVistas, color: "bg-gray-100 text-gray-500" },
  ];

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {tabData.map((t) => (
          <button
            key={t.key}
            onClick={() => setFiltroTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition active:scale-95 ${
              filtroTab === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              filtroTab === t.key ? "bg-white/20 text-white" : t.color
            }`}>{t.count}</span>
          </button>
        ))}
        <button onClick={() => setShowSearch(!showSearch)} className="ml-auto p-2 rounded-xl hover:bg-gray-100 active:scale-95 flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="mb-4 fade-in">
          <input
            type="text" placeholder="Buscar por processo, parte, órgão..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} autoFocus
            className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-gray-400 mb-3 px-1">
        {oabGroups.length} OAB(s) · {totalProcs} processo(s) · {filtered.length} intimação(ões)
      </p>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-14 h-14 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-sm">Nenhuma intimação encontrada</p>
          <p className="text-xs mt-1">Toque em "+" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {oabGroups.map(([oab, oabInts]) => {
            const procs = processosDeOAB(oabInts);
            const novasOab = oabInts.filter((i) => !isVista(i)).length;
            return (
              <div key={oab} className="fade-in">
                {/* OAB group header */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[10px]">OAB</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{oab}</h3>
                    <p className="text-[11px] text-gray-400">{procs.length} proc. · {oabInts.length} int.</p>
                  </div>
                  {novasOab > 0 && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-200 flex-shrink-0">
                      {novasOab} nova(s)
                    </span>
                  )}
                </div>

                {/* Card list (mobile) */}
                <div className="md:hidden space-y-2">
                  {procs.map(([proc, ints]) => {
                    const r = ints[0];
                    const allVistas = ints.every((i) => isVista(i));
                    return (
                      <button
                        key={proc}
                        onClick={() => handleVerDetalhe(proc)}
                        className={`w-full bg-white rounded-xl border p-4 text-left active:scale-[0.98] transition ${!allVistas ? 'border-l-[3px] border-l-blue-500' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${allVistas ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}>{proc}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {r.tribunal && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{r.tribunal}</span>}
                              <span className="text-[11px] text-gray-400">{r.data_disponibilizacao || ""}</span>
                              {ints.length > 1 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{ints.length} int.</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {!allVistas && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Table (desktop) */}
                <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/80">
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide w-8">#</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Processo</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Tribunal</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Órgão</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Data</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide w-24">Status</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {procs.map(([proc, ints], idx) => {
                        const r = ints[0];
                        const allVistas = ints.every((i) => isVista(i));
                        return (
                          <tr key={proc} onClick={() => handleVerDetalhe(proc)} className={`border-b last:border-0 hover:bg-gray-50 cursor-pointer transition group ${allVistas ? "" : "row-new"}`}>
                            <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className={`text-sm ${allVistas ? "text-gray-500" : "text-gray-900 font-semibold"}`}>{proc}</span>
                              {ints.length > 1 && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{ints.length} int.</span>}
                            </td>
                            <td className="px-4 py-3">{r.tribunal && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{r.tribunal}</span>}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[180px] hidden lg:table-cell">{r.orgao || ""}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{r.data_disponibilizacao || ""}</td>
                            <td className="px-4 py-3">
                              {allVistas
                                ? <span className="text-[10px] text-gray-400">Visualizado</span>
                                : <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-200">Novo</span>}
                            </td>
                            <td className="px-4 py-3">
                              <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Tela Detalhe ─────────────────────────────────────────────────────────────
function TelaDetalhe({ proc, intimacoes, onVoltar, onDeletar, showToast }: { proc: string; intimacoes: Intimacao[]; onVoltar: () => void; onDeletar: (intimacao: Intimacao) => void; showToast: (msg: string) => void }) {
  const [subIdx, setSubIdx] = useState(0);
  const [confirmDel, setConfirmDel] = useState<Intimacao | null>(null);

  const ints = intimacoes
    .filter((i) => i.numero_processo === proc)
    .sort((a, b) => toSortDate(b.data_disponibilizacao).localeCompare(toSortDate(a.data_disponibilizacao)));

  const int = ints[subIdx] || ints[0];
  if (!int) return null;

  async function copiarTexto(text: string) {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement("textarea"); el.value = text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
    }
    showToast("Copiado!");
  }

  return (
    <div className="fade-in">
      {/* Back button */}
      <button onClick={onVoltar} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition mb-4 py-1 active:scale-95">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Processo</p>
          <h2 className="text-base md:text-lg font-bold text-gray-900 break-all">{int.numero_processo || "N/A"}</h2>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {int.tribunal && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{int.tribunal}</span>}
            <button onClick={() => copiarTexto(int.inteiro_teor || "")}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 active:scale-95">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </button>
            {int.id && (
              <button onClick={() => setConfirmDel(int)}
                className="text-xs bg-white border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 active:scale-95">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        {ints.length > 1 && (
          <div className="flex gap-1.5 px-4 py-3 bg-gray-50 border-b overflow-x-auto no-scrollbar">
            {ints.map((si, i) => (
              <button key={i} onClick={() => setSubIdx(i)}
                className={`text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap active:scale-95 ${i === subIdx ? "bg-gray-900 text-white" : "bg-white border text-gray-500"}`}>
                {si.data_disponibilizacao || `#${i + 1}`}
                {si.tribunal ? ` · ${si.tribunal}` : ""}
              </button>
            ))}
          </div>
        )}

        {/* Metadados */}
        <div className="px-4 py-3 border-b bg-gray-50/50 space-y-1">
          {[
            int.orgao && { l: "Órgão", v: int.orgao },
            int.data_disponibilizacao && { l: "Data", v: int.data_disponibilizacao },
            int.tipo_comunicacao && { l: "Tipo", v: int.tipo_comunicacao },
            int.meio && { l: "Meio", v: int.meio },
            int.oab && { l: "OAB", v: int.oab },
          ].filter(Boolean).map((item, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-gray-500 font-semibold w-14 flex-shrink-0">{(item as { l: string; v: string }).l}</span>
              <span className="text-gray-700">{(item as { l: string; v: string }).v}</span>
            </div>
          ))}
        </div>

        {/* Participantes */}
        {((int.partes?.length ?? 0) > 0 || (int.advogados?.length ?? 0) > 0) && (
          <div className="px-4 py-3 border-b">
            <details className="border rounded-xl overflow-hidden">
              <summary className="px-4 py-3 bg-gray-50 cursor-pointer text-sm font-medium text-gray-600 flex items-center justify-between active:bg-gray-100">
                <span>Participantes</span>
                <span className="text-xs text-gray-400">{(int.partes?.length || 0) + (int.advogados?.length || 0)}</span>
              </summary>
              <div className="p-4 space-y-4 text-sm">
                {int.partes && int.partes.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase mb-1.5 tracking-wide">Partes</p>
                    {int.partes.map((p, i) => <p key={i} className="text-gray-700 py-0.5 text-sm">{p}</p>)}
                  </div>
                )}
                {int.advogados && int.advogados.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase mb-1.5 tracking-wide">Advogados</p>
                    {int.advogados.map((a, i) => <p key={i} className="text-gray-700 py-0.5 text-sm">{a}</p>)}
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Inteiro Teor */}
        <div className="px-4 py-4">
          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Conteúdo da Intimação</h4>
          <div className="inteiro-teor-text bg-gray-50 rounded-xl p-4 text-gray-800 text-sm border">{int.inteiro_teor || <span className="text-gray-400 italic">Conteúdo não disponível</span>}</div>
        </div>
      </div>

      {confirmDel && <ModalConfirm onConfirm={() => { onDeletar(confirmDel); setConfirmDel(null); }} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

// ─── App Principal ────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [intimacoes, setIntimacoesState] = useState<Intimacao[]>([]);
  const [view, setView] = useState<MainView>("home");
  const [procSelecionado, setProcSelecionado] = useState("");
  const [showBusca, setShowBusca] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logBusca, setLogBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [zeroResultados, setZeroResultados] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleLogout() { await supabase.auth.signOut(); navigate("/login"); }

  useEffect(() => { carregarTodas(); }, []);

  async function carregarTodas() {
    try { const data = await fetchTodasIntimacoes(); setIntimacoesState(data); } catch (e) { console.error("Erro ao carregar intimações:", e); }
  }

  const pollStatus = useCallback(async () => {
    try {
      const status = await fetchStatus();
      setLogBusca(status.log || "");
      if (!status.rodando) {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        setLoading(false);
        if (status.erro) { setErro(status.erro); }
        else {
          try {
            const sync = await sincronizarTodasRemoto();
            await carregarTodas();
            if (sync.novas > 0) showToast(`${sync.novas} nova(s) intimação(ões)! ${sync.duplicadas} já existia(m).`);
            else if (sync.duplicadas > 0) showToast(`Todas as ${sync.duplicadas} intimação(ões) já existem.`);
            else setZeroResultados(true);
          } catch { await carregarTodas(); setZeroResultados(true); }
        }
      }
    } catch { /* ignora erros de polling */ }
  }, []);

  async function handleBuscar(oab: string, uf: string, inicio: string, fim: string) {
    setShowBusca(false); setLoading(true); setErro(null); setLogBusca("Iniciando...\n");
    try {
      const data = await iniciarBusca({ oab, uf_oab: uf, data_inicio: inicio, data_fim: fim });
      if (data.erro) { setErro(data.erro); setLoading(false); return; }
      pollingRef.current = setInterval(pollStatus, 1500);
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : "Erro desconhecido"); setLoading(false); }
  }

  async function handleDeletar(intimacao: Intimacao) {
    if (!intimacao.id) return;
    try {
      const data = await deletarIntimacao(intimacao.id);
      if (!data.ok) { showToast("Erro: " + (data.erro || "falha")); return; }
      setIntimacoesState((prev) => prev.filter((i) => i.id !== intimacao.id));
      setView("home"); showToast("Intimação excluída");
    } catch (e: unknown) { showToast("Erro: " + (e instanceof Error ? e.message : "desconhecido")); }
  }

  function showToast(msg: string) { setToast(msg); }

  const totalNovas = intimacoes.filter((i) => !isVista(i)).length;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header (desktop) */}
      <header className="bg-white border-b sticky top-0 z-30 hidden md:block">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setView("home"); setShowBusca(false); }}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">JurisRapido</span>
          </div>
          <nav className="flex items-center gap-1">
            <button onClick={() => { setView("home"); setShowBusca(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${view !== "cron" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Intimações
            </button>
            <button onClick={() => setView("cron")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${view === "cron" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Alertas
            </button>
          </nav>
          <div className="flex items-center gap-2">
            {view !== "cron" && (
              <button onClick={() => setShowBusca((v) => !v)}
                className="bg-black text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Nova Busca
              </button>
            )}
            <button onClick={handleLogout}
              className="border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden bg-white border-b sticky top-0 z-30">
        <div className="px-4 h-12 flex items-center justify-between" style={{ paddingTop: 'var(--safe-top)' }}>
          <div className="flex items-center gap-2" onClick={() => { setView("home"); setShowBusca(false); }}>
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">J</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">JurisRapido</span>
          </div>
          <div className="flex items-center gap-1">
            {view !== "cron" && (
              <button onClick={() => setShowBusca(true)} className="p-2 rounded-xl bg-gray-900 text-white active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <button onClick={handleLogout} className="p-2 rounded-xl text-gray-400 active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && <Toast msg={toast} onHide={() => setToast(null)} />}

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-4 md:py-6 pb-24 md:pb-6">
        {view === "cron" ? (
          <CronPage />
        ) : (
          <>
            {showBusca && <PainelBusca onClose={() => setShowBusca(false)} onBuscar={handleBuscar} loading={loading} />}
            {loading && <LoadingBusca log={logBusca} />}
            {erro && !loading && <ErroBusca msg={erro} />}
            {zeroResultados && <ModalZeroResultados onClose={() => setZeroResultados(false)} />}
            {view === "home" ? (
              <TelaHome intimacoes={intimacoes} onVerDetalhe={(proc) => { setProcSelecionado(proc); setView("detalhe"); }} />
            ) : (
              <TelaDetalhe proc={procSelecionado} intimacoes={intimacoes} onVoltar={() => setView("home")} onDeletar={handleDeletar} showToast={showToast} />
            )}
          </>
        )}
      </main>

      {/* Bottom Tab Bar (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => { setView("home"); setShowBusca(false); }}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition active:scale-95 ${view !== "cron" ? "text-gray-900" : "text-gray-400"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-medium">Intimações</span>
            {totalNovas > 0 && view !== "cron" && (
              <span className="absolute top-1.5 ml-8 w-4 h-4 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {totalNovas > 9 ? "9+" : totalNovas}
              </span>
            )}
          </button>
          <button
            onClick={() => setView("cron")}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition active:scale-95 ${view === "cron" ? "text-gray-900" : "text-gray-400"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-medium">Alertas</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-gray-400 transition active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] font-medium">Sair</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

import { useState } from "react";
import { AbaFuncoes } from "@/escritorio/aba_funcoes";
import { AbaColaboradores } from "@/escritorio/aba_colaboradores";
import { AbaEquipes } from "@/escritorio/aba_equipes";

const TABS = [
  { value: "funcoes", label: "Funções", icon: "M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { value: "colaboradores", label: "Colaboradores", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { value: "equipes", label: "Equipes", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
];

export default function EscritorioPage() {
  const [activeTab, setActiveTab] = useState("funcoes");

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Escritório</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie a equipe do seu escritório</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((t) => {
            const active = activeTab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setActiveTab(t.value)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
                </svg>
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === "funcoes" && <AbaFuncoes />}
      {activeTab === "colaboradores" && <AbaColaboradores />}
      {activeTab === "equipes" && <AbaEquipes />}
    </div>
  );
}

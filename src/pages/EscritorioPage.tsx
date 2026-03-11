import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AbaFuncoes } from "@/escritorio/aba_funcoes";
import { AbaColaboradores } from "@/escritorio/aba_colaboradores";
import { AbaEquipes } from "@/escritorio/aba_equipes";

export default function EscritorioPage() {
  return (
    <div className="fade-in">
      <Tabs defaultValue="funcoes" className="w-full">
        <TabsList className="w-full justify-start bg-transparent gap-1 p-0 h-auto mb-4">
          {[
            { value: "funcoes", label: "Funções" },
            { value: "colaboradores", label: "Colaboradores" },
            { value: "equipes", label: "Equipes" },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="px-4 py-2 rounded-xl text-sm font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-500 data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="funcoes"><AbaFuncoes /></TabsContent>
        <TabsContent value="colaboradores"><AbaColaboradores /></TabsContent>
        <TabsContent value="equipes"><AbaEquipes /></TabsContent>
      </Tabs>
    </div>
  );
}

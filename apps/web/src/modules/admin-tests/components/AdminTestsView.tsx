import type { ReactElement } from "react";

export const AdminTestsView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Testes e Validacao</h2>
          <p className="text-stone-500 text-lg font-normal">Executa verificacoes de UI e integracao para garantir funcionamento.</p>
        </div>
        <button className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2" type="button" data-run-tests>
          <span className="material-symbols-outlined text-lg">playlist_play</span>
          Executar testes
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Passaram</p>
          <p className="text-3xl font-bold text-forest mt-2" data-tests-count-pass>0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Avisos</p>
          <p className="text-3xl font-bold text-forest mt-2" data-tests-count-warn>0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Falhas</p>
          <p className="text-3xl font-bold text-forest mt-2" data-tests-count-fail>0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold">Ignorados</p>
          <p className="text-3xl font-bold text-forest mt-2" data-tests-count-skip>0</p>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-stone-100">
          <h3 className="text-base font-semibold text-forest">Resultados</h3>
          <span className="text-xs text-stone-500" data-tests-last-run>Ultima execucao: -</span>
        </div>
        <div className="divide-y" data-tests-results>
          <div className="p-4 text-sm text-stone-500">Nenhuma execucao ainda.</div>
        </div>
      </section>

      <section className="bg-[#f6f8f6] rounded-xl border border-[#cfe7d1] p-4 text-sm text-forest">
        <p className="font-semibold mb-1">Observacoes</p>
        <p>Testes de API exigem usuario autenticado. Em ambiente local, os testes de gravacao criam dados temporarios e removem em seguida.</p>
      </section>
    </div>

    </>
  );
};

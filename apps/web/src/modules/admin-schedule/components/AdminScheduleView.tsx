import type { ReactElement } from "react";

export const AdminScheduleView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-col gap-1">
                  <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Agenda de Atendimentos</h2>
              </div>
              <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#e7f3eb] text-forest-green hover:bg-[#d5e9db] transition-colors">
                      Sincronizar Trinx
                  </button>
                  <button className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">add</span>
                      Novo agendamento
                  </button>
              </div>
          </header>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-forest">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Unidade</label>
                      <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors" data-appointments-unit-filter>
                          <option>Parque da Cidade</option>
                          <option>Birmann 20</option>
                      </select>
                  </div>
                  <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Profissional</label>
                      <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-sm cursor-pointer hover:bg-white transition-colors" data-appointments-professional-filter>
                          <option>Todos</option>
                          <option>Joana Ribeiro</option>
                          <option>Marcos Lima</option>
                      </select>
                  </div>
                  <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wider text-text-muted font-semibold">Data</label>
                      <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body" type="date" data-appointments-date-filter />
                  </div>
              </div>
          </section>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-forest">Agendamentos do dia</h3>
                  <span className="text-xs text-text-muted">Atualizado em tempo real</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#cfe7d1]">
                  <table className="min-w-full divide-y divide-[#cfe7d1]">
                      <thead className="bg-forest">
                          <tr>
                              <th className="table-head-cell text-left text-white" scope="col">Data/Hora</th>
                              <th className="table-head-cell text-left text-white" scope="col">Status</th>
                              <th className="table-head-cell text-left text-white" scope="col">Servico</th>
                              <th className="table-head-cell text-left text-white" scope="col">Cliente</th>
                              <th className="table-head-cell text-left text-white" scope="col">Profissional</th>
                              <th className="table-head-cell text-left text-white" scope="col">Unidade</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#f4f0e7]" data-appointments-table-body>
                          <tr>
                              <td className="table-cell" colSpan={6}>Carregando agenda...</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </section>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-forest">Escalas dos Profissionais</h3>
                  <button className="px-4 py-2.5 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-xs" type="button" data-shifts-refresh>
                      Atualizar escalas
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg text-sm" data-shifts-unit-filter>
                      <option value="">Todas as unidades</option>
                  </select>
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green text-sm" type="date" data-shifts-date-filter />
                  <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg text-sm" data-shifts-professional-filter>
                      <option value="">Todos profissionais</option>
                  </select>
              </div>
              <form className="grid grid-cols-1 lg:grid-cols-6 gap-3" data-shift-form>
                  <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg text-sm lg:col-span-2" data-shift-professional>
                      <option value="">Selecione o profissional</option>
                  </select>
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green text-sm" type="date" data-shift-date required />
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green text-sm" type="time" data-shift-hour-start required />
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green text-sm" type="time" data-shift-hour-finish required />
                  <button className="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm" type="submit">
                      Salvar escala
                  </button>
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green text-sm lg:col-span-6" type="text" placeholder="Observação (opcional)" data-shift-notes />
              </form>
              <div className="overflow-x-auto rounded-xl border border-[#cfe7d1]">
                  <table className="min-w-full divide-y divide-[#cfe7d1]">
                      <thead className="bg-forest">
                          <tr>
                              <th className="table-head-cell text-left text-white" scope="col">Data</th>
                              <th className="table-head-cell text-left text-white" scope="col">Unidade</th>
                              <th className="table-head-cell text-left text-white" scope="col">Profissional</th>
                              <th className="table-head-cell text-left text-white" scope="col">Inicio</th>
                              <th className="table-head-cell text-left text-white" scope="col">Fim</th>
                              <th className="table-head-cell text-left text-white" scope="col">Status</th>
                              <th className="table-head-cell text-left text-white" scope="col">Acoes</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#f4f0e7]" data-shifts-table-body>
                          <tr>
                              <td className="table-cell" colSpan={7}>Carregando escalas...</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </section>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-forest">Serviços por Profissional e Unidade</h3>
                  <span className="text-xs text-text-muted" data-prof-services-feedback>Selecione um profissional.</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg text-sm" data-prof-services-professional>
                      <option value="">Selecione o profissional</option>
                  </select>
                  <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg text-sm" data-prof-services-unit>
                      <option value="">Selecione a unidade</option>
                  </select>
                  <button className="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors text-sm" type="button" data-prof-services-save>
                      Salvar vínculos
                  </button>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-[#cfe7d1] bg-[#f6f8f6] p-4 grid grid-cols-1 md:grid-cols-2 gap-2" data-prof-services-list>
                  <p className="text-sm text-text-muted">Selecione um profissional para carregar os serviços.</p>
              </div>
          </section>
      </div>

    </>
  );
};

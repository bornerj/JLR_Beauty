import type { ReactElement } from "react";

export const AdminWhatsappContactsView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-col gap-1">
                  <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Contatos WhatsApp</h2>
                  <p className="text-stone-500 text-lg font-normal">Auditoria dos atendimentos e agendamentos do concierge.</p>
              </div>
          </header>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-forest">Fluxo de servicos no WhatsApp</h3>
                      <p className="text-xs text-text-muted">Controle como o bot apresenta os servicos para clientes no celular.</p>
                  </div>
                  <label className="inline-flex items-center gap-3 text-sm text-forest-green font-medium cursor-pointer select-none">
                      <input className="h-4 w-4 rounded border-[#cfe7d1] text-primary focus:ring-primary" type="checkbox" data-concierge-category-first-toggle />
                      Mostrar categorias primeiro
                  </label>
              </div>
              <p className="text-xs text-text-muted" data-concierge-category-first-status>Carregando configuracao...</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Saudacao inicial</label>
                      <textarea className="w-full min-h-[84px] border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" placeholder="Seja bem vinda. Qual tratamento deseja fazer hoje?" data-concierge-opening-greeting></textarea>
                      <p className="text-[11px] text-text-muted">O bot sempre prefixa com Bom Dia, Boa Tarde ou Boa Noite.</p>
                  </div>
                  <div className="flex flex-col gap-1">
                      <label className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">Saudacao de conclusao</label>
                      <textarea className="w-full min-h-[84px] border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" placeholder="Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida." data-concierge-completion-greeting></textarea>
                      <p className="text-[11px] text-text-muted">Mensagem enviada ao final do agendamento no WhatsApp.</p>
                  </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button className="px-4 py-2.5 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors text-sm font-medium" type="button" data-concierge-greetings-save>
                      Salvar saudacoes
                  </button>
                  <p className="text-xs text-text-muted" data-concierge-greetings-status>Carregando saudacoes...</p>
              </div>
          </section>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green" type="text" placeholder="Buscar nome, telefone, servico, unidade..." data-concierge-search />
                  <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg" data-concierge-status-filter>
                      <option value="">Todos os status</option>
                      <option value="ACTIVE">Ativo</option>
                      <option value="COMPLETED">Concluido</option>
                      <option value="CANCELLED">Cancelado</option>
                  </select>
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green" type="date" data-concierge-from />
                  <input className="w-full border border-[#cfe7d1] rounded-lg px-4 py-2.5 bg-[#f6f8f6] text-forest-green" type="date" data-concierge-to />
                  <button className="px-4 py-2.5 rounded-lg border border-[#cfe7d1] bg-white text-forest-green hover:bg-[#f6f8f6] transition-colors" type="button" data-concierge-refresh>
                      Atualizar
                  </button>
              </div>
          </section>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-forest">Registros de contato</h3>
                  <span className="text-xs text-text-muted" data-concierge-count>0 registros</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#cfe7d1]">
                  <table className="min-w-full divide-y divide-[#cfe7d1]">
                      <thead className="bg-forest">
                          <tr>
                              <th className="table-head-cell text-left text-white" scope="col">Contato em</th>
                              <th className="table-head-cell text-left text-white" scope="col">Origem</th>
                              <th className="table-head-cell text-left text-white" scope="col">Nome</th>
                              <th className="table-head-cell text-left text-white" scope="col">Telefone</th>
                              <th className="table-head-cell text-left text-white" scope="col">Servico</th>
                              <th className="table-head-cell text-left text-white" scope="col">Unidade</th>
                              <th className="table-head-cell text-left text-white" scope="col">Data</th>
                              <th className="table-head-cell text-left text-white" scope="col">Horario</th>
                              <th className="table-head-cell text-left text-white" scope="col">Status</th>
                              <th className="table-head-cell text-left text-white" scope="col">Finalizado em</th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#f4f0e7]" data-concierge-table-body>
                          <tr>
                              <td className="table-cell" colSpan={10}>Carregando contatos de WhatsApp...</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </section>
      </div>

    </>
  );
};

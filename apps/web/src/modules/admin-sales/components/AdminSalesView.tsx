import type { ReactElement } from "react";

export const AdminSalesView = (): ReactElement => {
  return (
    <>
<div className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-col gap-1">
                  <h2 className="text-forest dark:text-white text-3xl display-hero text-shadow-strong italic">Pedidos e Vendas</h2>
                  <p className="text-stone-500 text-lg font-normal">Acompanhe pedidos, pagamentos e expedição.</p>
              </div>
              <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#e7f3eb] text-forest-green hover:bg-[#d5e9db] transition-colors">
                      Exportar
                  </button>
                  <button className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                      Novo pedido manual
                  </button>
              </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
                  <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Total de pedidos</p>
                  <p className="text-forest-green text-3xl display-number text-shadow-strong" data-orders-kpi-total>0</p>
                  <span className="text-xs text-text-muted" data-orders-kpi-total-note>Carregando...</span>
              </div>
              <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
                  <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Em andamento</p>
                  <p className="text-forest-green text-3xl display-number text-shadow-strong" data-orders-kpi-in-progress>0</p>
                  <span className="text-xs text-text-muted" data-orders-kpi-in-progress-note>Carregando...</span>
              </div>
              <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
                  <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Despachados</p>
                  <p className="text-forest-green text-3xl display-number text-shadow-strong" data-orders-kpi-dispatched>0</p>
                  <span className="text-xs text-text-muted" data-orders-kpi-dispatched-note>Carregando...</span>
              </div>
              <div className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-5 flex flex-col gap-2">
                  <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Cancelados</p>
                  <p className="text-forest-green text-3xl display-number text-shadow-strong" data-orders-kpi-cancelled>0</p>
                  <span className="text-xs text-text-muted" data-orders-kpi-cancelled-note>Carregando...</span>
              </div>
          </section>

          <section className="bg-white rounded-xl border border-[#cfe7d1] shadow-sm p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3">
                  <div className="relative w-full group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="material-symbols-outlined text-text-muted group-focus-within:text-primary transition-colors">search</span>
                      </div>
                      <input className="block w-full pl-10 pr-3 py-2.5 border border-[#cfe7d1] rounded-lg leading-5 bg-[#f6f8f6] text-forest-green placeholder-text-muted focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-xs font-body transition-all" placeholder="Buscar pedido, cliente ou produto..." type="text" data-orders-search />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-orders-status-filter>
                          <option value="">Status</option>
                          <option value="PAGO">Pago</option>
                          <option value="PENDENTE">Pendente</option>
                          <option value="ENVIADO">Enviado</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="CANCELADO">Cancelado</option>
                      </select>
                      <select className="appearance-none w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-body text-xs cursor-pointer hover:bg-white transition-colors" data-orders-fulfillment-filter>
                          <option value="">Despacho</option>
                          <option value="PENDENTE">Pendente</option>
                          <option value="SEPARANDO">Separando</option>
                          <option value="EMBALADO">Embalado</option>
                          <option value="DESPACHADO">Despachado</option>
                          <option value="ENVIADO">Enviado</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="CANCELADO">Cancelado</option>
                      </select>
                  </div>
              </div>
              <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#cfe7d1] bg-[#f9fbf9] px-4 py-3">
                  <p className="text-xs text-text-muted font-medium">
                      <span className="font-semibold text-forest-green" data-orders-selected-count>0</span> selecionados
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <p className="text-xs text-text-muted" data-orders-bulk-status />
                      <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                          data-orders-bulk-next
                          disabled
                      >
                          Marcar proxima etapa
                      </button>
                  </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#cfe7d1]">
                  <div className="admin-grid-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#cfe7d1] bg-primary">
                      <div className="text-xs text-white font-medium uppercase tracking-wider" data-orders-pagination-range>
                          Mostrando 0-0 de 0 pedidos
                      </div>
                      <div className="admin-grid-toolbar-controls flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="flex items-center gap-2">
                              <span className="text-[11px] uppercase tracking-wider text-white font-semibold">Itens por pagina</span>
                              <div className="relative">
                                  <select className="appearance-none bg-white border border-[#cfe7d1] text-forest-green py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs cursor-pointer hover:bg-[#f6f8f6] transition-colors" data-orders-page-size>
                                      <option value="10">10</option>
                                      <option value="25">25</option>
                                      <option value="50">50</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                                      <span className="material-symbols-outlined text-base">expand_more</span>
                                  </div>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-orders-page-first>
                                  <span className="material-symbols-outlined text-sm align-middle">first_page</span>
                                  Primeira
                              </button>
                              <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-orders-page-prev>
                                  <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
                                  Anterior
                              </button>
                              <div className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-xs font-semibold text-gold" data-orders-pagination-page>
                                  Pagina 1 de 1
                              </div>
                              <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-orders-page-next>
                                  Proxima
                                  <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
                              </button>
                              <button className="px-3 py-1.5 rounded-lg border border-[#cfe7d1] bg-forest text-gold text-xs font-semibold hover:bg-primary transition-colors disabled:opacity-40" type="button" data-orders-page-last>
                                  Ultima
                                  <span className="material-symbols-outlined text-sm align-middle">last_page</span>
                              </button>
                          </div>
                      </div>
                  </div>
                  <div className="hidden lg:block">
                      <table className="table min-w-full divide-y divide-[#cfe7d1]">
                          <thead className="bg-[#f6f8f6]">
                              <tr>
                                  <th className="table-head-cell text-left text-text-muted w-[42px]">
                                      <input
                                          type="checkbox"
                                          className="h-4 w-4 rounded border-[#cfe7d1] text-primary focus:ring-primary"
                                          aria-label="Selecionar pedidos da pagina"
                                          data-orders-select-all
                                      />
                                  </th>
                                  <th className="table-head-cell text-left text-text-muted">ID</th>
                                  <th className="table-head-cell text-left text-text-muted">Cliente</th>
                                  <th className="table-head-cell text-left text-text-muted">Email</th>
                                  <th className="table-head-cell text-left text-text-muted">Telefone</th>
                                  <th className="table-head-cell text-left text-text-muted">Status</th>
                                  <th className="table-head-cell text-left text-text-muted">Despacho</th>
                                  <th className="table-head-cell text-left text-text-muted">Total</th>
                                  <th className="table-head-cell text-left text-text-muted">Criado</th>
                                  <th className="table-head-cell text-left text-text-muted">Atualizado</th>
                                  <th className="table-head-cell text-right text-text-muted">Acoes</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-[#f4f0e7]" data-orders-table-body>
                              <tr>
                                  <td className="table-cell" colSpan={11}>Carregando pedidos...</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
              <div className="lg:hidden flex flex-col gap-3" data-orders-mobile-list>
                  <article className="rounded-xl border border-[#cfe7d1] bg-white px-4 py-4 text-xs text-text-muted">
                      Carregando pedidos...
                  </article>
              </div>
          </section>

          <section className="fixed inset-0 z-[70] hidden items-center justify-center bg-black/45 p-4" data-order-status-modal>
              <div className="w-full max-w-md rounded-xl border border-[#cfe7d1] bg-white shadow-xl">
                  <div className="flex items-start justify-between px-5 py-4 border-b border-[#e8f1e9]">
                      <div>
                          <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">Atualizacao de status</p>
                          <h3 className="text-lg font-semibold text-forest-green" data-order-status-title>Pedido</h3>
                      </div>
                      <button
                          type="button"
                          className="rounded-lg border border-[#cfe7d1] px-2 py-1 text-xs font-semibold text-forest-green hover:bg-[#f6f8f6]"
                          data-order-status-cancel
                      >
                          Fechar
                      </button>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-3">
                      <p className="text-xs text-text-muted">Status atual: <span className="font-semibold text-forest-green" data-order-status-current>Pendente</span></p>
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-muted" htmlFor="order-status-select">
                          Status do pedido
                      </label>
                      <select
                          id="order-status-select"
                          className="w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                          data-order-status-select
                      >
                          <option value="PENDENTE">Pendente</option>
                          <option value="PAGO">Pago</option>
                          <option value="ENVIADO">Enviado</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="CANCELADO">Cancelado</option>
                      </select>
                      <div className="h-px bg-[#e8f1e9]" />
                      <p className="text-xs text-text-muted">Fluxo atual: <span className="font-semibold text-forest-green" data-order-fulfillment-current>Pendente</span></p>
                      <label className="text-xs font-semibold uppercase tracking-wider text-text-muted" htmlFor="order-fulfillment-select">
                          Etapa de despacho
                      </label>
                      <select
                          id="order-fulfillment-select"
                          className="w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                          data-order-fulfillment-select
                      >
                          <option value="PENDENTE">Pendente</option>
                          <option value="SEPARANDO">Separando</option>
                          <option value="EMBALADO">Embalado</option>
                          <option value="DESPACHADO">Despachado</option>
                          <option value="ENVIADO">Enviado</option>
                          <option value="ENTREGUE">Entregue</option>
                          <option value="CANCELADO">Cancelado</option>
                      </select>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                              type="text"
                              className="w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                              placeholder="Transportadora"
                              data-order-fulfillment-carrier
                          />
                          <input
                              type="text"
                              className="w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                              placeholder="Codigo de rastreio"
                              data-order-fulfillment-tracking
                          />
                      </div>
                      <textarea
                          className="w-full bg-[#f6f8f6] border border-[#cfe7d1] text-forest-green py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm min-h-[84px]"
                          placeholder="Observacoes de expedição"
                          data-order-fulfillment-notes
                      />
                      <p className="text-xs text-red-700 hidden" data-order-status-error />
                  </div>
                  <div className="px-5 py-4 border-t border-[#e8f1e9] flex items-center justify-end gap-2">
                      <button
                          type="button"
                          className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6]"
                          data-order-status-cancel
                      >
                          Cancelar
                      </button>
                      <button
                          type="button"
                          className="px-4 py-2 rounded-lg border border-[#cfe7d1] text-forest-green text-xs font-semibold hover:bg-[#f6f8f6] disabled:opacity-50"
                          data-order-fulfillment-save
                      >
                          Salvar despacho
                      </button>
                      <button
                          type="button"
                          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark disabled:opacity-50"
                          data-order-status-save
                      >
                          Salvar pedido
                      </button>
                  </div>
              </div>
          </section>

          <section className="fixed inset-0 z-[65] hidden" data-order-details-drawer>
              <div className="absolute inset-0 bg-black/35" data-order-details-close />
              <aside className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white border-l border-[#cfe7d1] shadow-2xl overflow-y-auto">
                  <header className="sticky top-0 z-10 bg-white border-b border-[#e8f1e9] px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-2">
                          <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">Detalhes do pedido</p>
                          <h3 className="text-xl font-semibold text-forest-green" data-order-details-title>Pedido</h3>
                          <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full border text-xs font-semibold" data-order-details-status>Pedido</span>
                              <span className="px-2.5 py-1 rounded-full border text-xs font-semibold" data-order-details-fulfillment>Despacho</span>
                          </div>
                      </div>
                      <button
                          type="button"
                          className="rounded-lg border border-[#cfe7d1] px-3 py-1.5 text-xs font-semibold text-forest-green hover:bg-[#f6f8f6]"
                          data-order-details-close
                      >
                          Fechar
                      </button>
                  </header>

                  <div className="p-6 flex flex-col gap-6">
                      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-[#cfe7d1] bg-[#f9fbf9] p-3">
                              <p className="text-[11px] uppercase tracking-wider text-text-muted">Total</p>
                              <p className="text-lg font-semibold text-forest-green" data-order-details-total>R$ 0,00</p>
                          </div>
                          <div className="rounded-xl border border-[#cfe7d1] bg-[#f9fbf9] p-3">
                              <p className="text-[11px] uppercase tracking-wider text-text-muted">Cliente</p>
                              <p className="text-sm font-medium text-forest-green" data-order-details-customer>-</p>
                          </div>
                          <div className="rounded-xl border border-[#cfe7d1] bg-[#f9fbf9] p-3">
                              <p className="text-[11px] uppercase tracking-wider text-text-muted">Criado</p>
                              <p className="text-sm font-medium text-forest-green" data-order-details-created>-</p>
                          </div>
                          <div className="rounded-xl border border-[#cfe7d1] bg-[#f9fbf9] p-3">
                              <p className="text-[11px] uppercase tracking-wider text-text-muted">Atualizado</p>
                              <p className="text-sm font-medium text-forest-green" data-order-details-updated>-</p>
                          </div>
                      </section>

                      <section className="rounded-xl border border-[#cfe7d1] p-4 flex flex-col gap-2">
                          <h4 className="text-sm font-semibold text-forest-green">Logistica</h4>
                          <p className="text-xs text-text-muted" data-order-details-shipping>Sem dados de envio.</p>
                      </section>

                      <section className="rounded-xl border border-[#cfe7d1] p-4 flex flex-col gap-3">
                          <h4 className="text-sm font-semibold text-forest-green">Itens do pedido</h4>
                          <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-[#e8f1e9]">
                                  <thead>
                                      <tr>
                                          <th className="table-head-cell text-left text-text-muted">Item</th>
                                          <th className="table-head-cell text-left text-text-muted">Qtd</th>
                                          <th className="table-head-cell text-left text-text-muted">Unitario</th>
                                          <th className="table-head-cell text-left text-text-muted">Subtotal</th>
                                      </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-[#f4f0e7]" data-order-details-items>
                                      <tr>
                                          <td className="table-cell" colSpan={4}>Carregando...</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </section>

                      <section className="rounded-xl border border-[#cfe7d1] p-4 flex flex-col gap-3">
                          <h4 className="text-sm font-semibold text-forest-green">Pagamentos</h4>
                          <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-[#e8f1e9]">
                                  <thead>
                                      <tr>
                                          <th className="table-head-cell text-left text-text-muted">Status</th>
                                          <th className="table-head-cell text-left text-text-muted">Valor</th>
                                          <th className="table-head-cell text-left text-text-muted">Metodo</th>
                                          <th className="table-head-cell text-left text-text-muted">Quando</th>
                                      </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-[#f4f0e7]" data-order-details-payments>
                                      <tr>
                                          <td className="table-cell" colSpan={4}>Carregando...</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </section>

                      <section className="rounded-xl border border-[#cfe7d1] p-4 flex flex-col gap-3">
                          <h4 className="text-sm font-semibold text-forest-green">Historico de status</h4>
                          <ul className="flex flex-col gap-2" data-order-details-history>
                              <li className="text-xs text-text-muted">Carregando...</li>
                          </ul>
                      </section>
                  </div>
              </aside>
          </section>
      </div>

    </>
  );
};

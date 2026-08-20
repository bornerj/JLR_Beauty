import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import {
  bulkAdvanceOrders,
  createManualSaleOrder,
  fetchOrdersFull,
  fetchOrdersSummary,
  updateOrderStatus,
  updateOrderFulfillmentStatus,
} from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";
import { OrderDetailModal } from "./components/OrderDetailModal";
import { OrderEditModal } from "./components/OrderEditModal";
import { ManualSaleModal, type ManualSalePayload } from "./components/ManualSaleModal";
import {
  ORDER_STATUS_OPTIONS,
  FULFILLMENT_STATUS_OPTIONS,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
} from "./listTypes";
import type { OrderListRow, OrdersSummary } from "./listTypes";

/**
 * Admin V2 (PLAN-0031) — Lista de Pedidos nativa, migração 1:1 de "Pedidos e Vendas"
 * (`apps/web/src/modules/admin-orders/behavior.ts`, ilha React + JS imperativo — reescrito
 * aqui como React declarativo de verdade). Aba irmã do Kanban ("Pedidos") dentro de
 * Operação. Reusa 100% dos endpoints já existentes — nenhuma mudança de backend
 * (`ERR` nenhum aberto por isso). Filtro/busca/paginação são client-side, mesmo
 * comportamento do legado (`GET /orders` não aceita filtro/paginação server-side).
 *
 * `?highlight=<orderId>` (novo, não existia no legado — o legado não tinha nenhum deep-link
 * pro pedido específico) abre o drawer de detalhe direto ao carregar, usado pelo link "Ver
 * detalhes →" dos cards `BLOCKED` do Kanban (`OrderCardView.tsx`).
 */

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type ListState = { loading: boolean; orders: OrderListRow[] | null; summary: OrdersSummary | null; error: string | null };
type ModalState =
  | { kind: "detail"; order: OrderListRow }
  | { kind: "edit"; order: OrderListRow }
  | { kind: "manual-sale" }
  | null;

export function OrdersListView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<ListState>({ loading: true, orders: null, summary: null, error: null });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<ModalState>(null);
  const [mutation, setMutation] = useState<{ submitting: boolean; error: string | null }>({ submitting: false, error: null });
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, orders: null, summary: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [orders, summary] = await Promise.all([fetchOrdersFull({ token }), fetchOrdersSummary({ token })]);
      setState({ loading: false, orders, summary, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os pedidos.";
      logger.warn("Falha ao carregar Lista de Pedidos (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, orders: prev.orders, summary: prev.summary, error: message }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // `?highlight=<id>` — abre o detalhe direto assim que a lista carregar (deep-link novo, ver nota acima).
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (!highlight || !state.orders) return;
    const order = state.orders.find((candidate) => candidate.id === Number(highlight));
    if (order) {
      setModal({ kind: "detail", order });
      const next = new URLSearchParams(searchParams);
      next.delete("highlight");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, state.orders, setSearchParams]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (state.orders ?? []).filter((order) => {
      const matchesQuery =
        !query ||
        String(order.id).includes(query) ||
        (order.customerName ?? "").toLowerCase().includes(query) ||
        (order.customerEmail ?? "").toLowerCase().includes(query);
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesFulfillment = !fulfillmentFilter || order.fulfillmentStatus === fulfillmentFilter;
      return matchesQuery && matchesStatus && matchesFulfillment;
    });
  }, [state.orders, search, statusFilter, fulfillmentFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageOrders = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, fulfillmentFilter, pageSize]);

  const allPageSelected = pageOrders.length > 0 && pageOrders.every((order) => selectedIds.has(order.id));

  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageOrders.forEach((order) => next.delete(order.id));
      } else {
        pageOrders.forEach((order) => next.add(order.id));
      }
      return next;
    });
  };

  const toggleOne = (orderId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleBulkAdvance = useCallback(async () => {
    const token = getToken();
    if (!token || selectedIds.size === 0) return;
    setMutation({ submitting: true, error: null });
    setBulkMessage(null);
    try {
      const result = await bulkAdvanceOrders({ token, orderIds: Array.from(selectedIds) });
      const noPaymentCount = result.results.filter((item) => item.result === "SKIPPED" && item.reason?.toLowerCase().includes("pagamento")).length;
      setBulkMessage(
        `${result.updatedCount} atualizado(s), ${result.skippedCount} ignorado(s)${noPaymentCount > 0 ? ` (${noPaymentCount} sem pagamento aprovado)` : ""}.`
      );
      setSelectedIds(new Set());
      setMutation({ submitting: false, error: null });
      void load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao avançar os pedidos selecionados.";
      logger.warn("Falha na ação em lote (Admin V2, Lista de Pedidos)", { error: message });
      setMutation({ submitting: false, error: message });
    }
  }, [selectedIds, load]);

  const handleSaveStatus = useCallback(
    async (orderId: number, status: string) => {
      const token = getToken();
      if (!token) return;
      setMutation({ submitting: true, error: null });
      try {
        await updateOrderStatus({ token, orderId, status });
        setMutation({ submitting: false, error: null });
        setModal(null);
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o status.";
        logger.warn("Falha ao salvar status do pedido (Admin V2, Lista de Pedidos)", { error: message, orderId });
        setMutation({ submitting: false, error: message });
      }
    },
    [load]
  );

  const handleSaveFulfillment = useCallback(
    async (orderId: number, args: { fulfillmentStatus: string; shipmentCarrier: string; shipmentTrackingCode: string; fulfillmentNotes: string }) => {
      const token = getToken();
      if (!token) return;
      setMutation({ submitting: true, error: null });
      try {
        await updateOrderFulfillmentStatus({
          token,
          orderId,
          fulfillmentStatus: args.fulfillmentStatus as "PENDENTE" | "SEPARANDO" | "EMBALADO" | "DESPACHADO" | "ENVIADO" | "ENTREGUE",
          shipmentCarrier: args.shipmentCarrier || undefined,
        });
        setMutation({ submitting: false, error: null });
        setModal(null);
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o fulfillment.";
        logger.warn("Falha ao salvar fulfillment do pedido (Admin V2, Lista de Pedidos)", { error: message, orderId });
        setMutation({ submitting: false, error: message });
      }
    },
    [load]
  );

  const handleManualSale = useCallback(
    async (payload: ManualSalePayload) => {
      const token = getToken();
      if (!token) return;
      setMutation({ submitting: true, error: null });
      try {
        await createManualSaleOrder({ token, ...payload });
        setMutation({ submitting: false, error: null });
        setModal(null);
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao registrar a venda.";
        logger.warn("Falha ao registrar venda manual (Admin V2, Lista de Pedidos)", { error: message });
        setMutation({ submitting: false, error: message });
      }
    },
    [load]
  );

  if (state.loading && !state.orders) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando pedidos…</p>;
  }

  if (state.error && !state.orders) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os pedidos.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{state.error}</p>
        <div>
          <button type="button" onClick={() => void load()} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.orders) return null;
  const summary = state.summary;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Lista de Pedidos</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            todos os pedidos, com filtro, busca e ações em lote · {filtered.length}/{state.orders.length} pedido(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ kind: "manual-sale" })}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          + Venda manual
        </button>
      </div>

      {summary && (
        // PLAN-0032 ocorrência #3: uma linha só (a maioria é número, cabe), "Receita
        // confirmada" por último (é o único valor tipicamente largo). Rótulo completo
        // (usuário confirmou ao vivo que o quadro tem espaço de sobra — abreviação de
        // 5 posições virou desnecessária) — 7 colunas, a última (receita) mais larga que
        // as demais; overflow-x-auto como reserva pra telas bem estreitas, mesmo padrão já
        // usado na tabela abaixo (`min-w-[880px]`).
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-[repeat(6,minmax(0,1fr))_minmax(0,1.6fr)] gap-2">
            {[
              { label: "Total", value: summary.totalOrders },
              { label: "Em progresso", value: summary.inProgress },
              { label: "Despachados", value: summary.dispatched },
              { label: "Entregues", value: summary.delivered },
              { label: "Cancelados", value: summary.cancelled },
              { label: "Pagamento pendente", value: summary.pendingPayment },
              { label: "Receita confirmada", value: formatCurrencyBRL(summary.confirmedRevenue) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-gold/30 bg-cream-sidebar px-3 py-2 dark:border-forest-green dark:bg-forest-green"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{item.label}</p>
                <p className="text-lg font-bold text-forest">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID, nome ou e-mail…"
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todos os status</option>
          {ORDER_STATUS_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value] ?? value}
            </option>
          ))}
        </select>
        <select
          value={fulfillmentFilter}
          onChange={(e) => setFulfillmentFilter(e.target.value)}
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todo o fulfillment</option>
          {FULFILLMENT_STATUS_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value] ?? value}
            </option>
          ))}
        </select>
      </div>

      {/* PLAN-0032 ocorrência #3: linha de navegação/paginação movida pra cima da grid,
          logo após os filtros (antes ficava abaixo da tabela). */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-gold/40 bg-white px-2 py-1 text-sm text-forest dark:bg-forest-green"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <p>
          Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} pedidos ·
          página {currentPage} de {pageCount}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
            className="rounded-lg bg-primary px-2.5 py-1 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            «
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg bg-primary px-2.5 py-1 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage === pageCount}
            className="rounded-lg bg-primary px-2.5 py-1 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setPage(pageCount)}
            disabled={currentPage === pageCount}
            className="rounded-lg bg-primary px-2.5 py-1 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            »
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/40 bg-cream-sidebar px-3 py-2 dark:border-forest-green dark:bg-forest-green">
          <p className="text-sm font-semibold text-forest">{selectedIds.size} selecionado(s)</p>
          <button
            type="button"
            onClick={() => void handleBulkAdvance()}
            disabled={mutation.submitting}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.submitting ? "Avançando…" : "Marcar próxima etapa"}
          </button>
        </div>
      )}
      {bulkMessage && <p className="rounded-lg border border-gold/40 bg-white px-3 py-2 text-xs text-forest dark:bg-forest">{bulkMessage}</p>}
      {mutation.error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{mutation.error}</p>}

      {pageOrders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">Nenhum pedido encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-3 py-3">
                  <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} aria-label="Selecionar todos nesta página" />
                </th>
                <th className="px-3 py-3">Pedido</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Fulfillment</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.map((order) => (
                <tr key={order.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleOne(order.id)} aria-label={`Selecionar PV-${order.id}`} />
                  </td>
                  <td className="px-3 py-2.5">
                    <button type="button" onClick={() => setModal({ kind: "detail", order })} className="font-semibold text-primary hover:underline">
                      PV-{order.id}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-forest">
                    <p>{order.customerName ?? "—"}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{order.customerEmail ?? "—"}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[order.status] ?? "bg-stone-200 text-stone-700"}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[order.fulfillmentStatus] ?? "bg-stone-200 text-stone-700"}`}>
                      {STATUS_LABEL[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-forest">{formatCurrencyBRL(Number(order.total))}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button type="button" onClick={() => setModal({ kind: "detail", order })} title="Detalhes" className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button type="button" onClick={() => setModal({ kind: "edit", order })} title="Atualizar" className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.kind === "detail" && <OrderDetailModal order={modal.order} onClose={() => setModal(null)} />}

      {modal?.kind === "edit" && (
        <OrderEditModal
          order={modal.order}
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onSaveStatus={(status) => void handleSaveStatus(modal.order.id, status)}
          onSaveFulfillment={(args) => void handleSaveFulfillment(modal.order.id, args)}
        />
      )}

      {modal?.kind === "manual-sale" && (
        <ManualSaleModal
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onConfirm={(payload) => void handleManualSale(payload)}
        />
      )}
    </div>
  );
}

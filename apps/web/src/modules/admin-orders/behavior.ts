import type { Cleanup } from "../../shared/dom";
import { on } from "../../shared/dom";

type ApiJsonFn = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type AddCleanupFn = (cleanup: Cleanup) => void;
type FormatCurrencyValueFn = (value: number) => string;
type FormatDateFn = (value?: string | null) => string;

type ApiOrderItem = {
  id: number;
  productId?: number | null;
  membershipId?: number | null;
  serviceId?: number | null;
  quantity?: number | null;
  unitPrice?: number | string | null;
  product?: { id: number; name: string } | null;
  service?: { id: number; name: string } | null;
  membership?: { id: number; name?: string | null; title?: string | null } | null;
};

type ApiOrderPayment = {
  id: number;
  status?: string | null;
  provider?: string | null;
  method?: string | null;
  amount?: number | string | null;
  paidAt?: string | null;
  createdAt?: string | null;
};

type ApiOrderHistory = {
  id: number;
  fromStatus?: string | null;
  toStatus?: string | null;
  source?: string | null;
  note?: string | null;
  createdAt?: string | null;
};

type ApiOrderRow = {
  id: number;
  publicCode?: string | null;
  status?: string | null;
  fulfillmentStatus?: string | null;
  total?: number | string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shipmentTrackingCode?: string | null;
  shipmentCarrier?: string | null;
  fulfillmentNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: ApiOrderItem[] | null;
  payments?: ApiOrderPayment[] | null;
  statusHistory?: ApiOrderHistory[] | null;
};

type ApiOrderSummary = {
  totalOrders: number;
  inProgress: number;
  dispatched: number;
  delivered: number;
  cancelled: number;
  pendingPayment: number;
  confirmedRevenue: number;
};

type ApiOrderBulkAdvanceResult = {
  orderId: number;
  result: "UPDATED" | "SKIPPED";
  reason?: string;
};

type ApiOrderBulkAdvanceResponse = {
  totalRequested: number;
  updatedCount: number;
  skippedCount: number;
  results: ApiOrderBulkAdvanceResult[];
};

type OrderItemRow = {
  id: number;
  productId?: number | null;
  membershipId?: number | null;
  serviceId?: number | null;
  quantity: number;
  unitPrice: number;
  productName?: string | null;
  serviceName?: string | null;
  membershipName?: string | null;
  membershipTitle?: string | null;
};

type OrderPaymentRow = {
  id: number;
  status: string;
  provider?: string | null;
  method?: string | null;
  amount: number;
  paidAt?: string | null;
  createdAt?: string | null;
};

type OrderHistoryRow = {
  id: number;
  fromStatus?: string | null;
  toStatus: string;
  source?: string | null;
  note?: string | null;
  createdAt?: string | null;
};

type OrderRow = {
  id: number;
  publicCode?: string | null;
  status: string;
  fulfillmentStatus: string;
  total: number;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shipmentTrackingCode?: string | null;
  shipmentCarrier?: string | null;
  fulfillmentNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItemRow[];
  payments: OrderPaymentRow[];
  statusHistory: OrderHistoryRow[];
};

type InitAdminOrdersBehaviorParams = {
  addCleanup: AddCleanupFn;
  apiJson: ApiJsonFn;
  formatCurrencyValue: FormatCurrencyValueFn;
  formatDate: FormatDateFn;
  statusBadgeByName: Record<string, string>;
};

const ORDER_STATUS = ["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"] as const;
const FULFILLMENT_STATUS = [
  "PENDENTE",
  "SEPARANDO",
  "EMBALADO",
  "DESPACHADO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
] as const;

const ORDER_ALIAS: Record<string, string> = {
  PENDING: "PENDENTE",
  PROCESSING: "PENDENTE",
  PAID: "PAGO",
  SHIPPED: "ENVIADO",
  DELIVERED: "ENTREGUE",
  CANCELED: "CANCELADO",
  CANCELLED: "CANCELADO",
};
const FULFILLMENT_ALIAS: Record<string, string> = {
  PENDING: "PENDENTE",
  SEPARATING: "SEPARANDO",
  PACKED: "EMBALADO",
  DISPATCHED: "DESPACHADO",
  SHIPPED: "ENVIADO",
  DELIVERED: "ENTREGUE",
  CANCELED: "CANCELADO",
  CANCELLED: "CANCELADO",
};
const PAYMENT_ALIAS: Record<string, string> = {
  PENDING: "PENDENTE",
  APPROVED: "APROVADO",
  REJECTED: "RECUSADO",
  CANCELED: "CANCELADO",
  CANCELLED: "CANCELADO",
  REFUNDED: "REEMBOLSADO",
};
const PAYMENT_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
  REEMBOLSADO: "Reembolsado",
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};
const normalize = (value?: string | null): string =>
  String(value || "")
    .trim()
    .toUpperCase();
const nOrder = (value?: string | null): string => {
  const raw = normalize(value);
  if (!raw) return "";
  return ORDER_ALIAS[raw] || raw;
};
const nFulfillment = (value?: string | null): string => {
  const raw = normalize(value);
  if (!raw) return "";
  return FULFILLMENT_ALIAS[raw] || raw;
};
const nPayment = (value?: string | null): string => {
  const raw = normalize(value);
  if (!raw) return "PENDENTE";
  return PAYMENT_ALIAS[raw] || raw;
};
const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const statusPt = (status?: string | null): string =>
  ({
    PENDENTE: "Pendente",
    PAGO: "Pago",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
    SEPARANDO: "Separando",
    EMBALADO: "Embalado",
    DESPACHADO: "Despachado",
  }[normalize(status)] || normalize(status) || "Pendente");

export const initAdminOrdersBehavior = ({
  addCleanup,
  apiJson,
  formatCurrencyValue,
  formatDate,
  statusBadgeByName,
}: InitAdminOrdersBehaviorParams): { refresh: () => Promise<void> } => {
  const ordersSearch = document.querySelector("[data-orders-search]") as HTMLInputElement | null;
  const ordersStatusFilter = document.querySelector("[data-orders-status-filter]") as HTMLSelectElement | null;
  const ordersFulfillmentFilter = document.querySelector(
    "[data-orders-fulfillment-filter]"
  ) as HTMLSelectElement | null;
  const ordersTableBody = document.querySelector("[data-orders-table-body]") as HTMLElement | null;
  const ordersMobileList = document.querySelector("[data-orders-mobile-list]") as HTMLElement | null;
  const ordersSelectAll = document.querySelector("[data-orders-select-all]") as HTMLInputElement | null;
  const ordersPageFirst = document.querySelector("[data-orders-page-first]") as HTMLButtonElement | null;
  const ordersPagePrev = document.querySelector("[data-orders-page-prev]") as HTMLButtonElement | null;
  const ordersPageNext = document.querySelector("[data-orders-page-next]") as HTMLButtonElement | null;
  const ordersPageLast = document.querySelector("[data-orders-page-last]") as HTMLButtonElement | null;
  const ordersPageSizeSelect = document.querySelector("[data-orders-page-size]") as HTMLSelectElement | null;
  const ordersPaginationPage = document.querySelector(
    "[data-orders-pagination-page]"
  ) as HTMLElement | null;
  const ordersPaginationRange = document.querySelector(
    "[data-orders-pagination-range]"
  ) as HTMLElement | null;
  const kpiTotal = document.querySelector("[data-orders-kpi-total]") as HTMLElement | null;
  const kpiTotalNote = document.querySelector("[data-orders-kpi-total-note]") as HTMLElement | null;
  const kpiInProgress = document.querySelector(
    "[data-orders-kpi-in-progress]"
  ) as HTMLElement | null;
  const kpiInProgressNote = document.querySelector(
    "[data-orders-kpi-in-progress-note]"
  ) as HTMLElement | null;
  const kpiDispatched = document.querySelector("[data-orders-kpi-dispatched]") as HTMLElement | null;
  const kpiDispatchedNote = document.querySelector(
    "[data-orders-kpi-dispatched-note]"
  ) as HTMLElement | null;
  const kpiCancelled = document.querySelector("[data-orders-kpi-cancelled]") as HTMLElement | null;
  const kpiCancelledNote = document.querySelector(
    "[data-orders-kpi-cancelled-note]"
  ) as HTMLElement | null;
  const ordersSelectedCount = document.querySelector("[data-orders-selected-count]") as HTMLElement | null;
  const ordersBulkNextBtn = document.querySelector("[data-orders-bulk-next]") as HTMLButtonElement | null;
  const ordersBulkStatus = document.querySelector("[data-orders-bulk-status]") as HTMLElement | null;
  const statusModal = document.querySelector("[data-order-status-modal]") as HTMLElement | null;
  const statusTitle = document.querySelector("[data-order-status-title]") as HTMLElement | null;
  const statusCurrent = document.querySelector("[data-order-status-current]") as HTMLElement | null;
  const fulfillmentCurrent = document.querySelector(
    "[data-order-fulfillment-current]"
  ) as HTMLElement | null;
  const statusSelect = document.querySelector("[data-order-status-select]") as HTMLSelectElement | null;
  const fulfillmentSelect = document.querySelector(
    "[data-order-fulfillment-select]"
  ) as HTMLSelectElement | null;
  const carrierInput = document.querySelector(
    "[data-order-fulfillment-carrier]"
  ) as HTMLInputElement | null;
  const trackingInput = document.querySelector(
    "[data-order-fulfillment-tracking]"
  ) as HTMLInputElement | null;
  const notesInput = document.querySelector(
    "[data-order-fulfillment-notes]"
  ) as HTMLTextAreaElement | null;
  const statusSaveBtn = document.querySelector("[data-order-status-save]") as HTMLButtonElement | null;
  const fulfillmentSaveBtn = document.querySelector(
    "[data-order-fulfillment-save]"
  ) as HTMLButtonElement | null;
  const statusError = document.querySelector("[data-order-status-error]") as HTMLElement | null;
  const detailsDrawer = document.querySelector("[data-order-details-drawer]") as HTMLElement | null;
  const detailsTitle = document.querySelector("[data-order-details-title]") as HTMLElement | null;
  const detailsStatus = document.querySelector("[data-order-details-status]") as HTMLElement | null;
  const detailsFulfillment = document.querySelector(
    "[data-order-details-fulfillment]"
  ) as HTMLElement | null;
  const detailsTotal = document.querySelector("[data-order-details-total]") as HTMLElement | null;
  const detailsCustomer = document.querySelector("[data-order-details-customer]") as HTMLElement | null;
  const detailsCreated = document.querySelector("[data-order-details-created]") as HTMLElement | null;
  const detailsUpdated = document.querySelector("[data-order-details-updated]") as HTMLElement | null;
  const detailsShipping = document.querySelector("[data-order-details-shipping]") as HTMLElement | null;
  const detailsItems = document.querySelector("[data-order-details-items]") as HTMLElement | null;
  const detailsPayments = document.querySelector("[data-order-details-payments]") as HTMLElement | null;
  const detailsHistory = document.querySelector("[data-order-details-history]") as HTMLElement | null;

  let ordersCache: OrderRow[] = [];
  let ordersPage = 1;
  let ordersPageSize = 10;
  let selectedOrderIds = new Set<number>();
  let statusModalOrderId: number | null = null;
  let isStatusSaving = false;
  let isFulfillmentSaving = false;
  let isBulkAdvancing = false;

  if (ordersPageSizeSelect) {
    const initialSize = Number(ordersPageSizeSelect.value);
    if (Number.isFinite(initialSize) && initialSize > 0) {
      ordersPageSize = initialSize;
    }
  }

  const getBadge = (status: string): string =>
    statusBadgeByName[status] || "bg-stone-100 text-stone-600 border-stone-200";
  const formatInt = new Intl.NumberFormat("pt-BR");
  const hasApprovedPayment = (order: OrderRow): boolean =>
    order.payments.some((payment) => nPayment(payment.status) === "APROVADO");
  const requiresApprovedPayment = (order: OrderRow): boolean =>
    order.payments.length > 0 && !hasApprovedPayment(order);
  const setBulkStatus = (message: string, isError = false): void => {
    if (!ordersBulkStatus) return;
    ordersBulkStatus.textContent = message;
    ordersBulkStatus.classList.toggle("text-red-700", isError);
    ordersBulkStatus.classList.toggle("text-emerald-700", !isError);
    ordersBulkStatus.classList.toggle("text-text-muted", message.length === 0);
  };
  const syncBulkUi = (): void => {
    if (ordersSelectedCount) {
      ordersSelectedCount.textContent = formatInt.format(selectedOrderIds.size);
    }
    if (ordersBulkNextBtn) {
      ordersBulkNextBtn.disabled = selectedOrderIds.size === 0 || isBulkAdvancing;
    }
    if (ordersSelectAll && ordersTableBody) {
      const pageCheckboxes = Array.from(
        ordersTableBody.querySelectorAll<HTMLInputElement>("[data-order-select]")
      );
      const selectedOnPage = pageCheckboxes.filter((input) => input.checked).length;
      ordersSelectAll.checked = pageCheckboxes.length > 0 && selectedOnPage === pageCheckboxes.length;
      ordersSelectAll.indeterminate =
        pageCheckboxes.length > 0 && selectedOnPage > 0 && selectedOnPage < pageCheckboxes.length;
    }
  };
  const applyKpis = (summary: ApiOrderSummary): void => {
    if (kpiTotal) kpiTotal.textContent = formatInt.format(summary.totalOrders);
    if (kpiTotalNote) kpiTotalNote.textContent = `${formatCurrencyValue(summary.confirmedRevenue)} em vendas confirmadas`;
    if (kpiInProgress) kpiInProgress.textContent = formatInt.format(summary.inProgress);
    if (kpiInProgressNote) {
      kpiInProgressNote.textContent = `${formatInt.format(summary.pendingPayment)} com pagamento pendente`;
    }
    if (kpiDispatched) kpiDispatched.textContent = formatInt.format(summary.dispatched);
    if (kpiDispatchedNote) {
      kpiDispatchedNote.textContent = `${formatInt.format(summary.delivered)} entregues`;
    }
    if (kpiCancelled) kpiCancelled.textContent = formatInt.format(summary.cancelled);
    if (kpiCancelledNote) {
      kpiCancelledNote.textContent = `${summary.totalOrders ? Math.round((summary.cancelled / summary.totalOrders) * 100) : 0}% da base`;
    }
  };
  const renderOrders = (list: OrderRow[]): void => {
    if (!ordersTableBody && !ordersMobileList) return;
    if (!list.length) {
      if (ordersTableBody) {
        ordersTableBody.innerHTML =
          '<tr><td class="table-cell" colspan="11">Nenhum pedido encontrado.</td></tr>';
      }
      if (ordersMobileList) {
        ordersMobileList.innerHTML =
          '<article class="rounded-xl border border-[#cfe7d1] bg-white px-4 py-4 text-xs text-text-muted">Nenhum pedido encontrado.</article>';
      }
      syncBulkUi();
      return;
    }
    if (ordersTableBody) {
      ordersTableBody.innerHTML = list
        .map((order) => {
          const badge = getBadge(order.status);
          const fBadge = getBadge(order.fulfillmentStatus);
          const total = formatCurrencyValue(order.total || 0);
          const createdLabel = formatDate(order.createdAt);
          const updatedLabel = formatDate(order.updatedAt);
          const checked = selectedOrderIds.has(order.id) ? " checked" : "";
          return `
        <tr data-order-row data-order-id="${order.id}" class="hover:bg-[#f6f8f6] transition-colors">
            <td class="table-cell">
                <input type="checkbox" class="h-4 w-4 rounded border-[#cfe7d1] text-primary focus:ring-primary" data-order-select data-order-id="${order.id}"${checked} aria-label="Selecionar pedido PV-${order.id}" />
            </td>
            <td class="table-cell">
                <button class="text-xs text-primary font-semibold hover:underline" type="button" data-order-action="edit">
                    PV-${order.id}
                </button>
            </td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${order.customerName || "-"}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${order.customerEmail || "-"}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${order.customerPhone || "-"}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge}">${statusPt(order.status)}</span></td>
            <td class="table-cell"><span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${fBadge}">${statusPt(order.fulfillmentStatus)}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${total}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${createdLabel}</span></td>
            <td class="table-cell"><span class="text-xs text-gray-900 font-body">${updatedLabel}</span></td>
            <td class="table-cell text-right">
                <div class="flex justify-end gap-2">
                    <button class="px-3 py-1.5 rounded-lg border border-[#cfe7d1] text-forest-green text-xs font-semibold" data-order-action="edit">Detalhes</button>
                    <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold" data-order-action="status">Atualizar</button>
                </div>
            </td>
        </tr>
      `;
        })
        .join("");
    }
    if (ordersMobileList) {
      ordersMobileList.innerHTML = list
        .map((order) => {
          const badge = getBadge(order.status);
          const fBadge = getBadge(order.fulfillmentStatus);
          return `
          <article class="rounded-xl border border-[#cfe7d1] bg-white px-4 py-4 shadow-sm" data-order-row data-order-id="${order.id}">
            <header class="flex items-start justify-between gap-3">
              <button type="button" class="text-sm font-semibold text-primary hover:underline" data-order-action="edit">PV-${order.id}</button>
              <span class="text-xs text-text-muted">${escapeHtml(formatDate(order.createdAt))}</span>
            </header>
            <div class="mt-3 space-y-2">
              <p class="text-sm font-semibold text-forest-green">${escapeHtml(order.customerName || "Cliente nao informado")}</p>
              <p class="text-xs text-text-muted">${escapeHtml(order.customerEmail || "-")}</p>
              <p class="text-xs text-text-muted">${escapeHtml(order.customerPhone || "-")}</p>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge}">${statusPt(order.status)}</span>
              <span class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${fBadge}">${statusPt(order.fulfillmentStatus)}</span>
            </div>
            <div class="mt-3 rounded-lg border border-[#e8f1e9] bg-[#f9fbf9] px-3 py-2">
              <p class="text-[11px] uppercase tracking-wider text-text-muted">Total</p>
              <p class="text-base font-semibold text-forest-green">${escapeHtml(formatCurrencyValue(order.total || 0))}</p>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button type="button" class="min-h-[44px] rounded-lg border border-[#cfe7d1] text-forest-green text-sm font-semibold hover:bg-[#f6f8f6]" data-order-action="edit">Detalhes</button>
              <button type="button" class="min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark" data-order-action="status">Atualizar</button>
            </div>
          </article>
        `;
        })
        .join("");
    }
    syncBulkUi();
  };

  const openOrderDetails = (order: OrderRow): void => {
    if (detailsTitle) {
      detailsTitle.textContent = `Pedido PV-${order.id}${order.publicCode ? ` (${order.publicCode})` : ""}`;
    }
    if (detailsStatus) {
      detailsStatus.className = `px-2.5 py-1 rounded-full border text-xs font-semibold ${getBadge(order.status)}`;
      detailsStatus.textContent = statusPt(order.status);
    }
    if (detailsFulfillment) {
      detailsFulfillment.className = `px-2.5 py-1 rounded-full border text-xs font-semibold ${getBadge(order.fulfillmentStatus)}`;
      detailsFulfillment.textContent = statusPt(order.fulfillmentStatus);
    }
    if (detailsTotal) detailsTotal.textContent = formatCurrencyValue(order.total);
    if (detailsCustomer) {
      detailsCustomer.textContent = `${order.customerName || "-"} | ${order.customerEmail || "-"} | ${
        order.customerPhone || "-"
      }`;
    }
    if (detailsCreated) detailsCreated.textContent = formatDate(order.createdAt);
    if (detailsUpdated) detailsUpdated.textContent = formatDate(order.updatedAt);
    if (detailsShipping) {
      const parts: string[] = [];
      if (order.shipmentCarrier) parts.push(`Transportadora: ${order.shipmentCarrier}`);
      if (order.shipmentTrackingCode) parts.push(`Rastreio: ${order.shipmentTrackingCode}`);
      if (order.fulfillmentNotes) parts.push(`Obs: ${order.fulfillmentNotes}`);
      detailsShipping.textContent = parts.length ? parts.join(" | ") : "Sem dados de envio registrados.";
    }
    if (detailsItems) {
      detailsItems.innerHTML = order.items.length
        ? order.items
            .map((item) => {
              const name = item.productName
                ? `Produto: ${item.productName}`
                : item.serviceName
                ? `Servico: ${item.serviceName}`
                : item.membershipTitle || item.membershipName
                ? `Assinatura: ${item.membershipTitle || item.membershipName}`
                : "Item";
              return `<tr><td class="table-cell text-xs">${escapeHtml(name)}</td><td class="table-cell text-xs">${
                item.quantity
              }</td><td class="table-cell text-xs">${formatCurrencyValue(item.unitPrice)}</td><td class="table-cell text-xs">${formatCurrencyValue(
                item.quantity * item.unitPrice
              )}</td></tr>`;
            })
            .join("")
        : '<tr><td class="table-cell" colspan="4">Nenhum item vinculado.</td></tr>';
    }
    if (detailsPayments) {
      detailsPayments.innerHTML = order.payments.length
        ? order.payments
            .map((payment) => {
              const pStatus = nPayment(payment.status);
              const pLabel = PAYMENT_LABEL[pStatus] || pStatus;
              return `<tr><td class="table-cell"><span class="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${getBadge(
                pStatus
              )}">${escapeHtml(pLabel)}</span></td><td class="table-cell text-xs">${formatCurrencyValue(
                payment.amount
              )}</td><td class="table-cell text-xs">${escapeHtml(
                payment.method || payment.provider || "-"
              )}</td><td class="table-cell text-xs">${escapeHtml(
                formatDate(payment.paidAt || payment.createdAt)
              )}</td></tr>`;
            })
            .join("")
        : '<tr><td class="table-cell" colspan="4">Nenhum pagamento vinculado.</td></tr>';
    }
    if (detailsHistory) {
      detailsHistory.innerHTML = order.statusHistory.length
        ? order.statusHistory
            .map((entry) => {
              const from = entry.fromStatus ? statusPt(entry.fromStatus) : "Inicial";
              const to = statusPt(entry.toStatus);
              return `<li class="text-xs text-gray-800 border border-[#e8f1e9] rounded-lg px-3 py-2"><strong>${escapeHtml(
                from
              )}</strong> -> <strong>${escapeHtml(to)}</strong> (${escapeHtml(entry.source || "SISTEMA")})${escapeHtml(
                entry.note ? ` - ${entry.note}` : ""
              )} | ${escapeHtml(formatDate(entry.createdAt))}</li>`;
            })
            .join("")
        : '<li class="text-xs text-text-muted">Sem movimentacoes registradas.</li>';
    }
    if (detailsDrawer) detailsDrawer.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  };

  const openOrderStatusModal = (order: OrderRow): void => {
    statusModalOrderId = order.id;
    if (statusTitle) statusTitle.textContent = `Pedido PV-${order.id}`;
    if (statusCurrent) statusCurrent.textContent = statusPt(order.status);
    if (fulfillmentCurrent) fulfillmentCurrent.textContent = statusPt(order.fulfillmentStatus);
    if (statusSelect) {
      statusSelect.innerHTML = ORDER_STATUS.map((code) => {
        const disabled =
          requiresApprovedPayment(order) && ["PAGO", "ENVIADO", "ENTREGUE"].includes(code) && code !== order.status;
        return `<option value="${code}"${disabled ? " disabled" : ""}>${statusPt(code)}${
          disabled ? " - pagamento aprovado necessario" : ""
        }</option>`;
      }).join("");
      statusSelect.value = order.status;
    }
    if (fulfillmentSelect) {
      fulfillmentSelect.innerHTML = FULFILLMENT_STATUS.map((code) => {
        const disabled =
          requiresApprovedPayment(order) &&
          ["SEPARANDO", "EMBALADO", "DESPACHADO", "ENVIADO", "ENTREGUE"].includes(code) &&
          code !== order.fulfillmentStatus;
        return `<option value="${code}"${disabled ? " disabled" : ""}>${statusPt(code)}${
          disabled ? " - pagamento aprovado necessario" : ""
        }</option>`;
      }).join("");
      fulfillmentSelect.value = order.fulfillmentStatus;
    }
    if (carrierInput) carrierInput.value = order.shipmentCarrier || "";
    if (trackingInput) trackingInput.value = order.shipmentTrackingCode || "";
    if (notesInput) notesInput.value = order.fulfillmentNotes || "";
    if (statusError) {
      statusError.textContent = requiresApprovedPayment(order)
        ? "Pedido com pagamento pendente. Avanco para entrega/despacho esta bloqueado."
        : "";
      statusError.classList.toggle("hidden", !statusError.textContent);
    }
    if (statusModal) {
      statusModal.classList.remove("hidden");
      statusModal.classList.add("flex");
      document.body.classList.add("overflow-hidden");
    }
  };

  const updateOrdersPagination = (list: OrderRow[]): void => {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / ordersPageSize));
    if (ordersPage > totalPages) ordersPage = totalPages;
    if (ordersPage < 1) ordersPage = 1;
    const startIndex = total === 0 ? 0 : (ordersPage - 1) * ordersPageSize + 1;
    const endIndex = Math.min(ordersPage * ordersPageSize, total);
    if (ordersPaginationRange) {
      ordersPaginationRange.textContent =
        total === 0
          ? "Nenhum pedido encontrado"
          : `Mostrando ${startIndex}-${endIndex} de ${total} pedidos`;
    }
    if (ordersPaginationPage) {
      ordersPaginationPage.textContent = `Pagina ${ordersPage} de ${totalPages}`;
    }
    if (ordersPageFirst) {
      ordersPageFirst.disabled = ordersPage <= 1;
      ordersPageFirst.classList.toggle("opacity-50", ordersPage <= 1);
    }
    if (ordersPagePrev) {
      ordersPagePrev.disabled = ordersPage <= 1;
      ordersPagePrev.classList.toggle("opacity-50", ordersPage <= 1);
    }
    if (ordersPageNext) {
      ordersPageNext.disabled = ordersPage >= totalPages;
      ordersPageNext.classList.toggle("opacity-50", ordersPage >= totalPages);
    }
    if (ordersPageLast) {
      ordersPageLast.disabled = ordersPage >= totalPages;
      ordersPageLast.classList.toggle("opacity-50", ordersPage >= totalPages);
    }
    const sliceStart = (ordersPage - 1) * ordersPageSize;
    const sliceEnd = sliceStart + ordersPageSize;
    const pageItems = total === 0 ? [] : list.slice(sliceStart, sliceEnd);
    renderOrders(pageItems);
  };

  const applyOrderFilters = (resetPage = false): void => {
    if (resetPage) ordersPage = 1;
    const query = ordersSearch?.value.trim().toLowerCase() || "";
    const status = nOrder(ordersStatusFilter?.value || "");
    const fulfillment = nFulfillment(ordersFulfillmentFilter?.value || "");
    const filtered = ordersCache.filter((order) => {
      const matchesQuery =
        !query ||
        String(order.id).includes(query) ||
        (order.customerName || "").toLowerCase().includes(query) ||
        (order.customerEmail || "").toLowerCase().includes(query);
      const matchesStatus = !status || order.status === status;
      const matchesFulfillment = !fulfillment || order.fulfillmentStatus === fulfillment;
      return matchesQuery && matchesStatus && matchesFulfillment;
    });
    updateOrdersPagination(filtered);
  };

  const fetchOrders = async (): Promise<void> => {
    const [rows, summary] = await Promise.all([
      apiJson<ApiOrderRow[]>("/orders"),
      apiJson<ApiOrderSummary>("/orders/summary").catch(() => null),
    ]);
    ordersCache = rows.map((row) => ({
      id: row.id,
      publicCode: row.publicCode || null,
      status: nOrder(row.status) || "PENDENTE",
      fulfillmentStatus: nFulfillment(row.fulfillmentStatus) || "PENDENTE",
      total: toNumber(row.total),
      customerName: row.customerName || null,
      customerEmail: row.customerEmail || null,
      customerPhone: row.customerPhone || null,
      shipmentTrackingCode: row.shipmentTrackingCode || null,
      shipmentCarrier: row.shipmentCarrier || null,
      fulfillmentNotes: row.fulfillmentNotes || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      items: Array.isArray(row.items)
        ? row.items.map((item) => ({
            id: item.id,
            productId: item.productId ?? null,
            membershipId: item.membershipId ?? null,
            serviceId: item.serviceId ?? null,
            quantity: Math.max(1, Math.floor(toNumber(item.quantity || 1))),
            unitPrice: toNumber(item.unitPrice),
            productName: item.product?.name || null,
            serviceName: item.service?.name || null,
            membershipName: item.membership?.name || null,
            membershipTitle: item.membership?.title || null,
          }))
        : [],
      payments: Array.isArray(row.payments)
        ? row.payments.map((payment) => ({
            id: payment.id,
            status: nPayment(payment.status),
            provider: payment.provider || null,
            method: payment.method || null,
            amount: toNumber(payment.amount),
            paidAt: payment.paidAt || null,
            createdAt: payment.createdAt || null,
          }))
        : [],
      statusHistory: Array.isArray(row.statusHistory)
        ? row.statusHistory.map((entry) => ({
            id: entry.id,
            fromStatus: nOrder(entry.fromStatus) || null,
            toStatus: nOrder(entry.toStatus) || "PENDENTE",
            source: entry.source || null,
            note: entry.note || null,
            createdAt: entry.createdAt || null,
          }))
        : [],
    }));
    const orderIdSet = new Set(ordersCache.map((order) => order.id));
    selectedOrderIds = new Set(Array.from(selectedOrderIds).filter((orderId) => orderIdSet.has(orderId)));
    if (summary) {
      applyKpis(summary);
    } else {
      const fallbackSummary: ApiOrderSummary = {
        totalOrders: ordersCache.length,
        inProgress: ordersCache.filter((o) => ["PENDENTE", "SEPARANDO", "EMBALADO"].includes(o.fulfillmentStatus))
          .length,
        dispatched: ordersCache.filter((o) => ["DESPACHADO", "ENVIADO", "ENTREGUE"].includes(o.fulfillmentStatus))
          .length,
        delivered: ordersCache.filter((o) => o.fulfillmentStatus === "ENTREGUE").length,
        cancelled: ordersCache.filter((o) => o.status === "CANCELADO").length,
        pendingPayment: ordersCache.filter((o) => requiresApprovedPayment(o)).length,
        confirmedRevenue: ordersCache.reduce((acc, o) => {
          if (["PAGO", "ENVIADO", "ENTREGUE"].includes(o.status)) return acc + o.total;
          return acc;
        }, 0),
      };
      applyKpis(fallbackSummary);
    }
    applyOrderFilters(true);
  };

  if (ordersSearch) addCleanup(on(ordersSearch, "input", () => applyOrderFilters(true)));
  if (ordersStatusFilter) addCleanup(on(ordersStatusFilter, "change", () => applyOrderFilters(true)));
  if (ordersFulfillmentFilter) {
    addCleanup(on(ordersFulfillmentFilter, "change", () => applyOrderFilters(true)));
  }
  if (ordersPageSizeSelect) {
    addCleanup(
      on(ordersPageSizeSelect, "change", () => {
        const nextSize = Number(ordersPageSizeSelect.value);
        ordersPageSize = Number.isFinite(nextSize) && nextSize > 0 ? nextSize : 10;
        ordersPage = 1;
        applyOrderFilters();
      })
    );
  }
  if (ordersPageFirst) {
    addCleanup(
      on(ordersPageFirst, "click", () => {
        if (ordersPage <= 1) return;
        ordersPage = 1;
        applyOrderFilters();
      })
    );
  }
  if (ordersPagePrev) {
    addCleanup(
      on(ordersPagePrev, "click", () => {
        if (ordersPage <= 1) return;
        ordersPage -= 1;
        applyOrderFilters();
      })
    );
  }
  if (ordersPageNext) {
    addCleanup(
      on(ordersPageNext, "click", () => {
        ordersPage += 1;
        applyOrderFilters();
      })
    );
  }
  if (ordersPageLast) {
    addCleanup(
      on(ordersPageLast, "click", () => {
        ordersPage = Number.MAX_SAFE_INTEGER;
        applyOrderFilters();
      })
    );
  }
  if (ordersTableBody) {
    addCleanup(
      on(ordersTableBody, "change", (event) => {
        const target = event.target as HTMLElement | null;
        const checkbox = target?.closest("[data-order-select]") as HTMLInputElement | null;
        if (!checkbox) return;
        const orderId = Number(checkbox.getAttribute("data-order-id"));
        if (!Number.isFinite(orderId)) return;
        if (checkbox.checked) {
          selectedOrderIds.add(orderId);
        } else {
          selectedOrderIds.delete(orderId);
        }
        syncBulkUi();
      })
    );
    addCleanup(
      on(ordersTableBody, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const action = target?.closest("[data-order-action]")?.getAttribute("data-order-action");
        const row = target?.closest("[data-order-row]") as HTMLElement | null;
        if (!row || (action !== "status" && action !== "edit")) return;
        const orderId = Number(row.getAttribute("data-order-id"));
        const order = ordersCache.find((item) => item.id === orderId);
        if (!order) return;
        if (action === "edit") {
          openOrderDetails(order);
          return;
        }
        openOrderStatusModal(order);
      })
    );
  }
  if (ordersMobileList) {
    addCleanup(
      on(ordersMobileList, "click", async (event) => {
        const target = event.target as HTMLElement | null;
        const action = target?.closest("[data-order-action]")?.getAttribute("data-order-action");
        const row = target?.closest("[data-order-row]") as HTMLElement | null;
        if (!row || (action !== "status" && action !== "edit")) return;
        const orderId = Number(row.getAttribute("data-order-id"));
        const order = ordersCache.find((item) => item.id === orderId);
        if (!order) return;
        if (action === "edit") {
          openOrderDetails(order);
          return;
        }
        openOrderStatusModal(order);
      })
    );
  }
  if (ordersSelectAll && ordersTableBody) {
    addCleanup(
      on(ordersSelectAll, "change", () => {
        const pageCheckboxes = Array.from(
          ordersTableBody.querySelectorAll<HTMLInputElement>("[data-order-select]")
        );
        pageCheckboxes.forEach((checkbox) => {
          const orderId = Number(checkbox.getAttribute("data-order-id"));
          if (!Number.isFinite(orderId)) return;
          checkbox.checked = ordersSelectAll.checked;
          if (ordersSelectAll.checked) {
            selectedOrderIds.add(orderId);
          } else {
            selectedOrderIds.delete(orderId);
          }
        });
        syncBulkUi();
      })
    );
  }
  if (ordersBulkNextBtn) {
    addCleanup(
      on(ordersBulkNextBtn, "click", async () => {
        if (isBulkAdvancing || selectedOrderIds.size === 0) return;
        isBulkAdvancing = true;
        syncBulkUi();
        setBulkStatus("Aplicando proxima etapa nos pedidos selecionados...");
        const orderIds = Array.from(selectedOrderIds);
        const response = await apiJson<ApiOrderBulkAdvanceResponse>("/orders/bulk/advance", {
          method: "PATCH",
          body: JSON.stringify({ orderIds }),
        }).catch((error: unknown) => {
          setBulkStatus(error instanceof Error ? error.message : "Falha ao processar operacao em lote.", true);
          return null;
        });
        isBulkAdvancing = false;
        if (!response) {
          syncBulkUi();
          return;
        }
        selectedOrderIds.clear();
        syncBulkUi();
        const paymentBlocked = response.results.filter((item) => item.reason === "pagamento aprovado necessario para avancar o pedido").length;
        setBulkStatus(
          `${formatInt.format(response.updatedCount)} atualizados, ${formatInt.format(
            response.skippedCount
          )} ignorados${paymentBlocked ? ` (${formatInt.format(paymentBlocked)} sem pagamento aprovado)` : ""}.`
        );
        await fetchOrders();
      })
    );
  }

  if (statusSaveBtn) {
    addCleanup(
      on(statusSaveBtn, "click", async () => {
        if (isStatusSaving || statusModalOrderId === null || !statusSelect) return;
        const order = ordersCache.find((item) => item.id === statusModalOrderId);
        if (!order) return;
        const next = nOrder(statusSelect.value);
        if (!next || next === order.status) return;
        if (requiresApprovedPayment(order) && ["PAGO", "ENVIADO", "ENTREGUE"].includes(next)) {
          if (statusError) {
            statusError.textContent = "Pagamento aprovado necessario para avancar este pedido.";
            statusError.classList.remove("hidden");
          }
          return;
        }
        isStatusSaving = true;
        statusSaveBtn.disabled = true;
        await apiJson(`/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) }).catch(
          (error: unknown) => {
            if (statusError) {
              statusError.textContent = error instanceof Error ? error.message : "Falha ao atualizar status.";
              statusError.classList.remove("hidden");
            }
          }
        );
        isStatusSaving = false;
        statusSaveBtn.disabled = false;
        if (statusModal) {
          statusModal.classList.add("hidden");
          statusModal.classList.remove("flex");
        }
        if (!detailsDrawer || detailsDrawer.classList.contains("hidden")) document.body.classList.remove("overflow-hidden");
        await fetchOrders();
      })
    );
  }
  if (fulfillmentSaveBtn) {
    addCleanup(
      on(fulfillmentSaveBtn, "click", async () => {
        if (
          isFulfillmentSaving ||
          statusModalOrderId === null ||
          !fulfillmentSelect ||
          !carrierInput ||
          !trackingInput ||
          !notesInput
        ) {
          return;
        }
        const order = ordersCache.find((item) => item.id === statusModalOrderId);
        if (!order) return;
        const next = nFulfillment(fulfillmentSelect.value) || "PENDENTE";
        if (
          requiresApprovedPayment(order) &&
          ["SEPARANDO", "EMBALADO", "DESPACHADO", "ENVIADO", "ENTREGUE"].includes(next)
        ) {
          if (statusError) {
            statusError.textContent = "Pagamento aprovado necessario para avancar o despacho.";
            statusError.classList.remove("hidden");
          }
          return;
        }
        isFulfillmentSaving = true;
        fulfillmentSaveBtn.disabled = true;
        await apiJson(`/orders/${order.id}/fulfillment`, {
          method: "PATCH",
          body: JSON.stringify({
            fulfillmentStatus: next,
            shipmentCarrier: carrierInput.value.trim() || null,
            shipmentTrackingCode: trackingInput.value.trim() || null,
            fulfillmentNotes: notesInput.value.trim() || null,
          }),
        }).catch((error: unknown) => {
          if (statusError) {
            statusError.textContent = error instanceof Error ? error.message : "Falha ao atualizar despacho.";
            statusError.classList.remove("hidden");
          }
        });
        isFulfillmentSaving = false;
        fulfillmentSaveBtn.disabled = false;
        if (statusModal) {
          statusModal.classList.add("hidden");
          statusModal.classList.remove("flex");
        }
        if (!detailsDrawer || detailsDrawer.classList.contains("hidden")) document.body.classList.remove("overflow-hidden");
        await fetchOrders();
      })
    );
  }
  document.querySelectorAll("[data-order-status-cancel]").forEach((btn) => {
    addCleanup(
      on(btn, "click", () => {
        statusModalOrderId = null;
        if (statusModal) {
          statusModal.classList.add("hidden");
          statusModal.classList.remove("flex");
        }
        if (!detailsDrawer || detailsDrawer.classList.contains("hidden")) document.body.classList.remove("overflow-hidden");
      })
    );
  });
  document.querySelectorAll("[data-order-details-close]").forEach((btn) => {
    addCleanup(
      on(btn, "click", () => {
        if (detailsDrawer) detailsDrawer.classList.add("hidden");
        if (!statusModal || statusModal.classList.contains("hidden")) document.body.classList.remove("overflow-hidden");
      })
    );
  });
  addCleanup(
    on(document, "keydown", (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== "Escape") return;
      if (statusModal && !statusModal.classList.contains("hidden")) {
        statusModal.classList.add("hidden");
        statusModal.classList.remove("flex");
        if (!detailsDrawer || detailsDrawer.classList.contains("hidden")) document.body.classList.remove("overflow-hidden");
        return;
      }
      if (detailsDrawer && !detailsDrawer.classList.contains("hidden")) {
        detailsDrawer.classList.add("hidden");
        if (!statusModal || statusModal.classList.contains("hidden")) document.body.classList.remove("overflow-hidden");
      }
    })
  );

  fetchOrders().catch(() => undefined);
  syncBulkUi();

  return { refresh: fetchOrders };
};

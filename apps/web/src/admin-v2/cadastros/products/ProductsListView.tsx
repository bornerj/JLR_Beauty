import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
import { logger } from "../../../utils/logger";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "../../shared/api";
import { formatCurrencyBRL } from "../../shared/format";
import { DeleteConfirmModal } from "../../shell/DeleteConfirmModal";
import { ProductFormModal } from "./components/ProductFormModal";
import type { Product, ProductInput, ProductStatusColorValue } from "./types";

/**
 * Admin V2 (PLAN-0026, Onda 11) — Cadastro de Produtos, tier G, a tela mais pesada do plano
 * (upload de imagem, benefícios, min/max de estoque, estoque real por unidade). Reusa
 * `/api/products` sem alteração (`DECISION-014` regra #2). Legado tinha `behavior.ts`
 * imperativo (973 linhas) + 450 de markup, reescrito como React declarativo.
 *
 * **Decisões de modernização documentadas**:
 * 1. A tabela mostra "Estoque total" (`Product.stock`, cache global mantido pelo backend
 *    via `syncProductGlobalStock`, ver `types.ts`) em vez da coluna "Patrimônio" do legado
 *    (`preço × estoque`) — patrimônio por si só não é uma métrica que a tela precisa
 *    destacar por linha; estoque em si já comunica o essencial na lista, e o detalhamento
 *    por unidade continua no painel de edição (`/inventory/cross-unit`, sob demanda).
 * 2. Os 4 cards de resumo do topo do legado ("Produtos ativos: 128", "Baixo estoque: 9",
 *    etc.) eram **números estáticos fabricados no JSX**, nunca calculados por
 *    `behavior.ts` — não portados (não é regra de negócio real, é dado fake que nunca
 *    existiu de verdade).
 * 3. ~~Paginação numerada do legado não reproduzida — mesmo padrão das Ondas 4/8 (tabela
 *    rolável com busca + filtros).~~ Revertido no `PLAN-0032` ocorrência #3 (pedido
 *    explícito do usuário): paginação client-side adicionada, mesmo componente/posição
 *    da Lista de Pedidos (`operations/orders/OrdersListView.tsx`) — linha de navegação
 *    logo após os filtros, acima da grid.
 *
 * **Achado de backend confirmado por E2E real (fora do escopo desta onda, `DECISION-014`
 * regra #2 — sem mudança de backend)**: `DELETE /products/:id` falha com 500 (não 409) pra
 * qualquer produto que já teve pelo menos 1 movimento de estoque — `StockMovement.product`
 * não tem `onDelete: Cascade` no schema (diferente de `ProductStock`, que tem). Mensagem de
 * erro do backend já aparece no `DeleteConfirmModal` tal como veio (sem fabricar uma
 * explicação melhor que a real).
 */

const COLOR_BADGE_CLASS: Record<ProductStatusColorValue, string> = {
  VERDE: "bg-state-healthy/15 text-state-healthy",
  AMARELO: "bg-state-attention/15 text-state-attention",
  VERMELHO: "bg-state-critical/15 text-state-critical",
  CINZA: "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300",
};

type ListState = { loading: boolean; data: Product[] | null; error: string | null };
type FormModalState = { mode: "create" } | { mode: "edit"; product: Product } | null;
type DeleteModalState = { product: Product } | null;
type MutationState = { submitting: boolean; error: string | null };

// PLAN-0032 ocorrência #3 — mesmo padrão de paginação client-side da Lista de Pedidos.
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const parseDecimal = (value: string | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function ProductsListView() {
  const [state, setState] = useState<ListState>({ loading: true, data: null, error: null });
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);
  const [mutation, setMutation] = useState<MutationState>({ submitting: false, error: null });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ loading: false, data: null, error: "Sessão expirada. Faça login novamente." });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchProducts({ token });
      setState({ loading: false, data, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar os produtos.";
      logger.warn("Falha ao carregar Produtos (Admin V2)", { error: message });
      setState((prev) => ({ loading: false, data: prev.data, error: message }));
    }
  }, []);

  useEffect(() => {
    // ERR-0084 — mesmo fix do ERR-0083: adia a chamada em 1 tick pra sair do
    // commit síncrono do efeito (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of state.data ?? []) {
      if (p.productCategory) map.set(p.productCategory.id, p.productCategory.name);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [state.data]);

  const statuses = useMemo(() => {
    const map = new Map<number, { name: string; color: ProductStatusColorValue | null }>();
    for (const p of state.data ?? []) {
      if (p.productStatus) map.set(p.productStatus.id, { name: p.productStatus.name, color: p.productStatus.color });
    }
    return Array.from(map.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name, "pt-BR"));
  }, [state.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (state.data ?? []).filter((p) => {
      const matchesQuery =
        !query || p.name.toLowerCase().includes(query) || (p.sku ?? "").toLowerCase().includes(query) || (p.description ?? "").toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || String(p.productCategory?.id ?? "") === categoryFilter;
      const matchesStatus = !statusFilter || String(p.productStatus?.id ?? "") === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [state.data, search, categoryFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageProducts = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, pageSize]);

  const handleSubmit = useCallback(
    async (input: ProductInput) => {
      const token = getToken();
      if (!token || !formModal) return;
      setMutation({ submitting: true, error: null });
      try {
        if (formModal.mode === "edit") {
          await updateProduct({ token, id: formModal.product.id, input });
        } else {
          await createProduct({ token, input });
        }
        setFormModal(null);
        setMutation({ submitting: false, error: null });
        void load();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar o produto.";
        logger.warn("Falha ao salvar produto (Admin V2)", { error: message });
        setMutation({ submitting: false, error: message });
      }
    },
    [formModal, load]
  );

  const handleDelete = useCallback(async () => {
    const token = getToken();
    if (!token || !deleteModal) return;
    setMutation({ submitting: true, error: null });
    try {
      await deleteProduct({ token, id: deleteModal.product.id });
      setDeleteModal(null);
      setMutation({ submitting: false, error: null });
      void load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir o produto.";
      logger.warn("Falha ao excluir produto (Admin V2)", { error: message });
      setMutation({ submitting: false, error: message });
    }
  }, [deleteModal, load]);

  if (state.loading && !state.data) {
    return <p className="text-base text-stone-600 dark:text-stone-400">Carregando produtos…</p>;
  }

  if (state.error && !state.data) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-white p-5">
        <p className="text-sm font-semibold text-red-600">Falha ao carregar os produtos.</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{state.error}</p>
        <div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.data) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-forest">Produtos</h1>
          <p className="text-base text-stone-600 dark:text-stone-400">
            catálogo com categoria, status, preço e estoque por unidade · {filtered.length}/{state.data.length} produto(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormModal({ mode: "create" })}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
        >
          + Novo produto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, SKU ou descrição…"
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todas as categorias</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-primary/60 bg-white px-3 py-2 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
        >
          <option value="">Todos os status</option>
          {statuses.map(([id, s]) => (
            <option key={id} value={id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* PLAN-0032 ocorrência #3: mesma linha de navegação/paginação da Lista de Pedidos,
          logo após os filtros, acima da grid. */}
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
          Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} produtos ·
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

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500 dark:text-stone-400">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#cfe7d1] bg-white dark:border-forest-green dark:bg-forest">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#cfe7d1] text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-forest-green dark:text-stone-400">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Estoque total</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Custo</th>
                <th className="px-4 py-3">Destaque</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageProducts.map((product) => {
                const price = parseDecimal(product.price);
                const cost = parseDecimal(product.costPrice);
                return (
                  <tr key={product.id} className="border-b border-stone-100 last:border-0 dark:border-forest-green/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold/30 bg-primary/5">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-forest">{product.name}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{product.sku ? `SKU: ${product.sku}` : `PRD-${product.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-forest">{product.productCategory?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      {product.productStatus ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COLOR_BADGE_CLASS[product.productStatus.color ?? "CINZA"]}`}>
                          {product.productStatus.name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.stock <= product.minStock
                            ? "font-semibold text-state-critical"
                            : "text-forest"
                        }
                      >
                        {product.stock}
                      </span>
                      {product.minStock > 0 && (
                        <span className="ml-1 text-xs text-stone-500 dark:text-stone-400">/ mín. {product.minStock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-forest">{price !== null ? formatCurrencyBRL(price) : "—"}</td>
                    <td className="px-4 py-3 text-forest">{cost !== null ? formatCurrencyBRL(cost) : "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.isFeatured
                            ? "bg-state-healthy/15 text-state-healthy"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                        }`}
                      >
                        {product.isFeatured ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormModal({ mode: "edit", product })}
                          title="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-forest hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ product })}
                          title="Excluir"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-state-critical hover:bg-state-critical/10"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formModal && (
        <ProductFormModal
          editing={formModal.mode === "edit" ? formModal.product : null}
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setFormModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onSubmit={(input) => void handleSubmit(input)}
        />
      )}

      {deleteModal && (
        <DeleteConfirmModal
          title={`Excluir "${deleteModal.product.name}"?`}
          description="Essa ação não pode ser desfeita. Pedidos já feitos com este produto não são afetados retroativamente, mas ele deixa de existir pra novas vendas."
          submitting={mutation.submitting}
          error={mutation.error}
          onCancel={() => {
            setDeleteModal(null);
            setMutation({ submitting: false, error: null });
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}

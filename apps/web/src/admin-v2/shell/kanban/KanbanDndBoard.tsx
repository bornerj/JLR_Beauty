import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import type { CSSProperties, ReactNode } from "react";

/**
 * Admin V2 (PLAN-0029) — primitiva reusável de drag-and-drop pra kanban (`Operação >
 * Pedidos`, `Crescimento > Franquias`, e qualquer kanban futuro do Admin V2). Usa
 * `@dnd-kit/core` (mantido ativamente, compatível com React 19 — `react-beautiful-dnd`
 * está arquivada; a API nativa HTML5 exigiria reconstruir acessibilidade/touch do zero,
 * ver `PLAN-0029`).
 *
 * Desenho: cada board mantém seu próprio card (`OrderCardView`/`LeadCard`) e sua própria
 * lógica de coluna — esta primitiva só cuida do mecanismo de arrastar/soltar. Colunas podem
 * ser `droppable: false` (não aceitam soltar) e cards podem ser `draggable: false`
 * (não podem ser pegos) — cobre o caso de colunas que são alertas/estados automáticos, não
 * etapas manuais (ex.: "Atenção"/"Entraram" no Board de Pedidos, `PLAN-0029`).
 *
 * IDs são prefixados (`card:`/`column:`) pra nunca colidir entre os dois registros internos
 * do dnd-kit, mesmo que o board use o mesmo valor bruto (ex.: `orderId` igual a uma chave de
 * coluna por coincidência).
 */

const CARD_PREFIX = "card:";
const COLUMN_PREFIX = "column:";

export function KanbanDndProvider({
  onCardDrop,
  children,
}: {
  /** Chamado quando um card é solto numa coluna droppable diferente da de origem. */
  onCardDrop: (cardId: string, columnId: string) => void;
  children: ReactNode;
}) {
  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over) return;
    const cardId = String(active.id).replace(CARD_PREFIX, "");
    const columnId = String(over.id).replace(COLUMN_PREFIX, "");
    onCardDrop(cardId, columnId);
  };

  return <DndContext onDragEnd={handleDragEnd}>{children}</DndContext>;
}

export function KanbanDroppableColumn({
  columnId,
  droppable,
  className,
  children,
}: {
  columnId: string;
  droppable: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${COLUMN_PREFIX}${columnId}`, disabled: !droppable });
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} ${isOver && droppable ? "rounded-lg ring-2 ring-primary/50" : ""}`}
    >
      {children}
    </div>
  );
}

export function KanbanDraggableCard({
  cardId,
  draggable,
  disabled,
  children,
}: {
  cardId: string;
  /** false = card fixo, não pode ser arrastado (ex.: pedido numa coluna de alerta). */
  draggable: boolean;
  /** true = arrastar temporariamente desabilitado (ex.: já existe uma movimentação em andamento pra este card). */
  disabled?: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${CARD_PREFIX}${cardId}`,
    disabled: !draggable || disabled,
  });

  const style: CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.6 : 1,
        position: "relative",
        cursor: draggable ? "grab" : undefined,
      }
    : draggable
      ? { cursor: "grab" }
      : undefined;

  return (
    <div ref={setNodeRef} style={style} {...(draggable ? { ...listeners, ...attributes } : {})}>
      {children}
    </div>
  );
}

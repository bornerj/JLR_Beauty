/** Admin V2 (PLAN-0022, Onda 3) — Board Operacional de Pedidos (RETROFIT-004). */

export type OperationalOrderState = "NORMAL" | "ATTENTION" | "STALLED" | "OVERDUE" | "BLOCKED";

export type OperationalOrderCard = {
  orderId: number;
  publicCode: string | null;
  total: number;
  status: string;
  fulfillmentStatus: string;
  operationalState: OperationalOrderState;
  reason: string | null;
  ageMinutes: number;
};

export type OrdersBoardColumn = {
  count: number;
  totalValue: number;
  /** Amostra dos pedidos mais antigos da coluna (limitada — ver MAX_SAMPLE_PER_COLUMN em service.ts). */
  orders: OperationalOrderCard[];
};

export type OrdersBoard = {
  period: { from: string; to: string; days: number };
  columns: {
    entraram: OrdersBoardColumn;
    emPreparacao: OrdersBoardColumn;
    atencao: OrdersBoardColumn;
    prontos: OrdersBoardColumn;
  };
};

export type FlowTransition = {
  from: string;
  to: string;
  averageMinutes: number | null;
  sampleSize: number;
  isBottleneck: boolean;
};

export type OrdersFlow = {
  period: { from: string; to: string; days: number };
  transitions: FlowTransition[];
};

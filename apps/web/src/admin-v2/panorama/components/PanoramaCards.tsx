import { DrillCard } from "../../shell/DrillCard";
import { formatCurrencyBRL, formatSignedPercent, formatSignedPp } from "../../shared/format";
import type { PanoramaCustomers, PanoramaFinancial, PanoramaNetwork, PanoramaOperations } from "../types";

/** Admin V2 (PLAN-0022, Onda 1) — blocos do Panorama Vivo (RETROFIT-001). Nenhum é decorativo: cada um resume um recorte real do negócio e aponta para o drill-down correspondente. */

export function NetworkSummaryCard({ network, onDrillDown }: { network: PanoramaNetwork; onDrillDown: () => void }) {
  return (
    <DrillCard title="Rede" action="Explorar rede" onDrillDown={onDrillDown}>
      <p className="text-3xl font-bold text-forest">{network.units} unidades</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5 text-state-healthy">
          <span className="h-2 w-2 rounded-full bg-state-healthy" /> {network.takeoff + network.healthy} saudáveis
        </span>
        <span className="flex items-center gap-1.5 text-state-attention">
          <span className="h-2 w-2 rounded-full bg-state-attention" /> {network.attention} atenção
        </span>
        <span className="flex items-center gap-1.5 text-state-critical">
          <span className="h-2 w-2 rounded-full bg-state-critical" /> {network.critical} críticas
        </span>
      </div>
    </DrillCard>
  );
}

export function OperationsSummaryCard({
  operations,
  onDrillDown,
}: {
  operations: PanoramaOperations;
  onDrillDown: () => void;
}) {
  return (
    <DrillCard title="Operação agora" action="Explorar operação" onDrillDown={onDrillDown}>
      <ul className="flex flex-col gap-1.5 text-sm text-forest">
        <li>
          <strong className="text-lg">{operations.ordersNeedingAttention}</strong> pedido(s) precisam de atenção
        </li>
        <li>
          <strong className="text-lg">{operations.stockAlerts}</strong> alerta(s) de estoque
        </li>
        <li>
          <strong className="text-lg">{operations.lowOccupancyUnits}</strong> unidade(s) com ocupação abaixo de 50%
        </li>
      </ul>
    </DrillCard>
  );
}

export function FinancialSummaryCard({ financial }: { financial: PanoramaFinancial }) {
  return (
    <DrillCard title="Resultado">
      <p className="text-3xl font-bold text-forest">{formatCurrencyBRL(financial.revenue)}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-base text-stone-600 dark:text-stone-400">
        <span>
          Receita{" "}
          <strong className={financial.revenueTrendPercent >= 0 ? "text-state-healthy" : "text-state-critical"}>
            {formatSignedPercent(financial.revenueTrendPercent)}
          </strong>
        </span>
        <span>
          Margem <strong className="text-forest">{financial.marginPercent.toFixed(1)}%</strong>{" "}
          <span className={financial.marginTrendPp >= 0 ? "text-state-healthy" : "text-state-critical"}>
            ({formatSignedPp(financial.marginTrendPp)})
          </span>
        </span>
      </div>
    </DrillCard>
  );
}

export function CustomerSummaryCard({ customers }: { customers: PanoramaCustomers }) {
  return (
    <DrillCard title="Clientes" action="Explorar clientes">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-forest">
        <span>
          <strong className="text-lg">{customers.newInPeriod}</strong> novos
        </span>
        <span>
          <strong className="text-lg">{customers.recurrenceRate.toFixed(0)}%</strong> recorrência
        </span>
        <span className="text-state-attention">
          <strong className="text-lg">{customers.atRisk}</strong> em risco
        </span>
      </div>
    </DrillCard>
  );
}

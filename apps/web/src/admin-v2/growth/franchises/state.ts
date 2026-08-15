import type { FranchiseStage } from "./types";

/** Admin V2 (PLAN-0022, Onda 9) — rótulos pt-BR das etapas do pipeline comercial (RETROFIT-010). */

export const STAGE_LABELS: Record<FranchiseStage, string> = {
  INTERESSADO: "Interessados",
  QUALIFICADO: "Qualificados",
  REUNIAO: "Reunião",
  PROPOSTA: "Proposta",
  NEGOCIACAO: "Negociação",
  CONTRATO: "Contrato",
  IMPLANTACAO: "Implantação",
};

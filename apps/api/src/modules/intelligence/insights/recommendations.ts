import type { Insight, RecommendedAction } from "./types";

/**
 * Admin V2 (PLAN-0023, Onda 7) — Ações Recomendadas (RETROFIT-019).
 * Catálogo fixo, determinístico, por categoria — não é ML, é um "manual de próximos
 * passos" que responde "o que posso fazer agora?" além de "ver a tela".
 *
 * Decisão de escopo (alinhada com o usuário antes de implementar): o mockup original
 * ("[Criar campanha] [Ajustar preço] [Falar com franqueado]") pressupõe ações que
 * executam algo no sistema. Hoje o Admin V2 só tem UMA tela de escrita real (mover
 * etapa do Pipeline de Franquias, RETROFIT-010b) — o Admin legado não suporta deep-link
 * confiável pra sub-telas (já documentado na Onda 2 do PLAN-0022). Por isso:
 * `actionPath` só é preenchido quando existe uma rota real pra ir junto; do contrário é
 * `null` — a sugestão aparece como texto (conselho de negócio), nunca como botão morto.
 */
const CATEGORY_RECOMMENDATIONS: Record<string, RecommendedAction[]> = {
  Rede: [{ label: "Priorize contato com a gerência da unidade — causas fora do sistema (equipe, local) não aparecem nos dados.", actionPath: null }],
  Operação: [{ label: "Separe os pedidos mais antigos primeiro e confirme com a transportadora os que já saíram.", actionPath: null }],
  Agenda: [{ label: "Ofereça os horários ociosos com desconto ou prioridade de encaixe para preencher a agenda.", actionPath: null }],
  Portfólio: [{ label: "Avalie promoção de liquidação ou renegociação de custo com o fornecedor para o produto parado.", actionPath: null }],
  Serviços: [{ label: "Reavalie o preço do serviço ou o tempo alocado na agenda para ele.", actionPath: null }],
  Clientes: [{ label: "Envie uma oferta de reativação personalizada para os clientes em risco.", actionPath: null }],
  Assinaturas: [{ label: "Entre em contato antes do próximo ciclo de cobrança para oferecer retenção.", actionPath: null }],
  Franquias: [{ label: "Mova o lead para a etapa correta e agende um follow-up com o interessado.", actionPath: "/admin-v2/crescimento" }],
  Financeiro: [{ label: "Detalhe por unidade, produto e canal onde a receita variou mais.", actionPath: "/admin-v2/dinheiro" }],
  Comparador: [{ label: "Aplique na unidade mais fraca o que já funciona na unidade de referência.", actionPath: null }],
};

/** Sem entrada no catálogo → lista vazia, nunca uma sugestão genérica fabricada. */
export const getRecommendedActions = (category: string): RecommendedAction[] => CATEGORY_RECOMMENDATIONS[category] ?? [];

export const attachRecommendedActions = (insights: Array<Omit<Insight, "recommendedActions">>): Insight[] =>
  insights.map((insight) => ({ ...insight, recommendedActions: getRecommendedActions(insight.category) }));

import "dotenv/config";
import type { FranchiseStage } from "@prisma/client";
import prisma from "../src/lib/prisma";
import { logger } from "../src/utils/logger";

/**
 * Massa de teste para o Pipeline de Franquias (PLAN-0022, Onda 9) — pedido explícito do
 * usuário em 2026-08-14: 5 Interessados, 2 Qualificados, 1 em Reunião, 3 em Proposta,
 * 4 em Negociação (15 leads no total).
 *
 * Cada lead além de "Interessado" carrega um histórico real de transições
 * (`FranchiseLeadStageHistory`), com datas escalonadas — não só o lead na etapa final,
 * mas o caminho completo até ali — para que o "tempo médio esperado" (média histórica
 * real, `metrics.ts`) e o alerta de gargalo (`isBottleneck`) do Kanban tenham dado de
 * verdade para calcular, em vez de aparecer tudo zerado/null. Os 5 "Interessados" não
 * têm histórico (ainda não saíram da primeira etapa) — mas os outros 10 leads, ao
 * passarem por "Interessado" no caminho, geram a amostra histórica dessa própria etapa.
 *
 * Idempotente: identificados por `email` terminando em "@teste.jlr.local" (mesma
 * convenção de `seedAdminV2TestData.ts`); se já existem 15+ leads de teste, não duplica.
 */

const TEST_EMAIL_DOMAIN = "teste.jlr.local";
const NOW = new Date();
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

type StageCheckpoint = { stage: FranchiseStage; daysAgo: number };

type LeadSpec = {
  name: string;
  email: string;
  phone: string;
  city: string;
  estimatedValue: number;
  /** Caminho completo até a etapa atual — o primeiro item é sempre "Interessado" (entrada no funil, vira `createdAt`); os demais viram registros de `FranchiseLeadStageHistory`. O último item é a etapa atual. */
  path: StageCheckpoint[];
};

const LEAD_SPECS: LeadSpec[] = [
  // ─── Interessados (5) — sem histórico, recém-chegados ao funil ──────────────────────
  {
    name: "Roberto Almeida",
    email: `roberto.almeida@${TEST_EMAIL_DOMAIN}`,
    phone: "11991112222",
    city: "Campinas, SP",
    estimatedValue: 120000,
    path: [{ stage: "INTERESSADO", daysAgo: 2 }],
  },
  {
    name: "Cristiane Souza Lima",
    email: `cristiane.lima@${TEST_EMAIL_DOMAIN}`,
    phone: "21988887777",
    city: "Niterói, RJ",
    estimatedValue: 95000,
    path: [{ stage: "INTERESSADO", daysAgo: 6 }],
  },
  {
    name: "Marcos Vinicius Pereira",
    email: `marcos.pereira@${TEST_EMAIL_DOMAIN}`,
    phone: "31977776666",
    city: "Belo Horizonte, MG",
    estimatedValue: 150000,
    path: [{ stage: "INTERESSADO", daysAgo: 10 }],
  },
  {
    name: "Aline Ferreira Santos",
    email: `aline.santos@${TEST_EMAIL_DOMAIN}`,
    phone: "41966665555",
    city: "Curitiba, PR",
    estimatedValue: 110000,
    path: [{ stage: "INTERESSADO", daysAgo: 1 }],
  },
  {
    // Propositalmente "parado" — 22 dias sem sair de Interessado, mais que a média
    // histórica que os outros 10 leads abaixo vão gerar (~11-16 dias) — deve aparecer
    // com isStalled=true no board.
    name: "Eduardo Nascimento Costa",
    email: `eduardo.costa@${TEST_EMAIL_DOMAIN}`,
    phone: "51955554444",
    city: "Porto Alegre, RS",
    estimatedValue: 200000,
    path: [{ stage: "INTERESSADO", daysAgo: 22 }],
  },

  // ─── Qualificados (2) ─────────────────────────────────────────────────────────────────
  {
    name: "Beatriz Cardoso Martins",
    email: `beatriz.martins@${TEST_EMAIL_DOMAIN}`,
    phone: "62944443333",
    city: "Goiânia, GO",
    estimatedValue: 130000,
    path: [
      { stage: "INTERESSADO", daysAgo: 18 },
      { stage: "QUALIFICADO", daysAgo: 8 },
    ],
  },
  {
    // Parado em Qualificado há 25 dias — candidato a gargalo/atraso.
    name: "Felipe Augusto Rocha",
    email: `felipe.rocha@${TEST_EMAIL_DOMAIN}`,
    phone: "71933332222",
    city: "Salvador, BA",
    estimatedValue: 175000,
    path: [
      { stage: "INTERESSADO", daysAgo: 30 },
      { stage: "QUALIFICADO", daysAgo: 25 },
    ],
  },

  // ─── Em Reunião (1) ───────────────────────────────────────────────────────────────────
  {
    name: "Daniela Ribeiro Alves",
    email: `daniela.alves@${TEST_EMAIL_DOMAIN}`,
    phone: "85922221111",
    city: "Fortaleza, CE",
    estimatedValue: 160000,
    path: [
      { stage: "INTERESSADO", daysAgo: 45 },
      { stage: "QUALIFICADO", daysAgo: 35 },
      { stage: "REUNIAO", daysAgo: 15 },
    ],
  },

  // ─── Em Proposta (3) ──────────────────────────────────────────────────────────────────
  {
    name: "Rodrigo Teixeira Barros",
    email: `rodrigo.barros@${TEST_EMAIL_DOMAIN}`,
    phone: "47911110000",
    city: "Joinville, SC",
    estimatedValue: 140000,
    path: [
      { stage: "INTERESSADO", daysAgo: 50 },
      { stage: "QUALIFICADO", daysAgo: 40 },
      { stage: "REUNIAO", daysAgo: 28 },
      { stage: "PROPOSTA", daysAgo: 12 },
    ],
  },
  {
    name: "Camila Vieira Gomes",
    email: `camila.gomes@${TEST_EMAIL_DOMAIN}`,
    phone: "19900009999",
    city: "Sorocaba, SP",
    estimatedValue: 190000,
    path: [
      { stage: "INTERESSADO", daysAgo: 42 },
      { stage: "QUALIFICADO", daysAgo: 33 },
      { stage: "REUNIAO", daysAgo: 20 },
      { stage: "PROPOSTA", daysAgo: 6 },
    ],
  },
  {
    // Proposta parada há 25 dias — candidato a gargalo.
    name: "Thiago Correia Dias",
    email: `thiago.dias@${TEST_EMAIL_DOMAIN}`,
    phone: "27988889999",
    city: "Vila Velha, ES",
    estimatedValue: 105000,
    path: [
      { stage: "INTERESSADO", daysAgo: 60 },
      { stage: "QUALIFICADO", daysAgo: 48 },
      { stage: "REUNIAO", daysAgo: 35 },
      { stage: "PROPOSTA", daysAgo: 25 },
    ],
  },

  // ─── Em Negociação (4) ────────────────────────────────────────────────────────────────
  {
    name: "Larissa Monteiro Cunha",
    email: `larissa.cunha@${TEST_EMAIL_DOMAIN}`,
    phone: "65977778888",
    city: "Cuiabá, MT",
    estimatedValue: 220000,
    path: [
      { stage: "INTERESSADO", daysAgo: 70 },
      { stage: "QUALIFICADO", daysAgo: 58 },
      { stage: "REUNIAO", daysAgo: 45 },
      { stage: "PROPOSTA", daysAgo: 30 },
      { stage: "NEGOCIACAO", daysAgo: 10 },
    ],
  },
  {
    name: "Vinicius Araujo Nunes",
    email: `vinicius.nunes@${TEST_EMAIL_DOMAIN}`,
    phone: "84966667777",
    city: "Natal, RN",
    estimatedValue: 175000,
    path: [
      { stage: "INTERESSADO", daysAgo: 65 },
      { stage: "QUALIFICADO", daysAgo: 52 },
      { stage: "REUNIAO", daysAgo: 38 },
      { stage: "PROPOSTA", daysAgo: 22 },
      { stage: "NEGOCIACAO", daysAgo: 8 },
    ],
  },
  {
    name: "Priscila Barbosa Farias",
    email: `priscila.farias@${TEST_EMAIL_DOMAIN}`,
    phone: "92955556666",
    city: "Manaus, AM",
    estimatedValue: 250000,
    path: [
      { stage: "INTERESSADO", daysAgo: 80 },
      { stage: "QUALIFICADO", daysAgo: 66 },
      { stage: "REUNIAO", daysAgo: 50 },
      { stage: "PROPOSTA", daysAgo: 33 },
      { stage: "NEGOCIACAO", daysAgo: 18 },
    ],
  },
  {
    name: "Gustavo Henrique Moraes",
    email: `gustavo.moraes@${TEST_EMAIL_DOMAIN}`,
    phone: "34944445555",
    city: "Uberlândia, MG",
    estimatedValue: 135000,
    path: [
      { stage: "INTERESSADO", daysAgo: 55 },
      { stage: "QUALIFICADO", daysAgo: 44 },
      { stage: "REUNIAO", daysAgo: 30 },
      { stage: "PROPOSTA", daysAgo: 16 },
      { stage: "NEGOCIACAO", daysAgo: 3 },
    ],
  },
];

const main = async (): Promise<void> => {
  const existing = await prisma.franchiseLead.count({
    where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } },
  });
  if (existing >= LEAD_SPECS.length) {
    logger.info("Massa de teste do Pipeline de Franquias ja existe, pulando", { existing });
    return;
  }

  const counts: Record<string, number> = {};

  for (const spec of LEAD_SPECS) {
    const alreadyExists = await prisma.franchiseLead.findFirst({ where: { email: spec.email } });
    if (alreadyExists) continue;

    const [first, ...rest] = spec.path;
    const currentStage = spec.path[spec.path.length - 1].stage;
    const stageChangedAt = daysAgo(spec.path[spec.path.length - 1].daysAgo);

    await prisma.franchiseLead.create({
      data: {
        name: spec.name,
        email: spec.email,
        phone: spec.phone,
        city: spec.city,
        status: "Novo",
        stage: currentStage,
        estimatedValue: spec.estimatedValue,
        stageChangedAt,
        createdAt: daysAgo(first.daysAgo),
        stageHistory: rest.length
          ? {
              create: rest.map((checkpoint, index) => ({
                fromStage: spec.path[index].stage, // etapa anterior no caminho (índice do item antes deste)
                toStage: checkpoint.stage,
                changedAt: daysAgo(checkpoint.daysAgo),
              })),
            }
          : undefined,
      },
    });

    counts[currentStage] = (counts[currentStage] ?? 0) + 1;
  }

  logger.info("Massa de teste do Pipeline de Franquias criada", { counts, total: LEAD_SPECS.length });
};

main()
  .catch((error) => {
    logger.error("Falha ao gerar massa de teste do Pipeline de Franquias", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

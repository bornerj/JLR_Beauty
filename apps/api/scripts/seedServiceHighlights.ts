import "dotenv/config";
import prisma from "../src/lib/prisma";
import { logger } from "../src/utils/logger";

/**
 * PLAN-0028 (Caso B, `ERR-0062`) — migração única de dado: copia o conteúdo dos 9
 * flip-cards de Destaque, hoje espalhado em `ContentEntry` (36 page texts,
 * `home.services.card_N_*`) e `Setting`/`ContentEntry` (9 media slots,
 * `home_services_card_img_0N`), pros novos campos `highlight*`/`imageUrl` do cadastro
 * nativo de `Service` — sem perda de conteúdo (valores copiados literalmente dos
 * defaults hoje ativos, confirmado que `ContentEntry` não tinha nenhum override real
 * pra essas chaves).
 *
 * Decisão do usuário (2026-08-17): manter os 9 cards, resolvendo a duplicidade
 * "Limpeza de Pele" (cards 2 e 7) trocando o card 7 por outro serviço real de Estética
 * Facial ainda não coberto — escolhido `Drenagem Linfática Facial` (id 34), mesma
 * imagem/tema "Facial Spa" de antes, texto de verso corrigido pra refletir o serviço
 * real (antes era "Harmonização", sem nenhum vínculo com o serviço agendado).
 *
 * Idempotente: usa `update` direto por id, pode ser re-executado sem duplicar nada.
 */

type HighlightSeed = {
  serviceId: number;
  order: number;
  label: string;
  tagline: string;
  backLabel: string;
  description: string;
  imageUrl: string;
};

const SEED: HighlightSeed[] = [
  {
    serviceId: 45, // Hidratação Capilar
    order: 1,
    label: "Arte Capilar",
    tagline: "Corte preciso e tratamentos restauradores",
    backLabel: "Arte Capilar",
    description: "Coloração sob medida, reconstruções e finalização profissional para cada estilo.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARr5EhNnwTTjU5vlGCN2g-k5I4Fk5IbzkhY7M2Z7hNSuHgjw72-n7jYz2nIL6kEYaEr2QMUh4UDzmoecfSlC9o6BrycwyRf7ATUC-faqNXHToAzrZteugibFPTXoxqaRaIQj1P-JvEWa4qsYuJKZ58dbph3ZWOGnXE34Y8S0_mtkPdyXssxJk8jwC0K4lgGNt7Q9v7f5AsQL1I8ftDD1qGZSMTDeTg1Il52tMs_XMMyUJnSxUw_O4b_90g_rEfz7CLKsjmV5eiPFE",
  },
  {
    serviceId: 48, // Limpeza de Pele
    order: 2,
    label: "Pele Clínica",
    tagline: "Faciais avançados e peelings",
    backLabel: "Pele Clínica",
    description: "Protocolos de rejuvenescimento e cuidados intensivos para cada necessidade da pele.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFlMndGMRtfTguABIfBDd-3hHe5OvlsSXybdKCqkXMA1jrp2pijAYz9lJ-BPbiTp3zymW0erEQrQntmBsMYNX3ML5Q204mA5E2M5KV6YeXS8N-RRuyta2yFPAwbBfbuaoOZT09JQzAWDDPyMCZAxaIayvB-rDCfgOn-h3u4V5uMGeSVtUUNnY-q4zadhEYJjXh6VT0ExNFxzjpD_lrWvNaNaMRHqKXa3foc2lyFvd-7F9mUP7lYJN-6_PrpmV42rzWXbAokEJngJg",
  },
  {
    serviceId: 58, // Massagem Relaxante
    order: 3,
    label: "Terapia de Bem-Estar",
    tagline: "Massagens e aromaterapia",
    backLabel: "Terapia de Bem-Estar",
    description: "Experiências sensoriais para restaurar energia, equilíbrio e relaxamento profundo.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC2j8nn6oj-qs-X2-WzwFVCFw_DmIPuHqaw6dMKzBxhxjmw59gYuClCcw1vAtnLmEEqwXvygjNJ7PTYy7dDm3Nsq1D3MdV-29TqJ2pMELeGmPK597YuPmNSP1rQSqIlVfjWnIkHkm6MB47xHYs_VE-EFkemKe4-hF37Frz8Q04wbN2OxdLgF9bTj4QqmbSLtBZg9zDKe0CTceA95qlG-_y1AQLybppm3kgiEv1qeNDURTzmAlJirpGFLyM1h5UjHWF_RKUh_Vffadk",
  },
  {
    serviceId: 73, // Terapia Capilar
    order: 4,
    label: "Terapia Capilar",
    tagline: "Saúde dos fios",
    backLabel: "Spa Capilar",
    description: "Tratamentos para couro cabeludo, controle de queda e reconstrução profunda.",
    imageUrl: "/images/hidra.webp",
  },
  {
    serviceId: 42, // Extensão De Cilios
    order: 5,
    label: "Lashes",
    tagline: "Extensão de cílios",
    backLabel: "Extensão de Cílios",
    description: "Fio a fio clássico e volume para um olhar marcante e elegante.",
    imageUrl: "/images/Services/servico3.webp",
  },
  {
    serviceId: 30, // Design de Sobrancelha
    order: 6,
    label: "Brows",
    tagline: "Sobrancelhas",
    backLabel: "Micropigmentação",
    description: "Design estratégico, lamination e técnica shadow para realce natural.",
    imageUrl: "/images/Services/servico2.webp",
  },
  {
    // Drenagem Linfática Facial — substitui a duplicidade do antigo card 7 (apontava pro
    // mesmo serviço do card 2, "Limpeza de Pele"). Mesma imagem/tema "Facial Spa" de antes;
    // texto de verso corrigido pra refletir o serviço real (antes "Harmonização", sem
    // vínculo nenhum com o que era agendado).
    serviceId: 34, // Drenagem Linfática Facial
    order: 7,
    label: "Facial Spa",
    tagline: "Estética facial",
    backLabel: "Drenagem Linfática Facial",
    description: "Massagem drenante que reduz inchaço, melhora a circulação e renova o viço natural da pele.",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop",
  },
  {
    serviceId: 52, // Manicure + Pedicure
    order: 8,
    label: "Nails",
    tagline: "Mãos e pés",
    backLabel: "Manicure",
    description: "Esmaltação em gel, alongamentos e spa dos pés.",
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1000&auto=format&fit=crop",
  },
  {
    serviceId: 16, // Depilação Axilas
    order: 9,
    label: "Smooth",
    tagline: "Depilação",
    backLabel: "Depilação",
    description: "Técnicas confortáveis e ceras especiais para uma pele lisa.",
    imageUrl: "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=1000&auto=format&fit=crop",
  },
];

const main = async (): Promise<void> => {
  const ids = SEED.map((s) => s.serviceId);
  const existing = await prisma.service.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  const foundIds = new Set(existing.map((s) => s.id));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length) {
    throw new Error(`Serviço(s) não encontrado(s), abortando seed: ${missing.join(", ")}`);
  }

  for (const seed of SEED) {
    await prisma.service.update({
      where: { id: seed.serviceId },
      data: {
        isFeatured: true,
        highlightOrder: seed.order,
        highlightLabel: seed.label,
        highlightTagline: seed.tagline,
        highlightBackLabel: seed.backLabel,
        highlightDescription: seed.description,
        imageUrl: seed.imageUrl,
      },
    });
  }

  logger.info("Seed de highlight dos 9 flip-cards concluído", {
    servicos: SEED.map((s) => ({ id: s.serviceId, order: s.order, label: s.label })),
  });
};

main()
  .catch((error) => {
    logger.error("Falha no seed de highlight dos flip-cards", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

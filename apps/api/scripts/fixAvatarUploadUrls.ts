import "dotenv/config";
import prisma from "../src/lib/prisma";
import { logger } from "../src/utils/logger";

const DRY_RUN_FLAG = "--dry-run";

const normalizeAvatarUrl = (value?: string | null): string | null => {
  const raw = (value || "").trim();
  if (!raw) return null;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?\/uploads\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      const match = raw.match(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.*)$/i);
      return match?.[1] || raw;
    }
  }

  return raw;
};

const main = async (): Promise<void> => {
  const dryRun = process.argv.includes(DRY_RUN_FLAG);

  const users = await prisma.user.findMany({
    where: {
      avatarUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      avatarUrl: true,
    },
  });

  const candidates = users
    .map((user) => {
      const nextAvatarUrl = normalizeAvatarUrl(user.avatarUrl);
      return {
        ...user,
        nextAvatarUrl,
      };
    })
    .filter((user) => (user.avatarUrl || null) !== (user.nextAvatarUrl || null));

  logger.info("Analise de avatars com URL local concluida", {
    totalUsers: users.length,
    candidates: candidates.length,
    dryRun,
  });

  if (!candidates.length) {
    return;
  }

  for (const candidate of candidates) {
    logger.info("Avatar URL candidata para correcao", {
      userId: candidate.id,
      email: candidate.email,
      before: candidate.avatarUrl,
      after: candidate.nextAvatarUrl,
    });
  }

  if (dryRun) {
    logger.info("Dry-run finalizado sem persistir alteracoes");
    return;
  }

  for (const candidate of candidates) {
    await prisma.user.update({
      where: { id: candidate.id },
      data: {
        avatarUrl: candidate.nextAvatarUrl,
      },
    });
  }

  logger.info("Correcao de avatarUrl concluida", {
    updatedUsers: candidates.length,
  });
};

main()
  .catch((error) => {
    logger.error("Falha ao corrigir avatarUrl de usuarios", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from "../../../lib/prisma";
import { logger } from "../../../utils/logger";

const DEFAULT_RETENTION_DAYS = 180;
const DEFAULT_INTERVAL_HOURS = 24;

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const getRetentionDays = (): number => {
  return parsePositiveInt(process.env.CONCIERGE_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);
};

const getIntervalHours = (): number => {
  return parsePositiveInt(process.env.CONCIERGE_RETENTION_INTERVAL_HOURS, DEFAULT_INTERVAL_HOURS);
};

export const runConciergeRetentionOnce = async (): Promise<void> => {
  const retentionDays = getRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await prisma.conciergeSession.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      status: { in: ["COMPLETED", "CANCELLED"] },
    },
  });

  logger.info("Concierge retention cleanup executed", {
    retentionDays,
    deletedSessions: result.count,
    cutoff: cutoff.toISOString(),
  });
};

export const startConciergeRetentionScheduler = (): void => {
  const intervalHours = getIntervalHours();
  const intervalMs = intervalHours * 60 * 60 * 1000;

  logger.info("Concierge retention scheduler initialized", {
    retentionDays: getRetentionDays(),
    runEveryHours: intervalHours,
  });

  void runConciergeRetentionOnce().catch((error) => {
    logger.error("Concierge retention cleanup failed on startup", {
      error: error instanceof Error ? error.message : "erro inesperado",
    });
  });

  setInterval(() => {
    void runConciergeRetentionOnce().catch((error) => {
      logger.error("Concierge retention cleanup failed", {
        error: error instanceof Error ? error.message : "erro inesperado",
      });
    });
  }, intervalMs);
};

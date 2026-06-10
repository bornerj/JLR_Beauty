type LoggerContext = unknown;

const write = (level: "info" | "warn" | "error", message: string, context?: LoggerContext): void => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context === undefined ? {} : { context }),
  };

  if (level === "info") {
    globalThis.console.info(payload);
    return;
  }
  if (level === "warn") {
    globalThis.console.warn(payload);
    return;
  }
  globalThis.console.error(payload);
};

export const logger = {
  info: (message: string, context?: LoggerContext): void => {
    write("info", message, context);
  },
  warn: (message: string, context?: LoggerContext): void => {
    write("warn", message, context);
  },
  error: (message: string, context?: LoggerContext): void => {
    write("error", message, context);
  },
};

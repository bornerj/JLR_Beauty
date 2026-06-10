type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: unknown;
};

const writeLog = (level: LogLevel, message: string, context?: unknown): void => {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context === undefined ? {} : { context }),
  };

  const output = `${JSON.stringify(payload)}\n`;
  if (level === "error") {
    process.stderr.write(output);
    return;
  }
  process.stdout.write(output);
};

export const logger = {
  info: (message: string, context?: unknown): void => {
    writeLog("info", message, context);
  },
  warn: (message: string, context?: unknown): void => {
    writeLog("warn", message, context);
  },
  error: (message: string, context?: unknown): void => {
    writeLog("error", message, context);
  },
};

import "dotenv/config";
import app from "./app";
import { startConciergeRetentionScheduler } from "./modules/chatbot/retention/conciergeRetention";
import { logger } from "./utils/logger";

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  logger.info(`[api] listening on http://localhost:${port}`);
  startConciergeRetentionScheduler();
});

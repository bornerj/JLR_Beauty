import { Router } from "express";
import { authRouter } from "./auth";
import { webhooksRouter } from "./webhooks";
import { catalogRouter } from "./catalog";
import { subscriptionsRouter } from "./subscriptions";
import { scheduleRouter } from "./schedule";
import { ordersRouter, handleStripeWebhook } from "./orders";
import { usersRouter } from "./users";
import { adminRouter } from "./admin";

const router = Router();

router.use(authRouter);
router.use(webhooksRouter);
router.use(catalogRouter);
router.use(scheduleRouter);
router.use(ordersRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(subscriptionsRouter);

export { handleStripeWebhook };
export default router;

import { Router } from "express";
import { authRouter } from "./auth";
import { webhooksRouter } from "./webhooks";
import { catalogRouter } from "./catalog";
import { subscriptionsRouter } from "./subscriptions";
import { scheduleRouter } from "./schedule";
import { ordersRouter, handleStripeWebhook } from "./orders";
import { usersRouter } from "./users";
import { adminRouter } from "./admin";
import { inventoryRouter } from "./inventory";

const router = Router();

router.use(authRouter);
router.use(webhooksRouter);
router.use(catalogRouter);
router.use(scheduleRouter);
router.use(ordersRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(inventoryRouter);
router.use(subscriptionsRouter);

export { handleStripeWebhook };
export default router;

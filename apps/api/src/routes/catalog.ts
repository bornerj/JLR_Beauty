import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";
import prisma from "../lib/prisma";
import { logger } from "../utils/logger";
import { withDetail, formatZodDetail } from "../lib/routeHelpers";
import { MSG } from "../lib/messages";
import { listPublicServiceCatalogByCategory } from "../lib/appointmentAvailability";

const categorySchema = z.object({
  name: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const categoryUpdateSchema = categorySchema.partial();

const statusSchema = z.object({
  name: z.string().min(1),
  color: z.enum(["VERDE", "AMARELO", "VERMELHO", "CINZA"]).optional(),
});
const statusUpdateSchema = statusSchema.partial();

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0),
  imageUrl: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  productCategoryId: z.coerce.number().optional(),
  productStatusId: z.coerce.number().optional(),
  isFeatured: z.coerce.boolean().optional(),
});
const productUpdateSchema = productSchema.partial();

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0).optional(),
  durationMin: z.coerce.number().min(1),
  imageUrl: z.string().optional(),
  commissionPercent: z.coerce.number().min(0).max(100).optional(),
  serviceCategoryId: z.coerce.number().optional(),
  serviceStatusId: z.coerce.number().optional(),
  isFeatured: z.coerce.boolean().optional(),
});
const serviceUpdateSchema = serviceSchema.partial();

const catalogRouter = Router();

// --- Product categories ---

catalogRouter.get("/product-categories", requireAdmin, async (_req, res) => {
  const categories = await prisma.productCategory.findMany({ orderBy: { createdAt: "desc" } });
  res.json(categories);
});

catalogRouter.post("/product-categories", requireAdmin, async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const category = await prisma.productCategory.create({
    data: { name: parsed.data.name, status: parsed.data.status || "ACTIVE" },
  });
  res.status(201).json(category);
});

catalogRouter.patch("/product-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const category = await prisma.productCategory.update({
    where: { id: categoryId },
    data: { name: parsed.data.name, status: parsed.data.status },
  });
  res.json(category);
});

catalogRouter.delete("/product-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const inUse = await prisma.product.count({ where: { productCategoryId: categoryId } });
  if (inUse > 0) { res.status(409).json({ message: MSG.FORBIDDEN }); return; }
  await prisma.productCategory.delete({ where: { id: categoryId } });
  res.status(204).send();
});

// --- Service categories ---

catalogRouter.get("/service-categories", requireAdmin, async (_req, res) => {
  const categories = await prisma.serviceCategory.findMany({ orderBy: { createdAt: "desc" } });
  res.json(categories);
});

catalogRouter.post("/service-categories", requireAdmin, async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const category = await prisma.serviceCategory.create({
    data: { name: parsed.data.name, status: parsed.data.status || "ACTIVE" },
  });
  res.status(201).json(category);
});

catalogRouter.patch("/service-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const category = await prisma.serviceCategory.update({
    where: { id: categoryId },
    data: { name: parsed.data.name, status: parsed.data.status },
  });
  res.json(category);
});

catalogRouter.delete("/service-categories/:id", requireAdmin, async (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isFinite(categoryId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const inUse = await prisma.service.count({ where: { serviceCategoryId: categoryId } });
  if (inUse > 0) { res.status(409).json({ message: MSG.FORBIDDEN }); return; }
  await prisma.serviceCategory.delete({ where: { id: categoryId } });
  res.status(204).send();
});

// --- Product statuses ---

catalogRouter.get("/product-statuses", requireAdmin, async (_req, res) => {
  const statuses = await prisma.productStatus.findMany({ orderBy: { createdAt: "desc" } });
  res.json(statuses);
});

catalogRouter.post("/product-statuses", requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const status = await prisma.productStatus.create({
    data: { name: parsed.data.name, color: parsed.data.color || "VERDE" },
  });
  res.status(201).json(status);
});

catalogRouter.patch("/product-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const status = await prisma.productStatus.update({
    where: { id: statusId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  res.json(status);
});

catalogRouter.delete("/product-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const inUse = await prisma.product.count({ where: { productStatusId: statusId } });
  if (inUse > 0) { res.status(409).json({ message: MSG.FORBIDDEN }); return; }
  await prisma.productStatus.delete({ where: { id: statusId } });
  res.status(204).send();
});

// --- Service statuses ---

catalogRouter.get("/service-statuses", requireAdmin, async (_req, res) => {
  const statuses = await prisma.serviceStatus.findMany({ orderBy: { createdAt: "desc" } });
  res.json(statuses);
});

catalogRouter.post("/service-statuses", requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const status = await prisma.serviceStatus.create({
    data: { name: parsed.data.name, color: parsed.data.color || "VERDE" },
  });
  res.status(201).json(status);
});

catalogRouter.patch("/service-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PAYLOAD, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const status = await prisma.serviceStatus.update({
    where: { id: statusId },
    data: { name: parsed.data.name, color: parsed.data.color },
  });
  res.json(status);
});

catalogRouter.delete("/service-statuses/:id", requireAdmin, async (req, res) => {
  const statusId = Number(req.params.id);
  if (!Number.isFinite(statusId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const inUse = await prisma.service.count({ where: { serviceStatusId: statusId } });
  if (inUse > 0) { res.status(409).json({ message: MSG.FORBIDDEN }); return; }
  await prisma.serviceStatus.delete({ where: { id: statusId } });
  res.status(204).send();
});

// --- Units ---

catalogRouter.get("/units", requireAdmin, async (_req, res) => {
  const units = await prisma.unit.findMany({ orderBy: { createdAt: "desc" } });
  res.json(units);
});

// --- Products ---

catalogRouter.get("/products", requireAdmin, async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { productCategory: true, productStatus: true },
  });
  res.json(products);
});

catalogRouter.post("/products", requireAdmin, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }

  const { name, description, price, imageUrl, productCategoryId, productStatusId, isFeatured, sku, stock, benefits } = parsed.data;
  const normalizedCategoryId =
    productCategoryId !== undefined && Number(productCategoryId) > 0 ? Number(productCategoryId) : null;
  const normalizedStatusId =
    productStatusId !== undefined && Number(productStatusId) > 0 ? Number(productStatusId) : null;

  if (normalizedCategoryId !== null) {
    const categoryExists = await prisma.productCategory.findUnique({ where: { id: normalizedCategoryId }, select: { id: true } });
    if (!categoryExists) {
      res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail("categoria de produto invalida") });
      return;
    }
  }

  if (normalizedStatusId !== null) {
    const statusExists = await prisma.productStatus.findUnique({ where: { id: normalizedStatusId }, select: { id: true } });
    if (!statusExists) {
      res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail("status de produto invalido") });
      return;
    }
  }

  try {
    const product = await prisma.product.create({
      data: {
        name, description, sku, stock: stock ?? 0,
        price: new Prisma.Decimal(price || 0),
        imageUrl, benefits,
        isFeatured: Boolean(isFeatured ?? false),
        productCategoryId: normalizedCategoryId,
        productStatusId: normalizedStatusId,
      },
      include: { productCategory: true, productStatus: true },
    });
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail("categoria/status de produto invalido") });
      return;
    }
    logger.error("Falha ao criar produto", { error });
    res.status(500).json({ message: MSG.SERVER_ERROR, ...withDetail(error instanceof Error ? error.message : "create_product_failed") });
  }
});

catalogRouter.patch("/products/:id", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const payload = parsed.data;
  const hasCategoryKey = Object.prototype.hasOwnProperty.call(payload, "productCategoryId");
  const hasStatusKey = Object.prototype.hasOwnProperty.call(payload, "productStatusId");

  const normalizedCategoryId = hasCategoryKey
    ? payload.productCategoryId !== undefined && Number(payload.productCategoryId) > 0
      ? Number(payload.productCategoryId) : null
    : undefined;
  const normalizedStatusId = hasStatusKey
    ? payload.productStatusId !== undefined && Number(payload.productStatusId) > 0
      ? Number(payload.productStatusId) : null
    : undefined;

  if (normalizedCategoryId !== undefined && normalizedCategoryId !== null) {
    const categoryExists = await prisma.productCategory.findUnique({ where: { id: normalizedCategoryId }, select: { id: true } });
    if (!categoryExists) {
      res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail("categoria de produto invalida") });
      return;
    }
  }

  if (normalizedStatusId !== undefined && normalizedStatusId !== null) {
    const statusExists = await prisma.productStatus.findUnique({ where: { id: normalizedStatusId }, select: { id: true } });
    if (!statusExists) {
      res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail("status de produto invalido") });
      return;
    }
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: payload.name, description: payload.description, sku: payload.sku, stock: payload.stock,
        price: payload.price !== undefined ? new Prisma.Decimal(payload.price || 0) : undefined,
        imageUrl: payload.imageUrl, benefits: payload.benefits, isFeatured: payload.isFeatured,
        productCategoryId: normalizedCategoryId,
        productStatusId: normalizedStatusId,
      },
      include: { productCategory: true, productStatus: true },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND }); return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      res.status(400).json({ message: MSG.INVALID_PRODUCT, ...withDetail("categoria/status de produto invalido") }); return;
    }
    logger.error("Falha ao atualizar produto", { error, productId });
    res.status(500).json({ message: MSG.SERVER_ERROR, ...withDetail(error instanceof Error ? error.message : "update_product_failed") });
  }
});

catalogRouter.delete("/products/:id", requireAdmin, async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  try {
    await prisma.product.delete({ where: { id: productId } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ message: MSG.PRODUCT_NOT_FOUND }); return;
    }
    logger.error("Falha ao excluir produto", { error, productId });
    res.status(500).json({ message: MSG.SERVER_ERROR, ...withDetail(error instanceof Error ? error.message : "delete_product_failed") });
  }
});

// --- Services ---

catalogRouter.get("/services", requireAdmin, async (_req, res) => {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
    include: { serviceCategory: true, serviceStatus: true },
  });
  res.json(services);
});

catalogRouter.post("/services", requireAdmin, async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_SERVICE, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const { name, description, price, cost, durationMin, imageUrl, serviceCategoryId, serviceStatusId, isFeatured, commissionPercent } = parsed.data;
  const service = await prisma.service.create({
    data: {
      name, description,
      price: new Prisma.Decimal(price || 0),
      cost: cost !== undefined ? new Prisma.Decimal(cost || 0) : null,
      durationMin: durationMin ? Number(durationMin) : null,
      imageUrl,
      commissionPercent: commissionPercent ?? null,
      isFeatured: Boolean(isFeatured ?? false),
      serviceCategoryId: serviceCategoryId ? Number(serviceCategoryId) : null,
      serviceStatusId: serviceStatusId ? Number(serviceStatusId) : null,
    },
    include: { serviceCategory: true, serviceStatus: true },
  });
  res.status(201).json(service);
});

catalogRouter.patch("/services/:id", requireAdmin, async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isFinite(serviceId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  const parsed = serviceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: MSG.INVALID_SERVICE, ...withDetail(formatZodDetail(parsed.error.issues)) });
    return;
  }
  const payload = parsed.data;
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: payload.name, description: payload.description,
      price: payload.price !== undefined ? new Prisma.Decimal(payload.price || 0) : undefined,
      cost: payload.cost !== undefined ? new Prisma.Decimal(payload.cost || 0) : undefined,
      durationMin: payload.durationMin !== undefined ? Number(payload.durationMin) : undefined,
      imageUrl: payload.imageUrl,
      commissionPercent: payload.commissionPercent,
      isFeatured: payload.isFeatured,
      serviceCategoryId: payload.serviceCategoryId
        ? Number(payload.serviceCategoryId)
        : payload.serviceCategoryId === null ? null : undefined,
      serviceStatusId: payload.serviceStatusId
        ? Number(payload.serviceStatusId)
        : payload.serviceStatusId === null ? null : undefined,
    },
    include: { serviceCategory: true, serviceStatus: true },
  });
  res.json(updated);
});

catalogRouter.delete("/services/:id", requireAdmin, async (req, res) => {
  const serviceId = Number(req.params.id);
  if (!Number.isFinite(serviceId)) { res.status(400).json({ message: MSG.INVALID_PAYLOAD }); return; }
  await prisma.service.delete({ where: { id: serviceId } });
  res.status(204).send();
});

// --- Public catalog ---

catalogRouter.get("/public/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, description: true, sku: true, price: true,
      imageUrl: true, benefits: true, isFeatured: true,
      productStatus: { select: { name: true } },
    },
  });
  const activeStatusNames = new Set(["ACTIVE", "ATIVO", "ATIVA"]);
  const visibleProducts = products
    .filter((product) => {
      const statusName = product.productStatus?.name?.trim().toUpperCase();
      if (!statusName) return true;
      return activeStatusNames.has(statusName);
    })
    .map(({ productStatus: _productStatus, ...product }) => product);
  res.json(visibleProducts);
});

catalogRouter.get("/public/services/catalog", async (_req, res) => {
  try {
    const categories = await listPublicServiceCatalogByCategory();
    res.json({ categories });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "erro inesperado";
    res.status(500).json({ message: MSG.SERVER_ERROR, ...withDetail(detail) });
  }
});

export { catalogRouter };

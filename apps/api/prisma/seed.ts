import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { logger } from "../src/utils/logger";
import { productInventorySeed } from "./data/productInventorySeed";
import { serviceCatalogSeed } from "./data/serviceCatalogSeed";

const prisma = new PrismaClient();

async function main() {
  const masterEmail = process.env.MASTER_EMAIL?.toLowerCase();
  const masterPassword = process.env.MASTER_PASSWORD;
  if (masterEmail && masterPassword) {
    const existingMaster = await prisma.user.findUnique({ where: { email: masterEmail } });
    if (!existingMaster) {
      const passwordHash = await bcrypt.hash(masterPassword, 10);
      await prisma.user.create({
        data: {
          name: "master",
          email: masterEmail,
          role: "MASTER",
          passwordHash,
        },
      });
    }
  }

  const adminEmail = "admin@jlrbeauty.com";
  const adminPassword = "Admin@1234";
  if (adminEmail !== masterEmail) {
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          name: "admin",
          email: adminEmail,
          role: "ADMIN",
          passwordHash,
        },
      });
    }
  }

  const hasProductCategories = (await prisma.productCategory.count()) > 0;
  const hasProductStatuses = (await prisma.productStatus.count()) > 0;
  const hasServiceStatuses = (await prisma.serviceStatus.count()) > 0;
  const hasUnits = (await prisma.unit.count()) > 0;

  if (!hasProductCategories) {
    await prisma.productCategory.createMany({
      data: [
        { name: "Tratamento", status: "ACTIVE" },
        { name: "Finalizacao", status: "ACTIVE" },
        { name: "Hair Care", status: "ACTIVE" },
        { name: "Skin Care", status: "INACTIVE" },
      ],
    });
  }

  if (!hasProductStatuses) {
    await prisma.productStatus.createMany({
      data: [
        { name: "Ativo", color: "VERDE" },
        { name: "Rascunho", color: "AMARELO" },
        { name: "Inativo", color: "VERMELHO" },
      ],
    });
  }

  if (!hasServiceStatuses) {
    await prisma.serviceStatus.createMany({
      data: [
        { name: "Ativo", color: "VERDE" },
        { name: "Rascunho", color: "AMARELO" },
        { name: "Inativo", color: "VERMELHO" },
      ],
    });
  }

  const productStatus = await prisma.productStatus.findFirst({
    where: { OR: [{ name: "Ativo" }, { name: "ACTIVE" }] },
    orderBy: { id: "asc" },
  });
  const activeProductStatus =
    productStatus ??
    (await prisma.productStatus.create({
      data: {
        name: "Ativo",
        color: "VERDE",
      },
    }));

  const serviceStatus = await prisma.serviceStatus.findFirst({
    where: { OR: [{ name: "Ativo" }, { name: "ACTIVE" }] },
    orderBy: { id: "asc" },
  });
  const activeServiceStatus =
    serviceStatus ??
    (await prisma.serviceStatus.create({
      data: {
        name: "Ativo",
        color: "VERDE",
      },
    }));

  const productCategoryIdByName = new Map<string, number>();
  for (const productSeed of productInventorySeed) {
    const categoryName = productSeed.categoryName.trim() || "Produtos";
    if (productCategoryIdByName.has(categoryName)) {
      continue;
    }

    const existingCategory = await prisma.productCategory.findFirst({
      where: { name: categoryName },
      select: { id: true, status: true },
    });

    if (existingCategory) {
      if (existingCategory.status !== "ACTIVE") {
        await prisma.productCategory.update({
          where: { id: existingCategory.id },
          data: { status: "ACTIVE" },
        });
      }
      productCategoryIdByName.set(categoryName, existingCategory.id);
      continue;
    }

    const createdCategory = await prisma.productCategory.create({
      data: {
        name: categoryName,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    productCategoryIdByName.set(categoryName, createdCategory.id);
  }

  for (const productSeed of productInventorySeed) {
    const categoryName = productSeed.categoryName.trim() || "Produtos";
    const productCategoryId = productCategoryIdByName.get(categoryName) ?? null;
    const computedPatrimony = Number((productSeed.price * productSeed.stock).toFixed(2));
    const sourcePatrimony = Number(productSeed.patrimony.toFixed(2));

    if (Math.abs(computedPatrimony - sourcePatrimony) > 0.01) {
      logger.warn("Patrimonio divergente no seed de produtos", {
        product: productSeed.name,
        sourcePatrimony,
        computedPatrimony,
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ sku: productSeed.sku }, { name: productSeed.name }],
      },
      select: { id: true },
    });

    const productData = {
      name: productSeed.name,
      description: `Produto importado da planilha de estoque. Patrimonio validado: ${computedPatrimony.toFixed(2)}.`,
      sku: productSeed.sku,
      stock: productSeed.stock,
      price: Number(productSeed.price.toFixed(2)),
      imageUrl: null,
      benefits: [],
      isFeatured: false,
      productCategoryId,
      productStatusId: activeProductStatus.id,
    };

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      continue;
    }

    await prisma.product.create({
      data: productData,
    });
  }

  const serviceCategoryNames = Array.from(
    new Set(
      serviceCatalogSeed
        .map((entry) => entry.categoryName.trim())
        .filter((entry) => entry.length > 0)
    )
  );

  const categoryIdByName = new Map<string, number>();
  for (const categoryName of serviceCategoryNames) {
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: { name: categoryName },
      select: { id: true, status: true },
    });

    if (existingCategory) {
      if (existingCategory.status !== "ACTIVE") {
        await prisma.serviceCategory.update({
          where: { id: existingCategory.id },
          data: { status: "ACTIVE" },
        });
      }
      categoryIdByName.set(categoryName, existingCategory.id);
      continue;
    }

    const createdCategory = await prisma.serviceCategory.create({
      data: {
        name: categoryName,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    categoryIdByName.set(categoryName, createdCategory.id);
  }

  for (const serviceSeed of serviceCatalogSeed) {
    const categoryId = categoryIdByName.get(serviceSeed.categoryName.trim()) ?? null;
    const existingService = await prisma.service.findFirst({
      where: { name: serviceSeed.name },
      select: { id: true },
    });

    const serviceData = {
      price: serviceSeed.price,
      cost: serviceSeed.cost,
      durationMin: serviceSeed.durationMin,
      serviceCategoryId: categoryId,
      serviceStatusId: activeServiceStatus.id,
    };

    if (existingService) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: serviceData,
      });
      continue;
    }

    await prisma.service.create({
      data: {
        name: serviceSeed.name,
        description: null,
        isFeatured: false,
        ...serviceData,
      },
    });
  }

  const defaultMemberships = [
    {
      name: "Silver",
      title: "Radiance",
      price: 99,
      benefits: [
        "10% de desconto em servicos",
        "Acesso antecipado a agenda",
        "Tratamento capilar mensal",
      ],
      isFeatured: false,
      status: "Ativo",
    },
    {
      name: "Gold",
      title: "Luminosity",
      price: 189,
      benefits: [
        "15% de desconto em todos os servicos",
        "Priority booking garantido",
        "Facial mensal gratuito",
        "Presente de aniversario exclusivo",
      ],
      isFeatured: true,
      status: "Ativo",
    },
    {
      name: "Platinum",
      title: "Ethereal",
      price: 299,
      benefits: [
        "20% de desconto ilimitado",
        "Massagem corporal mensal",
        "Servico de concierge dedicado",
        "Convites para eventos VIP",
      ],
      isFeatured: false,
      status: "Ativo",
    },
  ] as const;

  for (const membership of defaultMemberships) {
    const existing = await prisma.membership.findFirst({
      where: {
        OR: [{ name: membership.name }, { title: membership.title }],
      },
    });

    if (!existing) {
      await prisma.membership.create({
        data: {
          name: membership.name,
          title: membership.title,
          price: membership.price,
          benefits: membership.benefits,
          isFeatured: membership.isFeatured,
          status: membership.status,
        },
      });
    }
  }

  if (!hasUnits) {
    await prisma.unit.createMany({
      data: [
        {
          name: "Parque da Cidade",
          address: "Av. das Nações, 1000",
          hourStart: "09:00",
          hourFinish: "20:00",
        },
        {
          name: "Birmann 20",
          address: "Rua Birmann, 20",
          hourStart: "09:00",
          hourFinish: "20:00",
        },
      ],
    });
  }

  await prisma.unit.updateMany({
    data: {
      hourStart: "08:00",
      hourFinish: "20:00",
    },
  });

  const targetUnit =
    (await prisma.unit.findFirst({
      where: { name: { contains: "Parque" } },
      orderBy: { id: "asc" },
    })) ||
    (await prisma.unit.findFirst({
      orderBy: { id: "asc" },
    }));

  if (!targetUnit) return;

  const ensureDateStart = new Date();
  ensureDateStart.setHours(0, 0, 0, 0);
  const addDays = (base: Date, days: number) => {
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
  };

  const commissionProfileSetup = [
    { key: "MANICURE", name: "Manicure", commissionPercent: 25 },
    { key: "CABELEIREIRA", name: "Cabeleireira", commissionPercent: 30 },
    { key: "ESTETICISTA", name: "Esteticista", commissionPercent: 28 },
  ] as const;
  const commissionProfileIdByKey = new Map<string, number>();
  for (const profile of commissionProfileSetup) {
    const saved = await prisma.professionalCommissionProfile.upsert({
      where: { name: profile.name },
      update: {
        commissionPercent: profile.commissionPercent,
        status: "ACTIVE",
      },
      create: {
        name: profile.name,
        commissionPercent: profile.commissionPercent,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    commissionProfileIdByKey.set(profile.key, saved.id);
  }

  const rosterSetup = [
    {
      key: "MARIA_MANICURE",
      name: "Maria Manicure",
      specialties: ["Manicure"],
      weekdayMask: [1, 3, 5], // segunda, quarta, sexta
      hourStart: "08:00",
      hourFinish: "15:00",
      roleTag: "manicure",
      commissionProfileKey: "MANICURE",
    },
    {
      key: "FRANCISCA_MANICURE",
      name: "Francisca Manicure",
      specialties: ["Manicure"],
      weekdayMask: [0, 1, 2, 3, 4, 5, 6], // todos os dias
      hourStart: "11:00",
      hourFinish: "19:00",
      roleTag: "manicure",
      commissionProfileKey: "MANICURE",
    },
    {
      key: "CICERA_CABELEIREIRA",
      name: "Cicera Cabeleireira",
      specialties: ["Cabeleireira"],
      weekdayMask: [0, 1, 2, 3, 4, 5, 6], // todos os dias
      hourStart: "08:00",
      hourFinish: "16:00",
      roleTag: "hair",
      commissionProfileKey: "CABELEIREIRA",
    },
  ] as const;

  const rosterProfessionals = new Map<string, { id: number; roleTag: "manicure" | "hair" }>();
  const ensureProfessionalUser = async (key: string, professionalName: string): Promise<number> => {
    const normalizedKey = key.toLowerCase();
    const email = `profissional.${normalizedKey}@jlr.local`;
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, name: true },
    });
    if (existing) {
      if (existing.role !== "PROFESSIONAL" || existing.name !== professionalName) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: "PROFESSIONAL",
            name: professionalName,
          },
        });
      }
      return existing.id;
    }
    const created = await prisma.user.create({
      data: {
        name: professionalName,
        email,
        role: "PROFESSIONAL",
      },
      select: { id: true },
    });
    return created.id;
  };

  for (const setup of rosterSetup) {
    const existing = await prisma.professional.findFirst({
      where: { name: setup.name },
      select: { id: true, userId: true },
    });
    const ensuredUserId = existing?.userId || (await ensureProfessionalUser(setup.key, setup.name));
    const commissionProfileId = commissionProfileIdByKey.get(setup.commissionProfileKey) || null;
    const saved = existing
      ? await prisma.professional.update({
          where: { id: existing.id },
          data: {
            name: setup.name,
            userId: ensuredUserId,
            unitId: targetUnit.id,
            specialties: setup.specialties,
            employmentStatus: "ACTIVE",
            startedAt: ensureDateStart,
            endedAt: null,
            commissionProfileId,
          },
          select: { id: true },
        })
      : await prisma.professional.create({
          data: {
            name: setup.name,
            userId: ensuredUserId,
            unitId: targetUnit.id,
            specialties: setup.specialties,
            employmentStatus: "ACTIVE",
            startedAt: ensureDateStart,
            endedAt: null,
            commissionProfileId,
          },
          select: { id: true },
        });
    rosterProfessionals.set(setup.key, { id: saved.id, roleTag: setup.roleTag });
  }

  const activeServices = await prisma.service.findMany({
    where: {
      OR: [{ serviceStatus: null }, { serviceStatus: { name: { in: ["Ativo", "ACTIVE"] } } }],
    },
    select: {
      id: true,
      name: true,
      serviceCategory: {
        select: { name: true },
      },
    },
  });
  const manicureServiceIds = activeServices
    .filter((service) => {
      const categoryName = (service.serviceCategory?.name || "").toLowerCase();
      const serviceName = service.name.toLowerCase();
      return (
        categoryName.includes("nails") ||
        serviceName.includes("manicure") ||
        serviceName.includes("pedicure")
      );
    })
    .map((service) => service.id);
  const hairServiceIds = activeServices
    .filter((service) => {
      const categoryName = (service.serviceCategory?.name || "").toLowerCase();
      const serviceName = service.name.toLowerCase();
      return (
        categoryName.includes("cabeleireiro") ||
        serviceName.includes("cabelo") ||
        serviceName.includes("escova") ||
        serviceName.includes("coloracao") ||
        serviceName.includes("corte")
      );
    })
    .map((service) => service.id);
  const fallbackServiceIds = activeServices.map((service) => service.id);

  for (const [, professional] of rosterProfessionals) {
    const targetServiceIds =
      professional.roleTag === "manicure"
        ? manicureServiceIds.length
          ? manicureServiceIds
          : fallbackServiceIds
        : hairServiceIds.length
        ? hairServiceIds
        : fallbackServiceIds;
    await prisma.professionalService.deleteMany({
      where: { professionalId: professional.id },
    });
    if (targetServiceIds.length) {
      await prisma.professionalService.createMany({
        data: targetServiceIds.map((serviceId) => ({
          professionalId: professional.id,
          serviceId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const scheduleWindowDays = 56;
  for (const setup of rosterSetup) {
    const currentProfessional = rosterProfessionals.get(setup.key);
    if (!currentProfessional) continue;
    const scheduleEndExclusive = addDays(ensureDateStart, scheduleWindowDays);
    await prisma.professionalShift.deleteMany({
      where: {
        professionalId: currentProfessional.id,
        workDate: {
          gte: ensureDateStart,
          lt: scheduleEndExclusive,
        },
      },
    });

    const shifts: Array<{
      professionalId: number;
      unitId: number;
      workDate: Date;
      hourStart: string;
      hourFinish: string;
      isActive: boolean;
      notes: string;
    }> = [];
    for (let offset = 0; offset < scheduleWindowDays; offset += 1) {
      const workDate = addDays(ensureDateStart, offset);
      const weekday = workDate.getDay();
      if (!setup.weekdayMask.includes(weekday)) continue;
      shifts.push({
        professionalId: currentProfessional.id,
        unitId: targetUnit.id,
        workDate,
        hourStart: setup.hourStart,
        hourFinish: setup.hourFinish,
        isActive: true,
        notes: `Escala seed ${setup.name}`,
      });
    }
    if (shifts.length) {
      await prisma.professionalShift.createMany({
        data: shifts,
        skipDuplicates: true,
      });
    }
  }

  const professionalsByUnit = await prisma.professional.findMany({
    where: { unitId: { not: null } },
    select: { id: true, unitId: true },
  });
  for (const professional of professionalsByUnit) {
    const totalLinks = await prisma.professionalService.count({
      where: { professionalId: professional.id },
    });
    if (totalLinks > 0) continue;
    if (fallbackServiceIds.length) {
      await prisma.professionalService.createMany({
        data: fallbackServiceIds.map((serviceId) => ({
          professionalId: professional.id,
          serviceId,
        })),
        skipDuplicates: true,
      });
    }
  }
}

main()
  .catch((error) => {
    logger.error("Prisma seed failed", { error });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

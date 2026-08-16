/**
 * Admin V2 (PLAN-0026, Onda 8) — tipos de Serviços, espelhando `Service`/`ServiceCategory`/
 * `ServiceStatus` (`schema.prisma`) e os schemas Zod de `apps/api/src/routes/catalog.ts`.
 * `price`/`cost` voltam do backend como `string | null` (`Prisma.Decimal.toJSON()`), mesmo
 * achado das Ondas 1/4.
 */

export type ServiceCategoryStatus = "ACTIVE" | "INACTIVE";
export type ServiceStatusColor = "VERDE" | "AMARELO" | "VERMELHO" | "CINZA";

export type ServiceCategory = {
  id: number;
  name: string;
  status: ServiceCategoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServiceStatusOption = {
  id: number;
  name: string;
  color: ServiceStatusColor;
  createdAt: string;
  updatedAt: string;
};

export type Service = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  cost: string | null;
  durationMin: number | null;
  imageUrl: string | null;
  commissionPercent: number | null;
  isFeatured: boolean;
  serviceCategory: { id: number; name: string } | null;
  serviceStatus: { id: number; name: string; color: ServiceStatusColor | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceInput = {
  name: string;
  description?: string;
  price: number;
  cost?: number;
  durationMin: number;
  commissionPercent?: number;
  serviceCategoryId?: number;
  serviceStatusId?: number;
  isFeatured?: boolean;
  imageUrl?: string;
};

export type CategoryOrStatusInput = { name: string; status?: ServiceCategoryStatus; color?: ServiceStatusColor };

/**
 * Admin V2 (PLAN-0026, Onda 8) — tipos de Serviços, espelhando `Service`/`ServiceCategory`/
 * `ServiceStatus` (`schema.prisma`) e os schemas Zod de `apps/api/src/routes/catalog.ts`.
 * `price`/`cost` voltam do backend como `string | null` (`Prisma.Decimal.toJSON()`), mesmo
 * achado das Ondas 1/4.
 *
 * PLAN-0028 Caso B (`ERR-0062`): campos `highlight*` adicionados (migração aditiva
 * `20260817190000_add_service_highlight_fields`) — conteúdo dos flip-cards de Destaque da
 * Home pública (`GET /public/services/featured`), só relevantes quando `isFeatured = true`.
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
  highlightLabel: string | null;
  highlightTagline: string | null;
  highlightBackLabel: string | null;
  highlightDescription: string | null;
  highlightOrder: number | null;
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
  highlightLabel?: string;
  highlightTagline?: string;
  highlightBackLabel?: string;
  highlightDescription?: string;
  highlightOrder?: number;
};

export type CategoryOrStatusInput = { name: string; status?: ServiceCategoryStatus; color?: ServiceStatusColor };

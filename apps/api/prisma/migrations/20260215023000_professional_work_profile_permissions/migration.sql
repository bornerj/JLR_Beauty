-- CreateTable
CREATE TABLE `ProfessionalWorkProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `canScheduleAppointments` BOOLEAN NOT NULL DEFAULT false,
    `canAccessOtherProfessionalsAgenda` BOOLEAN NOT NULL DEFAULT false,
    `canViewServiceValues` BOOLEAN NOT NULL DEFAULT false,
    `canViewCustomerContact` BOOLEAN NOT NULL DEFAULT false,
    `canAccessMenuClientsAnamnese` BOOLEAN NOT NULL DEFAULT false,
    `canAccessMenuServices` BOOLEAN NOT NULL DEFAULT false,
    `canAccessMenuProducts` BOOLEAN NOT NULL DEFAULT false,
    `canAccessMenuExpenses` BOOLEAN NOT NULL DEFAULT false,
    `canViewCommissionsToReceive` BOOLEAN NOT NULL DEFAULT false,
    `canViewCommissionPayments` BOOLEAN NOT NULL DEFAULT false,
    `canEditAppointments` BOOLEAN NOT NULL DEFAULT false,
    `canDeleteAppointments` BOOLEAN NOT NULL DEFAULT false,
    `canCreateServiceInAppointment` BOOLEAN NOT NULL DEFAULT false,
    `canViewGrossCommissionsToPay` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProfessionalWorkProfile_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Professional`
    ADD COLUMN `workProfileId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Professional_workProfileId_idx` ON `Professional`(`workProfileId`);

-- AddForeignKey
ALTER TABLE `Professional` ADD CONSTRAINT `Professional_workProfileId_fkey` FOREIGN KEY (`workProfileId`) REFERENCES `ProfessionalWorkProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

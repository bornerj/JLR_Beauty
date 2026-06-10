-- AlterTable
ALTER TABLE `professional` ADD COLUMN `userId` INTEGER NULL;

-- CreateTable
CREATE TABLE `ProfessionalShift` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `professionalId` INTEGER NOT NULL,
    `unitId` INTEGER NOT NULL,
    `workDate` DATETIME(3) NOT NULL,
    `hourStart` VARCHAR(191) NOT NULL,
    `hourFinish` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProfessionalShift_unitId_workDate_isActive_idx`(`unitId`, `workDate`, `isActive`),
    INDEX `ProfessionalShift_professionalId_workDate_isActive_idx`(`professionalId`, `workDate`, `isActive`),
    UNIQUE INDEX `ProfessionalShift_professionalId_workDate_hourStart_hourFini_key`(`professionalId`, `workDate`, `hourStart`, `hourFinish`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Professional_userId_key` ON `Professional`(`userId`);

-- AddForeignKey
ALTER TABLE `Professional` ADD CONSTRAINT `Professional_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalShift` ADD CONSTRAINT `ProfessionalShift_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `Professional`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalShift` ADD CONSTRAINT `ProfessionalShift_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


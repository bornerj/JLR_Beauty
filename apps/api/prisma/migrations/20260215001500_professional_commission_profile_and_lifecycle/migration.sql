-- CreateTable
CREATE TABLE `ProfessionalCommissionProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `commissionPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProfessionalCommissionProfile_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Professional`
    ADD COLUMN `employmentStatus` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `startedAt` DATETIME(3) NULL,
    ADD COLUMN `endedAt` DATETIME(3) NULL,
    ADD COLUMN `commissionProfileId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Professional_commissionProfileId_idx` ON `Professional`(`commissionProfileId`);

-- AddForeignKey
ALTER TABLE `Professional` ADD CONSTRAINT `Professional_commissionProfileId_fkey` FOREIGN KEY (`commissionProfileId`) REFERENCES `ProfessionalCommissionProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

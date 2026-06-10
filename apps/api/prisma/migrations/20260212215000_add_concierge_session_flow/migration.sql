-- CreateTable
CREATE TABLE `ConciergeSession` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `origin` ENUM('WEB', 'WHATSAPP') NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `step` ENUM('SERVICE', 'UNIT', 'SLOT', 'NAME', 'COMPLETED') NOT NULL DEFAULT 'SERVICE',
  `serviceId` INTEGER NULL,
  `unitId` INTEGER NULL,
  `slotLabel` VARCHAR(191) NULL,
  `customerName` VARCHAR(191) NULL,
  `summaryText` TEXT NULL,
  `lastInboundAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `summarySentAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ConciergeSession_phone_status_createdAt_idx`(`phone`, `status`, `createdAt`),
  INDEX `ConciergeSession_serviceId_idx`(`serviceId`),
  INDEX `ConciergeSession_unitId_idx`(`unitId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConciergeEvent` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `sessionId` INTEGER NOT NULL,
  `direction` VARCHAR(191) NOT NULL,
  `channel` ENUM('WEB', 'WHATSAPP') NOT NULL,
  `phone` VARCHAR(191) NULL,
  `text` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ConciergeEvent_sessionId_createdAt_idx`(`sessionId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConciergeSession`
  ADD CONSTRAINT `ConciergeSession_serviceId_fkey`
  FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConciergeSession`
  ADD CONSTRAINT `ConciergeSession_unitId_fkey`
  FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConciergeEvent`
  ADD CONSTRAINT `ConciergeEvent_sessionId_fkey`
  FOREIGN KEY (`sessionId`) REFERENCES `ConciergeSession`(`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

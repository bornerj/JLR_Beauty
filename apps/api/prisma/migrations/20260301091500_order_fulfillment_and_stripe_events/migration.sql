-- AlterTable
ALTER TABLE `Order`
  ADD COLUMN `publicCode` VARCHAR(191) NULL,
  ADD COLUMN `fulfillmentStatus` ENUM(
    'PENDING',
    'SEPARATING',
    'PACKED',
    'DISPATCHED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `paymentConfirmedAt` DATETIME(3) NULL,
  ADD COLUMN `separatedAt` DATETIME(3) NULL,
  ADD COLUMN `packedAt` DATETIME(3) NULL,
  ADD COLUMN `dispatchedAt` DATETIME(3) NULL,
  ADD COLUMN `shipmentTrackingCode` VARCHAR(191) NULL,
  ADD COLUMN `shipmentCarrier` VARCHAR(191) NULL,
  ADD COLUMN `shippedAt` DATETIME(3) NULL,
  ADD COLUMN `deliveredAt` DATETIME(3) NULL,
  ADD COLUMN `fulfillmentNotes` TEXT NULL;

-- Backfill existing order public codes
UPDATE `Order`
SET `publicCode` = CONCAT('PV-', LPAD(`id`, 8, '0'))
WHERE `publicCode` IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_publicCode_key` ON `Order`(`publicCode`);

-- CreateTable
CREATE TABLE `OrderStatusHistory` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `orderId` INTEGER NOT NULL,
  `fromStatus` ENUM('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED') NULL,
  `toStatus` ENUM('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL,
  `source` VARCHAR(191) NOT NULL,
  `note` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `OrderStatusHistory_orderId_createdAt_idx`(`orderId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StripeWebhookEvent` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `eventId` VARCHAR(191) NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `livemode` BOOLEAN NOT NULL DEFAULT false,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PROCESSED',
  `errorMessage` TEXT NULL,
  `payload` JSON NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `StripeWebhookEvent_eventId_key`(`eventId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory`
ADD CONSTRAINT `OrderStatusHistory_orderId_fkey`
FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

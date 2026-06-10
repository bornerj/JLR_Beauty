-- CreateTable
CREATE TABLE `Customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NULL,
    `phone2` VARCHAR(191) NULL,
    `phone2OptOut` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_userId_key`(`userId`),
    UNIQUE INDEX `Customer_phone_key`(`phone`),
    INDEX `Customer_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill users for professionals without linked user
INSERT INTO `User` (`name`, `email`, `role`, `status`, `emailVerified`, `createdAt`, `updatedAt`)
SELECT
  COALESCE(NULLIF(TRIM(`p`.`name`), ''), CONCAT('Profissional ', `p`.`id`)) AS `name`,
  CONCAT('profissional.', `p`.`id`, '@jlr.local') AS `email`,
  'PROFESSIONAL' AS `role`,
  'ACTIVE' AS `status`,
  false AS `emailVerified`,
  NOW(3) AS `createdAt`,
  NOW(3) AS `updatedAt`
FROM `Professional` `p`
WHERE `p`.`userId` IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `User` `u`
    WHERE `u`.`email` = CONCAT('profissional.', `p`.`id`, '@jlr.local')
  );

UPDATE `Professional` `p`
JOIN `User` `u`
  ON `u`.`email` = CONCAT('profissional.', `p`.`id`, '@jlr.local')
SET `p`.`userId` = `u`.`id`
WHERE `p`.`userId` IS NULL;

-- AlterTable
ALTER TABLE `Professional` DROP FOREIGN KEY `Professional_userId_fkey`;
ALTER TABLE `Professional` MODIFY `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Professional` ADD CONSTRAINT `Professional_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

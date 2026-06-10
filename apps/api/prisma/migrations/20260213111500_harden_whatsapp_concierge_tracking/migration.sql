ALTER TABLE `ConciergeSession`
  MODIFY `step` ENUM('SERVICE', 'UNIT', 'DATE', 'SLOT', 'NAME', 'COMPLETED') NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN `scheduledDateLabel` VARCHAR(191) NULL AFTER `slotLabel`,
  ADD COLUMN `scheduledFor` DATETIME(3) NULL AFTER `scheduledDateLabel`,
  ADD INDEX `ConciergeSession_scheduledFor_idx`(`scheduledFor`);

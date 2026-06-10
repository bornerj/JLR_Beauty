-- AlterTable
ALTER TABLE `Professional`
    ADD COLUMN `commissionPercent` DECIMAL(5, 2) NULL;

-- Data backfill from legacy commission profile linkage
UPDATE `Professional` p
LEFT JOIN `ProfessionalCommissionProfile` cp ON cp.`id` = p.`commissionProfileId`
SET p.`commissionPercent` = cp.`commissionPercent`
WHERE p.`commissionPercent` IS NULL
  AND p.`commissionProfileId` IS NOT NULL;

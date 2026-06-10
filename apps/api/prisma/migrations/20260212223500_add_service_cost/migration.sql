-- Add nullable service cost to support spreadsheet import.
ALTER TABLE `Service`
  ADD COLUMN `cost` DECIMAL(10, 2) NULL;

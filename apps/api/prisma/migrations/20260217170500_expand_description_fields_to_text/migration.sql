-- Expand textual description fields to support long-form content
ALTER TABLE `Product`
    MODIFY `description` TEXT NULL;

ALTER TABLE `Service`
    MODIFY `description` TEXT NULL;

ALTER TABLE `Membership`
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `clientId` INTEGER NULL;

-- AlterTable
ALTER TABLE `unit` ADD COLUMN `hourFinish` VARCHAR(191) NOT NULL DEFAULT '18:00',
    ADD COLUMN `hourStart` VARCHAR(191) NOT NULL DEFAULT '09:00';

-- CreateTable
CREATE TABLE `ProfessionalService` (
    `professionalId` INTEGER NOT NULL,
    `serviceId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProfessionalService_serviceId_professionalId_idx`(`serviceId`, `professionalId`),
    PRIMARY KEY (`professionalId`, `serviceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppointmentSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointmentId` INTEGER NOT NULL,
    `unitId` INTEGER NOT NULL,
    `professionalId` INTEGER NOT NULL,
    `slotStart` DATETIME(3) NOT NULL,
    `slotEnd` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AppointmentSlot_appointmentId_slotStart_idx`(`appointmentId`, `slotStart`),
    INDEX `AppointmentSlot_unitId_slotStart_idx`(`unitId`, `slotStart`),
    INDEX `AppointmentSlot_professionalId_slotStart_idx`(`professionalId`, `slotStart`),
    UNIQUE INDEX `AppointmentSlot_unitId_professionalId_slotStart_key`(`unitId`, `professionalId`, `slotStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppointmentWaitlistMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unitId` INTEGER NOT NULL,
    `requestedDate` DATETIME(3) NOT NULL,
    `serviceName` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NULL,
    `clientPhone` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AppointmentWaitlistMessage_unitId_requestedDate_status_idx`(`unitId`, `requestedDate`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Appointment_unitId_start_idx` ON `Appointment`(`unitId`, `start`);

-- CreateIndex
CREATE INDEX `Appointment_professionalId_start_idx` ON `Appointment`(`professionalId`, `start`);

-- CreateIndex
CREATE INDEX `Appointment_clientId_start_idx` ON `Appointment`(`clientId`, `start`);

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalService` ADD CONSTRAINT `ProfessionalService_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `Professional`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalService` ADD CONSTRAINT `ProfessionalService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentSlot` ADD CONSTRAINT `AppointmentSlot_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentSlot` ADD CONSTRAINT `AppointmentSlot_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentSlot` ADD CONSTRAINT `AppointmentSlot_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `Professional`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppointmentWaitlistMessage` ADD CONSTRAINT `AppointmentWaitlistMessage_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

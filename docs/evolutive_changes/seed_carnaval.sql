-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           8.4.3 - MySQL Community Server - GPL
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para jlr_beauty
DROP DATABASE IF EXISTS `jlr_beauty`;
CREATE DATABASE IF NOT EXISTS `jlr_beauty` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `jlr_beauty`;

-- Copiando estrutura para tabela jlr_beauty.appointment
DROP TABLE IF EXISTS `appointment`;
CREATE TABLE IF NOT EXISTS `appointment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unitId` int NOT NULL,
  `professionalId` int NOT NULL,
  `serviceId` int NOT NULL,
  `start` datetime(3) NOT NULL,
  `end` datetime(3) DEFAULT NULL,
  `clientName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `clientPhone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','CONFIRMED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `orderId` int DEFAULT NULL,
  `clientId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Appointment_serviceId_fkey` (`serviceId`),
  KEY `Appointment_orderId_fkey` (`orderId`),
  KEY `Appointment_unitId_start_idx` (`unitId`,`start`),
  KEY `Appointment_professionalId_start_idx` (`professionalId`,`start`),
  KEY `Appointment_clientId_start_idx` (`clientId`,`start`),
  CONSTRAINT `Appointment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Appointment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Appointment_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `professional` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Appointment_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Appointment_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.appointment: ~8 rows (aproximadamente)
DELETE FROM `appointment`;
INSERT INTO `appointment` (`id`, `unitId`, `professionalId`, `serviceId`, `start`, `end`, `clientName`, `clientPhone`, `notes`, `status`, `createdAt`, `updatedAt`, `orderId`, `clientId`) VALUES
	(1, 1, 1, 9, '2026-02-03 23:37:18.354', NULL, 'Cliente', '+5511999999999', NULL, 'PENDING', '2026-02-03 23:37:18.383', '2026-02-03 23:37:18.383', NULL, NULL),
	(12, 1, 1, 45, '2026-02-13 12:00:00.000', '2026-02-13 13:00:00.000', 'Teste Remote', '11999999999', NULL, 'PENDING', '2026-02-13 21:20:51.275', '2026-02-13 21:20:51.275', NULL, NULL),
	(13, 2, 3, 45, '2026-02-13 12:00:00.000', '2026-02-13 13:00:00.000', 'Concorrencia A', '11999900001', NULL, 'PENDING', '2026-02-13 21:25:04.970', '2026-02-13 21:25:04.970', NULL, NULL),
	(14, 2, 3, 45, '2026-02-13 13:00:00.000', '2026-02-13 14:00:00.000', 'Teste Pro A', '11988880001', NULL, 'PENDING', '2026-02-13 22:08:20.265', '2026-02-13 22:08:20.265', NULL, NULL),
	(15, 1, 1, 81, '2026-02-20 12:00:00.000', '2026-02-20 12:45:00.000', 'RATONET FORA', '11981859426', NULL, 'PENDING', '2026-02-14 22:13:10.225', '2026-02-14 22:13:10.225', NULL, NULL),
	(16, 1, 5, 102, '2026-02-17 21:00:00.000', '2026-02-17 22:00:00.000', 'Rato barbudo', '5511981859426', NULL, 'PENDING', '2026-02-14 22:21:39.952', '2026-02-14 22:21:39.952', NULL, NULL),
	(17, 1, 2, 58, '2026-02-18 12:00:00.000', '2026-02-18 12:45:00.000', 'Garcia Rodrigues', '5511981859426', NULL, 'PENDING', '2026-02-14 23:32:41.334', '2026-02-14 23:32:41.334', NULL, NULL),
	(18, 1, 1, 61, '2026-02-18 13:00:00.000', '2026-02-18 13:30:00.000', 'Josi Oliveira', '5511978935812', NULL, 'PENDING', '2026-02-14 23:44:51.154', '2026-02-14 23:44:51.154', NULL, NULL),
	(19, 1, 5, 53, '2026-02-18 21:00:00.000', '2026-02-18 21:45:00.000', 'RICARDO VINY', '5511981859426', NULL, 'PENDING', '2026-02-15 02:06:20.240', '2026-02-15 02:06:20.240', NULL, NULL),
	(20, 1, 1, 50, '2026-02-25 14:30:00.000', '2026-02-25 15:15:00.000', 'Mary ruiz', '5511981859426', NULL, 'PENDING', '2026-02-15 02:16:06.460', '2026-02-15 02:16:06.460', NULL, NULL);

-- Copiando estrutura para tabela jlr_beauty.appointmentslot
DROP TABLE IF EXISTS `appointmentslot`;
CREATE TABLE IF NOT EXISTS `appointmentslot` (
  `id` int NOT NULL AUTO_INCREMENT,
  `appointmentId` int NOT NULL,
  `unitId` int NOT NULL,
  `professionalId` int NOT NULL,
  `slotStart` datetime(3) NOT NULL,
  `slotEnd` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AppointmentSlot_unitId_professionalId_slotStart_key` (`unitId`,`professionalId`,`slotStart`),
  KEY `AppointmentSlot_appointmentId_slotStart_idx` (`appointmentId`,`slotStart`),
  KEY `AppointmentSlot_unitId_slotStart_idx` (`unitId`,`slotStart`),
  KEY `AppointmentSlot_professionalId_slotStart_idx` (`professionalId`,`slotStart`),
  CONSTRAINT `AppointmentSlot_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AppointmentSlot_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `professional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AppointmentSlot_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.appointmentslot: ~17 rows (aproximadamente)
DELETE FROM `appointmentslot`;
INSERT INTO `appointmentslot` (`id`, `appointmentId`, `unitId`, `professionalId`, `slotStart`, `slotEnd`, `createdAt`) VALUES
	(1, 12, 1, 1, '2026-02-13 12:00:00.000', '2026-02-13 12:30:00.000', '2026-02-13 21:20:51.316'),
	(2, 12, 1, 1, '2026-02-13 12:30:00.000', '2026-02-13 13:00:00.000', '2026-02-13 21:20:51.316'),
	(3, 13, 2, 3, '2026-02-13 12:00:00.000', '2026-02-13 12:30:00.000', '2026-02-13 21:25:04.977'),
	(4, 13, 2, 3, '2026-02-13 12:30:00.000', '2026-02-13 13:00:00.000', '2026-02-13 21:25:04.977'),
	(5, 14, 2, 3, '2026-02-13 13:00:00.000', '2026-02-13 13:30:00.000', '2026-02-13 22:08:20.270'),
	(6, 14, 2, 3, '2026-02-13 13:30:00.000', '2026-02-13 14:00:00.000', '2026-02-13 22:08:20.270'),
	(7, 15, 1, 1, '2026-02-20 12:00:00.000', '2026-02-20 12:30:00.000', '2026-02-14 22:13:10.252'),
	(8, 15, 1, 1, '2026-02-20 12:30:00.000', '2026-02-20 13:00:00.000', '2026-02-14 22:13:10.252'),
	(9, 16, 1, 5, '2026-02-17 21:00:00.000', '2026-02-17 21:30:00.000', '2026-02-14 22:21:39.969'),
	(10, 16, 1, 5, '2026-02-17 21:30:00.000', '2026-02-17 22:00:00.000', '2026-02-14 22:21:39.969'),
	(11, 17, 1, 2, '2026-02-18 12:00:00.000', '2026-02-18 12:30:00.000', '2026-02-14 23:32:41.340'),
	(12, 17, 1, 2, '2026-02-18 12:30:00.000', '2026-02-18 13:00:00.000', '2026-02-14 23:32:41.340'),
	(13, 18, 1, 1, '2026-02-18 13:00:00.000', '2026-02-18 13:30:00.000', '2026-02-14 23:44:51.159'),
	(14, 19, 1, 5, '2026-02-18 21:00:00.000', '2026-02-18 21:30:00.000', '2026-02-15 02:06:20.245'),
	(15, 19, 1, 5, '2026-02-18 21:30:00.000', '2026-02-18 22:00:00.000', '2026-02-15 02:06:20.245'),
	(16, 20, 1, 1, '2026-02-25 14:30:00.000', '2026-02-25 15:00:00.000', '2026-02-15 02:16:06.463'),
	(17, 20, 1, 1, '2026-02-25 15:00:00.000', '2026-02-25 15:30:00.000', '2026-02-15 02:16:06.463');

-- Copiando estrutura para tabela jlr_beauty.appointmentwaitlistmessage
DROP TABLE IF EXISTS `appointmentwaitlistmessage`;
CREATE TABLE IF NOT EXISTS `appointmentwaitlistmessage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `unitId` int NOT NULL,
  `requestedDate` datetime(3) NOT NULL,
  `serviceName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `clientName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clientPhone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AppointmentWaitlistMessage_unitId_requestedDate_status_idx` (`unitId`,`requestedDate`,`status`),
  CONSTRAINT `AppointmentWaitlistMessage_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.appointmentwaitlistmessage: ~0 rows (aproximadamente)
DELETE FROM `appointmentwaitlistmessage`;

-- Copiando estrutura para tabela jlr_beauty.conciergeevent
DROP TABLE IF EXISTS `conciergeevent`;
CREATE TABLE IF NOT EXISTS `conciergeevent` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` int NOT NULL,
  `direction` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('WEB','WHATSAPP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ConciergeEvent_sessionId_createdAt_idx` (`sessionId`,`createdAt`),
  CONSTRAINT `ConciergeEvent_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `conciergesession` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=233 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.conciergeevent: ~222 rows (aproximadamente)
DELETE FROM `conciergeevent`;
INSERT INTO `conciergeevent` (`id`, `sessionId`, `direction`, `channel`, `phone`, `text`, `createdAt`) VALUES
	(1, 1, 'INBOUND', 'WHATSAPP', '5511989261279', 'Boa noite', '2026-02-13 01:00:26.174'),
	(2, 1, 'OUTBOUND', 'WHATSAPP', '5511989261279', 'Qual experiencia voce deseja agendar hoje?\n1) Corte & Styling\n2) Terapia Capilar\nResponda com o numero ou nome da opcao.', '2026-02-13 01:00:26.965'),
	(3, 1, 'INBOUND', 'WHATSAPP', '5511989261279', 'Corte', '2026-02-13 01:00:50.884'),
	(4, 1, 'OUTBOUND', 'WHATSAPP', '5511989261279', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-13 01:00:51.052'),
	(5, 1, 'INBOUND', 'WHATSAPP', '5511989261279', 'teste fluxo', '2026-02-13 01:04:57.011'),
	(6, 1, 'OUTBOUND', 'WHATSAPP', '5511989261279', 'Nao entendi a unidade selecionada.\n\nQual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-13 01:04:57.136'),
	(7, 2, 'INBOUND', 'WHATSAPP', '5511989261279', 'Boa noite', '2026-02-13 01:09:49.741'),
	(8, 2, 'OUTBOUND', 'WHATSAPP', '5511989261279', 'Qual experiencia voce deseja agendar hoje?\n1) Corte & Styling\n2) Terapia Capilar\nResponda com o numero ou nome da opcao.', '2026-02-13 01:09:49.826'),
	(9, 2, 'INBOUND', 'WHATSAPP', '5511989261279', 'Boa noite', '2026-02-13 01:10:54.573'),
	(10, 2, 'OUTBOUND', 'WHATSAPP', '5511989261279', 'Nao entendi o servico selecionado.\n\nQual experiencia voce deseja agendar hoje?\n1) Corte & Styling\n2) Terapia Capilar\nResponda com o numero ou nome da opcao.', '2026-02-13 01:10:54.703'),
	(11, 2, 'INBOUND', 'WHATSAPP', '5511989261279', 'boa noite debug', '2026-02-13 01:15:43.247'),
	(12, 2, 'OUTBOUND', 'WHATSAPP', '5511989261279', 'Nao entendi o servico selecionado.\n\nQual experiencia voce deseja agendar hoje?\n1) Corte & Styling\n2) Terapia Capilar\nResponda com o numero ou nome da opcao.', '2026-02-13 01:15:43.535'),
	(13, 3, 'INBOUND', 'WHATSAPP', '5511981859426', 'boa noite origem teste', '2026-02-13 01:21:54.517'),
	(14, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual experiencia voce deseja agendar hoje?\n1) Corte & Styling\n2) Terapia Capilar\nResponda com o numero ou nome da opcao.', '2026-02-13 01:21:54.924'),
	(15, 3, 'INBOUND', 'WHATSAPP', '5511981859426', 'check 3001 phone routing', '2026-02-13 01:22:18.818'),
	(16, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Nao entendi o servico selecionado.\n\nQual experiencia voce deseja agendar hoje?\n1) Corte & Styling\n2) Terapia Capilar\nResponda com o numero ou nome da opcao.', '2026-02-13 01:22:19.079'),
	(17, 3, 'INBOUND', 'WHATSAPP', '5511981859426', 'Boa noite', '2026-02-13 01:25:07.375'),
	(18, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Nao entendi o servico selecionado.\n\nQual experiencia voce deseja agendar hoje?\n1) Corte & Styling\n2) Terapia Capilar\nResponda com o numero ou nome da opcao.', '2026-02-13 01:25:07.459'),
	(19, 3, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-13 01:25:13.748'),
	(20, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-13 01:25:13.845'),
	(21, 3, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-13 01:25:18.812'),
	(22, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario entre 09:00 e 17:00:\n1) 09:00\n2) 10:00\n3) 11:00\n4) 12:00\n5) 13:00\n6) 14:00\n7) 15:00\n8) 16:00\n9) 17:00\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-13 01:25:18.901'),
	(23, 3, 'INBOUND', 'WHATSAPP', '5511981859426', '5', '2026-02-13 01:25:28.097'),
	(24, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-13 01:25:28.190'),
	(25, 3, 'INBOUND', 'WHATSAPP', '5511981859426', '5', '2026-02-13 01:25:54.491'),
	(26, 3, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 13:00\nNome: 5\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T01:25:54.517Z', '2026-02-13 01:25:54.618'),
	(27, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 13:00\nNome: 5\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T01:25:54.517Z', '2026-02-13 01:25:54.699'),
	(28, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-13 01:25:54.765'),
	(29, 3, 'INBOUND', 'WHATSAPP', '5511981859426', '5', '2026-02-13 01:25:54.767'),
	(30, 3, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 13:00\nNome: 5\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T01:25:54.784Z', '2026-02-13 01:25:54.863'),
	(31, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 13:00\nNome: 5\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T01:25:54.784Z', '2026-02-13 01:25:54.919'),
	(32, 3, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-13 01:25:54.973'),
	(33, 4, 'INBOUND', 'WHATSAPP', '5511981859426', 'Boa noite', '2026-02-13 06:16:08.700'),
	(34, 4, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual experiencia voce deseja agendar hoje?\n1) Acupuntura\n2) Aplicação Coloração Capilar\n3) Aplicação de Enzimas\n4) Aplicação Mega Hair\n5) Baby Liss  / Cachos\n6) Banho de Lua\n7) Banho em Gel\n8) Barba\n9) BB Glow\n10) Blindagem\n11) Botox Capilar\n12) Brow Lamination\n13) Coloração Capilar\n14) Corte & Styling\n15) Corte Feminino\n16) Corte Masculino\n17) Depilação Axilas\n18) Depilação Barba (Cera)\n19) Depilação Barriga\n20) Depilação Braços\n21) Depilação Buço (Cera)\n22) Depilação Buço (Linha)\n23) Depilação Costas\n24) Depilação Coxas\n25) Depilação Meia Perna\n26) Depilação Nariz\n27) Depilação Rosto (Linha)\n28) Depilação Virilha (Cavada)\n29) Depilação Virilha (Completa)\n30) Dermaplaning\n31) Design de Sobrancelha\n32) Drenagem Linfática\n33) Drenagem Linfática (Aparelho)\n34) Drenagem Linfática (Pós - Operatório)\n35) Drenagem Linfática Facial\n36) Escova + Hidratação\n37) Escova + Prancha\n38) Escova Capilar\n39) Escova Modelada\n40) Esfoliação de Pés\n41) Esmaltação em Gel\n42) Esmaltação Tradicional\n43) Extensão De Cilios\n44) Francesinha\n45) Hidralips\n46) Hidratação Capilar\n47) Lash Lifting\n48) Lavagem / Secagem Simples\n49) Limpeza de Pele\n50) Limpeza de Sobrancelha\n51) Manicure\n52) Manicure + Francesinha\n53) Manicure + Pedicure\n54) Manicure + Pedicure Masculino\n55) Manicure Masculino\n56) Manutenção Cilios\n57) Manutenção Mega Hair\n58) Maquiagem\n59) Massagem Relaxante\n60) Pedicure\n61) Pedicure + Francesinha\n62) Pedicure + Reflexologia\n63) Pedicure Masculino\n64) Penteado\n65) Progressiva Capilar\n66) Reconstrução Capilar\n67) Remoção de Alongamento\n68) Remoção de Cilios\n69) Secagem De Vasinho\n70) Selagem Capilar\n71) Spa das Mãos\n72) Spa dos Pés + Cutílagem\n73) Terapia Capilar\n74) Top Coat\n75) Toxina Botulínica (Botox)\nResponda com o numero ou nome da opcao.', '2026-02-13 06:16:09.321'),
	(35, 4, 'INBOUND', 'WHATSAPP', '5511981859426', '14', '2026-02-13 06:16:23.071'),
	(36, 4, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-13 06:16:23.212'),
	(37, 4, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-13 06:16:30.154'),
	(38, 4, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario entre 09:00 e 17:00:\n1) 09:00\n2) 10:00\n3) 11:00\n4) 12:00\n5) 13:00\n6) 14:00\n7) 15:00\n8) 16:00\n9) 17:00\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-13 06:16:30.360'),
	(39, 4, 'INBOUND', 'WHATSAPP', '5511981859426', '8', '2026-02-13 06:16:37.020'),
	(40, 4, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-13 06:16:37.120'),
	(41, 4, 'INBOUND', 'WHATSAPP', '5511981859426', 'Rato Borrachudo', '2026-02-13 06:16:59.322'),
	(42, 4, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 16:00\nNome: Rato Borrachudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T06:16:59.341Z', '2026-02-13 06:16:59.440'),
	(43, 4, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 16:00\nNome: Rato Borrachudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T06:16:59.341Z', '2026-02-13 06:16:59.532'),
	(44, 4, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-13 06:16:59.597'),
	(45, 5, 'INBOUND', 'WHATSAPP', '5511981859426', 'Bom dia', '2026-02-13 13:22:55.112'),
	(46, 5, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual experiencia voce deseja agendar hoje?\n1) Acupuntura\n2) Aplicação Coloração Capilar\n3) Aplicação de Enzimas\n4) Aplicação Mega Hair\n5) Baby Liss  / Cachos\n6) Banho de Lua\n7) Banho em Gel\n8) Barba\n9) BB Glow\n10) Blindagem\n11) Botox Capilar\n12) Brow Lamination\n13) Coloração Capilar\n14) Corte & Styling\n15) Corte Feminino\n16) Corte Masculino\n17) Depilação Axilas\n18) Depilação Barba (Cera)\n19) Depilação Barriga\n20) Depilação Braços\n21) Depilação Buço (Cera)\n22) Depilação Buço (Linha)\n23) Depilação Costas\n24) Depilação Coxas\n25) Depilação Meia Perna\n26) Depilação Nariz\n27) Depilação Rosto (Linha)\n28) Depilação Virilha (Cavada)\n29) Depilação Virilha (Completa)\n30) Dermaplaning\n31) Design de Sobrancelha\n32) Drenagem Linfática\n33) Drenagem Linfática (Aparelho)\n34) Drenagem Linfática (Pós - Operatório)\n35) Drenagem Linfática Facial\n36) Escova + Hidratação\n37) Escova + Prancha\n38) Escova Capilar\n39) Escova Modelada\n40) Esfoliação de Pés\n41) Esmaltação em Gel\n42) Esmaltação Tradicional\n43) Extensão De Cilios\n44) Francesinha\n45) Hidralips\n46) Hidratação Capilar\n47) Lash Lifting\n48) Lavagem / Secagem Simples\n49) Limpeza de Pele\n50) Limpeza de Sobrancelha\n51) Manicure\n52) Manicure + Francesinha\n53) Manicure + Pedicure\n54) Manicure + Pedicure Masculino\n55) Manicure Masculino\n56) Manutenção Cilios\n57) Manutenção Mega Hair\n58) Maquiagem\n59) Massagem Relaxante\n60) Pedicure\n61) Pedicure + Francesinha\n62) Pedicure + Reflexologia\n63) Pedicure Masculino\n64) Penteado\n65) Progressiva Capilar\n66) Reconstrução Capilar\n67) Remoção de Alongamento\n68) Remoção de Cilios\n69) Secagem De Vasinho\n70) Selagem Capilar\n71) Spa das Mãos\n72) Spa dos Pés + Cutílagem\n73) Terapia Capilar\n74) Top Coat\n75) Toxina Botulínica (Botox)\nResponda com o numero ou nome da opcao.', '2026-02-13 13:22:55.607'),
	(47, 5, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-13 13:23:16.805'),
	(48, 5, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-13 13:23:17.018'),
	(49, 5, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-13 13:23:24.780'),
	(50, 5, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario entre 09:00 e 17:00:\n1) 09:00\n2) 10:00\n3) 11:00\n4) 12:00\n5) 13:00\n6) 14:00\n7) 15:00\n8) 16:00\n9) 17:00\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-13 13:23:24.979'),
	(51, 5, 'INBOUND', 'WHATSAPP', '5511981859426', '7', '2026-02-13 13:23:31.157'),
	(52, 5, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-13 13:23:31.428'),
	(53, 5, 'INBOUND', 'WHATSAPP', '5511981859426', 'NICOLE TESTES ITALIA', '2026-02-13 13:23:58.694'),
	(54, 5, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Acupuntura\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: NICOLE TESTES ITALIA\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T13:23:58.713Z', '2026-02-13 13:23:58.809'),
	(55, 5, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Acupuntura\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: NICOLE TESTES ITALIA\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T13:23:58.713Z', '2026-02-13 13:23:58.842'),
	(56, 5, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-13 13:23:58.874'),
	(57, 6, 'INBOUND', 'WHATSAPP', '5511977493874', 'Bom dia', '2026-02-13 13:25:17.940'),
	(58, 6, 'OUTBOUND', 'WHATSAPP', '5511977493874', 'Qual experiencia voce deseja agendar hoje?\n1) Acupuntura\n2) Aplicação Coloração Capilar\n3) Aplicação de Enzimas\n4) Aplicação Mega Hair\n5) Baby Liss  / Cachos\n6) Banho de Lua\n7) Banho em Gel\n8) Barba\n9) BB Glow\n10) Blindagem\n11) Botox Capilar\n12) Brow Lamination\n13) Coloração Capilar\n14) Corte & Styling\n15) Corte Feminino\n16) Corte Masculino\n17) Depilação Axilas\n18) Depilação Barba (Cera)\n19) Depilação Barriga\n20) Depilação Braços\n21) Depilação Buço (Cera)\n22) Depilação Buço (Linha)\n23) Depilação Costas\n24) Depilação Coxas\n25) Depilação Meia Perna\n26) Depilação Nariz\n27) Depilação Rosto (Linha)\n28) Depilação Virilha (Cavada)\n29) Depilação Virilha (Completa)\n30) Dermaplaning\n31) Design de Sobrancelha\n32) Drenagem Linfática\n33) Drenagem Linfática (Aparelho)\n34) Drenagem Linfática (Pós - Operatório)\n35) Drenagem Linfática Facial\n36) Escova + Hidratação\n37) Escova + Prancha\n38) Escova Capilar\n39) Escova Modelada\n40) Esfoliação de Pés\n41) Esmaltação em Gel\n42) Esmaltação Tradicional\n43) Extensão De Cilios\n44) Francesinha\n45) Hidralips\n46) Hidratação Capilar\n47) Lash Lifting\n48) Lavagem / Secagem Simples\n49) Limpeza de Pele\n50) Limpeza de Sobrancelha\n51) Manicure\n52) Manicure + Francesinha\n53) Manicure + Pedicure\n54) Manicure + Pedicure Masculino\n55) Manicure Masculino\n56) Manutenção Cilios\n57) Manutenção Mega Hair\n58) Maquiagem\n59) Massagem Relaxante\n60) Pedicure\n61) Pedicure + Francesinha\n62) Pedicure + Reflexologia\n63) Pedicure Masculino\n64) Penteado\n65) Progressiva Capilar\n66) Reconstrução Capilar\n67) Remoção de Alongamento\n68) Remoção de Cilios\n69) Secagem De Vasinho\n70) Selagem Capilar\n71) Spa das Mãos\n72) Spa dos Pés + Cutílagem\n73) Terapia Capilar\n74) Top Coat\n75) Toxina Botulínica (Botox)\nResponda com o numero ou nome da opcao.', '2026-02-13 13:25:18.105'),
	(59, 6, 'INBOUND', 'WHATSAPP', '5511977493874', '51', '2026-02-13 13:25:38.617'),
	(60, 6, 'OUTBOUND', 'WHATSAPP', '5511977493874', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-13 13:25:38.733'),
	(61, 6, 'INBOUND', 'WHATSAPP', '5511977493874', '2', '2026-02-13 13:26:13.514'),
	(62, 6, 'OUTBOUND', 'WHATSAPP', '5511977493874', 'Escolha um horario entre 09:00 e 17:00:\n1) 09:00\n2) 10:00\n3) 11:00\n4) 12:00\n5) 13:00\n6) 14:00\n7) 15:00\n8) 16:00\n9) 17:00\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-13 13:26:13.684'),
	(63, 6, 'INBOUND', 'WHATSAPP', '5511977493874', '15:00', '2026-02-13 13:28:15.821'),
	(64, 6, 'OUTBOUND', 'WHATSAPP', '5511977493874', 'Perfeito. Agora informe seu nome completo.', '2026-02-13 13:28:15.962'),
	(65, 6, 'INBOUND', 'WHATSAPP', '5511977493874', 'Faltou os dias da semana.', '2026-02-13 13:28:36.490'),
	(66, 6, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Manicure\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: Faltou os dias da semana.\nTelefone: 5511977493874\nFinalizado em: 2026-02-13T13:28:36.548Z', '2026-02-13 13:28:36.729'),
	(67, 6, 'OUTBOUND', 'WHATSAPP', '5511977493874', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Manicure\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: Faltou os dias da semana.\nTelefone: 5511977493874\nFinalizado em: 2026-02-13T13:28:36.548Z', '2026-02-13 13:28:36.772'),
	(68, 6, 'OUTBOUND', 'WHATSAPP', '5511977493874', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-13 13:28:36.963'),
	(69, 7, 'INBOUND', 'WHATSAPP', '5518998268716', 'Painhoo', '2026-02-13 13:50:58.817'),
	(70, 7, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Qual experiencia voce deseja agendar hoje?\n1) Acupuntura\n2) Aplicação Coloração Capilar\n3) Aplicação de Enzimas\n4) Aplicação Mega Hair\n5) Baby Liss  / Cachos\n6) Banho de Lua\n7) Banho em Gel\n8) Barba\n9) BB Glow\n10) Blindagem\n11) Botox Capilar\n12) Brow Lamination\n13) Coloração Capilar\n14) Corte & Styling\n15) Corte Feminino\n16) Corte Masculino\n17) Depilação Axilas\n18) Depilação Barba (Cera)\n19) Depilação Barriga\n20) Depilação Braços\n21) Depilação Buço (Cera)\n22) Depilação Buço (Linha)\n23) Depilação Costas\n24) Depilação Coxas\n25) Depilação Meia Perna\n26) Depilação Nariz\n27) Depilação Rosto (Linha)\n28) Depilação Virilha (Cavada)\n29) Depilação Virilha (Completa)\n30) Dermaplaning\n31) Design de Sobrancelha\n32) Drenagem Linfática\n33) Drenagem Linfática (Aparelho)\n34) Drenagem Linfática (Pós - Operatório)\n35) Drenagem Linfática Facial\n36) Escova + Hidratação\n37) Escova + Prancha\n38) Escova Capilar\n39) Escova Modelada\n40) Esfoliação de Pés\n41) Esmaltação em Gel\n42) Esmaltação Tradicional\n43) Extensão De Cilios\n44) Francesinha\n45) Hidralips\n46) Hidratação Capilar\n47) Lash Lifting\n48) Lavagem / Secagem Simples\n49) Limpeza de Pele\n50) Limpeza de Sobrancelha\n51) Manicure\n52) Manicure + Francesinha\n53) Manicure + Pedicure\n54) Manicure + Pedicure Masculino\n55) Manicure Masculino\n56) Manutenção Cilios\n57) Manutenção Mega Hair\n58) Maquiagem\n59) Massagem Relaxante\n60) Pedicure\n61) Pedicure + Francesinha\n62) Pedicure + Reflexologia\n63) Pedicure Masculino\n64) Penteado\n65) Progressiva Capilar\n66) Reconstrução Capilar\n67) Remoção de Alongamento\n68) Remoção de Cilios\n69) Secagem De Vasinho\n70) Selagem Capilar\n71) Spa das Mãos\n72) Spa dos Pés + Cutílagem\n73) Terapia Capilar\n74) Top Coat\n75) Toxina Botulínica (Botox)\nResponda com o numero ou nome da opcao.', '2026-02-13 13:50:58.999'),
	(71, 7, 'INBOUND', 'WHATSAPP', '5518998268716', 'Bom diaa', '2026-02-13 13:50:59.629'),
	(72, 7, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Nao entendi o servico selecionado.\n\nQual experiencia voce deseja agendar hoje?\n1) Acupuntura\n2) Aplicação Coloração Capilar\n3) Aplicação de Enzimas\n4) Aplicação Mega Hair\n5) Baby Liss  / Cachos\n6) Banho de Lua\n7) Banho em Gel\n8) Barba\n9) BB Glow\n10) Blindagem\n11) Botox Capilar\n12) Brow Lamination\n13) Coloração Capilar\n14) Corte & Styling\n15) Corte Feminino\n16) Corte Masculino\n17) Depilação Axilas\n18) Depilação Barba (Cera)\n19) Depilação Barriga\n20) Depilação Braços\n21) Depilação Buço (Cera)\n22) Depilação Buço (Linha)\n23) Depilação Costas\n24) Depilação Coxas\n25) Depilação Meia Perna\n26) Depilação Nariz\n27) Depilação Rosto (Linha)\n28) Depilação Virilha (Cavada)\n29) Depilação Virilha (Completa)\n30) Dermaplaning\n31) Design de Sobrancelha\n32) Drenagem Linfática\n33) Drenagem Linfática (Aparelho)\n34) Drenagem Linfática (Pós - Operatório)\n35) Drenagem Linfática Facial\n36) Escova + Hidratação\n37) Escova + Prancha\n38) Escova Capilar\n39) Escova Modelada\n40) Esfoliação de Pés\n41) Esmaltação em Gel\n42) Esmaltação Tradicional\n43) Extensão De Cilios\n44) Francesinha\n45) Hidralips\n46) Hidratação Capilar\n47) Lash Lifting\n48) Lavagem / Secagem Simples\n49) Limpeza de Pele\n50) Limpeza de Sobrancelha\n51) Manicure\n52) Manicure + Francesinha\n53) Manicure + Pedicure\n54) Manicure + Pedicure Masculino\n55) Manicure Masculino\n56) Manutenção Cilios\n57) Manutenção Mega Hair\n58) Maquiagem\n59) Massagem Relaxante\n60) Pedicure\n61) Pedicure + Francesinha\n62) Pedicure + Reflexologia\n63) Pedicure Masculino\n64) Penteado\n65) Progressiva Capilar\n66) Reconstrução Capilar\n67) Remoção de Alongamento\n68) Remoção de Cilios\n69) Secagem De Vasinho\n70) Selagem Capilar\n71) Spa das Mãos\n72) Spa dos Pés + Cutílagem\n73) Terapia Capilar\n74) Top Coat\n75) Toxina Botulínica (Botox)\nResponda com o numero ou nome da opcao.', '2026-02-13 13:50:59.668'),
	(73, 7, 'INBOUND', 'WHATSAPP', '5518998268716', '10', '2026-02-13 13:51:20.486'),
	(74, 7, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-13 13:51:20.667'),
	(75, 7, 'INBOUND', 'WHATSAPP', '5518998268716', '2', '2026-02-13 13:51:36.123'),
	(76, 7, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Escolha um horario entre 09:00 e 17:00:\n1) 09:00\n2) 10:00\n3) 11:00\n4) 12:00\n5) 13:00\n6) 14:00\n7) 15:00\n8) 16:00\n9) 17:00\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-13 13:51:36.245'),
	(77, 7, 'INBOUND', 'WHATSAPP', '5518998268716', '7', '2026-02-13 13:51:47.015'),
	(78, 7, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Perfeito. Agora informe seu nome completo.', '2026-02-13 13:51:47.148'),
	(79, 7, 'INBOUND', 'WHATSAPP', '5518998268716', 'Stephanie', '2026-02-13 13:52:02.673'),
	(80, 7, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Blindagem\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: Stephanie\nTelefone: 5518998268716\nFinalizado em: 2026-02-13T13:52:02.687Z', '2026-02-13 13:52:02.870'),
	(81, 7, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Blindagem\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: Stephanie\nTelefone: 5518998268716\nFinalizado em: 2026-02-13T13:52:02.687Z', '2026-02-13 13:52:02.899'),
	(82, 7, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-13 13:52:02.928'),
	(83, 8, 'INBOUND', 'WHATSAPP', '5518998268716', 'Obrigada', '2026-02-13 13:52:28.645'),
	(84, 8, 'OUTBOUND', 'WHATSAPP', '5518998268716', 'Qual experiencia voce deseja agendar hoje?\n1) Acupuntura\n2) Aplicação Coloração Capilar\n3) Aplicação de Enzimas\n4) Aplicação Mega Hair\n5) Baby Liss  / Cachos\n6) Banho de Lua\n7) Banho em Gel\n8) Barba\n9) BB Glow\n10) Blindagem\n11) Botox Capilar\n12) Brow Lamination\n13) Coloração Capilar\n14) Corte & Styling\n15) Corte Feminino\n16) Corte Masculino\n17) Depilação Axilas\n18) Depilação Barba (Cera)\n19) Depilação Barriga\n20) Depilação Braços\n21) Depilação Buço (Cera)\n22) Depilação Buço (Linha)\n23) Depilação Costas\n24) Depilação Coxas\n25) Depilação Meia Perna\n26) Depilação Nariz\n27) Depilação Rosto (Linha)\n28) Depilação Virilha (Cavada)\n29) Depilação Virilha (Completa)\n30) Dermaplaning\n31) Design de Sobrancelha\n32) Drenagem Linfática\n33) Drenagem Linfática (Aparelho)\n34) Drenagem Linfática (Pós - Operatório)\n35) Drenagem Linfática Facial\n36) Escova + Hidratação\n37) Escova + Prancha\n38) Escova Capilar\n39) Escova Modelada\n40) Esfoliação de Pés\n41) Esmaltação em Gel\n42) Esmaltação Tradicional\n43) Extensão De Cilios\n44) Francesinha\n45) Hidralips\n46) Hidratação Capilar\n47) Lash Lifting\n48) Lavagem / Secagem Simples\n49) Limpeza de Pele\n50) Limpeza de Sobrancelha\n51) Manicure\n52) Manicure + Francesinha\n53) Manicure + Pedicure\n54) Manicure + Pedicure Masculino\n55) Manicure Masculino\n56) Manutenção Cilios\n57) Manutenção Mega Hair\n58) Maquiagem\n59) Massagem Relaxante\n60) Pedicure\n61) Pedicure + Francesinha\n62) Pedicure + Reflexologia\n63) Pedicure Masculino\n64) Penteado\n65) Progressiva Capilar\n66) Reconstrução Capilar\n67) Remoção de Alongamento\n68) Remoção de Cilios\n69) Secagem De Vasinho\n70) Selagem Capilar\n71) Spa das Mãos\n72) Spa dos Pés + Cutílagem\n73) Terapia Capilar\n74) Top Coat\n75) Toxina Botulínica (Botox)\nResponda com o numero ou nome da opcao.', '2026-02-13 13:52:28.777'),
	(85, 9, 'SYSTEM', 'WEB', '5511999999999', 'Sessao finalizada via site.', '2026-02-13 15:35:58.661'),
	(86, 9, 'OUTBOUND', 'WEB', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WEB\nServico: Acupuntura\nUnidade: Birmann 20\nData: 13/02/2026\nHorario: 09:00\nAgendado para: 2026-02-13T09:00:00.000Z\nNome: Teste Integracao\nTelefone: 5511999999999\nFinalizado em: 2026-02-13T15:35:58.644Z', '2026-02-13 15:35:59.196'),
	(87, 9, 'OUTBOUND', 'WEB', '5511999999999', 'Resumo de Agendamento - Concierge JLR\nOrigem: WEB\nServico: Acupuntura\nUnidade: Birmann 20\nData: 13/02/2026\nHorario: 09:00\nAgendado para: 2026-02-13T09:00:00.000Z\nNome: Teste Integracao\nTelefone: 5511999999999\nFinalizado em: 2026-02-13T15:35:58.644Z', '2026-02-13 15:35:59.250'),
	(88, 10, 'INBOUND', 'WHATSAPP', '5511981859426', 'Boa tarde', '2026-02-14 20:43:38.590'),
	(89, 10, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual experiencia voce deseja agendar hoje?\n1) Acupuntura\n2) Aplicação Coloração Capilar\n3) Aplicação de Enzimas\n4) Aplicação Mega Hair\n5) Baby Liss  / Cachos\n6) Banho de Lua\n7) Banho em Gel\n8) Barba\n9) BB Glow\n10) Blindagem\n11) Botox Capilar\n12) Brow Lamination\n13) Coloração Capilar\n14) Corte & Styling\n15) Corte Feminino\n16) Corte Masculino\n17) Depilação Axilas\n18) Depilação Barba (Cera)\n19) Depilação Barriga\n20) Depilação Braços\n21) Depilação Buço (Cera)\n22) Depilação Buço (Linha)\n23) Depilação Costas\n24) Depilação Coxas\n25) Depilação Meia Perna\n26) Depilação Nariz\n27) Depilação Rosto (Linha)\n28) Depilação Virilha (Cavada)\n29) Depilação Virilha (Completa)\n30) Dermaplaning\n31) Design de Sobrancelha\n32) Drenagem Linfática\n33) Drenagem Linfática (Aparelho)\n34) Drenagem Linfática (Pós - Operatório)\n35) Drenagem Linfática Facial\n36) Escova + Hidratação\n37) Escova + Prancha\n38) Escova Capilar\n39) Escova Modelada\n40) Esfoliação de Pés\n41) Esmaltação em Gel\n42) Esmaltação Tradicional\n43) Extensão De Cilios\n44) Francesinha\n45) Hidralips\n46) Hidratação Capilar\n47) Lash Lifting\n48) Lavagem / Secagem Simples\n49) Limpeza de Pele\n50) Limpeza de Sobrancelha\n51) Manicure\n52) Manicure + Francesinha\n53) Manicure + Pedicure\n54) Manicure + Pedicure Masculino\n55) Manicure Masculino\n56) Manutenção Cilios\n57) Manutenção Mega Hair\n58) Maquiagem\n59) Massagem Relaxante\n60) Pedicure\n61) Pedicure + Francesinha\n62) Pedicure + Reflexologia\n63) Pedicure Masculino\n64) Penteado\n65) Progressiva Capilar\n66) Reconstrução Capilar\n67) Remoção de Alongamento\n68) Remoção de Cilios\n69) Retorno Botox\n70) Secagem De Vasinho\n71) Selagem Capilar\n72) Spa das Mãos\n73) Spa dos Pés + Cutílagem\n74) Terapia Capilar\n75) Top Coat\n76) Toxina Botulínica (Botox)\nResponda com o numero ou nome da opcao.', '2026-02-14 20:43:39.096'),
	(90, 10, 'INBOUND', 'WHATSAPP', '5511981859426', '4', '2026-02-14 20:43:52.521'),
	(91, 10, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-14 20:43:52.769'),
	(92, 10, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 20:43:59.271'),
	(93, 10, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual data voce prefere para o agendamento?\n1) 14/02/2026 (Sab)\n2) 15/02/2026 (Dom)\n3) 16/02/2026 (Seg)\n4) 17/02/2026 (Ter)\n5) 18/02/2026 (Qua)\n6) 19/02/2026 (Qui)\n7) 20/02/2026 (Sex)\n8) 21/02/2026 (Sab)\n9) 22/02/2026 (Dom)\n10) 23/02/2026 (Seg)\n11) 24/02/2026 (Ter)\n12) 25/02/2026 (Qua)\n13) 26/02/2026 (Qui)\n14) 27/02/2026 (Sex)\nResponda com o numero ou data exibida.', '2026-02-14 20:43:59.398'),
	(94, 10, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 20:44:16.201'),
	(95, 10, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario entre 09:00 e 17:00:\n1) 09:00\n2) 10:00\n3) 11:00\n4) 12:00\n5) 13:00\n6) 14:00\n7) 15:00\n8) 16:00\n9) 17:00\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-14 20:44:16.302'),
	(96, 10, 'INBOUND', 'WHATSAPP', '5511981859426', '3', '2026-02-14 20:44:22.843'),
	(97, 10, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-14 20:44:22.998'),
	(98, 10, 'INBOUND', 'WHATSAPP', '5511981859426', 'Tonimek', '2026-02-14 20:44:34.802'),
	(99, 10, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Aplicação Mega Hair\nUnidade: Parque da Cidade\nData: 15/02/2026 (Dom)\nHorario: 11:00\nAgendado para: 2026-02-15T14:00:00.000Z\nNome: Tonimek\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T20:44:34.818Z', '2026-02-14 20:44:34.900'),
	(100, 10, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Aplicação Mega Hair\nUnidade: Parque da Cidade\nData: 15/02/2026 (Dom)\nHorario: 11:00\nAgendado para: 2026-02-15T14:00:00.000Z\nNome: Tonimek\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T20:44:34.818Z', '2026-02-14 20:44:34.934'),
	(101, 10, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-14 20:44:34.974'),
	(102, 11, 'INBOUND', 'WHATSAPP', '5511981859426', 'Boa tarde', '2026-02-14 21:11:51.751'),
	(103, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-14 21:11:52.198'),
	(104, 11, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 21:12:02.123'),
	(105, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual data voce prefere para o agendamento?\n1) 14/02/2026 (Sab)\n2) 15/02/2026 (Dom)\n3) 16/02/2026 (Seg)\n4) 17/02/2026 (Ter)\n5) 18/02/2026 (Qua)\n6) 19/02/2026 (Qui)\n7) 20/02/2026 (Sex)\n8) 21/02/2026 (Sab)\n9) 22/02/2026 (Dom)\n10) 23/02/2026 (Seg)\n11) 24/02/2026 (Ter)\n12) 25/02/2026 (Qua)\n13) 26/02/2026 (Qui)\n14) 27/02/2026 (Sex)\nResponda com o numero ou data exibida.', '2026-02-14 21:12:02.320'),
	(106, 11, 'INBOUND', 'WHATSAPP', '5511981859426', '15', '2026-02-14 21:12:16.765'),
	(107, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual servico voce deseja agendar?\nCategoria: Cabeleireiro Feminino\n1) Aplicação Coloração Capilar (19 vagas)\n2) Aplicação Mega Hair (15 vagas)\n3) Baby Liss  / Cachos (19 vagas)\n4) Botox Capilar (17 vagas)\n5) Coloração Capilar (18 vagas)\n6) Corte Feminino (19 vagas)\n7) Escova + Hidratação (19 vagas)\n8) Escova + Prancha (19 vagas)\n9) Escova Capilar (19 vagas)\n10) Escova Modelada (19 vagas)\n11) Hidratação Capilar (19 vagas)\n12) Lavagem / Secagem Simples (20 vagas)\n13) Manutenção Mega Hair (17 vagas)\n14) Penteado (19 vagas)\n15) Progressiva Capilar (15 vagas)\n16) Reconstrução Capilar (19 vagas)\n17) Selagem Capilar (17 vagas)\n18) Terapia Capilar (18 vagas)\nCategoria: Cabeleireiro Masculino\n19) Barba (20 vagas)\n20) Corte Masculino (19 vagas)\nCategoria: Depilação\n21) Depilação Axilas (18 vagas)\n22) Depilação Barba (Cera) (18 vagas)\n23) Depilação Barriga (18 vagas)\n24) Depilação Braços (17 vagas)\n25) Depilação Buço (Cera) (18 vagas)\n26) Depilação Buço (Linha) (18 vagas)\n27) Depilação Costas (17 vagas)\n28) Depilação Coxas (17 vagas)\n29) Depilação Meia Perna (17 vagas)\n30) Depilação Nariz (18 vagas)\n31) Depilação Rosto (Linha) (18 vagas)\n32) Depilação Virilha (Cavada) (17 vagas)\n33) Depilação Virilha (Completa) (17 vagas)\nCategoria: Estética Corporal\n34) Acupuntura (17 vagas)\n35) Aplicação de Enzimas (18 vagas)\n36) Banho de Lua (17 vagas)\n37) Drenagem Linfática (17 vagas)\n38) Drenagem Linfática (Aparelho) (17 vagas)\n39) Drenagem Linfática (Pós - Operatório) (17 vagas)\n40) Massagem Relaxante (17 vagas)\n41) Secagem De Vasinho (18 vagas)\nCategoria: Estética Facial\n42) BB Glow (17 vagas)\n43) Brow Lamination (17 vagas)\n44) Dermaplaning (17 vagas)\n45) Design de Sobrancelha (17 vagas)\n46) Drenagem Linfática Facial (17 vagas)\n47) Extensão De Cilios (16 vagas)\n48) Hidralips (17 vagas)\n49) Lash Lifting (17 vagas)\n50) Limpeza de Pele (17 vagas)\n51) Limpeza de Sobrancelha (18 vagas)\n52) Manutenção Cilios (16 vagas)\n53) Maquiagem (17 vagas)\n54) Remoção de Cilios (18 vagas)\n55) Retorno Botox (18 vagas)\n56) Toxina Botulínica (Botox) (18 vagas)\nCategoria: Manicure & Pedicure\n57) Esfoliação de Pés (18 vagas)\n58) Esmaltação Tradicional (18 vagas)\n59) Francesinha (18 vagas)\n60) Manicure (19 vagas)\n61) Manicure + Francesinha (19 vagas)\n62) Manicure + Pedicure (17 vagas)\n63) Manicure + Pedicure Masculino (18 vagas)\n64) Manicure Masculino (20 vagas)\n65) Pedicure (19 vagas)\n66) Pedicure + Francesinha (19 vagas)\n67) Pedicure + Reflexologia (18 vagas)\n68) Pedicure Masculino (19 vagas)\n69) Remoção de Alongamento (18 vagas)\n70) Spa das Mãos (17 vagas)\n71) Spa dos Pés + Cutílagem (16 vagas)\n72) Top Coat (18 vagas)\nCategoria: Nails Designer\n73) Banho em Gel (19 vagas)\n74) Blindagem (19 vagas)\n75) Esmaltação em Gel (19 vagas)\nResponda com o numero ou nome do servico.', '2026-02-14 21:12:17.766'),
	(108, 11, 'INBOUND', 'WHATSAPP', '5511981859426', '22', '2026-02-14 21:12:46.641'),
	(109, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual periodo voce prefere?\n1) Manha (6 vagas)\n2) Tarde (12 vagas)\nResponda com o numero ou nome do periodo.', '2026-02-14 21:12:47.525'),
	(110, 11, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 21:12:56.658'),
	(111, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario disponivel no periodo Tarde:\n1) 12:00 (2 profissionais)\n2) 12:30 (2 profissionais)\n3) 13:00 (2 profissionais)\n4) 13:30 (2 profissionais)\n5) 14:00 (2 profissionais)\n6) 14:30 (2 profissionais)\n7) 15:00 (2 profissionais)\n8) 15:30 (2 profissionais)\n9) 16:00 (2 profissionais)\n10) 16:30 (2 profissionais)\n11) 17:00 (2 profissionais)\n12) 17:30 (2 profissionais)\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-14 21:12:56.783'),
	(112, 11, 'INBOUND', 'WHATSAPP', '5511981859426', '12', '2026-02-14 21:13:08.023'),
	(113, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-14 21:13:08.145'),
	(114, 11, 'INBOUND', 'WHATSAPP', '5511981859426', 'Gordox barbudo', '2026-02-14 21:13:25.445'),
	(115, 11, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Depilação Barba (Cera)\nUnidade: Parque da Cidade\nData: 15/02/2026 (Dom)\nHorario: 17:30\nAgendado para: 2026-02-15T20:30:00.000Z\nNome: Gordox barbudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T21:13:25.459Z', '2026-02-14 21:13:25.554'),
	(116, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Depilação Barba (Cera)\nUnidade: Parque da Cidade\nData: 15/02/2026 (Dom)\nHorario: 17:30\nAgendado para: 2026-02-15T20:30:00.000Z\nNome: Gordox barbudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T21:13:25.459Z', '2026-02-14 21:13:25.588'),
	(117, 11, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-14 21:13:25.621'),
	(118, 12, 'INBOUND', 'WHATSAPP', '5511981859426', 'Boa', '2026-02-14 22:19:58.690'),
	(119, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite! Seja bem vinda.\nQual tratamento deseja fazer hoje?\nCategoria: Cabeleireiro Feminino\n1) Aplicação Coloração Capilar\n2) Aplicação Mega Hair\n3) Baby Liss  / Cachos\n4) Botox Capilar\n5) Coloração Capilar\n6) Corte Feminino\n7) Escova + Hidratação\n8) Escova + Prancha\n9) Escova Capilar\n10) Escova Modelada\n11) Hidratação Capilar\n12) Lavagem / Secagem Simples\n13) Manutenção Mega Hair\n14) Penteado\n15) Progressiva Capilar\n16) Reconstrução Capilar\n17) Selagem Capilar\n18) Terapia Capilar\nCategoria: Cabeleireiro Masculino\n19) Barba\n20) Corte Masculino\nCategoria: Depilação\n21) Depilação Axilas\n22) Depilação Barba (Cera)\n23) Depilação Barriga\n24) Depilação Braços\n25) Depilação Buço (Cera)\n26) Depilação Buço (Linha)\n27) Depilação Costas\n28) Depilação Coxas\n29) Depilação Meia Perna\n30) Depilação Nariz\n31) Depilação Rosto (Linha)\n32) Depilação Virilha (Cavada)\n33) Depilação Virilha (Completa)\nCategoria: Estética Corporal\n34) Acupuntura\n35) Aplicação de Enzimas\n36) Banho de Lua\n37) Drenagem Linfática\n38) Drenagem Linfática (Aparelho)\n39) Drenagem Linfática (Pós - Operatório)\n40) Massagem Relaxante\n41) Secagem De Vasinho\nCategoria: Estética Facial\n42) BB Glow\n43) Brow Lamination\n44) Dermaplaning\n45) Design de Sobrancelha\n46) Drenagem Linfática Facial\n47) Extensão De Cilios\n48) Hidralips\n49) Lash Lifting\n50) Limpeza de Pele\n51) Limpeza de Sobrancelha\n52) Manutenção Cilios\n53) Maquiagem\n54) Remoção de Cilios\n55) Retorno Botox\n56) Toxina Botulínica (Botox)\nCategoria: Manicure & Pedicure\n57) Esfoliação de Pés\n58) Esmaltação Tradicional\n59) Francesinha\n60) Manicure\n61) Manicure + Francesinha\n62) Manicure + Pedicure\n63) Manicure + Pedicure Masculino\n64) Manicure Masculino\n65) Pedicure\n66) Pedicure + Francesinha\n67) Pedicure + Reflexologia\n68) Pedicure Masculino\n69) Remoção de Alongamento\n70) Spa das Mãos\n71) Spa dos Pés + Cutílagem\n72) Top Coat\nCategoria: Nails Designer\n73) Banho em Gel\n74) Blindagem\n75) Esmaltação em Gel\nResponda com o numero ou nome do servico.', '2026-02-14 22:20:01.414'),
	(120, 12, 'INBOUND', 'WHATSAPP', '5511981859426', 'Pedicure', '2026-02-14 22:20:43.508'),
	(121, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-14 22:20:44.010'),
	(122, 12, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 22:20:49.298'),
	(123, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual data voce prefere para o agendamento?\n1) 14/02/2026 (Sab)\n2) 15/02/2026 (Dom)\n3) 16/02/2026 (Seg)\n4) 17/02/2026 (Ter)\n5) 18/02/2026 (Qua)\n6) 19/02/2026 (Qui)\n7) 20/02/2026 (Sex)\n8) 21/02/2026 (Sab)\n9) 22/02/2026 (Dom)\n10) 23/02/2026 (Seg)\n11) 24/02/2026 (Ter)\n12) 25/02/2026 (Qua)\n13) 26/02/2026 (Qui)\n14) 27/02/2026 (Sex)\nResponda com o numero ou data exibida.', '2026-02-14 22:20:49.523'),
	(124, 12, 'INBOUND', 'WHATSAPP', '5511981859426', '4', '2026-02-14 22:21:12.303'),
	(125, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual periodo voce prefere?\n1) Manha (6 vagas)\n2) Tarde (12 vagas)\n3) Noite (1 vagas)\nResponda com o numero ou nome do periodo.', '2026-02-14 22:21:12.745'),
	(126, 12, 'INBOUND', 'WHATSAPP', '5511981859426', '3', '2026-02-14 22:21:20.866'),
	(127, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario disponivel no periodo Noite:\n1) 18:00 (1 profissionais)\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-14 22:21:21.770'),
	(128, 12, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-14 22:21:27.324'),
	(129, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-14 22:21:27.944'),
	(130, 12, 'INBOUND', 'WHATSAPP', '5511981859426', 'Rato barbudo', '2026-02-14 22:21:39.846'),
	(131, 12, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Pedicure\nUnidade: Parque da Cidade\nData: 17/02/2026 (Ter)\nHorario: 18:00\nProfissional: Francisca Manicure\nAgendado para: 2026-02-17T21:00:00.000Z\nNome: Rato barbudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T22:21:40.005Z', '2026-02-14 22:21:40.312'),
	(132, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Pedicure\nUnidade: Parque da Cidade\nData: 17/02/2026 (Ter)\nHorario: 18:00\nProfissional: Francisca Manicure\nAgendado para: 2026-02-17T21:00:00.000Z\nNome: Rato barbudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T22:21:40.005Z', '2026-02-14 22:21:40.421'),
	(133, 12, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-14 22:21:40.536'),
	(134, 13, 'INBOUND', 'WHATSAPP', '5511981859426', 'Boa', '2026-02-14 23:22:36.005'),
	(135, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite! Seja bem vinda.\nQual tratamento deseja fazer hoje?\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\nResponda com o numero ou nome da categoria.', '2026-02-14 23:22:36.630'),
	(136, 13, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 23:23:04.492'),
	(137, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Categoria selecionada: Cabeleireiro Masculino. Qual servico deseja agendar?\n1) Barba\n2) Corte Masculino\nResponda com o numero ou nome do servico. Se quiser trocar a categoria, digite \'menu\'.', '2026-02-14 23:23:04.630'),
	(138, 13, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 23:23:17.220'),
	(139, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-14 23:23:17.320'),
	(140, 13, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-14 23:23:24.596'),
	(141, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual data voce prefere para o agendamento?\n1) 14/02/2026 (Sab)\n2) 15/02/2026 (Dom)\n3) 16/02/2026 (Seg)\n4) 17/02/2026 (Ter)\n5) 18/02/2026 (Qua)\n6) 19/02/2026 (Qui)\n7) 20/02/2026 (Sex)\n8) 21/02/2026 (Sab)\n9) 22/02/2026 (Dom)\n10) 23/02/2026 (Seg)\n11) 24/02/2026 (Ter)\n12) 25/02/2026 (Qua)\n13) 26/02/2026 (Qui)\n14) 27/02/2026 (Sex)\nResponda com o numero ou data exibida.', '2026-02-14 23:23:24.699'),
	(142, 13, 'INBOUND', 'WHATSAPP', '5511981859426', '5', '2026-02-14 23:23:39.766'),
	(143, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual periodo voce prefere?\n1) Manha (8 vagas)\n2) Tarde (11 vagas)\nResponda com o numero ou nome do periodo.', '2026-02-14 23:23:39.904'),
	(144, 13, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-14 23:23:46.368'),
	(145, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario disponivel no periodo Manha:\n1) 08:00 (1 profissionais)\n2) 08:30 (1 profissionais)\n3) 09:00 (3 profissionais)\n4) 09:30 (3 profissionais)\n5) 10:00 (3 profissionais)\n6) 10:30 (3 profissionais)\n7) 11:00 (3 profissionais)\n8) 11:30 (3 profissionais)\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-14 23:23:46.533'),
	(146, 13, 'INBOUND', 'WHATSAPP', '5511981859426', '3', '2026-02-14 23:23:54.168'),
	(147, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Temos mais de um profissional disponivel nesse horario. Com quem deseja agendar?\n1) Primeiro profissional disponivel\n2) Cicera Cabeleireira\n3) Joana Ribeiro\n4) Marcos Lima\nResponda com o numero ou nome da opcao.', '2026-02-14 23:23:54.396'),
	(148, 13, 'INBOUND', 'WHATSAPP', '5511981859426', '4', '2026-02-14 23:24:02.635'),
	(149, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-14 23:24:02.756'),
	(150, 13, 'INBOUND', 'WHATSAPP', '5511981859426', 'Garcia Rodrigues', '2026-02-14 23:32:41.284'),
	(151, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte Masculino\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 09:00\nProfissional: Marcos Lima\nAgendado para: 2026-02-18T12:00:00.000Z\nNome: Garcia Rodrigues\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T23:32:41.347Z', '2026-02-14 23:32:41.724'),
	(152, 13, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte Masculino\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 09:00\nProfissional: Marcos Lima\nAgendado para: 2026-02-18T12:00:00.000Z\nNome: Garcia Rodrigues\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T23:32:41.347Z', '2026-02-14 23:32:42.026'),
	(153, 13, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-14 23:32:42.312'),
	(154, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '👏👏👏👏', '2026-02-14 23:43:10.479'),
	(155, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Boa Noite! Seja bem vinda.\nQual tratamento deseja fazer hoje?\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\nResponda com o numero ou nome da categoria.', '2026-02-14 23:43:10.630'),
	(156, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '3', '2026-02-14 23:43:25.859'),
	(157, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Categoria selecionada: Depilação. Qual servico deseja agendar?\n1) Depilação Axilas\n2) Depilação Barba (Cera)\n3) Depilação Barriga\n4) Depilação Braços\n5) Depilação Buço (Cera)\n6) Depilação Buço (Linha)\n7) Depilação Costas\n8) Depilação Coxas\n9) Depilação Meia Perna\n10) Depilação Nariz\n11) Depilação Rosto (Linha)\n12) Depilação Virilha (Cavada)\n13) Depilação Virilha (Completa)\nResponda com o numero ou nome do servico. Se quiser trocar a categoria, digite \'menu\'.', '2026-02-14 23:43:25.971'),
	(158, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '3', '2026-02-14 23:43:35.349'),
	(159, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Qual unidade voce prefere?\n1) Birmann 20\n2) Parque da Cidade\nResponda com o numero ou nome da opcao.', '2026-02-14 23:43:35.457'),
	(160, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '2', '2026-02-14 23:43:43.648'),
	(161, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Qual data voce prefere para o agendamento?\n1) 14/02/2026 (Sab)\n2) 15/02/2026 (Dom)\n3) 16/02/2026 (Seg)\n4) 17/02/2026 (Ter)\n5) 18/02/2026 (Qua)\n6) 19/02/2026 (Qui)\n7) 20/02/2026 (Sex)\n8) 21/02/2026 (Sab)\n9) 22/02/2026 (Dom)\n10) 23/02/2026 (Seg)\n11) 24/02/2026 (Ter)\n12) 25/02/2026 (Qua)\n13) 26/02/2026 (Qui)\n14) 27/02/2026 (Sex)\nResponda com o numero ou data exibida.', '2026-02-14 23:43:43.748'),
	(162, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '5', '2026-02-14 23:43:59.879'),
	(163, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Qual periodo voce prefere?\n1) Manha (6 vagas)\n2) Tarde (12 vagas)\nResponda com o numero ou nome do periodo.', '2026-02-14 23:44:00.011'),
	(164, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '1', '2026-02-14 23:44:11.027'),
	(165, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Escolha um horario disponivel no periodo Manha:\n1) 09:00 (1 profissionais)\n2) 09:30 (1 profissionais)\n3) 10:00 (2 profissionais)\n4) 10:30 (2 profissionais)\n5) 11:00 (2 profissionais)\n6) 11:30 (2 profissionais)\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-14 23:44:11.158'),
	(166, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '3', '2026-02-14 23:44:23.973'),
	(167, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Temos mais de um profissional disponivel nesse horario. Com quem deseja agendar?\n1) Primeiro profissional disponivel\n2) Joana Ribeiro\n3) Marcos Lima\nResponda com o numero ou nome da opcao.', '2026-02-14 23:44:24.132'),
	(168, 14, 'INBOUND', 'WHATSAPP', '5511978935812', '2', '2026-02-14 23:44:37.599'),
	(169, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Perfeito. Agora informe seu nome completo.', '2026-02-14 23:44:37.718'),
	(170, 14, 'INBOUND', 'WHATSAPP', '5511978935812', 'Josi Oliveira', '2026-02-14 23:44:51.121'),
	(171, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Depilação Barriga\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 10:00\nProfissional: Joana Ribeiro\nAgendado para: 2026-02-18T13:00:00.000Z\nNome: Josi Oliveira\nTelefone: 5511978935812\nFinalizado em: 2026-02-14T23:44:51.164Z', '2026-02-14 23:44:51.249'),
	(172, 14, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-14 23:44:51.533'),
	(173, 15, 'INBOUND', 'WHATSAPP', '5511978935812', 'Ficou show', '2026-02-14 23:45:07.807'),
	(174, 15, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Boa Noite! Seja bem vinda.\nQual tratamento deseja fazer hoje?\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\nResponda com o numero ou nome da categoria.', '2026-02-14 23:45:08.433'),
	(175, 15, 'INBOUND', 'WHATSAPP', '5511978935812', 'Você é brabo', '2026-02-14 23:45:15.566'),
	(176, 15, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Nao entendi a categoria selecionada.\n\nQual tratamento deseja fazer hoje?\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\nResponda com o numero ou nome da categoria.', '2026-02-14 23:45:15.665'),
	(177, 16, 'INBOUND', 'WHATSAPP', '5511981859426', 'Ola', '2026-02-15 02:05:19.635'),
	(178, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite, Seja bem vinda. Qual tratamento especial deseja fazer hoje?\n\nCategorias:\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\n\nResponda com o numero ou nome da categoria.', '2026-02-15 02:05:20.804'),
	(179, 16, 'INBOUND', 'WHATSAPP', '5511981859426', '7', '2026-02-15 02:05:33.850'),
	(180, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Categoria selecionada: Nails Designer. Qual servico deseja agendar?\n\n1) Banho em Gel\n2) Blindagem\n3) Esmaltação em Gel\n\nResponda com o numero ou nome do servico. Se quiser trocar a categoria, digite \'menu\'.', '2026-02-15 02:05:33.961'),
	(181, 16, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-15 02:05:40.819'),
	(182, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n\n1) Birmann 20\n2) Parque da Cidade\n\nResponda com o numero ou nome da opcao.', '2026-02-15 02:05:41.006'),
	(183, 16, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-15 02:05:47.520'),
	(184, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual data voce prefere para o agendamento?\n\n1) 14/02/2026 (Sab)\n2) 15/02/2026 (Dom)\n3) 16/02/2026 (Seg)\n4) 17/02/2026 (Ter)\n5) 18/02/2026 (Qua)\n6) 19/02/2026 (Qui)\n7) 20/02/2026 (Sex)\n8) 21/02/2026 (Sab)\n9) 22/02/2026 (Dom)\n10) 23/02/2026 (Seg)\n11) 24/02/2026 (Ter)\n12) 25/02/2026 (Qua)\n13) 26/02/2026 (Qui)\n14) 27/02/2026 (Sex)\n\nResponda com o numero ou data exibida.', '2026-02-15 02:05:47.623'),
	(185, 16, 'INBOUND', 'WHATSAPP', '5511981859426', '5', '2026-02-15 02:05:52.706'),
	(186, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual periodo voce prefere?\n\n1) Manha (8 vagas)\n2) Tarde (12 vagas)\n3) Noite (1 vagas)\n\nResponda com o numero ou nome do periodo.', '2026-02-15 02:05:52.878'),
	(187, 16, 'INBOUND', 'WHATSAPP', '5511981859426', '3', '2026-02-15 02:05:59.039'),
	(188, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario disponivel no periodo Noite:\n\n1) 18:00 (1 profissionais)\n\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-15 02:05:59.157'),
	(189, 16, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-15 02:06:04.408'),
	(190, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-15 02:06:04.555'),
	(191, 16, 'INBOUND', 'WHATSAPP', '5511981859426', 'RICARDO VINY', '2026-02-15 02:06:20.207'),
	(192, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\n\nOrigem: WHATSAPP\nServico: Blindagem\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 18:00\nProfissional: Francisca Manicure\nAgendado para: 2026-02-18T21:00:00.000Z\nNome: RICARDO VINY\nTelefone: 5511981859426\nFinalizado em: 2026-02-15T02:06:20.612Z', '2026-02-15 02:06:20.686'),
	(193, 16, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\n\nOrigem: WHATSAPP\nServico: Blindagem\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 18:00\nProfissional: Francisca Manicure\nAgendado para: 2026-02-18T21:00:00.000Z\nNome: RICARDO VINY\nTelefone: 5511981859426\nFinalizado em: 2026-02-15T02:06:20.612Z', '2026-02-15 02:06:20.970'),
	(194, 16, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida.', '2026-02-15 02:06:21.265'),
	(195, 17, 'INBOUND', 'WHATSAPP', '5511981859426', 'Ola', '2026-02-15 02:13:31.445'),
	(196, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nAntes de continuar, me informe seu e-mail.', '2026-02-15 02:13:31.584'),
	(197, 17, 'INBOUND', 'WHATSAPP', '5511981859426', 'Ric.viny@gmail.com', '2026-02-15 02:14:05.106'),
	(198, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Cadastro atualizado com sucesso.\n\nVamos seguir com seu agendamento.\n\nBoa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nCategorias:\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\n\nResponda com o numero ou nome da categoria.', '2026-02-15 02:14:05.332'),
	(199, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-15 02:14:11.099'),
	(200, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nAntes de continuar, em qual cidade voce mora?', '2026-02-15 02:14:11.214'),
	(201, 17, 'INBOUND', 'WHATSAPP', '5511981859426', 'Barueri', '2026-02-15 02:14:22.495'),
	(202, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Cadastro atualizado com sucesso.\n\nVamos seguir com seu agendamento.\n\nBoa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nCategorias:\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\n\nResponda com o numero ou nome da categoria.', '2026-02-15 02:14:22.612'),
	(203, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-15 02:14:29.504'),
	(204, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nAntes de continuar, qual estado (UF) voce mora?', '2026-02-15 02:14:29.619'),
	(205, 17, 'INBOUND', 'WHATSAPP', '5511981859426', 'SP', '2026-02-15 02:14:39.705'),
	(206, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Cadastro atualizado com sucesso.\n\nVamos seguir com seu agendamento.\n\nBoa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nCategorias:\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\n\nResponda com o numero ou nome da categoria.', '2026-02-15 02:14:39.810'),
	(207, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-15 02:14:45.542'),
	(208, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nAntes de continuar, qual bairro voce mora?', '2026-02-15 02:14:45.635'),
	(209, 17, 'INBOUND', 'WHATSAPP', '5511981859426', 'Centro', '2026-02-15 02:14:54.890'),
	(210, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Cadastro atualizado com sucesso.\n\nVamos seguir com seu agendamento.\n\nBoa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nCategorias:\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\n\nResponda com o numero ou nome da categoria.', '2026-02-15 02:14:54.992'),
	(211, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '7', '2026-02-15 02:15:00.719'),
	(212, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Boa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nAntes de continuar, se quiser informe um telefone 2 (opcional). Se preferir, digite \'pular\'.', '2026-02-15 02:15:00.816'),
	(213, 17, 'INBOUND', 'WHATSAPP', '5511981859426', 'Pular', '2026-02-15 02:15:09.608'),
	(214, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Cadastro atualizado com sucesso.\n\nBoa Noite RICARDO, Seja bem vinda!. Qual tratamento especial deseja fazer hoje?\n\nCategorias:\n1) Cabeleireiro Feminino\n2) Cabeleireiro Masculino\n3) Depilação\n4) Estética Corporal\n5) Estética Facial\n6) Manicure & Pedicure\n7) Nails Designer\n\nResponda com o numero ou nome da categoria.', '2026-02-15 02:15:09.726'),
	(215, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '7', '2026-02-15 02:15:15.196'),
	(216, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Categoria selecionada: Nails Designer. Qual servico deseja agendar?\n\n1) Banho em Gel\n2) Blindagem\n3) Esmaltação em Gel\n\nResponda com o numero ou nome do servico. Se quiser trocar a categoria, digite \'menu\'.', '2026-02-15 02:15:15.287'),
	(217, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-15 02:15:20.059'),
	(218, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual unidade voce prefere?\n\n1) Birmann 20\n2) Parque da Cidade\n\nResponda com o numero ou nome da opcao.', '2026-02-15 02:15:20.177'),
	(219, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '2', '2026-02-15 02:15:25.727'),
	(220, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual data voce prefere para o agendamento?\n\n1) 14/02/2026 (Sab)\n2) 15/02/2026 (Dom)\n3) 16/02/2026 (Seg)\n4) 17/02/2026 (Ter)\n5) 18/02/2026 (Qua)\n6) 19/02/2026 (Qui)\n7) 20/02/2026 (Sex)\n8) 21/02/2026 (Sab)\n9) 22/02/2026 (Dom)\n10) 23/02/2026 (Seg)\n11) 24/02/2026 (Ter)\n12) 25/02/2026 (Qua)\n13) 26/02/2026 (Qui)\n14) 27/02/2026 (Sex)\n\nResponda com o numero ou data exibida.', '2026-02-15 02:15:25.822'),
	(221, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '12', '2026-02-15 02:15:30.528'),
	(222, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Qual periodo voce prefere?\n\n1) Manha (8 vagas)\n2) Tarde (12 vagas)\n3) Noite (1 vagas)\n\nResponda com o numero ou nome do periodo.', '2026-02-15 02:15:30.637'),
	(223, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-15 02:15:34.866'),
	(224, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Escolha um horario disponivel no periodo Manha:\n\n1) 08:00 (1 profissionais)\n2) 08:30 (1 profissionais)\n3) 09:00 (3 profissionais)\n4) 09:30 (3 profissionais)\n5) 10:00 (3 profissionais)\n6) 10:30 (3 profissionais)\n7) 11:00 (4 profissionais)\n8) 11:30 (4 profissionais)\n\nResponda com o numero ou horario (ex.: 14:00).', '2026-02-15 02:15:34.995'),
	(225, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '8', '2026-02-15 02:15:40.232'),
	(226, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Temos mais de um profissional disponivel nesse horario. Com quem deseja agendar?\n\n1) Primeiro profissional disponivel\n2) Francisca Manicure\n3) Joana Ribeiro\n4) Marcos Lima\n5) Maria Manicure\n\nResponda com o numero ou nome da opcao.', '2026-02-15 02:15:40.376'),
	(227, 17, 'INBOUND', 'WHATSAPP', '5511981859426', '1', '2026-02-15 02:15:46.578'),
	(228, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Perfeito. Agora informe seu nome completo.', '2026-02-15 02:15:46.684'),
	(229, 17, 'INBOUND', 'WHATSAPP', '5511981859426', 'Mary ruiz', '2026-02-15 02:16:06.432'),
	(230, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Resumo de Agendamento - Concierge JLR\n\nOrigem: WHATSAPP\nServico: Banho em Gel\nUnidade: Parque da Cidade\nData: 25/02/2026 (Qua)\nHorario: 11:30\nProfissional: Joana Ribeiro\nAgendado para: 2026-02-25T14:30:00.000Z\nNome: Mary ruiz\nTelefone: 5511981859426\nFinalizado em: 2026-02-15T02:16:06.477Z', '2026-02-15 02:16:06.552'),
	(231, 17, 'OUTBOUND', 'WHATSAPP', '5511978935812', 'Resumo de Agendamento - Concierge JLR\n\nOrigem: WHATSAPP\nServico: Banho em Gel\nUnidade: Parque da Cidade\nData: 25/02/2026 (Qua)\nHorario: 11:30\nProfissional: Joana Ribeiro\nAgendado para: 2026-02-25T14:30:00.000Z\nNome: Mary ruiz\nTelefone: 5511981859426\nFinalizado em: 2026-02-15T02:16:06.477Z', '2026-02-15 02:16:06.835'),
	(232, 17, 'OUTBOUND', 'WHATSAPP', '5511981859426', 'Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida. Muito Obrigado.', '2026-02-15 02:16:07.140');

-- Copiando estrutura para tabela jlr_beauty.conciergesession
DROP TABLE IF EXISTS `conciergesession`;
CREATE TABLE IF NOT EXISTS `conciergesession` (
  `id` int NOT NULL AUTO_INCREMENT,
  `origin` enum('WEB','WHATSAPP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `step` enum('SERVICE','UNIT','DATE','SLOT','NAME','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SERVICE',
  `serviceId` int DEFAULT NULL,
  `unitId` int DEFAULT NULL,
  `slotLabel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scheduledDateLabel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scheduledFor` datetime(3) DEFAULT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summaryText` text COLLATE utf8mb4_unicode_ci,
  `lastInboundAt` datetime(3) DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `summarySentAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ConciergeSession_phone_status_createdAt_idx` (`phone`,`status`,`createdAt`),
  KEY `ConciergeSession_serviceId_idx` (`serviceId`),
  KEY `ConciergeSession_unitId_idx` (`unitId`),
  KEY `ConciergeSession_scheduledFor_idx` (`scheduledFor`),
  CONSTRAINT `ConciergeSession_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ConciergeSession_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.conciergesession: ~17 rows (aproximadamente)
DELETE FROM `conciergesession`;
INSERT INTO `conciergesession` (`id`, `origin`, `phone`, `status`, `step`, `serviceId`, `unitId`, `slotLabel`, `scheduledDateLabel`, `scheduledFor`, `customerName`, `summaryText`, `lastInboundAt`, `completedAt`, `summarySentAt`, `createdAt`, `updatedAt`) VALUES
	(1, 'WHATSAPP', '5511989261279', 'CANCELLED', 'UNIT', 1, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 01:00:50.905', NULL, NULL, '2026-02-13 01:00:26.147', '2026-02-12 22:09:24.000'),
	(2, 'WHATSAPP', '5511989261279', 'ACTIVE', 'SERVICE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 01:09:49.733', NULL, NULL, '2026-02-13 01:09:49.735', '2026-02-13 01:09:49.735'),
	(3, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 1, 1, '13:00', NULL, NULL, '5', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 13:00\nNome: 5\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T01:25:54.784Z', '2026-02-13 01:25:54.784', '2026-02-13 01:25:54.784', '2026-02-13 01:25:54.784', '2026-02-13 01:21:54.501', '2026-02-13 01:25:54.981'),
	(4, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 1, 1, '16:00', NULL, NULL, 'Rato Borrachudo', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte & Styling\nUnidade: Parque da Cidade\nHorario: 16:00\nNome: Rato Borrachudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T06:16:59.341Z', '2026-02-13 06:16:59.341', '2026-02-13 06:16:59.341', '2026-02-13 06:16:59.341', '2026-02-13 06:16:08.619', '2026-02-13 06:16:59.606'),
	(5, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 44, 1, '15:00', NULL, NULL, 'NICOLE TESTES ITALIA', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Acupuntura\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: NICOLE TESTES ITALIA\nTelefone: 5511981859426\nFinalizado em: 2026-02-13T13:23:58.713Z', '2026-02-13 13:23:58.713', '2026-02-13 13:23:58.713', '2026-02-13 13:23:58.713', '2026-02-13 13:22:55.090', '2026-02-13 13:23:58.879'),
	(6, 'WHATSAPP', '5511977493874', 'COMPLETED', 'COMPLETED', 93, 1, '15:00', NULL, NULL, 'Faltou os dias da semana.', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Manicure\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: Faltou os dias da semana.\nTelefone: 5511977493874\nFinalizado em: 2026-02-13T13:28:36.548Z', '2026-02-13 13:28:36.548', '2026-02-13 13:28:36.548', '2026-02-13 13:28:36.548', '2026-02-13 13:25:17.913', '2026-02-13 13:28:36.979'),
	(7, 'WHATSAPP', '5518998268716', 'COMPLETED', 'COMPLETED', 53, 1, '15:00', NULL, NULL, 'Stephanie', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Blindagem\nUnidade: Parque da Cidade\nHorario: 15:00\nNome: Stephanie\nTelefone: 5518998268716\nFinalizado em: 2026-02-13T13:52:02.687Z', '2026-02-13 13:52:02.687', '2026-02-13 13:52:02.687', '2026-02-13 13:52:02.687', '2026-02-13 13:50:58.805', '2026-02-13 13:52:02.933'),
	(8, 'WHATSAPP', '5518998268716', 'ACTIVE', 'SERVICE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 13:52:28.633', NULL, NULL, '2026-02-13 13:52:28.635', '2026-02-13 13:52:28.635'),
	(9, 'WEB', '5511999999999', 'COMPLETED', 'COMPLETED', 44, 2, '09:00', '13/02/2026', '2026-02-13 09:00:00.000', 'Teste Integracao', 'Resumo de Agendamento - Concierge JLR\nOrigem: WEB\nServico: Acupuntura\nUnidade: Birmann 20\nData: 13/02/2026\nHorario: 09:00\nAgendado para: 2026-02-13T09:00:00.000Z\nNome: Teste Integracao\nTelefone: 5511999999999\nFinalizado em: 2026-02-13T15:35:58.644Z', '2026-02-13 15:35:58.644', '2026-02-13 15:35:58.644', '2026-02-13 15:35:58.644', '2026-02-13 15:35:58.648', '2026-02-13 15:35:58.648'),
	(10, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 47, 1, '11:00', '15/02/2026 (Dom)', '2026-02-15 14:00:00.000', 'Tonimek', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Aplicação Mega Hair\nUnidade: Parque da Cidade\nData: 15/02/2026 (Dom)\nHorario: 11:00\nAgendado para: 2026-02-15T14:00:00.000Z\nNome: Tonimek\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T20:44:34.818Z', '2026-02-14 20:44:34.818', '2026-02-14 20:44:34.818', '2026-02-14 20:44:34.818', '2026-02-14 20:43:38.570', '2026-02-14 20:44:34.981'),
	(11, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 60, 1, '17:30', '15/02/2026 (Dom)', '2026-02-15 20:30:00.000', 'Gordox barbudo', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Depilação Barba (Cera)\nUnidade: Parque da Cidade\nData: 15/02/2026 (Dom)\nHorario: 17:30\nAgendado para: 2026-02-15T20:30:00.000Z\nNome: Gordox barbudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T21:13:25.459Z', '2026-02-14 21:13:25.459', '2026-02-14 21:13:25.459', '2026-02-14 21:13:25.459', '2026-02-14 21:11:51.740', '2026-02-14 21:13:25.627'),
	(12, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 102, 1, '18:00', '17/02/2026 (Ter)', '2026-02-17 21:00:00.000', 'Rato barbudo', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Pedicure\nUnidade: Parque da Cidade\nData: 17/02/2026 (Ter)\nHorario: 18:00\nProfissional: Francisca Manicure\nAgendado para: 2026-02-17T21:00:00.000Z\nNome: Rato barbudo\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T22:21:40.005Z', '2026-02-14 22:21:40.005', '2026-02-14 22:21:40.005', '2026-02-14 22:21:40.005', '2026-02-14 22:19:58.658', '2026-02-14 22:21:40.561'),
	(13, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 58, 1, '09:00', '18/02/2026 (Qua)', '2026-02-18 12:00:00.000', 'Garcia Rodrigues', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Corte Masculino\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 09:00\nProfissional: Marcos Lima\nAgendado para: 2026-02-18T12:00:00.000Z\nNome: Garcia Rodrigues\nTelefone: 5511981859426\nFinalizado em: 2026-02-14T23:32:41.347Z', '2026-02-14 23:32:41.347', '2026-02-14 23:32:41.347', '2026-02-14 23:32:41.347', '2026-02-14 23:22:35.960', '2026-02-14 23:32:42.321'),
	(14, 'WHATSAPP', '5511978935812', 'COMPLETED', 'COMPLETED', 61, 1, '10:00', '18/02/2026 (Qua)', '2026-02-18 13:00:00.000', 'Josi Oliveira', 'Resumo de Agendamento - Concierge JLR\nOrigem: WHATSAPP\nServico: Depilação Barriga\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 10:00\nProfissional: Joana Ribeiro\nAgendado para: 2026-02-18T13:00:00.000Z\nNome: Josi Oliveira\nTelefone: 5511978935812\nFinalizado em: 2026-02-14T23:44:51.164Z', '2026-02-14 23:44:51.164', '2026-02-14 23:44:51.164', '2026-02-14 23:44:51.164', '2026-02-14 23:43:10.468', '2026-02-14 23:44:51.543'),
	(15, 'WHATSAPP', '5511978935812', 'ACTIVE', 'SERVICE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-14 23:45:07.799', NULL, NULL, '2026-02-14 23:45:07.800', '2026-02-14 23:45:07.800'),
	(16, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 53, 1, '18:00', '18/02/2026 (Qua)', '2026-02-18 21:00:00.000', 'RICARDO VINY', 'Resumo de Agendamento - Concierge JLR\n\nOrigem: WHATSAPP\nServico: Blindagem\nUnidade: Parque da Cidade\nData: 18/02/2026 (Qua)\nHorario: 18:00\nProfissional: Francisca Manicure\nAgendado para: 2026-02-18T21:00:00.000Z\nNome: RICARDO VINY\nTelefone: 5511981859426\nFinalizado em: 2026-02-15T02:06:20.612Z', '2026-02-15 02:06:20.612', '2026-02-15 02:06:20.612', '2026-02-15 02:06:20.612', '2026-02-15 02:05:19.621', '2026-02-15 02:06:21.273'),
	(17, 'WHATSAPP', '5511981859426', 'COMPLETED', 'COMPLETED', 50, 1, '11:30', '25/02/2026 (Qua)', '2026-02-25 14:30:00.000', 'Mary ruiz', 'Resumo de Agendamento - Concierge JLR\n\nOrigem: WHATSAPP\nServico: Banho em Gel\nUnidade: Parque da Cidade\nData: 25/02/2026 (Qua)\nHorario: 11:30\nProfissional: Joana Ribeiro\nAgendado para: 2026-02-25T14:30:00.000Z\nNome: Mary ruiz\nTelefone: 5511981859426\nFinalizado em: 2026-02-15T02:16:06.477Z', '2026-02-15 02:16:06.477', '2026-02-15 02:16:06.477', '2026-02-15 02:16:06.477', '2026-02-15 02:13:31.434', '2026-02-15 02:16:07.147');

-- Copiando estrutura para tabela jlr_beauty.contententry
DROP TABLE IF EXISTS `contententry`;
CREATE TABLE IF NOT EXISTS `contententry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ContentEntry_key_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.contententry: ~3 rows (aproximadamente)
DELETE FROM `contententry`;
INSERT INTO `contententry` (`id`, `key`, `value`, `createdAt`, `updatedAt`) VALUES
	(1, 'whatsapp_flow_category_first', 'true', '2026-02-14 23:22:10.721', '2026-02-14 23:22:10.721'),
	(2, 'whatsapp_opening_greeting_text', '"Seja bem vinda!. Qual tratamento especial deseja fazer hoje?"', '2026-02-15 02:04:59.158', '2026-02-15 02:10:32.673'),
	(3, 'whatsapp_completion_greeting_text', '"Agendamento registrado com sucesso. Nosso time vai confirmar os detalhes em seguida. Muito Obrigado."', '2026-02-15 02:04:59.158', '2026-02-15 02:10:32.674');

-- Copiando estrutura para tabela jlr_beauty.customer
DROP TABLE IF EXISTS `customer`;
CREATE TABLE IF NOT EXISTS `customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone2OptOut` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_phone_key` (`phone`),
  UNIQUE KEY `Customer_userId_key` (`userId`),
  KEY `Customer_phone_idx` (`phone`),
  CONSTRAINT `Customer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.customer: ~3 rows (aproximadamente)
DELETE FROM `customer`;
INSERT INTO `customer` (`id`, `userId`, `name`, `phone`, `email`, `city`, `state`, `neighborhood`, `phone2`, `phone2OptOut`, `notes`, `createdAt`, `updatedAt`) VALUES
	(1, NULL, 'Mary ruiz', '5511981859427', 'ric.viny@gmail.com', 'Barueri', 'SP', 'Centro', NULL, 1, '*cliente vindo pelo whatsapp', '2026-02-15 02:06:20.608', '2026-02-15 18:34:49.796'),
	(2, NULL, 'JEIEL DE OLIVEIRA BORNER', '11981859426', 'jeiel.borner@gmail.com', 'Barueri', 'SP', 'Jardim Esperança', '11981859426', 0, 'Testes', '2026-02-17 00:07:48.253', '2026-02-17 00:07:48.253'),
	(3, NULL, 'Amarante Silva', '11988887777', NULL, NULL, NULL, NULL, NULL, 0, 'Testes', '2026-02-17 00:16:30.132', '2026-02-17 00:16:30.132');

-- Copiando estrutura para tabela jlr_beauty.discountcoupon
DROP TABLE IF EXISTS `discountcoupon`;
CREATE TABLE IF NOT EXISTS `discountcoupon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discountType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentOff` decimal(5,2) DEFAULT NULL,
  `amountOff` decimal(10,2) DEFAULT NULL,
  `minSubtotal` decimal(10,2) DEFAULT NULL,
  `startsAt` datetime(3) DEFAULT NULL,
  `endsAt` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DiscountCoupon_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.discountcoupon: ~0 rows (aproximadamente)
DELETE FROM `discountcoupon`;
INSERT INTO `discountcoupon` (`id`, `code`, `name`, `discountType`, `percentOff`, `amountOff`, `minSubtotal`, `startsAt`, `endsAt`, `isActive`, `createdAt`, `updatedAt`) VALUES
	(1, 'VIP30', 'VIP30', 'PERCENT', 30.00, NULL, NULL, '2026-02-17 05:35:00.000', '2026-02-24 05:35:00.000', 1, '2026-02-18 05:35:41.959', '2026-02-18 05:35:41.959');

-- Copiando estrutura para tabela jlr_beauty.franchiselead
DROP TABLE IF EXISTS `franchiselead`;
CREATE TABLE IF NOT EXISTS `franchiselead` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'Novo',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.franchiselead: ~0 rows (aproximadamente)
DELETE FROM `franchiselead`;

-- Copiando estrutura para tabela jlr_beauty.membership
DROP TABLE IF EXISTS `membership`;
CREATE TABLE IF NOT EXISTS `membership` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `benefits` json DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Ativo',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.membership: ~3 rows (aproximadamente)
DELETE FROM `membership`;
INSERT INTO `membership` (`id`, `name`, `title`, `description`, `price`, `benefits`, `isFeatured`, `status`, `createdAt`, `updatedAt`) VALUES
	(1, 'Silver', 'Radiance', NULL, 99.00, '["10% desconto", "Acesso antecipado", "Tratamento mensal"]', 0, 'Ativo', '2026-01-28 04:13:38.529', '2026-02-06 20:38:51.379'),
	(2, 'Gold', 'Luminosity', NULL, 189.00, '["15% desconto", "Priority booking", "Facial mensal"]', 1, 'Ativo', '2026-01-28 04:13:38.529', '2026-01-28 04:13:38.529'),
	(8, 'Platinum', 'Ethereal', NULL, 199.00, '["20% de desconto Ilimitado", "Massagem corporal mensal", "Servico de concierge dedicado", "Convites para eventos VIP"]', 0, 'Ativo', '2026-02-06 20:49:24.622', '2026-02-09 20:45:25.933');

-- Copiando estrutura para tabela jlr_beauty.order
DROP TABLE IF EXISTS `order`;
CREATE TABLE IF NOT EXISTS `order` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` enum('PENDING','PAID','SHIPPED','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `total` decimal(10,2) NOT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.order: ~2 rows (aproximadamente)
DELETE FROM `order`;
INSERT INTO `order` (`id`, `status`, `total`, `customerName`, `customerEmail`, `customerPhone`, `createdAt`, `updatedAt`) VALUES
	(3, 'PENDING', 10.00, 'Teste', 'teste@example.com', '+5511999999999', '2026-02-03 23:28:42.885', '2026-02-03 23:28:42.885'),
	(4, 'PAID', 10.00, 'Teste', 'teste@example.com', '+5511999999999', '2026-02-03 23:39:58.513', '2026-02-03 23:39:58.588');

-- Copiando estrutura para tabela jlr_beauty.orderitem
DROP TABLE IF EXISTS `orderitem`;
CREATE TABLE IF NOT EXISTS `orderitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` int DEFAULT NULL,
  `membershipId` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unitPrice` decimal(10,2) NOT NULL,
  `serviceId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderItem_orderId_fkey` (`orderId`),
  KEY `OrderItem_productId_fkey` (`productId`),
  KEY `OrderItem_membershipId_fkey` (`membershipId`),
  KEY `OrderItem_serviceId_fkey` (`serviceId`),
  CONSTRAINT `OrderItem_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `membership` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.orderitem: ~2 rows (aproximadamente)
DELETE FROM `orderitem`;
INSERT INTO `orderitem` (`id`, `orderId`, `productId`, `membershipId`, `quantity`, `unitPrice`, `serviceId`) VALUES
	(3, 3, 1, NULL, 1, 10.00, NULL),
	(4, 4, 1, NULL, 1, 10.00, NULL);

-- Copiando estrutura para tabela jlr_beauty.payment
DROP TABLE IF EXISTS `payment`;
CREATE TABLE IF NOT EXISTS `payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int DEFAULT NULL,
  `subscriptionId` int DEFAULT NULL,
  `provider` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `providerPaymentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  `rawPayload` json DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Payment_orderId_fkey` (`orderId`),
  KEY `Payment_subscriptionId_fkey` (`subscriptionId`),
  CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Payment_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscription` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.payment: ~2 rows (aproximadamente)
DELETE FROM `payment`;
INSERT INTO `payment` (`id`, `orderId`, `subscriptionId`, `provider`, `providerPaymentId`, `status`, `amount`, `method`, `paidAt`, `rawPayload`, `createdAt`, `updatedAt`) VALUES
	(1, 4, NULL, 'MOCK', 'mock_1770161998549', 'APPROVED', 10.00, NULL, '2026-02-03 23:39:58.577', '{"type": "order", "description": "Teste"}', '2026-02-03 23:39:58.551', '2026-02-03 23:39:58.579');

-- Copiando estrutura para tabela jlr_beauty.product
DROP TABLE IF EXISTS `product`;
CREATE TABLE IF NOT EXISTS `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `imageUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `benefits` json DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `productCategoryId` int DEFAULT NULL,
  `productStatusId` int DEFAULT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `Product_productCategoryId_fkey` (`productCategoryId`),
  KEY `Product_productStatusId_fkey` (`productStatusId`),
  CONSTRAINT `Product_productCategoryId_fkey` FOREIGN KEY (`productCategoryId`) REFERENCES `productcategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_productStatusId_fkey` FOREIGN KEY (`productStatusId`) REFERENCES `productstatus` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.product: ~11 rows (aproximadamente)
DELETE FROM `product`;
INSERT INTO `product` (`id`, `name`, `description`, `price`, `imageUrl`, `createdAt`, `updatedAt`, `benefits`, `isFeatured`, `productCategoryId`, `productStatusId`, `sku`, `stock`) VALUES
	(1, 'Shampoo Luxo', 'Limpeza suave com brilho intenso.', 899.00, 'http://localhost:3001/uploads/shampooluxo-1771359537187-792786214.jfif', '2026-01-28 04:13:38.510', '2026-02-17 20:19:01.329', '[]', 0, NULL, NULL, NULL, 9),
	(2, 'Mascara Nutritiva', 'Nutrição profunda para fios sedosos.', 1299.00, 'http://localhost:3001/uploads/mascara-1771359622430-906323913.jfif', '2026-01-28 04:13:38.510', '2026-02-18 02:55:18.278', '["Mascara de Luxo", "Regenera sua pele"]', 0, 4, NULL, NULL, 0),
	(3, 'Serum Facial', 'Hidratação e luminosidade diária.', 149.90, '/images/produtos/produto3.jpg', '2026-01-28 04:13:38.510', '2026-01-28 04:13:38.510', NULL, 0, NULL, NULL, NULL, 0),
	(45, 'Base (Unha de Pedra)', 'Produto importado da planilha de estoque. Patrimonio validado: 0.00.', 35.00, 'http://localhost:3001/uploads/produto1-1771359372907-145277317.webp', '2026-02-13 18:08:43.743', '2026-02-17 20:16:14.702', '[]', 0, 5, 1, 'JLR-EST-001', 0),
	(46, 'Base (Unha Fortalecida)', 'Produto importado da planilha de estoque. Patrimonio validado: 105.00.', 35.00, 'http://localhost:3001/uploads/prod2-1771359314123-164623841.webp', '2026-02-13 18:08:43.757', '2026-02-17 20:15:40.423', '[]', 0, 5, 1, 'JLR-EST-002', 3),
	(47, 'Chinelo Descartavel', 'Proteção que inspira a beleza! Esse é o nosso lema — embalamos a beleza com carinho, cuidado e profissionalismo.', 10.00, 'http://localhost:3001/uploads/chinelo-4mm1-5d46b1a19e5041b1f516629287503370-1024-1024-1771359091580-469624154.webp', '2026-02-13 18:08:43.768', '2026-02-18 02:56:28.039', '["Alivio aods seus pés"]', 0, 1, 1, 'JLR-EST-003', 27),
	(48, 'Cuti Express 100 ML', 'Removedor |Natural de Cutículas. Você não precisa mais sofrer com alicates e nem machucar suas cutículas.', 299.00, 'http://localhost:3001/uploads/cuti-1771356552586-345694419.webp', '2026-02-13 18:08:43.781', '2026-02-17 19:33:32.150', '["Formulação Natural", "Rapidez no Processo", "Unhas e Cutículas mais saudáveis"]', 0, 5, 1, 'JLR-EST-004', 100),
	(49, 'Cuti Express 500 ML', 'Removedor |Natural de Cutículas. Você não precisa mais sofrer com alicates e nem machucar suas cutículas.', 699.00, 'http://localhost:3001/uploads/cuti-express-1771355859595-443536478.webp', '2026-02-13 18:08:43.795', '2026-02-17 19:20:14.079', '["Formulação Natural", "Rapidez no Processo", "Unhas e Cutículas mais saudáveis", "Sem dor e sem agressão", "Resultado Profissional"]', 0, 5, 1, 'JLR-EST-005', 25),
	(50, 'FreePee Go', 'Cone direcionador feminino, sem contato com vaso sanitário, reduzindo a exposição a bactérias e cuidando da saúde intima. \nFreePee+, o produto inovador que chegou para transformar a rotina das mulheres modernas!\nCom design anatômico e inteligente, o FreePee+ foi desenvolvido para que mulheres possam urinar em pé, com total leveza, conforto e praticidade, em qualquer lugar.', 10.00, 'http://localhost:3001/uploads/freepee-1771355829749-868755511.webp', '2026-02-13 18:08:43.807', '2026-02-17 20:07:30.859', '["Mais Higiene", "Mais prpoteção", "Mais Liberdade", "Saúde primeiro"]', 0, 5, 1, 'JLR-EST-006', 30),
	(51, 'Lymp Clean (Higienizador de Pinceis Maquiagem)', 'Lymp Clean’, o novo queridinho da sua rotina de beleza!\nDesenvolvido especialmente para limpar pincéis de maquiagem com eficiência e praticidade, o Lymp Clean’ garante alto poder de remoção de resíduos sem danificar as cerdas.\nA limpeza que eleva sua maquiagem!', 399.00, 'http://localhost:3001/uploads/lymp-1771355670332-37323302.webp', '2026-02-13 18:08:43.817', '2026-02-17 20:06:30.246', '["Solução imediata", "Protege sua pele", "Surreal"]', 0, 5, 1, 'JLR-EST-007', 15),
	(52, 'Nutry Cutis (Caneta Hidratante de Cuticulas)', 'Hidratação Instantânea e duradoura', 25.00, 'http://localhost:3001/uploads/nutricutis-1771355311206-724745202.webp', '2026-02-13 18:08:43.829', '2026-02-18 00:15:30.318', '["Hidratação imediata, com toque suave e não oleoso.", "Praticidade no uso — formato em caneta para aplicação precisa", "Fórmula enriquecida com óleos e vitaminas", "restauram e protegem as cutículas", "Aparência saudável e natural desde a primeira aplicação"]', 1, 5, 1, 'JLR-EST-008', 199);

-- Copiando estrutura para tabela jlr_beauty.productcategory
DROP TABLE IF EXISTS `productcategory`;
CREATE TABLE IF NOT EXISTS `productcategory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.productcategory: ~4 rows (aproximadamente)
DELETE FROM `productcategory`;
INSERT INTO `productcategory` (`id`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
	(1, 'Tratamento', 'ACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264'),
	(2, 'Finalizacao', 'ACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264'),
	(3, 'Hair Care', 'ACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264'),
	(4, 'Skin Care', 'INACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264'),
	(5, 'Produtos', 'ACTIVE', '2026-02-13 18:08:43.722', '2026-02-13 18:08:43.722');

-- Copiando estrutura para tabela jlr_beauty.productstatus
DROP TABLE IF EXISTS `productstatus`;
CREATE TABLE IF NOT EXISTS `productstatus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` enum('VERDE','AMARELO','VERMELHO','CINZA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VERDE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.productstatus: ~3 rows (aproximadamente)
DELETE FROM `productstatus`;
INSERT INTO `productstatus` (`id`, `name`, `color`, `createdAt`, `updatedAt`) VALUES
	(1, 'Ativo', 'VERDE', '2026-01-30 21:22:05.276', '2026-01-30 21:22:05.276'),
	(2, 'Rascunho', 'AMARELO', '2026-01-30 21:22:05.276', '2026-01-30 21:22:05.276'),
	(3, 'Inativo', 'VERMELHO', '2026-01-30 21:22:05.276', '2026-01-30 21:22:05.276');

-- Copiando estrutura para tabela jlr_beauty.professional
DROP TABLE IF EXISTS `professional`;
CREATE TABLE IF NOT EXISTS `professional` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specialties` json DEFAULT NULL,
  `unitId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` int NOT NULL,
  `employmentStatus` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `startedAt` datetime(3) DEFAULT NULL,
  `endedAt` datetime(3) DEFAULT NULL,
  `commissionProfileId` int DEFAULT NULL,
  `workProfileId` int DEFAULT NULL,
  `commissionPercent` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Professional_userId_key` (`userId`),
  KEY `Professional_unitId_fkey` (`unitId`),
  KEY `Professional_commissionProfileId_idx` (`commissionProfileId`),
  KEY `Professional_workProfileId_idx` (`workProfileId`),
  CONSTRAINT `Professional_commissionProfileId_fkey` FOREIGN KEY (`commissionProfileId`) REFERENCES `professionalcommissionprofile` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Professional_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Professional_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Professional_workProfileId_fkey` FOREIGN KEY (`workProfileId`) REFERENCES `professionalworkprofile` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.professional: ~6 rows (aproximadamente)
DELETE FROM `professional`;
INSERT INTO `professional` (`id`, `name`, `specialties`, `unitId`, `createdAt`, `updatedAt`, `userId`, `employmentStatus`, `startedAt`, `endedAt`, `commissionProfileId`, `workProfileId`, `commissionPercent`) VALUES
	(1, 'Joana Ribeiro', '["Corte", "Coloracao"]', 1, '2026-01-30 21:22:05.306', '2026-02-15 18:33:26.258', 21, 'ACTIVE', NULL, NULL, NULL, 1, 5.00),
	(2, 'Marcos Lima', '["Tratamentos", "Escova"]', 1, '2026-01-30 21:22:05.306', '2026-02-15 18:33:43.815', 22, 'ACTIVE', NULL, NULL, NULL, 1, NULL),
	(3, 'Equipe Birmann 20', '[]', 2, '2026-02-13 21:23:07.060', '2026-02-15 18:33:33.271', 23, 'ACTIVE', NULL, NULL, NULL, 3, NULL),
	(4, 'Maria Manicure', '["Manicure"]', 1, '2026-02-13 22:29:58.579', '2026-02-15 05:39:45.854', 24, 'ACTIVE', NULL, NULL, NULL, 2, NULL),
	(5, 'Francisca Manicure', '["Manicure"]', 1, '2026-02-13 22:29:58.599', '2026-02-15 18:33:06.835', 25, 'ACTIVE', NULL, NULL, NULL, 1, 10.00),
	(6, 'Cicera Cabeleireira', '["Cabeleireira"]', 1, '2026-02-13 22:29:58.616', '2026-02-15 18:33:16.765', 26, 'ACTIVE', NULL, NULL, NULL, 3, NULL);

-- Copiando estrutura para tabela jlr_beauty.professionalcommissionprofile
DROP TABLE IF EXISTS `professionalcommissionprofile`;
CREATE TABLE IF NOT EXISTS `professionalcommissionprofile` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commissionPercent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProfessionalCommissionProfile_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.professionalcommissionprofile: ~0 rows (aproximadamente)
DELETE FROM `professionalcommissionprofile`;

-- Copiando estrutura para tabela jlr_beauty.professionalservice
DROP TABLE IF EXISTS `professionalservice`;
CREATE TABLE IF NOT EXISTS `professionalservice` (
  `professionalId` int NOT NULL,
  `serviceId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`professionalId`,`serviceId`),
  KEY `ProfessionalService_serviceId_professionalId_idx` (`serviceId`,`professionalId`),
  CONSTRAINT `ProfessionalService_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `professional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProfessionalService_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.professionalservice: ~273 rows (aproximadamente)
DELETE FROM `professionalservice`;
INSERT INTO `professionalservice` (`professionalId`, `serviceId`, `createdAt`) VALUES
	(1, 1, '2026-02-13 21:23:07.087'),
	(1, 2, '2026-02-13 21:23:07.087'),
	(1, 44, '2026-02-13 21:23:07.087'),
	(1, 45, '2026-02-13 21:23:07.087'),
	(1, 46, '2026-02-13 21:23:07.087'),
	(1, 47, '2026-02-13 21:23:07.087'),
	(1, 48, '2026-02-13 21:23:07.087'),
	(1, 49, '2026-02-13 21:23:07.087'),
	(1, 50, '2026-02-13 21:23:07.087'),
	(1, 51, '2026-02-13 21:23:07.087'),
	(1, 52, '2026-02-13 21:23:07.087'),
	(1, 53, '2026-02-13 21:23:07.087'),
	(1, 54, '2026-02-13 21:23:07.087'),
	(1, 55, '2026-02-13 21:23:07.087'),
	(1, 56, '2026-02-13 21:23:07.087'),
	(1, 57, '2026-02-13 21:23:07.087'),
	(1, 58, '2026-02-13 21:23:07.087'),
	(1, 59, '2026-02-13 21:23:07.087'),
	(1, 60, '2026-02-13 21:23:07.087'),
	(1, 61, '2026-02-13 21:23:07.087'),
	(1, 62, '2026-02-13 21:23:07.087'),
	(1, 63, '2026-02-13 21:23:07.087'),
	(1, 64, '2026-02-13 21:23:07.087'),
	(1, 65, '2026-02-13 21:23:07.087'),
	(1, 66, '2026-02-13 21:23:07.087'),
	(1, 67, '2026-02-13 21:23:07.087'),
	(1, 68, '2026-02-13 21:23:07.087'),
	(1, 69, '2026-02-13 21:23:07.087'),
	(1, 70, '2026-02-13 21:23:07.087'),
	(1, 71, '2026-02-13 21:23:07.087'),
	(1, 72, '2026-02-13 21:23:07.087'),
	(1, 73, '2026-02-13 21:23:07.087'),
	(1, 74, '2026-02-13 21:23:07.087'),
	(1, 75, '2026-02-13 21:23:07.087'),
	(1, 76, '2026-02-13 21:23:07.087'),
	(1, 77, '2026-02-13 21:23:07.087'),
	(1, 78, '2026-02-13 21:23:07.087'),
	(1, 79, '2026-02-13 21:23:07.087'),
	(1, 80, '2026-02-13 21:23:07.087'),
	(1, 81, '2026-02-13 21:23:07.087'),
	(1, 82, '2026-02-13 21:23:07.087'),
	(1, 83, '2026-02-13 21:23:07.087'),
	(1, 84, '2026-02-13 21:23:07.087'),
	(1, 85, '2026-02-13 21:23:07.087'),
	(1, 86, '2026-02-13 21:23:07.087'),
	(1, 87, '2026-02-13 21:23:07.087'),
	(1, 88, '2026-02-13 21:23:07.087'),
	(1, 89, '2026-02-13 21:23:07.087'),
	(1, 90, '2026-02-13 21:23:07.087'),
	(1, 91, '2026-02-13 21:23:07.087'),
	(1, 92, '2026-02-13 21:23:07.087'),
	(1, 93, '2026-02-13 21:23:07.087'),
	(1, 94, '2026-02-13 21:23:07.087'),
	(1, 95, '2026-02-13 21:23:07.087'),
	(1, 96, '2026-02-13 21:23:07.087'),
	(1, 97, '2026-02-13 21:23:07.087'),
	(1, 98, '2026-02-13 21:23:07.087'),
	(1, 99, '2026-02-13 21:23:07.087'),
	(1, 100, '2026-02-13 21:23:07.087'),
	(1, 101, '2026-02-13 21:23:07.087'),
	(1, 102, '2026-02-13 21:23:07.087'),
	(1, 103, '2026-02-13 21:23:07.087'),
	(1, 104, '2026-02-13 21:23:07.087'),
	(1, 105, '2026-02-13 21:23:07.087'),
	(1, 106, '2026-02-13 21:23:07.087'),
	(1, 107, '2026-02-13 21:23:07.087'),
	(1, 108, '2026-02-13 21:23:07.087'),
	(1, 109, '2026-02-13 21:23:07.087'),
	(1, 110, '2026-02-13 21:23:07.087'),
	(1, 111, '2026-02-13 21:23:07.087'),
	(1, 112, '2026-02-13 21:23:07.087'),
	(1, 113, '2026-02-13 21:23:07.087'),
	(1, 114, '2026-02-13 21:23:07.087'),
	(1, 115, '2026-02-13 21:23:07.087'),
	(1, 116, '2026-02-13 21:23:07.087'),
	(1, 117, '2026-02-13 21:23:07.087'),
	(2, 1, '2026-02-13 21:23:07.087'),
	(2, 2, '2026-02-13 21:23:07.087'),
	(2, 44, '2026-02-13 21:23:07.087'),
	(2, 45, '2026-02-13 21:23:07.087'),
	(2, 46, '2026-02-13 21:23:07.087'),
	(2, 47, '2026-02-13 21:23:07.087'),
	(2, 48, '2026-02-13 21:23:07.087'),
	(2, 49, '2026-02-13 21:23:07.087'),
	(2, 50, '2026-02-13 21:23:07.087'),
	(2, 51, '2026-02-13 21:23:07.087'),
	(2, 52, '2026-02-13 21:23:07.087'),
	(2, 53, '2026-02-13 21:23:07.087'),
	(2, 54, '2026-02-13 21:23:07.087'),
	(2, 55, '2026-02-13 21:23:07.087'),
	(2, 56, '2026-02-13 21:23:07.087'),
	(2, 57, '2026-02-13 21:23:07.087'),
	(2, 58, '2026-02-13 21:23:07.087'),
	(2, 59, '2026-02-13 21:23:07.087'),
	(2, 60, '2026-02-13 21:23:07.087'),
	(2, 61, '2026-02-13 21:23:07.087'),
	(2, 62, '2026-02-13 21:23:07.087'),
	(2, 63, '2026-02-13 21:23:07.087'),
	(2, 64, '2026-02-13 21:23:07.087'),
	(2, 65, '2026-02-13 21:23:07.087'),
	(2, 66, '2026-02-13 21:23:07.087'),
	(2, 67, '2026-02-13 21:23:07.087'),
	(2, 68, '2026-02-13 21:23:07.087'),
	(2, 69, '2026-02-13 21:23:07.087'),
	(2, 70, '2026-02-13 21:23:07.087'),
	(2, 71, '2026-02-13 21:23:07.087'),
	(2, 72, '2026-02-13 21:23:07.087'),
	(2, 73, '2026-02-13 21:23:07.087'),
	(2, 74, '2026-02-13 21:23:07.087'),
	(2, 75, '2026-02-13 21:23:07.087'),
	(2, 76, '2026-02-13 21:23:07.087'),
	(2, 77, '2026-02-13 21:23:07.087'),
	(2, 78, '2026-02-13 21:23:07.087'),
	(2, 79, '2026-02-13 21:23:07.087'),
	(2, 80, '2026-02-13 21:23:07.087'),
	(2, 81, '2026-02-13 21:23:07.087'),
	(2, 82, '2026-02-13 21:23:07.087'),
	(2, 83, '2026-02-13 21:23:07.087'),
	(2, 84, '2026-02-13 21:23:07.087'),
	(2, 85, '2026-02-13 21:23:07.087'),
	(2, 86, '2026-02-13 21:23:07.087'),
	(2, 87, '2026-02-13 21:23:07.087'),
	(2, 88, '2026-02-13 21:23:07.087'),
	(2, 89, '2026-02-13 21:23:07.087'),
	(2, 90, '2026-02-13 21:23:07.087'),
	(2, 91, '2026-02-13 21:23:07.087'),
	(2, 92, '2026-02-13 21:23:07.087'),
	(2, 93, '2026-02-13 21:23:07.087'),
	(2, 94, '2026-02-13 21:23:07.087'),
	(2, 95, '2026-02-13 21:23:07.087'),
	(2, 96, '2026-02-13 21:23:07.087'),
	(2, 97, '2026-02-13 21:23:07.087'),
	(2, 98, '2026-02-13 21:23:07.087'),
	(2, 99, '2026-02-13 21:23:07.087'),
	(2, 100, '2026-02-13 21:23:07.087'),
	(2, 101, '2026-02-13 21:23:07.087'),
	(2, 102, '2026-02-13 21:23:07.087'),
	(2, 103, '2026-02-13 21:23:07.087'),
	(2, 104, '2026-02-13 21:23:07.087'),
	(2, 105, '2026-02-13 21:23:07.087'),
	(2, 106, '2026-02-13 21:23:07.087'),
	(2, 107, '2026-02-13 21:23:07.087'),
	(2, 108, '2026-02-13 21:23:07.087'),
	(2, 109, '2026-02-13 21:23:07.087'),
	(2, 110, '2026-02-13 21:23:07.087'),
	(2, 111, '2026-02-13 21:23:07.087'),
	(2, 112, '2026-02-13 21:23:07.087'),
	(2, 113, '2026-02-13 21:23:07.087'),
	(2, 114, '2026-02-13 21:23:07.087'),
	(2, 115, '2026-02-13 21:23:07.087'),
	(2, 116, '2026-02-13 21:23:07.087'),
	(2, 117, '2026-02-13 21:23:07.087'),
	(3, 1, '2026-02-13 21:23:07.087'),
	(3, 2, '2026-02-13 21:23:07.087'),
	(3, 44, '2026-02-13 21:23:07.087'),
	(3, 45, '2026-02-13 21:23:07.087'),
	(3, 46, '2026-02-13 21:23:07.087'),
	(3, 47, '2026-02-13 21:23:07.087'),
	(3, 48, '2026-02-13 21:23:07.087'),
	(3, 49, '2026-02-13 21:23:07.087'),
	(3, 50, '2026-02-13 21:23:07.087'),
	(3, 51, '2026-02-13 21:23:07.087'),
	(3, 52, '2026-02-13 21:23:07.087'),
	(3, 53, '2026-02-13 21:23:07.087'),
	(3, 54, '2026-02-13 21:23:07.087'),
	(3, 55, '2026-02-13 21:23:07.087'),
	(3, 56, '2026-02-13 21:23:07.087'),
	(3, 57, '2026-02-13 21:23:07.087'),
	(3, 58, '2026-02-13 21:23:07.087'),
	(3, 59, '2026-02-13 21:23:07.087'),
	(3, 60, '2026-02-13 21:23:07.087'),
	(3, 61, '2026-02-13 21:23:07.087'),
	(3, 62, '2026-02-13 21:23:07.087'),
	(3, 63, '2026-02-13 21:23:07.087'),
	(3, 64, '2026-02-13 21:23:07.087'),
	(3, 65, '2026-02-13 21:23:07.087'),
	(3, 66, '2026-02-13 21:23:07.087'),
	(3, 67, '2026-02-13 21:23:07.087'),
	(3, 68, '2026-02-13 21:23:07.087'),
	(3, 69, '2026-02-13 21:23:07.087'),
	(3, 70, '2026-02-13 21:23:07.087'),
	(3, 71, '2026-02-13 21:23:07.087'),
	(3, 72, '2026-02-13 21:23:07.087'),
	(3, 73, '2026-02-13 21:23:07.087'),
	(3, 74, '2026-02-13 21:23:07.087'),
	(3, 75, '2026-02-13 21:23:07.087'),
	(3, 76, '2026-02-13 21:23:07.087'),
	(3, 77, '2026-02-13 21:23:07.087'),
	(3, 78, '2026-02-13 21:23:07.087'),
	(3, 79, '2026-02-13 21:23:07.087'),
	(3, 80, '2026-02-13 21:23:07.087'),
	(3, 81, '2026-02-13 21:23:07.087'),
	(3, 82, '2026-02-13 21:23:07.087'),
	(3, 83, '2026-02-13 21:23:07.087'),
	(3, 84, '2026-02-13 21:23:07.087'),
	(3, 85, '2026-02-13 21:23:07.087'),
	(3, 86, '2026-02-13 21:23:07.087'),
	(3, 87, '2026-02-13 21:23:07.087'),
	(3, 88, '2026-02-13 21:23:07.087'),
	(3, 89, '2026-02-13 21:23:07.087'),
	(3, 90, '2026-02-13 21:23:07.087'),
	(3, 91, '2026-02-13 21:23:07.087'),
	(3, 92, '2026-02-13 21:23:07.087'),
	(3, 93, '2026-02-13 21:23:07.087'),
	(3, 94, '2026-02-13 21:23:07.087'),
	(3, 95, '2026-02-13 21:23:07.087'),
	(3, 96, '2026-02-13 21:23:07.087'),
	(3, 97, '2026-02-13 21:23:07.087'),
	(3, 98, '2026-02-13 21:23:07.087'),
	(3, 99, '2026-02-13 21:23:07.087'),
	(3, 100, '2026-02-13 21:23:07.087'),
	(3, 101, '2026-02-13 21:23:07.087'),
	(3, 102, '2026-02-13 21:23:07.087'),
	(3, 103, '2026-02-13 21:23:07.087'),
	(3, 104, '2026-02-13 21:23:07.087'),
	(3, 105, '2026-02-13 21:23:07.087'),
	(3, 106, '2026-02-13 21:23:07.087'),
	(3, 107, '2026-02-13 21:23:07.087'),
	(3, 108, '2026-02-13 21:23:07.087'),
	(3, 109, '2026-02-13 21:23:07.087'),
	(3, 110, '2026-02-13 21:23:07.087'),
	(3, 111, '2026-02-13 21:23:07.087'),
	(3, 112, '2026-02-13 21:23:07.087'),
	(3, 113, '2026-02-13 21:23:07.087'),
	(3, 114, '2026-02-13 21:23:07.087'),
	(3, 115, '2026-02-13 21:23:07.087'),
	(3, 116, '2026-02-13 21:23:07.087'),
	(3, 117, '2026-02-13 21:23:07.087'),
	(4, 50, '2026-02-13 22:29:58.668'),
	(4, 53, '2026-02-13 22:29:58.668'),
	(4, 83, '2026-02-13 22:29:58.668'),
	(4, 93, '2026-02-13 22:29:58.668'),
	(4, 94, '2026-02-13 22:29:58.668'),
	(4, 95, '2026-02-13 22:29:58.668'),
	(4, 96, '2026-02-13 22:29:58.668'),
	(4, 97, '2026-02-13 22:29:58.668'),
	(4, 102, '2026-02-13 22:29:58.668'),
	(4, 103, '2026-02-13 22:29:58.668'),
	(4, 104, '2026-02-13 22:29:58.668'),
	(4, 105, '2026-02-13 22:29:58.668'),
	(5, 50, '2026-02-13 22:29:58.699'),
	(5, 53, '2026-02-13 22:29:58.699'),
	(5, 83, '2026-02-13 22:29:58.699'),
	(5, 93, '2026-02-13 22:29:58.699'),
	(5, 94, '2026-02-13 22:29:58.699'),
	(5, 95, '2026-02-13 22:29:58.699'),
	(5, 96, '2026-02-13 22:29:58.699'),
	(5, 97, '2026-02-13 22:29:58.699'),
	(5, 102, '2026-02-13 22:29:58.699'),
	(5, 103, '2026-02-13 22:29:58.699'),
	(5, 104, '2026-02-13 22:29:58.699'),
	(5, 105, '2026-02-13 22:29:58.699'),
	(6, 1, '2026-02-13 22:29:58.716'),
	(6, 2, '2026-02-13 22:29:58.716'),
	(6, 45, '2026-02-13 22:29:58.716'),
	(6, 47, '2026-02-13 22:29:58.716'),
	(6, 48, '2026-02-13 22:29:58.716'),
	(6, 51, '2026-02-13 22:29:58.716'),
	(6, 54, '2026-02-13 22:29:58.716'),
	(6, 56, '2026-02-13 22:29:58.716'),
	(6, 57, '2026-02-13 22:29:58.716'),
	(6, 58, '2026-02-13 22:29:58.716'),
	(6, 78, '2026-02-13 22:29:58.716'),
	(6, 79, '2026-02-13 22:29:58.716'),
	(6, 80, '2026-02-13 22:29:58.716'),
	(6, 81, '2026-02-13 22:29:58.716'),
	(6, 88, '2026-02-13 22:29:58.716'),
	(6, 90, '2026-02-13 22:29:58.716'),
	(6, 99, '2026-02-13 22:29:58.716'),
	(6, 106, '2026-02-13 22:29:58.716'),
	(6, 107, '2026-02-13 22:29:58.716'),
	(6, 108, '2026-02-13 22:29:58.716'),
	(6, 113, '2026-02-13 22:29:58.716');

-- Copiando estrutura para tabela jlr_beauty.professionalshift
DROP TABLE IF EXISTS `professionalshift`;
CREATE TABLE IF NOT EXISTS `professionalshift` (
  `id` int NOT NULL AUTO_INCREMENT,
  `professionalId` int NOT NULL,
  `unitId` int NOT NULL,
  `workDate` datetime(3) NOT NULL,
  `hourStart` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hourFinish` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProfessionalShift_professionalId_workDate_hourStart_hourFini_key` (`professionalId`,`workDate`,`hourStart`,`hourFinish`),
  KEY `ProfessionalShift_unitId_workDate_isActive_idx` (`unitId`,`workDate`,`isActive`),
  KEY `ProfessionalShift_professionalId_workDate_isActive_idx` (`professionalId`,`workDate`,`isActive`),
  CONSTRAINT `ProfessionalShift_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `professional` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ProfessionalShift_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.professionalshift: ~178 rows (aproximadamente)
DELETE FROM `professionalshift`;
INSERT INTO `professionalshift` (`id`, `professionalId`, `unitId`, `workDate`, `hourStart`, `hourFinish`, `isActive`, `notes`, `createdAt`, `updatedAt`) VALUES
	(1, 1, 1, '2026-02-13 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(2, 1, 1, '2026-02-14 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(3, 1, 1, '2026-02-15 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(4, 1, 1, '2026-02-16 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(5, 1, 1, '2026-02-17 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(6, 1, 1, '2026-02-18 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(7, 1, 1, '2026-02-19 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(8, 1, 1, '2026-02-20 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(9, 1, 1, '2026-02-21 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(10, 1, 1, '2026-02-22 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(11, 1, 1, '2026-02-23 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(12, 1, 1, '2026-02-24 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(13, 1, 1, '2026-02-25 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(14, 1, 1, '2026-02-26 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(15, 2, 1, '2026-02-13 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(16, 2, 1, '2026-02-14 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(17, 2, 1, '2026-02-15 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(18, 2, 1, '2026-02-16 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(19, 2, 1, '2026-02-17 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(20, 2, 1, '2026-02-18 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(21, 2, 1, '2026-02-19 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(22, 2, 1, '2026-02-20 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(23, 2, 1, '2026-02-21 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(24, 2, 1, '2026-02-22 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(25, 2, 1, '2026-02-23 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(26, 2, 1, '2026-02-24 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(27, 2, 1, '2026-02-25 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(28, 2, 1, '2026-02-26 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(29, 3, 2, '2026-02-13 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(30, 3, 2, '2026-02-14 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(31, 3, 2, '2026-02-15 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(32, 3, 2, '2026-02-16 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(33, 3, 2, '2026-02-17 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(34, 3, 2, '2026-02-18 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(35, 3, 2, '2026-02-19 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(36, 3, 2, '2026-02-20 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(37, 3, 2, '2026-02-21 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(38, 3, 2, '2026-02-22 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(39, 3, 2, '2026-02-23 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(40, 3, 2, '2026-02-24 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(41, 3, 2, '2026-02-25 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(42, 3, 2, '2026-02-26 03:00:00.000', '09:00', '18:00', 1, 'Seed inicial', '2026-02-13 22:06:21.252', '2026-02-13 22:06:21.252'),
	(44, 4, 1, '2026-02-13 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(45, 4, 1, '2026-02-16 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(46, 4, 1, '2026-02-18 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(47, 4, 1, '2026-02-20 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(48, 4, 1, '2026-02-23 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(49, 4, 1, '2026-02-25 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(50, 4, 1, '2026-02-27 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(51, 4, 1, '2026-03-02 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(52, 4, 1, '2026-03-04 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(53, 4, 1, '2026-03-06 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(54, 4, 1, '2026-03-09 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(55, 4, 1, '2026-03-11 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(56, 4, 1, '2026-03-13 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(57, 4, 1, '2026-03-16 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(58, 4, 1, '2026-03-18 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(59, 4, 1, '2026-03-20 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(60, 4, 1, '2026-03-23 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(61, 4, 1, '2026-03-25 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(62, 4, 1, '2026-03-27 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(63, 4, 1, '2026-03-30 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(64, 4, 1, '2026-04-01 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(65, 4, 1, '2026-04-03 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(66, 4, 1, '2026-04-06 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(67, 4, 1, '2026-04-08 03:00:00.000', '08:00', '15:00', 1, 'Escala seed Maria Manicure', '2026-02-13 22:29:58.778', '2026-02-13 22:29:58.778'),
	(68, 5, 1, '2026-02-13 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(69, 5, 1, '2026-02-14 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(70, 5, 1, '2026-02-15 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(71, 5, 1, '2026-02-16 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(72, 5, 1, '2026-02-17 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(73, 5, 1, '2026-02-18 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(74, 5, 1, '2026-02-19 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(75, 5, 1, '2026-02-20 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(76, 5, 1, '2026-02-21 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(77, 5, 1, '2026-02-22 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(78, 5, 1, '2026-02-23 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(79, 5, 1, '2026-02-24 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(80, 5, 1, '2026-02-25 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(81, 5, 1, '2026-02-26 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(82, 5, 1, '2026-02-27 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(83, 5, 1, '2026-02-28 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(84, 5, 1, '2026-03-01 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(85, 5, 1, '2026-03-02 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(86, 5, 1, '2026-03-03 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(87, 5, 1, '2026-03-04 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(88, 5, 1, '2026-03-05 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(89, 5, 1, '2026-03-06 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(90, 5, 1, '2026-03-07 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(91, 5, 1, '2026-03-08 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(92, 5, 1, '2026-03-09 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(93, 5, 1, '2026-03-10 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(94, 5, 1, '2026-03-11 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(95, 5, 1, '2026-03-12 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(96, 5, 1, '2026-03-13 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(97, 5, 1, '2026-03-14 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(98, 5, 1, '2026-03-15 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(99, 5, 1, '2026-03-16 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(100, 5, 1, '2026-03-17 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(101, 5, 1, '2026-03-18 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(102, 5, 1, '2026-03-19 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(103, 5, 1, '2026-03-20 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(104, 5, 1, '2026-03-21 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(105, 5, 1, '2026-03-22 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(106, 5, 1, '2026-03-23 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(107, 5, 1, '2026-03-24 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(108, 5, 1, '2026-03-25 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(109, 5, 1, '2026-03-26 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(110, 5, 1, '2026-03-27 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(111, 5, 1, '2026-03-28 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(112, 5, 1, '2026-03-29 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(113, 5, 1, '2026-03-30 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(114, 5, 1, '2026-03-31 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(115, 5, 1, '2026-04-01 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(116, 5, 1, '2026-04-02 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(117, 5, 1, '2026-04-03 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(118, 5, 1, '2026-04-04 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(119, 5, 1, '2026-04-05 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(120, 5, 1, '2026-04-06 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(121, 5, 1, '2026-04-07 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(122, 5, 1, '2026-04-08 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(123, 5, 1, '2026-04-09 03:00:00.000', '11:00', '19:00', 1, 'Escala seed Francisca Manicure', '2026-02-13 22:29:58.852', '2026-02-13 22:29:58.852'),
	(124, 6, 1, '2026-02-13 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(125, 6, 1, '2026-02-14 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(126, 6, 1, '2026-02-15 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(127, 6, 1, '2026-02-16 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(128, 6, 1, '2026-02-17 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(129, 6, 1, '2026-02-18 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(130, 6, 1, '2026-02-19 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(131, 6, 1, '2026-02-20 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(132, 6, 1, '2026-02-21 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(133, 6, 1, '2026-02-22 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(134, 6, 1, '2026-02-23 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(135, 6, 1, '2026-02-24 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(136, 6, 1, '2026-02-25 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(137, 6, 1, '2026-02-26 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(138, 6, 1, '2026-02-27 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(139, 6, 1, '2026-02-28 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(140, 6, 1, '2026-03-01 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(141, 6, 1, '2026-03-02 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(142, 6, 1, '2026-03-03 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(143, 6, 1, '2026-03-04 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(144, 6, 1, '2026-03-05 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(145, 6, 1, '2026-03-06 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(146, 6, 1, '2026-03-07 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(147, 6, 1, '2026-03-08 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(148, 6, 1, '2026-03-09 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(149, 6, 1, '2026-03-10 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(150, 6, 1, '2026-03-11 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(151, 6, 1, '2026-03-12 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(152, 6, 1, '2026-03-13 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(153, 6, 1, '2026-03-14 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(154, 6, 1, '2026-03-15 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(155, 6, 1, '2026-03-16 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(156, 6, 1, '2026-03-17 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(157, 6, 1, '2026-03-18 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(158, 6, 1, '2026-03-19 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(159, 6, 1, '2026-03-20 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(160, 6, 1, '2026-03-21 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(161, 6, 1, '2026-03-22 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(162, 6, 1, '2026-03-23 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(163, 6, 1, '2026-03-24 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(164, 6, 1, '2026-03-25 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(165, 6, 1, '2026-03-26 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(166, 6, 1, '2026-03-27 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(167, 6, 1, '2026-03-28 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(168, 6, 1, '2026-03-29 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(169, 6, 1, '2026-03-30 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(170, 6, 1, '2026-03-31 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(171, 6, 1, '2026-04-01 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(172, 6, 1, '2026-04-02 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(173, 6, 1, '2026-04-03 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(174, 6, 1, '2026-04-04 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(175, 6, 1, '2026-04-05 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(176, 6, 1, '2026-04-06 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(177, 6, 1, '2026-04-07 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(178, 6, 1, '2026-04-08 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969'),
	(179, 6, 1, '2026-04-09 03:00:00.000', '08:00', '16:00', 1, 'Escala seed Cicera Cabeleireira', '2026-02-13 22:29:58.969', '2026-02-13 22:29:58.969');

-- Copiando estrutura para tabela jlr_beauty.professionalworkprofile
DROP TABLE IF EXISTS `professionalworkprofile`;
CREATE TABLE IF NOT EXISTS `professionalworkprofile` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `canScheduleAppointments` tinyint(1) NOT NULL DEFAULT '0',
  `canAccessOtherProfessionalsAgenda` tinyint(1) NOT NULL DEFAULT '0',
  `canViewServiceValues` tinyint(1) NOT NULL DEFAULT '0',
  `canViewCustomerContact` tinyint(1) NOT NULL DEFAULT '0',
  `canAccessMenuClientsAnamnese` tinyint(1) NOT NULL DEFAULT '0',
  `canAccessMenuServices` tinyint(1) NOT NULL DEFAULT '0',
  `canAccessMenuProducts` tinyint(1) NOT NULL DEFAULT '0',
  `canAccessMenuExpenses` tinyint(1) NOT NULL DEFAULT '0',
  `canViewCommissionsToReceive` tinyint(1) NOT NULL DEFAULT '0',
  `canViewCommissionPayments` tinyint(1) NOT NULL DEFAULT '0',
  `canEditAppointments` tinyint(1) NOT NULL DEFAULT '0',
  `canDeleteAppointments` tinyint(1) NOT NULL DEFAULT '0',
  `canCreateServiceInAppointment` tinyint(1) NOT NULL DEFAULT '0',
  `canViewGrossCommissionsToPay` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProfessionalWorkProfile_title_key` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.professionalworkprofile: ~2 rows (aproximadamente)
DELETE FROM `professionalworkprofile`;
INSERT INTO `professionalworkprofile` (`id`, `title`, `status`, `canScheduleAppointments`, `canAccessOtherProfessionalsAgenda`, `canViewServiceValues`, `canViewCustomerContact`, `canAccessMenuClientsAnamnese`, `canAccessMenuServices`, `canAccessMenuProducts`, `canAccessMenuExpenses`, `canViewCommissionsToReceive`, `canViewCommissionPayments`, `canEditAppointments`, `canDeleteAppointments`, `canCreateServiceInAppointment`, `canViewGrossCommissionsToPay`, `createdAt`, `updatedAt`) VALUES
	(1, 'Cabelereira', 'ACTIVE', 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '2026-02-15 05:29:00.244', '2026-02-15 05:29:00.244'),
	(2, 'Manicure', 'ACTIVE', 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-02-15 05:39:22.669', '2026-02-15 05:39:22.669'),
	(3, 'Secretária', 'ACTIVE', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-02-15 05:51:02.415', '2026-02-15 05:51:02.415');

-- Copiando estrutura para tabela jlr_beauty.service
DROP TABLE IF EXISTS `service`;
CREATE TABLE IF NOT EXISTS `service` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `durationMin` int DEFAULT NULL,
  `imageUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `commissionPercent` int DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `serviceCategoryId` int DEFAULT NULL,
  `serviceStatusId` int DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Service_serviceCategoryId_fkey` (`serviceCategoryId`),
  KEY `Service_serviceStatusId_fkey` (`serviceStatusId`),
  CONSTRAINT `Service_serviceCategoryId_fkey` FOREIGN KEY (`serviceCategoryId`) REFERENCES `servicecategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Service_serviceStatusId_fkey` FOREIGN KEY (`serviceStatusId`) REFERENCES `servicestatus` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.service: ~77 rows (aproximadamente)
DELETE FROM `service`;
INSERT INTO `service` (`id`, `name`, `description`, `price`, `durationMin`, `imageUrl`, `createdAt`, `updatedAt`, `commissionPercent`, `isFeatured`, `serviceCategoryId`, `serviceStatusId`, `cost`) VALUES
	(1, 'Corte & Styling', 'Corte personalizado com finalizacao premium.', 180.00, 60, '/images/servicos/servico1.jpg', '2026-01-28 04:13:38.522', '2026-01-28 04:13:38.522', NULL, 0, NULL, NULL, NULL),
	(2, 'Terapia Capilar', 'Tratamento regenerativo e relaxante.', 350.00, 90, '/images/servicos/servico2.jpg', '2026-01-28 04:13:38.522', '2026-02-13 22:29:58.397', NULL, 0, 6, 1, 70.00),
	(9, 'Servico E2E 1770159222343', '', 10.00, 30, NULL, '2026-02-03 22:53:42.842', '2026-02-03 22:53:43.217', 0, 0, 1, 2, NULL),
	(44, 'Acupuntura', NULL, 200.00, 60, NULL, '2026-02-13 04:21:13.964', '2026-02-13 22:29:56.100', NULL, 0, 5, 1, 50.00),
	(45, 'Aplicação Coloração Capilar', NULL, 220.00, 60, NULL, '2026-02-13 04:21:13.975', '2026-02-13 22:29:56.185', NULL, 0, 6, 1, 44.00),
	(46, 'Aplicação de Enzimas', NULL, 450.00, 30, NULL, '2026-02-13 04:21:13.984', '2026-02-13 22:29:56.276', NULL, 0, 5, 1, 135.00),
	(47, 'Aplicação Mega Hair', NULL, 5000.00, 180, NULL, '2026-02-13 04:21:13.993', '2026-02-13 22:29:56.336', NULL, 0, 6, 1, 3000.00),
	(48, 'Baby Liss  / Cachos', NULL, 180.00, 45, NULL, '2026-02-13 04:21:14.001', '2026-02-13 22:29:56.365', NULL, 0, 6, 1, 36.00),
	(49, 'Banho de Lua', NULL, 60.00, 50, NULL, '2026-02-13 04:21:14.008', '2026-02-13 22:29:56.396', NULL, 0, 5, 1, 15.00),
	(50, 'Banho em Gel', NULL, 150.00, 45, NULL, '2026-02-13 04:21:14.015', '2026-02-13 22:29:56.431', NULL, 0, 7, 1, 45.00),
	(51, 'Barba', NULL, 80.00, 30, NULL, '2026-02-13 04:21:14.023', '2026-02-13 22:29:56.454', NULL, 0, 8, 1, 24.00),
	(52, 'BB Glow', NULL, 400.00, 45, NULL, '2026-02-13 04:21:14.030', '2026-02-13 22:29:56.476', NULL, 0, 9, 1, 60.00),
	(53, 'Blindagem', NULL, 150.00, 45, NULL, '2026-02-13 04:21:14.038', '2026-02-13 22:29:56.504', NULL, 0, 7, 1, 45.00),
	(54, 'Botox Capilar', NULL, 350.00, 120, NULL, '2026-02-13 04:21:14.048', '2026-02-13 22:29:56.527', NULL, 0, 6, 1, 105.00),
	(55, 'Brow Lamination', NULL, 180.00, 60, NULL, '2026-02-13 04:21:14.056', '2026-02-13 22:29:56.547', NULL, 0, 9, 1, 36.00),
	(56, 'Coloração Capilar', NULL, 250.00, 90, NULL, '2026-02-13 04:21:14.064', '2026-02-13 22:29:56.570', NULL, 0, 6, 1, 75.00),
	(57, 'Corte Feminino', NULL, 220.00, 45, NULL, '2026-02-13 04:21:14.071', '2026-02-13 22:29:56.594', NULL, 0, 6, 1, 44.00),
	(58, 'Corte Masculino', NULL, 220.00, 45, NULL, '2026-02-13 04:21:14.078', '2026-02-13 22:29:56.616', NULL, 0, 8, 1, 44.00),
	(59, 'Depilação Axilas', NULL, 45.00, 30, NULL, '2026-02-13 04:21:14.100', '2026-02-13 22:29:56.639', NULL, 0, 10, 1, 13.50),
	(60, 'Depilação Barba (Cera)', NULL, 80.00, 30, NULL, '2026-02-13 04:21:14.109', '2026-02-13 22:29:56.658', NULL, 0, 10, 1, 16.00),
	(61, 'Depilação Barriga', NULL, 70.00, 30, NULL, '2026-02-13 04:21:14.134', '2026-02-13 22:29:56.680', NULL, 0, 10, 1, 21.00),
	(62, 'Depilação Braços', NULL, 120.00, 45, NULL, '2026-02-13 04:21:14.146', '2026-02-13 22:29:56.701', NULL, 0, 10, 1, 24.00),
	(63, 'Depilação Buço (Cera)', NULL, 45.00, 30, NULL, '2026-02-13 04:21:14.154', '2026-02-13 22:29:56.725', NULL, 0, 10, 1, 9.00),
	(64, 'Depilação Buço (Linha)', NULL, 45.00, 30, NULL, '2026-02-13 04:21:14.161', '2026-02-13 22:29:56.758', NULL, 0, 10, 1, 5.00),
	(65, 'Depilação Costas', NULL, 70.00, 45, NULL, '2026-02-13 04:21:14.169', '2026-02-13 22:29:56.796', NULL, 0, 10, 1, 17.50),
	(66, 'Depilação Coxas', NULL, 70.00, 45, NULL, '2026-02-13 04:21:14.177', '2026-02-13 22:29:56.846', NULL, 0, 10, 1, 17.50),
	(67, 'Depilação Meia Perna', NULL, 80.00, 45, NULL, '2026-02-13 04:21:14.187', '2026-02-13 22:29:56.900', NULL, 0, 10, 1, 20.00),
	(68, 'Depilação Nariz', NULL, 40.00, 30, NULL, '2026-02-13 04:21:14.196', '2026-02-13 22:29:56.956', NULL, 0, 10, 1, 8.00),
	(69, 'Depilação Rosto (Linha)', NULL, 80.00, 30, NULL, '2026-02-13 04:21:14.204', '2026-02-13 22:29:57.001', NULL, 0, 10, 1, 12.00),
	(70, 'Depilação Virilha (Cavada)', NULL, 90.00, 45, NULL, '2026-02-13 04:21:14.212', '2026-02-13 22:29:57.024', NULL, 0, 10, 1, 22.50),
	(71, 'Depilação Virilha (Completa)', NULL, 140.00, 50, NULL, '2026-02-13 04:21:14.221', '2026-02-13 22:29:57.050', NULL, 0, 10, 1, 35.00),
	(72, 'Dermaplaning', NULL, 180.00, 40, NULL, '2026-02-13 04:21:14.229', '2026-02-13 22:29:57.072', NULL, 0, 9, 1, 36.00),
	(73, 'Design de Sobrancelha', NULL, 80.00, 45, NULL, '2026-02-13 04:21:14.240', '2026-02-13 22:29:57.092', NULL, 0, 9, 1, 16.00),
	(74, 'Drenagem Linfática', NULL, 200.00, 60, NULL, '2026-02-13 04:21:14.250', '2026-02-13 22:29:57.115', NULL, 0, 5, 1, 50.00),
	(75, 'Drenagem Linfática (Aparelho)', NULL, 250.00, 60, NULL, '2026-02-13 04:21:14.258', '2026-02-13 22:29:57.154', NULL, 0, 5, 1, 60.00),
	(76, 'Drenagem Linfática (Pós - Operatório)', NULL, 250.00, 60, NULL, '2026-02-13 04:21:14.266', '2026-02-13 22:29:57.197', NULL, 0, 5, 1, 60.00),
	(77, 'Drenagem Linfática Facial', NULL, 130.00, 60, NULL, '2026-02-13 04:21:14.275', '2026-02-13 22:29:57.244', NULL, 0, 9, 1, 26.00),
	(78, 'Escova + Hidratação', NULL, 220.00, 60, NULL, '2026-02-13 04:21:14.283', '2026-02-13 22:29:57.282', NULL, 0, 6, 1, 66.00),
	(79, 'Escova + Prancha', NULL, 150.00, 60, NULL, '2026-02-13 04:21:14.292', '2026-02-13 22:29:57.321', NULL, 0, 6, 1, 45.00),
	(80, 'Escova Capilar', NULL, 120.00, 45, NULL, '2026-02-13 04:21:14.299', '2026-02-13 22:29:57.356', NULL, 0, 6, 1, 36.00),
	(81, 'Escova Modelada', NULL, 150.00, 45, NULL, '2026-02-13 04:21:14.306', '2026-02-13 22:29:57.379', NULL, 0, 6, 1, 30.00),
	(82, 'Esfoliação de Pés', NULL, 15.00, 15, NULL, '2026-02-13 04:21:14.313', '2026-02-13 22:29:57.401', NULL, 0, 11, 1, 4.50),
	(83, 'Esmaltação em Gel', NULL, 130.00, 40, NULL, '2026-02-13 04:21:14.320', '2026-02-13 22:29:57.431', NULL, 0, 7, 1, 39.00),
	(84, 'Esmaltação Tradicional', NULL, 25.00, 30, NULL, '2026-02-13 04:21:14.327', '2026-02-13 22:29:57.477', NULL, 0, 11, 1, 7.50),
	(85, 'Extensão De Cilios', NULL, 280.00, 80, NULL, '2026-02-13 04:21:14.334', '2026-02-13 22:29:57.537', NULL, 0, 9, 1, 28.00),
	(86, 'Francesinha', NULL, 15.00, 30, NULL, '2026-02-13 04:21:14.341', '2026-02-13 22:29:57.587', NULL, 0, 11, 1, 4.50),
	(87, 'Hidralips', NULL, 250.00, 50, NULL, '2026-02-13 04:21:14.349', '2026-02-13 22:29:57.619', NULL, 0, 9, 1, 50.00),
	(88, 'Hidratação Capilar', NULL, 280.00, 45, NULL, '2026-02-13 04:21:14.357', '2026-02-13 22:29:57.644', NULL, 0, 6, 1, 84.00),
	(89, 'Lash Lifting', NULL, 180.00, 60, NULL, '2026-02-13 04:21:14.365', '2026-02-13 22:29:57.665', NULL, 0, 9, 1, 36.00),
	(90, 'Lavagem / Secagem Simples', NULL, 50.00, 30, NULL, '2026-02-13 04:21:14.373', '2026-02-13 22:29:57.689', NULL, 0, 6, 1, 15.00),
	(91, 'Limpeza de Pele', NULL, 250.00, 60, NULL, '2026-02-13 04:21:14.380', '2026-02-13 22:29:57.712', NULL, 0, 9, 1, 50.00),
	(92, 'Limpeza de Sobrancelha', NULL, 60.00, 30, NULL, '2026-02-13 04:21:14.387', '2026-02-13 22:29:57.734', NULL, 0, 9, 1, 12.00),
	(93, 'Manicure', NULL, 45.00, 45, NULL, '2026-02-13 04:21:14.396', '2026-02-13 22:29:57.754', NULL, 0, 11, 1, 13.50),
	(94, 'Manicure + Francesinha', NULL, 60.00, 60, NULL, '2026-02-13 04:21:14.403', '2026-02-13 22:29:57.774', NULL, 0, 11, 1, 18.00),
	(95, 'Manicure + Pedicure', NULL, 95.00, 105, NULL, '2026-02-13 04:21:14.410', '2026-02-13 22:29:57.802', NULL, 0, 11, 1, 28.50),
	(96, 'Manicure + Pedicure Masculino', NULL, 95.00, 80, NULL, '2026-02-13 04:21:14.418', '2026-02-13 22:29:57.863', NULL, 0, 11, 1, 19.00),
	(97, 'Manicure Masculino', NULL, 45.00, 30, NULL, '2026-02-13 04:21:14.425', '2026-02-13 22:29:57.891', NULL, 0, 11, 1, 9.00),
	(98, 'Manutenção Cilios', NULL, 180.00, 90, NULL, '2026-02-13 04:21:14.432', '2026-02-13 22:29:57.916', NULL, 0, 9, 1, 28.00),
	(99, 'Manutenção Mega Hair', NULL, 350.00, 120, NULL, '2026-02-13 04:21:14.440', '2026-02-13 22:29:57.944', NULL, 0, 6, 1, 70.00),
	(100, 'Maquiagem', NULL, 250.00, 45, NULL, '2026-02-13 04:21:14.447', '2026-02-13 22:29:57.968', NULL, 0, 9, 1, 60.00),
	(101, 'Massagem Relaxante', NULL, 200.00, 60, NULL, '2026-02-13 04:21:14.455', '2026-02-13 22:29:57.995', NULL, 0, 5, 1, 50.00),
	(102, 'Pedicure', NULL, 50.00, 60, NULL, '2026-02-13 04:21:14.462', '2026-02-13 22:29:58.018', NULL, 0, 11, 1, 15.00),
	(103, 'Pedicure + Francesinha', NULL, 65.00, 60, NULL, '2026-02-13 04:21:14.470', '2026-02-13 22:29:58.041', NULL, 0, 11, 1, 19.50),
	(104, 'Pedicure + Reflexologia', NULL, 125.00, 80, NULL, '2026-02-13 04:21:14.478', '2026-02-13 22:29:58.064', NULL, 0, 11, 1, 37.50),
	(105, 'Pedicure Masculino', NULL, 50.00, 45, NULL, '2026-02-13 04:21:14.486', '2026-02-13 22:29:58.086', NULL, 0, 11, 1, 10.00),
	(106, 'Penteado', NULL, 250.00, 60, NULL, '2026-02-13 04:21:14.496', '2026-02-13 22:29:58.112', NULL, 0, 6, 1, 75.00),
	(107, 'Progressiva Capilar', NULL, 350.00, 180, NULL, '2026-02-13 04:21:14.505', '2026-02-13 22:29:58.153', NULL, 0, 6, 1, 105.00),
	(108, 'Reconstrução Capilar', NULL, 280.00, 60, NULL, '2026-02-13 04:21:14.512', '2026-02-13 22:29:58.196', NULL, 0, 6, 1, 84.00),
	(109, 'Remoção de Alongamento', NULL, 70.00, 30, NULL, '2026-02-13 04:21:14.521', '2026-02-13 22:29:58.227', NULL, 0, 11, 1, 15.00),
	(110, 'Remoção de Cilios', '', 80.00, 30, NULL, '2026-02-13 04:21:14.529', '2026-02-13 22:29:58.254', 0, 0, 9, 1, 10.00),
	(111, 'Retorno Botox', 'Ajustes pós aplicação', 0.00, 30, NULL, '2026-02-13 04:21:14.536', '2026-02-13 22:29:58.281', 0, 0, 9, 1, NULL),
	(112, 'Secagem De Vasinho', NULL, 130.00, 30, NULL, '2026-02-13 04:21:14.544', '2026-02-13 22:29:58.303', NULL, 0, 5, 1, 26.00),
	(113, 'Selagem Capilar', NULL, 280.00, 120, NULL, '2026-02-13 04:21:14.551', '2026-02-13 22:29:58.323', NULL, 0, 6, 1, 84.00),
	(114, 'Spa das Mãos', NULL, 120.00, 60, NULL, '2026-02-13 04:21:14.559', '2026-02-13 22:29:58.346', NULL, 0, 11, 1, 36.00),
	(115, 'Spa dos Pés + Cutílagem', NULL, 180.00, 80, NULL, '2026-02-13 04:21:14.567', '2026-02-13 22:29:58.372', NULL, 0, 11, 1, 54.00),
	(116, 'Top Coat', NULL, 30.00, 30, NULL, '2026-02-13 04:21:14.646', '2026-02-13 22:29:58.417', NULL, 0, 11, 1, 9.00),
	(117, 'Toxina Botulínica (Botox)', NULL, 700.00, 30, NULL, '2026-02-13 04:21:14.654', '2026-02-13 22:29:58.439', NULL, 0, 9, 1, 270.00);

-- Copiando estrutura para tabela jlr_beauty.servicecategory
DROP TABLE IF EXISTS `servicecategory`;
CREATE TABLE IF NOT EXISTS `servicecategory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.servicecategory: ~11 rows (aproximadamente)
DELETE FROM `servicecategory`;
INSERT INTO `servicecategory` (`id`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
	(1, 'Cabelos', 'ACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271'),
	(2, 'Estetica', 'ACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271'),
	(3, 'Sobrancelhas', 'ACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271'),
	(4, 'Unhas', 'INACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271'),
	(5, 'Estética Corporal', 'ACTIVE', '2026-02-13 04:21:13.881', '2026-02-13 04:21:13.881'),
	(6, 'Cabeleireiro Feminino', 'ACTIVE', '2026-02-13 04:21:13.913', '2026-02-13 04:21:13.913'),
	(7, 'Nails Designer', 'ACTIVE', '2026-02-13 04:21:13.927', '2026-02-13 04:21:13.927'),
	(8, 'Cabeleireiro Masculino', 'ACTIVE', '2026-02-13 04:21:13.934', '2026-02-13 04:21:13.934'),
	(9, 'Estética Facial', 'ACTIVE', '2026-02-13 04:21:13.941', '2026-02-13 04:21:13.941'),
	(10, 'Depilação', 'ACTIVE', '2026-02-13 04:21:13.947', '2026-02-13 04:21:13.947'),
	(11, 'Manicure & Pedicure', 'ACTIVE', '2026-02-13 04:21:13.954', '2026-02-13 04:21:13.954');

-- Copiando estrutura para tabela jlr_beauty.servicestatus
DROP TABLE IF EXISTS `servicestatus`;
CREATE TABLE IF NOT EXISTS `servicestatus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` enum('VERDE','AMARELO','VERMELHO','CINZA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VERDE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.servicestatus: ~3 rows (aproximadamente)
DELETE FROM `servicestatus`;
INSERT INTO `servicestatus` (`id`, `name`, `color`, `createdAt`, `updatedAt`) VALUES
	(1, 'Ativo', 'VERDE', '2026-01-30 21:22:05.284', '2026-01-30 21:22:05.284'),
	(2, 'Rascunho', 'AMARELO', '2026-01-30 21:22:05.284', '2026-01-30 21:22:05.284'),
	(3, 'Inativo', 'VERMELHO', '2026-01-30 21:22:05.284', '2026-01-30 21:22:05.284');

-- Copiando estrutura para tabela jlr_beauty.subscription
DROP TABLE IF EXISTS `subscription`;
CREATE TABLE IF NOT EXISTS `subscription` (
  `id` int NOT NULL AUTO_INCREMENT,
  `membershipId` int NOT NULL,
  `status` enum('ACTIVE','PENDING','CANCELLED','DELINQUENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerPhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `cancelledAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Subscription_membershipId_fkey` (`membershipId`),
  CONSTRAINT `Subscription_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `membership` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.subscription: ~3 rows (aproximadamente)
DELETE FROM `subscription`;
INSERT INTO `subscription` (`id`, `membershipId`, `status`, `customerName`, `customerEmail`, `customerPhone`, `startedAt`, `cancelledAt`, `createdAt`, `updatedAt`) VALUES
	(10, 2, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-07 17:09:25.406', NULL, '2026-02-07 17:09:25.429', '2026-02-07 17:09:25.429'),
	(11, 1, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-07 17:21:59.575', NULL, '2026-02-07 17:21:59.580', '2026-02-07 17:21:59.580'),
	(13, 8, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-07 20:38:44.013', NULL, '2026-02-07 20:38:44.035', '2026-02-07 20:38:44.035'),
	(15, 2, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-09 20:03:04.688', NULL, '2026-02-09 20:03:04.751', '2026-02-09 20:03:04.751'),
	(16, 1, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-18 02:58:54.238', NULL, '2026-02-18 02:58:54.262', '2026-02-18 02:58:54.262');

-- Copiando estrutura para tabela jlr_beauty.unit
DROP TABLE IF EXISTS `unit`;
CREATE TABLE IF NOT EXISTS `unit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `hourFinish` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '18:00',
  `hourStart` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '09:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.unit: ~2 rows (aproximadamente)
DELETE FROM `unit`;
INSERT INTO `unit` (`id`, `name`, `address`, `createdAt`, `updatedAt`, `hourFinish`, `hourStart`) VALUES
	(1, 'Parque da Cidade', 'Av. das Nações, 1000', '2026-01-30 21:22:05.299', '2026-02-13 22:29:58.515', '20:00', '08:00'),
	(2, 'Birmann 20', 'Rua Birmann, 20', '2026-01-30 21:22:05.299', '2026-02-13 22:29:58.515', '20:00', '08:00');

-- Copiando estrutura para tabela jlr_beauty.user
DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('MASTER','ADMIN','MANAGER','PROFESSIONAL','CLIENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CLIENT',
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `phone2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatarUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `rating` int DEFAULT NULL,
  `lastAccessAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.user: ~9 rows (aproximadamente)
DELETE FROM `user`;
INSERT INTO `user` (`id`, `name`, `email`, `phone`, `role`, `passwordHash`, `createdAt`, `updatedAt`, `phone2`, `city`, `neighborhood`, `avatarUrl`, `status`, `emailVerified`, `rating`, `lastAccessAt`) VALUES
	(1, 'Jeiel de Oliveira Borner', 'jeiel.borner@gmail.com', '1108765-3425', 'MASTER', '$2b$10$SBmWRicQkgg8IQf1fwuzL.PNH6CCmPxERTxTMj5E6FRBsuHBNKBqe', '2026-01-29 22:42:13.202', '2026-02-17 19:52:00.893', '11088887777', 'Barueri', 'Jardim Esperança', 'http://localhost:3001/uploads/avatarjb-1769808840178-238814620.jpg', 'ACTIVE', 0, 1, '2026-02-17 19:52:00.864'),
	(2, 'Abimeleque Saduceu', 'jeielborner5@gmail.com', NULL, 'CLIENT', '$2b$10$1kyvsLttfheOtu6LKaV2Vu3TNsqDNN571jnPJJ.wlcf8lXaOoiBAu', '2026-01-30 18:45:04.814', '2026-02-07 05:17:28.980', NULL, 'Lutécia', 'Centro', 'http://localhost:3001/uploads/visao3-1770441445025-134819187.jfif', 'ACTIVE', 0, NULL, NULL),
	(3, 'admin', 'admin@jlrbeauty.com', NULL, 'ADMIN', '$2b$10$TcCrumS8uPj8wziIIAVjZu9RUYm39ftl997mBTP4T/2qFVfIGl9MO', '2026-01-30 21:22:05.181', '2026-02-17 19:57:18.180', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, '2026-02-17 19:57:18.170'),
	(21, 'Joana Ribeiro', 'profissional.1@jlr.local', NULL, 'PROFESSIONAL', NULL, '2026-02-14 21:08:22.057', '2026-02-14 21:08:22.057', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, NULL),
	(22, 'Marcos Lima', 'profissional.2@jlr.local', NULL, 'PROFESSIONAL', NULL, '2026-02-14 21:08:22.057', '2026-02-14 21:08:22.057', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, NULL),
	(23, 'Equipe Birmann 20', 'profissional.3@jlr.local', NULL, 'PROFESSIONAL', NULL, '2026-02-14 21:08:22.057', '2026-02-14 21:08:22.057', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, NULL),
	(24, 'Maria Manicure', 'profissional.4@jlr.local', NULL, 'PROFESSIONAL', NULL, '2026-02-14 21:08:22.057', '2026-02-14 21:08:22.057', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, NULL),
	(25, 'Francisca Manicure', 'profissional.5@jlr.local', NULL, 'PROFESSIONAL', NULL, '2026-02-14 21:08:22.057', '2026-02-14 21:08:22.057', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, NULL),
	(26, 'Cicera Cabeleireira', 'profissional.6@jlr.local', NULL, 'PROFESSIONAL', NULL, '2026-02-14 21:08:22.057', '2026-02-14 21:08:22.057', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, NULL);

-- Copiando estrutura para tabela jlr_beauty._prisma_migrations
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty._prisma_migrations: ~16 rows (aproximadamente)
DELETE FROM `_prisma_migrations`;
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
	('2f16964a-b693-471b-a971-afb43f1a2c4b', '31c053981b91e2f013e6c6d187eb8bd42c5671afdf3474c634cdb256a1c4152f', '2026-02-13 15:29:38.420', '20260212215000_add_concierge_session_flow', '', NULL, '2026-02-13 15:29:38.420', 0),
	('329688c8-1af6-4002-90e1-c052952e79b5', '1aab9f167b148de1b96b94757207a56db31aa87c7ac553bfc3ca98cd1e83850d', '2026-02-18 05:26:15.787', '20260218093000_add_discount_coupons', NULL, NULL, '2026-02-18 05:26:13.788', 1),
	('33018121-d346-4559-89f4-30ff1e95de28', 'aa9591915cd9df016af55ba5278199da10afd2cf557bb8af82a35b0efd340f9f', '2026-01-30 21:18:56.361', '20260130211855_split_product_service_catalog', NULL, NULL, '2026-01-30 21:18:55.764', 1),
	('3d104124-33b0-43e8-b7fe-ecd591cb6a72', '7b1f30a7ba0294eea8fb655d0739e0360a1d0be1cfaa861a93f8dc7fbcb9e908', '2026-01-30 06:57:49.817', '20260130000200_extend_user_profile', NULL, NULL, '2026-01-30 06:57:49.664', 1),
	('45bb57b7-e5fc-4b58-8a4b-d2af78cd5978', '7a8e8d77ecf437bc4b8e2aceb0cbcbe44f1856ecdf49bd2010e39c26da979543', NULL, '20260212223500_add_service_cost', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260212223500_add_service_cost\n\nDatabase error code: 1060\n\nDatabase error:\nDuplicate column name \'cost\'\n\nPlease check the query number 1 from the migration file.\n\n', '2026-02-13 15:35:23.025', '2026-02-13 15:30:05.270', 0),
	('8854e1b3-e79e-445d-b8a0-222b54770225', '4f5692cf99994f3fac42fd7794df2d55a0f4e29d25bef146c5e9c867dad9bc06', '2026-02-15 04:41:26.922', '20260215001500_professional_commission_profile_and_lifecycle', NULL, NULL, '2026-02-15 04:41:25.324', 1),
	('896fec2c-6cb6-463b-9f37-c9a7467f185e', 'f1c14b2ea2744e365bd5d5add15a16c45b8429212fb764304ae70be5e61da5c8', '2026-02-04 00:00:42.521', '20260204000042_add_service_orderitems_appointment_order', NULL, NULL, '2026-02-04 00:00:42.257', 1),
	('94eef14d-e850-478a-aa5d-b14d0e3b4867', '6c4774ff7349ed5578de1a9e92df6b32494a7af58595fe3a5ef5c40128b949f8', '2026-02-15 05:44:30.835', '20260215032000_professional_commission_percent_direct', NULL, NULL, '2026-02-15 05:44:30.147', 1),
	('96390fe5-d69f-4691-b0f7-38478f896d0a', '19b0e5f8c8259e756ca2894eb8a6096d2fbe8505df0f605dad085f9ccba4602a', '2026-01-28 04:07:31.296', '20260128040729_init', NULL, NULL, '2026-01-28 04:07:29.337', 1),
	('ac5ddd5d-8d73-49e5-a940-5eb3cce1bd14', '170af8423871fc02a0ae2cea6401a93d8e7bee07f39a6d234f63531e243beb53', '2026-01-30 03:36:26.699', '20260130000100_add_master_role', NULL, NULL, '2026-01-30 03:36:26.602', 1),
	('d1b52b94-1045-4cab-b918-b322496aa169', '9284e9d9822ed565b32c6ae0667a8d8733723ae7f3986847008561b9cb8c2d4a', '2026-02-17 20:02:30.677', '20260217170500_expand_description_fields_to_text', NULL, NULL, '2026-02-17 20:02:29.872', 1),
	('d2d7db0a-2e07-4a1b-a1ce-22ae3a4b0dfb', '1ad4c81b0c18c131931cd80216221f245be39ba8535909601c1da5de6009d096', '2026-02-15 00:08:22.482', '20260214210500_customer_profile_and_professional_user_required', NULL, NULL, '2026-02-15 00:08:21.985', 1),
	('d8bd5ffb-f628-42ff-b2f6-d2a1dfa8961c', '7ef9a02da2d2908b953dba77be854f29fd6a5d26f328a7caccc02fd9454967b9', '2026-02-15 05:05:48.082', '20260215023000_professional_work_profile_permissions', NULL, NULL, '2026-02-15 05:05:46.542', 1),
	('e1cff2cb-1104-48fe-aa1d-f4913051ba87', '7a8e8d77ecf437bc4b8e2aceb0cbcbe44f1856ecdf49bd2010e39c26da979543', '2026-02-13 15:35:23.032', '20260212223500_add_service_cost', '', NULL, '2026-02-13 15:35:23.032', 0),
	('e45ecf35-22e9-4fd0-808e-164780d23319', '31c053981b91e2f013e6c6d187eb8bd42c5671afdf3474c634cdb256a1c4152f', NULL, '20260212215000_add_concierge_session_flow', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260212215000_add_concierge_session_flow\n\nDatabase error code: 1050\n\nDatabase error:\nTable \'conciergesession\' already exists\n\nPlease check the query number 1 from the migration file.\n\n', '2026-02-13 15:29:38.405', '2026-02-13 14:21:39.869', 0),
	('e6c12e1e-a880-4643-b320-6a4cae1d49f5', '21c9db410cf64f75743c12b770c45d6aac78ed1f4b11935460b2fb77c1e05edd', '2026-02-13 15:35:43.090', '20260213111500_harden_whatsapp_concierge_tracking', NULL, NULL, '2026-02-13 15:35:42.895', 1),
	('f50f1141-f3e9-4a41-8204-154f0f881689', 'cf684021034b76714bab8ce7d5bc7459fee91a32c455e31641315e30177af049', '2026-02-13 22:04:35.542', '20260213222500_professional_shift_schedule', NULL, NULL, '2026-02-13 22:04:35.034', 1),
	('ff0aab85-ee8f-4a1b-a786-012a8a111ded', '91d56a6aa0ccb809814a9da767c9f6ac2b56302a4d67bb5d66925860d98536a8', '2026-02-13 21:05:35.205', '20260213210533_remote_appointment_availability', NULL, NULL, '2026-02-13 21:05:33.167', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

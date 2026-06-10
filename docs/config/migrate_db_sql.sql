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
  PRIMARY KEY (`id`),
  KEY `Appointment_unitId_fkey` (`unitId`),
  KEY `Appointment_professionalId_fkey` (`professionalId`),
  KEY `Appointment_serviceId_fkey` (`serviceId`),
  KEY `Appointment_orderId_fkey` (`orderId`),
  CONSTRAINT `Appointment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Appointment_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `professional` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Appointment_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Appointment_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.appointment: ~1 rows (aproximadamente)
INSERT INTO `appointment` (`id`, `unitId`, `professionalId`, `serviceId`, `start`, `end`, `clientName`, `clientPhone`, `notes`, `status`, `createdAt`, `updatedAt`, `orderId`) VALUES
	(1, 1, 1, 9, '2026-02-03 23:37:18.354', NULL, 'Cliente', '+5511999999999', NULL, 'PENDING', '2026-02-03 23:37:18.383', '2026-02-03 23:37:18.383', NULL);

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.contententry: ~0 rows (aproximadamente)

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

-- Copiando estrutura para tabela jlr_beauty.membership
DROP TABLE IF EXISTS `membership`;
CREATE TABLE IF NOT EXISTS `membership` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `benefits` json DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Ativo',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.membership: ~3 rows (aproximadamente)
INSERT INTO `membership` (`id`, `name`, `title`, `description`, `price`, `benefits`, `isFeatured`, `status`, `createdAt`, `updatedAt`) VALUES
	(1, 'Silver', 'Radiance', NULL, 99.00, '["10% desconto", "Acesso antecipado", "Tratamento mensal"]', 0, 'Ativo', '2026-01-28 04:13:38.529', '2026-02-06 20:38:51.379'),
	(2, 'Gold', 'Luminosity', NULL, 189.00, '["15% desconto", "Priority booking", "Facial mensal"]', 1, 'Ativo', '2026-01-28 04:13:38.529', '2026-01-28 04:13:38.529'),
	(8, 'Platinum', 'Ethereal', NULL, 299.00, '["20% de desconto Ilimitado", "Massagem corporal mensal", "Servico de concierge dedicado", "Convites para eventos VIP"]', 0, 'Ativo', '2026-02-06 20:49:24.622', '2026-02-07 03:21:12.119');

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

-- Copiando dados para a tabela jlr_beauty.payment: ~1 rows (aproximadamente)
INSERT INTO `payment` (`id`, `orderId`, `subscriptionId`, `provider`, `providerPaymentId`, `status`, `amount`, `method`, `paidAt`, `rawPayload`, `createdAt`, `updatedAt`) VALUES
	(1, 4, NULL, 'MOCK', 'mock_1770161998549', 'APPROVED', 10.00, NULL, '2026-02-03 23:39:58.577', '{"type": "order", "description": "Teste"}', '2026-02-03 23:39:58.551', '2026-02-03 23:39:58.579');

-- Copiando estrutura para tabela jlr_beauty.product
DROP TABLE IF EXISTS `product`;
CREATE TABLE IF NOT EXISTS `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.product: ~3 rows (aproximadamente)
INSERT INTO `product` (`id`, `name`, `description`, `price`, `imageUrl`, `createdAt`, `updatedAt`, `benefits`, `isFeatured`, `productCategoryId`, `productStatusId`, `sku`, `stock`) VALUES
	(1, 'Shampoo Luxo', 'Limpeza suave com brilho intenso.', 89.90, '/images/produtos/produto1.jpg', '2026-01-28 04:13:38.510', '2026-02-03 23:39:58.502', NULL, 0, NULL, NULL, NULL, 9),
	(2, 'Mascara Nutritiva', 'Nutrição profunda para fios sedosos.', 129.90, '/images/produtos/produto2.jpg', '2026-01-28 04:13:38.510', '2026-01-28 04:13:38.510', NULL, 0, NULL, NULL, NULL, 0),
	(3, 'Serum Facial', 'Hidratação e luminosidade diária.', 149.90, '/images/produtos/produto3.jpg', '2026-01-28 04:13:38.510', '2026-01-28 04:13:38.510', NULL, 0, NULL, NULL, NULL, 0);

-- Copiando estrutura para tabela jlr_beauty.productcategory
DROP TABLE IF EXISTS `productcategory`;
CREATE TABLE IF NOT EXISTS `productcategory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.productcategory: ~4 rows (aproximadamente)
INSERT INTO `productcategory` (`id`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
	(1, 'Tratamento', 'ACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264'),
	(2, 'Finalizacao', 'ACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264'),
	(3, 'Hair Care', 'ACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264'),
	(4, 'Skin Care', 'INACTIVE', '2026-01-30 21:22:05.264', '2026-01-30 21:22:05.264');

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
  PRIMARY KEY (`id`),
  KEY `Professional_unitId_fkey` (`unitId`),
  CONSTRAINT `Professional_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.professional: ~2 rows (aproximadamente)
INSERT INTO `professional` (`id`, `name`, `specialties`, `unitId`, `createdAt`, `updatedAt`) VALUES
	(1, 'Joana Ribeiro', '["Corte", "Coloracao"]', 1, '2026-01-30 21:22:05.306', '2026-01-30 21:22:05.306'),
	(2, 'Marcos Lima', '["Tratamentos", "Escova"]', 1, '2026-01-30 21:22:05.306', '2026-01-30 21:22:05.306');

-- Copiando estrutura para tabela jlr_beauty.service
DROP TABLE IF EXISTS `service`;
CREATE TABLE IF NOT EXISTS `service` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `durationMin` int DEFAULT NULL,
  `imageUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `commissionPercent` int DEFAULT NULL,
  `isFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `serviceCategoryId` int DEFAULT NULL,
  `serviceStatusId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Service_serviceCategoryId_fkey` (`serviceCategoryId`),
  KEY `Service_serviceStatusId_fkey` (`serviceStatusId`),
  CONSTRAINT `Service_serviceCategoryId_fkey` FOREIGN KEY (`serviceCategoryId`) REFERENCES `servicecategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Service_serviceStatusId_fkey` FOREIGN KEY (`serviceStatusId`) REFERENCES `servicestatus` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.service: ~3 rows (aproximadamente)
INSERT INTO `service` (`id`, `name`, `description`, `price`, `durationMin`, `imageUrl`, `createdAt`, `updatedAt`, `commissionPercent`, `isFeatured`, `serviceCategoryId`, `serviceStatusId`) VALUES
	(1, 'Corte & Styling', 'Corte personalizado com finalizacao premium.', 180.00, 60, '/images/servicos/servico1.jpg', '2026-01-28 04:13:38.522', '2026-01-28 04:13:38.522', NULL, 0, NULL, NULL),
	(2, 'Terapia Capilar', 'Tratamento regenerativo e relaxante.', 250.00, 90, '/images/servicos/servico2.jpg', '2026-01-28 04:13:38.522', '2026-01-28 04:13:38.522', NULL, 0, NULL, NULL),
	(9, 'Servico E2E 1770159222343', '', 10.00, 30, NULL, '2026-02-03 22:53:42.842', '2026-02-03 22:53:43.217', 0, 0, 1, 2);

-- Copiando estrutura para tabela jlr_beauty.servicecategory
DROP TABLE IF EXISTS `servicecategory`;
CREATE TABLE IF NOT EXISTS `servicecategory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.servicecategory: ~4 rows (aproximadamente)
INSERT INTO `servicecategory` (`id`, `name`, `status`, `createdAt`, `updatedAt`) VALUES
	(1, 'Cabelos', 'ACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271'),
	(2, 'Estetica', 'ACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271'),
	(3, 'Sobrancelhas', 'ACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271'),
	(4, 'Unhas', 'INACTIVE', '2026-01-30 21:22:05.271', '2026-01-30 21:22:05.271');

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.subscription: ~3 rows (aproximadamente)
INSERT INTO `subscription` (`id`, `membershipId`, `status`, `customerName`, `customerEmail`, `customerPhone`, `startedAt`, `cancelledAt`, `createdAt`, `updatedAt`) VALUES
	(10, 2, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-07 17:09:25.406', NULL, '2026-02-07 17:09:25.429', '2026-02-07 17:09:25.429'),
	(11, 1, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-07 17:21:59.575', NULL, '2026-02-07 17:21:59.580', '2026-02-07 17:21:59.580'),
	(13, 8, 'PENDING', 'JEIEL DE OLIVEIRA BORNER', 'jeiel.borner@gmail.com', '11981859426', '2026-02-07 20:38:44.013', NULL, '2026-02-07 20:38:44.035', '2026-02-07 20:38:44.035');

-- Copiando estrutura para tabela jlr_beauty.unit
DROP TABLE IF EXISTS `unit`;
CREATE TABLE IF NOT EXISTS `unit` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.unit: ~2 rows (aproximadamente)
INSERT INTO `unit` (`id`, `name`, `address`, `createdAt`, `updatedAt`) VALUES
	(1, 'Parque da Cidade', 'Av. das Nações, 1000', '2026-01-30 21:22:05.299', '2026-01-30 21:22:05.299'),
	(2, 'Birmann 20', 'Rua Birmann, 20', '2026-01-30 21:22:05.299', '2026-01-30 21:22:05.299');

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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copiando dados para a tabela jlr_beauty.user: ~3 rows (aproximadamente)
INSERT INTO `user` (`id`, `name`, `email`, `phone`, `role`, `passwordHash`, `createdAt`, `updatedAt`, `phone2`, `city`, `neighborhood`, `avatarUrl`, `status`, `emailVerified`, `rating`, `lastAccessAt`) VALUES
	(1, 'Jeiel de Oliveira Borner', 'jeiel.borner@gmail.com', '1108765-3425', 'MASTER', '$2b$10$SBmWRicQkgg8IQf1fwuzL.PNH6CCmPxERTxTMj5E6FRBsuHBNKBqe', '2026-01-29 22:42:13.202', '2026-02-06 20:33:13.826', '11088887777', 'Barueri', 'Jardim Esperança', 'http://localhost:3001/uploads/avatarjb-1769808840178-238814620.jpg', 'ACTIVE', 0, 1, '2026-02-06 20:33:13.821'),
	(2, 'Abimeleque Saduceu', 'jeielborner5@gmail.com', NULL, 'CLIENT', '$2b$10$1kyvsLttfheOtu6LKaV2Vu3TNsqDNN571jnPJJ.wlcf8lXaOoiBAu', '2026-01-30 18:45:04.814', '2026-02-07 05:17:28.980', NULL, 'Lutécia', 'Centro', 'http://localhost:3001/uploads/visao3-1770441445025-134819187.jfif', 'ACTIVE', 0, NULL, NULL),
	(3, 'admin', 'admin@jlrbeauty.com', NULL, 'ADMIN', '$2b$10$TcCrumS8uPj8wziIIAVjZu9RUYm39ftl997mBTP4T/2qFVfIGl9MO', '2026-01-30 21:22:05.181', '2026-02-07 23:08:38.676', NULL, NULL, NULL, NULL, 'ACTIVE', 0, NULL, '2026-02-07 23:08:38.673');

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

-- Copiando dados para a tabela jlr_beauty._prisma_migrations: ~5 rows (aproximadamente)
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
	('33018121-d346-4559-89f4-30ff1e95de28', 'aa9591915cd9df016af55ba5278199da10afd2cf557bb8af82a35b0efd340f9f', '2026-01-30 21:18:56.361', '20260130211855_split_product_service_catalog', NULL, NULL, '2026-01-30 21:18:55.764', 1),
	('3d104124-33b0-43e8-b7fe-ecd591cb6a72', '7b1f30a7ba0294eea8fb655d0739e0360a1d0be1cfaa861a93f8dc7fbcb9e908', '2026-01-30 06:57:49.817', '20260130000200_extend_user_profile', NULL, NULL, '2026-01-30 06:57:49.664', 1),
	('896fec2c-6cb6-463b-9f37-c9a7467f185e', 'f1c14b2ea2744e365bd5d5add15a16c45b8429212fb764304ae70be5e61da5c8', '2026-02-04 00:00:42.521', '20260204000042_add_service_orderitems_appointment_order', NULL, NULL, '2026-02-04 00:00:42.257', 1),
	('96390fe5-d69f-4691-b0f7-38478f896d0a', '19b0e5f8c8259e756ca2894eb8a6096d2fbe8505df0f605dad085f9ccba4602a', '2026-01-28 04:07:31.296', '20260128040729_init', NULL, NULL, '2026-01-28 04:07:29.337', 1),
	('ac5ddd5d-8d73-49e5-a940-5eb3cce1bd14', '170af8423871fc02a0ae2cea6401a93d8e7bee07f39a6d234f63531e243beb53', '2026-01-30 03:36:26.699', '20260130000100_add_master_role', NULL, NULL, '2026-01-30 03:36:26.602', 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

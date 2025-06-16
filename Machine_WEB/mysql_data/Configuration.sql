-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: May 10, 2025 at 07:24 AM
-- Server version: 8.3.0
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `Configuration`
--

-- --------------------------------------------------------

--
-- Table structure for table `Camera`
--

CREATE TABLE `Camera` (
  `id_cam` int NOT NULL,
  `IP` varchar(15) NOT NULL,
  `login` varchar(255) NOT NULL,
  `mdp` varchar(255) NOT NULL,
  `nom_cam` varchar(255) NOT NULL,
  `emplacement` varchar(255) NOT NULL,
  `adresse_MAC` varchar(17) NOT NULL,
  `adresse_flux_principal` varchar(255) NOT NULL,
  `flux_principal_active` tinyint(1) DEFAULT '1',
  `adresse_flux_secondaire` varchar(255) DEFAULT NULL,
  `flux_secondaire_active` tinyint(1) DEFAULT '0',
  `adresse_flux_tertiaire` varchar(255) DEFAULT NULL,
  `flux_tertiaire_active` tinyint(1) DEFAULT '0',
  `port_video` int DEFAULT '554',
  `is_active` tinyint(1) DEFAULT '1',
  `id_hist_cam` int NOT NULL,
  `id_caracteristique` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Camera`
--

INSERT INTO `Camera` (`id_cam`, `IP`, `login`, `mdp`, `nom_cam`, `emplacement`, `adresse_MAC`, `adresse_flux_principal`, `flux_principal_active`, `adresse_flux_secondaire`, `flux_secondaire_active`, `adresse_flux_tertiaire`, `flux_tertiaire_active`, `port_video`, `is_active`, `id_hist_cam`, `id_caracteristique`) VALUES
(7, '192.168.1.155', 'root', 'root', 'Video Entree', 'Bureau', '00:11:22:33:44:55', 'rtsp://user@admin:173.200.91.70/Streaming', 1, NULL, 0, NULL, 0, 554, 1, 27, 8),
(8, '192.168.1.156', 'user', 'admin', 'Video Sortie ', 'salle 1', '5E:FF:56:A2:AF:15', 'rtsp://user@admin:173.200.91.70/Streaming', 1, NULL, 0, NULL, 0, 554, 1, 22, 9),
(9, '192.168.1.155', 'root', 'demo1234', 'Face UPS', 'Breau', '00:11:22:33:44:55', 'rtsp://root:demo1234@192.168.1.155/live1s1.sdp', 1, NULL, 0, NULL, 0, 554, 1, 28, 10),
(10, '192.168.1.155', 'root', 'demo1234', 'Face UPS2', 'Bureau', '00:11:22:33:44:55', 'rtsp://root:demo1234@192.168.1.155/live1s2.sdp', 1, NULL, 0, NULL, 0, 554, 1, 30, 11);

-- --------------------------------------------------------

--
-- Table structure for table `Camera_Detection`
--

CREATE TABLE `Camera_Detection` (
  `id_cam` int NOT NULL,
  `id_detection` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Caracteristique_Camera`
--

CREATE TABLE `Caracteristique_Camera` (
  `id_caracteristique` int NOT NULL,
  `marque` varchar(255) NOT NULL,
  `modele` varchar(255) NOT NULL,
  `mode_vision` varchar(255) NOT NULL,
  `image_par_sec` int NOT NULL,
  `codec_video` varchar(50) DEFAULT 'H.264'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Caracteristique_Camera`
--

INSERT INTO `Caracteristique_Camera` (`id_caracteristique`, `marque`, `modele`, `mode_vision`, `image_par_sec`, `codec_video`) VALUES
(8, 'Vivotek', '8392', 'Normal', 30, 'H.264'),
(9, 'vivotek', '8392', 'jour', 30, 'H.264'),
(10, 'Vivotek', '8392', 'Normale', 30, 'H.264'),
(11, 'Vivotek', '8392', 'jour', 30, 'H.264');

-- --------------------------------------------------------

--
-- Table structure for table `Configuration_IA`
--

CREATE TABLE `Configuration_IA` (
  `id_config` int NOT NULL,
  `id_cam` int NOT NULL,
  `id_modele_visage` int DEFAULT NULL,
  `id_modele_personne` int DEFAULT NULL,
  `id_modele_anomalie` int DEFAULT NULL,
  `seuil_visage` decimal(3,2) DEFAULT '0.70',
  `seuil_personne` decimal(3,2) DEFAULT '0.60',
  `seuil_anomalie` decimal(3,2) DEFAULT '0.50',
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Detection`
--

CREATE TABLE `Detection` (
  `id_detection` int NOT NULL,
  `timestamp` datetime NOT NULL,
  `type_detection` varchar(50) NOT NULL,
  `confiance` decimal(3,2) DEFAULT NULL,
  `coordonnees` text,
  `id_modele` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Detection`
--

INSERT INTO `Detection` (`id_detection`, `timestamp`, `type_detection`, `confiance`, `coordonnees`, `id_modele`) VALUES
(1, '2025-04-06 10:23:07', 'Visage', 0.92, '{\"x1\": 0.2, \"y1\": 0.3, \"x2\": 0.4, \"y2\": 0.5}', 1);

-- --------------------------------------------------------

--
-- Table structure for table `Detection_Anomalie`
--

CREATE TABLE `Detection_Anomalie` (
  `id_anomalie` int NOT NULL,
  `nom_anomalie` varchar(255) NOT NULL,
  `niveau_alerte` int DEFAULT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Detection_Personne`
--

CREATE TABLE `Detection_Personne` (
  `id_personne_detectee` int NOT NULL,
  `nombre_personnes` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Detection_Visage`
--

CREATE TABLE `Detection_Visage` (
  `id_visage` int NOT NULL,
  `visage_reconnu` tinyint(1) NOT NULL,
  `id_personne` int DEFAULT NULL,
  `embeddings` longblob
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Detection_Visage`
--

INSERT INTO `Detection_Visage` (`id_visage`, `visage_reconnu`, `id_personne`, `embeddings`) VALUES
(1, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `GPU_Camera_Associations`
--

CREATE TABLE `GPU_Camera_Associations` (
  `id_association` int NOT NULL,
  `id_gpu` int NOT NULL,
  `id_camera` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `GPU_Camera_Associations`
--

INSERT INTO `GPU_Camera_Associations` (`id_association`, `id_gpu`, `id_camera`, `created_at`) VALUES
(4, 4, 7, '2025-05-02 15:13:53');

-- --------------------------------------------------------

--
-- Table structure for table `GPU_Processors`
--

CREATE TABLE `GPU_Processors` (
  `id_gpu` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` enum('actif','inactif') NOT NULL DEFAULT 'actif',
  `ip_address` varchar(15) DEFAULT NULL,
  `login` varchar(50) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `GPU_Processors`
--

INSERT INTO `GPU_Processors` (`id_gpu`, `name`, `status`, `ip_address`, `login`, `password`, `created_at`, `updated_at`) VALUES
(4, 'Bureau', 'actif', '192/168.1.153', 'admin', 'admin', '2025-05-02 15:13:52', '2025-05-02 15:13:52');

-- --------------------------------------------------------

--
-- Table structure for table `Historique_Cam`
--

CREATE TABLE `Historique_Cam` (
  `id_hist_cam` int NOT NULL,
  `date_modif` date NOT NULL,
  `champ_modifie` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Historique_Cam`
--

INSERT INTO `Historique_Cam` (`id_hist_cam`, `date_modif`, `champ_modifie`) VALUES
(1, '2025-04-06', 'Initial Creation'),
(2, '2025-04-06', 'Camera Creation'),
(3, '2025-04-07', 'Camera Creation'),
(4, '2025-04-07', 'Modification of camera 3'),
(5, '2025-04-08', 'Camera Creation'),
(6, '2025-04-08', 'Modification of camera 1'),
(7, '2025-04-08', 'Modification of camera 1'),
(9, '2025-04-08', 'Modification of camera 1'),
(10, '2025-04-08', 'Camera Creation'),
(11, '2025-04-08', 'Modification of camera 5'),
(12, '2025-04-08', 'Camera Creation'),
(13, '2025-04-09', 'Modification of camera 2'),
(14, '2025-04-09', 'Modification of camera 4'),
(15, '2025-04-18', 'Modification of camera 1'),
(16, '2025-04-18', 'Modification of camera 1'),
(17, '2025-05-02', 'Modification of camera 2'),
(18, '2025-05-02', 'Modification of camera 2'),
(19, '2025-05-02', 'Camera Creation'),
(20, '2025-05-02', 'Modification of camera 7'),
(21, '2025-05-03', 'Modification of camera 7'),
(22, '2025-05-03', 'Camera Creation'),
(23, '2025-05-03', 'Camera Creation'),
(24, '2025-05-05', 'Modification of camera 9'),
(25, '2025-05-05', 'Modification of camera 9'),
(27, '2025-05-05', 'Modification of camera 7'),
(28, '2025-05-05', 'Modification of camera 9'),
(29, '2025-05-05', 'Camera Creation'),
(30, '2025-05-05', 'Modification of camera 10');

-- --------------------------------------------------------

--
-- Table structure for table `Historique_Personne`
--

CREATE TABLE `Historique_Personne` (
  `id_hist_pers` int NOT NULL,
  `date_modif` date NOT NULL,
  `champ_modifie` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Historique_Personne`
--

INSERT INTO `Historique_Personne` (`id_hist_pers`, `date_modif`, `champ_modifie`) VALUES
(1, '2025-04-06', 'Initial Creation'),
(2, '2025-04-06', 'Person Creation'),
(3, '2025-05-07', 'Person 3 deleted'),
(4, '2025-04-07', 'Person Creation'),
(5, '2025-04-19', 'Person 4 deleted'),
(6, '2025-05-07', 'Person 2 deleted'),
(7, '2025-04-08', 'Person Creation'),
(8, '2025-04-08', 'Person 6 deleted'),
(9, '2025-04-08', 'Person Creation'),
(10, '2025-04-08', 'Person 7 deleted'),
(11, '2025-04-15', 'Person 5 deleted'),
(12, '2025-05-07', 'Person 1 deleted'),
(14, '2025-05-07', 'Person 8 deleted'),
(15, '2025-05-07', 'Person Creation'),
(16, '2025-05-07', 'Person Creation'),
(17, '2025-05-07', 'Update person 9'),
(18, '2025-05-07', 'Update person 9'),
(19, '2025-05-07', 'Update person 9'),
(20, '2025-05-07', 'Person 9 deleted'),
(21, '2025-05-07', 'Update person 10'),
(22, '2025-05-07', 'Update person 10'),
(23, '2025-05-07', 'Person 10 deleted'),
(24, '2025-05-07', 'Person 11 deleted'),
(25, '2025-05-07', 'Person 12 deleted'),
(30, '2025-05-07', 'Person Creation'),
(31, '2025-05-07', 'Update person 13'),
(32, '2025-05-07', 'Update person 13'),
(33, '2025-05-07', 'Update person 13'),
(34, '2025-05-07', 'Update person 13'),
(35, '2025-05-07', 'Update person 13'),
(36, '2025-05-07', 'Update person 13'),
(37, '2025-05-07', 'Update person 13'),
(38, '2025-05-07', 'Update person 13'),
(39, '2025-05-07', 'Update person 13'),
(40, '2025-05-07', 'Update person 13'),
(41, '2025-05-07', 'Update person 13'),
(42, '2025-05-07', 'Update person 13'),
(43, '2025-05-07', 'Update person 13'),
(44, '2025-05-07', 'Update person 13'),
(46, '2025-05-07', 'Update person 13'),
(47, '2025-05-07', 'Update person 13'),
(48, '2025-05-07', 'Update person 13'),
(49, '2025-05-07', 'Update person 13'),
(50, '2025-05-07', 'Update person 13'),
(51, '2025-05-07', 'Update person 13'),
(52, '2025-05-07', 'Update person 13'),
(54, '2025-05-07', 'Person Creation'),
(55, '2025-05-07', 'Person 15 deleted'),
(56, '2025-05-07', 'Update person 13'),
(57, '2025-05-07', 'Update person 13'),
(58, '2025-05-07', 'Update person 13'),
(59, '2025-05-07', 'Update person 13'),
(60, '2025-05-07', 'Update person 13'),
(61, '2025-05-07', 'Person 14 deleted'),
(62, '2025-05-07', 'Person Creation'),
(63, '2025-05-07', 'Update person 16'),
(64, '2025-05-07', 'Update person 16'),
(65, '2025-05-07', 'Update person 16'),
(66, '2025-05-08', 'Person 16 deleted'),
(67, '2025-05-08', 'Person 13 deleted'),
(68, '2025-05-08', 'Person Creation'),
(69, '2025-05-08', 'Update person 17'),
(70, '2025-05-08', 'Update person 17'),
(71, '2025-05-08', 'Person 17 deleted'),
(72, '2025-05-08', 'Person 18 deleted'),
(73, '2025-05-08', 'Person 19 deleted'),
(74, '2025-05-08', 'Person Creation'),
(75, '2025-05-08', 'Update person 20'),
(76, '2025-05-08', 'Update person 20'),
(77, '2025-05-08', 'Person 20 deleted'),
(78, '2025-05-08', 'Person 21 deleted'),
(79, '2025-05-08', 'Person 22 deleted'),
(80, '2025-05-08', 'Person Creation'),
(81, '2025-05-08', 'Person Creation'),
(82, '2025-05-08', 'Update person 23'),
(83, '2025-05-09', 'Person 24 deleted'),
(84, '2025-05-08', 'Suppression photo principale personne 23'),
(85, '2025-05-08', 'Update person 23'),
(86, '2025-05-08', 'Suppression photo principale personne 23'),
(87, '2025-05-08', 'Update person 23'),
(88, '2025-05-08', 'Update person 23'),
(89, '2025-05-08', 'Update person 23'),
(90, '2025-05-08', 'Update person 23'),
(91, '2025-05-08', 'Update person 23'),
(92, '2025-05-08', 'Update person 23'),
(93, '2025-05-08', 'Update person 23'),
(94, '2025-05-08', 'Update person 23'),
(95, '2025-05-08', 'Person Creation'),
(96, '2025-05-08', 'Update person 25'),
(97, '2025-05-09', 'Person 25 deleted'),
(98, '2025-05-09', 'Person 26 deleted'),
(99, '2025-05-08', 'Update person 23'),
(100, '2025-05-08', 'Update person 23'),
(101, '2025-05-09', 'Person 23 deleted'),
(102, '2025-05-09', 'Person Creation'),
(103, '2025-05-09', 'Person 27 deleted'),
(104, '2025-05-09', 'Person 28 deleted'),
(105, '2025-05-09', 'Person 29 deleted'),
(106, '2025-05-09', 'Person Creation'),
(107, '2025-05-09', 'Update person 30'),
(108, '2025-05-09', 'Update person 30'),
(109, '2025-05-09', 'Update person 30'),
(110, '2025-05-09', 'Ajout photo principale personne 30'),
(111, '2025-05-09', 'Update person 30'),
(112, '2025-05-09', 'Person Creation'),
(113, '2025-05-09', 'Update person 31'),
(114, '2025-05-09', 'Person Creation'),
(115, '2025-05-09', 'Update person 32'),
(116, '2025-05-09', 'Person 33 deleted'),
(117, '2025-05-09', 'Person 34 deleted'),
(118, '2025-05-09', 'Person 35 deleted'),
(119, '2025-05-09', 'Person 36 deleted'),
(120, '2025-05-09', 'Person 37 deleted'),
(121, '2025-05-09', 'Person 38 deleted'),
(122, '2025-05-09', 'Person 39 deleted'),
(123, '2025-05-09', 'Person 40 deleted'),
(124, '2025-05-09', 'Person 41 deleted'),
(125, '2025-05-09', 'Person 42 deleted'),
(126, '2025-05-09', 'Person 43 deleted'),
(127, '2025-05-09', 'Person 44 deleted');

-- --------------------------------------------------------

--
-- Table structure for table `Logs_IA`
--

CREATE TABLE `Logs_IA` (
  `id_log` int NOT NULL,
  `timestamp` datetime NOT NULL,
  `type_evenement` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `id_cam` int DEFAULT NULL,
  `id_modele` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Modele_IA`
--

CREATE TABLE `Modele_IA` (
  `id_modele` int NOT NULL,
  `nom` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `version` varchar(50) NOT NULL,
  `chemin_modele` varchar(255) NOT NULL,
  `date_entrainement` date NOT NULL,
  `precision` decimal(5,2) DEFAULT NULL,
  `seuil_confiance` decimal(3,2) DEFAULT '0.70',
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Modele_IA`
--

INSERT INTO `Modele_IA` (`id_modele`, `nom`, `type`, `version`, `chemin_modele`, `date_entrainement`, `precision`, `seuil_confiance`, `is_active`) VALUES
(1, 'FaceRecognition', 'Visage', '1.0', '/models/face_model_v1.pt', '2025-04-06', 95.50, 0.75, 1);

-- --------------------------------------------------------

--
-- Table structure for table `Personne`
--

CREATE TABLE `Personne` (
  `id_personne` int NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `sexe` varchar(10) NOT NULL,
  `role` varchar(255) NOT NULL,
  `niveau_autorisation` varchar(255) NOT NULL,
  `autorisation` varchar(3) NOT NULL DEFAULT 'Non',
  `zones_acces` text NOT NULL,
  `date_naissance` date NOT NULL,
  `plage_horaire_debut` time DEFAULT NULL,
  `plage_horaire_fin` time DEFAULT NULL,
  `badge_actif` tinyint(1) DEFAULT '0',
  `jours_acces` varchar(255) DEFAULT NULL,
  `limite_acces_jours` tinyint(1) DEFAULT '0',
  `id_hist_pers` int NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `Personne`
--

INSERT INTO `Personne` (`id_personne`, `nom`, `prenom`, `sexe`, `role`, `niveau_autorisation`, `autorisation`, `zones_acces`, `date_naissance`, `plage_horaire_debut`, `plage_horaire_fin`, `badge_actif`, `jours_acces`, `limite_acces_jours`, `id_hist_pers`, `photo_url`) VALUES
(30, 'medjbeur', 'yacine', 'Homme', 'Visiteur', 'Aucun', 'Non', 'Laboratoires', '2025-05-29', NULL, NULL, 0, '7/7', 0, 111, 'photo_1746785212.jpg'),
(31, 'bbbbb', 'aaaaa', 'Homme', 'Visiteur', 'Aucun', 'Oui', 'Bureaux administratifs', '2025-05-05', NULL, NULL, 1, '7/7', 0, 113, 'photo_1746799130.jpg'),
(32, 'jisfhbs', 'sgdfbsg', 'Homme', 'Visiteur', 'Aucun', 'Non', 'Entrée principale,Bureaux administratifs', '2025-05-26', NULL, NULL, 0, '7/7', 0, 115, 'photo_1746801814.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `Statistiques_Detection`
--

CREATE TABLE `Statistiques_Detection` (
  `id_stat` int NOT NULL,
  `date` date NOT NULL,
  `type_detection` varchar(50) NOT NULL,
  `nombre_detections` int DEFAULT '0',
  `taux_reussite` decimal(5,2) DEFAULT NULL,
  `id_modele` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `Camera`
--
ALTER TABLE `Camera`
  ADD PRIMARY KEY (`id_cam`),
  ADD KEY `id_hist_cam` (`id_hist_cam`),
  ADD KEY `id_caracteristique` (`id_caracteristique`);

--
-- Indexes for table `Camera_Detection`
--
ALTER TABLE `Camera_Detection`
  ADD PRIMARY KEY (`id_cam`,`id_detection`),
  ADD KEY `id_detection` (`id_detection`);

--
-- Indexes for table `Caracteristique_Camera`
--
ALTER TABLE `Caracteristique_Camera`
  ADD PRIMARY KEY (`id_caracteristique`);

--
-- Indexes for table `Configuration_IA`
--
ALTER TABLE `Configuration_IA`
  ADD PRIMARY KEY (`id_config`),
  ADD KEY `id_cam` (`id_cam`),
  ADD KEY `id_modele_visage` (`id_modele_visage`),
  ADD KEY `id_modele_personne` (`id_modele_personne`),
  ADD KEY `id_modele_anomalie` (`id_modele_anomalie`);

--
-- Indexes for table `Detection`
--
ALTER TABLE `Detection`
  ADD PRIMARY KEY (`id_detection`),
  ADD KEY `id_modele` (`id_modele`);

--
-- Indexes for table `Detection_Anomalie`
--
ALTER TABLE `Detection_Anomalie`
  ADD PRIMARY KEY (`id_anomalie`);

--
-- Indexes for table `Detection_Personne`
--
ALTER TABLE `Detection_Personne`
  ADD PRIMARY KEY (`id_personne_detectee`);

--
-- Indexes for table `Detection_Visage`
--
ALTER TABLE `Detection_Visage`
  ADD PRIMARY KEY (`id_visage`),
  ADD KEY `id_personne` (`id_personne`);

--
-- Indexes for table `GPU_Camera_Associations`
--
ALTER TABLE `GPU_Camera_Associations`
  ADD PRIMARY KEY (`id_association`),
  ADD UNIQUE KEY `unique_gpu_camera` (`id_gpu`,`id_camera`),
  ADD KEY `id_camera` (`id_camera`);

--
-- Indexes for table `GPU_Processors`
--
ALTER TABLE `GPU_Processors`
  ADD PRIMARY KEY (`id_gpu`);

--
-- Indexes for table `Historique_Cam`
--
ALTER TABLE `Historique_Cam`
  ADD PRIMARY KEY (`id_hist_cam`);

--
-- Indexes for table `Historique_Personne`
--
ALTER TABLE `Historique_Personne`
  ADD PRIMARY KEY (`id_hist_pers`);

--
-- Indexes for table `Logs_IA`
--
ALTER TABLE `Logs_IA`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `id_cam` (`id_cam`),
  ADD KEY `id_modele` (`id_modele`);

--
-- Indexes for table `Modele_IA`
--
ALTER TABLE `Modele_IA`
  ADD PRIMARY KEY (`id_modele`),
  ADD UNIQUE KEY `nom` (`nom`);

--
-- Indexes for table `Personne`
--
ALTER TABLE `Personne`
  ADD PRIMARY KEY (`id_personne`),
  ADD KEY `id_hist_pers` (`id_hist_pers`);

--
-- Indexes for table `Statistiques_Detection`
--
ALTER TABLE `Statistiques_Detection`
  ADD PRIMARY KEY (`id_stat`),
  ADD KEY `id_modele` (`id_modele`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `Camera`
--
ALTER TABLE `Camera`
  MODIFY `id_cam` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `Caracteristique_Camera`
--
ALTER TABLE `Caracteristique_Camera`
  MODIFY `id_caracteristique` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `Configuration_IA`
--
ALTER TABLE `Configuration_IA`
  MODIFY `id_config` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Detection`
--
ALTER TABLE `Detection`
  MODIFY `id_detection` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `GPU_Camera_Associations`
--
ALTER TABLE `GPU_Camera_Associations`
  MODIFY `id_association` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `GPU_Processors`
--
ALTER TABLE `GPU_Processors`
  MODIFY `id_gpu` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Historique_Cam`
--
ALTER TABLE `Historique_Cam`
  MODIFY `id_hist_cam` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `Historique_Personne`
--
ALTER TABLE `Historique_Personne`
  MODIFY `id_hist_pers` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=128;

--
-- AUTO_INCREMENT for table `Logs_IA`
--
ALTER TABLE `Logs_IA`
  MODIFY `id_log` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Modele_IA`
--
ALTER TABLE `Modele_IA`
  MODIFY `id_modele` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Personne`
--
ALTER TABLE `Personne`
  MODIFY `id_personne` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `Statistiques_Detection`
--
ALTER TABLE `Statistiques_Detection`
  MODIFY `id_stat` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Camera`
--
ALTER TABLE `Camera`
  ADD CONSTRAINT `Camera_ibfk_1` FOREIGN KEY (`id_hist_cam`) REFERENCES `Historique_Cam` (`id_hist_cam`),
  ADD CONSTRAINT `Camera_ibfk_2` FOREIGN KEY (`id_caracteristique`) REFERENCES `Caracteristique_Camera` (`id_caracteristique`);

--
-- Constraints for table `Camera_Detection`
--
ALTER TABLE `Camera_Detection`
  ADD CONSTRAINT `Camera_Detection_ibfk_1` FOREIGN KEY (`id_cam`) REFERENCES `Camera` (`id_cam`),
  ADD CONSTRAINT `Camera_Detection_ibfk_2` FOREIGN KEY (`id_detection`) REFERENCES `Detection` (`id_detection`);

--
-- Constraints for table `Configuration_IA`
--
ALTER TABLE `Configuration_IA`
  ADD CONSTRAINT `Configuration_IA_ibfk_1` FOREIGN KEY (`id_cam`) REFERENCES `Camera` (`id_cam`),
  ADD CONSTRAINT `Configuration_IA_ibfk_2` FOREIGN KEY (`id_modele_visage`) REFERENCES `Modele_IA` (`id_modele`),
  ADD CONSTRAINT `Configuration_IA_ibfk_3` FOREIGN KEY (`id_modele_personne`) REFERENCES `Modele_IA` (`id_modele`),
  ADD CONSTRAINT `Configuration_IA_ibfk_4` FOREIGN KEY (`id_modele_anomalie`) REFERENCES `Modele_IA` (`id_modele`);

--
-- Constraints for table `Detection`
--
ALTER TABLE `Detection`
  ADD CONSTRAINT `Detection_ibfk_1` FOREIGN KEY (`id_modele`) REFERENCES `Modele_IA` (`id_modele`);

--
-- Constraints for table `Detection_Anomalie`
--
ALTER TABLE `Detection_Anomalie`
  ADD CONSTRAINT `Detection_Anomalie_ibfk_1` FOREIGN KEY (`id_anomalie`) REFERENCES `Detection` (`id_detection`);

--
-- Constraints for table `Detection_Personne`
--
ALTER TABLE `Detection_Personne`
  ADD CONSTRAINT `Detection_Personne_ibfk_1` FOREIGN KEY (`id_personne_detectee`) REFERENCES `Detection` (`id_detection`);

--
-- Constraints for table `Detection_Visage`
--
ALTER TABLE `Detection_Visage`
  ADD CONSTRAINT `Detection_Visage_ibfk_1` FOREIGN KEY (`id_personne`) REFERENCES `Personne` (`id_personne`),
  ADD CONSTRAINT `Detection_Visage_ibfk_2` FOREIGN KEY (`id_visage`) REFERENCES `Detection` (`id_detection`);

--
-- Constraints for table `GPU_Camera_Associations`
--
ALTER TABLE `GPU_Camera_Associations`
  ADD CONSTRAINT `GPU_Camera_Associations_ibfk_1` FOREIGN KEY (`id_gpu`) REFERENCES `GPU_Processors` (`id_gpu`) ON DELETE CASCADE,
  ADD CONSTRAINT `GPU_Camera_Associations_ibfk_2` FOREIGN KEY (`id_camera`) REFERENCES `Camera` (`id_cam`) ON DELETE CASCADE;

--
-- Constraints for table `Logs_IA`
--
ALTER TABLE `Logs_IA`
  ADD CONSTRAINT `Logs_IA_ibfk_1` FOREIGN KEY (`id_cam`) REFERENCES `Camera` (`id_cam`),
  ADD CONSTRAINT `Logs_IA_ibfk_2` FOREIGN KEY (`id_modele`) REFERENCES `Modele_IA` (`id_modele`);

--
-- Constraints for table `Personne`
--
ALTER TABLE `Personne`
  ADD CONSTRAINT `Personne_ibfk_1` FOREIGN KEY (`id_hist_pers`) REFERENCES `Historique_Personne` (`id_hist_pers`);

--
-- Constraints for table `Statistiques_Detection`
--
ALTER TABLE `Statistiques_Detection`
  ADD CONSTRAINT `Statistiques_Detection_ibfk_1` FOREIGN KEY (`id_modele`) REFERENCES `Modele_IA` (`id_modele`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

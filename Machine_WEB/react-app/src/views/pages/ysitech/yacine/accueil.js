// import React, { useState, useEffect, useRef } from 'react';  // Ajoutez useRef
// import { 
//   Box, 
//   Typography, 
//   AppBar, 
//   Toolbar, 
//   Container, 
//   Paper, 
//   Grid, 
//   Chip,
//   useMediaQuery,
//   useTheme,
//   FormControl,
//   MenuItem,
//   Select,
//   InputLabel,
//   IconButton,
//   Tooltip
// } from '@mui/material';
// import PersonIcon from '@mui/icons-material/Person';
// import LoginIcon from '@mui/icons-material/Login';
// import LogoutIcon from '@mui/icons-material/Logout';
// import AccessTimeIcon from '@mui/icons-material/AccessTime';
// import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
// import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
// import CameraAltIcon from '@mui/icons-material/CameraAlt';
// import MemoryIcon from '@mui/icons-material/Memory';
// import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
// import LockIcon from '@mui/icons-material/Lock';
// import LockOpenIcon from '@mui/icons-material/LockOpen';
// import Hls from 'hls.js';  // Ajoutez l'import de Hls.js



// export default function DataCenterSecurityPage() {
//   const [countData, setCountData] = useState({ 
//     entrances: 0, 
//     sorties: 0,
//     current_inside: 0 
//   });
//   const [alerts, setAlerts] = useState([]);
//   const [currentTime, setCurrentTime] = useState('');
//   const [streamUrl, setStreamUrl] = useState('/api/tracking_entree');
//   const [cameraInfo, setCameraInfo] = useState({
//     nom_cam: "Caméra entrée test"
//   });
//   const [gpuInfo, setGpuInfo] = useState({
//     id_gpu: null,
//     name: "Chargement...",
//     model: "",
//     capacity: ""
//   });
//   const [availableCameras, setAvailableCameras] = useState([]);
//   const [cameras, setCameras] = useState([]);
//   const [selectedCamera, setSelectedCamera] = useState(null);
  
//   // Nouveau state pour les flux disponibles depuis l'API
//   const [availableFlux, setAvailableFlux] = useState([]);
//   const [selectedFlux, setSelectedFlux] = useState('');
  
//   // State pour gérer le verrouillage
//   const [lockMode, setLockMode] = useState('camera'); // 'camera' ou 'flux'

//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
//   const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

//   // Fonction utilitaire pour ajouter des alertes
//   const addAlert = (message, level = 'info') => {
//     const newAlert = {
//       id: Date.now(),
//       message,
//       level,
//       time: new Date().toLocaleTimeString()
//     };
//     setAlerts(prev => [newAlert, ...prev].slice(0, 5));
//   };

//   // Ajoutez ces refs à la liste des states existants
//   const videoRef = useRef(null);
//   const hlsRef = useRef(null);

//   // Récupération de tous les flux disponibles depuis l'API
//   const fetchAvailableFlux = async () => {
//     try {
//       const response = await fetch('/api/playlists');
//       if (!response.ok) throw new Error('Erreur API flux');
      
//       const data = await response.json();
      
//       if (data && data.playlists && data.playlists.length > 0) {
//         // Transformer les données de l'API pour correspondre à notre format
//         const fluxList = data.playlists.map(stream => ({
//           id: stream.name,
//           name: stream.name,
//           url: `/api/hls/${stream.content_type}/${stream.name}/playlist.m3u8`,
//           content_type: stream.content_type,
//           description: `${stream.segment_count} segments`,
//           isActive: true,
//           segment_count: stream.segment_count
//         }));
        
//         setAvailableFlux(fluxList);
        
//         // Sélectionner par défaut le premier flux
//         const defaultFlux = fluxList[0];
//         setSelectedFlux(defaultFlux.id);
        
//         addAlert(`${fluxList.length} flux disponibles chargés`, 'info');
//       } else {
//         // Utiliser des valeurs par défaut si aucun flux n'est disponible
//         setAvailableFlux([
//           { id: 'flux1', name: 'Flux principal par défaut', url: '/api/video_entree' }
//         ]);
//         setSelectedFlux('flux1');
//       }
//     } catch (error) {
//       console.error("Erreur lors de la récupération des flux:", error);
//       // Conserver les valeurs par défaut en cas d'erreur
//       setAvailableFlux([
//         { id: 'flux1', name: 'Flux principal par défaut', url: '/api/video_entree' }
//       ]);
//       setSelectedFlux('flux1');
//       addAlert('Erreur de chargement des flux', 'error');
//     }
//   };

//   // Initialiser le lecteur HLS
//   const initHlsPlayer = (streamUrl) => {
//     if (!videoRef.current) return;
    
//     destroyHlsPlayer(); // Nettoyer tout lecteur existant d'abord
    
//     if (Hls.isSupported()) {
//       const hls = new Hls();
//       hlsRef.current = hls;
      
//       hls.loadSource(streamUrl);
//       hls.attachMedia(videoRef.current);
      
//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         videoRef.current.controls = true;
//       });
      
//       hls.on(Hls.Events.ERROR, (event, data) => {
//         if (data.fatal) {
//           switch (data.type) {
//             case Hls.ErrorTypes.NETWORK_ERROR:
//               console.error('Fatal network error encountered, try to recover');
//               hls.startLoad();
//               break;
//             case Hls.ErrorTypes.MEDIA_ERROR:
//               console.error('Fatal media error encountered, try to recover');
//               hls.recoverMediaError();
//               break;
//             default:
//               console.error('Unrecoverable error encountered, destroying player');
//               destroyHlsPlayer();
//               break;
//           }
//         }
//       });
//     } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
//       // Pour Safari
//       videoRef.current.src = streamUrl;
//       videoRef.current.controls = true;
//     }
//   };

//   // Détruire le lecteur HLS
//   const destroyHlsPlayer = () => {
//     if (hlsRef.current) {
//       hlsRef.current.destroy();
//       hlsRef.current = null;
//     }
//     if (videoRef.current) {
//       videoRef.current.removeAttribute('src');
//       videoRef.current.load();
//     }
//   };

//   // Mise à jour de l'heure actuelle
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentTime(new Date().toLocaleTimeString());
//     }, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Récupération des informations GPU associées à une caméra
//   const fetchGpuInfoForCamera = async (cameraId) => {
//   try {
//     // D'abord, récupérer tous les groupes GPU et leurs caméras associées
//     const response = await fetch('/api/gpu-groups/');
//     if (!response.ok) throw new Error('Erreur API GPU');
    
//     const gpuGroups = await response.json();
    
//     // Trouver le GPU associé à la caméra sélectionnée
//     let associatedGpu = null;
//     for (const gpuGroup of gpuGroups) {
//       if (gpuGroup.cameras.includes(cameraId)) {
//         associatedGpu = gpuGroup;
//         break;
//       }
//     }
    
//     if (associatedGpu) {
//       setGpuInfo({
//         id_gpu: associatedGpu.id_gpu,
//         name: associatedGpu.name || "GPU non spécifié",
//         model: associatedGpu.model || "",
//         capacity: associatedGpu.capacity || ""
//       });
//       addAlert(`GPU associé: ${associatedGpu.name}`, 'info');
//     } else {
//       setGpuInfo({
//         id_gpu: null,
//         name: "Aucun GPU associé",
//         model: "",
//         capacity: ""
//       });
//     }
//   } catch (error) {
//     console.error("Erreur lors de la récupération des informations GPU:", error);
//     setGpuInfo({
//       id_gpu: null,
//       name: "Erreur de chargement",
//       model: "",
//       capacity: ""
//     });
//     addAlert('Erreur de chargement des informations GPU', 'error');
//   }
// };



//   // Récupération de toutes les caméras disponibles
//   const fetchAllCameras = async () => {
//     try {
//       const response = await fetch('/api/cameras/');
//       if (!response.ok) {
//         // Si l'API échoue, créer des caméras par défaut pour l'entrée et la sortie
//         const defaultCameras = [
//           {
//             id_cam: "camera_entree",
//             nom_cam: "Caméra entrée",
//             is_active: true,
//             adresse_flux_principal: "/api/video_entree"
//           },
//           {
//             id_cam: "camera_sortie",
//             nom_cam: "Caméra sortie",
//             is_active: true,
//             adresse_flux_principal: "/api/video_sortie"
//           }
//         ];
        
//         setAvailableCameras(defaultCameras);
        
//         // Sélectionner par défaut la caméra d'entrée
//         setSelectedCamera("camera_entree");
//         setCameraInfo({
//           nom_cam: "Caméra entrée"
//         });
        
//         // Configurez l'URL du flux vidéo pour la caméra d'entrée
//         updateStreamUrl(defaultCameras[0], null);
        
//         addAlert(`2 caméras par défaut chargées`, 'info');
//         return;
//       }
      
//       const cameras = await response.json();
      
//       if (cameras && cameras.length > 0) {
//         setAvailableCameras(cameras);
        
//         // Sélectionner par défaut la première caméra active
//         const defaultCamera = cameras.find(camera => camera.is_active) || cameras[0];
//         setSelectedCamera(defaultCamera.id_cam);
        
//         setCameraInfo({
//           nom_cam: defaultCamera.nom_cam
//         });
        
//         // Récupérer les informations GPU pour la caméra par défaut
//         fetchGpuInfoForCamera(defaultCamera.id_cam);
        
//         // Configurez l'URL du flux vidéo en fonction de la caméra sélectionnée
//         updateStreamUrl(defaultCamera, null);
        
//         addAlert(`${cameras.length} caméras disponibles chargées`, 'info');
//       } else {
//         // Utiliser des caméras par défaut pour l'entrée et la sortie
//         const defaultCameras = [
//           {
//             id_cam: "camera_entree",
//             nom_cam: "Caméra entrée",
//             is_active: true,
//             adresse_flux_principal: "/api/video_entree"
//           },
//           {
//             id_cam: "camera_sortie",
//             nom_cam: "Caméra sortie",
//             is_active: true,
//             adresse_flux_principal: "/api/video_sortie"
//           }
//         ];
        
//         setAvailableCameras(defaultCameras);
        
//         // Sélectionner par défaut la caméra d'entrée
//         setSelectedCamera("camera_entree");
//         setCameraInfo({
//           nom_cam: "Caméra entrée"
//         });
        
//         // Configurez l'URL du flux vidéo pour la caméra d'entrée
//         updateStreamUrl(defaultCameras[0], null);
        
//         addAlert(`2 caméras par défaut chargées`, 'info');
//       }
//     } catch (error) {
//       console.error("Erreur lors de la récupération des caméras:", error);
//       // Créer des caméras par défaut pour l'entrée et la sortie en cas d'erreur
//       const defaultCameras = [
//         {
//           id_cam: "camera_entree",
//           nom_cam: "Caméra entrée",
//           is_active: true,
//           adresse_flux_principal: "/api/video_entree"
//         },
//         {
//           id_cam: "camera_sortie",
//           nom_cam: "Caméra sortie",
//           is_active: true,
//           adresse_flux_principal: "/api/video_sortie"
//         }
//       ];
      
//       setAvailableCameras(defaultCameras);
//       setSelectedCamera("camera_entree");
//       setCameraInfo({
//         nom_cam: "Caméra entrée"
//       });
//       updateStreamUrl(defaultCameras[0], null);
      
//       addAlert('Erreur de chargement des caméras - utilisation des caméras par défaut', 'warning');
//     }
//   };

//   // Mise à jour de l'URL du flux vidéo en fonction de la caméra ou du flux sélectionné
//   const updateStreamUrl = (camera, flux) => {
//     if (lockMode === 'camera' && camera) {
//       // Si on est en mode caméra, on utilise l'URL appropriée en fonction de l'ID de la caméra
//       let cameraUrl;
      
//       // Détermine si la caméra doit afficher le flux d'entrée ou de sortie
//       if (camera.id_cam === availableCameras[0]?.id_cam) {
//         // Première caméra -> flux d'entrée
//         cameraUrl = '/api/video_entree';
//       } else if (camera.id_cam === availableCameras[1]?.id_cam) {
//         // Deuxième caméra -> flux de sortie
//         cameraUrl = '/api/video_sortie';
//       } else {
//         // Autres caméras -> flux principal défini ou entrée par défaut
//         cameraUrl = camera.adresse_flux_principal || '/api/video_entree';
//       }
      
//       setStreamUrl(cameraUrl);
//       destroyHlsPlayer(); // On s'assure que le lecteur HLS est désactivé
//     } else if (lockMode === 'flux' && flux) {
//       // Si on est en mode flux, on utilise HLS pour l'élément video
//       setStreamUrl(flux.url);
//       initHlsPlayer(flux.url);
//     }
//   };

//   // Gestion du changement de caméra
//   // Gestion du changement de caméra
//   const handleCameraChange = (event) => {
//     // Ne rien faire si on est en mode verrouillage flux
//     if (lockMode === 'flux') return;
    
//     const cameraId = event.target.value;
//     setSelectedCamera(cameraId);
    
//     const selectedCam = availableCameras.find(camera => camera.id_cam === cameraId);
//     if (selectedCam) {
//       setCameraInfo({
//         nom_cam: selectedCam.nom_cam
//       });
      
//       // Récupérer les informations GPU associées à cette caméra
//       fetchGpuInfoForCamera(cameraId);
      
//       // Mise à jour du flux selon la caméra sélectionnée
//       updateStreamUrl(selectedCam, null);
      
//       // Message d'alerte spécifique pour les caméras d'entrée/sortie
//       let alertMessage = `Caméra changée: ${selectedCam.nom_cam}`;
      
//       if (selectedCam.id_cam === availableCameras[0]?.id_cam) {
//         alertMessage += " - Affichage du flux d'entrée";
//       } else if (selectedCam.id_cam === availableCameras[1]?.id_cam) {
//         alertMessage += " - Affichage du flux de sortie";
//       }
      
//       addAlert(alertMessage, 'info');
//     }
//   };

//   // Gestion du changement de flux
//   const handleFluxChange = (event) => {
//     // Ne rien faire si on est en mode verrouillage caméra
//     if (lockMode === 'camera') return;
    
//     const fluxId = event.target.value;
//     setSelectedFlux(fluxId);
    
//     const selectedF = availableFlux.find(flux => flux.id === fluxId);
//     if (selectedF) {
//       updateStreamUrl(null, selectedF);
//       addAlert(`Flux changé: ${selectedF.name}`, 'info');
//     }
//   };

//   // Bascule entre les modes de verrouillage
//   const toggleLockMode = () => {
//     const newMode = lockMode === 'camera' ? 'flux' : 'camera';
//     setLockMode(newMode);
//     addAlert(`Mode de sélection : ${newMode === 'camera' ? 'Caméra' : 'Flux'}`, 'info');
//   };

//   // Récupération des données du compteur
//   const fetchCounterData = async () => {
//     try {
//       const response = await fetch('/api/compteur');
//       if (!response.ok) throw new Error('Erreur API');
      
//       const data = await response.json();
//       setCountData(prev => {
//         if (prev.entrances !== data.entrances || 
//             prev.sorties !== data.sorties || 
//             prev.current_inside !== data.current_inside) {
//           const newAlert = {
//             id: Date.now(),
//             message: `Mise à jour: ${data.entrances} entrées, ${data.sorties} sorties`,
//             level: 'info',
//             time: new Date().toLocaleTimeString()
//           };
//           setAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 5));
//         }
//         return { 
//           entrances: data.entrances || 0, 
//           sorties: data.sorties || 0,
//           current_inside: data.current_inside || 0
//         };
//       });
//     } catch (error) {
//       addAlert('Erreur de connexion au serveur', 'error');
//     }
//   };

//   // Initialisation et polling
//   useEffect(() => {
//     fetchAllCameras();
//     fetchAvailableFlux(); // Charger les flux depuis l'API
//     fetchCounterData();
    
//     const counterInterval = setInterval(fetchCounterData, 5000);
//     // Rafraîchir les infos caméra et flux toutes les 60 secondes
//     const cameraInterval = setInterval(fetchAllCameras, 60000);
//     const fluxInterval = setInterval(fetchAvailableFlux, 60000);
    
//     return () => {
//       clearInterval(counterInterval);
//       clearInterval(cameraInterval);
//       clearInterval(fluxInterval);
//       destroyHlsPlayer();
//     };
//   }, []);

//   // Mettre à jour l'URL du flux quand le mode de verrouillage change
//   useEffect(() => {
//     if (lockMode === 'camera') {
//       const selectedCam = availableCameras.find(camera => camera.id_cam === selectedCamera);
//       if (selectedCam) {
//         updateStreamUrl(selectedCam, null);
//       }
//     } else {
//       const selectedF = availableFlux.find(flux => flux.id === selectedFlux);
//       if (selectedF) {
//         updateStreamUrl(null, selectedF);
//       }
//     }
//   }, [lockMode]);

//   // Ajoutez cet effet après vos autres useEffect
//   useEffect(() => {
//     // Mettre à jour la source de l'image lorsque streamUrl change et que nous sommes en mode caméra
//     if (lockMode === 'camera') {
//       // La balise img est mise à jour automatiquement via la propriété src du JSX
//       addAlert(`Flux caméra chargé: ${streamUrl.split('/').pop()}`, 'info');
//     }
//   }, [streamUrl, lockMode]);

//   return (
//     <Box sx={{ 
//       display: 'flex', 
//       flexDirection: 'column', 
//       height: '70vh', 
//       bgcolor: 'grey.100',
//       overflow: 'hidden'
//     }}>
//       <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
//         <Toolbar sx={{ minHeight: isMobile ? 48 : 56, px: isMobile ? 1 : 2 }}>
//           <Container maxWidth="xl" sx={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             alignItems: 'center',
//             px: isMobile ? 0 : 2
//           }}>
//             <Typography variant={isMobile ? "subtitle2" : "h6"} component="h1" fontWeight="bold" noWrap>
//               Surveillance Data Center
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <AccessTimeIcon sx={{ mr: 0.5 }} fontSize="small" />
//                 <Typography variant="caption">{currentTime}</Typography>
//               </Box>
//               <Chip 
//                 icon={<FiberManualRecordIcon fontSize="small" />} 
//                 label={isMobile ? "" : "En direct"} 
//                 size="small" 
//                 sx={{ 
//                   bgcolor: 'success.main', 
//                   color: 'white',
//                   '& .MuiChip-icon': { color: 'white' },
//                   height: 24
//                 }} 
//               />
//             </Box>
//           </Container>
//         </Toolbar>
//       </AppBar>

//       <Box sx={{ 
//         display: 'flex', 
//         flexDirection: isMobile || isTablet ? 'column' : 'row',
//         flex: 1, 
//         p: isMobile ? 0.5 : 1, 
//         gap: isMobile ? 0.5 : 1, 
//         overflow: 'hidden',
//         height: 'auto'
//       }}>
//         {/* Conteneur vidéo avec les menus déroulants pour caméras et flux */}
//         <Box sx={{ 
//           flex: isMobile || isTablet ? null : 2,
//           width: '100%',
//           height: isMobile ? '35vh' : isTablet ? '40vh' : '60vh',
//           display: 'flex',
//           flexDirection: 'column',
//           borderRadius: 1,
//           boxShadow: 2,
//           overflow: 'hidden',
//           position: 'relative',
//           minHeight: isMobile ? 200 : 250,
//           maxHeight: '90%',
//         }}>
//           <Box sx={{ 
//             bgcolor: 'primary.dark',
//             p: 1,
//             display: 'flex', 
//             flexDirection: isMobile ? 'column' : 'row',
//             gap: 1
//           }}>
//             {/* Sélecteur de caméra avec indicateur de verrouillage */}
//             <Box sx={{ 
//               display: 'flex', 
//               alignItems: 'center', 
//               flex: 1
//             }}>
//               <FormControl size="small" sx={{ 
//                 flex: 1,
//                 '& .MuiInputBase-root': { 
//                   color: 'white', 
//                   fontSize: '0.85rem',
//                   '& .MuiOutlinedInput-notchedOutline': {
//                     borderColor: lockMode === 'flux' ? 'rgba(255, 80, 80, 0.5)' : 'rgba(255, 255, 255, 0.3)',
//                   },
//                   '&:hover .MuiOutlinedInput-notchedOutline': {
//                     borderColor: lockMode === 'flux' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.5)',
//                   },
//                   '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                     borderColor: lockMode === 'flux' ? 'rgb(255, 80, 80)' : 'white',
//                   },
//                   // Grisé si verrouillé
//                   opacity: lockMode === 'flux' ? 0.6 : 1,
//                 },
//                 '& .MuiInputLabel-root': { 
//                   color: lockMode === 'flux' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.7)',
//                   fontSize: '0.85rem',
//                   '&.Mui-focused': {
//                     color: lockMode === 'flux' ? 'rgb(255, 80, 80)' : 'white'
//                   }
//                 },
//                 '& .MuiSvgIcon-root': {
//                   color: 'white'
//                 }
//               }}>
//                 <InputLabel id="camera-select-label">
//                   Caméra {lockMode === 'flux' && '(verrouillé)'}
//                 </InputLabel>
//                 <Select
//                   labelId="camera-select-label"
//                   id="camera-select"
//                   value={selectedCamera}
//                   label={`Caméra ${lockMode === 'flux' ? '(verrouillé)' : ''}`}
//                   onChange={handleCameraChange}
//                   startAdornment={<CameraAltIcon fontSize="small" sx={{ mr: 1, color: 'white' }} />}
//                   disabled={lockMode === 'flux'}
//                 >
//                   {availableCameras.length > 0 ? (
//                     availableCameras.map(camera => (
//                       <MenuItem key={camera.id_cam} value={camera.id_cam}>
//                         {camera.nom_cam}
//                       </MenuItem>
//                     ))
//                   ) : (
//                     <MenuItem value="default">Caméra par défaut</MenuItem>
//                   )}
//                 </Select>
//               </FormControl>
              
//               {/* Bouton de verrouillage pour les caméras */}
//               <Tooltip title={`Mode actuel : ${lockMode === 'camera' ? 'Sélection de caméra' : 'Sélection de flux'}`}>
//                 <IconButton 
//                   size="small" 
//                   onClick={toggleLockMode}
//                   sx={{ 
//                     ml: 0.5, 
//                     color: 'white',
//                     bgcolor: lockMode === 'camera' ? 'success.main' : 'error.main',
//                     '&:hover': {
//                       bgcolor: lockMode === 'camera' ? 'success.dark' : 'error.dark',
//                     }
//                   }}
//                 >
//                   {lockMode === 'camera' ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
//                 </IconButton>
//               </Tooltip>
//             </Box>
            
//             {/* Sélecteur de flux avec indicateur de verrouillage */}
//             <Box sx={{ 
//               display: 'flex', 
//               alignItems: 'center', 
//               flex: 1
//             }}>
//               <FormControl size="small" sx={{ 
//                 flex: 1,
//                 '& .MuiInputBase-root': { 
//                   color: 'white', 
//                   fontSize: '0.85rem',
//                   '& .MuiOutlinedInput-notchedOutline': {
//                     borderColor: lockMode === 'camera' ? 'rgba(255, 80, 80, 0.5)' : 'rgba(255, 255, 255, 0.3)',
//                   },
//                   '&:hover .MuiOutlinedInput-notchedOutline': {
//                     borderColor: lockMode === 'camera' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.5)',
//                   },
//                   '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
//                     borderColor: lockMode === 'camera' ? 'rgb(255, 80, 80)' : 'white',
//                   },
//                   // Grisé si verrouillé
//                   opacity: lockMode === 'camera' ? 0.6 : 1,
//                 },
//                 '& .MuiInputLabel-root': { 
//                   color: lockMode === 'camera' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.7)',
//                   fontSize: '0.85rem',
//                   '&.Mui-focused': {
//                     color: lockMode === 'camera' ? 'rgb(255, 80, 80)' : 'white'
//                   }
//                 },
//                 '& .MuiSvgIcon-root': {
//                   color: 'white'
//                 }
//               }}>
//                 <InputLabel id="flux-select-label">
//                   Flux {lockMode === 'camera' && '(verrouillé)'}
//                 </InputLabel>
//                 <Select
//                   labelId="flux-select-label"
//                   id="flux-select"
//                   value={selectedFlux}
//                   label={`Flux ${lockMode === 'camera' ? '(verrouillé)' : ''}`}
//                   onChange={handleFluxChange}
//                   startAdornment={<OndemandVideoIcon fontSize="small" sx={{ mr: 1, color: 'white' }} />}
//                   disabled={lockMode === 'camera'}
//                 >
//                   {availableFlux.length > 0 ? (
//                     availableFlux.map(flux => (
//                       <MenuItem key={flux.id} value={flux.id}>
//                         {flux.name} {!flux.isActive && "(inactif)"}
//                       </MenuItem>
//                     ))
//                   ) : (
//                     <MenuItem value="flux1">Aucun flux disponible</MenuItem>
//                   )}
//                 </Select>
//               </FormControl>
              
//               {/* Bouton de verrouillage pour les flux */}
//               <Tooltip title={`Mode actuel : ${lockMode === 'camera' ? 'Sélection de caméra' : 'Sélection de flux'}`}>
//                 <IconButton 
//                   size="small" 
//                   onClick={toggleLockMode}
//                   sx={{ 
//                     ml: 0.5, 
//                     color: 'white',
//                     bgcolor: lockMode === 'flux' ? 'success.main' : 'error.main',
//                     '&:hover': {
//                       bgcolor: lockMode === 'flux' ? 'success.dark' : 'error.dark',
//                     }
//                   }}
//                 >
//                   {lockMode === 'flux' ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
//                 </IconButton>
//               </Tooltip>
//             </Box>
//           </Box>
          
//           <Box sx={{ 
//             flex: 1, 
//             position: 'relative', 
//             display: 'flex', 
//             justifyContent: 'center', 
//             alignItems: 'center', 
//             bgcolor: 'black',
//             overflow: 'hidden',
//             maxWidth: '83.6%',
//             height: 'auto',
//             aspectRatio: '16/9',
//           }}>
//             {/* Image pour les flux MJPEG (mode caméra) */}
//             {lockMode === 'camera' && (
//             <video
//               src={streamUrl}
//               autoPlay
//               muted
//               loop
//               style={{
//                 width: '100%',
//                 height: '100%',
//                 border: 'none',
//                 backgroundColor: 'black',
//                 objectFit: 'contain',
//               }}
//               onError={() => addAlert('Erreur de chargement du flux MJPEG', 'error')}
//             />
//           )}
            
//             {/* Video pour les flux HLS (mode flux) */}
//             {lockMode === 'flux' && (
//               <video
//                 ref={videoRef}
//                 controls
//                 muted
//                 style={{
//                   width: '100%',
//                   height: '100%',
//                   border: 'none',
//                   backgroundColor: 'black',
//                   objectFit: 'contain',
//                   maxWidth: '100%',
//                   maxHeight: '100%',
//                 }}
//                 onError={() => {
//                   addAlert(`Erreur de chargement du flux HLS`, 'error');
//                 }}
//               />
//             )}
            
//             {/* Indicateur d'enregistrement */}
//             <Box sx={{ 
//               position: 'absolute', 
//               top: 4, 
//               left: 4,
//               display: 'flex',
//               gap: 0.5,
//               zIndex: 2
//             }}>
//               <Chip
//                 icon={<FiberManualRecordIcon fontSize="small" sx={{ color: 'error.main' }} />}
//                 label={isMobile ? "" : "ENREGISTREMENT"}
//                 size="small"
//                 sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', height: 24 }}
//               />
//             </Box>
            
//             {/* Compteur de personnes */}
//             <Box sx={{ position: 'absolute', bottom: 4, left: 4, zIndex: 2 }}>
//               <Chip
//                 icon={<PersonIcon fontSize="small" />}
//                 label={`${countData.current_inside}`}
//                 size="small"
//                 sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', height: 24 }}
//               />
//             </Box>
            
//             {/* Indicateur de mode actif */}
//             <Box sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2 }}>
//               <Chip
//                 icon={lockMode === 'camera' ? <CameraAltIcon fontSize="small" /> : <OndemandVideoIcon fontSize="small" />}
//                 label={`Mode ${lockMode === 'camera' ? 'Caméra' : 'Flux'}`}
//                 size="small"
//                 sx={{ 
//                   bgcolor: lockMode === 'camera' ? 'rgba(25, 118, 210, 0.8)' : 'rgba(220, 0, 78, 0.8)', 
//                   color: 'white', 
//                   height: 24 
//                 }}
//               />
//             </Box>
//           </Box>
//         </Box>

//         {/* Partie droite - Statistiques et contrôles */}
//         <Box sx={{ 
//           flex: 1,
//           width: '100%', 
//           display: 'flex', 
//           flexDirection: 'column', 
//           gap: isMobile ? 0.5 : 1,
//           overflow: 'hidden'
//         }}>
//           <Paper sx={{ p: isMobile ? 1 : 1.5, borderRadius: 1, height: '100%' }}>
//             <Box sx={{ 
//               display: 'flex', 
//               justifyContent: 'space-between', 
//               alignItems: 'center', 
//               mb: 0.5 
//             }}>
//               <Typography variant={isMobile ? "subtitle2" : "subtitle1"} component="h2" fontWeight="medium">
//                 Compteur IA
//               </Typography>
//               <Chip
//                 icon={<MonitorHeartIcon fontSize="small" />}
//                 label={isMobile ? "" : "En fonction"}
//                 size="small"
//                 color="success"
//                 sx={{ bgcolor: 'success.light', color: 'success.dark', height: 24 }}
//               />
//             </Box>
            
//             <Grid container spacing={0.5}>
//               <Grid item xs={4}>
//                 <Paper elevation={0} sx={{ p: 1, bgcolor: 'success.50', border: 1, borderColor: 'success.200', borderRadius: 1 }}>
//                   <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.700' }}>
//                     <LoginIcon fontSize="small" sx={{ mr: 0.5 }} />
//                     <Typography variant="caption" noWrap>Entrées</Typography>
//                   </Box>
//                   <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="success.600">
//                     {countData.entrances}
//                   </Typography>
//                 </Paper>
//               </Grid>
              
//               <Grid item xs={4}>
//                 <Paper elevation={0} sx={{ p: 1, bgcolor: 'error.50', border: 1, borderColor: 'error.200', borderRadius: 1 }}>
//                   <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.700' }}>
//                     <LogoutIcon fontSize="small" sx={{ mr: 0.5 }} />
//                     <Typography variant="caption" noWrap>Sorties</Typography>
//                   </Box>
//                   <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="error.600">
//                     {countData.sorties}
//                   </Typography>
//                 </Paper>
//               </Grid>
              
//               <Grid item xs={4}>
//                 <Paper elevation={0} sx={{ p: 1, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200', borderRadius: 1, height: '100%' }}>
//                   <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.700' }}>
//                     <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
//                     <Typography variant="caption" sx={{ 
//                       fontSize: isMobile ? '0.65rem' : '0.7rem',
//                       lineHeight: 1.1
//                     }}>
//                       Personnes dans la salle
//                     </Typography>
//                   </Box>
//                   <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="primary.600">
//                     {countData.current_inside}
//                   </Typography>
//                 </Paper>
//               </Grid>
//             </Grid>
            
//             {/* Nouvelle section pour afficher les informations sur la caméra/flux et le GPU */}
//             <Box sx={{ mt: 1.5 }}>
//               <Grid container spacing={0.5}>
//                 <Grid item xs={6}>
//                   <Paper elevation={0} sx={{ p: 1, bgcolor: 'info.50', border: 1, borderColor: 'info.200', borderRadius: 1 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', color: 'info.700' }}>
//                       {lockMode === 'camera' ? (
//                         <CameraAltIcon fontSize="small" sx={{ mr: 0.5 }} />
//                       ) : (
//                         <OndemandVideoIcon fontSize="small" sx={{ mr: 0.5 }} />
//                       )}
//                       <Typography variant="caption" noWrap>
//                         {lockMode === 'camera' ? 'Caméra' : 'Flux'}
//                       </Typography>
//                     </Box>
//                     <Typography variant="body2" fontWeight="medium" color="info.700" noWrap>
//                       {lockMode === 'camera' 
//                         ? cameraInfo.nom_cam
                        
//                         : availableFlux.find(f => f.id === selectedFlux)?.name || 'Flux inconnu'}
//                     </Typography>
//                   </Paper>
//                 </Grid>
                
//                 <Grid item xs={6}>
//                   <Paper elevation={0} sx={{ p: 1, bgcolor: 'warning.50', border: 1, borderColor: 'warning.200', borderRadius: 1 }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.700' }}>
//                       <MemoryIcon fontSize="small" sx={{ mr: 0.5 }} />
//                       <Typography variant="caption" noWrap>GPU</Typography>
//                     </Box>
//                     <Typography variant="body2" fontWeight="medium" color="warning.700" noWrap>
//                       {gpuInfo.name} {gpuInfo.model && `(${gpuInfo.model})`}
//                     </Typography>
//                   </Paper>
//                 </Grid>
//               </Grid>
//             </Box>
            
//             {/* Afficher le mode de verrouillage actuel */}
//             <Box sx={{ mt: 1.5 }}>
//               <Paper elevation={0} sx={{ 
//                 p: 1, 
//                 bgcolor: lockMode === 'camera' ? 'primary.50' : 'error.50', 
//                 border: 1, 
//                 borderColor: lockMode === 'camera' ? 'primary.200' : 'error.200', 
//                 borderRadius: 1 
//               }}>
//                 <Box sx={{ 
//                   display: 'flex', 
//                   alignItems: 'center', 
//                   color: lockMode === 'camera' ? 'primary.700' : 'error.700' 
//                 }}>
//                   {lockMode === 'camera' ? (
//                     <CameraAltIcon fontSize="small" sx={{ mr: 0.5 }} />
//                   ) : (
//                     <OndemandVideoIcon fontSize="small" sx={{ mr: 0.5 }} />
//                   )}
//                   <Typography variant="body2" fontWeight="medium">
//                     Mode actif : {lockMode === 'camera' ? 'Sélection par caméra' : 'Sélection par flux'}
//                   </Typography>
//                 </Box>
//                 <Typography variant="caption" color={lockMode === 'camera' ? 'primary.700' : 'error.700'}>
//                   {lockMode === 'camera' 
//                     ? "Le sélecteur de flux est verrouillé" 
//                     : "Le sélecteur de caméra est verrouillé"}
//                 </Typography>
//               </Paper>
//             </Box>
//           </Paper>

//           <Box sx={{ 
//             display: 'flex', 
//             flexDirection: 'column', 
//             gap: 0.5, 
//             mt: 1, 
//             overflow: 'auto',
//             flex: 1
//           }}>
//             {alerts.map(alert => (
//               <Paper key={alert.id} sx={{ p: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
//                 <Typography variant="caption" color="text.secondary">{alert.time}</Typography>
//                 <Typography variant="body2">{alert.message}</Typography>
//               </Paper>
//             ))}
//           </Box>
//         </Box>
//       </Box>
//     </Box>
//   );
// }






/////////////////////////////////////////////// TEST CODE /////////////////////////////////////////////





import React, { useState, useEffect, useRef } from 'react';  // Ajoutez useRef
import { 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  Container, 
  Paper, 
  Grid, 
  Chip,
  useMediaQuery,
  useTheme,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MemoryIcon from '@mui/icons-material/Memory';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Hls from 'hls.js';  // Ajoutez l'import de Hls.js



export default function DataCenterSecurityPage() {
  const [countData, setCountData] = useState({ 
    entrances: 0, 
    sorties: 0,
    current_inside: 0 
  });
  const [selectedCam, setSelectedCam] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [currentTime, setCurrentTime] = useState('');
  const [streamUrl, setStreamUrl] = useState('/api/tracking_entree');
  const [cameraInfo, setCameraInfo] = useState({
    nom_cam: "Caméra entrée test"
  });
  const [gpuInfo, setGpuInfo] = useState({
    id_gpu: null,
    name: "Chargement...",
    model: "",
    capacity: ""
  });
  const [availableCameras, setAvailableCameras] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  
  // Nouveau state pour les flux disponibles depuis l'API
  const [availableFlux, setAvailableFlux] = useState([]);
  const [selectedFlux, setSelectedFlux] = useState('');
  
  // State pour gérer le verrouillage
  const [lockMode, setLockMode] = useState('camera'); // 'camera' ou 'flux'

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Fonction utilitaire pour ajouter des alertes
  const addAlert = (message, level = 'info') => {
    const newAlert = {
      id: Date.now(),
      message,
      level,
      time: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  // Ajoutez ces refs à la liste des states existants
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // Récupération de tous les flux disponibles depuis l'API
  const fetchAvailableFlux = async () => {
    try {
      const response = await fetch('/api/playlists');
      if (!response.ok) throw new Error('Erreur API flux');
      
      const data = await response.json();
      
      if (data && data.playlists && data.playlists.length > 0) {
        // Transformer les données de l'API pour correspondre à notre format
        const fluxList = data.playlists.map(stream => ({
          id: stream.name,
          name: stream.name,
          url: `/api/hls/${stream.content_type}/${stream.name}/playlist.m3u8`,
          content_type: stream.content_type,
          description: `${stream.segment_count} segments`,
          isActive: true,
          segment_count: stream.segment_count
        }));
        
        setAvailableFlux(fluxList);
        
        // Sélectionner par défaut le premier flux
        const defaultFlux = fluxList[0];
        setSelectedFlux(defaultFlux.id);
        
        addAlert(`${fluxList.length} flux disponibles chargés`, 'info');
      } else {
        // Utiliser des valeurs par défaut si aucun flux n'est disponible
        setAvailableFlux([
          { id: 'flux1', name: 'Flux principal par défaut', url: '/api/video_entree' }
        ]);
        setSelectedFlux('flux1');
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des flux:", error);
      // Conserver les valeurs par défaut en cas d'erreur
      setAvailableFlux([
        { id: 'flux1', name: 'Flux principal par défaut', url: '/api/video_entree' }
      ]);
      setSelectedFlux('flux1');
      addAlert('Erreur de chargement des flux', 'error');
    }
  };

  // Initialiser le lecteur HLS
  const initHlsPlayer = (streamUrl) => {
    if (!videoRef.current) return;
    
    destroyHlsPlayer(); // Nettoyer tout lecteur existant d'abord
    
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.controls = true;
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error encountered, try to recover');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error encountered, try to recover');
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable error encountered, destroying player');
              destroyHlsPlayer();
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Pour Safari
      videoRef.current.src = streamUrl;
      videoRef.current.controls = true;
    }
  };

  // Détruire le lecteur HLS
  const destroyHlsPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  // Mise à jour de l'heure actuelle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Récupération des informations GPU associées à une caméra
  const fetchGpuInfoForCamera = async (cameraId) => {
  try {
    // D'abord, récupérer tous les groupes GPU et leurs caméras associées
    const response = await fetch('/api/gpu-groups/');
    if (!response.ok) throw new Error('Erreur API GPU');
    
    const gpuGroups = await response.json();
    
    // Trouver le GPU associé à la caméra sélectionnée
    let associatedGpu = null;
    for (const gpuGroup of gpuGroups) {
      if (gpuGroup.cameras.includes(cameraId)) {
        associatedGpu = gpuGroup;
        break;
      }
    }
    
    if (associatedGpu) {
      setGpuInfo({
        id_gpu: associatedGpu.id_gpu,
        name: associatedGpu.name || "GPU non spécifié",
        model: associatedGpu.model || "",
        capacity: associatedGpu.capacity || ""
      });
      addAlert(`GPU associé: ${associatedGpu.name}`, 'info');
    } else {
      setGpuInfo({
        id_gpu: null,
        name: "Aucun GPU associé",
        model: "",
        capacity: ""
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des informations GPU:", error);
    setGpuInfo({
      id_gpu: null,
      name: "Erreur de chargement",
      model: "",
      capacity: ""
    });
    addAlert('Erreur de chargement des informations GPU', 'error');
  }
};



  // Récupération de toutes les caméras disponibles
  const fetchAllCameras = async () => {
    try {
      // Récupérer les caméras configurées (pour MJPEG)
      const camerasResponse = await fetch('/api/cameras/');
      // Récupérer les playlists HLS disponibles
      const playlistsResponse = await fetch('/api/rtsp_playlists');
      
      if (!camerasResponse.ok || !playlistsResponse.ok) throw new Error('Erreur API caméras');
      
      const cameras = await camerasResponse.json();
      const playlists = await playlistsResponse.json();
      
      // Fusionner les données
      const mergedCameras = cameras.map(camera => {
        // Trouver la playlist correspondante
        const playlist = playlists.find(p => p.camera_id === camera.id_cam);
        
        // Si l'URL de playlist existe et ne commence pas par /api/, ajouter /api/
        let playlistUrl = playlist?.playlist_url;
        if (playlistUrl && !playlistUrl.startsWith('/api/')) {
          playlistUrl = `/api${playlistUrl.startsWith('/') ? '' : '/'}${playlistUrl}`;
        }
        
        return {
          ...camera,
          has_hls: !!playlist,
          playlist_url: playlistUrl,
          hls_active: playlist?.is_active
        };
      });
      
      if (mergedCameras.length > 0) {
        setAvailableCameras(mergedCameras);
        
        // Sélectionner par défaut la première caméra active
        const defaultCamera = mergedCameras.find(c => c.is_active) || mergedCameras[0];
        if (defaultCamera) {
          setSelectedCamera(defaultCamera.id_cam);
          setSelectedCam(defaultCamera); // Ajouter cette ligne
          setCameraInfo({
            nom_cam: defaultCamera.nom_cam,
            emplacement: defaultCamera.emplacement,
            has_hls: defaultCamera.has_hls
          });
          
          fetchGpuInfoForCamera(defaultCamera.id_cam);
          updateStreamUrl(defaultCamera, null);
        }
        
        addAlert(`${mergedCameras.length} caméras disponibles chargées`, 'info');
      } else {
        // Utiliser des caméras par défaut si aucune n'est disponible
        const defaultCameras = [
          {
            id_cam: "camera_entree",
            nom_cam: "Caméra entrée",
            is_active: true,
            playlist_url: '/api/hls/Camera_IP/entree/playlist.m3u8'
          },
          {
            id_cam: "camera_sortie",
            nom_cam: "Caméra sortie",
            is_active: true,
            playlist_url: '/api/hls/Camera_IP/sortie/playlist.m3u8'
          }
        ];
        
        setAvailableCameras(defaultCameras);
        setSelectedCamera("camera_entree");
        setCameraInfo({
          nom_cam: "Caméra entrée"
        });
        updateStreamUrl(defaultCameras[0], null);
        
        addAlert(`2 caméras par défaut chargées`, 'info');
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des caméras:", error);
      // Créer des caméras par défaut en cas d'erreur
      const defaultCameras = [
        {
          id_cam: "camera_entree",
          nom_cam: "Caméra entrée",
          is_active: true,
          playlist_url: '/api/hls/Camera_IP/entree/playlist.m3u8'
        },
        {
          id_cam: "camera_sortie",
          nom_cam: "Caméra sortie",
          is_active: true,
          playlist_url: '/api/hls/Camera_IP/sortie/playlist.m3u8'
        }
      ];
      
      setAvailableCameras(defaultCameras);
      setSelectedCamera("camera_entree");
      setCameraInfo({
        nom_cam: "Caméra entrée"
      });
      updateStreamUrl(defaultCameras[0], null);
      
      addAlert('Erreur de chargement des caméras - utilisation des caméras par défaut', 'warning');
    }
  };

  // Mise à jour de l'URL du flux vidéo en fonction de la caméra ou du flux sélectionné
  const updateStreamUrl = (camera, flux) => {
    if (lockMode === 'camera' && camera) {
      // Mode caméra - utiliser HLS si disponible, sinon MJPEG
      if (camera.has_hls && camera.hls_active) {
        setStreamUrl(camera.playlist_url);
        initHlsPlayer(camera.playlist_url);
      } else {
        // Fallback sur MJPEG
        setStreamUrl(camera.adresse_flux_principal || '/api/video_entree');
        destroyHlsPlayer(); // Désactiver HLS
      }
    } else if (lockMode === 'flux' && flux) {
      // Mode flux - toujours HLS
      setStreamUrl(flux.url);
      initHlsPlayer(flux.url);
    }
  };

  // Gestion du changement de caméra
  // Gestion du changement de caméra
  const handleCameraChange = (event) => {
    // Ne rien faire si on est en mode verrouillage flux
    if (lockMode === 'flux') return;
    
    const cameraId = event.target.value;
    setSelectedCamera(cameraId);
    
    const selectedCamera = availableCameras.find(camera => camera.id_cam === cameraId);
    if (selectedCamera) {
      setCameraInfo({
        nom_cam: selectedCamera.nom_cam
      });
      
      // Définir selectedCam
      setSelectedCam(selectedCamera);
      
      // Récupérer les informations GPU associées à cette caméra
      fetchGpuInfoForCamera(cameraId);
      
      // Mise à jour du flux selon la caméra sélectionnée
      updateStreamUrl(selectedCamera, null);
      
      // Message d'alerte spécifique pour les caméras d'entrée/sortie
      let alertMessage = `Caméra changée: ${selectedCamera.nom_cam}`;
      
      if (selectedCamera.id_cam === availableCameras[0]?.id_cam) {
        alertMessage += " - Affichage du flux d'entrée";
      } else if (selectedCamera.id_cam === availableCameras[1]?.id_cam) {
        alertMessage += " - Affichage du flux de sortie";
      }
      
      addAlert(alertMessage, 'info');
    }
  };

  // Gestion du changement de flux
  const handleFluxChange = (event) => {
    // Ne rien faire si on est en mode verrouillage caméra
    if (lockMode === 'camera') return;
    
    const fluxId = event.target.value;
    setSelectedFlux(fluxId);
    
    const selectedF = availableFlux.find(flux => flux.id === fluxId);
    if (selectedF) {
      updateStreamUrl(null, selectedF);
      addAlert(`Flux changé: ${selectedF.name}`, 'info');
    }
  };

  // Bascule entre les modes de verrouillage
  const toggleLockMode = () => {
    const newMode = lockMode === 'camera' ? 'flux' : 'camera';
    setLockMode(newMode);
    
    // Forcer le rechargement du flux approprié
    if (newMode === 'camera') {
      const selectedCam = availableCameras.find(c => c.id_cam === selectedCamera);
      if (selectedCam) updateStreamUrl(selectedCam, null);
    } else {
      const selectedF = availableFlux.find(f => f.id === selectedFlux);
      if (selectedF) updateStreamUrl(null, selectedF);
    }
    
    addAlert(`Mode de sélection : ${newMode === 'camera' ? 'Caméra' : 'Flux'}`, 'info');
  };

  // Récupération des données du compteur
  const fetchCounterData = async () => {
    try {
      const response = await fetch('/api/compteur');
      if (!response.ok) throw new Error('Erreur API');
      
      const data = await response.json();
      setCountData(prev => {
        if (prev.entrances !== data.entrances || 
            prev.sorties !== data.sorties || 
            prev.current_inside !== data.current_inside) {
          const newAlert = {
            id: Date.now(),
            message: `Mise à jour: ${data.entrances} entrées, ${data.sorties} sorties`,
            level: 'info',
            time: new Date().toLocaleTimeString()
          };
          setAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 5));
        }
        return { 
          entrances: data.entrances || 0, 
          sorties: data.sorties || 0,
          current_inside: data.current_inside || 0
        };
      });
    } catch (error) {
      addAlert('Erreur de connexion au serveur', 'error');
    }
  };

  // Initialisation et polling
  useEffect(() => {
    fetchAllCameras();
    fetchAvailableFlux(); // Charger les flux depuis l'API
    fetchCounterData();
    
    const counterInterval = setInterval(fetchCounterData, 5000);
    // Rafraîchir les infos caméra et flux toutes les 60 secondes
    const cameraInterval = setInterval(fetchAllCameras, 60000);
    const fluxInterval = setInterval(fetchAvailableFlux, 60000);
    
    return () => {
      clearInterval(counterInterval);
      clearInterval(cameraInterval);
      clearInterval(fluxInterval);
      destroyHlsPlayer();
    };
  }, []);

  // Mettre à jour l'URL du flux quand le mode de verrouillage change
  useEffect(() => {
    if (lockMode === 'camera') {
      const camera = availableCameras.find(camera => camera.id_cam === selectedCamera);
      if (camera) {
        setSelectedCam(camera);
        updateStreamUrl(camera, null);
      }
    } else {
      const flux = availableFlux.find(flux => flux.id === selectedFlux);
      if (flux) {
        updateStreamUrl(null, flux);
      }
    }
  }, [lockMode, selectedCamera, selectedFlux]);

  // Ajoutez cet effet après vos autres useEffect
  useEffect(() => {
    // Mettre à jour la source de l'image lorsque streamUrl change et que nous sommes en mode caméra
    if (lockMode === 'camera') {
      // La balise img est mise à jour automatiquement via la propriété src du JSX
      addAlert(`Flux caméra chargé: ${streamUrl.split('/').pop()}`, 'info');
    }
  }, [streamUrl, lockMode]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '70vh', 
      bgcolor: 'grey.100',
      overflow: 'hidden'
    }}>
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar sx={{ minHeight: isMobile ? 48 : 56, px: isMobile ? 1 : 2 }}>
          <Container maxWidth="xl" sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            px: isMobile ? 0 : 2
          }}>
            <Typography variant={isMobile ? "subtitle2" : "h6"} component="h1" fontWeight="bold" noWrap>
              Surveillance Data Center
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ mr: 0.5 }} fontSize="small" />
                <Typography variant="caption">{currentTime}</Typography>
              </Box>
              <Chip 
                icon={<FiberManualRecordIcon fontSize="small" />} 
                label={isMobile ? "" : "En direct"} 
                size="small" 
                sx={{ 
                  bgcolor: 'success.main', 
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' },
                  height: 24
                }} 
              />
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile || isTablet ? 'column' : 'row',
        flex: 1, 
        p: isMobile ? 0.5 : 1, 
        gap: isMobile ? 0.5 : 1, 
        overflow: 'hidden',
        height: 'auto'
      }}>
        {/* Conteneur vidéo avec les menus déroulants pour caméras et flux */}
        <Box sx={{ 
          flex: isMobile || isTablet ? null : 2,
          width: '100%',
          height: isMobile ? '35vh' : isTablet ? '40vh' : '60vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          boxShadow: 2,
          overflow: 'hidden',
          position: 'relative',
          minHeight: isMobile ? 200 : 250,
          maxHeight: '90%',
        }}>
          <Box sx={{ 
            bgcolor: 'primary.dark',
            p: 1,
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: 1
          }}>
            {/* Sélecteur de caméra avec indicateur de verrouillage */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flex: 1
            }}>
              <FormControl size="small" sx={{ 
                flex: 1,
                '& .MuiInputBase-root': { 
                  color: 'white', 
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: lockMode === 'flux' ? 'rgba(255, 80, 80, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: lockMode === 'flux' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: lockMode === 'flux' ? 'rgb(255, 80, 80)' : 'white',
                  },
                  // Grisé si verrouillé
                  opacity: lockMode === 'flux' ? 0.6 : 1,
                },
                '& .MuiInputLabel-root': { 
                  color: lockMode === 'flux' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem',
                  '&.Mui-focused': {
                    color: lockMode === 'flux' ? 'rgb(255, 80, 80)' : 'white'
                  }
                },
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }}>
                <InputLabel id="camera-select-label">
                  Caméra {lockMode === 'flux' && '(verrouillé)'}
                </InputLabel>
                <Select
                  labelId="camera-select-label"
                  id="camera-select"
                  value={selectedCamera}
                  label={`Caméra ${lockMode === 'flux' ? '(verrouillé)' : ''}`}
                  onChange={handleCameraChange}
                  startAdornment={<CameraAltIcon fontSize="small" sx={{ mr: 1, color: 'white' }} />}
                  disabled={lockMode === 'flux'}
                >
                  {availableCameras.length > 0 ? (
                    availableCameras.map(camera => (
                      <MenuItem key={camera.id_cam} value={camera.id_cam}>
                        {camera.nom_cam}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="default">Caméra par défaut</MenuItem>
                  )}
                </Select>
              </FormControl>
              
              {/* Bouton de verrouillage pour les caméras */}
              <Tooltip title={`Mode actuel : ${lockMode === 'camera' ? 'Sélection de caméra' : 'Sélection de flux'}`}>
                <IconButton 
                  size="small" 
                  onClick={toggleLockMode}
                  sx={{ 
                    ml: 0.5, 
                    color: 'white',
                    bgcolor: lockMode === 'camera' ? 'success.main' : 'error.main',
                    '&:hover': {
                      bgcolor: lockMode === 'camera' ? 'success.dark' : 'error.dark',
                    }
                  }}
                >
                  {lockMode === 'camera' ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Sélecteur de flux avec indicateur de verrouillage */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flex: 1
            }}>
              <FormControl size="small" sx={{ 
                flex: 1,
                '& .MuiInputBase-root': { 
                  color: 'white', 
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: lockMode === 'camera' ? 'rgba(255, 80, 80, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: lockMode === 'camera' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: lockMode === 'camera' ? 'rgb(255, 80, 80)' : 'white',
                  },
                  // Grisé si verrouillé
                  opacity: lockMode === 'camera' ? 0.6 : 1,
                },
                '& .MuiInputLabel-root': { 
                  color: lockMode === 'camera' ? 'rgba(255, 80, 80, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.85rem',
                  '&.Mui-focused': {
                    color: lockMode === 'camera' ? 'rgb(255, 80, 80)' : 'white'
                  }
                },
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }}>
                <InputLabel id="flux-select-label">
                  Flux {lockMode === 'camera' && '(verrouillé)'}
                </InputLabel>
                <Select
                  labelId="flux-select-label"
                  id="flux-select"
                  value={selectedFlux}
                  label={`Flux ${lockMode === 'camera' ? '(verrouillé)' : ''}`}
                  onChange={handleFluxChange}
                  startAdornment={<OndemandVideoIcon fontSize="small" sx={{ mr: 1, color: 'white' }} />}
                  disabled={lockMode === 'camera'}
                >
                  {availableFlux.length > 0 ? (
                    availableFlux.map(flux => (
                      <MenuItem key={flux.id} value={flux.id}>
                        {flux.name} {!flux.isActive && "(inactif)"}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="flux1">Aucun flux disponible</MenuItem>
                  )}
                </Select>
              </FormControl>
              
              {/* Bouton de verrouillage pour les flux */}
              <Tooltip title={`Mode actuel : ${lockMode === 'camera' ? 'Sélection de caméra' : 'Sélection de flux'}`}>
                <IconButton 
                  size="small" 
                  onClick={toggleLockMode}
                  sx={{ 
                    ml: 0.5, 
                    color: 'white',
                    bgcolor: lockMode === 'flux' ? 'success.main' : 'error.main',
                    '&:hover': {
                      bgcolor: lockMode === 'flux' ? 'success.dark' : 'error.dark',
                    }
                  }}
                >
                  {lockMode === 'flux' ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ 
              flex: 1, 
              position: 'relative', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              bgcolor: 'black',
              overflow: 'hidden',
              maxWidth: '83.6%',
              height: 'auto',
              aspectRatio: '16/9',
            }}>
              {/* Cas MJPEG (mode caméra sans HLS) */}
              {lockMode === 'camera' && (!selectedCam?.has_hls || !selectedCam?.hls_active) && (
                <img
                  src={streamUrl}
                  alt={`Flux ${cameraInfo.nom_cam}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onError={() => addAlert('Erreur de chargement du flux MJPEG', 'error')}
                />
              )}
              
              {/* Cas HLS (mode caméra avec HLS ou mode flux) */}
              {(lockMode === 'flux' || (lockMode === 'camera' && selectedCam?.has_hls && selectedCam?.hls_active)) && (
                <video
                  ref={videoRef}
                  controls
                  muted
                  autoPlay
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: 'black',
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                  onError={() => {
                    addAlert(`Erreur de chargement du flux HLS`, 'error');
                    // Fallback sur MJPEG si disponible (uniquement en mode caméra)
                    if (lockMode === 'camera' && selectedCam?.adresse_flux_principal) {
                      setStreamUrl(selectedCam.adresse_flux_principal);
                      destroyHlsPlayer();
                    }
                  }}
                />
              )}
            </Box>
        </Box>

        {/* Partie droite - Statistiques et contrôles */}
        <Box sx={{ 
          flex: 1,
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? 0.5 : 1,
          overflow: 'hidden'
        }}>
          <Paper sx={{ p: isMobile ? 1 : 1.5, borderRadius: 1, height: '100%' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 0.5 
            }}>
              <Typography variant={isMobile ? "subtitle2" : "subtitle1"} component="h2" fontWeight="medium">
                Compteur IA
              </Typography>
              <Chip
                icon={<MonitorHeartIcon fontSize="small" />}
                label={isMobile ? "" : "En fonction"}
                size="small"
                color="success"
                sx={{ bgcolor: 'success.light', color: 'success.dark', height: 24 }}
              />
            </Box>
            
            <Grid container spacing={0.5}>
              <Grid item xs={4}>
                <Paper elevation={0} sx={{ p: 1, bgcolor: 'success.50', border: 1, borderColor: 'success.200', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.700' }}>
                    <LoginIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" noWrap>Entrées</Typography>
                  </Box>
                  <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="success.600">
                    {countData.entrances}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper elevation={0} sx={{ p: 1, bgcolor: 'error.50', border: 1, borderColor: 'error.200', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.700' }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" noWrap>Sorties</Typography>
                  </Box>
                  <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="error.600">
                    {countData.sorties}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper elevation={0} sx={{ p: 1, bgcolor: 'primary.50', border: 1, borderColor: 'primary.200', borderRadius: 1, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.700' }}>
                    <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" sx={{ 
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      lineHeight: 1.1
                    }}>
                      Personnes dans la salle
                    </Typography>
                  </Box>
                  <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="primary.600">
                    {countData.current_inside}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Nouvelle section pour afficher les informations sur la caméra/flux et le GPU */}
            <Box sx={{ mt: 1.5 }}>
              <Grid container spacing={0.5}>
                <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 1, bgcolor: 'info.50', border: 1, borderColor: 'info.200', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'info.700' }}>
                    <CameraAltIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" noWrap>
                      Caméra ({lockMode === 'camera' 
                        ? selectedCam?.has_hls && selectedCam?.hls_active ? 'HLS' : 'MJPEG'
                        : 'Flux HLS'})
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="medium" color="info.700" noWrap>
                    {lockMode === 'camera' 
                      ? cameraInfo.nom_cam
                      : availableFlux.find(f => f.id === selectedFlux)?.name || 'Flux inconnu'}
                  </Typography>
                </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 1, bgcolor: 'warning.50', border: 1, borderColor: 'warning.200', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.700' }}>
                      <MemoryIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption" noWrap>GPU</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium" color="warning.700" noWrap>
                      {gpuInfo.name} {gpuInfo.model && `(${gpuInfo.model})`}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            
            {/* Afficher le mode de verrouillage actuel */}
            <Box sx={{ mt: 1.5 }}>
              <Paper elevation={0} sx={{ 
                p: 1, 
                bgcolor: lockMode === 'camera' ? 'primary.50' : 'error.50', 
                border: 1, 
                borderColor: lockMode === 'camera' ? 'primary.200' : 'error.200', 
                borderRadius: 1 
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: lockMode === 'camera' ? 'primary.700' : 'error.700' 
                }}>
                  {lockMode === 'camera' ? (
                    <CameraAltIcon fontSize="small" sx={{ mr: 0.5 }} />
                  ) : (
                    <OndemandVideoIcon fontSize="small" sx={{ mr: 0.5 }} />
                  )}
                  <Typography variant="body2" fontWeight="medium">
                    Mode actif : {lockMode === 'camera' ? 'Sélection par caméra' : 'Sélection par flux'}
                  </Typography>
                </Box>
                <Typography variant="caption" color={lockMode === 'camera' ? 'primary.700' : 'error.700'}>
                  {lockMode === 'camera' 
                    ? "Le sélecteur de flux est verrouillé" 
                    : "Le sélecteur de caméra est verrouillé"}
                </Typography>
              </Paper>
            </Box>
          </Paper>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5, 
            mt: 1, 
            overflow: 'auto',
            flex: 1
          }}>
            {alerts.map(alert => (
              <Paper key={alert.id} sx={{ p: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
                <Typography variant="caption" color="text.secondary">{alert.time}</Typography>
                <Typography variant="body2">{alert.message}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
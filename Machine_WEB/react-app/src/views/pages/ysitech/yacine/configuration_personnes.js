// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Card,
//   CardContent,
//   Grid,
//   Typography,
//   Stack,
//   Avatar,
//   Chip,
//   IconButton,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   CircularProgress,
//   Alert,
//   TextField,
//   Paper,
//   Accordion,
//   AccordionSummary,
//   Divider,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Checkbox,
//   ListItemText,
//   DialogContentText,
//   FormControlLabel,
//   Snackbar
// } from "@mui/material";
// import { 
//   AddCircleOutline, 
//   Delete, 
//   Edit, 
//   Lock, 
//   LockOpen,
//   FilterList,
//   ExpandMore,
//   CloudUpload
// } from "@mui/icons-material";
// import axios from 'axios';

// // const API_BASE_URL = "http://localhost:8000";
// // const API_ENDPOINT = "/api/personnes";

// const BADGE_STATUS = {
//   ACTIVE: "Actif",
//   INACTIVE: "Inactif"
// };

// const AUTHORIZATION_STATUS = {
//   YES: "Oui",
//   NO: "Non"
// };

// const AUTHORIZATION_LEVELS = {
//   NONE: "Aucun",
//   BASIC: "Accès Basique",
//   ADVANCED: "Accès Avancé",
//   ADMIN: "Accès Admin"
// };

// const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// const ZONES_ACCES = [
//   "Entrée principale",
//   "Bureaux administratifs",
//   "Laboratoires",
//   "Salles de réunion",
//   "Zone sécurisée",
//   "Cafétéria",
//   "Parking"
// ];

// const PersonnesManagement = () => {
//   const [personnes, setPersonnes] = useState([]);
//   const [filteredPersonnes, setFilteredPersonnes] = useState([]);
//   const [loading, setLoading] = useState({ main: true, action: false });
//   const [error, setError] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [currentItem, setCurrentItem] = useState(null);
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
//   const [personneToDelete, setPersonneToDelete] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [filters, setFilters] = useState({
//     searchText: '',
//     badgeStatus: [],
//     authorizationStatus: [],
//     roles: [],
//     authorizationLevels: []
//   });
//   const [expandedFilter, setExpandedFilter] = useState(false);
//   const [notification, setNotification] = useState({
//       open: false,
//       message: '',
//       severity: 'success' // 'success', 'error', 'warning', 'info'
//     });

//   useEffect(() => {
//     const fetchPersonnes = async () => {
//       try {
//         setLoading(prev => ({ ...prev, main: true }));
//         const response = await axios.get('/api/personnes/');
        
//         const processedPersonnes = response.data.map(personne => ({
//           ...personne,
//           zones_acces: personne.zones_acces 
//             ? typeof personne.zones_acces === 'string'
//               ? personne.zones_acces.split(',').filter(zone => zone.trim()) 
//               : personne.zones_acces
//             : [],
//           jours_acces: personne.jours_acces 
//             ? personne.jours_acces === "7/7"
//               ? "7/7"
//               : (typeof personne.jours_acces === 'string'
//                 ? personne.jours_acces.split(',').filter(jour => jour.trim())
//                 : personne.jours_acces)
//             : []
//         }));
        
//         setPersonnes(processedPersonnes);
//         setFilteredPersonnes(processedPersonnes);
//         extractUniqueData(processedPersonnes);
//         setLoading(prev => ({ ...prev, main: false }));
//       } catch (err) {
//         setError("Erreur lors du chargement des données");
//         console.error(err);
//         setLoading(prev => ({ ...prev, main: false }));
//       }
//     };

//     fetchPersonnes();
//   }, []);

//   const extractUniqueData = (personnes) => {
//     const uniqueRoles = [...new Set(personnes.map(p => p.role).filter(Boolean))];
//     const uniqueAuthLevels = [...new Set(personnes.map(p => p.niveau_autorisation).filter(Boolean))];
//     setFilters(prev => ({
//       ...prev,
//       roles: [],
//       authorizationLevels: []
//     }));
//   };

//   useEffect(() => {
//     if (personnes.length === 0) return;

//     const filtered = personnes.filter(personne => {
//       if (filters.searchText) {
//         const searchLower = filters.searchText.toLowerCase();
//         if (!personne.nom?.toLowerCase().includes(searchLower) && 
//             !personne.prenom?.toLowerCase().includes(searchLower)) {
//           return false;
//         }
//       }

//       if (filters.badgeStatus.length > 0) {
//         const badgeStatus = personne.badge_actif ? BADGE_STATUS.ACTIVE : BADGE_STATUS.INACTIVE;
//         if (!filters.badgeStatus.includes(badgeStatus)) return false;
//       }

//       if (filters.authorizationStatus.length > 0) {
//         if (!filters.authorizationStatus.includes(personne.autorisation)) return false;
//       }

//       if (filters.roles.length > 0) {
//         if (!filters.roles.includes(personne.role)) return false;
//       }

//       if (filters.authorizationLevels.length > 0) {
//         if (!filters.authorizationLevels.includes(personne.niveau_autorisation)) return false;
//       }

//       return true;
//     });

//     setFilteredPersonnes(filtered);
//   }, [filters, personnes]);

//   const handleFilterChange = (filterName, value) => {
//     setFilters(prev => ({
//       ...prev,
//       [filterName]: value
//     }));
//   };

//   const resetFilters = () => {
//     setFilters({
//       searchText: '',
//       badgeStatus: [],
//       authorizationStatus: [],
//       roles: [],
//       authorizationLevels: []
//     });
//   };

//   const handleAddNew = () => {
//     setCurrentItem({
//       nom: "",
//       prenom: "",
//       date_naissance: "",
//       sexe: "Homme",
//       role: "Visiteur",
//       niveau_autorisation: AUTHORIZATION_LEVELS.NONE,
//       autorisation: AUTHORIZATION_STATUS.NO,
//       zones_acces: [],
//       jours_acces: [], // Empty array for no days selected
//       acces_limite_jour: 1, // Default to limited access
//       plage_horaire_debut: "",
//       plage_horaire_fin: "",
//       badge_actif: false,
//       id_hist_pers: null,
//       photo_url: null
//     });
//     setImagePreview(null);
//     setModalOpen(true);
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImagePreview(reader.result);
//         setCurrentItem(prev => ({
//           ...prev,
//           photo: file,
//           photo_url: reader.result
//         }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSave = async () => {
//     setLoading(prev => ({ ...prev, action: true }));
//     setError(null);
  
//     if (!validateForm()) {
//       let errorMessage = "Tous les champs obligatoires doivent être remplis.";
//       if (currentItem?.acces_limite_jour === 1 && 
//           (Array.isArray(currentItem?.jours_acces) && currentItem?.jours_acces.length === 0)) {
//         errorMessage = "Veuillez sélectionner au moins un jour d'accès lorsque l'accès est limité";
//       }
//       setError(errorMessage);
//       setNotification({
//         open: true,
//         message: errorMessage,
//         severity: 'error'
//       });
//       setLoading(prev => ({ ...prev, action: false }));
//       return;
//     }
  
//     try {
//       // Convertir les jours d'accès
//       let joursAccesValue;
//       if (currentItem.acces_limite_jour === 0) {
//         joursAccesValue = "7/7";
//       } else {
//         joursAccesValue = Array.isArray(currentItem.jours_acces) && currentItem.jours_acces.length > 0 
//           ? currentItem.jours_acces.join(',') 
//           : "";
//       }
  
//       const preparedData = {
//         ...currentItem,
//         plage_horaire_debut: currentItem.plage_horaire_debut || null,
//         plage_horaire_fin: currentItem.plage_horaire_fin || null,
//         id_hist_pers: currentItem.id_hist_pers || null,
//         zones_acces: Array.isArray(currentItem.zones_acces) 
//           ? currentItem.zones_acces.join(',') 
//           : currentItem.zones_acces,
//         jours_acces: joursAccesValue,
//         limite_acces_jours: currentItem.acces_limite_jour === 1
//       };
  
//       let response;
//       if (currentItem.photo) {
//         const formData = new FormData();
        
//         Object.keys(preparedData).forEach(key => {
//           if (key !== 'photo' && key !== 'photo_url') {
//             formData.append(key, preparedData[key]);
//           }
//         });
        
//         formData.append('photo', currentItem.photo);
        
//         if (currentItem.id_personne) {
//           response = await axios.put(`/api/personnes/`, formData, {
//             headers: {
//               'Content-Type': 'multipart/form-data'
//             }
//           });
//         } else {
//           response = await axios.post(`/api/personnes/`, formData, {
//             headers: {
//               'Content-Type': 'multipart/form-data'
//             }
//           });
//         }
//       } else {
//         if (currentItem.id_personne) {
//           response = await axios.put(`/api/personnes/${currentItem.id_personne}`, preparedData);
//         } else {
//           response = await axios.post(`/api/personnes/`, preparedData);
//         }
//       }
  
//       const updatedResponse = await axios.get(`/api/personnes/`);
//       const processedPersonnes = updatedResponse.data.map(personne => ({
//         ...personne,
//         zones_acces: personne.zones_acces 
//           ? typeof personne.zones_acces === 'string'
//             ? personne.zones_acces.split(',').filter(zone => zone.trim()) 
//             : personne.zones_acces
//           : [],
//         jours_acces: personne.jours_acces 
//           ? personne.jours_acces === "7/7"
//             ? "7/7"
//             : (typeof personne.jours_acces === 'string'
//               ? personne.jours_acces.split(',').filter(jour => jour.trim())
//               : personne.jours_acces)
//           : []
//       }));
      
//       setPersonnes(processedPersonnes);
//       setModalOpen(false);
//       setCurrentItem(null);
//       setImagePreview(null);
      
//       setNotification({
//         open: true,
//         message: currentItem?.id_personne ? "Personne modifiée avec succès" : "Personne ajoutée avec succès",
//         severity: 'success'
//       });
//     } catch (err) {
//       const errorMessage = err.response?.data?.detail || "Erreur lors de la sauvegarde";
//       setError(errorMessage);
//       setNotification({
//         open: true,
//         message: errorMessage,
//         severity: 'error'
//       });
//       console.error(err);
//     } finally {
//       setLoading(prev => ({ ...prev, action: false }));
//     }
//   };

//   const validateForm = () => {
//     // Si l'autorisation est "Non", nous n'avons pas besoin de valider les jours d'accès
//     if (currentItem?.autorisation === AUTHORIZATION_STATUS.NO) {
//       const requiredFields = [
//         currentItem?.nom?.trim(),
//         currentItem?.prenom?.trim(),
//         currentItem?.date_naissance,
//         currentItem?.sexe,
//         currentItem?.role?.trim(),
//         currentItem?.zones_acces?.length > 0
//       ];
      
//       return requiredFields.every(field => field);
//     }
    
//     // Validation normale quand l'autorisation est "Oui"
//     const requiredFields = [
//       currentItem?.nom?.trim(),
//       currentItem?.prenom?.trim(),
//       currentItem?.date_naissance,
//       currentItem?.sexe,
//       currentItem?.role?.trim(),
//       currentItem?.autorisation,
//       currentItem?.zones_acces?.length > 0
//     ];
  
//     // Validation jours d'accès uniquement si autorisation est "Oui"
//     const joursAccessValid = currentItem?.acces_limite_jour === 0 || 
//       (currentItem?.acces_limite_jour === 1 && Array.isArray(currentItem?.jours_acces) && currentItem?.jours_acces.length > 0);
  
//     return requiredFields.every(field => field) && joursAccessValid;
//   };


//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
    
//     setCurrentItem(prev => {
//       let newState = { ...prev, [name]: value };
      
//       if (name === 'autorisation' && value === AUTHORIZATION_STATUS.NO) {
//         newState = {
//           ...newState,
//           niveau_autorisation: AUTHORIZATION_LEVELS.NONE,
//           plage_horaire_debut: "",
//           plage_horaire_fin: "",
//           acces_limite_jour: 1,
//           jours_acces: []
//         };
//       }
//       else if (name === 'badge_actif') {
//         // Convertir la valeur en booléen si nécessaire
//         const boolValue = value === 'true' || value === true;
        
//         if (!boolValue) { // Si le badge devient inactif
//           newState = {
//             ...newState,
//             badge_actif: false,
//             autorisation: AUTHORIZATION_STATUS.NO,
//             niveau_autorisation: AUTHORIZATION_LEVELS.NONE,
//             plage_horaire_debut: "",
//             plage_horaire_fin: "",
//             acces_limite_jour: 1,
//             jours_acces: []
//           };
//         } else {
//           newState.badge_actif = true;
//         }
//       }
      
//       return newState;
//     });
//   };

//   const handleMultiSelectChange = (e) => {
//     const { value } = e.target;
//     setCurrentItem(prev => ({
//       ...prev,
//       zones_acces: value
//     }));
//   };

//   const handleJourChange = (jour) => {
//     setCurrentItem(prev => {
//       const nouveauxJours = prev.jours_acces.includes(jour)
//         ? prev.jours_acces.filter(j => j !== jour)
//         : [...prev.jours_acces, jour];
      
//       return { ...prev, jours_acces: nouveauxJours };
//     });
//   };

//   const handleDelete = async () => {
//     if (!personneToDelete) return;
  
//     setLoading(prev => ({ ...prev, action: true }));
//     try {
//       await axios.delete(`/api/personnes/${personneToDelete}`);
      
//       setPersonnes(prev => prev.filter(p => p.id_personne !== personneToDelete));
//       setDeleteConfirmOpen(false);
//       setPersonneToDelete(null);
      
//       setNotification({
//         open: true,
//         message: "Personne supprimée avec succès",
//         severity: 'success'
//       });
//     } catch (err) {
//       const errorMessage = "Erreur lors de la suppression";
//       setError(errorMessage);
//       setNotification({
//         open: true,
//         message: errorMessage,
//         severity: 'error'
//       });
//       console.error(err);
//     } finally {
//       setLoading(prev => ({ ...prev, action: false }));
//     }
//   };

//   const confirmDelete = (personneId) => {
//     setPersonneToDelete(personneId);
//     setDeleteConfirmOpen(true);
//   };

//   const renderAuthorizationLevelSelect = () => {
//     const isDisabled = currentItem?.badge_actif === false || 
//                       currentItem?.autorisation === AUTHORIZATION_STATUS.NO;
    
//     const authorizationLevels = isDisabled
//       ? [AUTHORIZATION_LEVELS.NONE]
//       : [
//           AUTHORIZATION_LEVELS.NONE,
//           AUTHORIZATION_LEVELS.BASIC, 
//           AUTHORIZATION_LEVELS.ADVANCED, 
//           AUTHORIZATION_LEVELS.ADMIN
//         ];
  
//         return (
//           <FormControl fullWidth margin="normal" required>
//             <InputLabel>Niveau d'Autorisation</InputLabel>
//             <Select
//               name="niveau_autorisation"
//               value={currentItem?.niveau_autorisation || AUTHORIZATION_LEVELS.NONE}
//               onChange={handleInputChange}
//               disabled={isDisabled}
//             >
//               {authorizationLevels.map(level => (
//                 <MenuItem key={level} value={level}>{level}</MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         );
//       };

//       if (loading.main) {
//         return (
//           <Box 
//             display="flex" 
//             flexDirection="column" 
//             justifyContent="center" 
//             alignItems="center" 
//             height="80vh"
//           >
//             <CircularProgress size={60} thickness={4} />
//             <Typography variant="h6" color="text.secondary" mt={3}>
//               Chargement des données...
//             </Typography>
//           </Box>
//         );
//       }

//   return (
//     <Box>
//       <Box>
//     {/* ★ Début du nouveau code ★ */}
//     <Box sx={{ 
//       mb: 4, 
//       display: 'flex', 
//       flexDirection: 'column',
//       alignItems: 'center',
//       textAlign: 'center'
//     }}>
//       <Typography 
//         variant="h4" 
//         component="h1" 
//         gutterBottom 
//         sx={{ 
//           fontWeight: 'bold',
//           position: 'relative',
//           pb: 2,
//           '&::after': {
//             content: '""',
//             position: 'absolute',
//             bottom: 0,
//             left: '50%',
//             transform: 'translateX(-50%)',
//             width: '60px',
//             height: '4px',
//             backgroundColor: 'primary.main',
//             borderRadius: '2px'
//           }
//         }}
//       >
//         Gestion des Personnes
//       </Typography>
      
//       <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
//         Gérez les accès et les autorisations du personnel
//       </Typography>
      
//       <Chip 
//         label={`${filteredPersonnes.length} personne${filteredPersonnes.length > 1 ? 's' : ''}`} 
//         color="primary" 
//         variant="outlined"
//         sx={{ mb: 3 }}
//       />
//     </Box>

//     <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
//       <Grid container spacing={2} alignItems="center">
//         {/* Recherche */}
//         <Grid item xs={12} md={6}>
//           <TextField
//             fullWidth
//             placeholder="Rechercher..."
//             value={filters.searchText}
//             onChange={(e) => handleFilterChange('searchText', e.target.value)}
//             InputProps={{
//               startAdornment: <FilterList color="action" sx={{ mr: 1 }} />,
//               endAdornment: filters.searchText && (
//                 <IconButton size="small" onClick={() => handleFilterChange('searchText', '')}>
//                   <Delete fontSize="small" />
//                 </IconButton>
//               )
//             }}
//           />
//         </Grid>
        
//         {/* Bouton Ajouter */}
//         <Grid item xs={6} md={3}>
//           <Button
//             fullWidth
//             variant="contained"
//             startIcon={<AddCircleOutline />}
//             onClick={handleAddNew}
//           >
//             Ajouter
//           </Button>
//         </Grid>
        
//         {/* Bouton Filtres (existant) */}
//         <Grid item xs={6} md={3}>
//           <Button
//             fullWidth
//             variant={expandedFilter ? "contained" : "outlined"}
//             startIcon={<FilterList />}
//             onClick={() => setExpandedFilter(!expandedFilter)}
//           >
//             Filtres
//           </Button>
//         </Grid>
//       </Grid>
//     </Paper>
//     </Box>

//       <Accordion expanded={expandedFilter} onChange={() => setExpandedFilter(!expandedFilter)}>
//         <Divider />
//         <Box p={2}>
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 label="Recherche (nom ou prénom)"
//                 value={filters.searchText}
//                 onChange={(e) => handleFilterChange('searchText', e.target.value)}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6} md={3}>
//               <FormControl fullWidth>
//                 <InputLabel>Rôle</InputLabel>
//                 <Select
//                   multiple
//                   value={filters.roles}
//                   onChange={(e) => handleFilterChange('roles', e.target.value)}
//                   renderValue={(selected) => selected.join(', ')}
//                 >
//                   {[...new Set(personnes.map(p => p.role).filter(Boolean))].map(role => (
//                     <MenuItem key={role} value={role}>
//                       <Checkbox checked={filters.roles.includes(role)} />
//                       <ListItemText primary={role} />
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid item xs={12} sm={6} md={3}>
//               <FormControl fullWidth>
//                 <InputLabel>Statut du badge</InputLabel>
//                 <Select
//                   multiple
//                   value={filters.badgeStatus}
//                   onChange={(e) => handleFilterChange('badgeStatus', e.target.value)}
//                   renderValue={(selected) => selected.join(', ')}
//                 >
//                   {Object.values(BADGE_STATUS).map(status => (
//                     <MenuItem key={status} value={status}>
//                       <Checkbox checked={filters.badgeStatus.includes(status)} />
//                       <ListItemText primary={status} />
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid item xs={12} sm={6} md={3}>
//               <FormControl fullWidth>
//                 <InputLabel>Autorisation</InputLabel>
//                 <Select
//                   multiple
//                   value={filters.authorizationStatus}
//                   onChange={(e) => handleFilterChange('authorizationStatus', e.target.value)}
//                   renderValue={(selected) => selected.join(', ')}
//                 >
//                   {Object.values(AUTHORIZATION_STATUS).map(status => (
//                     <MenuItem key={status} value={status}>
//                       <Checkbox checked={filters.authorizationStatus.includes(status)} />
//                       <ListItemText primary={status} />
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid item xs={12} sm={6} md={3}>
//               <FormControl fullWidth>
//                 <InputLabel>Niveau d'autorisation</InputLabel>
//                 <Select
//                   multiple
//                   value={filters.authorizationLevels}
//                   onChange={(e) => handleFilterChange('authorizationLevels', e.target.value)}
//                   renderValue={(selected) => selected.join(', ')}
//                 >
//                   {[...new Set(personnes.map(p => p.niveau_autorisation).filter(Boolean))].map(level => (
//                     <MenuItem key={level} value={level}>
//                       <Checkbox checked={filters.authorizationLevels.includes(level)} />
//                       <ListItemText primary={level} />
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>

//             <Grid item xs={12}>
//               <Button 
//                 variant="outlined" 
//                 color="secondary" 
//                 onClick={resetFilters}
//                 disabled={
//                   !filters.searchText &&
//                   filters.badgeStatus.length === 0 &&
//                   filters.authorizationStatus.length === 0 &&
//                   filters.roles.length === 0 &&
//                   filters.authorizationLevels.length === 0
//                 }
//               >
//                 Réinitialiser les filtres
//               </Button>
//             </Grid>
//           </Grid>
//         </Box>
//       </Accordion>

//       <Box my={2}>
//         <Typography variant="subtitle1" >
//           {filteredPersonnes.length} personne(s) trouvée(s)
//         </Typography>
//       </Box>

//       <Grid container spacing={3}>
//         {filteredPersonnes.length > 0 ? (
//           filteredPersonnes.map(personne => (
//             <Grid item xs={12} sm={6} md={4} lg={3} key={personne.id_personne}>
//               <Card sx={{ 
//                   backgroundColor: '#1e293b',
//                   height: '100%', 
//                   display: 'flex', 
//                   flexDirection: 'column',
//                   transition: 'transform 0.3s ease, box-shadow 0.3s ease',
//                   '&:hover': {
//                     transform: 'translateY(-5px)',
//                     boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                   
//                   },
//                   borderRadius: 2,
//                   overflow: 'hidden'
//                 }}>
//                   <Box sx={{ 
//                     background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
//                     pt: 3,
//                     pb: 1,
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center'
//                   }}>
//                     <Avatar 
//                       src={personne.photo_url || "/default-avatar.png"} 
//                       sx={{ 
//                         height: 120, 
//                         width: 120,
//                         border: '3px solid #fff',
//                         boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
//                         mb: 1
//                       }}
//                     />
//                     <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'black' }}>
//                       {personne.prenom} {personne.nom}
//                     </Typography>
//                     <Chip 
//                       label={personne.role} 
//                       size="small" 
//                       color="primary" 
//                       sx={{ mb: 1 }}
//                     />
//                   </Box>
//                   <CardContent sx={{ flexGrow: 1, p: 2 }}>
//                     <Stack spacing={2} mt={1}>
//                     <Box display="flex" alignItems="center" justifyContent="space-between">
//                       <Typography variant="body2">Autorisation:</Typography>
//                       <Chip 
//                         label={personne.autorisation} 
//                         size="small" 
//                         color={personne.autorisation === AUTHORIZATION_STATUS.YES ? "success" : "default"}
//                       />
//                     </Box>

//                     {personne.autorisation === AUTHORIZATION_STATUS.YES && (
//                       <>
//                         <Box display="flex" alignItems="center" justifyContent="space-between">
//                           <Typography variant="body2">Niveau:</Typography>
//                           <Chip 
//                             label={personne.niveau_autorisation} 
//                             size="small" 
//                             color="primary"
//                           />
//                         </Box>

//                         <Box display="flex" alignItems="center" justifyContent="space-between">
//                           <Typography variant="body2">Jours d'accès:</Typography>
//                           <Typography variant="body2" color="textSecondary">
//                             {personne.jours_acces === "7/7" 
//                               ? "Tous les jours (7/7)"
//                               : Array.isArray(personne.jours_acces) && personne.jours_acces.length > 0
//                                 ? personne.jours_acces.join(', ')
//                                 : "Aucun jour sélectionné"}
//                           </Typography>
//                         </Box>
//                       </>
//                     )}
                    
//                     <Box display="flex" alignItems="center" justifyContent="space-between">
//                       <Typography variant="body2">Badge:</Typography>
//                       {personne.badge_actif ? 
//                       <Chip 
//                         icon={<LockOpen sx={{ fontSize: 16 }} />} 
//                         label={BADGE_STATUS.ACTIVE} 
//                         color="success" 
//                         size="small"
//                         sx={{ 
//                           fontWeight: 'bold',
//                           boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
//                           '& .MuiChip-icon': { color: 'inherit' }
//                         }} 
//                       /> : 
//                       <Chip 
//                         icon={<Lock sx={{ fontSize: 16 }} />} 
//                         label={BADGE_STATUS.INACTIVE} 
//                         color="error" 
//                         size="small"
//                         sx={{ 
//                           fontWeight: 'bold',
//                           boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
//                           '& .MuiChip-icon': { color: 'inherit' }
//                         }}
//                       />
//                     }
//                     </Box>
//                   </Stack>

//                   <Stack direction="row" spacing={1} mt={3} justifyContent="center">
//                   <IconButton
//                       onClick={() => {
//                         // Pour l'édition, préparer correctement les jours d'accès
//                         const joursAcces = personne.jours_acces === "7/7" 
//                           ? [] 
//                           : (Array.isArray(personne.jours_acces) 
//                               ? personne.jours_acces 
//                               : (typeof personne.jours_acces === 'string' 
//                                 ? personne.jours_acces.split(',').filter(j => j.trim()) 
//                                 : []));

//                         setCurrentItem({
//                           ...personne,
//                           zones_acces: Array.isArray(personne.zones_acces) ? personne.zones_acces : [],
//                           jours_acces: joursAcces,
//                           acces_limite_jour: personne.jours_acces === "7/7" ? 0 : 1
//                           });
//                           setModalOpen(true);
//                         }}
//                       >
//                         <Edit />
//                       </IconButton>
//                     <IconButton
//                       onClick={() => confirmDelete(personne.id_personne)}
//                       color="error"
//                     >
//                       <Delete />
//                     </IconButton>
//                   </Stack>
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))
//         ) : (
//           <Grid item xs={12}>
//             <Paper sx={{ p: 3, textAlign: 'center' }}>
//               <Typography variant="h6">Aucune personne ne correspond aux critères de recherche</Typography>
//               <Button onClick={resetFilters} sx={{ mt: 2 }}>
//                 Réinitialiser les filtres
//               </Button>
//             </Paper>
//           </Grid>
//         )}
//       </Grid>

//       <Dialog 
//         open={modalOpen} 
//         onClose={() => setModalOpen(false)} 
//         maxWidth="md" 
//         fullWidth
//         PaperProps={{
//           sx: {
//             borderRadius: 2,
//             overflow: 'hidden'
//           }
//         }}
//       >
//   <Box sx={{ background: 'linear-gradient(135deg, #2a3447, #2a3447',p: 2 }}>
//     <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center',pb: 0 }}>
//       {currentItem?.id_personne ? "Modifier" : "Ajouter"} une personne
//     </DialogTitle>
//   </Box>
//   <DialogContent sx={{ px: 3, py: 4 }}>
//   <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//   <Avatar 
//     src={currentItem?.photo_url || imagePreview || "/default-avatar.png"} 
//     sx={{ 
//       height: 140, 
//       width: 140,
//       border: '3px solid #fff',
//       boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
//       mb: 2,
//       bgcolor: currentItem?.badge_actif ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
//     }}
//   />
  
//   <Button
//     component="label"
//     variant="outlined"
//     startIcon={<CloudUpload />}
//     sx={{ 
//       mt: 1,
//       borderRadius: 8,
//       borderColor: 'primary.main',
//       color: 'primary.main',
//       px: 2,
//       '&:hover': {
//         backgroundColor: 'rgba(33, 150, 243, 0.08)'
//       }
//     }}
//   >
//     Télécharger une photo
//     <input
//       type="file"
//       accept="image/*"
//       hidden
//       onChange={handleImageChange}
//     />
//   </Button>
// </Box>

//           <Box display="grid" gap={2} gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)" }}>
//             <TextField
//               fullWidth
//               margin="normal"
//               name="nom"
//               label="Nom"
//               value={currentItem?.nom || ""}
//               onChange={handleInputChange}
//               required
//               error={!currentItem?.nom?.trim()}
//               helperText={!currentItem?.nom?.trim() ? "Le nom est requis" : ""}
//             />
//             <TextField
//               fullWidth
//               margin="normal"
//               name="prenom"
//               label="Prénom"
//               value={currentItem?.prenom || ""}
//               onChange={handleInputChange}
//               required
//               error={!currentItem?.prenom?.trim()}
//               helperText={!currentItem?.prenom?.trim() ? "Le prénom est requis" : ""}
//             />
//             <TextField
//               fullWidth
//               margin="normal"
//               name="date_naissance"
//               label="Date de naissance"
//               type="date"
//               InputLabelProps={{ shrink: true }}
//               value={currentItem?.date_naissance || ""}
//               onChange={handleInputChange}
//               required
//               error={!currentItem?.date_naissance}
//               helperText={!currentItem?.date_naissance ? "La date de naissance est requise" : ""}
//             />
//             <FormControl fullWidth margin="normal" required>
//               <InputLabel>Sexe</InputLabel>
//               <Select
//                 name="sexe"
//                 value={currentItem?.sexe || "Homme"}
//                 onChange={handleInputChange}
//               >
//                 <MenuItem value="Homme">Homme</MenuItem>
//                 <MenuItem value="Femme">Femme</MenuItem>
//                 <MenuItem value="Autre">Autre</MenuItem>
//               </Select>
//             </FormControl>
            
//             <TextField
//               fullWidth
//               margin="normal"
//               name="role"
//               label="Rôle"
//               value={currentItem?.role || ""}
//               onChange={handleInputChange}
//               required
//               error={!currentItem?.role?.trim()}
//               helperText={!currentItem?.role?.trim() ? "Le rôle est requis" : ""}
//             />
            
//             <FormControl fullWidth margin="normal" required>
//               <InputLabel>Autorisation</InputLabel>
//               <Select
//                 name="autorisation"
//                 value={currentItem?.autorisation || AUTHORIZATION_STATUS.NO}
//                 onChange={handleInputChange}
//                 disabled={currentItem?.badge_actif === false}
//               >
//                 <MenuItem value={AUTHORIZATION_STATUS.YES}>Oui</MenuItem>
//                 <MenuItem value={AUTHORIZATION_STATUS.NO}>Non</MenuItem>
//               </Select>
//             </FormControl>

//             {currentItem?.autorisation === AUTHORIZATION_STATUS.YES && (
//               <>
//                 {renderAuthorizationLevelSelect()}
                
//                 <TextField
//                   fullWidth
//                   margin="normal"
//                   name="plage_horaire_debut"
//                   label="Heure de début"
//                   type="time"
//                   InputLabelProps={{ shrink: true }}
//                   value={currentItem?.plage_horaire_debut || ""}
//                   onChange={handleInputChange}
//                 />
                
//                 <TextField
//                   fullWidth
//                   margin="normal"
//                   name="plage_horaire_fin"
//                   label="Heure de fin"
//                   type="time"
//                   InputLabelProps={{ shrink: true }}
//                   value={currentItem?.plage_horaire_fin || ""}
//                   onChange={handleInputChange}
//                 />

//                 <FormControl fullWidth margin="normal">
//                   <InputLabel>Restriction d'accès</InputLabel>
//                   <Select
//                     value={currentItem?.acces_limite_jour === 0 ? "illimité" : "limité"}
//                     onChange={(e) => {
//                       const isLimited = e.target.value === "limité";
//                       setCurrentItem(prev => ({
//                         ...prev,
//                         acces_limite_jour: isLimited ? 1 : 0,
//                         // Si limité, garder les jours existants ou initialiser avec un tableau vide
//                         // Si illimité, définir explicitement comme "7/7" (pas un tableau vide)
//                         jours_acces: isLimited ? (prev.jours_acces && prev.jours_acces.length > 0 ? prev.jours_acces : []) : "7/7"
//                       }));
//                     }}
//                   >
//                     <MenuItem value="illimité">Accès tous les jours (7/7)</MenuItem>
//                     <MenuItem value="limité">Accès limité à certains jours</MenuItem>
//                   </Select>
//                 </FormControl>

//                 {currentItem?.acces_limite_jour === 1 && (
//                 <FormControl fullWidth margin="normal">
//                   <InputLabel>Jours d'accès autorisés</InputLabel>
//                   <Select
//                     multiple
//                     value={Array.isArray(currentItem?.jours_acces) ? currentItem?.jours_acces : []}
//                     onChange={(e) => {
//                       const { value } = e.target;
//                       setCurrentItem(prev => ({
//                         ...prev,
//                         jours_acces: value
//                       }));
//                     }}
//                     renderValue={(selected) => selected.length > 0 ? selected.join(', ') : "Aucun jour sélectionné"}
//                   >
//                     {JOURS_SEMAINE.map((jour) => (
//                       <MenuItem key={jour} value={jour}>
//                         <Checkbox checked={Array.isArray(currentItem?.jours_acces) && currentItem?.jours_acces.includes(jour)} />
//                         <ListItemText primary={jour} />
//                       </MenuItem>
//                     ))}
//                 </Select>
//               </FormControl>
//               )}
//               </>
//             )}

//             <FormControl fullWidth margin="normal">
//               <InputLabel>Statut du Badge</InputLabel>
//               <Select
//                 name="badge_actif"
//                 value={currentItem?.badge_actif || false}
//                 onChange={handleInputChange}
//               >
//                 <MenuItem value={true}>{BADGE_STATUS.ACTIVE}</MenuItem>
//                 <MenuItem value={false}>{BADGE_STATUS.INACTIVE}</MenuItem>
//               </Select>
//             </FormControl>
//           </Box>

//           <FormControl fullWidth margin="normal" required error={!currentItem?.zones_acces?.length}>
//             <InputLabel>Zones d'Accès</InputLabel>
//             <Select
//               multiple
//               name="zones_acces"
//               value={currentItem?.zones_acces || []}
//               onChange={handleMultiSelectChange}
//               renderValue={selected => (
//                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
//                   {selected.map(value => (
//                     <Chip key={value} label={value} />
//                   ))}
//                 </Box>
//               )}
//             >
//               {ZONES_ACCES.map(zone => (
//                 <MenuItem key={zone} value={zone}>
//                   {zone}
//                 </MenuItem>
//               ))}
//             </Select>
//             {!currentItem?.zones_acces?.length && (
//               <small style={{color: 'red', marginLeft: '14px'}}>
//                 Au moins une zone d'accès est requise
//               </small>
//             )}
//           </FormControl>
          
//           {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setModalOpen(false)} color="secondary">
//             Annuler
//           </Button>
//           <Button onClick={handleSave} color="primary" disabled={loading.action}>
//             {loading.action ? <CircularProgress size={24} /> : "Sauvegarder"}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
//         <DialogTitle>Confirmer la suppression</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Êtes-vous sûr de vouloir supprimer cette personne ?
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setDeleteConfirmOpen(false)} color="secondary">
//             Annuler
//           </Button>
//           <Button onClick={handleDelete} color="primary" disabled={loading.action}>
//             {loading.action ? <CircularProgress size={24} /> : "Supprimer"}
//           </Button>
//         </DialogActions>
//       </Dialog>
//       <Snackbar 
//         open={notification.open} 
//         autoHideDuration={5000} 
//         onClose={() => setNotification(prev => ({ ...prev, open: false }))}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//         sx={{ zIndex: 9999 }}
//       >
//         <Alert 
//           severity={notification.severity} 
//           sx={{ width: '100%' }}
//           onClose={() => setNotification(prev => ({ ...prev, open: false }))}
//         >
//           {notification.message}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default PersonnesManagement;










import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  Accordion,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  DialogContentText,
  FormControlLabel,
  Snackbar
} from "@mui/material";
import { 
  AddCircleOutline, 
  Delete, 
  Edit, 
  Lock, 
  LockOpen,
  FilterList,
  ExpandMore,
  CloudUpload,
  PhotoCamera // Ajoutez cette icône
} from "@mui/icons-material";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BADGE_STATUS = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif"
};

const AUTHORIZATION_STATUS = {
  YES: "Oui",
  NO: "Non"
};

const AUTHORIZATION_LEVELS = {
  NONE: "Aucun",
  BASIC: "Accès Basique",
  ADVANCED: "Accès Avancé",
  ADMIN: "Accès Admin"
};

const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const ZONES_ACCES = [
  "Entrée principale",
  "Bureaux administratifs",
  "Laboratoires",
  "Salles de réunion",
  "Zone sécurisée",
  "Cafétéria",
  "Parking"
];

const PersonnesManagement = () => {
  const navigate = useNavigate();
  const [personnes, setPersonnes] = useState([]);
  const [filteredPersonnes, setFilteredPersonnes] = useState([]);
  const [loading, setLoading] = useState({ main: true, action: false });
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personneToDelete, setPersonneToDelete] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [filters, setFilters] = useState({
    searchText: '',
    badgeStatus: [],
    authorizationStatus: [],
    roles: [],
    authorizationLevels: []
  });
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchPersonnes = async () => {
      try {
        setLoading(prev => ({ ...prev, main: true }));
        const response = await axios.get(`/api/personnes/`);
        
        const processedPersonnes = response.data.map(personne => ({
          ...personne,
          zones_acces: personne.zones_acces 
            ? typeof personne.zones_acces === 'string'
              ? personne.zones_acces.split(',').filter(zone => zone.trim()) 
              : personne.zones_acces
            : [],
          jours_acces: personne.jours_acces 
            ? personne.jours_acces === "7/7"
              ? "7/7"
              : (typeof personne.jours_acces === 'string'
                ? personne.jours_acces.split(',').filter(jour => jour.trim())
                : personne.jours_acces)
            : [],
          plage_horaire_debut: personne.plage_horaire_debut || "",
          plage_horaire_fin: personne.plage_horaire_fin || "",
        }));
        
        setPersonnes(processedPersonnes);
        setFilteredPersonnes(processedPersonnes);
        extractUniqueData(processedPersonnes);
        setLoading(prev => ({ ...prev, main: false }));
      } catch (err) {
        setError("Erreur lors du chargement des données");
        console.error(err);
        setLoading(prev => ({ ...prev, main: false }));
      }
    };

    fetchPersonnes();
  }, []);

  const extractUniqueData = (personnes) => {
    const uniqueRoles = [...new Set(personnes.map(p => p.role).filter(Boolean))];
    const uniqueAuthLevels = [...new Set(personnes.map(p => p.niveau_autorisation).filter(Boolean))];
    setFilters(prev => ({
      ...prev,
      roles: [],
      authorizationLevels: []
    }));
  };

  useEffect(() => {
    if (personnes.length === 0) return;

    const filtered = personnes.filter(personne => {
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        if (!personne.nom?.toLowerCase().includes(searchLower) && 
            !personne.prenom?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.badgeStatus.length > 0) {
        const badgeStatus = personne.badge_actif ? BADGE_STATUS.ACTIVE : BADGE_STATUS.INACTIVE;
        if (!filters.badgeStatus.includes(badgeStatus)) return false;
      }

      if (filters.authorizationStatus.length > 0) {
        if (!filters.authorizationStatus.includes(personne.autorisation)) return false;
      }

      if (filters.roles.length > 0) {
        if (!filters.roles.includes(personne.role)) return false;
      }

      if (filters.authorizationLevels.length > 0) {
        if (!filters.authorizationLevels.includes(personne.niveau_autorisation)) return false;
      }

      return true;
    });

    setFilteredPersonnes(filtered);
  }, [filters, personnes]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchText: '',
      badgeStatus: [],
      authorizationStatus: [],
      roles: [],
      authorizationLevels: []
    });
  };

  const handleAddNew = () => {
    setCurrentItem({
      nom: "",
      prenom: "",
      date_naissance: "",
      sexe: "Homme",
      role: "Visiteur",
      niveau_autorisation: AUTHORIZATION_LEVELS.NONE,
      autorisation: AUTHORIZATION_STATUS.NO,
      zones_acces: [],
      jours_acces: [],
      limite_acces_jours: false,
      plage_horaire_debut: "",
      plage_horaire_fin: "",
      badge_actif: false,
      photo_url: null
    });
    setImagePreview(null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setCurrentItem(prev => ({
          ...prev,
          photo: file,
          photo_url: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);
  
    if (!validateForm()) {
      let errorMessage = "Tous les champs obligatoires doivent être remplis.";
      if (currentItem?.limite_acces_jours === true && 
          (Array.isArray(currentItem?.jours_acces) && currentItem?.jours_acces.length === 0)) {
        errorMessage = "Veuillez sélectionner au moins un jour d'accès lorsque l'accès est limité";
      }
      setError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      setLoading(prev => ({ ...prev, action: false }));
      return;
    }
  
    try {
      const formData = new FormData();
      
      // Ajouter tous les champs au FormData
      formData.append('nom', currentItem.nom);
      formData.append('prenom', currentItem.prenom);
      formData.append('sexe', currentItem.sexe);
      formData.append('role', currentItem.role);
      formData.append('niveau_autorisation', currentItem.niveau_autorisation);
      formData.append('autorisation', currentItem.autorisation);
      formData.append('date_naissance', currentItem.date_naissance);
      formData.append('badge_actif', currentItem.badge_actif);
      formData.append('limite_acces_jours', currentItem.limite_acces_jours);
      
      // Formater les plages horaires
      if (currentItem.plage_horaire_debut) {
        formData.append('plage_horaire_debut', `${currentItem.plage_horaire_debut}:00`);
    }
    if (currentItem.plage_horaire_fin) {
        formData.append('plage_horaire_fin', `${currentItem.plage_horaire_fin}:00`);
    }
      
      // Formater les zones d'accès
      if (currentItem.zones_acces) {
        formData.append('zones_acces', 
          Array.isArray(currentItem.zones_acces) 
            ? currentItem.zones_acces.join(',') 
            : currentItem.zones_acces
        );
      }
      
      // Formater les jours d'accès
      if (currentItem.jours_acces) {
        formData.append('jours_acces', 
          currentItem.limite_acces_jours === false 
            ? "7/7" 
            : (Array.isArray(currentItem.jours_acces) 
                ? currentItem.jours_acces.join(',') 
                : currentItem.jours_acces)
        );
      }
  
      // Ajouter la photo si elle existe
      const photoChanged = !!currentItem.photo;
      if (currentItem.photo) {
        formData.append('photo', currentItem.photo);
      }
      
      let response;
      if (currentItem.id_personne) {
        // Mise à jour
        response = await axios.put(`/api/personnes/${currentItem.id_personne}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Création
        response = await axios.post(`/api/personnes/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      // Si c'est une mise à jour avec une nouvelle photo, on force le cache à se rafraîchir
      if (currentItem.id_personne && photoChanged) {
        const timestamp = new Date().getTime();
        const photoUrl = `/api/personnes/photo/${currentItem.id_personne}?t=${timestamp}`;
        
        // On met à jour la personne dans la liste avec la nouvelle URL
        setPersonnes(prev => prev.map(p => 
          p.id_personne === currentItem.id_personne 
            ? { ...p, photo_url: photoUrl } 
            : p
        ));
      } else {
        // Recharger la liste des personnes
        const updatedResponse = await axios.get(`/api/personnes/`);
        const processedPersonnes = updatedResponse.data.map(personne => ({
          ...personne,
          zones_acces: personne.zones_acces 
            ? typeof personne.zones_acces === 'string'
              ? personne.zones_acces.split(',').filter(zone => zone.trim()) 
              : personne.zones_acces
            : [],
          jours_acces: personne.jours_acces 
            ? personne.jours_acces === "7/7"
              ? "7/7"
              : (typeof personne.jours_acces === 'string'
                ? personne.jours_acces.split(',').filter(jour => jour.trim())
                : personne.jours_acces)
            : []
        }));
        
        setPersonnes(processedPersonnes);
      }
      
      setModalOpen(false);
      setCurrentItem(null);
      setImagePreview(null);
      
      setNotification({
        open: true,
        message: currentItem?.id_personne ? "Personne modifiée avec succès" : "Personne ajoutée avec succès",
        severity: 'success'
      });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Erreur lors de la sauvegarde";
      setError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const validateForm = () => {
    // Vérification des champs obligatoires de base
    const requiredFields = [
      currentItem?.nom?.trim(),
      currentItem?.prenom?.trim(),
      currentItem?.date_naissance,
      currentItem?.sexe,
      currentItem?.role?.trim(),
      currentItem?.zones_acces?.length > 0
    ];
    
    // Si un champ obligatoire est manquant
    if (!requiredFields.every(field => field)) {
      return false;
    }
  
    // Validation supplémentaire si l'autorisation est "Oui"
    if (currentItem?.autorisation === AUTHORIZATION_STATUS.YES) {
      // Vérification des jours d'accès si l'accès est limité
      if (currentItem?.limite_acces_jours && 
          (!Array.isArray(currentItem?.jours_acces) || currentItem?.jours_acces.length === 0)) {
        return false;
      }
    }
  
    return true;
  };


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setCurrentItem(prev => {
      let newState = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      if (name === 'autorisation' && value === AUTHORIZATION_STATUS.NO) {
        newState = {
          ...newState,
          niveau_autorisation: AUTHORIZATION_LEVELS.NONE,
          plage_horaire_debut: "",
          plage_horaire_fin: "",
          limite_acces_jours: false,
          jours_acces: []
        };
      }
      else if (name === 'badge_actif') {
        const boolValue = value === 'true' || value === true;
        
        if (!boolValue) {
          newState = {
            ...newState,
            badge_actif: false,
            autorisation: AUTHORIZATION_STATUS.NO,
            niveau_autorisation: AUTHORIZATION_LEVELS.NONE,
            plage_horaire_debut: "",
            plage_horaire_fin: "",
            limite_acces_jours: false,
            jours_acces: []
          };
        } else {
          newState.badge_actif = true;
        }
      }
      
      return newState;
    });
  };

  const handleMultiSelectChange = (e) => {
    const { value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      zones_acces: value
    }));
  };

  const handleJourChange = (jour) => {
    setCurrentItem(prev => {
      const nouveauxJours = prev.jours_acces.includes(jour)
        ? prev.jours_acces.filter(j => j !== jour)
        : [...prev.jours_acces, jour];
      
      return { ...prev, jours_acces: nouveauxJours };
    });
  };

  const handleDelete = async () => {
    if (!personneToDelete) return;
  
    setLoading(prev => ({ ...prev, action: true }));
    try {
      await axios.delete(`/api/personnes/${personneToDelete}`);
      
      setPersonnes(prev => prev.filter(p => p.id_personne !== personneToDelete));
      setDeleteConfirmOpen(false);
      setPersonneToDelete(null);
      
      setNotification({
        open: true,
        message: "Personne supprimée avec succès",
        severity: 'success'
      });
    } catch (err) {
      const errorMessage = "Erreur lors de la suppression";
      setError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const confirmDelete = (personneId) => {
    setPersonneToDelete(personneId);
    setDeleteConfirmOpen(true);
  };

  const renderAuthorizationLevelSelect = () => {
    const isDisabled = currentItem?.badge_actif === false || 
                      currentItem?.autorisation === AUTHORIZATION_STATUS.NO;
    
    const authorizationLevels = isDisabled
      ? [AUTHORIZATION_LEVELS.NONE]
      : [
          AUTHORIZATION_LEVELS.NONE,
          AUTHORIZATION_LEVELS.BASIC, 
          AUTHORIZATION_LEVELS.ADVANCED, 
          AUTHORIZATION_LEVELS.ADMIN
        ];
  
        return (
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Niveau d'Autorisation</InputLabel>
            <Select
              name="niveau_autorisation"
              value={currentItem?.niveau_autorisation || AUTHORIZATION_LEVELS.NONE}
              onChange={handleInputChange}
              disabled={isDisabled}
            >
              {authorizationLevels.map(level => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      };

      if (loading.main) {
        return (
          <Box 
            display="flex" 
            flexDirection="column" 
            justifyContent="center" 
            alignItems="center" 
            height="80vh"
          >
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" color="text.secondary" mt={3}>
              Chargement des données...
            </Typography>
          </Box>
        );
      }

  return (
    <Box>
      <Box>
    {/* ★ Début du nouveau code ★ */}
    <Box sx={{ 
      mb: 4, 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold',
          position: 'relative',
          pb: 2,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '4px',
            backgroundColor: 'primary.main',
            borderRadius: '2px'
          }
        }}
      >
        Gestion des Personnes
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        Gérez les accès et les autorisations du personnel
      </Typography>
      
      <Chip 
        label={`${filteredPersonnes.length} personne${filteredPersonnes.length > 1 ? 's' : ''}`} 
        color="primary" 
        variant="outlined"
        sx={{ mb: 3 }}
      />
    </Box>

    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Recherche */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Rechercher..."
            value={filters.searchText}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
            InputProps={{
              startAdornment: <FilterList color="action" sx={{ mr: 1 }} />,
              endAdornment: filters.searchText && (
                <IconButton size="small" onClick={() => handleFilterChange('searchText', '')}>
                  <Delete fontSize="small" />
                </IconButton>
              )
            }}
          />
        </Grid>
        
        {/* Bouton Ajouter */}
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddCircleOutline />}
            onClick={handleAddNew}
          >
            Ajouter
          </Button>
        </Grid>
        
        {/* Bouton Filtres (existant) */}
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant={expandedFilter ? "contained" : "outlined"}
            startIcon={<FilterList />}
            onClick={() => setExpandedFilter(!expandedFilter)}
          >
            Filtres
          </Button>
        </Grid>
      </Grid>
    </Paper>
    </Box>

      <Accordion expanded={expandedFilter} onChange={() => setExpandedFilter(!expandedFilter)}>
        <Divider />
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recherche (nom ou prénom)"
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                  multiple
                  value={filters.roles}
                  onChange={(e) => handleFilterChange('roles', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {[...new Set(personnes.map(p => p.role).filter(Boolean))].map(role => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={filters.roles.includes(role)} />
                      <ListItemText primary={role} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Statut du badge</InputLabel>
                <Select
                  multiple
                  value={filters.badgeStatus}
                  onChange={(e) => handleFilterChange('badgeStatus', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {Object.values(BADGE_STATUS).map(status => (
                    <MenuItem key={status} value={status}>
                      <Checkbox checked={filters.badgeStatus.includes(status)} />
                      <ListItemText primary={status} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Autorisation</InputLabel>
                <Select
                  multiple
                  value={filters.authorizationStatus}
                  onChange={(e) => handleFilterChange('authorizationStatus', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {Object.values(AUTHORIZATION_STATUS).map(status => (
                    <MenuItem key={status} value={status}>
                      <Checkbox checked={filters.authorizationStatus.includes(status)} />
                      <ListItemText primary={status} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Niveau d'autorisation</InputLabel>
                <Select
                  multiple
                  value={filters.authorizationLevels}
                  onChange={(e) => handleFilterChange('authorizationLevels', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {[...new Set(personnes.map(p => p.niveau_autorisation).filter(Boolean))].map(level => (
                    <MenuItem key={level} value={level}>
                      <Checkbox checked={filters.authorizationLevels.includes(level)} />
                      <ListItemText primary={level} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={resetFilters}
                disabled={
                  !filters.searchText &&
                  filters.badgeStatus.length === 0 &&
                  filters.authorizationStatus.length === 0 &&
                  filters.roles.length === 0 &&
                  filters.authorizationLevels.length === 0
                }
              >
                Réinitialiser les filtres
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Accordion>

      <Box my={2}>
        <Typography variant="subtitle1" >
          {filteredPersonnes.length} personne(s) trouvée(s)
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {filteredPersonnes.length > 0 ? (
          filteredPersonnes.map(personne => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={personne.id_personne}>
              <Card sx={{ 
                  backgroundColor: '#1e293b',
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                   
                  },
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    pt: 3,
                    pb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <Avatar 
                    src={
                      personne.photo_url 
                        ? `/api/personnes/photo/${personne.id_personne}${personne.photo_url.includes('?t=') ? '' : `?t=${new Date().getTime()}`}`
                        : null
                    } 
                    sx={{ 
                      height: 120, 
                      width: 120,
                      border: '3px solid #fff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      mb: 1
                    }}
                    alt={`${personne.prenom} ${personne.nom}`}
                  />
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'black' }}>
                      {personne.prenom} {personne.nom}
                    </Typography>
                    <Chip 
                      label={personne.role} 
                      size="small" 
                      color="primary" 
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Stack spacing={2} mt={1}>
                    {/* Ligne d'autorisation - toujours affichée */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Autorisation:</Typography>
                      <Chip 
                        label={personne.autorisation || AUTHORIZATION_STATUS.NO} 
                        size="small" 
                        color={personne.autorisation === AUTHORIZATION_STATUS.YES ? "success" : "default"}
                      />
                    </Box>

                    {/* Ligne de niveau - toujours affichée mais conditionnelle */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Niveau:</Typography>
                      {personne.autorisation === AUTHORIZATION_STATUS.YES ? (
                        <Chip 
                          label={personne.niveau_autorisation || AUTHORIZATION_LEVELS.NONE} 
                          size="small" 
                          color="primary"
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">Non applicable</Typography>
                      )}
                    </Box>

                    {/* Ligne des jours d'accès - toujours affichée mais conditionnelle */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Jours d'accès:</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {personne.autorisation === AUTHORIZATION_STATUS.YES
                          ? (personne.jours_acces === "7/7" 
                              ? "Tous les jours (7/7)"
                              : (Array.isArray(personne.jours_acces) && personne.jours_acces.length > 0
                                  ? personne.jours_acces.join(', ')
                                  : "Aucun jour spécifié"))
                          : "Non applicable"}
                      </Typography>
                    </Box>

                    {/* Ligne du badge - toujours affichée */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">Badge:</Typography>
                      {personne.badge_actif ? 
                        <Chip 
                          icon={<LockOpen sx={{ fontSize: 16 }} />} 
                          label={BADGE_STATUS.ACTIVE} 
                          color="success" 
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                            '& .MuiChip-icon': { color: 'inherit' }
                          }} 
                        /> : 
                        <Chip 
                          icon={<Lock sx={{ fontSize: 16 }} />} 
                          label={BADGE_STATUS.INACTIVE} 
                          color="error" 
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                            '& .MuiChip-icon': { color: 'inherit' }
                          }}
                        />
                      }
                    </Box>
                  </Stack>

                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        width: '100%',
                        mt: 2,
                        px: 1
                      }}
                    >
                    <IconButton
                      onClick={() => {
                        setCurrentItem({
                          ...personne,
                          zones_acces: Array.isArray(personne.zones_acces) ? personne.zones_acces : [],
                          jours_acces: personne.jours_acces === "7/7" 
                            ? [] 
                            : (Array.isArray(personne.jours_acces) 
                                ? personne.jours_acces 
                                : []),
                          limite_acces_jours: personne.jours_acces !== "7/7",
                          plage_horaire_debut: personne.plage_horaire_debut || "",
                          plage_horaire_fin: personne.plage_horaire_fin || ""
                        });
                        setModalOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => confirmDelete(personne.id_personne)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        const newWindow = window.open(
                          `/personnes/${personne.id_personne}/photos`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                        
                        if (!newWindow) {
                          setNotification({
                            open: true,
                            message: 'Votre navigateur a bloqué la fenêtre popup. Veuillez autoriser les popups pour ce site.',
                            severity: 'warning'
                          });
                        }
                      }}
                      color="primary"
                    >
                      <PhotoCamera />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">Aucune personne ne correspond aux critères de recherche</Typography>
              <Button onClick={resetFilters} sx={{ mt: 2 }}>
                Réinitialiser les filtres
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
  <Box sx={{ background: 'linear-gradient(135deg, #2a3447, #2a3447',p: 2 }}>
    <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center',pb: 0 }}>
      {currentItem?.id_personne ? "Modifier" : "Ajouter"} une personne
    </DialogTitle>
  </Box>
  <DialogContent sx={{ px: 3, py: 4 }}>
  <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

<Avatar 
  src={
    imagePreview || 
    (currentItem?.id_personne && currentItem?.photo_url 
      ? `/api/personnes/photo/${currentItem.id_personne}?t=${new Date().getTime()}`
      : null
  )} 
  sx={{ 
    height: 140, 
    width: 140,
    border: '3px solid #fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    mb: 2,
    bgcolor: currentItem?.badge_actif ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
  }}
  alt={currentItem ? `${currentItem.prenom} ${currentItem.nom}` : 'Photo de profil'}
/>
  
  <Button
    component="label"
    variant="outlined"
    startIcon={<CloudUpload />}
    sx={{ 
      mt: 1,
      borderRadius: 8,
      borderColor: 'primary.main',
      color: 'primary.main',
      px: 2,
      '&:hover': {
        backgroundColor: 'rgba(33, 150, 243, 0.08)'
      }
    }}
  >
    Télécharger une photo
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={handleImageChange}
    />
  </Button>
</Box>

          <Box display="grid" gap={2} gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)" }}>
            <TextField
              fullWidth
              margin="normal"
              name="nom"
              label="Nom"
              value={currentItem?.nom || ""}
              onChange={handleInputChange}
              required
              error={!currentItem?.nom?.trim()}
              helperText={!currentItem?.nom?.trim() ? "Le nom est requis" : ""}
            />
            <TextField
              fullWidth
              margin="normal"
              name="prenom"
              label="Prénom"
              value={currentItem?.prenom || ""}
              onChange={handleInputChange}
              required
              error={!currentItem?.prenom?.trim()}
              helperText={!currentItem?.prenom?.trim() ? "Le prénom est requis" : ""}
            />
            <TextField
              fullWidth
              margin="normal"
              name="date_naissance"
              label="Date de naissance"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={currentItem?.date_naissance || ""}
              onChange={handleInputChange}
              required
              error={!currentItem?.date_naissance}
              helperText={!currentItem?.date_naissance ? "La date de naissance est requise" : ""}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Sexe</InputLabel>
              <Select
                name="sexe"
                value={currentItem?.sexe || "Homme"}
                onChange={handleInputChange}
              >
                <MenuItem value="Homme">Homme</MenuItem>
                <MenuItem value="Femme">Femme</MenuItem>
                <MenuItem value="Autre">Autre</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              name="role"
              label="Rôle"
              value={currentItem?.role || ""}
              onChange={handleInputChange}
              required
              error={!currentItem?.role?.trim()}
              helperText={!currentItem?.role?.trim() ? "Le rôle est requis" : ""}
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Autorisation</InputLabel>
              <Select
                name="autorisation"
                value={currentItem?.autorisation || AUTHORIZATION_STATUS.NO}
                onChange={handleInputChange}
                disabled={currentItem?.badge_actif === false}
              >
                <MenuItem value={AUTHORIZATION_STATUS.YES}>Oui</MenuItem>
                <MenuItem value={AUTHORIZATION_STATUS.NO}>Non</MenuItem>
              </Select>
            </FormControl>

            {currentItem?.autorisation === AUTHORIZATION_STATUS.YES && (
              <>
                {renderAuthorizationLevelSelect()}
                
                <TextField
                  fullWidth
                  margin="normal"
                  name="plage_horaire_debut"
                  label="Heure de début"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                  value={currentItem?.plage_horaire_debut || ""}
                  onChange={handleInputChange}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  name="plage_horaire_fin"
                  label="Heure de fin"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={currentItem?.plage_horaire_fin || ""}
                  onChange={handleInputChange}
                />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Restriction d'accès</InputLabel>
                    <Select
                      value={currentItem?.limite_acces_jours ? "limité" : "illimité"}
                      onChange={(e) => {
                        const isLimited = e.target.value === "limité";
                        setCurrentItem(prev => ({
                          ...prev,
                          limite_acces_jours: isLimited,
                          jours_acces: isLimited ? (prev.jours_acces || []) : []
                        }));
                      }}
                    >
                      <MenuItem value="illimité">Accès tous les jours (7/7)</MenuItem>
                      <MenuItem value="limité">Accès limité à certains jours</MenuItem>
                    </Select>
                  </FormControl>

                  {currentItem?.limite_acces_jours && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Jours d'accès autorisés</InputLabel>
                    <Select
                      multiple
                      value={Array.isArray(currentItem?.jours_acces) ? currentItem?.jours_acces : []}
                      onChange={(e) => {
                        const { value } = e.target;
                        setCurrentItem(prev => ({
                          ...prev,
                          jours_acces: value
                        }));
                      }}
                      renderValue={(selected) => selected.length > 0 ? selected.join(', ') : "Aucun jour sélectionné"}
                    >
                      {JOURS_SEMAINE.map((jour) => (
                        <MenuItem key={jour} value={jour}>
                          <Checkbox checked={Array.isArray(currentItem?.jours_acces) && currentItem?.jours_acces.includes(jour)} />
                          <ListItemText primary={jour} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
  )}
              </>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Statut du Badge</InputLabel>
              <Select
                name="badge_actif"
                value={currentItem?.badge_actif || false}
                onChange={handleInputChange}
              >
                <MenuItem value={true}>{BADGE_STATUS.ACTIVE}</MenuItem>
                <MenuItem value={false}>{BADGE_STATUS.INACTIVE}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControl fullWidth margin="normal" required error={!currentItem?.zones_acces?.length}>
            <InputLabel>Zones d'Accès</InputLabel>
            <Select
              multiple
              name="zones_acces"
              value={currentItem?.zones_acces || []}
              onChange={handleMultiSelectChange}
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map(value => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {ZONES_ACCES.map(zone => (
                <MenuItem key={zone} value={zone}>
                  {zone}
                </MenuItem>
              ))}
            </Select>
            {!currentItem?.zones_acces?.length && (
              <small style={{color: 'red', marginLeft: '14px'}}>
                Au moins une zone d'accès est requise
              </small>
            )}
          </FormControl>
          
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSave} color="primary" disabled={loading.action}>
            {loading.action ? <CircularProgress size={24} /> : "Sauvegarder"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette personne ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="primary" disabled={loading.action}>
            {loading.action ? <CircularProgress size={24} /> : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar 
        open={notification.open} 
        autoHideDuration={5000} 
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ zIndex: 9999 }}
      >
        <Alert 
          severity={notification.severity} 
          sx={{ width: '100%' }}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PersonnesManagement;
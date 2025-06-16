// // import React, { useEffect, useState } from "react";
// // import {
// //   Box,
// //   Typography,
// //   Button,
// //   Paper,
// //   CircularProgress,
// //   Dialog,
// //   FormGroup,
// //   FormControlLabel,
// //   Checkbox,
// //   Stack,
// //   TextField,
// //   Divider,
// //   IconButton,
// //   Card,
// //   CardContent,
// //   Grid,
// //   Chip,
// //   DialogContent
// // } from "@mui/material";
// // import { 
// //   FilterList, 
// //   ExpandMore, 
// //   CloudUpload 
// // } from "@mui/icons-material";
// // import axios from 'axios';

// // const formatDate = (dateString) => {
// //   const date = new Date(dateString);
// //   return date.toLocaleString();
// // };

// // const isWithinDateRange = (timestamp, startDate, endDate) => {
// //   if (!startDate) return true;
  
// //   const date = new Date(timestamp);
// //   const start = new Date(startDate);
// //   start.setHours(0, 0, 0, 0);
  
// //   if (!endDate) {
// //     const endOfDay = new Date(startDate);
// //     endOfDay.setHours(23, 59, 59, 999);
// //     return date >= start && date <= endOfDay;
// //   }
  
// //   const end = new Date(endDate);
// //   end.setHours(23, 59, 59, 999);
// //   return date >= start && date <= end;
// // };

// // const LogsPage = () => {
// //   const [logs, setLogs] = useState([]);
// //   const [filteredLogs, setFilteredLogs] = useState([]);
// //   const [loading, setLoading] = useState(false);
// //   const [filters, setFilters] = useState({
// //     person: false,
// //     face: false,
// //     object: false,
// //   });
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [sortAsc, setSortAsc] = useState(false);
// //   const [dialogOpen, setDialogOpen] = useState(false);
// //   const [selectedImage, setSelectedImage] = useState(null);
  
// //   // Filtres de date (format string pour éviter les problèmes d'importation)
// //   const [startDate, setStartDate] = useState("");
// //   const [endDate, setEndDate] = useState("");
// //   const [dateFilterOpen, setDateFilterOpen] = useState(false);

// //   useEffect(() => {
// //     fetchLogs();
// //   }, []);

// //   useEffect(() => {
// //     applyFilters();
// //   }, [logs, filters, searchTerm, sortAsc, startDate, endDate]);

// //   const fetchLogs = async () => {
// //     setLoading(true);
// //     try {
// //       // Utilisation d'axios au lieu de fetch
// //       const res = await axios.get("http://127.0.0.1:8000/logs");
// //       setLogs(res.data);
// //     } catch (error) {
// //       console.error("Erreur récupération logs :", error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const applyFilters = () => {
// //     const activeFilters = Object.entries(filters)
// //       .filter(([_, value]) => value)
// //       .map(([key]) => key);

// //     let filtered = [...logs];

// //     if (activeFilters.length > 0) {
// //       filtered = filtered.filter((log) =>
// //         activeFilters.every((filter) => log.detections.includes(filter))
// //       );
// //     }

// //     if (searchTerm.trim() !== "") {
// //       filtered = filtered.filter((log) =>
// //         log.detections.some((det) =>
// //           det.toLowerCase().includes(searchTerm.toLowerCase())
// //         )
// //       );
// //     }

// //     // Filtrage par date
// //     if (startDate) {
// //       filtered = filtered.filter((log) => 
// //         isWithinDateRange(log.timestamp, startDate, endDate)
// //       );
// //     }

// //     setFilteredLogs(sortLogs(filtered));
// //   };

// //   const sortLogs = (list) => {
// //     return [...list].sort((a, b) => {
// //       const dateA = new Date(a.timestamp);
// //       const dateB = new Date(b.timestamp);
// //       return sortAsc ? dateA - dateB : dateB - dateA;
// //     });
// //   };

// //   const handleFilterChange = (key) => {
// //     setFilters((prev) => ({
// //       ...prev,
// //       [key]: !prev[key],
// //     }));
// //   };

// //   const resetFilters = () => {
// //     setFilters({
// //       person: false,
// //       face: false,
// //       object: false,
// //     });
// //     setSearchTerm("");
// //     setStartDate("");
// //     setEndDate("");
// //   };

// //   const handleImageClick = (base64Image) => {
// //     setSelectedImage(`data:image/jpeg;base64,${base64Image}`);
// //     setDialogOpen(true);
// //   };

// //   const countByClass = {
// //     person: logs.filter((log) => log.detections.includes("person")).length,
// //     face: logs.filter((log) => log.detections.includes("face")).length,
// //     object: logs.filter(
// //       (log) => log.detections.some((d) => d !== "person" && d !== "face")
// //     ).length,
// //   };

// //   const handleDateFilterOpen = () => {
// //     setDateFilterOpen(true);
// //   };

// //   const handleDateFilterClose = () => {
// //     setDateFilterOpen(false);
// //   };

// //   const handleApplyDates = () => {
// //     setDateFilterOpen(false);
// //   };

// //   const handleClearDates = () => {
// //     setStartDate("");
// //     setEndDate("");
// //     setDateFilterOpen(false);
// //   };

// //   return (
// //     <Box sx={{ padding: 4 }}>
// //       <Typography variant="h4" gutterBottom>
// //         📜 Historique des Logs
// //       </Typography>

// //       <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
// //         <Typography variant="body2">Total logs : {logs.length}</Typography>
// //         <Typography variant="body2">Logs affichés : {filteredLogs.length}</Typography>
// //         <Typography variant="body2">👤 Personne : {countByClass.person}</Typography>
// //         <Typography variant="body2">🧠 Visage : {countByClass.face}</Typography>
// //         <Typography variant="body2">📦 Objet : {countByClass.object}</Typography>
        
// //         <Button
// //           size="small"
// //           variant="outlined"
// //           onClick={() => setSortAsc((prev) => !prev)}
// //         >
// //           Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
// //         </Button>

// //         {/* Bouton pour ouvrir le dialogue de sélection de date */}
// //         <Button
// //           variant="outlined"
// //           onClick={handleDateFilterOpen}
// //           startIcon={<FilterList />}
// //         >
// //           {!startDate ? "Filtrer par date" : 
// //            !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
// //            `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
// //         </Button>
// //       </Stack>

// //       <FormGroup row sx={{ mb: 2 }}>
// //         <FormControlLabel
// //           control={
// //             <Checkbox
// //               checked={filters.person}
// //               onChange={() => handleFilterChange("person")}
// //             />
// //           }
// //           label="Personne"
// //         />
// //         <FormControlLabel
// //           control={
// //             <Checkbox
// //               checked={filters.face}
// //               onChange={() => handleFilterChange("face")}
// //             />
// //           }
// //           label="Visage"
// //         />
// //         <FormControlLabel
// //           control={
// //             <Checkbox
// //               checked={filters.object}
// //               onChange={() => handleFilterChange("object")}
// //             />
// //           }
// //           label="Objet"
// //         />
// //         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
// //           Réinitialiser
// //         </Button>
// //       </FormGroup>

// //       <TextField
// //         fullWidth
// //         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
// //         value={searchTerm}
// //         onChange={(e) => setSearchTerm(e.target.value)}
// //         sx={{ mb: 3 }}
// //       />

// //       {loading && (
// //         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
// //           <CircularProgress />
// //         </Box>
// //       )}

// //       {!loading && filteredLogs.length === 0 && (
// //         <Typography>Aucun log ne correspond aux critères.</Typography>
// //       )}

// //       {!loading &&
// //         filteredLogs.map((log, index) => (
// //           <Paper key={index} sx={{ p: 2, mb: 2 }}>
// //             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //               <Box>
// //                 <Typography variant="body2" sx={{ mb: 1 }}>
// //                   📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
// //                 </Typography>
// //                 <Stack direction="row" spacing={1}>
// //                   {log.detections.map((detection, idx) => (
// //                     <Chip 
// //                       key={idx} 
// //                       label={detection} 
// //                       size="small" 
// //                       color={
// //                         detection === "person" ? "primary" : 
// //                         detection === "face" ? "secondary" : "default"
// //                       }
// //                     />
// //                   ))}
// //                 </Stack>
// //               </Box>
// //               <Box
// //                 component="img"
// //                 src={`data:image/jpeg;base64,${log.image_base64}`}
// //                 alt="Miniature"
// //                 onClick={() => handleImageClick(log.image_base64)}
// //                 sx={{
// //                   width: 80,
// //                   height: 80,
// //                   objectFit: "cover",
// //                   borderRadius: 1,
// //                   cursor: "pointer",
// //                   "&:hover": {
// //                     opacity: 0.8,
// //                     border: "1px solid #1976d2"
// //                   }
// //                 }}
// //               />
// //             </Box>
// //           </Paper>
// //         ))}

// //       {/* Dialog pour afficher l'image en grand */}
// //       <Dialog
// //         open={dialogOpen}
// //         onClose={() => setDialogOpen(false)}
// //         maxWidth="lg"
// //       >
// //         <DialogContent>
// //           {selectedImage && (
// //             <img
// //               src={selectedImage}
// //               alt="Zoom image"
// //               style={{ 
// //                 width: '100%', 
// //                 maxHeight: '80vh',
// //                 objectFit: 'contain',
// //                 borderRadius: 8 
// //               }}
// //             />
// //           )}
// //         </DialogContent>
// //       </Dialog>

// //       {/* Dialog pour le filtre de date */}
// //       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
// //         <DialogContent>
// //           <Typography variant="h6" sx={{ mb: 2 }}>
// //             Filtrer par date
// //           </Typography>
          
// //           <TextField
// //             label="Date de début"
// //             type="date"
// //             value={startDate}
// //             onChange={(e) => setStartDate(e.target.value)}
// //             InputLabelProps={{ shrink: true }}
// //             fullWidth
// //             sx={{ mb: 2 }}
// //           />
          
// //           <TextField
// //             label="Date de fin (optionnel)"
// //             type="date"
// //             value={endDate}
// //             onChange={(e) => setEndDate(e.target.value)}
// //             InputLabelProps={{ shrink: true }}
// //             fullWidth
// //             sx={{ mb: 2 }}
// //           />
          
// //           <Stack direction="row" spacing={2} justifyContent="flex-end">
// //             <Button onClick={handleClearDates} color="secondary">
// //               Effacer
// //             </Button>
// //             <Button onClick={handleApplyDates} variant="contained">
// //               Appliquer
// //             </Button>
// //           </Stack>
// //         </DialogContent>
// //       </Dialog>
// //     </Box>
// //   );
// // };

// // export default LogsPage;







// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   CircularProgress,
//   Dialog,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Stack,
//   TextField,
//   DialogContent,
//   Chip
// } from "@mui/material";
// import { 
//   FilterList
// } from "@mui/icons-material";
// import axios from 'axios';

// const LogsPage = () => {
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState({
//     person: false,
//     face: false,
//     object: false,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortAsc, setSortAsc] = useState(false);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [dateFilterOpen, setDateFilterOpen] = useState(false);

//   // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       // Construction des paramètres de requête basés sur les filtres
//       const params = new URLSearchParams();
      
//       // Ajout des types de détection (uniquement ceux qui sont activés)
//       if (filters.person) params.append('person', 'true');
//       if (filters.face) params.append('face', 'true');
//       if (filters.object) params.append('object', 'true');
      
//       // Ajout de la recherche si présente
//       if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
//       // Ajout des dates si présentes
//       if (startDate) params.append('start_date', startDate);
//       if (endDate) params.append('end_date', endDate);
      
//       // Appel à l'API avec les paramètres de filtrage
//       const res = await axios.get(`http://127.0.0.1:8000/api/logs?${params.toString()}`);
      
//       // Tri des logs selon l'ordre choisi
//       const sortedLogs = sortLogs(res.data);
//       setLogs(sortedLogs);
//       setFilteredLogs(sortedLogs);
//     } catch (error) {
//       console.error("Erreur récupération logs :", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Appel initial de l'API au chargement du composant
//   useEffect(() => {
//     fetchLogs();
//   }, []); // Dépendances vides pour exécuter uniquement au montage

//   // Appliquer les filtres à chaque changement de filtre ou de recherche
//   useEffect(() => {
//     fetchLogs();
//   }, [filters, searchTerm, startDate, endDate, sortAsc]);

//   const sortLogs = (list) => {
//     return [...list].sort((a, b) => {
//       const dateA = new Date(a.timestamp);
//       const dateB = new Date(b.timestamp);
//       return sortAsc ? dateA - dateB : dateB - dateA;
//     });
//   };

//   const handleFilterChange = (key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const resetFilters = () => {
//     setFilters({
//       person: false,
//       face: false,
//       object: false,
//     });
//     setSearchTerm("");
//     setStartDate("");
//     setEndDate("");
//   };

//   const handleImageClick = (base64Image) => {
//     setSelectedImage(`data:image/jpeg;base64,${base64Image}`);
//     setDialogOpen(true);
//   };

//   const countByClass = {
//     person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
//     face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
//     object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
//   };

//   const handleDateFilterOpen = () => {
//     setDateFilterOpen(true);
//   };

//   const handleDateFilterClose = () => {
//     setDateFilterOpen(false);
//   };

//   const handleApplyDates = () => {
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   const handleClearDates = () => {
//     setStartDate("");
//     setEndDate("");
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   // Extraction des types de détections pour l'affichage
//   const getDetectionTypes = (detections) => {
//     return detections.map(det => det.type);
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         📜 Historique des Logs
//       </Typography>

//       <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
//         <Typography variant="body2">Total logs : {logs.length}</Typography>
//         <Typography variant="body2">👤 Personne : {countByClass.person}</Typography>
//         <Typography variant="body2">🧠 Visage : {countByClass.face}</Typography>
//         <Typography variant="body2">📦 Objet : {countByClass.object}</Typography>
        
//         <Button
//           size="small"
//           variant="outlined"
//           onClick={() => setSortAsc((prev) => !prev)}
//         >
//           Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
//         </Button>

//         <Button
//           variant="outlined"
//           onClick={handleDateFilterOpen}
//           startIcon={<FilterList />}
//         >
//           {!startDate ? "Filtrer par date" : 
//            !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
//            `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
//         </Button>
//       </Stack>

//       <FormGroup row sx={{ mb: 2 }}>
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.person}
//               onChange={() => handleFilterChange("person")}
//             />
//           }
//           label="Personne"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.face}
//               onChange={() => handleFilterChange("face")}
//             />
//           }
//           label="Visage"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.object}
//               onChange={() => handleFilterChange("object")}
//             />
//           }
//           label="Objet"
//         />
//         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
//           Réinitialiser
//         </Button>
//       </FormGroup>

//       <TextField
//         fullWidth
//         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         sx={{ mb: 3 }}
//       />

//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}

//       {!loading && filteredLogs.length === 0 && (
//         <Typography>Aucun log ne correspond aux critères.</Typography>
//       )}

//       {!loading &&
//         filteredLogs.map((log, index) => (
//           <Paper key={index} sx={{ p: 2, mb: 2 }}>
//             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <Box>
//                 <Typography variant="body2" sx={{ mb: 1 }}>
//                   📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
//                 </Typography>
//                 <Stack direction="row" spacing={1}>
//                   {getDetectionTypes(log.detections).map((detection, idx) => (
//                     <Chip 
//                       key={idx} 
//                       label={detection} 
//                       size="small" 
//                       color={
//                         detection === "person" ? "primary" : 
//                         detection === "face" ? "secondary" : "default"
//                       }
//                     />
//                   ))}
//                 </Stack>
//               </Box>
//               <Box
//                 component="img"
//                 src={`data:image/jpeg;base64,${log.image_base64}`}
//                 alt="Miniature"
//                 onClick={() => handleImageClick(log.image_base64)}
//                 sx={{
//                   width: 80,
//                   height: 80,
//                   objectFit: "cover",
//                   borderRadius: 1,
//                   cursor: "pointer",
//                   "&:hover": {
//                     opacity: 0.8,
//                     border: "1px solid #1976d2"
//                   }
//                 }}
//               />
//             </Box>
//           </Paper>
//         ))}

//       {/* Dialog pour afficher l'image en grand */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="lg"
//       >
//         <DialogContent>
//           {selectedImage && (
//             <img
//               src={selectedImage}
//               alt="Zoom image"
//               style={{ 
//                 width: '100%', 
//                 maxHeight: '80vh',
//                 objectFit: 'contain',
//                 borderRadius: 8 
//               }}
//             />
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Dialog pour le filtre de date */}
//       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
//         <DialogContent>
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Filtrer par date
//           </Typography>
          
//           <TextField
//             label="Date de début"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <TextField
//             label="Date de fin (optionnel)"
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <Stack direction="row" spacing={2} justifyContent="flex-end">
//             <Button onClick={handleClearDates} color="secondary">
//               Effacer
//             </Button>
//             <Button onClick={handleApplyDates} variant="contained">
//               Appliquer
//             </Button>
//           </Stack>
//         </DialogContent>
//       </Dialog>
//     </Box>
//   );
// };

// export default LogsPage;







// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   CircularProgress,
//   Dialog,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Stack,
//   TextField,
//   DialogContent,
//   Chip
// } from "@mui/material";
// import { 
//   FilterList
// } from "@mui/icons-material";
// import axios from 'axios';

// const LogsPage = () => {
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState({
//     person: false,
//     face: false,
//     object: false,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortAsc, setSortAsc] = useState(false);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [dateFilterOpen, setDateFilterOpen] = useState(false);

//   // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       // Construction des paramètres de requête basés sur les filtres
//       const params = new URLSearchParams();
      
//       // Ajout des types de détection (uniquement ceux qui sont activés)
//       if (filters.person) params.append('person', 'true');
//       if (filters.face) params.append('face', 'true');
//       if (filters.object) params.append('object', 'true');
      
//       // Ajout de la recherche si présente
//       if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
//       // Ajout des dates si présentes
//       if (startDate) params.append('start_date', startDate);
//       if (endDate) params.append('end_date', endDate);
      
//       // Appel à l'API avec les paramètres de filtrage
//       const res = await axios.get(`/api/logs?${params.toString()}`);
      
//       // Tri des logs selon l'ordre choisi
//       const sortedLogs = sortLogs(res.data);
//       setLogs(sortedLogs);
//       setFilteredLogs(sortedLogs);
//     } catch (error) {
//       console.error("Erreur récupération logs :", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Appel initial de l'API au chargement du composant
//   useEffect(() => {
//     fetchLogs();
//   }, []); // Dépendances vides pour exécuter uniquement au montage

//   // Appliquer les filtres à chaque changement de filtre ou de recherche
//   useEffect(() => {
//     fetchLogs();
//   }, [filters, searchTerm, startDate, endDate, sortAsc]);

//   const sortLogs = (list) => {
//     return [...list].sort((a, b) => {
//       const dateA = new Date(a.timestamp);
//       const dateB = new Date(b.timestamp);
//       return sortAsc ? dateA - dateB : dateB - dateA;
//     });
//   };

//   const handleFilterChange = (key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const resetFilters = () => {
//     setFilters({
//       person: false,
//       face: false,
//       object: false,
//     });
//     setSearchTerm("");
//     setStartDate("");
//     setEndDate("");
//   };

//   const handleImageClick = (base64Image) => {
//     setSelectedImage(`data:image/jpeg;base64,${base64Image}`);
//     setDialogOpen(true);
//   };

//   // Compter les images avec chaque type de détection (une fois par image)
//   const countByClass = {
//     person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
//     face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
//     object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
//   };
  
//   // Analyser tous les types uniques de détection pour grouper les objets
//   const uniqueDetectionTypes = React.useMemo(() => {
//     // Collecter tous les types de détection de tous les logs
//     const allTypes = logs.flatMap(log => 
//       log.detections.map(det => det.type)
//     );
    
//     // Compter les occurrences de chaque type de détection
//     const typeCounts = {};
//     allTypes.forEach(type => {
//       typeCounts[type] = (typeCounts[type] || 0) + 1;
//     });
    
//     // Convertir en tableau et trier par nombre d'occurrences (décroissant)
//     return Object.entries(typeCounts)
//       .map(([type, count]) => ({ type, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [logs]);

//   const handleDateFilterOpen = () => {
//     setDateFilterOpen(true);
//   };

//   const handleDateFilterClose = () => {
//     setDateFilterOpen(false);
//   };

//   const handleApplyDates = () => {
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   const handleClearDates = () => {
//     setStartDate("");
//     setEndDate("");
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   // Extraction des types de détections pour l'affichage avec optimisation (déduplications)
//   const getDetectionTypes = (detections) => {
//     // Extraire tous les types uniques de détection
//     const uniqueTypes = [...new Set(detections.map(det => det.type))];
    
//     // Compter les occurrences de chaque type
//     const typeCounts = {};
//     detections.forEach(det => {
//       if (!typeCounts[det.type]) {
//         typeCounts[det.type] = 1;
//       } else {
//         typeCounts[det.type]++;
//       }
//     });
    
//     // Retourner un tableau d'objets avec le type et le nombre d'occurrences
//     return uniqueTypes.map(type => ({
//       type,
//       count: typeCounts[type]
//     }));
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         📜 Historique des Logs
//       </Typography>

//       <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
//         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
//           Statistiques
//         </Typography>
        
//         <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
//           <Chip icon={<span>📄</span>} label={`Total logs : ${logs.length}`} />
//           <Chip icon={<span>👤</span>} label={`Personnes : ${countByClass.person}`} color="primary" />
//           <Chip icon={<span>🧠</span>} label={`Visages : ${countByClass.face}`} color="secondary" />
//           <Chip icon={<span>📦</span>} label={`Objets : ${countByClass.object}`} />
          
//           <Button
//             size="small"
//             variant="outlined"
//             onClick={() => setSortAsc((prev) => !prev)}
//           >
//             Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
//           </Button>

//           <Button
//             variant="outlined"
//             onClick={handleDateFilterOpen}
//             startIcon={<FilterList />}
//           >
//             {!startDate ? "Filtrer par date" : 
//              !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
//              `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
//           </Button>
//         </Stack>
        
//         {/* Affichage des types de détection les plus fréquents */}
//         <Typography variant="subtitle2" gutterBottom>
//           Types de détection les plus fréquents :
//         </Typography>
//         <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
//           {uniqueDetectionTypes.slice(0, 10).map((item, idx) => (
//             <Chip 
//               key={idx}
//               label={`${item.type} (${item.count})`}
//               size="small"
//               variant="outlined"
//               color={
//                 item.type === "person" ? "primary" : 
//                 item.type === "face" ? "secondary" : "default"
//               }
//               sx={{ mb: 1 }}
//             />
//           ))}
//         </Stack>
//       </Box>

//       <FormGroup row sx={{ mb: 2 }}>
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.person}
//               onChange={() => handleFilterChange("person")}
//             />
//           }
//           label="Personne"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.face}
//               onChange={() => handleFilterChange("face")}
//             />
//           }
//           label="Visage"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.object}
//               onChange={() => handleFilterChange("object")}
//             />
//           }
//           label="Objet"
//         />
//         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
//           Réinitialiser
//         </Button>
//       </FormGroup>

//       <TextField
//         fullWidth
//         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         sx={{ mb: 3 }}
//       />

//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}

//       {!loading && filteredLogs.length === 0 && (
//         <Typography>Aucun log ne correspond aux critères.</Typography>
//       )}

//       {!loading && filteredLogs.length > 0 && (
//         <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
//           {filteredLogs.map((log, index) => (
//             <Paper key={index} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Typography variant="body2" sx={{ mb: 1 }}>
//                 📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
//               </Typography>
              
//               <Box
//                 component="img"
//                 src={`data:image/jpeg;base64,${log.image_base64}`}
//                 alt="Capture"
//                 onClick={() => handleImageClick(log.image_base64)}
//                 sx={{
//                   width: "100%",
//                   height: 180,
//                   objectFit: "cover",
//                   borderRadius: 1,
//                   cursor: "pointer",
//                   mb: 2,
//                   "&:hover": {
//                     opacity: 0.9,
//                     transform: "scale(1.01)",
//                     transition: "all 0.2s"
//                   }
//                 }}
//               />
              
//               <Stack direction="row" spacing={1} flexWrap="wrap">
//                 {getDetectionTypes(log.detections).map((item, idx) => (
//                   <Chip 
//                     key={idx} 
//                     label={item.count > 1 ? `${item.type} (${item.count})` : item.type}
//                     size="small" 
//                     color={
//                       item.type === "person" ? "primary" : 
//                       item.type === "face" ? "secondary" : "default"
//                     }
//                     sx={{ mb: 1 }}
//                   />
//                 ))}
//               </Stack>
//             </Paper>
//           ))}
//         </Box>
//       )}

//       {/* Dialog pour afficher l'image en grand */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="lg"
//       >
//         <DialogContent>
//           {selectedImage && (
//             <img
//               src={selectedImage}
//               alt="Zoom image"
//               style={{ 
//                 width: '100%', 
//                 maxHeight: '80vh',
//                 objectFit: 'contain',
//                 borderRadius: 8 
//               }}
//             />
//           )}
//         </DialogContent>
//       </Dialog>

//       {/* Dialog pour le filtre de date */}
//       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
//         <DialogContent>
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Filtrer par date
//           </Typography>
          
//           <TextField
//             label="Date de début"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <TextField
//             label="Date de fin (optionnel)"
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <Stack direction="row" spacing={2} justifyContent="flex-end">
//             <Button onClick={handleClearDates} color="secondary">
//               Effacer
//             </Button>
//             <Button onClick={handleApplyDates} variant="contained">
//               Appliquer
//             </Button>
//           </Stack>
//         </DialogContent>
//       </Dialog>
//     </Box>
//   );
// };

// export default LogsPage;






// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   CircularProgress,
//   Dialog,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Stack,
//   TextField,
//   DialogContent,
//   Chip
// } from "@mui/material";
// import { 
//   FilterList
// } from "@mui/icons-material";
// import axios from 'axios';

// const LogsPage = () => {
//   // États principaux
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // États pour les filtres
//   const [filters, setFilters] = useState({
//     person: false,
//     face: false,
//     object: false,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortAsc, setSortAsc] = useState(false);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [dateFilterOpen, setDateFilterOpen] = useState(false);
  
//   // États pour la dialog d'image
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [modalDetectionOptions, setModalDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [displayedDetections, setDisplayedDetections] = useState([]);

//   // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       // Construction des paramètres de requête basés sur les filtres
//       const params = new URLSearchParams();
      
//       // Ajout des types de détection (uniquement ceux qui sont activés)
//       if (filters.person) params.append('person', 'true');
//       if (filters.face) params.append('face', 'true');
//       if (filters.object) params.append('object', 'true');
      
//       // Ajout de la recherche si présente
//       if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
//       // Ajout des dates si présentes
//       if (startDate) params.append('start_date', startDate);
//       if (endDate) params.append('end_date', endDate);
      
//       // Appel à l'API avec les paramètres de filtrage
//       const res = await axios.get(`/api/logs?${params.toString()}`);
      
//       // Tri des logs selon l'ordre choisi
//       const sortedLogs = sortLogs(res.data);
      
//       // Regrouper les logs par image (Pour consolider les détections multiples d'une même image)
//       const consolidatedLogs = consolidateLogsByImage(sortedLogs);
      
//       setLogs(consolidatedLogs);
//       setFilteredLogs(consolidatedLogs);
//     } catch (error) {
//       console.error("Erreur récupération logs :", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fonction pour consolider les logs par image
//   const consolidateLogsByImage = (logsList) => {
//     const imageMap = new Map();
    
//     logsList.forEach(log => {
//       const imageId = log.original_image;
      
//       if (!imageMap.has(imageId)) {
//         // Première entrée pour cette image
//         imageMap.set(imageId, {
//           ...log,
//           // Garder une seule copie de chaque champ
//           timestamp: log.timestamp,
//           original_image: log.original_image,
//           result_image: log.result_image,
//           image_base64: log.image_base64,
//           // Initialiser le tableau de détections
//           detections: [...log.detections]
//         });
//       } else {
//         // Fusionner les détections pour les entrées existantes
//         const existingLog = imageMap.get(imageId);
        
//         // Ajouter uniquement les nouvelles détections (éviter les doublons)
//         log.detections.forEach(detection => {
//           // Vérifier si cette détection spécifique existe déjà
//           const exists = existingLog.detections.some(
//             d => d.type === detection.type && 
//                  d.confidence === detection.confidence && 
//                  JSON.stringify(d.bbox) === JSON.stringify(detection.bbox)
//           );
          
//           if (!exists) {
//             existingLog.detections.push(detection);
//           }
//         });
        
//         // Mettre à jour le timestamp si plus récent
//         if (new Date(log.timestamp) > new Date(existingLog.timestamp)) {
//           existingLog.timestamp = log.timestamp;
//         }
//       }
//     });
    
//     // Convertir la Map en array
//     return Array.from(imageMap.values());
//   };

//   // Appel initial de l'API au chargement du composant
//   useEffect(() => {
//     fetchLogs();
//   }, []); // Dépendances vides pour exécuter uniquement au montage

//   // Appliquer les filtres à chaque changement de filtre ou de recherche
//   useEffect(() => {
//     fetchLogs();
//   }, [filters, searchTerm, startDate, endDate, sortAsc]);

//   // Effect pour filtrer les détections dans la modal selon les options sélectionnées
//   useEffect(() => {
//     if (selectedLog && selectedLog.detections) {
//       const filtered = selectedLog.detections.filter(detection => {
//         if (detection.type === "face" && !modalDetectionOptions.face) return false;
//         if (detection.type === "person" && !modalDetectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !modalDetectionOptions.object) return false;
//         return true;
//       });
      
//       setDisplayedDetections(filtered);
//     }
//   }, [selectedLog, modalDetectionOptions]);

//   const sortLogs = (list) => {
//     return [...list].sort((a, b) => {
//       const dateA = new Date(a.timestamp);
//       const dateB = new Date(b.timestamp);
//       return sortAsc ? dateA - dateB : dateB - dateA;
//     });
//   };

//   const handleFilterChange = (key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const handleModalDetectionChange = (key) => {
//     setModalDetectionOptions((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const resetFilters = () => {
//     setFilters({
//       person: false,
//       face: false,
//       object: false,
//     });
//     setSearchTerm("");
//     setStartDate("");
//     setEndDate("");
//   };

//   const handleImageClick = (log) => {
//     setSelectedLog(log);
//     setSelectedImage(`data:image/jpeg;base64,${log.image_base64}`);
//     // Initialiser les détections à afficher avec toutes les détections disponibles
//     setDisplayedDetections(log.detections);
//     setDialogOpen(true);
//   };

//   // Compter les images avec chaque type de détection (une fois par image)
//   const countByClass = {
//     person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
//     face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
//     object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
//   };
  
//   // Analyser tous les types uniques de détection pour grouper les objets
//   const uniqueDetectionTypes = React.useMemo(() => {
//     // Collecter tous les types de détection de tous les logs
//     const allTypes = logs.flatMap(log => 
//       log.detections.map(det => det.type)
//     );
    
//     // Compter les occurrences de chaque type de détection
//     const typeCounts = {};
//     allTypes.forEach(type => {
//       typeCounts[type] = (typeCounts[type] || 0) + 1;
//     });
    
//     // Convertir en tableau et trier par nombre d'occurrences (décroissant)
//     return Object.entries(typeCounts)
//       .map(([type, count]) => ({ type, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [logs]);

//   const handleDateFilterOpen = () => {
//     setDateFilterOpen(true);
//   };

//   const handleDateFilterClose = () => {
//     setDateFilterOpen(false);
//   };

//   const handleApplyDates = () => {
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   const handleClearDates = () => {
//     setStartDate("");
//     setEndDate("");
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   // Extraire les types de détections pour l'affichage avec optimisation (déduplications)
//   const getDetectionTypes = (detections) => {
//     // Extraire tous les types uniques de détection
//     const uniqueTypes = [...new Set(detections.map(det => det.type))];
    
//     // Compter les occurrences de chaque type
//     const typeCounts = {};
//     detections.forEach(det => {
//       if (!typeCounts[det.type]) {
//         typeCounts[det.type] = 1;
//       } else {
//         typeCounts[det.type]++;
//       }
//     });
    
//     // Retourner un tableau d'objets avec le type et le nombre d'occurrences
//     return uniqueTypes.map(type => ({
//       type,
//       count: typeCounts[type]
//     }));
//   };

//   // Afficher les boîtes de détection dans la modal
//   const renderDetectionBoxes = () => {
//     if (!selectedLog || !displayedDetections.length) return null;

//     // Calculer les dimensions de l'image dans la modal pour ajuster les boîtes
//     const imgElement = document.querySelector("img[alt='Zoom image']");
//     if (!imgElement) return null;

//     const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
//     const scaleY = imgElement.clientHeight / imgElement.naturalHeight;

//     return displayedDetections.map((detection, index) => {
//       const [x1, y1, x2, y2] = detection.bbox;
//       const color = `rgb(${detection.color.join(",")})`;
      
//       return (
//         <Box
//           key={index}
//           sx={{
//             position: "absolute",
//             border: `2px solid ${color}`,
//             left: `${x1 * scaleX}px`,
//             top: `${y1 * scaleY}px`,
//             width: `${(x2 - x1) * scaleX}px`,
//             height: `${(y2 - y1) * scaleY}px`,
//             pointerEvents: "none"
//           }}
//         >
//           <Box
//             sx={{
//               position: "absolute",
//               top: "-22px",
//               left: 0,
//               backgroundColor: `rgba(${detection.color.join(",")}, 0.7)`,
//               color: "white",
//               padding: "2px 5px",
//               fontSize: 12,
//               borderRadius: 1
//             }}
//           >
//             {detection.type} ({Math.round(detection.confidence * 100)}%)
//           </Box>
//         </Box>
//       );
//     });
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         📜 Historique des Logs
//       </Typography>

//       <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
//         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
//           Statistiques
//         </Typography>
        
//         <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
//           <Chip icon={<span>📄</span>} label={`Total logs : ${logs.length}`} />
//           <Chip icon={<span>👤</span>} label={`Personnes : ${countByClass.person}`} color="primary" />
//           <Chip icon={<span>🧠</span>} label={`Visages : ${countByClass.face}`} color="secondary" />
//           <Chip icon={<span>📦</span>} label={`Objets : ${countByClass.object}`} />
          
//           <Button
//             size="small"
//             variant="outlined"
//             onClick={() => setSortAsc((prev) => !prev)}
//           >
//             Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
//           </Button>

//           <Button
//             variant="outlined"
//             onClick={handleDateFilterOpen}
//             startIcon={<FilterList />}
//           >
//             {!startDate ? "Filtrer par date" : 
//              !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
//              `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
//           </Button>
//         </Stack>
        
//         {/* Affichage des types de détection les plus fréquents */}
//         <Typography variant="subtitle2" gutterBottom>
//           Types de détection les plus fréquents :
//         </Typography>
//         <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
//           {uniqueDetectionTypes.slice(0, 10).map((item, idx) => (
//             <Chip 
//               key={idx}
//               label={`${item.type} (${item.count})`}
//               size="small"
//               variant="outlined"
//               color={
//                 item.type === "person" ? "primary" : 
//                 item.type === "face" ? "secondary" : "default"
//               }
//               sx={{ mb: 1 }}
//             />
//           ))}
//         </Stack>
//       </Box>

//       <FormGroup row sx={{ mb: 2 }}>
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.person}
//               onChange={() => handleFilterChange("person")}
//             />
//           }
//           label="Personne"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.face}
//               onChange={() => handleFilterChange("face")}
//             />
//           }
//           label="Visage"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.object}
//               onChange={() => handleFilterChange("object")}
//             />
//           }
//           label="Objet"
//         />
//         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
//           Réinitialiser
//         </Button>
//       </FormGroup>

//       <TextField
//         fullWidth
//         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         sx={{ mb: 3 }}
//       />

//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}

//       {!loading && filteredLogs.length === 0 && (
//         <Typography>Aucun log ne correspond aux critères.</Typography>
//       )}

//       {!loading && filteredLogs.length > 0 && (
//         <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
//           {filteredLogs.map((log, index) => (
//             <Paper key={index} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Typography variant="body2" sx={{ mb: 1 }}>
//                 📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
//               </Typography>
              
//               <Box
//                 component="img"
//                 src={`data:image/jpeg;base64,${log.image_base64}`}
//                 alt="Capture"
//                 onClick={() => handleImageClick(log)}
//                 sx={{
//                   width: "100%",
//                   height: 180,
//                   objectFit: "cover",
//                   borderRadius: 1,
//                   cursor: "pointer",
//                   mb: 2,
//                   "&:hover": {
//                     opacity: 0.9,
//                     transform: "scale(1.01)",
//                     transition: "all 0.2s"
//                   }
//                 }}
//               />
              
//               <Stack direction="row" spacing={1} flexWrap="wrap">
//                 {getDetectionTypes(log.detections).map((item, idx) => (
//                   <Chip 
//                     key={idx} 
//                     label={item.count > 1 ? `${item.type} (${item.count})` : item.type}
//                     size="small" 
//                     color={
//                       item.type === "person" ? "primary" : 
//                       item.type === "face" ? "secondary" : "default"
//                     }
//                     sx={{ mb: 1 }}
//                   />
//                 ))}
//               </Stack>
//             </Paper>
//           ))}
//         </Box>
//       )}

//       {/* Dialog pour afficher l'image en grand avec les options de détection */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="lg"
//       >
//         <DialogContent sx={{ position: "relative", minWidth: "600px" }}>
//           <Box sx={{ position: "relative" }}>
//             {selectedImage && (
//               <img
//                 src={selectedImage}
//                 alt="Zoom image"
//                 style={{ 
//                   width: '100%', 
//                   maxHeight: '70vh',
//                   objectFit: 'contain',
//                   borderRadius: 8 
//                 }}
//               />
//             )}
//             {/* Afficher les bounding boxes dans la modal */}
//             {renderDetectionBoxes()}
//           </Box>
          
//           {/* Options de filtrage pour la modal */}
//           <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
//             <Typography variant="subtitle1" gutterBottom>
//               Options de détection:
//             </Typography>
//             <FormGroup row>
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.person}
//                     onChange={() => handleModalDetectionChange("person")}
//                     sx={{ color: "green", '&.Mui-checked': {color: "green"} }}
//                   />
//                 }
//                 label="Personnes"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.face}
//                     onChange={() => handleModalDetectionChange("face")}
//                     sx={{ color: "blue", '&.Mui-checked': {color: "blue"} }}
//                   />
//                 }
//                 label="Visages"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.object}
//                     onChange={() => handleModalDetectionChange("object")}
//                     sx={{ color: "orange", '&.Mui-checked': {color: "orange"} }}
//                   />
//                 }
//                 label="Objets"
//               />
//             </FormGroup>
            
//             {/* Afficher les détections actives */}
//             <Typography variant="subtitle2" sx={{ mt: 2 }}>
//               Détections actives:
//             </Typography>
//             <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
//               {displayedDetections.map((det, idx) => (
//                 <Chip 
//                   key={idx}
//                   label={`${det.type} (${Math.round(det.confidence * 100)}%)`}
//                   size="small"
//                   variant="outlined"
//                   color={
//                     det.type === "person" ? "primary" : 
//                     det.type === "face" ? "secondary" : "default"
//                   }
//                   sx={{ mb: 1 }}
//                 />
//               ))}
//             </Stack>
//           </Box>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog pour le filtre de date */}
//       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
//         <DialogContent>
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Filtrer par date
//           </Typography>
          
//           <TextField
//             label="Date de début"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <TextField
//             label="Date de fin (optionnel)"
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <Stack direction="row" spacing={2} justifyContent="flex-end">
//             <Button onClick={handleClearDates} color="secondary">
//               Effacer
//             </Button>
//             <Button onClick={handleApplyDates} variant="contained">
//               Appliquer
//             </Button>
//           </Stack>
//         </DialogContent>
//       </Dialog>
//     </Box>
//   );
// };

// export default LogsPage;





// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   CircularProgress,
//   Dialog,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Stack,
//   TextField,
//   DialogContent,
//   Chip
// } from "@mui/material";
// import { 
//   FilterList
// } from "@mui/icons-material";
// import axios from 'axios';

// const LogsPage = () => {
//   // États principaux
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // États pour les filtres
//   const [filters, setFilters] = useState({
//     person: false,
//     face: false,
//     object: false,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortAsc, setSortAsc] = useState(false);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [dateFilterOpen, setDateFilterOpen] = useState(false);
  
//   // États pour la dialog d'image
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [modalDetectionOptions, setModalDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [displayedDetections, setDisplayedDetections] = useState([]);
//   const [selectedDetection, setSelectedDetection] = useState(null);

//   // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       // Construction des paramètres de requête basés sur les filtres
//       const params = new URLSearchParams();
      
//       // Ajout des types de détection (uniquement ceux qui sont activés)
//       if (filters.person) params.append('person', 'true');
//       if (filters.face) params.append('face', 'true');
//       if (filters.object) params.append('object', 'true');
      
//       // Ajout de la recherche si présente
//       if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
//       // Ajout des dates si présentes
//       if (startDate) params.append('start_date', startDate);
//       if (endDate) params.append('end_date', endDate);
      
//       // Appel à l'API avec les paramètres de filtrage
//       const res = await axios.get(`/api/logs?${params.toString()}`);
      
//       // Tri des logs selon l'ordre choisi
//       const sortedLogs = sortLogs(res.data);
      
//       // Regrouper les logs par image (Pour consolider les détections multiples d'une même image)
//       const consolidatedLogs = consolidateLogsByImage(sortedLogs);
      
//       setLogs(consolidatedLogs);
//       setFilteredLogs(consolidatedLogs);
//     } catch (error) {
//       console.error("Erreur récupération logs :", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fonction pour consolider les logs par image
//   const consolidateLogsByImage = (logsList) => {
//     const imageMap = new Map();
    
//     logsList.forEach(log => {
//       const imageId = log.original_image;
      
//       if (!imageMap.has(imageId)) {
//         // Première entrée pour cette image
//         imageMap.set(imageId, {
//           ...log,
//           // Garder une seule copie de chaque champ
//           timestamp: log.timestamp,
//           original_image: log.original_image,
//           result_image: log.result_image,
//           image_base64: log.image_base64,
//           // Initialiser le tableau de détections
//           detections: [...log.detections]
//         });
//       } else {
//         // Fusionner les détections pour les entrées existantes
//         const existingLog = imageMap.get(imageId);
        
//         // Ajouter uniquement les nouvelles détections (éviter les doublons)
//         log.detections.forEach(detection => {
//           // Vérifier si cette détection spécifique existe déjà
//           const exists = existingLog.detections.some(
//             d => d.type === detection.type && 
//                  d.confidence === detection.confidence && 
//                  JSON.stringify(d.bbox) === JSON.stringify(detection.bbox)
//           );
          
//           if (!exists) {
//             existingLog.detections.push(detection);
//           }
//         });
        
//         // Mettre à jour le timestamp si plus récent
//         if (new Date(log.timestamp) > new Date(existingLog.timestamp)) {
//           existingLog.timestamp = log.timestamp;
//         }
//       }
//     });
    
//     // Convertir la Map en array
//     return Array.from(imageMap.values());
//   };

//   // Appel initial de l'API au chargement du composant
//   useEffect(() => {
//     fetchLogs();
//   }, []); // Dépendances vides pour exécuter uniquement au montage

//   // Appliquer les filtres à chaque changement de filtre ou de recherche
//   useEffect(() => {
//     fetchLogs();
//   }, [filters, searchTerm, startDate, endDate, sortAsc]);

//   // Effect pour filtrer les détections dans la modal selon les options sélectionnées
//   useEffect(() => {
//     if (selectedLog && selectedLog.detections) {
//       const filtered = selectedLog.detections.filter(detection => {
//         if (detection.type === "face" && !modalDetectionOptions.face) return false;
//         if (detection.type === "person" && !modalDetectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !modalDetectionOptions.object) return false;
//         return true;
//       });
      
//       setDisplayedDetections(filtered);
//       setSelectedDetection(null); // Réinitialiser la détection sélectionnée à chaque changement de filtre
//     }
//   }, [selectedLog, modalDetectionOptions]);

//   const sortLogs = (list) => {
//     return [...list].sort((a, b) => {
//       const dateA = new Date(a.timestamp);
//       const dateB = new Date(b.timestamp);
//       return sortAsc ? dateA - dateB : dateB - dateA;
//     });
//   };

//   const handleFilterChange = (key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const handleModalDetectionChange = (key) => {
//     setModalDetectionOptions((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//     setSelectedDetection(null); // Réinitialiser la sélection quand on change de filtre
//   };

//   const resetFilters = () => {
//     setFilters({
//       person: false,
//       face: false,
//       object: false,
//     });
//     setSearchTerm("");
//     setStartDate("");
//     setEndDate("");
//   };

//   const handleImageClick = (log) => {
//     setSelectedLog(log);
//     setSelectedImage(`data:image/jpeg;base64,${log.image_base64}`);
//     // Initialiser les détections à afficher avec toutes les détections disponibles
//     setDisplayedDetections(log.detections);
//     setSelectedDetection(null); // Réinitialiser la détection sélectionnée
//     setDialogOpen(true);
//   };

//   // Fonction pour gérer le clic sur une détection active
//   const handleDetectionClick = (detection) => {
//     if (selectedDetection && selectedDetection.id === detection.id) {
//       // Si on clique sur la même détection, désélectionner
//       setSelectedDetection(null);
//     } else {
//       // Sinon, sélectionner cette détection
//       setSelectedDetection({
//         ...detection,
//         id: `${detection.type}-${detection.confidence}-${detection.bbox.join('-')}`
//       });
//     }
//   };

//   // Compter les images avec chaque type de détection (une fois par image)
//   const countByClass = {
//     person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
//     face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
//     object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
//   };
  
//   // Analyser tous les types uniques de détection pour grouper les objets
//   const uniqueDetectionTypes = React.useMemo(() => {
//     // Collecter tous les types de détection de tous les logs
//     const allTypes = logs.flatMap(log => 
//       log.detections.map(det => det.type)
//     );
    
//     // Compter les occurrences de chaque type de détection
//     const typeCounts = {};
//     allTypes.forEach(type => {
//       typeCounts[type] = (typeCounts[type] || 0) + 1;
//     });
    
//     // Convertir en tableau et trier par nombre d'occurrences (décroissant)
//     return Object.entries(typeCounts)
//       .map(([type, count]) => ({ type, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [logs]);

//   const handleDateFilterOpen = () => {
//     setDateFilterOpen(true);
//   };

//   const handleDateFilterClose = () => {
//     setDateFilterOpen(false);
//   };

//   const handleApplyDates = () => {
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   const handleClearDates = () => {
//     setStartDate("");
//     setEndDate("");
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   // Extraire les types de détections pour l'affichage avec optimisation (déduplications)
//   const getDetectionTypes = (detections) => {
//     // Extraire tous les types uniques de détection
//     const uniqueTypes = [...new Set(detections.map(det => det.type))];
    
//     // Compter les occurrences de chaque type
//     const typeCounts = {};
//     detections.forEach(det => {
//       if (!typeCounts[det.type]) {
//         typeCounts[det.type] = 1;
//       } else {
//         typeCounts[det.type]++;
//       }
//     });
    
//     // Retourner un tableau d'objets avec le type et le nombre d'occurrences
//     return uniqueTypes.map(type => ({
//       type,
//       count: typeCounts[type]
//     }));
//   };

//   // Afficher les boîtes de détection dans la modal
//   const renderDetectionBoxes = () => {
//     if (!selectedLog) return null;
    
//     // Déterminer quelles détections afficher (toutes ou une sélectionnée)
//     const detectionsToRender = selectedDetection 
//       ? displayedDetections.filter(det => 
//           `${det.type}-${det.confidence}-${det.bbox.join('-')}` === selectedDetection.id)
//       : displayedDetections;
    
//     if (!detectionsToRender.length) return null;

//     // Calculer les dimensions de l'image dans la modal pour ajuster les boîtes
//     const imgElement = document.querySelector("img[alt='Zoom image']");
//     if (!imgElement) return null;

//     const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
//     const scaleY = imgElement.clientHeight / imgElement.naturalHeight;

//     return detectionsToRender.map((detection, index) => {
//       const [x1, y1, x2, y2] = detection.bbox;
//       const color = `rgb(${detection.color.join(",")})`;
      
//       return (
//         <Box
//           key={index}
//           sx={{
//             position: "absolute",
//             border: `2px solid ${color}`,
//             left: `${x1 * scaleX}px`,
//             top: `${y1 * scaleY}px`,
//             width: `${(x2 - x1) * scaleX}px`,
//             height: `${(y2 - y1) * scaleY}px`,
//             pointerEvents: "none"
//           }}
//         />
//       );
//     });
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         📜 Historique des Logs
//       </Typography>

//       <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
//         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
//           Statistiques
//         </Typography>
        
//         <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
//           <Chip icon={<span>📄</span>} label={`Total logs : ${logs.length}`} />
//           <Chip icon={<span>👤</span>} label={`Personnes : ${countByClass.person}`} color="primary" />
//           <Chip icon={<span>🧠</span>} label={`Visages : ${countByClass.face}`} color="secondary" />
//           <Chip icon={<span>📦</span>} label={`Objets : ${countByClass.object}`} />
          
//           <Button
//             size="small"
//             variant="outlined"
//             onClick={() => setSortAsc((prev) => !prev)}
//           >
//             Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
//           </Button>

//           <Button
//             variant="outlined"
//             onClick={handleDateFilterOpen}
//             startIcon={<FilterList />}
//           >
//             {!startDate ? "Filtrer par date" : 
//              !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
//              `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
//           </Button>
//         </Stack>
        
//         {/* Affichage des types de détection les plus fréquents */}
//         <Typography variant="subtitle2" gutterBottom>
//           Types de détection les plus fréquents :
//         </Typography>
//         <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
//           {uniqueDetectionTypes.slice(0, 10).map((item, idx) => (
//             <Chip 
//               key={idx}
//               label={`${item.type} (${item.count})`}
//               size="small"
//               variant="outlined"
//               color={
//                 item.type === "person" ? "primary" : 
//                 item.type === "face" ? "secondary" : "default"
//               }
//               sx={{ mb: 1 }}
//             />
//           ))}
//         </Stack>
//       </Box>

//       <FormGroup row sx={{ mb: 2 }}>
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.person}
//               onChange={() => handleFilterChange("person")}
//             />
//           }
//           label="Personne"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.face}
//               onChange={() => handleFilterChange("face")}
//             />
//           }
//           label="Visage"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.object}
//               onChange={() => handleFilterChange("object")}
//             />
//           }
//           label="Objet"
//         />
//         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
//           Réinitialiser
//         </Button>
//       </FormGroup>

//       <TextField
//         fullWidth
//         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         sx={{ mb: 3 }}
//       />

//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}

//       {!loading && filteredLogs.length === 0 && (
//         <Typography>Aucun log ne correspond aux critères.</Typography>
//       )}

//       {!loading && filteredLogs.length > 0 && (
//         <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
//           {filteredLogs.map((log, index) => (
//             <Paper key={index} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Typography variant="body2" sx={{ mb: 1 }}>
//                 📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
//               </Typography>
              
//               <Box
//                 component="img"
//                 src={`data:image/jpeg;base64,${log.image_base64}`}
//                 alt="Capture"
//                 onClick={() => handleImageClick(log)}
//                 sx={{
//                   width: "100%",
//                   height: 180,
//                   objectFit: "cover",
//                   borderRadius: 1,
//                   cursor: "pointer",
//                   mb: 2,
//                   "&:hover": {
//                     opacity: 0.9,
//                     transform: "scale(1.01)",
//                     transition: "all 0.2s"
//                   }
//                 }}
//               />
              
//               <Stack direction="row" spacing={1} flexWrap="wrap">
//                 {getDetectionTypes(log.detections).map((item, idx) => (
//                   <Chip 
//                     key={idx} 
//                     label={item.count > 1 ? `${item.type} (${item.count})` : item.type}
//                     size="small" 
//                     color={
//                       item.type === "person" ? "primary" : 
//                       item.type === "face" ? "secondary" : "default"
//                     }
//                     sx={{ mb: 1 }}
//                   />
//                 ))}
//               </Stack>
//             </Paper>
//           ))}
//         </Box>
//       )}

//       {/* Dialog pour afficher l'image en grand avec les options de détection */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="lg"
//       >
//         <DialogContent sx={{ position: "relative", minWidth: "600px" }}>
//           <Box sx={{ position: "relative" }}>
//             {selectedImage && (
//               <img
//                 src={selectedImage}
//                 alt="Zoom image"
//                 style={{ 
//                   width: '100%', 
//                   maxHeight: '70vh',
//                   objectFit: 'contain',
//                   borderRadius: 8 
//                 }}
//               />
//             )}
//             {/* Afficher les bounding boxes dans la modal */}
//             {renderDetectionBoxes()}
//           </Box>
          
//           {/* Options de filtrage pour la modal */}
//           <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
//             <Typography variant="subtitle1" gutterBottom>
//               Options de détection:
//             </Typography>
//             <FormGroup row>
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.person}
//                     onChange={() => handleModalDetectionChange("person")}
//                     sx={{ color: "green", '&.Mui-checked': {color: "green"} }}
//                   />
//                 }
//                 label="Personnes"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.face}
//                     onChange={() => handleModalDetectionChange("face")}
//                     sx={{ color: "blue", '&.Mui-checked': {color: "blue"} }}
//                   />
//                 }
//                 label="Visages"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.object}
//                     onChange={() => handleModalDetectionChange("object")}
//                     sx={{ color: "orange", '&.Mui-checked': {color: "orange"} }}
//                   />
//                 }
//                 label="Objets"
//               />
//             </FormGroup>
            
//             {/* Afficher les détections actives */}
//             <Typography variant="subtitle2" sx={{ mt: 2 }}>
//               Détections actives:
//             </Typography>
//             <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
//               {displayedDetections.map((det, idx) => {
//                 // Créer un ID unique pour chaque détection
//                 const detectionId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
//                 const isSelected = selectedDetection && selectedDetection.id === detectionId;
                
//                 return (
//                   <Chip 
//                     key={idx}
//                     label={`${det.type} (${Math.round(det.confidence * 100)}%)`}
//                     size="small"
//                     variant={isSelected ? "filled" : "outlined"}
//                     color={
//                       det.type === "person" ? "primary" : 
//                       det.type === "face" ? "secondary" : "default"
//                     }
//                     onClick={() => handleDetectionClick({...det, id: detectionId})}
//                     sx={{ 
//                       mb: 1, 
//                       cursor: 'pointer',
//                       fontWeight: isSelected ? 'bold' : 'normal',
//                       border: isSelected ? '2px solid' : '1px solid'
//                     }}
//                   />
//                 );
//               })}
//               {selectedDetection && (
//                 <Button 
//                   size="small" 
//                   variant="outlined" 
//                   color="error" 
//                   onClick={() => setSelectedDetection(null)}
//                   sx={{ ml: 1, height: 24, fontSize: '0.75rem' }}
//                 >
//                   Tout afficher
//                 </Button>
//               )}
//             </Stack>
//           </Box>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog pour le filtre de date */}
//       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
//         <DialogContent>
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Filtrer par date
//           </Typography>
          
//           <TextField
//             label="Date de début"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <TextField
//             label="Date de fin (optionnel)"
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <Stack direction="row" spacing={2} justifyContent="flex-end">
//             <Button onClick={handleClearDates} color="secondary">
//               Effacer
//             </Button>
//             <Button onClick={handleApplyDates} variant="contained">
//               Appliquer
//             </Button>
//           </Stack>
//         </DialogContent>
//       </Dialog>
//     </Box>
//   );
// };

// export default LogsPage;






// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   CircularProgress,
//   Dialog,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Stack,
//   TextField,
//   DialogContent,
//   Chip
// } from "@mui/material";
// import { 
//   FilterList
// } from "@mui/icons-material";
// import axios from 'axios';

// // Définition des couleurs constantes pour l'harmonisation
// const DETECTION_COLORS = {
//   person: { color: "green", rgb: [0, 128, 0] },
//   face: { color: "blue", rgb: [0, 0, 255] },
//   object: { color: "orange", rgb: [255, 165, 0] }
// };

// const LogsPage = () => {
//   // États principaux
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // États pour les filtres
//   const [filters, setFilters] = useState({
//     person: false,
//     face: false,
//     object: false,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortAsc, setSortAsc] = useState(false);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [dateFilterOpen, setDateFilterOpen] = useState(false);
  
//   // États pour la dialog d'image
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [modalDetectionOptions, setModalDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [displayedDetections, setDisplayedDetections] = useState([]);
//   const [selectedDetection, setSelectedDetection] = useState(null);

//   // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       // Construction des paramètres de requête basés sur les filtres
//       const params = new URLSearchParams();
      
//       // Ajout des types de détection (uniquement ceux qui sont activés)
//       if (filters.person) params.append('person', 'true');
//       if (filters.face) params.append('face', 'true');
//       if (filters.object) params.append('object', 'true');
      
//       // Ajout de la recherche si présente
//       if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
//       // Ajout des dates si présentes
//       if (startDate) params.append('start_date', startDate);
//       if (endDate) params.append('end_date', endDate);
      
//       // Appel à l'API avec les paramètres de filtrage
//       const res = await axios.get(`/api/logs?${params.toString()}`);
      
//       // Tri des logs selon l'ordre choisi
//       const sortedLogs = sortLogs(res.data);
      
//       // Regrouper les logs par image (Pour consolider les détections multiples d'une même image)
//       const consolidatedLogs = consolidateLogsByImage(sortedLogs);
      
//       setLogs(consolidatedLogs);
//       setFilteredLogs(consolidatedLogs);
//     } catch (error) {
//       console.error("Erreur récupération logs :", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fonction pour consolider les logs par image
//   const consolidateLogsByImage = (logsList) => {
//     const imageMap = new Map();
    
//     logsList.forEach(log => {
//       const imageId = log.original_image;
      
//       if (!imageMap.has(imageId)) {
//         // Première entrée pour cette image
//         imageMap.set(imageId, {
//           ...log,
//           // Garder une seule copie de chaque champ
//           timestamp: log.timestamp,
//           original_image: log.original_image,
//           result_image: log.result_image,
//           image_base64: log.image_base64,
//           // Initialiser le tableau de détections
//           detections: [...log.detections]
//         });
//       } else {
//         // Fusionner les détections pour les entrées existantes
//         const existingLog = imageMap.get(imageId);
        
//         // Ajouter uniquement les nouvelles détections (éviter les doublons)
//         log.detections.forEach(detection => {
//           // Vérifier si cette détection spécifique existe déjà
//           const exists = existingLog.detections.some(
//             d => d.type === detection.type && 
//                  d.confidence === detection.confidence && 
//                  JSON.stringify(d.bbox) === JSON.stringify(detection.bbox)
//           );
          
//           if (!exists) {
//             existingLog.detections.push(detection);
//           }
//         });
        
//         // Mettre à jour le timestamp si plus récent
//         if (new Date(log.timestamp) > new Date(existingLog.timestamp)) {
//           existingLog.timestamp = log.timestamp;
//         }
//       }
//     });
    
//     // Convertir la Map en array
//     return Array.from(imageMap.values());
//   };

//   // Appel initial de l'API au chargement du composant
//   useEffect(() => {
//     fetchLogs();
//   }, []); // Dépendances vides pour exécuter uniquement au montage

//   // Appliquer les filtres à chaque changement de filtre ou de recherche
//   useEffect(() => {
//     fetchLogs();
//   }, [filters, searchTerm, startDate, endDate, sortAsc]);

//   // Effect pour filtrer les détections dans la modal selon les options sélectionnées
//   useEffect(() => {
//     if (selectedLog && selectedLog.detections) {
//       // Modifier les détections pour appliquer les couleurs standardisées
//       const detections = selectedLog.detections.map(detection => {
//         // Déterminer la couleur en fonction du type
//         let colorInfo;
//         if (detection.type === "person") {
//           colorInfo = DETECTION_COLORS.person;
//         } else if (detection.type === "face") {
//           colorInfo = DETECTION_COLORS.face;
//         } else {
//           colorInfo = DETECTION_COLORS.object;
//         }
        
//         // Retourner la détection avec la couleur standardisée
//         return {
//           ...detection,
//           color: colorInfo.rgb
//         };
//       });
      
//       const filtered = detections.filter(detection => {
//         if (detection.type === "face" && !modalDetectionOptions.face) return false;
//         if (detection.type === "person" && !modalDetectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !modalDetectionOptions.object) return false;
//         return true;
//       });
      
//       setDisplayedDetections(filtered);
//       setSelectedDetection(null); // Réinitialiser la détection sélectionnée à chaque changement de filtre
//     }
//   }, [selectedLog, modalDetectionOptions]);

//   const sortLogs = (list) => {
//     return [...list].sort((a, b) => {
//       const dateA = new Date(a.timestamp);
//       const dateB = new Date(b.timestamp);
//       return sortAsc ? dateA - dateB : dateB - dateA;
//     });
//   };

//   const handleFilterChange = (key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const handleModalDetectionChange = (key) => {
//     setModalDetectionOptions((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//     setSelectedDetection(null); // Réinitialiser la sélection quand on change de filtre
//   };

//   const resetFilters = () => {
//     setFilters({
//       person: false,
//       face: false,
//       object: false,
//     });
//     setSearchTerm("");
//     setStartDate("");
//     setEndDate("");
//   };

//   const handleImageClick = (log) => {
//     setSelectedLog(log);
//     setSelectedImage(`data:image/jpeg;base64,${log.image_base64}`);
//     // Initialiser les détections à afficher avec toutes les détections disponibles
//     setDisplayedDetections(log.detections);
//     setSelectedDetection(null); // Réinitialiser la détection sélectionnée
//     setDialogOpen(true);
//   };

//   // Fonction pour gérer le clic sur une détection active
//   const handleDetectionClick = (detection) => {
//     if (selectedDetection && selectedDetection.id === detection.id) {
//       // Si on clique sur la même détection, désélectionner
//       setSelectedDetection(null);
//     } else {
//       // Sinon, sélectionner cette détection
//       setSelectedDetection({
//         ...detection,
//         id: `${detection.type}-${detection.confidence}-${detection.bbox.join('-')}`
//       });
//     }
//   };

//   // Compter les images avec chaque type de détection (une fois par image)
//   const countByClass = {
//     person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
//     face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
//     object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
//   };
  
//   // Analyser tous les types uniques de détection pour grouper les objets
//   const uniqueDetectionTypes = React.useMemo(() => {
//     // Collecter tous les types de détection de tous les logs
//     const allTypes = logs.flatMap(log => 
//       log.detections.map(det => det.type)
//     );
    
//     // Compter les occurrences de chaque type de détection
//     const typeCounts = {};
//     allTypes.forEach(type => {
//       typeCounts[type] = (typeCounts[type] || 0) + 1;
//     });
    
//     // Convertir en tableau et trier par nombre d'occurrences (décroissant)
//     return Object.entries(typeCounts)
//       .map(([type, count]) => ({ type, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [logs]);

//   const handleDateFilterOpen = () => {
//     setDateFilterOpen(true);
//   };

//   const handleDateFilterClose = () => {
//     setDateFilterOpen(false);
//   };

//   const handleApplyDates = () => {
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   const handleClearDates = () => {
//     setStartDate("");
//     setEndDate("");
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   // Extraire les types de détections pour l'affichage avec optimisation (déduplications)
//   const getDetectionTypes = (detections) => {
//     // Extraire tous les types uniques de détection
//     const uniqueTypes = [...new Set(detections.map(det => det.type))];
    
//     // Compter les occurrences de chaque type
//     const typeCounts = {};
//     detections.forEach(det => {
//       if (!typeCounts[det.type]) {
//         typeCounts[det.type] = 1;
//       } else {
//         typeCounts[det.type]++;
//       }
//     });
    
//     // Retourner un tableau d'objets avec le type et le nombre d'occurrences
//     return uniqueTypes.map(type => ({
//       type,
//       count: typeCounts[type]
//     }));
//   };

//   // Obtenir la couleur MUI pour un type de détection
//   const getDetectionColor = (type) => {
//     if (type === "person") return "success";
//     if (type === "face") return "primary";
//     return "warning";
//   };

//   // Afficher les boîtes de détection dans la modal
//   const renderDetectionBoxes = () => {
//     if (!selectedLog) return null;
    
//     // Déterminer quelles détections afficher (toutes ou une sélectionnée)
//     const detectionsToRender = selectedDetection 
//       ? displayedDetections.filter(det => 
//           `${det.type}-${det.confidence}-${det.bbox.join('-')}` === selectedDetection.id)
//       : displayedDetections;
    
//     if (!detectionsToRender.length) return null;

//     // Calculer les dimensions de l'image dans la modal pour ajuster les boîtes
//     const imgElement = document.querySelector("img[alt='Zoom image']");
//     if (!imgElement) return null;

//     const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
//     const scaleY = imgElement.clientHeight / imgElement.naturalHeight;

//     return detectionsToRender.map((detection, index) => {
//       const [x1, y1, x2, y2] = detection.bbox;
      
//       // Déterminer la couleur de bordure en fonction du type de détection
//       let borderColor;
//       if (detection.type === "person") {
//         borderColor = DETECTION_COLORS.person.color;
//       } else if (detection.type === "face") {
//         borderColor = DETECTION_COLORS.face.color;
//       } else {
//         borderColor = DETECTION_COLORS.object.color;
//       }
      
//       return (
//         <Box
//           key={index}
//           sx={{
//             position: "absolute",
//             border: `2px solid ${borderColor}`,
//             left: `${x1 * scaleX}px`,
//             top: `${y1 * scaleY}px`,
//             width: `${(x2 - x1) * scaleX}px`,
//             height: `${(y2 - y1) * scaleY}px`,
//             pointerEvents: "none"
//           }}
//         />
//       );
//     });
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         📜 Historique des Logs
//       </Typography>

//       <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
//         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
//           Statistiques
//         </Typography>
        
//         <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
//           <Chip icon={<span>📄</span>} label={`Total logs : ${logs.length}`} />
//           <Chip icon={<span>👤</span>} label={`Personnes : ${countByClass.person}`} color="success" />
//           <Chip icon={<span>🧠</span>} label={`Visages : ${countByClass.face}`} color="primary" />
//           <Chip icon={<span>📦</span>} label={`Objets : ${countByClass.object}`} color="warning" />
          
//           <Button
//             size="small"
//             variant="outlined"
//             onClick={() => setSortAsc((prev) => !prev)}
//           >
//             Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
//           </Button>

//           <Button
//             variant="outlined"
//             onClick={handleDateFilterOpen}
//             startIcon={<FilterList />}
//           >
//             {!startDate ? "Filtrer par date" : 
//              !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
//              `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
//           </Button>
//         </Stack>
        
//         {/* Affichage des types de détection les plus fréquents */}
//         <Typography variant="subtitle2" gutterBottom>
//           Types de détection les plus fréquents :
//         </Typography>
//         <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
//           {uniqueDetectionTypes.slice(0, 10).map((item, idx) => (
//             <Chip 
//               key={idx}
//               label={`${item.type} (${item.count})`}
//               size="small"
//               variant="outlined"
//               color={
//                 item.type === "person" ? "success" : 
//                 item.type === "face" ? "primary" : "warning"
//               }
//               sx={{ mb: 1 }}
//             />
//           ))}
//         </Stack>
//       </Box>

//       <FormGroup row sx={{ mb: 2 }}>
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.person}
//               onChange={() => handleFilterChange("person")}
//               sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
//             />
//           }
//           label="Personne"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.face}
//               onChange={() => handleFilterChange("face")}
//               sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
//             />
//           }
//           label="Visage"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.object}
//               onChange={() => handleFilterChange("object")}
//               sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
//             />
//           }
//           label="Objet"
//         />
//         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
//           Réinitialiser
//         </Button>
//       </FormGroup>

//       <TextField
//         fullWidth
//         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         sx={{ mb: 3 }}
//       />

//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}

//       {!loading && filteredLogs.length === 0 && (
//         <Typography>Aucun log ne correspond aux critères.</Typography>
//       )}

//       {!loading && filteredLogs.length > 0 && (
//         <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
//           {filteredLogs.map((log, index) => (
//             <Paper key={index} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Typography variant="body2" sx={{ mb: 1 }}>
//                 📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
//               </Typography>
              
//               <Box
//                 component="img"
//                 src={`data:image/jpeg;base64,${log.image_base64}`}
//                 alt="Capture"
//                 onClick={() => handleImageClick(log)}
//                 sx={{
//                   width: "100%",
//                   height: 180,
//                   objectFit: "cover",
//                   borderRadius: 1,
//                   cursor: "pointer",
//                   mb: 2,
//                   "&:hover": {
//                     opacity: 0.9,
//                     transform: "scale(1.01)",
//                     transition: "all 0.2s"
//                   }
//                 }}
//               />
              
//               <Stack direction="row" spacing={1} flexWrap="wrap">
//                 {getDetectionTypes(log.detections).map((item, idx) => (
//                   <Chip 
//                     key={idx} 
//                     label={item.count > 1 ? `${item.type} (${item.count})` : item.type}
//                     size="small" 
//                     color={
//                       item.type === "person" ? "success" : 
//                       item.type === "face" ? "primary" : "warning"
//                     }
//                     sx={{ mb: 1 }}
//                   />
//                 ))}
//               </Stack>
//             </Paper>
//           ))}
//         </Box>
//       )}

//       {/* Dialog pour afficher l'image en grand avec les options de détection */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="lg"
//       >
//         <DialogContent sx={{ position: "relative", minWidth: "600px" }}>
//           <Box sx={{ position: "relative" }}>
//             {selectedImage && (
//               <img
//                 src={selectedImage}
//                 alt="Zoom image"
//                 style={{ 
//                   width: '100%', 
//                   maxHeight: '70vh',
//                   objectFit: 'contain',
//                   borderRadius: 8 
//                 }}
//               />
//             )}
//             {/* Afficher les bounding boxes dans la modal */}
//             {renderDetectionBoxes()}
//           </Box>
          
//           {/* Options de filtrage pour la modal */}
//           <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
//             <Typography variant="subtitle1" gutterBottom>
//               Options de détection:
//             </Typography>
//             <FormGroup row>
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.person}
//                     onChange={() => handleModalDetectionChange("person")}
//                     sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
//                   />
//                 }
//                 label="Personnes"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.face}
//                     onChange={() => handleModalDetectionChange("face")}
//                     sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
//                   />
//                 }
//                 label="Visages"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.object}
//                     onChange={() => handleModalDetectionChange("object")}
//                     sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
//                   />
//                 }
//                 label="Objets"
//               />
//             </FormGroup>
            
//             {/* Afficher les détections actives */}
//             <Typography variant="subtitle2" sx={{ mt: 2 }}>
//               Détections actives:
//             </Typography>
//             <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
//               {displayedDetections.map((det, idx) => {
//                 // Créer un ID unique pour chaque détection
//                 const detectionId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
//                 const isSelected = selectedDetection && selectedDetection.id === detectionId;
                
//                 // Déterminer la couleur en fonction du type
//                 const chipColor = 
//                   det.type === "person" ? "success" :
//                   det.type === "face" ? "primary" : "warning";
                
//                 return (
//                   <Chip 
//                     key={idx}
//                     label={`${det.type} (${Math.round(det.confidence * 100)}%)`}
//                     size="small"
//                     variant={isSelected ? "filled" : "outlined"}
//                     color={chipColor}
//                     onClick={() => handleDetectionClick({...det, id: detectionId})}
//                     sx={{ 
//                       mb: 1, 
//                       cursor: 'pointer',
//                       fontWeight: isSelected ? 'bold' : 'normal',
//                       border: isSelected ? '2px solid' : '1px solid'
//                     }}
//                   />
//                 );
//               })}
//               {selectedDetection && (
//                 <Button 
//                   size="small" 
//                   variant="outlined" 
//                   color="error" 
//                   onClick={() => setSelectedDetection(null)}
//                   sx={{ ml: 1, height: 24, fontSize: '0.75rem' }}
//                 >
//                   Tout afficher
//                 </Button>
//               )}
//             </Stack>
//           </Box>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog pour le filtre de date */}
//       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
//         <DialogContent>
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Filtrer par date
//           </Typography>
          
//           <TextField
//             label="Date de début"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <TextField
//             label="Date de fin (optionnel)"
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <Stack direction="row" spacing={2} justifyContent="flex-end">
//             <Button onClick={handleClearDates} color="secondary">
//               Effacer
//             </Button>
//             <Button onClick={handleApplyDates} variant="contained">
//               Appliquer
//             </Button>
//           </Stack>
//         </DialogContent>
//       </Dialog>
//     </Box>
//   );
// };

// export default LogsPage;



// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   CircularProgress,
//   Dialog,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Stack,
//   TextField,
//   DialogContent,
//   Chip
// } from "@mui/material";
// import { 
//   FilterList
// } from "@mui/icons-material";
// import axios from 'axios';

// // Définition des couleurs constantes pour l'harmonisation
// const DETECTION_COLORS = {
//   person: { color: "green", rgb: [0, 128, 0] },
//   face: { color: "blue", rgb: [0, 0, 255] },
//   object: { color: "orange", rgb: [255, 165, 0] }
// };

// const LogsPage = () => {
//   // États principaux
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // États pour les filtres
//   const [filters, setFilters] = useState({
//     person: false,
//     face: false,
//     object: false,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortAsc, setSortAsc] = useState(false);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [dateFilterOpen, setDateFilterOpen] = useState(false);
  
//   // États pour la dialog d'image
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [modalDetectionOptions, setModalDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [displayedDetections, setDisplayedDetections] = useState([]);
//   // Modification: utiliser un tableau pour stocker les ID des détections sélectionnées
//   const [selectedDetections, setSelectedDetections] = useState([]);

//   // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       // Construction des paramètres de requête basés sur les filtres
//       const params = new URLSearchParams();
      
//       // Ajout des types de détection (uniquement ceux qui sont activés)
//       if (filters.person) params.append('person', 'true');
//       if (filters.face) params.append('face', 'true');
//       if (filters.object) params.append('object', 'true');
      
//       // Ajout de la recherche si présente
//       if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
//       // Ajout des dates si présentes
//       if (startDate) params.append('start_date', startDate);
//       if (endDate) params.append('end_date', endDate);
      
//       // Appel à l'API avec les paramètres de filtrage
//       const res = await axios.get(`/api/logs?${params.toString()}`);
      
//       // Tri des logs selon l'ordre choisi
//       const sortedLogs = sortLogs(res.data);
      
//       // Regrouper les logs par image (Pour consolider les détections multiples d'une même image)
//       const consolidatedLogs = consolidateLogsByImage(sortedLogs);
      
//       setLogs(consolidatedLogs);
//       setFilteredLogs(consolidatedLogs);
//     } catch (error) {
//       console.error("Erreur récupération logs :", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fonction pour consolider les logs par image
//   const consolidateLogsByImage = (logsList) => {
//     const imageMap = new Map();
    
//     logsList.forEach(log => {
//       const imageId = log.original_image;
      
//       if (!imageMap.has(imageId)) {
//         // Première entrée pour cette image
//         imageMap.set(imageId, {
//           ...log,
//           // Garder une seule copie de chaque champ
//           timestamp: log.timestamp,
//           original_image: log.original_image,
//           result_image: log.result_image,
//           image_base64: log.image_base64,
//           // Initialiser le tableau de détections
//           detections: [...log.detections]
//         });
//       } else {
//         // Fusionner les détections pour les entrées existantes
//         const existingLog = imageMap.get(imageId);
        
//         // Ajouter uniquement les nouvelles détections (éviter les doublons)
//         log.detections.forEach(detection => {
//           // Vérifier si cette détection spécifique existe déjà
//           const exists = existingLog.detections.some(
//             d => d.type === detection.type && 
//                  d.confidence === detection.confidence && 
//                  JSON.stringify(d.bbox) === JSON.stringify(detection.bbox)
//           );
          
//           if (!exists) {
//             existingLog.detections.push(detection);
//           }
//         });
        
//         // Mettre à jour le timestamp si plus récent
//         if (new Date(log.timestamp) > new Date(existingLog.timestamp)) {
//           existingLog.timestamp = log.timestamp;
//         }
//       }
//     });
    
//     // Convertir la Map en array
//     return Array.from(imageMap.values());
//   };

//   // Appel initial de l'API au chargement du composant
//   useEffect(() => {
//     fetchLogs();
//   }, []); // Dépendances vides pour exécuter uniquement au montage

//   // Appliquer les filtres à chaque changement de filtre ou de recherche
//   useEffect(() => {
//     fetchLogs();
//   }, [filters, searchTerm, startDate, endDate, sortAsc]);

//   // Effect pour filtrer les détections dans la modal selon les options sélectionnées
//   useEffect(() => {
//     if (selectedLog && selectedLog.detections) {
//       // Modifier les détections pour appliquer les couleurs standardisées
//       const detections = selectedLog.detections.map(detection => {
//         // Déterminer la couleur en fonction du type
//         let colorInfo;
//         if (detection.type === "person") {
//           colorInfo = DETECTION_COLORS.person;
//         } else if (detection.type === "face") {
//           colorInfo = DETECTION_COLORS.face;
//         } else {
//           colorInfo = DETECTION_COLORS.object;
//         }
        
//         // Retourner la détection avec la couleur standardisée
//         return {
//           ...detection,
//           color: colorInfo.rgb
//         };
//       });
      
//       const filtered = detections.filter(detection => {
//         if (detection.type === "face" && !modalDetectionOptions.face) return false;
//         if (detection.type === "person" && !modalDetectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !modalDetectionOptions.object) return false;
//         return true;
//       });
      
//       setDisplayedDetections(filtered);
//       setSelectedDetections([]); // Réinitialiser les détections sélectionnées à chaque changement de filtre
//     }
//   }, [selectedLog, modalDetectionOptions]);

//   const sortLogs = (list) => {
//     return [...list].sort((a, b) => {
//       const dateA = new Date(a.timestamp);
//       const dateB = new Date(b.timestamp);
//       return sortAsc ? dateA - dateB : dateB - dateA;
//     });
//   };

//   const handleFilterChange = (key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const handleModalDetectionChange = (key) => {
//     setModalDetectionOptions((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//     setSelectedDetections([]); // Réinitialiser les sélections quand on change de filtre
//   };

//   const resetFilters = () => {
//     setFilters({
//       person: false,
//       face: false,
//       object: false,
//     });
//     setSearchTerm("");
//     setStartDate("");
//     setEndDate("");
//   };

//   const handleImageClick = (log) => {
//     setSelectedLog(log);
//     setSelectedImage(`data:image/jpeg;base64,${log.image_base64}`);
//     // Initialiser les détections à afficher avec toutes les détections disponibles
//     setDisplayedDetections(log.detections);
//     setSelectedDetections([]); // Réinitialiser les détections sélectionnées
//     setDialogOpen(true);
//   };

//   // Fonction modifiée pour gérer le clic sur une détection avec sélection multiple
//   const handleDetectionClick = (detection) => {
//     const detectionId = `${detection.type}-${detection.confidence}-${detection.bbox.join('-')}`;
    
//     // Vérifier si la détection est déjà sélectionnée
//     const isAlreadySelected = selectedDetections.includes(detectionId);
    
//     if (isAlreadySelected) {
//       // Si déjà sélectionnée, la retirer de la liste
//       setSelectedDetections(selectedDetections.filter(id => id !== detectionId));
//     } else {
//       // Sinon, l'ajouter à la liste
//       setSelectedDetections([...selectedDetections, detectionId]);
//     }
//   };

//   // Fonction pour désélectionner toutes les détections
//   const clearAllSelections = () => {
//     setSelectedDetections([]);
//   };

//   // Compter les images avec chaque type de détection (une fois par image)
//   const countByClass = {
//     person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
//     face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
//     object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
//   };
  
//   // Analyser tous les types uniques de détection pour grouper les objets
//   const uniqueDetectionTypes = React.useMemo(() => {
//     // Collecter tous les types de détection de tous les logs
//     const allTypes = logs.flatMap(log => 
//       log.detections.map(det => det.type)
//     );
    
//     // Compter les occurrences de chaque type de détection
//     const typeCounts = {};
//     allTypes.forEach(type => {
//       typeCounts[type] = (typeCounts[type] || 0) + 1;
//     });
    
//     // Convertir en tableau et trier par nombre d'occurrences (décroissant)
//     return Object.entries(typeCounts)
//       .map(([type, count]) => ({ type, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [logs]);

//   const handleDateFilterOpen = () => {
//     setDateFilterOpen(true);
//   };

//   const handleDateFilterClose = () => {
//     setDateFilterOpen(false);
//   };

//   const handleApplyDates = () => {
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   const handleClearDates = () => {
//     setStartDate("");
//     setEndDate("");
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   // Extraire les types de détections pour l'affichage avec optimisation (déduplications)
//   const getDetectionTypes = (detections) => {
//     // Extraire tous les types uniques de détection
//     const uniqueTypes = [...new Set(detections.map(det => det.type))];
    
//     // Compter les occurrences de chaque type
//     const typeCounts = {};
//     detections.forEach(det => {
//       if (!typeCounts[det.type]) {
//         typeCounts[det.type] = 1;
//       } else {
//         typeCounts[det.type]++;
//       }
//     });
    
//     // Retourner un tableau d'objets avec le type et le nombre d'occurrences
//     return uniqueTypes.map(type => ({
//       type,
//       count: typeCounts[type]
//     }));
//   };

//   // Obtenir la couleur MUI pour un type de détection
//   const getDetectionColor = (type) => {
//     if (type === "person") return "success";
//     if (type === "face") return "primary";
//     return "warning";
//   };

//   // Afficher les boîtes de détection dans la modal
//   const renderDetectionBoxes = () => {
//     if (!selectedLog) return null;
    
//     // Déterminer quelles détections afficher (toutes ou celles sélectionnées)
//     let detectionsToRender = displayedDetections;
    
//     // Si des détections sont sélectionnées, n'afficher que celles-ci
//     if (selectedDetections.length > 0) {
//       detectionsToRender = displayedDetections.filter(det => {
//         const detId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
//         return selectedDetections.includes(detId);
//       });
//     }
    
//     if (!detectionsToRender.length) return null;

//     // Calculer les dimensions de l'image dans la modal pour ajuster les boîtes
//     const imgElement = document.querySelector("img[alt='Zoom image']");
//     if (!imgElement) return null;

//     const scaleX = imgElement.clientWidth / imgElement.naturalWidth;
//     const scaleY = imgElement.clientHeight / imgElement.naturalHeight;

//     return detectionsToRender.map((detection, index) => {
//       const [x1, y1, x2, y2] = detection.bbox;
      
//       // Déterminer la couleur de bordure en fonction du type de détection
//       let borderColor;
//       if (detection.type === "person") {
//         borderColor = DETECTION_COLORS.person.color;
//       } else if (detection.type === "face") {
//         borderColor = DETECTION_COLORS.face.color;
//       } else {
//         borderColor = DETECTION_COLORS.object.color;
//       }
      
//       return (
//         <Box
//           key={index}
//           sx={{
//             position: "absolute",
//             border: `2px solid ${borderColor}`,
//             left: `${x1 * scaleX}px`,
//             top: `${y1 * scaleY}px`,
//             width: `${(x2 - x1) * scaleX}px`,
//             height: `${(y2 - y1) * scaleY}px`,
//             pointerEvents: "none"
//           }}
//         />
//       );
//     });
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         📜 Historique des Logs
//       </Typography>

//       <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
//         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
//           Statistiques
//         </Typography>
        
//         <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
//           <Chip icon={<span>📄</span>} label={`Total logs : ${logs.length}`} />
//           <Chip icon={<span>👤</span>} label={`Personnes : ${countByClass.person}`} color="success" />
//           <Chip icon={<span>🧠</span>} label={`Visages : ${countByClass.face}`} color="primary" />
//           <Chip icon={<span>📦</span>} label={`Objets : ${countByClass.object}`} color="warning" />
          
//           <Button
//             size="small"
//             variant="outlined"
//             onClick={() => setSortAsc((prev) => !prev)}
//           >
//             Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
//           </Button>

//           <Button
//             variant="outlined"
//             onClick={handleDateFilterOpen}
//             startIcon={<FilterList />}
//           >
//             {!startDate ? "Filtrer par date" : 
//              !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
//              `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
//           </Button>
//         </Stack>
        
//         {/* Affichage des types de détection les plus fréquents */}
//         <Typography variant="subtitle2" gutterBottom>
//           Types de détection les plus fréquents :
//         </Typography>
//         <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
//           {uniqueDetectionTypes.slice(0, 10).map((item, idx) => (
//             <Chip 
//               key={idx}
//               label={`${item.type} (${item.count})`}
//               size="small"
//               variant="outlined"
//               color={
//                 item.type === "person" ? "success" : 
//                 item.type === "face" ? "primary" : "warning"
//               }
//               sx={{ mb: 1 }}
//             />
//           ))}
//         </Stack>
//       </Box>

//       <FormGroup row sx={{ mb: 2 }}>
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.person}
//               onChange={() => handleFilterChange("person")}
//               sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
//             />
//           }
//           label="Personne"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.face}
//               onChange={() => handleFilterChange("face")}
//               sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
//             />
//           }
//           label="Visage"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.object}
//               onChange={() => handleFilterChange("object")}
//               sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
//             />
//           }
//           label="Objet"
//         />
//         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
//           Réinitialiser
//         </Button>
//       </FormGroup>

//       <TextField
//         fullWidth
//         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         sx={{ mb: 3 }}
//       />

//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}

//       {!loading && filteredLogs.length === 0 && (
//         <Typography>Aucun log ne correspond aux critères.</Typography>
//       )}

//       {!loading && filteredLogs.length > 0 && (
//         <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
//           {filteredLogs.map((log, index) => (
//             <Paper key={index} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Typography variant="body2" sx={{ mb: 1 }}>
//                 📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
//               </Typography>
              
//               <Box
//                 component="img"
//                 src={`data:image/jpeg;base64,${log.image_base64}`}
//                 alt="Capture"
//                 onClick={() => handleImageClick(log)}
//                 sx={{
//                   width: "100%",
//                   height: 180,
//                   objectFit: "cover",
//                   borderRadius: 1,
//                   cursor: "pointer",
//                   mb: 2,
//                   "&:hover": {
//                     opacity: 0.9,
//                     transform: "scale(1.01)",
//                     transition: "all 0.2s"
//                   }
//                 }}
//               />
              
//               <Stack direction="row" spacing={1} flexWrap="wrap">
//                 {getDetectionTypes(log.detections).map((item, idx) => (
//                   <Chip 
//                     key={idx} 
//                     label={item.count > 1 ? `${item.type} (${item.count})` : item.type}
//                     size="small" 
//                     color={
//                       item.type === "person" ? "success" : 
//                       item.type === "face" ? "primary" : "warning"
//                     }
//                     sx={{ mb: 1 }}
//                   />
//                 ))}
//               </Stack>
//             </Paper>
//           ))}
//         </Box>
//       )}

//       {/* Dialog pour afficher l'image en grand avec les options de détection */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="lg"
//       >
//         <DialogContent sx={{ position: "relative", minWidth: "600px" }}>
//           <Box sx={{ position: "relative" }}>
//             {selectedImage && (
//               <img
//                 src={selectedImage}
//                 alt="Zoom image"
//                 style={{ 
//                   width: '100%', 
//                   maxHeight: '70vh',
//                   objectFit: 'contain',
//                   borderRadius: 8 
//                 }}
//               />
//             )}
//             {/* Afficher les bounding boxes dans la modal */}
//             {renderDetectionBoxes()}
//           </Box>
          
//           {/* Options de filtrage pour la modal */}
//           <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
//             <Typography variant="subtitle1" gutterBottom>
//               Options de détection:
//             </Typography>
//             <FormGroup row>
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.person}
//                     onChange={() => handleModalDetectionChange("person")}
//                     sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
//                   />
//                 }
//                 label="Personnes"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.face}
//                     onChange={() => handleModalDetectionChange("face")}
//                     sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
//                   />
//                 }
//                 label="Visages"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.object}
//                     onChange={() => handleModalDetectionChange("object")}
//                     sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
//                   />
//                 }
//                 label="Objets"
//               />
//             </FormGroup>
            
//             {/* Afficher les détections actives avec sélection multiple */}
//             <Typography variant="subtitle2" sx={{ mt: 2 }}>
//               Détections actives:
//             </Typography>
//             <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
//               {displayedDetections.map((det, idx) => {
//                 // Créer un ID unique pour chaque détection
//                 const detectionId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
//                 const isSelected = selectedDetections.includes(detectionId);
                
//                 // Déterminer la couleur en fonction du type
//                 const chipColor = 
//                   det.type === "person" ? "success" :
//                   det.type === "face" ? "primary" : "warning";
                
//                 return (
//                   <Chip 
//                     key={idx}
//                     label={`${det.type} (${Math.round(det.confidence * 100)}%)`}
//                     size="small"
//                     variant={isSelected ? "filled" : "outlined"}
//                     color={chipColor}
//                     onClick={() => handleDetectionClick({...det, id: detectionId})}
//                     sx={{ 
//                       mb: 1, 
//                       cursor: 'pointer',
//                       fontWeight: isSelected ? 'bold' : 'normal',
//                       border: isSelected ? '2px solid' : '1px solid'
//                     }}
//                   />
//                 );
//               })}
//               {selectedDetections.length > 0 && (
//                 <Button 
//                   size="small" 
//                   variant="outlined" 
//                   color="error" 
//                   onClick={clearAllSelections}
//                   sx={{ ml: 1, height: 24, fontSize: '0.75rem' }}
//                 >
//                   Tout afficher
//                 </Button>
//               )}
//             </Stack>
//           </Box>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog pour le filtre de date */}
//       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
//         <DialogContent>
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Filtrer par date
//           </Typography>
          
//           <TextField
//             label="Date de début"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <TextField
//             label="Date de fin (optionnel)"
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <Stack direction="row" spacing={2} justifyContent="flex-end">
//             <Button onClick={handleClearDates} color="secondary">
//               Effacer
//             </Button>
//             <Button onClick={handleApplyDates} variant="contained">
//               Appliquer
//             </Button>
//           </Stack>
//         </DialogContent>
//       </Dialog>
//     </Box>
//   );
// };

// export default LogsPage;






// import React, { useEffect, useState, useRef } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   CircularProgress,
//   Dialog,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Stack,
//   TextField,
//   DialogContent,
//   Chip
// } from "@mui/material";
// import { 
//   FilterList
// } from "@mui/icons-material";
// import axios from 'axios';

// // Définition des couleurs constantes pour l'harmonisation
// const DETECTION_COLORS = {
//   person: { color: "green", rgb: [0, 128, 0] },
//   face: { color: "blue", rgb: [0, 0, 255] },
//   object: { color: "orange", rgb: [255, 165, 0] }
// };

// const LogsPage = () => {
//   // États principaux
//   const [logs, setLogs] = useState([]);
//   const [filteredLogs, setFilteredLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
  
//   // États pour les filtres
//   const [filters, setFilters] = useState({
//     person: false,
//     face: false,
//     object: false,
//   });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortAsc, setSortAsc] = useState(false);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [dateFilterOpen, setDateFilterOpen] = useState(false);
  
//   // États pour la dialog d'image
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [selectedLog, setSelectedLog] = useState(null);
//   const [modalDetectionOptions, setModalDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [displayedDetections, setDisplayedDetections] = useState([]);
//   const [selectedDetections, setSelectedDetections] = useState([]);
  
//   // Référence pour l'image dans la modal
//   const modalImageRef = useRef(null);

//   // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
//   const fetchLogs = async () => {
//     setLoading(true);
//     try {
//       // Construction des paramètres de requête basés sur les filtres
//       const params = new URLSearchParams();
      
//       // Ajout des types de détection (uniquement ceux qui sont activés)
//       if (filters.person) params.append('person', 'true');
//       if (filters.face) params.append('face', 'true');
//       if (filters.object) params.append('object', 'true');
      
//       // Ajout de la recherche si présente
//       if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
//       // Ajout des dates si présentes
//       if (startDate) params.append('start_date', startDate);
//       if (endDate) params.append('end_date', endDate);
      
//       // Appel à l'API avec les paramètres de filtrage
//       const res = await axios.get(`/api/logs?${params.toString()}`);
      
//       // Tri des logs selon l'ordre choisi
//       const sortedLogs = sortLogs(res.data);
      
//       // Regrouper les logs par image (Pour consolider les détections multiples d'une même image)
//       const consolidatedLogs = consolidateLogsByImage(sortedLogs);
      
//       setLogs(consolidatedLogs);
//       setFilteredLogs(consolidatedLogs);
//     } catch (error) {
//       console.error("Erreur récupération logs :", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fonction pour consolider les logs par image
//   const consolidateLogsByImage = (logsList) => {
//     const imageMap = new Map();
    
//     logsList.forEach(log => {
//       const imageId = log.original_image;
      
//       if (!imageMap.has(imageId)) {
//         // Première entrée pour cette image
//         imageMap.set(imageId, {
//           ...log,
//           // Garder une seule copie de chaque champ
//           timestamp: log.timestamp,
//           original_image: log.original_image,
//           result_image: log.result_image,
//           image_base64: log.image_base64,
//           // Initialiser le tableau de détections
//           detections: [...log.detections]
//         });
//       } else {
//         // Fusionner les détections pour les entrées existantes
//         const existingLog = imageMap.get(imageId);
        
//         // Ajouter uniquement les nouvelles détections (éviter les doublons)
//         log.detections.forEach(detection => {
//           // Vérifier si cette détection spécifique existe déjà
//           const exists = existingLog.detections.some(
//             d => d.type === detection.type && 
//                  d.confidence === detection.confidence && 
//                  JSON.stringify(d.bbox) === JSON.stringify(detection.bbox)
//           );
          
//           if (!exists) {
//             existingLog.detections.push(detection);
//           }
//         });
        
//         // Mettre à jour le timestamp si plus récent
//         if (new Date(log.timestamp) > new Date(existingLog.timestamp)) {
//           existingLog.timestamp = log.timestamp;
//         }
//       }
//     });
    
//     // Convertir la Map en array
//     return Array.from(imageMap.values());
//   };

//   // Appel initial de l'API au chargement du composant
//   useEffect(() => {
//     fetchLogs();
//   }, []); // Dépendances vides pour exécuter uniquement au montage

//   // Appliquer les filtres à chaque changement de filtre ou de recherche
//   useEffect(() => {
//     fetchLogs();
//   }, [filters, searchTerm, startDate, endDate, sortAsc]);

//   // Effect pour filtrer les détections dans la modal selon les options sélectionnées
//   useEffect(() => {
//     if (selectedLog && selectedLog.detections) {
//       // Modifier les détections pour appliquer les couleurs standardisées
//       const detections = selectedLog.detections.map(detection => {
//         // Déterminer la couleur en fonction du type
//         let colorInfo;
//         if (detection.type === "person") {
//           colorInfo = DETECTION_COLORS.person;
//         } else if (detection.type === "face") {
//           colorInfo = DETECTION_COLORS.face;
//         } else {
//           colorInfo = DETECTION_COLORS.object;
//         }
        
//         // Retourner la détection avec la couleur standardisée
//         return {
//           ...detection,
//           color: colorInfo.rgb
//         };
//       });
      
//       const filtered = detections.filter(detection => {
//         if (detection.type === "face" && !modalDetectionOptions.face) return false;
//         if (detection.type === "person" && !modalDetectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !modalDetectionOptions.object) return false;
//         return true;
//       });
      
//       setDisplayedDetections(filtered);
//       setSelectedDetections([]); // Réinitialiser les détections sélectionnées à chaque changement de filtre
//     }
//   }, [selectedLog, modalDetectionOptions]);

//   // Effet pour recalculer les coordonnées des boîtes lorsque l'image est chargée ou redimensionnée
//   useEffect(() => {
//     const handleResize = () => {
//       // Force un re-rendu des boîtes de détection lorsque la fenêtre est redimensionnée
//       if (modalImageRef.current) {
//         setDisplayedDetections(prevDetections => [...prevDetections]);
//       }
//     };

//     window.addEventListener("resize", handleResize);
    
//     return () => {
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   const sortLogs = (list) => {
//     return [...list].sort((a, b) => {
//       const dateA = new Date(a.timestamp);
//       const dateB = new Date(b.timestamp);
//       return sortAsc ? dateA - dateB : dateB - dateA;
//     });
//   };

//   const handleFilterChange = (key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const handleModalDetectionChange = (key) => {
//     setModalDetectionOptions((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//     setSelectedDetections([]); // Réinitialiser les sélections quand on change de filtre
//   };

//   const resetFilters = () => {
//     setFilters({
//       person: false,
//       face: false,
//       object: false,
//     });
//     setSearchTerm("");
//     setStartDate("");
//     setEndDate("");
//   };

//   const handleImageClick = (log) => {
//     setSelectedLog(log);
//     setSelectedImage(`data:image/jpeg;base64,${log.image_base64}`);
//     // Initialiser les détections à afficher avec toutes les détections disponibles
//     setDisplayedDetections(log.detections);
//     setSelectedDetections([]); // Réinitialiser les détections sélectionnées
//     setDialogOpen(true);
//   };

//   // Fonction modifiée pour gérer le clic sur une détection avec sélection multiple
//   const handleDetectionClick = (detection) => {
//     const detectionId = `${detection.type}-${detection.confidence}-${detection.bbox.join('-')}`;
    
//     // Vérifier si la détection est déjà sélectionnée
//     const isAlreadySelected = selectedDetections.includes(detectionId);
    
//     if (isAlreadySelected) {
//       // Si déjà sélectionnée, la retirer de la liste
//       setSelectedDetections(selectedDetections.filter(id => id !== detectionId));
//     } else {
//       // Sinon, l'ajouter à la liste
//       setSelectedDetections([...selectedDetections, detectionId]);
//     }
//   };

//   // Fonction pour désélectionner toutes les détections
//   const clearAllSelections = () => {
//     setSelectedDetections([]);
//   };

//   // Compter les images avec chaque type de détection (une fois par image)
//   const countByClass = {
//     person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
//     face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
//     object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
//   };
  
//   // Analyser tous les types uniques de détection pour grouper les objets
//   const uniqueDetectionTypes = React.useMemo(() => {
//     // Collecter tous les types de détection de tous les logs
//     const allTypes = logs.flatMap(log => 
//       log.detections.map(det => det.type)
//     );
    
//     // Compter les occurrences de chaque type de détection
//     const typeCounts = {};
//     allTypes.forEach(type => {
//       typeCounts[type] = (typeCounts[type] || 0) + 1;
//     });
    
//     // Convertir en tableau et trier par nombre d'occurrences (décroissant)
//     return Object.entries(typeCounts)
//       .map(([type, count]) => ({ type, count }))
//       .sort((a, b) => b.count - a.count);
//   }, [logs]);

//   const handleDateFilterOpen = () => {
//     setDateFilterOpen(true);
//   };

//   const handleDateFilterClose = () => {
//     setDateFilterOpen(false);
//   };

//   const handleApplyDates = () => {
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   const handleClearDates = () => {
//     setStartDate("");
//     setEndDate("");
//     setDateFilterOpen(false);
//     fetchLogs();
//   };

//   // Extraire les types de détections pour l'affichage avec optimisation (déduplications)
//   const getDetectionTypes = (detections) => {
//     // Extraire tous les types uniques de détection
//     const uniqueTypes = [...new Set(detections.map(det => det.type))];
    
//     // Compter les occurrences de chaque type
//     const typeCounts = {};
//     detections.forEach(det => {
//       if (!typeCounts[det.type]) {
//         typeCounts[det.type] = 1;
//       } else {
//         typeCounts[det.type]++;
//       }
//     });
    
//     // Retourner un tableau d'objets avec le type et le nombre d'occurrences
//     return uniqueTypes.map(type => ({
//       type,
//       count: typeCounts[type]
//     }));
//   };

//   // Obtenir la couleur MUI pour un type de détection
//   const getDetectionColor = (type) => {
//     if (type === "person") return "success";
//     if (type === "face") return "primary";
//     return "warning";
//   };

//   // Fonction améliorée pour calculer les facteurs d'échelle 
//   const calculateImageScalingFactors = (imgElement) => {
//     if (!imgElement) return { scaleX: 1, scaleY: 1 };
    
//     const displayWidth = imgElement.clientWidth;
//     const displayHeight = imgElement.clientHeight;
//     const naturalWidth = imgElement.naturalWidth;
//     const naturalHeight = imgElement.naturalHeight;
    
//     // Calcul des ratios pour déterminer si l'image est contrainte par largeur ou hauteur
//     const containerRatio = displayWidth / displayHeight;
//     const imageRatio = naturalWidth / naturalHeight;
    
//     let scaleX, scaleY;
    
//     if (containerRatio > imageRatio) {
//       // L'image est contrainte par la hauteur
//       const actualDisplayWidth = displayHeight * imageRatio;
//       scaleX = actualDisplayWidth / naturalWidth;
//       scaleY = displayHeight / naturalHeight;
//     } else {
//       // L'image est contrainte par la largeur
//       const actualDisplayHeight = displayWidth / imageRatio;
//       scaleX = displayWidth / naturalWidth;
//       scaleY = actualDisplayHeight / naturalHeight;
//     }
    
//     return { scaleX, scaleY };
//   };

//   // Fonction optimisée pour dessiner les boîtes de détection
//   const renderDetectionBoxes = () => {
//     if (!selectedLog || !dialogOpen) return null;
    
//     // Attendre que l'image soit chargée pour obtenir ses dimensions
//     const imgElement = modalImageRef.current;
//     if (!imgElement) return null;
    
//     // Déterminer quelles détections afficher
//     let detectionsToRender = displayedDetections;
    
//     // Si des détections sont sélectionnées, n'afficher que celles-ci
//     if (selectedDetections.length > 0) {
//       detectionsToRender = displayedDetections.filter(det => {
//         const detId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
//         return selectedDetections.includes(detId);
//       });
//     }
    
//     if (!detectionsToRender.length) return null;

//     // Calculer les facteurs d'échelle pour s'adapter à l'image redimensionnée
//     const { scaleX, scaleY } = calculateImageScalingFactors(imgElement);
    
//     // Calcul de l'offset si l'image ne remplit pas entièrement son conteneur
//     const offsetX = (imgElement.clientWidth - (imgElement.naturalWidth * scaleX)) / 2;
//     const offsetY = (imgElement.clientHeight - (imgElement.naturalHeight * scaleY)) / 2;

//     return detectionsToRender.map((detection, index) => {
//       const [x1, y1, x2, y2] = detection.bbox;
      
//       // Déterminer la couleur de bordure en fonction du type de détection
//       let borderColor;
//       if (detection.type === "person") {
//         borderColor = DETECTION_COLORS.person.color;
//       } else if (detection.type === "face") {
//         borderColor = DETECTION_COLORS.face.color;
//       } else {
//         borderColor = DETECTION_COLORS.object.color;
//       }
      
//       // Ajout d'un label avec le type de détection et la confiance
//       const detectionLabel = `${detection.type} (${Math.round(detection.confidence * 100)}%)`;

//       return (
//         <React.Fragment key={index}>
//           <Box
//             sx={{
//               position: "absolute",
//               border: `2px solid ${borderColor}`,
//               left: `${x1 * scaleX + offsetX}px`,
//               top: `${y1 * scaleY + offsetY}px`,
//               width: `${(x2 - x1) * scaleX}px`,
//               height: `${(y2 - y1) * scaleY}px`,
//               pointerEvents: "none"
//             }}
//           />
//           <Box
//             sx={{
//               position: "absolute",
//               backgroundColor: `${borderColor}`,
//               color: "white",
//               fontSize: "12px",
//               padding: "2px 4px",
//               borderRadius: "2px",
//               left: `${x1 * scaleX + offsetX}px`,
//               top: `${(y1 * scaleY + offsetY) - 18}px`,
//               pointerEvents: "none"
//             }}
//           >
//             {detectionLabel}
//           </Box>
//         </React.Fragment>
//       );
//     });
//   };

//   // Fonction pour recalculer les boîtes de détection lorsque l'image est chargée
//   const handleImageLoad = () => {
//     // Force un re-rendu des boîtes de détection
//     setDisplayedDetections(prevDetections => [...prevDetections]);
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" gutterBottom>
//         📜 Historique des Logs
//       </Typography>

//       <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
//         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
//           Statistiques
//         </Typography>
        
//         <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
//           <Chip icon={<span>📄</span>} label={`Total logs : ${logs.length}`} />
//           <Chip icon={<span>👤</span>} label={`Personnes : ${countByClass.person}`} color="success" />
//           <Chip icon={<span>🧠</span>} label={`Visages : ${countByClass.face}`} color="primary" />
//           <Chip icon={<span>📦</span>} label={`Objets : ${countByClass.object}`} color="warning" />
          
//           <Button
//             size="small"
//             variant="outlined"
//             onClick={() => setSortAsc((prev) => !prev)}
//           >
//             Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
//           </Button>

//           <Button
//             variant="outlined"
//             onClick={handleDateFilterOpen}
//             startIcon={<FilterList />}
//           >
//             {!startDate ? "Filtrer par date" : 
//              !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
//              `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
//           </Button>
//         </Stack>
        
//         {/* Affichage des types de détection les plus fréquents */}
//         <Typography variant="subtitle2" gutterBottom>
//           Types de détection les plus fréquents :
//         </Typography>
//         <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
//           {uniqueDetectionTypes.slice(0, 10).map((item, idx) => (
//             <Chip 
//               key={idx}
//               label={`${item.type} (${item.count})`}
//               size="small"
//               variant="outlined"
//               color={
//                 item.type === "person" ? "success" : 
//                 item.type === "face" ? "primary" : "warning"
//               }
//               sx={{ mb: 1 }}
//             />
//           ))}
//         </Stack>
//       </Box>

//       <FormGroup row sx={{ mb: 2 }}>
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.person}
//               onChange={() => handleFilterChange("person")}
//               sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
//             />
//           }
//           label="Personne"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.face}
//               onChange={() => handleFilterChange("face")}
//               sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
//             />
//           }
//           label="Visage"
//         />
//         <FormControlLabel
//           control={
//             <Checkbox
//               checked={filters.object}
//               onChange={() => handleFilterChange("object")}
//               sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
//             />
//           }
//           label="Objet"
//         />
//         <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
//           Réinitialiser
//         </Button>
//       </FormGroup>

//       <TextField
//         fullWidth
//         label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         sx={{ mb: 3 }}
//       />

//       {loading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}

//       {!loading && filteredLogs.length === 0 && (
//         <Typography>Aucun log ne correspond aux critères.</Typography>
//       )}

//       {!loading && filteredLogs.length > 0 && (
//         <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
//           {filteredLogs.map((log, index) => (
//             <Paper key={index} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Typography variant="body2" sx={{ mb: 1 }}>
//                 📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
//               </Typography>
              
//               <Box
//                 component="div"
//                 sx={{
//                   position: "relative",
//                   width: "100%",
//                   height: 180,
//                   mb: 2,
//                   cursor: "pointer",
//                   overflow: "hidden",
//                   borderRadius: 1,
//                   "&:hover": {
//                     "& img": {
//                       opacity: 0.9,
//                       transform: "scale(1.01)",
//                       transition: "all 0.2s"
//                     }
//                   }
//                 }}
//                 onClick={() => handleImageClick(log)}
//               >
//                 <Box
//                   component="img"
//                   src={`data:image/jpeg;base64,${log.image_base64}`}
//                   alt="Capture"
//                   sx={{
//                     width: "100%",
//                     height: "100%",
//                     objectFit: "cover"
//                   }}
//                 />
//               </Box>
              
//               <Stack direction="row" spacing={1} flexWrap="wrap">
//                 {getDetectionTypes(log.detections).map((item, idx) => (
//                   <Chip 
//                     key={idx} 
//                     label={item.count > 1 ? `${item.type} (${item.count})` : item.type}
//                     size="small" 
//                     color={getDetectionColor(item.type)}
//                     sx={{ mb: 1 }}
//                   />
//                 ))}
//               </Stack>
//             </Paper>
//           ))}
//         </Box>
//       )}

//       {/* Dialog pour afficher l'image en grand avec les options de détection */}
//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="lg"
//         PaperProps={{
//           sx: {
//             maxWidth: '90vw',
//             maxHeight: '90vh'
//           }
//         }}
//       >
//         <DialogContent sx={{ position: "relative", minWidth: "600px", p: 3 }}>
//           <Box sx={{ position: "relative", mb: 2 }}>
//             {selectedImage && (
//               <Box 
//                 component="img"
//                 ref={modalImageRef}
//                 src={selectedImage}
//                 alt="Zoom image"
//                 onLoad={handleImageLoad}
//                 sx={{ 
//                   width: '100%',
//                   maxHeight: '70vh',
//                   objectFit: 'contain',
//                   borderRadius: 1,
//                   display: 'block'
//                 }}
//               />
//             )}
//             {/* Afficher les bounding boxes dans la modal */}
//             {renderDetectionBoxes()}
//           </Box>
          
//           {/* Options de filtrage pour la modal */}
//           <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
//             <Typography variant="subtitle1" gutterBottom>
//               Options de détection:
//             </Typography>
//             <FormGroup row>
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.person}
//                     onChange={() => handleModalDetectionChange("person")}
//                     sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
//                   />
//                 }
//                 label="Personnes"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.face}
//                     onChange={() => handleModalDetectionChange("face")}
//                     sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
//                   />
//                 }
//                 label="Visages"
//               />
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={modalDetectionOptions.object}
//                     onChange={() => handleModalDetectionChange("object")}
//                     sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
//                   />
//                 }
//                 label="Objets"
//               />
//             </FormGroup>
            
//             {/* Afficher les détections actives avec sélection multiple */}
//             <Typography variant="subtitle2" sx={{ mt: 2 }}>
//               Détections actives ({displayedDetections.length}):
//             </Typography>
//             <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
//               {displayedDetections.map((det, idx) => {
//                 // Créer un ID unique pour chaque détection
//                 const detectionId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
//                 const isSelected = selectedDetections.includes(detectionId);
                
//                 // Déterminer la couleur en fonction du type
//                 const chipColor = getDetectionColor(det.type);
                
//                 return (
//                   <Chip 
//                     key={idx}
//                     label={`${det.type} (${Math.round(det.confidence * 100)}%)`}
//                     size="small"
//                     variant={isSelected ? "filled" : "outlined"}
//                     color={chipColor}
//                     onClick={() => handleDetectionClick(det)}
//                     sx={{ 
//                       mb: 1, 
//                       cursor: 'pointer',
//                       fontWeight: isSelected ? 'bold' : 'normal',
//                       border: isSelected ? '2px solid' : '1px solid'
//                     }}
//                   />
//                 );
//               })}
//               {selectedDetections.length > 0 && (
//                 <Button 
//                   size="small" 
//                   variant="outlined" 
//                   color="error" 
//                   onClick={clearAllSelections}
//                   sx={{ ml: 1, height: 24, fontSize: '0.75rem' }}
//                 >
//                   Tout afficher
//                 </Button>
//               )}
//             </Stack>
//           </Box>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog pour le filtre de date */}
//       <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
//         <DialogContent>
//           <Typography variant="h6" sx={{ mb: 2 }}>
//             Filtrer par date
//           </Typography>
          
//           <TextField
//             label="Date de début"
//             type="date"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <TextField
//             label="Date de fin (optionnel)"
//             type="date"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//             fullWidth
//             sx={{ mb: 2 }}
//           />
          
//           <Stack direction="row" spacing={2} justifyContent="flex-end">
//             <Button onClick={handleClearDates} color="secondary">
//               Effacer
//             </Button>
//             <Button onClick={handleApplyDates} variant="contained">
//               Appliquer
//             </Button>
//           </Stack>
//         </DialogContent>
//       </Dialog>
//     </Box>
//   );
// };

// export default LogsPage;




import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Dialog,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  TextField,
  DialogContent,
  Chip
} from "@mui/material";
import { 
  FilterList
} from "@mui/icons-material";
import axios from 'axios';

// Définition des couleurs constantes pour l'harmonisation
const DETECTION_COLORS = {
  person: { color: "green", rgb: [0, 128, 0] },
  face: { color: "blue", rgb: [0, 0, 255] },
  object: { color: "orange", rgb: [255, 165, 0] }
};

const LogsPage = () => {
  // États principaux
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    person: false,
    face: false,
    object: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  
  // États pour la dialog d'image
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalDetectionOptions, setModalDetectionOptions] = useState({
    person: true,
    face: true,
    object: true,
  });
  const [displayedDetections, setDisplayedDetections] = useState([]);
  const [selectedDetections, setSelectedDetections] = useState([]);
  
  // Référence pour l'image dans la modal
  const modalImageRef = useRef(null);

  // Nouvelle fonction pour récupérer les logs avec les filtres appliqués
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Construction des paramètres de requête basés sur les filtres
      const params = new URLSearchParams();
      
      // Ajout des types de détection (uniquement ceux qui sont activés)
      if (filters.person) params.append('person', 'true');
      if (filters.face) params.append('face', 'true');
      if (filters.object) params.append('object', 'true');
      
      // Ajout de la recherche si présente
      if (searchTerm.trim() !== "") params.append('search', searchTerm);
      
      // Ajout des dates si présentes
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      // Appel à l'API avec les paramètres de filtrage
      const res = await axios.get(`/api/logs?${params.toString()}`);
      
      // Tri des logs selon l'ordre choisi
      const sortedLogs = sortLogs(res.data);
      
      // Regrouper les logs par image (Pour consolider les détections multiples d'une même image)
      const consolidatedLogs = consolidateLogsByImage(sortedLogs);
      
      setLogs(consolidatedLogs);
      setFilteredLogs(consolidatedLogs);
    } catch (error) {
      console.error("Erreur récupération logs :", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour consolider les logs par image
  const consolidateLogsByImage = (logsList) => {
    const imageMap = new Map();
    
    logsList.forEach(log => {
      const imageId = log.original_image;
      
      if (!imageMap.has(imageId)) {
        // Première entrée pour cette image
        imageMap.set(imageId, {
          ...log,
          // Garder une seule copie de chaque champ
          timestamp: log.timestamp,
          original_image: log.original_image,
          result_image: log.result_image,
          image_base64: log.image_base64,
          // Initialiser le tableau de détections
          detections: [...log.detections]
        });
      } else {
        // Fusionner les détections pour les entrées existantes
        const existingLog = imageMap.get(imageId);
        
        // Ajouter uniquement les nouvelles détections (éviter les doublons)
        log.detections.forEach(detection => {
          // Vérifier si cette détection spécifique existe déjà
          const exists = existingLog.detections.some(
            d => d.type === detection.type && 
                 d.confidence === detection.confidence && 
                 JSON.stringify(d.bbox) === JSON.stringify(detection.bbox)
          );
          
          if (!exists) {
            existingLog.detections.push(detection);
          }
        });
        
        // Mettre à jour le timestamp si plus récent
        if (new Date(log.timestamp) > new Date(existingLog.timestamp)) {
          existingLog.timestamp = log.timestamp;
        }
      }
    });
    
    // Convertir la Map en array
    return Array.from(imageMap.values());
  };

  // Appel initial de l'API au chargement du composant
  useEffect(() => {
    fetchLogs();
  }, []); // Dépendances vides pour exécuter uniquement au montage

  // Appliquer les filtres à chaque changement de filtre ou de recherche
  useEffect(() => {
    fetchLogs();
  }, [filters, searchTerm, startDate, endDate, sortAsc]);

  // Effect pour filtrer les détections dans la modal selon les options sélectionnées
  useEffect(() => {
    if (selectedLog && selectedLog.detections) {
      // Modifier les détections pour appliquer les couleurs standardisées
      const detections = selectedLog.detections.map(detection => {
        // Déterminer la couleur en fonction du type
        let colorInfo;
        if (detection.type === "person") {
          colorInfo = DETECTION_COLORS.person;
        } else if (detection.type === "face") {
          colorInfo = DETECTION_COLORS.face;
        } else {
          colorInfo = DETECTION_COLORS.object;
        }
        
        // Retourner la détection avec la couleur standardisée
        return {
          ...detection,
          color: colorInfo.rgb
        };
      });
      
      const filtered = detections.filter(detection => {
        if (detection.type === "face" && !modalDetectionOptions.face) return false;
        if (detection.type === "person" && !modalDetectionOptions.person) return false;
        if (detection.type !== "face" && detection.type !== "person" && !modalDetectionOptions.object) return false;
        return true;
      });
      
      setDisplayedDetections(filtered);
      setSelectedDetections([]); // Réinitialiser les détections sélectionnées à chaque changement de filtre
    }
  }, [selectedLog, modalDetectionOptions]);

  // Effet pour recalculer les coordonnées des boîtes lorsque l'image est chargée ou redimensionnée
  useEffect(() => {
    const handleResize = () => {
      // Force un re-rendu des boîtes de détection lorsque la fenêtre est redimensionnée
      if (modalImageRef.current) {
        setDisplayedDetections(prevDetections => [...prevDetections]);
      }
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const sortLogs = (list) => {
    return [...list].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
  };

  const handleFilterChange = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleModalDetectionChange = (key) => {
    setModalDetectionOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSelectedDetections([]); // Réinitialiser les sélections quand on change de filtre
  };

  const resetFilters = () => {
    setFilters({
      person: false,
      face: false,
      object: false,
    });
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const handleImageClick = (log) => {
    setSelectedLog(log);
    setSelectedImage(`data:image/jpeg;base64,${log.image_base64}`);
    // Initialiser les détections à afficher avec toutes les détections disponibles
    setDisplayedDetections(log.detections);
    setSelectedDetections([]); // Réinitialiser les détections sélectionnées
    setDialogOpen(true);
  };

  // Fonction modifiée pour gérer le clic sur une détection avec sélection multiple
  const handleDetectionClick = (detection) => {
    const detectionId = `${detection.type}-${detection.confidence}-${detection.bbox.join('-')}`;
    
    // Vérifier si la détection est déjà sélectionnée
    const isAlreadySelected = selectedDetections.includes(detectionId);
    
    if (isAlreadySelected) {
      // Si déjà sélectionnée, la retirer de la liste
      setSelectedDetections(selectedDetections.filter(id => id !== detectionId));
    } else {
      // Sinon, l'ajouter à la liste
      setSelectedDetections([...selectedDetections, detectionId]);
    }
  };

  // Fonction pour désélectionner toutes les détections
  const clearAllSelections = () => {
    setSelectedDetections([]);
  };

  // Compter les images avec chaque type de détection (une fois par image)
  const countByClass = {
    person: logs.filter((log) => log.detections.some(det => det.type === "person")).length,
    face: logs.filter((log) => log.detections.some(det => det.type === "face")).length,
    object: logs.filter((log) => log.detections.some(det => det.type !== "person" && det.type !== "face")).length,
  };
  
  // Analyser tous les types uniques de détection pour grouper les objets
  const uniqueDetectionTypes = React.useMemo(() => {
    // Collecter tous les types de détection de tous les logs
    const allTypes = logs.flatMap(log => 
      log.detections.map(det => det.type)
    );
    
    // Compter les occurrences de chaque type de détection
    const typeCounts = {};
    allTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    // Convertir en tableau et trier par nombre d'occurrences (décroissant)
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  const handleDateFilterOpen = () => {
    setDateFilterOpen(true);
  };

  const handleDateFilterClose = () => {
    setDateFilterOpen(false);
  };

  const handleApplyDates = () => {
    setDateFilterOpen(false);
    fetchLogs();
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setDateFilterOpen(false);
    fetchLogs();
  };

  // Extraire les types de détections pour l'affichage avec optimisation (déduplications)
  const getDetectionTypes = (detections) => {
    // Extraire tous les types uniques de détection
    const uniqueTypes = [...new Set(detections.map(det => det.type))];
    
    // Compter les occurrences de chaque type
    const typeCounts = {};
    detections.forEach(det => {
      if (!typeCounts[det.type]) {
        typeCounts[det.type] = 1;
      } else {
        typeCounts[det.type]++;
      }
    });
    
    // Retourner un tableau d'objets avec le type et le nombre d'occurrences
    return uniqueTypes.map(type => ({
      type,
      count: typeCounts[type]
    }));
  };

  // Obtenir la couleur MUI pour un type de détection
  const getDetectionColor = (type) => {
    if (type === "person") return "success";
    if (type === "face") return "primary";
    return "warning";
  };

  // Fonction améliorée pour calculer les facteurs d'échelle 
  const calculateImageScalingFactors = (imgElement) => {
    if (!imgElement) return { scaleX: 1, scaleY: 1 };
    
    const displayWidth = imgElement.clientWidth;
    const displayHeight = imgElement.clientHeight;
    const naturalWidth = imgElement.naturalWidth;
    const naturalHeight = imgElement.naturalHeight;
    
    // Calcul des ratios pour déterminer si l'image est contrainte par largeur ou hauteur
    const containerRatio = displayWidth / displayHeight;
    const imageRatio = naturalWidth / naturalHeight;
    
    let scaleX, scaleY;
    
    if (containerRatio > imageRatio) {
      // L'image est contrainte par la hauteur
      const actualDisplayWidth = displayHeight * imageRatio;
      scaleX = actualDisplayWidth / naturalWidth;
      scaleY = displayHeight / naturalHeight;
    } else {
      // L'image est contrainte par la largeur
      const actualDisplayHeight = displayWidth / imageRatio;
      scaleX = displayWidth / naturalWidth;
      scaleY = actualDisplayHeight / naturalHeight;
    }
    
    return { scaleX, scaleY };
  };

  // Fonction optimisée pour dessiner les boîtes de détection - MODIFIÉE
  const renderDetectionBoxes = () => {
    if (!selectedLog || !dialogOpen) return null;
    
    // Attendre que l'image soit chargée pour obtenir ses dimensions
    const imgElement = modalImageRef.current;
    if (!imgElement) return null;
    
    // Déterminer quelles détections afficher
    let detectionsToRender = displayedDetections;
    
    // Si des détections sont sélectionnées, n'afficher que celles-ci
    if (selectedDetections.length > 0) {
      detectionsToRender = displayedDetections.filter(det => {
        const detId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
        return selectedDetections.includes(detId);
      });
    }
    
    if (!detectionsToRender.length) return null;

    // Calculer les facteurs d'échelle pour s'adapter à l'image redimensionnée
    const { scaleX, scaleY } = calculateImageScalingFactors(imgElement);
    
    // Calcul de l'offset si l'image ne remplit pas entièrement son conteneur
    const offsetX = (imgElement.clientWidth - (imgElement.naturalWidth * scaleX)) / 2;
    const offsetY = (imgElement.clientHeight - (imgElement.naturalHeight * scaleY)) / 2;

    return detectionsToRender.map((detection, index) => {
      const [x1, y1, x2, y2] = detection.bbox;
      
      // Déterminer la couleur de bordure en fonction du type de détection
      let borderColor;
      if (detection.type === "person") {
        borderColor = DETECTION_COLORS.person.color;
      } else if (detection.type === "face") {
        borderColor = DETECTION_COLORS.face.color;
      } else {
        borderColor = DETECTION_COLORS.object.color;
      }
      
      // Modification: afficher uniquement le pourcentage de confiance, sans le type de détection
      const detectionLabel = `${Math.round(detection.confidence * 100)}%`;

      return (
        <React.Fragment key={index}>
          <Box
            sx={{
              position: "absolute",
              border: `2px solid ${borderColor}`,
              left: `${x1 * scaleX + offsetX}px`,
              top: `${y1 * scaleY + offsetY}px`,
              width: `${(x2 - x1) * scaleX}px`,
              height: `${(y2 - y1) * scaleY}px`,
              pointerEvents: "none"
            }}
          />
          <Box
            sx={{
              position: "absolute",
              backgroundColor: `${borderColor}`,
              color: "white",
              fontSize: "12px",
              padding: "2px 4px",
              borderRadius: "2px",
              left: `${x1 * scaleX + offsetX}px`,
              top: `${(y1 * scaleY + offsetY) - 18}px`,
              pointerEvents: "none"
            }}
          >
            {detectionLabel}
          </Box>
        </React.Fragment>
      );
    });
  };

  // Fonction pour recalculer les boîtes de détection lorsque l'image est chargée
  const handleImageLoad = () => {
    // Force un re-rendu des boîtes de détection
    setDisplayedDetections(prevDetections => [...prevDetections]);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
         Historique des Logs
      </Typography>

      <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Statistiques
        </Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap">
          <Chip icon={<span></span>} label={`Total logs : ${logs.length}`} />
          <Chip icon={<span></span>} label={`Personnes : ${countByClass.person}`} color="success" />
          <Chip icon={<span></span>} label={`Visages : ${countByClass.face}`} color="primary" />
          <Chip icon={<span></span>} label={`Objets : ${countByClass.object}`} color="warning" />
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSortAsc((prev) => !prev)}
          >
            Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleDateFilterOpen}
            startIcon={<FilterList />}
          >
            {!startDate ? "Filtrer par date" : 
             !endDate ? `Date: ${new Date(startDate).toLocaleDateString()}` : 
             `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
          </Button>
        </Stack>
        
        {/* Affichage des types de détection les plus fréquents */}
        <Typography variant="subtitle2" gutterBottom>
          Types de détection les plus fréquents :
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
          {uniqueDetectionTypes.slice(0, 10).map((item, idx) => (
            <Chip 
              key={idx}
              label={`${item.type} (${item.count})`}
              size="small"
              variant="outlined"
              color={
                item.type === "person" ? "success" : 
                item.type === "face" ? "primary" : "warning"
              }
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      </Box>

      <FormGroup row sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.person}
              onChange={() => handleFilterChange("person")}
              sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
            />
          }
          label="Personne"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.face}
              onChange={() => handleFilterChange("face")}
              sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
            />
          }
          label="Visage"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.object}
              onChange={() => handleFilterChange("object")}
              sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
            />
          }
          label="Objet"
        />
        <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
          Réinitialiser
        </Button>
      </FormGroup>

      <TextField
        fullWidth
        label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && filteredLogs.length === 0 && (
        <Typography>Aucun log ne correspond aux critères.</Typography>
      )}

      {!loading && filteredLogs.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
          {filteredLogs.map((log, index) => (
            <Paper key={index} sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                📅 <strong>{new Date(log.timestamp).toLocaleString()}</strong>
              </Typography>
              
              <Box
                component="div"
                sx={{
                  position: "relative",
                  width: "100%",
                  height: 180,
                  mb: 2,
                  cursor: "pointer",
                  overflow: "hidden",
                  borderRadius: 1,
                  "&:hover": {
                    "& img": {
                      opacity: 0.9,
                      transform: "scale(1.01)",
                      transition: "all 0.2s"
                    }
                  }
                }}
                onClick={() => handleImageClick(log)}
              >
                <Box
                  component="img"
                  src={`data:image/jpeg;base64,${log.image_base64}`}
                  alt="Capture"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </Box>
              
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {getDetectionTypes(log.detections).map((item, idx) => (
                  <Chip 
                    key={idx} 
                    label={item.count > 1 ? `${item.type} (${item.count})` : item.type}
                    size="small" 
                    color={getDetectionColor(item.type)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog pour afficher l'image en grand avec les options de détection */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            maxWidth: '90vw',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent sx={{ position: "relative", minWidth: "600px", p: 3 }}>
          <Box sx={{ position: "relative", mb: 2 }}>
            {selectedImage && (
              <Box 
                component="img"
                ref={modalImageRef}
                src={selectedImage}
                alt="Zoom image"
                onLoad={handleImageLoad}
                sx={{ 
                  width: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                  display: 'block'
                }}
              />
            )}
            {/* Afficher les bounding boxes dans la modal */}
            {renderDetectionBoxes()}
          </Box>
          
          {/* Options de filtrage pour la modal */}
          <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Options de détection:
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={modalDetectionOptions.person}
                    onChange={() => handleModalDetectionChange("person")}
                    sx={{ color: DETECTION_COLORS.person.color, '&.Mui-checked': {color: DETECTION_COLORS.person.color} }}
                  />
                }
                label="Personnes"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={modalDetectionOptions.face}
                    onChange={() => handleModalDetectionChange("face")}
                    sx={{ color: DETECTION_COLORS.face.color, '&.Mui-checked': {color: DETECTION_COLORS.face.color} }}
                  />
                }
                label="Visages"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={modalDetectionOptions.object}
                    onChange={() => handleModalDetectionChange("object")}
                    sx={{ color: DETECTION_COLORS.object.color, '&.Mui-checked': {color: DETECTION_COLORS.object.color} }}
                  />
                }
                label="Objets"
              />
            </FormGroup>
            
            {/* Afficher les détections actives avec sélection multiple */}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Détections actives ({displayedDetections.length}):
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {displayedDetections.map((det, idx) => {
                // Créer un ID unique pour chaque détection
                const detectionId = `${det.type}-${det.confidence}-${det.bbox.join('-')}`;
                const isSelected = selectedDetections.includes(detectionId);
                
                // Déterminer la couleur en fonction du type
                const chipColor = getDetectionColor(det.type);
                
                return (
                  <Chip 
                    key={idx}
                    label={`${det.type} (${Math.round(det.confidence * 100)}%)`}
                    size="small"
                    variant={isSelected ? "filled" : "outlined"}
                    color={chipColor}
                    onClick={() => handleDetectionClick(det)}
                    sx={{ 
                      mb: 1, 
                      cursor: 'pointer',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      border: isSelected ? '2px solid' : '1px solid'
                    }}
                  />
                );
              })}
              {selectedDetections.length > 0 && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error" 
                  onClick={clearAllSelections}
                  sx={{ ml: 1, height: 24, fontSize: '0.75rem' }}
                >
                  Tout afficher
                </Button>
              )}
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog pour le filtre de date */}
      <Dialog open={dateFilterOpen} onClose={handleDateFilterClose}>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtrer par date
          </Typography>
          
          <TextField
            label="Date de début"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Date de fin (optionnel)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleClearDates} color="secondary">
              Effacer
            </Button>
            <Button onClick={handleApplyDates} variant="contained">
              Appliquer
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LogsPage;
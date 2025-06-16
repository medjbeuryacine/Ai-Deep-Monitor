// import React, { useState } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   CircularProgress,
//   Paper,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Modal,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";

// const DetectionBodyNicolas = () => {
//   const [loading, setLoading] = useState(false);
//   const [imageUrl, setImageUrl] = useState(null);
//   const [processedImageBlob, setProcessedImageBlob] = useState(null);
//   const [processedLog, setProcessedLog] = useState(null);
//   const [detectionOptions, setDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [modalOpen, setModalOpen] = useState(false);
//   const navigate = useNavigate();

//   const getLastImage = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("http://127.0.0.1:8000/get-last-image-file");
//       const blob = await res.blob();
//       const url = URL.createObjectURL(blob);
//       setImageUrl(url);
//       await processImage(detectionOptions);
//     } catch (e) {
//       console.error("Erreur image:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const processImage = async (options = detectionOptions) => {
//     setLoading(true);
//     try {
//       const query = `?person=${options.person}&face=${options.face}&object=${options.object}`;
//       const res = await fetch(`http://127.0.0.1:8000/process-last-image${query}`);
//       const data = await res.json();

//       setProcessedLog(data);
//       const blob = await fetch(`data:image/jpeg;base64,${data.image_base64}`).then(res => res.blob());
//       setProcessedImageBlob(blob);
//     } catch (e) {
//       console.error("Erreur traitement:", e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleDetection = async (type) => {
//     const updated = { ...detectionOptions, [type]: !detectionOptions[type] };
//     setDetectionOptions(updated);
//     await processImage(updated);
//   };

//   const goToLogs = () => {
//     navigate("/logspage", {
//       state: { 
//         recentLog: processedLog,
//         detectionOptions 
//       }
//     });
//   };

//   const processedImageUrl = processedImageBlob ? URL.createObjectURL(processedImageBlob) : null;

//   return (
//     <Box sx={{ padding: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
//       <Typography variant="h4" gutterBottom>🎯 Détection en temps réel</Typography>

//       <Paper elevation={3} sx={{ padding: 4, maxWidth: "800px", width: "100%", textAlign: "center" }}>
//         {loading && <CircularProgress />}

//         {imageUrl && (
//           <img
//             src={processedImageUrl || imageUrl}
//             alt="Dernière image"
//             style={{ width: "100%", marginBottom: 16, cursor: "zoom-in", borderRadius: 8 }}
//             onClick={() => setModalOpen(true)}
//           />
//         )}

//         <Button variant="contained" onClick={getLastImage} sx={{ mr: 2 }}>
//           Afficher dernière image
//         </Button>

//         <FormGroup row sx={{ justifyContent: "center", marginTop: 2 }}>
//           <FormControlLabel
//             control={<Checkbox sx={{ color: 'green' }} checked={detectionOptions.person} onChange={() => handleToggleDetection("person")} />}
//             label={<Typography sx={{ color: 'green', fontWeight: 'bold' }}>Détection Personne</Typography>}
//           />
//           <FormControlLabel
//             control={<Checkbox sx={{ color: 'blue' }} checked={detectionOptions.face} onChange={() => handleToggleDetection("face")} />}
//             label={<Typography sx={{ color: 'blue', fontWeight: 'bold' }}>Détection Visage</Typography>}
//           />
//           <FormControlLabel
//             control={<Checkbox sx={{ color: 'orange' }} checked={detectionOptions.object} onChange={() => handleToggleDetection("object")} />}
//             label={<Typography sx={{ color: 'orange', fontWeight: 'bold' }}>Détection Objet</Typography>}
//           />
//         </FormGroup>

//         <Button 
//           variant="outlined" 
//           sx={{ mt: 3 }} 
//           onClick={goToLogs}
//           disabled={!processedLog}
//         >
//           Afficher les logs
//         </Button>
//       </Paper>

//       <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
//         <Box sx={{ p: 4, backgroundColor: "white", margin: "auto", mt: 10, width: "90%", borderRadius: 2 }}>
//           {processedImageUrl && <img src={processedImageUrl} alt="Zoom image" width="100%" style={{ borderRadius: 8 }} />}
//         </Box>
//       </Modal>
//     </Box>
//   );
// };

// export default DetectionBodyNicolas;



// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   CircularProgress,
//   Paper,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Modal,
//   Select,
//   MenuItem,
//   InputLabel,
//   FormControl,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";

// const DetectionBodyNicolas = () => {
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState(null);
//   const [uploadedImages, setUploadedImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState("");
//   const [processedImage, setProcessedImage] = useState(null);
//   const [detections, setDetections] = useState([]);
//   const [detectionOptions, setDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [modalOpen, setModalOpen] = useState(false);
//   const navigate = useNavigate();

//   // Charger la liste des images déjà uploadées
//   const fetchUploadedImages = async () => {
//     try {
//       const response = await fetch("http://193.252.196.183:20013/api/list-uploaded-images");
//       if (response.ok) {
//         const data = await response.json();
//         setUploadedImages(data.images || []);
//       }
//     } catch (error) {
//       console.error("Error fetching images:", error);
//     }
//   };

//   useEffect(() => {
//     fetchUploadedImages();
//   }, []);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const handleImageSelect = (e) => {
//     setSelectedImage(e.target.value);
//   };

//   const uploadAndDetect = async () => {
//     if (!file) return;
    
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const query = new URLSearchParams();
//       Object.entries(detectionOptions).forEach(([key, value]) => {
//         query.append(key, value);
//       });

//       const response = await fetch(
//         `http://193.252.196.183:20013/api/upload-and-detect?${query.toString()}`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );
      
//       if (response.ok) {
//         const data = await response.json();
//         setProcessedImage(`data:image/jpeg;base64,${data.image_base64}`);
//         setDetections(data.detections || []);
//         fetchUploadedImages(); // Rafraîchir la liste des images
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const processExistingImage = async () => {
//     if (!selectedImage) return;
    
//     setLoading(true);
//     try {
//       const query = new URLSearchParams();
//       Object.entries(detectionOptions).forEach(([key, value]) => {
//         query.append(key, value);
//       });

//       const response = await fetch(
//         `http://193.252.196.183:20013/api/process-uploaded-image?filename=${selectedImage}&${query.toString()}`
//       );
      
//       if (response.ok) {
//         const data = await response.json();
//         setProcessedImage(`data:image/jpeg;base64,${data.image_base64}`);
//         setDetections(data.detections || []);
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleDetection = (type) => {
//     setDetectionOptions(prev => ({
//       ...prev,
//       [type]: !prev[type]
//     }));
//   };

//   const goToLogs = () => {
//     navigate("/logspage", {
//       state: { 
//         detections,
//         detectionOptions 
//       }
//     });
//   };

//   const renderImageWithBoxes = () => {
//     if (!processedImage) return null;

//     return (
//       <div style={{ position: "relative", marginTop: 20 }}>
//         <img
//           src={processedImage}
//           alt="Processed with detections"
//           style={{ 
//             width: "100%", 
//             maxHeight: "500px",
//             objectFit: "contain",
//             borderRadius: 8,
//             cursor: "pointer"
//           }}
//           onClick={() => setModalOpen(true)}
//         />
        
//         {/* Dessiner les boxes en React */}
//         {detections.map((detection, index) => (
//           <div
//             key={index}
//             style={{
//               position: "absolute",
//               border: `2px solid rgb(${detection.color?.join(",") || "0,255,0"})`,
//               left: `${detection.bbox[0]}px`,
//               top: `${detection.bbox[1]}px`,
//               width: `${detection.bbox[2] - detection.bbox[0]}px`,
//               height: `${detection.bbox[3] - detection.bbox[1]}px`,
//               pointerEvents: "none"
//             }}
//           >
//             <span style={{
//               position: "absolute",
//               top: -25,
//               left: 0,
//               backgroundColor: `rgba(${detection.color?.join(",") || "0,255,0"}, 0.7)`,
//               color: "white",
//               padding: "2px 5px",
//               fontSize: 12,
//               borderRadius: 3
//             }}>
//               {detection.type} ({Math.round(detection.confidence * 100)}%)
//             </span>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <Box sx={{ padding: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
//       <Typography variant="h4" gutterBottom>🎯 Détection sur images</Typography>

//       <Paper elevation={3} sx={{ padding: 4, maxWidth: "800px", width: "100%", textAlign: "center" }}>
//         {loading && <CircularProgress sx={{ my: 2 }} />}

//         <Box sx={{ mb: 3 }}>
//           <Typography variant="h6" gutterBottom>Uploader une nouvelle image</Typography>
//           <input
//             accept="image/*"
//             style={{ display: 'none' }}
//             id="upload-image"
//             type="file"
//             onChange={handleFileChange}
//           />
//           <label htmlFor="upload-image">
//             <Button variant="contained" component="span" sx={{ mr: 2 }}>
//               Sélectionner une image
//             </Button>
//           </label>
//           {file && (
//             <Button 
//               variant="contained" 
//               color="primary" 
//               onClick={uploadAndDetect}
//               disabled={loading}
//             >
//               Analyser l'image
//             </Button>
//           )}
//           {file && <Typography sx={{ mt: 1 }}>{file.name}</Typography>}
//         </Box>

//         <Box sx={{ mb: 3 }}>
//           <Typography variant="h6" gutterBottom>Ou sélectionner une image existante</Typography>
//           <FormControl fullWidth sx={{ mb: 2 }}>
//             <InputLabel id="select-image-label">Images disponibles</InputLabel>
//             <Select
//               labelId="select-image-label"
//               value={selectedImage}
//               label="Images disponibles"
//               onChange={handleImageSelect}
//             >
//               {uploadedImages.map((img) => (
//                 <MenuItem key={img} value={img}>{img}</MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//           <Button 
//             variant="contained" 
//             onClick={processExistingImage}
//             disabled={!selectedImage || loading}
//           >
//             Analyser l'image sélectionnée
//           </Button>
//         </Box>

//         <FormGroup row sx={{ justifyContent: "center", mb: 3 }}>
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.person} 
//                 onChange={() => handleToggleDetection("person")} 
//                 sx={{ color: "green" }}
//               />
//             }
//             label="Personnes"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.face} 
//                 onChange={() => handleToggleDetection("face")} 
//                 sx={{ color: "blue" }}
//               />
//             }
//             label="Visages"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.object} 
//                 onChange={() => handleToggleDetection("object")} 
//                 sx={{ color: "orange" }}
//               />
//             }
//             label="Objets"
//           />
//         </FormGroup>

//         {renderImageWithBoxes()}

//         {detections.length > 0 && (
//           <Button 
//             variant="outlined" 
//             sx={{ mt: 3 }} 
//             onClick={goToLogs}
//           >
//             Voir les logs de détection
//           </Button>
//         )}
//       </Paper>

//       <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
//         <Box sx={{ 
//           p: 4, 
//           backgroundColor: "background.paper", 
//           margin: "auto", 
//           mt: 10, 
//           width: "90%", 
//           maxWidth: "800px",
//           borderRadius: 2,
//           outline: "none",
//           maxHeight: "90vh",
//           overflow: "auto"
//         }}>
//           {processedImage && (
//             <img 
//               src={processedImage} 
//               alt="Zoom détection" 
//               style={{ width: "100%", borderRadius: 8 }} 
//             />
//           )}
//         </Box>
//       </Modal>
//     </Box>
//   );
// };

// export default DetectionBodyNicolas;









// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   CircularProgress,
//   Paper,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Modal,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";

// const DetectionBodyNicolas = () => {
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState(null);
//   const [uploadedImages, setUploadedImages] = useState([]);
//   const [processedImage, setProcessedImage] = useState(null);
//   const [allDetections, setAllDetections] = useState([]);
//   const [displayedDetections, setDisplayedDetections] = useState([]);
//   const [detectionOptions, setDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [modalOpen, setModalOpen] = useState(false);
//   const navigate = useNavigate();

//   // Charger la liste des images déjà uploadées
//   const fetchUploadedImages = async () => {
//     try {
//       const response = await fetch("http://193.252.196.183:20013/api/list-uploaded-images");
//       if (response.ok) {
//         const data = await response.json();
//         setUploadedImages(data.images || []);
//       }
//     } catch (error) {
//       console.error("Error fetching images:", error);
//     }
//   };

//   useEffect(() => {
//     fetchUploadedImages();
//   }, []);

//   // Effect pour filtrer les détections selon les options sélectionnées
//   useEffect(() => {
//     if (allDetections.length > 0) {
//       const filtered = allDetections.filter(detection => {
//         if (detection.type === "face" && !detectionOptions.face) return false;
//         if (detection.type === "person" && !detectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !detectionOptions.object) return false;
//         return true;
//       });
      
//       setDisplayedDetections(filtered);
//     }
//   }, [allDetections, detectionOptions]);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const uploadAndDetect = async () => {
//     if (!file) return;
    
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const query = new URLSearchParams();
//       Object.entries(detectionOptions).forEach(([key, value]) => {
//         query.append(key, value);
//       });

//       const response = await fetch(
//         `http://193.252.196.183:20013/api/upload-and-detect?${query.toString()}`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );
      
//       if (response.ok) {
//         const data = await response.json();
//         setProcessedImage(`data:image/jpeg;base64,${data.image_base64}`);
//         setAllDetections(data.detections || []);
//         fetchUploadedImages(); // Rafraîchir la liste des images
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleDetection = (type) => {
//     setDetectionOptions(prev => ({
//       ...prev,
//       [type]: !prev[type]
//     }));
//   };

//   const goToLogs = () => {
//     navigate("/logspage", {
//       state: { 
//         detections: displayedDetections,
//         detectionOptions 
//       }
//     });
//   };

//   const renderImageWithBoxes = () => {
//     if (!processedImage) return null;

//     return (
//       <div style={{ position: "relative", marginTop: 20 }}>
//         <img
//           src={processedImage}
//           alt="Processed with detections"
//           style={{ 
//             width: "100%", 
//             maxHeight: "500px",
//             objectFit: "contain",
//             borderRadius: 8,
//             cursor: "pointer"
//           }}
//           onClick={() => setModalOpen(true)}
//         />
        
//         {/* Dessiner les boxes en React */}
//         {displayedDetections.map((detection, index) => {
//           // Calculer les dimensions relatives pour adapter les boxes à l'image redimensionnée
//           const imgElement = document.querySelector("img[alt='Processed with detections']");
//           let scaleX = 1;
//           let scaleY = 1;
          
//           if (imgElement) {
//             const naturalWidth = imgElement.naturalWidth;
//             const naturalHeight = imgElement.naturalHeight;
//             const displayWidth = imgElement.clientWidth;
//             const displayHeight = imgElement.clientHeight;
            
//             scaleX = displayWidth / naturalWidth;
//             scaleY = displayHeight / naturalHeight;
//           }
          
//           const [x1, y1, x2, y2] = detection.bbox;
          
//           return (
//             <div
//               key={index}
//               style={{
//                 position: "absolute",
//                 border: `2px solid rgb(${detection.color?.join(",") || "0,255,0"})`,
//                 left: `${x1 * scaleX}px`,
//                 top: `${y1 * scaleY}px`,
//                 width: `${(x2 - x1) * scaleX}px`,
//                 height: `${(y2 - y1) * scaleY}px`,
//                 pointerEvents: "none"
//               }}
//             >
//               <span style={{
//                 position: "absolute",
//                 top: -25,
//                 left: 0,
//                 backgroundColor: `rgba(${detection.color?.join(",") || "0,255,0"}, 0.7)`,
//                 color: "white",
//                 padding: "2px 5px",
//                 fontSize: 12,
//                 borderRadius: 3
//               }}>
//                 {detection.type} ({Math.round(detection.confidence * 100)}%)
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <Box sx={{ padding: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
//       <Typography variant="h4" gutterBottom>🎯 Détection sur images</Typography>

//       <Paper elevation={3} sx={{ padding: 4, maxWidth: "800px", width: "100%", textAlign: "center" }}>
//         {loading && <CircularProgress sx={{ my: 2 }} />}

//         <Box sx={{ mb: 3 }}>
//           <Typography variant="h6" gutterBottom>Uploader une nouvelle image</Typography>
//           <input
//             accept="image/*"
//             style={{ display: 'none' }}
//             id="upload-image"
//             type="file"
//             onChange={handleFileChange}
//           />
//           <label htmlFor="upload-image">
//             <Button variant="contained" component="span" sx={{ mr: 2 }}>
//               Sélectionner une image
//             </Button>
//           </label>
//           {file && (
//             <Button 
//               variant="contained" 
//               color="primary" 
//               onClick={uploadAndDetect}
//               disabled={loading}
//             >
//               Analyser l'image
//             </Button>
//           )}
//           {file && <Typography sx={{ mt: 1 }}>{file.name}</Typography>}
//         </Box>

//         <FormGroup row sx={{ justifyContent: "center", mb: 3 }}>
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.person} 
//                 onChange={() => handleToggleDetection("person")} 
//                 sx={{ color: "green" }}
//               />
//             }
//             label="Personnes"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.face} 
//                 onChange={() => handleToggleDetection("face")} 
//                 sx={{ color: "blue" }}
//               />
//             }
//             label="Visages"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.object} 
//                 onChange={() => handleToggleDetection("object")} 
//                 sx={{ color: "orange" }}
//               />
//             }
//             label="Objets"
//           />
//         </FormGroup>

//         {renderImageWithBoxes()}

//         {displayedDetections.length > 0 && (
//           <Button 
//             variant="outlined" 
//             sx={{ mt: 3 }} 
//             onClick={goToLogs}
//           >
//             Voir les logs de détection
//           </Button>
//         )}
//       </Paper>

//       <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
//         <Box sx={{ 
//           p: 4, 
//           backgroundColor: "background.paper", 
//           margin: "auto", 
//           mt: 10, 
//           width: "90%", 
//           maxWidth: "800px",
//           borderRadius: 2,
//           outline: "none",
//           maxHeight: "90vh",
//           overflow: "auto"
//         }}>
//           {processedImage && (
//             <img 
//               src={processedImage} 
//               alt="Zoom détection" 
//               style={{ width: "100%", borderRadius: 8 }} 
//             />
//           )}
//         </Box>
//       </Modal>
//     </Box>
//   );
// };

// export default DetectionBodyNicolas;



// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   CircularProgress,
//   Paper,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Modal,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";

// const DetectionBodyNicolas = () => {
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState(null);
//   const [uploadedImages, setUploadedImages] = useState([]);
//   const [processedImage, setProcessedImage] = useState(null);
//   const [allDetections, setAllDetections] = useState([]);
//   const [displayedDetections, setDisplayedDetections] = useState([]);
//   const [detectionOptions, setDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [modalOpen, setModalOpen] = useState(false);
//   const navigate = useNavigate();

//   // Définition des couleurs constantes pour l'harmonisation
//   const DETECTION_COLORS = {
//     person: [0, 128, 0], // vert
//     face: [0, 0, 255],   // bleu
//     object: [255, 165, 0] // orange
//   };

//   // Charger la liste des images déjà uploadées
//   const fetchUploadedImages = async () => {
//     try {
//       const response = await fetch("http://193.252.196.183:20013/api/list-uploaded-images");
//       if (response.ok) {
//         const data = await response.json();
//         setUploadedImages(data.images || []);
//       }
//     } catch (error) {
//       console.error("Error fetching images:", error);
//     }
//   };

//   useEffect(() => {
//     fetchUploadedImages();
//   }, []);

//   // Effect pour filtrer les détections selon les options sélectionnées
//   useEffect(() => {
//     if (allDetections.length > 0) {
//       const filtered = allDetections.filter(detection => {
//         if (detection.type === "face" && !detectionOptions.face) return false;
//         if (detection.type === "person" && !detectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !detectionOptions.object) return false;
//         return true;
//       });
      
//       // Assigner les couleurs appropriées à chaque détection
//       filtered.forEach(detection => {
//         if (detection.type === "face") {
//           detection.color = DETECTION_COLORS.face;
//         } else if (detection.type === "person") {
//           detection.color = DETECTION_COLORS.person;
//         } else {
//           detection.color = DETECTION_COLORS.object;
//         }
//       });
      
//       setDisplayedDetections(filtered);
//     }
//   }, [allDetections, detectionOptions]);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const uploadAndDetect = async () => {
//     if (!file) return;
    
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const query = new URLSearchParams();
//       Object.entries(detectionOptions).forEach(([key, value]) => {
//         query.append(key, value);
//       });

//       const response = await fetch(
//         `http://193.252.196.183:20013/api/upload-and-detect?${query.toString()}`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );
      
//       if (response.ok) {
//         const data = await response.json();
//         setProcessedImage(`data:image/jpeg;base64,${data.image_base64}`);
//         setAllDetections(data.detections || []);
//         fetchUploadedImages(); // Rafraîchir la liste des images
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleDetection = (type) => {
//     setDetectionOptions(prev => ({
//       ...prev,
//       [type]: !prev[type]
//     }));
//   };

//   const goToLogs = () => {
//     navigate("/logspage", {
//       state: { 
//         detections: displayedDetections,
//         detectionOptions 
//       }
//     });
//   };

//   const renderImageWithBoxes = () => {
//     if (!processedImage) return null;

//     return (
//       <div style={{ position: "relative", marginTop: 20 }}>
//         <img
//           src={processedImage}
//           alt="Processed with detections"
//           style={{ 
//             width: "100%", 
//             maxHeight: "500px",
//             objectFit: "contain",
//             borderRadius: 8,
//             cursor: "pointer"
//           }}
//           onClick={() => setModalOpen(true)}
//         />
        
//         {/* Dessiner les boxes en React */}
//         {displayedDetections.map((detection, index) => {
//           // Calculer les dimensions relatives pour adapter les boxes à l'image redimensionnée
//           const imgElement = document.querySelector("img[alt='Processed with detections']");
//           let scaleX = 1;
//           let scaleY = 1;
          
//           if (imgElement) {
//             const naturalWidth = imgElement.naturalWidth;
//             const naturalHeight = imgElement.naturalHeight;
//             const displayWidth = imgElement.clientWidth;
//             const displayHeight = imgElement.clientHeight;
            
//             scaleX = displayWidth / naturalWidth;
//             scaleY = displayHeight / naturalHeight;
//           }
          
//           const [x1, y1, x2, y2] = detection.bbox;
          
//           return (
//             <div
//               key={index}
//               style={{
//                 position: "absolute",
//                 border: `2px solid rgb(${detection.color?.join(",") || "0,255,0"})`,
//                 left: `${x1 * scaleX}px`,
//                 top: `${y1 * scaleY}px`,
//                 width: `${(x2 - x1) * scaleX}px`,
//                 height: `${(y2 - y1) * scaleY}px`,
//                 pointerEvents: "none"
//               }}
//             >
//               <span style={{
//                 position: "absolute",
//                 top: -25,
//                 left: 0,
//                 backgroundColor: `rgba(${detection.color?.join(",") || "0,255,0"}, 0.7)`,
//                 color: "white",
//                 padding: "2px 5px",
//                 fontSize: 12,
//                 borderRadius: 3
//               }}>
//                 {Math.round(detection.confidence * 100)}%
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   return (
//     <Box sx={{ padding: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
//       <Typography variant="h4" gutterBottom>🎯 Détection sur images</Typography>

//       <Paper elevation={3} sx={{ padding: 4, maxWidth: "800px", width: "100%", textAlign: "center" }}>
//         {loading && <CircularProgress sx={{ my: 2 }} />}

//         <Box sx={{ mb: 3 }}>
//           <Typography variant="h6" gutterBottom>Uploader une nouvelle image</Typography>
//           <input
//             accept="image/*"
//             style={{ display: 'none' }}
//             id="upload-image"
//             type="file"
//             onChange={handleFileChange}
//           />
//           <label htmlFor="upload-image">
//             <Button variant="contained" component="span" sx={{ mr: 2 }}>
//               Sélectionner une image
//             </Button>
//           </label>
//           {file && (
//             <Button 
//               variant="contained" 
//               color="primary" 
//               onClick={uploadAndDetect}
//               disabled={loading}
//             >
//               Analyser l'image
//             </Button>
//           )}
//           {file && <Typography sx={{ mt: 1 }}>{file.name}</Typography>}
//         </Box>

//         <FormGroup row sx={{ justifyContent: "center", mb: 3 }}>
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.person} 
//                 onChange={() => handleToggleDetection("person")} 
//                 sx={{ color: "green" }}
//               />
//             }
//             label="Personnes"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.face} 
//                 onChange={() => handleToggleDetection("face")} 
//                 sx={{ color: "blue" }}
//               />
//             }
//             label="Visages"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.object} 
//                 onChange={() => handleToggleDetection("object")} 
//                 sx={{ color: "orange" }}
//               />
//             }
//             label="Objets"
//           />
//         </FormGroup>

//         {renderImageWithBoxes()}

//         {displayedDetections.length > 0 && (
//           <Button 
//             variant="outlined" 
//             sx={{ mt: 3 }} 
//             onClick={goToLogs}
//           >
//             Voir les logs de détection
//           </Button>
//         )}
//       </Paper>

//       <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
//         <Box sx={{ 
//           p: 4, 
//           backgroundColor: "background.paper", 
//           margin: "auto", 
//           mt: 10, 
//           width: "90%", 
//           maxWidth: "800px",
//           borderRadius: 2,
//           outline: "none",
//           maxHeight: "90vh",
//           overflow: "auto"
//         }}>
//           {processedImage && (
//             <img 
//               src={processedImage} 
//               alt="Zoom détection" 
//               style={{ width: "100%", borderRadius: 8 }} 
//             />
//           )}
//         </Box>
//       </Modal>
//     </Box>
//   );
// };

// export default DetectionBodyNicolas;






// import React, { useState, useEffect, useRef } from "react";
// import {
//   Box,
//   Typography,
//   Button,
//   CircularProgress,
//   Paper,
//   FormGroup,
//   FormControlLabel,
//   Checkbox,
//   Modal,
// } from "@mui/material";
// import { useNavigate } from "react-router-dom";

// const DetectionBodyNicolas = () => {
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState(null);
//   const [uploadedImages, setUploadedImages] = useState([]);
//   const [processedImage, setProcessedImage] = useState(null);
//   const [allDetections, setAllDetections] = useState([]);
//   const [displayedDetections, setDisplayedDetections] = useState([]);
//   const [detectionOptions, setDetectionOptions] = useState({
//     person: true,
//     face: true,
//     object: true,
//   });
//   const [modalOpen, setModalOpen] = useState(false);
//   const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
//   const imageRef = useRef(null);
//   const containerRef = useRef(null);
//   const navigate = useNavigate();

//   // Définition des couleurs constantes pour l'harmonisation
//   const DETECTION_COLORS = {
//     person: [0, 128, 0], // vert
//     face: [0, 0, 255],   // bleu
//     object: [255, 165, 0] // orange
//   };

//   // Charger la liste des images déjà uploadées
//   const fetchUploadedImages = async () => {
//     try {
//       const response = await fetch("http://193.252.196.183:20013/api/list-uploaded-images");
//       if (response.ok) {
//         const data = await response.json();
//         setUploadedImages(data.images || []);
//       }
//     } catch (error) {
//       console.error("Error fetching images:", error);
//     }
//   };

//   useEffect(() => {
//     fetchUploadedImages();
//   }, []);

//   // Effect pour filtrer les détections selon les options sélectionnées
//   useEffect(() => {
//     if (allDetections.length > 0) {
//       const filtered = allDetections.filter(detection => {
//         if (detection.type === "face" && !detectionOptions.face) return false;
//         if (detection.type === "person" && !detectionOptions.person) return false;
//         if (detection.type !== "face" && detection.type !== "person" && !detectionOptions.object) return false;
//         return true;
//       });
      
//       // Assigner les couleurs appropriées à chaque détection
//       filtered.forEach(detection => {
//         if (detection.type === "face") {
//           detection.color = DETECTION_COLORS.face;
//         } else if (detection.type === "person") {
//           detection.color = DETECTION_COLORS.person;
//         } else {
//           detection.color = DETECTION_COLORS.object;
//         }
//       });
      
//       setDisplayedDetections(filtered);
//     }
//   }, [allDetections, detectionOptions]);

//   // Effect pour mettre à jour les dimensions de l'image quand elle change
//   useEffect(() => {
//     if (processedImage && imageRef.current) {
//       const updateDimensions = () => {
//         if (imageRef.current) {
//           const rect = imageRef.current.getBoundingClientRect();
//           const containerRect = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
          
//           // Store displayed dimensions
//           setImageDimensions({
//             displayWidth: rect.width,
//             displayHeight: rect.height,
//             naturalWidth: imageRef.current.naturalWidth,
//             naturalHeight: imageRef.current.naturalHeight,
//             containerWidth: containerRect.width,
//             containerHeight: containerRect.height,
//             offsetLeft: rect.left - (containerRef.current?.getBoundingClientRect().left || 0),
//             offsetTop: rect.top - (containerRef.current?.getBoundingClientRect().top || 0)
//           });
//         }
//       };

//       // Initial update
//       const img = new Image();
//       img.onload = updateDimensions;
//       img.src = processedImage;

//       // Update on resize
//       window.addEventListener('resize', updateDimensions);
//       return () => window.removeEventListener('resize', updateDimensions);
//     }
//   }, [processedImage]);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const uploadAndDetect = async () => {
//     if (!file) return;
    
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const query = new URLSearchParams();
//       Object.entries(detectionOptions).forEach(([key, value]) => {
//         query.append(key, value);
//       });

//       const response = await fetch(
//         `http://193.252.196.183:20013/api/upload-and-detect?${query.toString()}`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );
      
//       if (response.ok) {
//         const data = await response.json();
//         setProcessedImage(`data:image/jpeg;base64,${data.image_base64}`);
//         setAllDetections(data.detections || []);
//         fetchUploadedImages(); // Rafraîchir la liste des images
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToggleDetection = (type) => {
//     setDetectionOptions(prev => ({
//       ...prev,
//       [type]: !prev[type]
//     }));
//   };

//   const goToLogs = () => {
//     navigate("/logspage", {
//       state: { 
//         detections: displayedDetections,
//         detectionOptions 
//       }
//     });
//   };

//   const calculateBoxPosition = (bbox) => {
//     if (!imageDimensions.naturalWidth || !imageDimensions.displayWidth) {
//       return { left: 0, top: 0, width: 0, height: 0 };
//     }

//     const [x1, y1, x2, y2] = bbox;
    
//     // Calculate the scaling ratio while preserving aspect ratio
//     const imageRatio = imageDimensions.naturalWidth / imageDimensions.naturalHeight;
//     const containerRatio = imageDimensions.containerWidth / imageDimensions.containerHeight;
    
//     let scaleX, scaleY;
//     let offsetX = 0, offsetY = 0;
    
//     if (imageRatio > containerRatio) {
//       // Image is wider than container (horizontal letterboxing)
//       scaleX = imageDimensions.displayWidth / imageDimensions.naturalWidth;
//       scaleY = scaleX;
//       offsetY = (imageDimensions.containerHeight - (imageDimensions.naturalHeight * scaleY)) / 2;
//     } else {
//       // Image is taller than container (vertical letterboxing)
//       scaleY = imageDimensions.displayHeight / imageDimensions.naturalHeight;
//       scaleX = scaleY;
//       offsetX = (imageDimensions.containerWidth - (imageDimensions.naturalWidth * scaleX)) / 2;
//     }
    
//     return {
//       left: x1 * scaleX + imageDimensions.offsetLeft,
//       top: y1 * scaleY + imageDimensions.offsetTop,
//       width: (x2 - x1) * scaleX,
//       height: (y2 - y1) * scaleY
//     };
//   };

//   const renderImageWithBoxes = () => {
//     if (!processedImage) return null;

//     return (
//       <div 
//         ref={containerRef}
//         style={{ 
//           position: "relative", 
//           marginTop: 20,
//           width: "100%",
//           height: "500px", // hauteur fixe pour le conteneur
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center"
//         }}
//       >
//         <img
//           ref={imageRef}
//           src={processedImage}
//           alt="Processed with detections"
//           style={{ 
//             maxWidth: "100%", 
//             maxHeight: "100%",
//             objectFit: "contain",
//             borderRadius: 8,
//             cursor: "pointer"
//           }}
//           onClick={() => setModalOpen(true)}
//         />
        
//         {displayedDetections.map((detection, index) => {
//           const { left, top, width, height } = calculateBoxPosition(detection.bbox);
          
//           if (width === 0 || height === 0) return null;
          
//           return (
//             <div
//               key={index}
//               style={{
//                 position: "absolute",
//                 border: `2px solid rgb(${detection.color?.join(",") || "0,255,0"})`,
//                 left: `${left}px`,
//                 top: `${top}px`,
//                 width: `${width}px`,
//                 height: `${height}px`,
//                 pointerEvents: "none"
//               }}
//             >
//               <span style={{
//                 position: "absolute",
//                 top: -25,
//                 left: 0,
//                 backgroundColor: `rgba(${detection.color?.join(",") || "0,255,0"}, 0.7)`,
//                 color: "white",
//                 padding: "2px 5px",
//                 fontSize: 12,
//                 borderRadius: 3
//               }}>
//                 {detection.type} {Math.round(detection.confidence * 100)}%
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   // Composant modifié pour la vue en modal
//   const renderModalContent = () => {
//     if (!processedImage) return null;
    
//     return (
//       <div style={{ position: "relative" }}>
//         <img 
//           src={processedImage} 
//           alt="Zoom détection" 
//           style={{ width: "100%", borderRadius: 8 }} 
//           ref={image => {
//             if (image && displayedDetections.length > 0) {
//               // Stockage des dimensions pour les calculs dans le modal
//               const modalScaleX = image.width / image.naturalWidth;
//               const modalScaleY = image.height / image.naturalHeight;
              
//               // Mise à jour du state n'est pas nécessaire ici car on calcule directement
//               displayedDetections.forEach((detection, index) => {
//                 const [x1, y1, x2, y2] = detection.bbox;
//                 const box = document.getElementById(`modal-box-${index}`);
//                 if (box) {
//                   box.style.left = `${x1 * modalScaleX}px`;
//                   box.style.top = `${y1 * modalScaleY}px`;
//                   box.style.width = `${(x2 - x1) * modalScaleX}px`;
//                   box.style.height = `${(y2 - y1) * modalScaleY}px`;
//                 }
//               });
//             }
//           }}
//         />
        
//         {displayedDetections.map((detection, index) => (
//           <div
//             id={`modal-box-${index}`}
//             key={`modal-${index}`}
//             style={{
//               position: "absolute",
//               border: `2px solid rgb(${detection.color?.join(",") || "0,255,0"})`,
//               left: 0,
//               top: 0,
//               width: 0,
//               height: 0,
//               pointerEvents: "none"
//             }}
//           >
//             <span style={{
//               position: "absolute",
//               top: -25,
//               left: 0,
//               backgroundColor: `rgba(${detection.color?.join(",") || "0,255,0"}, 0.7)`,
//               color: "white",
//               padding: "2px 5px",
//               fontSize: 12,
//               borderRadius: 3
//             }}>
//               {detection.type} {Math.round(detection.confidence * 100)}%
//             </span>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <Box sx={{ padding: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
//       <Typography variant="h4" gutterBottom>🎯 Détection sur images</Typography>

//       <Paper elevation={3} sx={{ padding: 4, maxWidth: "800px", width: "100%", textAlign: "center" }}>
//         {loading && <CircularProgress sx={{ my: 2 }} />}

//         <Box sx={{ mb: 3 }}>
//           <Typography variant="h6" gutterBottom>Uploader une nouvelle image</Typography>
//           <input
//             accept="image/*"
//             style={{ display: 'none' }}
//             id="upload-image"
//             type="file"
//             onChange={handleFileChange}
//           />
//           <label htmlFor="upload-image">
//             <Button variant="contained" component="span" sx={{ mr: 2 }}>
//               Sélectionner une image
//             </Button>
//           </label>
//           {file && (
//             <Button 
//               variant="contained" 
//               color="primary" 
//               onClick={uploadAndDetect}
//               disabled={loading}
//             >
//               Analyser l'image
//             </Button>
//           )}
//           {file && <Typography sx={{ mt: 1 }}>{file.name}</Typography>}
//         </Box>

//         <FormGroup row sx={{ justifyContent: "center", mb: 3 }}>
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.person} 
//                 onChange={() => handleToggleDetection("person")} 
//                 sx={{ color: "green" }}
//               />
//             }
//             label="Personnes"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.face} 
//                 onChange={() => handleToggleDetection("face")} 
//                 sx={{ color: "blue" }}
//               />
//             }
//             label="Visages"
//           />
//           <FormControlLabel
//             control={
//               <Checkbox 
//                 checked={detectionOptions.object} 
//                 onChange={() => handleToggleDetection("object")} 
//                 sx={{ color: "orange" }}
//               />
//             }
//             label="Objets"
//           />
//         </FormGroup>

//         {renderImageWithBoxes()}

//         {displayedDetections.length > 0 && (
//           <Button 
//             variant="outlined" 
//             sx={{ mt: 3 }} 
//             onClick={goToLogs}
//           >
//             Voir les logs de détection
//           </Button>
//         )}
//       </Paper>

//       <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
//         <Box sx={{ 
//           p: 4, 
//           backgroundColor: "background.paper", 
//           margin: "auto", 
//           mt: 10, 
//           width: "90%", 
//           maxWidth: "800px",
//           borderRadius: 2,
//           outline: "none",
//           maxHeight: "90vh",
//           overflow: "auto"
//         }}>
//           {renderModalContent()}
//         </Box>
//       </Modal>
//     </Box>
//   );
// };

// export default DetectionBodyNicolas;




import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Modal,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const DetectionBodyNicolas = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [processedImage, setProcessedImage] = useState(null);
  const [allDetections, setAllDetections] = useState([]);
  const [displayedDetections, setDisplayedDetections] = useState([]);
  const [detectionOptions, setDetectionOptions] = useState({
    person: true,
    face: true,
    object: true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Définition des couleurs constantes pour l'harmonisation
  const DETECTION_COLORS = {
    person: [0, 128, 0], // vert
    face: [0, 0, 255],   // bleu
    object: [255, 165, 0] // orange
  };

  // Charger la liste des images déjà uploadées
  const fetchUploadedImages = async () => {
    try {
      const response = await fetch("http://193.252.196.183:20013/api/list-uploaded-images");
      if (response.ok) {
        const data = await response.json();
        setUploadedImages(data.images || []);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  useEffect(() => {
    fetchUploadedImages();
  }, []);

  // Effect pour filtrer les détections selon les options sélectionnées
  useEffect(() => {
    if (allDetections.length > 0) {
      const filtered = allDetections.filter(detection => {
        if (detection.type === "face" && !detectionOptions.face) return false;
        if (detection.type === "person" && !detectionOptions.person) return false;
        if (detection.type !== "face" && detection.type !== "person" && !detectionOptions.object) return false;
        return true;
      });
      
      // Assigner les couleurs appropriées à chaque détection
      filtered.forEach(detection => {
        if (detection.type === "face") {
          detection.color = DETECTION_COLORS.face;
        } else if (detection.type === "person") {
          detection.color = DETECTION_COLORS.person;
        } else {
          detection.color = DETECTION_COLORS.object;
        }
      });
      
      setDisplayedDetections(filtered);
    }
  }, [allDetections, detectionOptions]);

  // Effect pour mettre à jour les dimensions de l'image quand elle change
  useEffect(() => {
    if (processedImage && imageRef.current) {
      const updateDimensions = () => {
        if (imageRef.current) {
          const rect = imageRef.current.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
          
          // Store displayed dimensions
          setImageDimensions({
            displayWidth: rect.width,
            displayHeight: rect.height,
            naturalWidth: imageRef.current.naturalWidth,
            naturalHeight: imageRef.current.naturalHeight,
            containerWidth: containerRect.width,
            containerHeight: containerRect.height,
            offsetLeft: rect.left - (containerRef.current?.getBoundingClientRect().left || 0),
            offsetTop: rect.top - (containerRef.current?.getBoundingClientRect().top || 0)
          });
        }
      };

      // Initial update
      const img = new Image();
      img.onload = updateDimensions;
      img.src = processedImage;

      // Update on resize
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [processedImage]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadAndDetect = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const query = new URLSearchParams();
      Object.entries(detectionOptions).forEach(([key, value]) => {
        query.append(key, value);
      });

      const response = await fetch(
        `http://193.252.196.183:20013/api/upload-and-detect?${query.toString()}`,
        {
          method: "POST",
          body: formData,
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setProcessedImage(`data:image/jpeg;base64,${data.image_base64}`);
        setAllDetections(data.detections || []);
        fetchUploadedImages(); // Rafraîchir la liste des images
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDetection = (type) => {
    setDetectionOptions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const goToLogs = () => {
    navigate("/logspage", {
      state: { 
        detections: displayedDetections,
        detectionOptions 
      }
    });
  };

  const calculateBoxPosition = (bbox) => {
    if (!imageDimensions.naturalWidth || !imageDimensions.displayWidth) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    const [x1, y1, x2, y2] = bbox;
    
    // Calculate the scaling ratio while preserving aspect ratio
    const imageRatio = imageDimensions.naturalWidth / imageDimensions.naturalHeight;
    const containerRatio = imageDimensions.containerWidth / imageDimensions.containerHeight;
    
    let scaleX, scaleY;
    let offsetX = 0, offsetY = 0;
    
    if (imageRatio > containerRatio) {
      // Image is wider than container (horizontal letterboxing)
      scaleX = imageDimensions.displayWidth / imageDimensions.naturalWidth;
      scaleY = scaleX;
      offsetY = (imageDimensions.containerHeight - (imageDimensions.naturalHeight * scaleY)) / 2;
    } else {
      // Image is taller than container (vertical letterboxing)
      scaleY = imageDimensions.displayHeight / imageDimensions.naturalHeight;
      scaleX = scaleY;
      offsetX = (imageDimensions.containerWidth - (imageDimensions.naturalWidth * scaleX)) / 2;
    }
    
    return {
      left: x1 * scaleX + imageDimensions.offsetLeft,
      top: y1 * scaleY + imageDimensions.offsetTop,
      width: (x2 - x1) * scaleX,
      height: (y2 - y1) * scaleY
    };
  };

  const renderImageWithBoxes = () => {
    if (!processedImage) return null;

    return (
      <div 
        ref={containerRef}
        style={{ 
          position: "relative", 
          marginTop: 20,
          width: "100%",
          height: "500px", // hauteur fixe pour le conteneur
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <img
          ref={imageRef}
          src={processedImage}
          alt="Processed with detections"
          style={{ 
            maxWidth: "100%", 
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: 8,
            cursor: "pointer"
          }}
          onClick={() => setModalOpen(true)}
        />
        
        {displayedDetections.map((detection, index) => {
          const { left, top, width, height } = calculateBoxPosition(detection.bbox);
          
          if (width === 0 || height === 0) return null;
          
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                border: `2px solid rgb(${detection.color?.join(",") || "0,255,0"})`,
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                pointerEvents: "none"
              }}
            >
              <span style={{
                position: "absolute",
                top: -25,
                left: 0,
                backgroundColor: `rgba(${detection.color?.join(",") || "0,255,0"}, 0.7)`,
                color: "white",
                padding: "2px 5px",
                fontSize: 12,
                borderRadius: 3
              }}>
                {Math.round(detection.confidence * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Composant modifié pour la vue en modal
  const renderModalContent = () => {
    if (!processedImage) return null;
    
    return (
      <div style={{ position: "relative" }}>
        <img 
          src={processedImage} 
          alt="Zoom détection" 
          style={{ width: "100%", borderRadius: 8 }} 
          ref={image => {
            if (image && displayedDetections.length > 0) {
              // Stockage des dimensions pour les calculs dans le modal
              const modalScaleX = image.width / image.naturalWidth;
              const modalScaleY = image.height / image.naturalHeight;
              
              // Mise à jour du state n'est pas nécessaire ici car on calcule directement
              displayedDetections.forEach((detection, index) => {
                const [x1, y1, x2, y2] = detection.bbox;
                const box = document.getElementById(`modal-box-${index}`);
                if (box) {
                  box.style.left = `${x1 * modalScaleX}px`;
                  box.style.top = `${y1 * modalScaleY}px`;
                  box.style.width = `${(x2 - x1) * modalScaleX}px`;
                  box.style.height = `${(y2 - y1) * modalScaleY}px`;
                }
              });
            }
          }}
        />
        
        {displayedDetections.map((detection, index) => (
          <div
            id={`modal-box-${index}`}
            key={`modal-${index}`}
            style={{
              position: "absolute",
              border: `2px solid rgb(${detection.color?.join(",") || "0,255,0"})`,
              left: 0,
              top: 0,
              width: 0,
              height: 0,
              pointerEvents: "none"
            }}
          >
            <span style={{
              position: "absolute",
              top: -25,
              left: 0,
              backgroundColor: `rgba(${detection.color?.join(",") || "0,255,0"}, 0.7)`,
              color: "white",
              padding: "2px 5px",
              fontSize: 12,
              borderRadius: 3
            }}>
              {Math.round(detection.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Box sx={{ padding: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h4" gutterBottom> Détection sur images</Typography>

      <Paper elevation={3} sx={{ padding: 4, maxWidth: "800px", width: "100%", textAlign: "center" }}>
        {loading && <CircularProgress sx={{ my: 2 }} />}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Uploader une nouvelle image</Typography>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="upload-image"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="upload-image">
            <Button variant="contained" component="span" sx={{ mr: 2 }}>
              Sélectionner une image
            </Button>
          </label>
          {file && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={uploadAndDetect}
              disabled={loading}
            >
              Analyser l'image
            </Button>
          )}
          {file && <Typography sx={{ mt: 1 }}>{file.name}</Typography>}
        </Box>

        <FormGroup row sx={{ justifyContent: "center", mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={detectionOptions.person} 
                onChange={() => handleToggleDetection("person")} 
                sx={{ color: "green" }}
              />
            }
            label="Personnes"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={detectionOptions.face} 
                onChange={() => handleToggleDetection("face")} 
                sx={{ color: "blue" }}
              />
            }
            label="Visages"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={detectionOptions.object} 
                onChange={() => handleToggleDetection("object")} 
                sx={{ color: "orange" }}
              />
            }
            label="Objets"
          />
        </FormGroup>

        {renderImageWithBoxes()}

        {displayedDetections.length > 0 && (
          <Button 
            variant="outlined" 
            sx={{ mt: 3 }} 
            onClick={goToLogs}
          >
            Voir les logs de détection
          </Button>
        )}
      </Paper>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ 
          p: 4, 
          backgroundColor: "background.paper", 
          margin: "auto", 
          mt: 10, 
          width: "90%", 
          maxWidth: "800px",
          borderRadius: 2,
          outline: "none",
          maxHeight: "90vh",
          overflow: "auto"
        }}>
          {renderModalContent()}
        </Box>
      </Modal>
    </Box>
  );
};

export default DetectionBodyNicolas;
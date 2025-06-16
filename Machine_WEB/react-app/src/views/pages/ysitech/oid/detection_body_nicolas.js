import React, { useState, useEffect } from "react";
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
  const [imageUrl, setImageUrl] = useState(null);
  const [processedImageBlob, setProcessedImageBlob] = useState(null);
  const [processedLog, setProcessedLog] = useState(null);
  const [detectionOptions, setDetectionOptions] = useState({
    person: true,
    face: true,
    object: true,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
 
  const getLastImage = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/get-last-image-file");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      await processImage(detectionOptions);
    } catch (e) {
      console.error("Erreur image:", e);
    } finally {
      setLoading(false);
    }
  };
 
  const processImage = async (options = detectionOptions) => {
    setLoading(true);
    try {
      const query = `?person=${options.person}&face=${options.face}&object=${options.object}`;
      const res = await fetch(`http://127.0.0.1:8000/process-last-image${query}`);
      const data = await res.json();
 
      setProcessedLog(data); // <- on garde le log
      const blob = await fetch(`data:image/jpeg;base64,${data.image_base64}`).then(res => res.blob());
      setProcessedImageBlob(blob);
    } catch (e) {
      console.error("Erreur traitement:", e);
    } finally {
      setLoading(false);
    }
  };
 
  const handleToggleDetection = async (type) => {
    const updated = { ...detectionOptions, [type]: !detectionOptions[type] };
    setDetectionOptions(updated);
    await processImage(updated);
  };
 
  const goToLogs = () => {
    if (processedLog) {
      navigate("/logspage", {
        state: { log: processedLog, options: detectionOptions },
      });
    }
  };
 
  const processedImageUrl = processedImageBlob ? URL.createObjectURL(processedImageBlob) : null;
 
  return (
<Box sx={{ padding: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
<Typography variant="h4" gutterBottom>Détection en temps réel</Typography>
 
      <Paper elevation={3} sx={{ padding: 4, maxWidth: "800px", width: "100%", textAlign: "center" }}>
        {loading && <CircularProgress />}
 
        {imageUrl && (
<img
            src={processedImageUrl || imageUrl}
            alt="Dernière image"
            style={{ width: "100%", marginBottom: 16, cursor: "zoom-in", borderRadius: 8 }}
            onClick={() => setModalOpen(true)}
          />
        )}
 
        <Button variant="contained" onClick={getLastImage} sx={{ mr: 2 }}>Afficher dernière image</Button>
 
        <FormGroup row sx={{ justifyContent: "center", marginTop: 2 }}>
<FormControlLabel
            control={<Checkbox sx={{ color: 'green' }} checked={detectionOptions.person} onChange={() => handleToggleDetection("person")} />}
            label={<Typography sx={{ color: 'green', fontWeight: 'bold' }}>Détection Personne</Typography>}
          />
<FormControlLabel
            control={<Checkbox sx={{ color: 'blue' }} checked={detectionOptions.face} onChange={() => handleToggleDetection("face")} />}
            label={<Typography sx={{ color: 'blue', fontWeight: 'bold' }}>Détection Visage</Typography>}
          />
<FormControlLabel
            control={<Checkbox sx={{ color: 'orange' }} checked={detectionOptions.object} onChange={() => handleToggleDetection("object")} />}
            label={<Typography sx={{ color: 'orange', fontWeight: 'bold' }}>Détection Objet</Typography>}
          />
</FormGroup>
 
        <Button variant="outlined" sx={{ mt: 3 }} onClick={goToLogs}>
          Afficher les logs
</Button>
</Paper>
 
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
<Box sx={{ p: 4, backgroundColor: "white", margin: "auto", mt: 10, width: "90%", borderRadius: 2 }}>
          {processedImageUrl && <img src={processedImageUrl} alt="Zoom image" width="100%" style={{ borderRadius: 8 }} />}
</Box>
</Modal>
</Box>
  );
};
 
export default DetectionBodyNicolas;
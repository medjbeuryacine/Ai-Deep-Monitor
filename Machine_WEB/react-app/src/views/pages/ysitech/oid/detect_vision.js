import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  MenuItem,
  Select,
  Card,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Avatar,
  Chip,
} from "@mui/material";
import { CameraAlt, Person, Schedule } from "@mui/icons-material";

const SurveillancePage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [detectedCameras, setDetectedCameras] = useState([]);
  const [faces, setFaces] = useState([]);
  const videoRef = useRef(null);

  // Simulation des caméras détectées
  useEffect(() => {
    const mockCameras = [
      { ip: "192.168.1.100", name: "Caméra sale 1" },
      { ip: "192.168.1.101", name: "Caméra sale 2" },
      { ip: "192.168.1.102", name: "Caméra sale 3" },
    ];
    
    setDetectedCameras(mockCameras);
    if (mockCameras.length > 0) {
      setSelectedCamera(mockCameras[0].ip);
    }
  }, []);

  // Simulation des personnes détectées
  useEffect(() => {
    const mockFaces = [
      {
        id: 1,
        nom: "Dupont",
        prenom: "Jean",
        heure_entree: "09:15:23",
        heure_sortie: "17:45:12",
        photo: "https://randomuser.me/api/portraits/men/32.jpg",
        statut: "employé"
      },
      {
        id: 2,
        nom: "Martin",
        prenom: "Sophie",
        heure_entree: "08:30:45",
        heure_sortie: null,
        photo: "https://randomuser.me/api/portraits/women/44.jpg",
        statut: "visiteur"
      }
    ];
    setFaces(mockFaces);
  }, []);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `capture-${new Date().toISOString()}.png`;
      link.click();
    }
  };

  const handleCameraChange = (event) => {
    setSelectedCamera(event.target.value);
  };

  return (
    <Container maxWidth="lg" className="text-white bg-gray-900 min-h-screen p-5">
      <Tabs 
        value={tabIndex} 
        onChange={(e, newIndex) => setTabIndex(newIndex)}
        indicatorColor="primary"
        textColor="inherit"
      >
        <Tab label="Surveillance" icon={<CameraAlt />} />
        <Tab label="Personnes Détectées" icon={<Person />} />
      </Tabs>

      {tabIndex === 0 && (
        <Box className="mt-4">
          <Typography variant="h5" gutterBottom>
            Surveillance en Direct
          </Typography>

          <Box className="mt-4">
            <Select
              value={selectedCamera}
              onChange={handleCameraChange}
              className="bg-gray-800 text-white"
              fullWidth
              variant="outlined"
            >
              {detectedCameras.map((camera) => (
                <MenuItem key={camera.ip} value={camera.ip}>
                  {camera.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Card className="relative mt-4 overflow-hidden">
            <CardMedia
              component="video"
              src={`rtsp://${selectedCamera}/stream`}
              autoPlay
              controls
              ref={videoRef}
              className="w-full"
              style={{ maxHeight: "70vh" }}
            />
            <Button
              onClick={captureImage}
              variant="contained"
              color="primary"
              startIcon={<CameraAlt />}
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                borderRadius: "50%",
                minWidth: 0,
                width: 56,
                height: 56,
              }}
            />
          </Card>
        </Box>
      )}

      {tabIndex === 1 && (
        <Box className="mt-4">
          <Typography variant="h5" gutterBottom>
            Historique des Détections
          </Typography>
          
          <Card className="mt-4 bg-gray-800">
            <List>
              {faces.map((face) => (
                <ListItem 
                  key={face.id} 
                  className="border-b border-gray-700 hover:bg-gray-700"
                  secondaryAction={
                    <Chip 
                      label={face.statut}
                      color={face.statut === "employé" ? "success" : "warning"}
                      size="small"
                    />
                  }
                >
                  <Avatar src={face.photo} sx={{ marginRight: 2 }} />
                  <ListItemText
                    primary={`${face.prenom} ${face.nom}`}
                    secondary={
                      <>
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <Schedule fontSize="small" sx={{ mr: 1 }} />
                          <span>Entrée: {face.heure_entree}</span>
                          {face.heure_sortie && (
                            <>
                              <span sx={{ mx: 1 }}>•</span>
                              <span>Sortie: {face.heure_sortie}</span>
                            </>
                          )}
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default SurveillancePage;
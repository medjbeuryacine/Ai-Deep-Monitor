import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress,
  Button,
  Paper,
  Checkbox,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress // Ajout d'un indicateur de progression linéaire
} from '@mui/material';
import { ArrowBack, Delete, AddPhotoAlternate, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PersonnesPhotos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photosData, setPhotosData] = useState({
    main_photo: null,
    additional_images: [],
    person_name: '',
    images_dir: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0); // Progression de l'upload en pourcentage

  // Fonction pour obtenir le chemin correct de l'image
  const getImagePath = (imageName, isMainPhoto = false) => {
    // Si ce n'est pas une photo principale, elle est dans le sous-dossier images
    const imagePathPrefix = `/api/personnes/${id}/image/`;
    return imagePathPrefix + imageName;
  };

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/personnes/${id}/images/`);
        setPhotosData(response.data);
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des photos");
        console.error(err);
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [id]);

  const handleSelectPhoto = (photoName) => {
    setSelectedPhotos(prev => 
      prev.includes(photoName) 
        ? prev.filter(name => name !== photoName) 
        : [...prev, photoName]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === photosData.additional_images.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos([...photosData.additional_images]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedPhotos.length) return;

    try {
      setLoading(true);
      const deletePromises = selectedPhotos.map(photoName => 
        axios.delete(`/api/personnes/${id}/images/${photoName}`)
      );
      
      await Promise.all(deletePromises);
      
      // Rafraîchir la liste des photos
      const response = await axios.get(`/api/personnes/${id}/images/`);
      setPhotosData(response.data);
      setSelectedPhotos([]);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors de la suppression des photos");
      console.error(err);
      setLoading(false);
    }
  };

  const handleDeleteMainPhoto = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/personnes/${id}/main_photo/`);
      
      // Rafraîchir la liste des photos
      const response = await axios.get(`/api/personnes/${id}/images/`);
      setPhotosData(response.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur lors de la suppression de la photo principale");
      console.error(err);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      setFilesToUpload(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!filesToUpload.length) return;
  
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Créer un FormData unique contenant tous les fichiers
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        // L'API FastAPI attend une liste de fichiers sous le nom 'files'
        formData.append('files', file);
      });
      
      // Envoyer tous les fichiers en une seule requête
      await axios.post(`/api/personnes/${id}/images/batch/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
  
      // Rafraîchir la liste des photos
      const response = await axios.get(`/api/personnes/${id}/images/`);
      setPhotosData(response.data);
      setUploading(false);
      setUploadDialogOpen(false);
      setFilesToUpload([]);
      setUploadProgress(0);
    } catch (err) {
      setError("Erreur lors de l'upload des photos");
      console.error(err);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>Réessayer</Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={3} display="flex" alignItems="center">
      <Typography variant="h4">Photos de {photosData.person_name}</Typography>
    </Box>

      <Box mb={3} display="flex" gap={2}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddPhotoAlternate />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Ajouter des photos
        </Button>
        
        {selectedPhotos.length > 0 && (
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<Delete />}
            onClick={handleDeleteSelected}
          >
            Supprimer ({selectedPhotos.length})
          </Button>
        )}
        
        {photosData.additional_images.length > 0 && (
          <Button 
            variant="outlined" 
            onClick={handleSelectAll}
            startIcon={selectedPhotos.length === photosData.additional_images.length ? <CheckBox /> : <CheckBoxOutlineBlank />}
          >
            {selectedPhotos.length === photosData.additional_images.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
        )}
      </Box>

      {photosData.main_photo && (
        <Box mb={4}>
        <Typography variant="h6" gutterBottom>Photo principale</Typography>
        <Paper elevation={3} sx={{ p: 2, maxWidth: 400, height: 280, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden' 
          }}>
            <img 
              src={`/api/personnes/${id}/image/${photosData.main_photo}`}
              alt="Photo principale" 
              style={{ 
                width: '100%', 
                height: '200px', 
                objectFit: 'cover', 
                borderRadius: 4 
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/path/to/fallback-image.jpg'; // Image de secours
                console.error("Erreur de chargement de l'image principale");
              }}
            />
          </Box>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<Delete />}
              onClick={handleDeleteMainPhoto}
            >
              Supprimer
            </Button>
          </Box>
        </Paper>
      </Box>
      )}

      <Box>
        <Typography variant="h6" gutterBottom>
          Photos supplémentaires ({photosData.additional_images.length})
        </Typography>
        
        {photosData.additional_images.length > 0 ? (
          <Grid container spacing={3}>
            {photosData.additional_images.map((photo, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Paper elevation={3} sx={{ 
                p: 2, 
                position: 'relative',
                height: 280, // Hauteur fixe pour toutes les cards
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Checkbox
                  checked={selectedPhotos.includes(photo)}
                  onChange={() => handleSelectPhoto(photo)}
                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                />
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden' 
                }}>
                  <img 
                    src={`/api/personnes/${id}/image/${photo}`}
                    alt={`Photo ${index + 1}`} 
                    style={{ 
                      width: '100%', 
                      height: '200px', // Hauteur fixe pour les images
                      objectFit: 'cover', // Pour que l'image couvre bien l'espace
                      borderRadius: 4 
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/path/to/fallback-image.jpg';
                      console.error(`Erreur de chargement de l'image ${photo}`);
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Aucune photo supplémentaire disponible.
          </Typography>
        )}
      </Box>

      {/* Dialog pour l'upload de photos */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)}>
      <DialogTitle>Ajouter des photos</DialogTitle>
      <DialogContent>
        <Box py={2}>
          <input
            type="file"
            accept="image/*"
            multiple // Permettre la sélection multiple
            onChange={handleFileChange}
            disabled={uploading}
          />
          {filesToUpload.length > 0 && (
            <Typography mt={1}>
              {filesToUpload.length} fichier(s) sélectionné(s)
            </Typography>
          )}
          {uploading && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Upload en cours: {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
          Annuler
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!filesToUpload.length || uploading}
          variant="contained"
          color="primary"
        >
          {uploading ? 'En cours...' : 'Uploader'}
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
};

export default PersonnesPhotos;
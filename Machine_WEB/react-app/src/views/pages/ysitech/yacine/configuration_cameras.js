import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
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
  AccordionSummary,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Avatar,
  DialogContentText,
  Switch,
  FormControlLabel,
  Snackbar,
  
} from "@mui/material";
import { 
  AddCircleOutline, 
  Delete, 
  Edit, 
  FilterList,
  ExpandMore,
  Videocam,
  CloudUpload
} from "@mui/icons-material";
import axios from 'axios';

// Définition de la base URL et de l'endpoint
// const API_BASE_URL = "http://localhost:8000";
// const API_ENDPOINT = "/api/cameras/";

const CODEC_OPTIONS = [
  'H.264',
  'H.265',
  'MPEG-4',
  'MJPEG',
  'VP9'
];


const CamerasManagement = () => {
  const [cameras, setCameras] = useState([]);
  const [filteredCameras, setFilteredCameras] = useState([]);
  const [loading, setLoading] = useState({ main: true, action: false });
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState(null);
  const [filters, setFilters] = useState({
    searchText: '',
    marques: [],
    modeles: [],
    emplacements: [],
    isActive: null,
    codecs: [],       // Nouveau filtre
    fluxActif: ''     // Nouveau filtre
  });
  const [availableFilters, setAvailableFilters] = useState({
    marques: [],
    modeles: [],
    emplacements: []
  });
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });

  // Configuration globale d'Axios pour les erreurs
  axios.interceptors.response.use(
    response => response,
    error => {
      console.error("Axios error:", error.response || error);
      return Promise.reject(error);
    }
  );



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, main: true }));
        const response = await axios.get('/api/cameras/');
        
        setCameras(response.data);
        setFilteredCameras(response.data);
        extractUniqueData(response.data);
      } catch (err) {
        setError("Erreur lors du chargement des données: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(prev => ({ ...prev, main: false }));
      }
    };

    fetchData();
  }, []);

  const extractUniqueData = (cameras) => {
    const marques = [...new Set(cameras.map(c => c.marque))];
    const modeles = [...new Set(cameras.map(c => c.modele))];
    const emplacements = [...new Set(cameras.map(c => c.emplacement))];
    
    setAvailableFilters({ marques, modeles, emplacements });
    
    setFilters(prev => ({
      ...prev,
      marques: prev.marques.filter(m => marques.includes(m)),
      modeles: prev.modeles.filter(m => modeles.includes(m)),
      emplacements: prev.emplacements.filter(e => emplacements.includes(e))
    }));
  };

  useEffect(() => {
    if (cameras.length === 0) return;

    const filtered = cameras.filter(camera => {
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        if (!camera.nom_cam?.toLowerCase().includes(searchLower) && 
            !camera.emplacement?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.marques.length > 0 && !filters.marques.includes(camera.marque)) {
        return false;
      }

      if (filters.modeles.length > 0 && !filters.modeles.includes(camera.modele)) {
        return false;
      }

      if (filters.emplacements.length > 0 && !filters.emplacements.includes(camera.emplacement)) {
        return false;
      }

      if (filters.isActive !== null && camera.is_active !== filters.isActive) {
        return false;
      }

      return true;
    });

    setFilteredCameras(filtered);
  }, [filters, cameras]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchText: '',
      marques: [],
      modeles: [],
      emplacements: [],
      isActive: null
    });
  };

  const handleAddNew = () => {
    setCurrentItem({
      IP: "",
      login: "",
      mdp: "",
      nom_cam: "",
      emplacement: "",
      adresse_MAC: "",
      adresse_flux_principal: "",
      adresse_flux_secondaire: "",
      adresse_flux_tertiaire: "",
      port_video: "554",
      is_active: true,
      marque: "",
      modele: "",
      mode_vision: "",
      image_par_sec: "30",
      codec_video: "H.264",
      photo_url: "",
      flux_principal_active: true,
      flux_secondaire_active: false,
      flux_tertiaire_active: false
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

  const validateCameraFields = (item) => {
    const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    const urlRegex = /^(rtsp|http|https):\/\/[^\s$.?#].[^\s]*$/;
  
    if (!macAddressRegex.test(item.adresse_MAC)) {
      return "L'adresse MAC doit être au format XX:XX:XX:XX:XX:XX";
    }
    
    if (item.flux_principal_active && item.adresse_flux_principal && !urlRegex.test(item.adresse_flux_principal)) {
      return "L'adresse du flux principal doit être une URL valide (ex: rtsp://...)";
    }
    if (item.flux_secondaire_active && item.adresse_flux_secondaire && !urlRegex.test(item.adresse_flux_secondaire)) {
      return "L'adresse du flux secondaire doit être une URL valide (ex: rtsp://...)";
    }
    if (item.flux_tertiaire_active && item.adresse_flux_tertiaire && !urlRegex.test(item.adresse_flux_tertiaire)) {
      return "L'adresse du flux tertiaire doit être une URL valide (ex: rtsp://...)";
    }
    
    if (isNaN(item.image_par_sec) || item.image_par_sec < 1) {
      return "L'image par seconde doit être un nombre valide";
    }
    if (isNaN(item.port_video) || item.port_video < 1 || item.port_video > 65535) {
      return "Le port vidéo doit être un nombre entre 1 et 65535";
    }
    return null;
  };

  const handleSave = async () => {
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);
  
    const validationError = validateCameraFields(currentItem);
    if (validationError) {
      setError(validationError);
      setLoading(prev => ({ ...prev, action: false }));
      setNotification({
        open: true,
        message: validationError,
        severity: 'error'
      });
      return;
    }
  
    try {
      const isEdit = currentItem?.id_cam;
      const url = isEdit 
        ? `/api/cameras/${currentItem.id_cam}`
        : `/api/cameras/`;
      const method = isEdit ? "put" : "post";
  
      const payload = {
        camera: {
          IP: currentItem.IP,
          login: currentItem.login,
          mdp: currentItem.mdp,
          nom_cam: currentItem.nom_cam,
          emplacement: currentItem.emplacement,
          adresse_MAC: currentItem.adresse_MAC,
          adresse_flux_principal: currentItem.adresse_flux_principal || null,
          adresse_flux_secondaire: currentItem.adresse_flux_secondaire || null,
          adresse_flux_tertiaire: currentItem.adresse_flux_tertiaire || null,
          port_video: parseInt(currentItem.port_video, 10),
          is_active: currentItem.is_active,
          flux_principal_active: currentItem.flux_principal_active,
          flux_secondaire_active: currentItem.flux_secondaire_active,
          flux_tertiaire_active: currentItem.flux_tertiaire_active
        },
        characteristics: {
          marque: currentItem.marque,
          modele: currentItem.modele,
          mode_vision: currentItem.mode_vision,
          image_par_sec: parseInt(currentItem.image_par_sec, 10),
          codec_video: currentItem.codec_video
        }
      };
  
      await axios[method](url, payload);
      const response = await axios.get(`/api/cameras/`);
      setCameras(response.data);
      setModalOpen(false);
      
      setNotification({
        open: true,
        message: isEdit ? "Caméra modifiée avec succès" : "Caméra ajoutée avec succès",
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
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };
  
  const confirmDelete = async () => {
    if (!cameraToDelete) return;
  
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);
  
    try {
      await axios.delete(`/api/cameras/${cameraToDelete}`);
      const response = await axios.get(`/api/cameras/`);
      setCameras(response.data);
      extractUniqueData(response.data);
      setDeleteConfirmOpen(false);
      setCameraToDelete(null);
      
      setNotification({
        open: true,
        message: "Caméra supprimée avec succès",
        severity: 'success'
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors de la suppression: " + err.message;
      setError(errorMessage);
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const validateForm = () => {
    return (
      currentItem?.nom_cam &&
      currentItem?.marque &&
      currentItem?.modele &&
      currentItem?.IP &&
      currentItem?.emplacement &&
      currentItem?.login &&
      currentItem?.mdp &&
      currentItem?.adresse_MAC &&
      (!currentItem?.flux_principal_active || currentItem?.adresse_flux_principal) && // If active, URL must exist
      (!currentItem?.flux_secondaire_active || currentItem?.adresse_flux_secondaire) && // If active, URL must exist
      (!currentItem?.flux_tertiaire_active || currentItem?.adresse_flux_tertiaire) && // If active, URL must exist
      currentItem?.mode_vision &&
      currentItem?.image_par_sec &&
      currentItem?.port_video &&
      CODEC_OPTIONS.includes(currentItem?.codec_video)
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: value === "" ? null : value
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  if (loading.main) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
  mb: 4, 
  display: 'flex', 
  flexDirection: 'column',
  alignItems: 'center'
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
    Gestion des Caméras
  </Typography>
  <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 1 }}>
    Configurez et gérez votre parc de caméras de surveillance
  </Typography>
  <Chip 
    label={`${filteredCameras.length} caméra${filteredCameras.length > 1 ? 's' : ''}`} 
    color="primary" 
    variant="outlined"
  />
</Box>

{/* Barre d'actions et de recherche */}
<Paper 
  elevation={2} 
  sx={{ 
    p: 2, 
    mb: 3, 
    borderRadius: 2,
    backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.05))'
  }}
>
  <Grid container spacing={2} alignItems="center">
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        placeholder="Rechercher par nom ou emplacement..."
        value={filters.searchText}
        onChange={(e) => handleFilterChange('searchText', e.target.value)}
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </Box>
          ),
          endAdornment: filters.searchText && (
            <IconButton 
              size="small" 
              onClick={() => handleFilterChange('searchText', '')}
              edge="end"
            >
              <Delete fontSize="small" />
            </IconButton>
          )
        }}
      />
    </Grid>
    <Grid item xs={6} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddNew}
        startIcon={<AddCircleOutline />}
        sx={{ 
          px: 3,
          boxShadow: 2,
          '&:hover': {
            boxShadow: 4
          }
        }}
      >
        Ajouter une caméra
      </Button>
    </Grid>
    <Grid item xs={6} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-end', md: 'flex-end' } }}>
      <Button
        variant={expandedFilter ? "contained" : "outlined"}
        color={expandedFilter ? "secondary" : "primary"}
        onClick={() => setExpandedFilter(!expandedFilter)}
        startIcon={<FilterList />}
        endIcon={expandedFilter ? <ExpandMore /> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>}
        sx={{ 
          px: 2,
          position: 'relative',
          '&::after': {
            content: filters.searchText || filters.marques.length > 0 || filters.modeles.length > 0 || filters.emplacements.length > 0 || filters.isActive !== null ? '""' : 'none',
            position: 'absolute',
            top: -5,
            right: -5,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'error.main'
          }
        }}
      >
        Filtres {
          (filters.searchText || filters.marques.length > 0 || filters.modeles.length > 0 || filters.emplacements.length > 0 || filters.isActive !== null) &&
          `(${[
            filters.searchText ? 1 : 0,
            filters.marques.length > 0 ? 1 : 0,
            filters.modeles.length > 0 ? 1 : 0,
            filters.emplacements.length > 0 ? 1 : 0,
            filters.isActive !== null ? 1 : 0
          ].reduce((a, b) => a + b, 0)})`
        }
      </Button>
    </Grid>
  </Grid>
</Paper>

{/* Panneau de filtres avancés */}
<Paper
  elevation={expandedFilter ? 3 : 0}
  sx={{
    mb: 3,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    maxHeight: expandedFilter ? '500px' : '0px',
    opacity: expandedFilter ? 1 : 0,
    borderRadius: 2,
    border: expandedFilter ? '1px solid' : 'none',
    borderColor: 'divider'
  }}
>
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
      <FilterList sx={{ mr: 1 }} /> Filtres avancés
    </Typography>
    
    <Divider sx={{ mb: 3 }} />
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="marque-filter-label">Marque</InputLabel>
          <Select
            labelId="marque-filter-label"
            multiple
            value={filters.marques}
            onChange={(e) => handleFilterChange('marques', e.target.value)}
            label="Marque"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 240
                }
              }
            }}
          >
            {availableFilters.marques.map(marque => (
              <MenuItem key={marque} value={marque}>
                <Checkbox checked={filters.marques.includes(marque)} />
                <ListItemText primary={marque} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="modele-filter-label">Modèle</InputLabel>
          <Select
            labelId="modele-filter-label"
            multiple
            value={filters.modeles}
            onChange={(e) => handleFilterChange('modeles', e.target.value)}
            label="Modèle"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {availableFilters.modeles.map(modele => (
              <MenuItem key={modele} value={modele}>
                <Checkbox checked={filters.modeles.includes(modele)} />
                <ListItemText primary={modele} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="emplacement-filter-label">Emplacement</InputLabel>
          <Select
            labelId="emplacement-filter-label"
            multiple
            value={filters.emplacements}
            onChange={(e) => handleFilterChange('emplacements', e.target.value)}
            label="Emplacement"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {availableFilters.emplacements.map(emplacement => (
              <MenuItem key={emplacement} value={emplacement}>
                <Checkbox checked={filters.emplacements.includes(emplacement)} />
                <ListItemText primary={emplacement} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="status-filter-label">Statut</InputLabel>
          <Select
            labelId="status-filter-label"
            value={filters.isActive === null ? "" : filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value === "" ? null : e.target.value)}
            label="Statut"
          >
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value={true}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ 
                  display: 'inline-block', 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'success.main',
                  mr: 1 
                }} />
                Actif
              </Box>
            </MenuItem>
            <MenuItem value={false}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ 
                  display: 'inline-block', 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'error.main',
                  mr: 1 
                }} />
                Inactif
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="codec-filter-label">Codec Vidéo</InputLabel>
          <Select
            labelId="codec-filter-label"
            multiple
            value={filters.codecs || []}
            onChange={(e) => handleFilterChange('codecs', e.target.value)}
            label="Codec Vidéo"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {CODEC_OPTIONS.map(codec => (
              <MenuItem key={codec} value={codec}>
                <Checkbox checked={(filters.codecs || []).includes(codec)} />
                <ListItemText primary={codec} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="flux-filter-label">Type de flux actif</InputLabel>
          <Select
            labelId="flux-filter-label"
            value={filters.fluxActif || ""}
            onChange={(e) => handleFilterChange('fluxActif', e.target.value)}
            label="Type de flux actif"
          >
            <MenuItem value="">Tous les flux</MenuItem>
            <MenuItem value="principal">Flux principal</MenuItem>
            <MenuItem value="secondaire">Flux secondaire</MenuItem>
            <MenuItem value="tertiaire">Flux tertiaire</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Box>
          {/* Badges résumant les filtres actifs */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {filters.searchText && (
              <Chip 
                label={`Recherche: "${filters.searchText}"`} 
                onDelete={() => handleFilterChange('searchText', '')}
                size="small"
                color="primary"
              />
            )}
            {filters.marques.length > 0 && (
              <Chip 
                label={`Marques: ${filters.marques.length}`} 
                onDelete={() => handleFilterChange('marques', [])}
                size="small"
                color="primary"
              />
            )}
            {filters.modeles.length > 0 && (
              <Chip 
                label={`Modèles: ${filters.modeles.length}`} 
                onDelete={() => handleFilterChange('modeles', [])}
                size="small"
                color="primary"
              />
            )}
            {filters.emplacements.length > 0 && (
              <Chip 
                label={`Emplacements: ${filters.emplacements.length}`} 
                onDelete={() => handleFilterChange('emplacements', [])}
                size="small"
                color="primary"
              />
            )}
            {filters.isActive !== null && (
              <Chip 
                label={`Statut: ${filters.isActive ? "Actif" : "Inactif"}`} 
                onDelete={() => handleFilterChange('isActive', null)}
                size="small"
                color="primary"
              />
            )}
            {(filters.codecs || []).length > 0 && (
              <Chip 
                label={`Codecs: ${filters.codecs.length}`} 
                onDelete={() => handleFilterChange('codecs', [])}
                size="small"
                color="primary"
              />
            )}
            {filters.fluxActif && (
              <Chip 
                label={`Flux: ${filters.fluxActif}`} 
                onDelete={() => handleFilterChange('fluxActif', '')}
                size="small"
                color="primary"
              />
            )}
          </Stack>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          onClick={resetFilters}
          startIcon={<Delete />}
          disabled={
            !filters.searchText &&
            filters.marques.length === 0 &&
            filters.modeles.length === 0 &&
            filters.emplacements.length === 0 &&
            filters.isActive === null &&
            !(filters.codecs || []).length > 0 &&
            !filters.fluxActif
          }
        >
          Réinitialiser tous les filtres
        </Button>
      </Grid>
    </Grid>
  </Box>
</Paper>

{/* Résumé des résultats */}
{error && (
  <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
)}

      {error && (
        <Box my={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box my={2}>
        <Typography variant="subtitle1">
          {filteredCameras.length} caméra(s) trouvée(s)
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {filteredCameras.length > 0 ? (
          filteredCameras.map(camera => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={camera.id_cam}>
      <Card sx={{ 
        backgroundColor: '#1e293b',
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        '&:hover': { 
          transform: 'translateY(-5px)',
          boxShadow: 6 
        },
        '&:focus-within': { 
          boxShadow: 4,
          border: '1px solid',
          borderColor: 'primary.main'
        },
        position: 'relative',
        overflow: 'visible'
      }}>
        {/* Badge de statut en haut à droite */}
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            zIndex: 1,
            borderRadius: '50%',
            width: 20,
            height: 20,
            backgroundColor: camera.is_active ? 'success.main' : 'error.main',
            border: '2px solid white',
            boxShadow: 1
          }}
        />

        {/* Bannière d'état en haut */}
        <Box
          sx={{
            backgroundColor: camera.is_active ? 'success.light' : 'error.light',
            color: camera.is_active ? 'success.contrastText' : 'error.contrastText',
            py: 0.5,
            textAlign: 'center',
            fontWeight: 'medium',
            fontSize: '0.75rem',
            letterSpacing: 0.5
          }}
        >
          {camera.is_active ? "CAMÉRA ACTIVE" : "CAMÉRA INACTIVE"}
        </Box>

        <CardContent sx={{ flexGrow: 1, pt: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <Avatar 
              src={camera.photo_url || "/default-camera.png"}
              role="presentation"
              sx={{ 
                height: 100, 
                width: 100,
                bgcolor: camera.photo_url ? 'transparent' : 'primary.main',
                boxShadow: 2,
                mb: 2
              }}
            >
              {!camera.photo_url && <Videocam sx={{ fontSize: 50 }} />}
            </Avatar>

            <Typography variant="h6" textAlign="center" gutterBottom>
              {camera.nom_cam}
            </Typography>

            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ 
                  display: 'inline-block', 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'info.main',
                  mr: 1 
                }} />
                {camera.emplacement}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" mb={2}>
              <Chip 
                label={`Port: ${camera.port_video}`} 
                size="small" 
                variant="outlined"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`${camera.image_par_sec} FPS`} 
                size="small"
                variant="outlined"
                color="secondary"
              />
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default', mb: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Marque</Typography>
                <Typography variant="body2" fontWeight="medium">{camera.marque}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Modèle</Typography>
                <Typography variant="body2" fontWeight="medium">{camera.modele}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Vision</Typography>
                <Typography variant="body2" fontWeight="medium">{camera.mode_vision}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Codec</Typography>
                <Typography variant="body2" fontWeight="medium">{camera.codec_video}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Indicateurs de flux */}
          <Box display="flex" gap={1} mb={2} justifyContent="center">
            <Chip 
              label="Flux 1" 
              size="small"
              color={camera.flux_principal_active ? "success" : "default"}
              variant={camera.flux_principal_active ? "filled" : "outlined"}
            />
            <Chip 
              label="Flux 2" 
              size="small"
              color={camera.flux_secondaire_active ? "success" : "default"}
              variant={camera.flux_secondaire_active ? "filled" : "outlined"}
            />
            <Chip 
              label="Flux 3" 
              size="small"
              color={camera.flux_tertiaire_active ? "success" : "default"}
              variant={camera.flux_tertiaire_active ? "filled" : "outlined"}
            />
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 1,
            mt: 'auto'
          }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit />}
              onClick={() => {
                setCurrentItem({
                  ...camera,
                  image_par_sec: camera.image_par_sec.toString(),
                  port_video: camera.port_video.toString(),
                  adresse_flux_principal: camera.adresse_flux_principal || "",
                  adresse_flux_secondaire: camera.adresse_flux_secondaire || "",
                  adresse_flux_tertiaire: camera.adresse_flux_tertiaire || "",
                  photo_url: camera.photo_url || "",
                  flux_principal_active: camera.flux_principal_active ?? true,
                  flux_secondaire_active: camera.flux_secondaire_active ?? false,
                  flux_tertiaire_active: camera.flux_tertiaire_active ?? false
                });
                setImagePreview(camera.photo_url || null);
                setModalOpen(true);
              }}
            >
              Modifier
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Delete />}
              onClick={() => {
                setCameraToDelete(camera.id_cam);
                setDeleteConfirmOpen(true);
              }}
            >
              Supprimer
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">Aucune caméra ne correspond aux critères de recherche</Typography>
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
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
      >

        <DialogTitle>{currentItem?.id_cam ? "Modifier" : "Ajouter"} une caméra</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={currentItem?.photo_url || imagePreview || "/default-camera.png"} 
              sx={{ 
                height: 120, 
                width: 120,
                bgcolor: (currentItem?.photo_url || imagePreview) ? 'transparent' : 'primary.main',
                mb: 2
              }}
            >
              {!(currentItem?.photo_url || imagePreview) && <Videocam sx={{ fontSize: 50 }} />}
            </Avatar>
              
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              sx={{ mt: 1 }}
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

          <Box display="grid" gridTemplateColumns={{xs: "1fr", md: "1fr 1fr"}} gap={2}>
            <Box>
              <Typography variant="h6" gutterBottom>Informations de la caméra</Typography>
              <TextField
                fullWidth
                margin="normal"
                name="nom_cam"
                label="Nom de la caméra"
                value={currentItem?.nom_cam || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="IP"
                label="Adresse IP"
                value={currentItem?.IP || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="emplacement"
                label="Emplacement"
                value={currentItem?.emplacement || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="login"
                label="Login"
                value={currentItem?.login || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="mdp"
                label="Mot de passe"
                type="password"
                value={currentItem?.mdp || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="adresse_MAC"
                label="Adresse MAC"
                value={currentItem?.adresse_MAC || ""}
                onChange={handleInputChange}
                required
                placeholder="Ex: 00:11:22:33:44:55"
              />
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={currentItem?.is_active || false}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Caméra active"
              />
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom>Caractéristiques techniques</Typography>
              <TextField
                fullWidth
                margin="normal"
                name="marque"
                label="Marque"
                value={currentItem?.marque || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="modele"
                label="Modèle"
                value={currentItem?.modele || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="mode_vision"
                label="Mode Vision"
                value={currentItem?.mode_vision || ""}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="image_par_sec"
                label="Images par seconde"
                type="number"
                value={currentItem?.image_par_sec || ""}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1 }}
              />
              <TextField
                select
                fullWidth
                margin="normal"
                name="codec_video"
                label="Codec Vidéo"
                value={currentItem?.codec_video || 'H.264'}
                onChange={handleInputChange}
                required
              >
                {CODEC_OPTIONS.map((codec) => (
                  <MenuItem key={codec} value={codec}>
                    {codec}
                  </MenuItem>
                ))}
              </TextField>    
              <TextField
                fullWidth
                margin="normal"
                name="port_video"
                label="Port Vidéo"
                type="number"
                value={currentItem?.port_video || ""}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1, max: 65535 }}
              />
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Flux vidéo
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                name="adresse_flux_principal"
                label="Flux principal (RTSP)"
                value={currentItem?.adresse_flux_principal || ""}
                onChange={handleInputChange}
                required
                placeholder="Ex: rtsp://username:password@ip_address:port/stream"
                disabled={!currentItem?.flux_principal_active}
              />
              <FormControlLabel
                control={
                  <Switch
                    name="flux_principal_active"
                    checked={currentItem?.flux_principal_active || false}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Activer le flux principal"
              />
              <TextField
                fullWidth
                margin="normal"
                name="adresse_flux_secondaire"
                label="Flux secondaire (optionnel)"
                value={currentItem?.adresse_flux_secondaire || ""}
                onChange={handleInputChange}
                placeholder="Ex: rtsp://username:password@ip_address:port/stream"
                disabled={!currentItem?.flux_secondaire_active}
              />
              <FormControlLabel
                control={
                  <Switch
                    name="flux_secondaire_active"
                    checked={currentItem?.flux_secondaire_active || false}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Activer le flux secondaire"
              />
              <TextField
                fullWidth
                margin="normal"
                name="adresse_flux_tertiaire"
                label="Flux tertiaire (optionnel)"
                value={currentItem?.adresse_flux_tertiaire || ""}
                onChange={handleInputChange}
                placeholder="Ex: rtsp://username:password@ip_address:port/stream"
                disabled={!currentItem?.flux_tertiaire_active}
              />
              <FormControlLabel
                control={
                  <Switch
                    name="flux_tertiaire_active"
                    checked={currentItem?.flux_tertiaire_active || false}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Activer le flux tertiaire"
              />
            </Box>
          </Box>
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
            Êtes-vous sûr de vouloir supprimer cette caméra ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="secondary">
            Annuler
          </Button>
          <Button onClick={confirmDelete} color="primary" disabled={loading.action}>
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

export default CamerasManagement;













































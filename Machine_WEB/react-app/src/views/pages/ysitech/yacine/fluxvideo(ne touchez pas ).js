import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  TextField,
  Chip,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import { 
  AddCircleOutline, 
  Delete, 
  Edit, 
  Videocam,
  Refresh,
  CloudUpload,
  Search,
  FilterList,
  Sort,
  ViewList,
  ViewModule
} from "@mui/icons-material";

// URL de base de l'API

export default function VideoStreamPage() {
  const [streams, setStreams] = useState([]);
  const [filteredStreams, setFilteredStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const getDisplayUrl = (url, type) => {
    if (type !== 'mp4' && type !== 'webm') return url;
    
    const parts = url.split('/');
    const filenameWithUuid = parts[parts.length - 1];
    
    return filenameWithUuid.includes('_') 
      ? filenameWithUuid.split('_').slice(1).join('_')
      : filenameWithUuid;
  };
  
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    
    // Réinitialiser l'URL si le type change entre local (mp4/webm) et externe (youtube/rtsp)
    const isLocalVideo = ['mp4', 'webm'].includes(newType);
    const wasLocalVideo = ['mp4', 'webm'].includes(formData.type);
    
    if (isLocalVideo !== wasLocalVideo) {
      setFormData({
        ...formData,
        type: newType,
        url: '' // Réinitialiser l'URL lors du changement de catégorie de type
      });
    } else {
      setFormData({
        ...formData,
        type: newType
      });
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    isActive: true,
    type: 'mp4',
    isLive: false  // Ajouter ce champ
  });

  // si il y a un probleme c'est là erreur 
  useEffect(() => {
    fetchStreams();
  }, []);

  // Effet pour appliquer les filtres
  useEffect(() => {
    applyFilters();
  }, [streams, searchTerm, typeFilter, statusFilter, sortBy, sortDirection]);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/streams`);
      if (response.ok) {
        const data = await response.json();
        setStreams(data);
      } else {
        setSnackbar({
          open: true,
          message: 'Erreur lors de la récupération des flux',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: 'Erreur de connexion au serveur',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...streams];
    
    // Appliquer le filtre de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(stream => 
        stream.name.toLowerCase().includes(term) || 
        stream.description.toLowerCase().includes(term) ||
        stream.url.toLowerCase().includes(term)
      );
    }
    
    // Appliquer le filtre de type
    if (typeFilter !== 'all') {
      result = result.filter(stream => stream.type === typeFilter);
    }
    
    // Appliquer le filtre de statut
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(stream => stream.isActive === isActive);
    }
    
    // Appliquer le tri
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === 'date') {
        // Si nous avions une date de création, nous l'utiliserions ici
        // Pour l'instant, on utilise l'ID comme approximation (assumant que les IDs plus élevés sont plus récents)
        comparison = a.id - b.id;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredStreams(result);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async () => {
    try {
      const method = currentStream ? 'PUT' : 'POST';
      const url = currentStream 
        ? `/api/streams/${currentStream.id}` 
        : `/api/streams`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (currentStream) {
          fetchStreams(); // Recharge après un ajout/modification
          setStreams(streams.map(s => s.id === currentStream.id ? data : s));
          setSnackbar({ 
            open: true, 
            message: 'Flux mis à jour', 
            severity: 'success' 
          });
        } else {
          setStreams([...streams, data]);
          setSnackbar({ 
            open: true, 
            message: 'Nouveau flux ajouté', 
            severity: 'success' 
          });
        }
        setOpenDialog(false);
      } else {
        const errorData = await response.json();
        setSnackbar({ 
          open: true, 
          message: `Erreur: ${errorData.detail || 'Une erreur est survenue'}`, 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur de connexion au serveur', 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/streams/${currentStream.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setStreams(streams.filter(s => s.id !== currentStream.id));
        setSnackbar({ 
          open: true, 
          message: 'Flux supprimé', 
          severity: 'success' 
        });
        setOpenDeleteDialog(false);
      } else {
        const errorData = await response.json();
        setSnackbar({ 
          open: true, 
          message: `Erreur: ${errorData.detail || 'Une erreur est survenue'}`, 
          severity: 'error' 
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({ 
        open: true, 
        message: 'Erreur de connexion au serveur', 
        severity: 'error' 
      });
    }
  };

  const handleEdit = (stream) => {
    setCurrentStream(stream);
    setFormData({
      name: stream.name,
      url: stream.url,
      description: stream.description,
      isActive: stream.isActive,
      type: stream.type,
      isLive: stream.isLive || false  // Utiliser la valeur existante ou false par défaut
    });
    setOpenDialog(true);
  };

  const handleAddNew = () => {
    setCurrentStream(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      isActive: true,
      type: 'mp4',
      isLive: false  // Réinitialiser à false
    });
    setOpenDialog(true);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un fichier',
        severity: 'warning'
      });
      return;
    }
  
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
  
    try {
      const response = await fetch(`/api/upload-video`, {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          url: data.url,
          type: data.type,
          name: data.original_filename.replace(/\.[^/.]+$/, "") // Optionnel: utiliser le nom de fichier comme nom de stream
        }));
        setSnackbar({
          open: true,
          message: 'Vidéo téléchargée avec succès',
          severity: 'success'
        });
        setOpenUploadDialog(false);
      } else {
        const errorData = await response.json();
        setSnackbar({
          open: true,
          message: `Erreur: ${errorData.detail || 'Une erreur est survenue'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setSnackbar({
        open: true,
        message: 'Erreur de connexion au serveur',
        severity: 'error'
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSortDirectionChange = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Fonction pour afficher le flux vidéo en fonction de son type
  const renderVideoStream = (stream) => {
    if (!stream.isActive) {
      return (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Typography variant="h6">HORS LIGNE</Typography>
        </Box>
      );
    }

    switch(stream.type) {
      case 'mp4':
      case 'webm':
        // Pour les vidéos locales ou servies par notre API
        return (
          <video 
            src={stream.url.startsWith('/') ? `/api${stream.url.substring(4)}` : stream.url}
            controls 
            style={{ 
              position: 'absolute', 
              width: '100%', 
              height: '100%', 
              top: 0, 
              left: 0 
            }}
          />
        );
      case 'youtube':
        // Pour les vidéos YouTube, extraire l'ID de la vidéo
        const youtubeId = extractYoutubeId(stream.url);
        return (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ 
              position: 'absolute', 
              width: '100%', 
              height: '100%', 
              top: 0, 
              left: 0 
            }}
          />
        );
      case 'rtsp':
        // Les flux RTSP ne peuvent pas être affichés directement dans le navigateur
        return (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Videocam sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">Flux RTSP (non compatible navigateur)</Typography>
          </Box>
        );
      default:
        // Par défaut, montrer une icône de caméra
        return (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Videocam sx={{ fontSize: 48 }} />
          </Box>
        );
    }
  };

  // Fonction pour extraire l'ID d'une vidéo YouTube à partir de son URL
  const extractYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderGridView = () => (
    <Grid container spacing={3}>
      {filteredStreams.length === 0 ? (
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4
        }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Aucun flux vidéo disponible avec les filtres appliqués
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddCircleOutline />}
            onClick={handleAddNew}
          >
            Ajouter un nouveau flux
          </Button>
        </Box>
      ) : (
        filteredStreams.map((stream) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={stream.id}>
            <Card>
            <Box sx={{ 
              position: 'relative', 
              paddingTop: '45%', 
              bgcolor: 'black' 
            }}>
                {renderVideoStream(stream)}
              </Box>
              <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start' 
              }}>
                <Typography variant="subtitle1" noWrap sx={{ maxWidth: '60%' }}>{stream.name}</Typography>
                <Box>
                  <Chip 
                    label={stream.type.toUpperCase()} 
                    color="primary" 
                    size="small"
                    sx={{ mr: 0.5, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }} 
                  />
                  {stream.type === 'youtube' && stream.isLive && (
                    <Chip 
                      label="LIVE"
                      color="error" 
                      size="small"
                      sx={{ mr: 0.5, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }} 
                    />
                  )}
                  <Chip 
                    label={stream.isActive ? 'Actif' : 'Inactif'} 
                    color={stream.isActive ? 'success' : 'error'} 
                    size="small"
                    sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }} 
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {stream.description}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ 
                mt: 0.5, 
                display: 'block',
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {getDisplayUrl(stream.url, stream.type)}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                mt: 1 
              }}>
                <IconButton onClick={() => handleEdit(stream)} color="primary" size="small" sx={{ p: 0.5 }}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton 
                  onClick={() => {
                    setCurrentStream(stream);
                    setOpenDeleteDialog(true);
                  }} 
                  color="error"
                  size="small"
                  sx={{ p: 0.5, ml: 0.5 }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  const renderListView = () => (
    <Box>
      {filteredStreams.length === 0 ? (
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4
        }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Aucun flux vidéo disponible avec les filtres appliqués
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddCircleOutline />}
            onClick={handleAddNew}
          >
            Ajouter un nouveau flux
          </Button>
        </Box>
      ) : (
        <Paper elevation={2}>
          {filteredStreams.map((stream, index) => (
            <React.Fragment key={stream.id}>
              {index > 0 && <Divider />}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  width: 120, 
                  height: 67.5, 
                  bgcolor: 'black',
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  {stream.type !== 'rtsp' ? (
                    renderVideoStream(stream)
                  ) : (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Videocam />
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{stream.name}</Typography>
                    <Box>
                      <Chip 
                        label={stream.type.toUpperCase()} 
                        color="primary" 
                        size="small"
                        sx={{ mr: 1 }} 
                      />
                      {/* AJOUTEZ LE CODE SUIVANT JUSTE ICI */}
                      {stream.type === 'youtube' && stream.isLive && (
                        <Chip 
                          label="LIVE"
                          color="error" 
                          size="small"
                          sx={{ mr: 1 }} 
                        />
                      )}
                      <Chip 
                        label={stream.isActive ? 'Actif' : 'Inactif'} 
                        color={stream.isActive ? 'success' : 'error'} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stream.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getDisplayUrl(stream.url, stream.type)}
                  </Typography>
                </Box>
                
                <Box sx={{ ml: 2 }}>
                  <IconButton onClick={() => handleEdit(stream)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton 
                    onClick={() => {
                      setCurrentStream(stream);
                      setOpenDeleteDialog(true);
                    }} 
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </React.Fragment>
          ))}
        </Paper>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" component="h1">
          Gestion des flux vidéo
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutline />}
            onClick={handleAddNew}
            sx={{ mr: 2 }}
          >
            Ajouter un flux
          </Button>
        </Box>
      </Box>

      {/* Barre de filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder="Rechercher..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 250, mr: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              Filtres
            </Button>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newValue) => newValue && setViewMode(newValue)}
              aria-label="view mode"
              size="small"
            >
              <ToggleButton value="grid" aria-label="grid view">
                <ViewModule />
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {showFilters && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120, mr: 2, mb: { xs: 1, md: 0 } }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="mp4">MP4</MenuItem>
                <MenuItem value="webm">WebM</MenuItem>
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="rtsp">RTSP</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120, mr: 2, mb: { xs: 1, md: 0 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="active">Actifs</MenuItem>
                <MenuItem value="inactive">Inactifs</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 0 } }}>
              <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                <InputLabel>Trier par</InputLabel>
                <Select
                  value={sortBy}
                  label="Trier par"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="name">Nom</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                  <MenuItem value="date">Date d'ajout</MenuItem>
                </Select>
              </FormControl>

              <IconButton onClick={handleSortDirectionChange} color="primary">
                <Sort sx={{ 
                  transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s'
                }} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentStream ? 'Modifier le flux' : 'Ajouter un nouveau flux'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            fullWidth
            label="Nom"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Type de flux</InputLabel>
            <Select
              name="type"
              value={formData.type}
              label="Type de flux"
              onChange={handleTypeChange}
            >
              <MenuItem value="mp4">Vidéo MP4</MenuItem>
              <MenuItem value="webm">Vidéo WebM</MenuItem>
              <MenuItem value="youtube">YouTube</MenuItem>
              <MenuItem value="rtsp">RTSP (Camera)</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            {(['youtube', 'rtsp'].includes(formData.type)) ? (
              <TextField
                fullWidth
                label="URL du flux"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder={formData.type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'rtsp://exemple.com/stream'}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setOpenUploadDialog(true)}
                  startIcon={<CloudUpload />}
                  sx={{ mb: 1 }}
                >
                  Télécharger une vidéo {formData.type.toUpperCase()}
                </Button>
                {formData.url && (
                  <Typography variant="body2" color="text.secondary">
                    Fichier sélectionné: {formData.name || formData.url.split('/').pop().split('_').slice(1).join('_')}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          {/* AJOUTEZ LE CODE SUIVANT JUSTE ICI, APRÈS LA FERMETURE DE LA BOX */}
          {formData.type === 'youtube' && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isLive}
                  onChange={handleInputChange}
                  name="isLive"
                  color="primary"
                />
              }
              label="Flux en direct (Live)"
              sx={{ mt: 1 }}
            />
          )}
          
          <TextField
            margin="normal"
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleInputChange}
                name="isActive"
                color="primary"
              />
            }
            label="Activer le flux"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {currentStream ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => !uploadLoading && setOpenUploadDialog(false)}>
        <DialogTitle>Télécharger une vidéo</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="upload-video-file"
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
              disabled={uploadLoading}
            />
            <label htmlFor="upload-video-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                disabled={uploadLoading}
              >
                Sélectionner un fichier vidéo
              </Button>
            </label>
            {uploadFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Fichier sélectionné: {uploadFile.name}
              </Typography>
            )}
            {uploadLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenUploadDialog(false)}
            disabled={uploadLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleUpload}
            color="primary" 
            variant="contained"
            disabled={!uploadFile || uploadLoading}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le flux "{currentStream?.name}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
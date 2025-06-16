import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Container,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Snackbar,
  Tooltip,
  Menu,
  Checkbox,
  ListItemText,
  OutlinedInput,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemIcon
} from "@mui/material";
import { 
  AddCircleOutline, 
  Delete, 
  Videocam,
  FilterList,
  Refresh,
  Info, 
  CheckCircle,
  Clear,
  Search,
  PowerSettingsNew
} from "@mui/icons-material";
import axios from "axios";

// const API_URL = "http://localhost:8000";

const GestionProcesseursGPU = () => {
  const [gpuGroups, setGpuGroups] = useState([]);

  const [filters, setFilters] = useState({ status: 'all', search: '', hasCameras: 'all' });
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupStatus, setNewGroupStatus] = useState("actif");
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [openCameraDialog, setOpenCameraDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [newGroupIP, setNewGroupIP] = useState("");
  const [newGroupLogin, setNewGroupLogin] = useState("");
  const [newGroupPassword, setNewGroupPassword] = useState("");

  // Ajouter cette fonction dans votre composant
  const fetchGpuGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/gpu-groups/');
      
      // S'assurer que le format des données est correct
      const formattedGroups = response.data.map(group => ({
        ...group,
        id: group.id_gpu, // Assurez-vous que id est correctement mappé
        cameras: Array.isArray(group.cameras) 
          ? group.cameras.map(camId => {
              const camera = cameras.find(c => c.id_cam === camId);
              return {
                id: camId,
                name: camera?.nom_cam || `Caméra ${camId}`,
                status: camera?.is_active ? "active" : "inactive",
                details: camera
              };
            })
          : []
      }));
      
      setGpuGroups(formattedGroups);
    } catch (err) {
      console.error("Erreur lors du chargement des groupes GPU:", err);
      setNotification({
        open: true,
        message: "Erreur lors du chargement des groupes GPU",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [cameras]);


  useEffect(() => {
    fetchGpuGroups();
  }, [fetchGpuGroups]);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/cameras/`);
      setCameras(Array.isArray(response.data) ? response.data : []);
      setNotification({ 
        open: true, 
        message: "Caméras chargées avec succès", 
        severity: "success" 
      });
    } catch (err) {
      console.error("Erreur lors du chargement des caméras:", err);
      setError("Erreur lors du chargement des caméras");
      setNotification({ 
        open: true, 
        message: "Erreur lors du chargement des caméras", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // AJOUTER CETTE FONCTION DE DÉBOGAGE
  useEffect(() => {
    console.log('État GPUGroups:', gpuGroups);
    console.log('État Cameras:', cameras);
  }, [gpuGroups, cameras]);

  const toggleGroupStatus = async (groupId) => {
    try {
      await axios.put(`/api/gpu-groups/${groupId}/status`);
      
      // Mettre à jour l'UI directement
      setGpuGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, status: group.status === "actif" ? "inactif" : "actif" }
            : group
        )
      );
      
      const groupName = gpuGroups.find(g => g.id === groupId)?.name;
      setNotification({
        open: true,
        message: `Statut du groupe "${groupName}" mis à jour`,
        severity: "success"
      });
    } catch (err) {
      console.error("Erreur lors de la modification du statut:", err);
      setNotification({
        open: true,
        message: "Erreur lors de la modification du statut",
        severity: "error"
      });
    }
  };

  const isCameraAssigned = useCallback((cameraId) => {
    return gpuGroups.some(group => 
      Array.isArray(group.cameras) && group.cameras.some(cam => cam?.id === cameraId)
    );
  }, [gpuGroups]);

  const getCamerasForAddDialog = useMemo(() => {
    return cameras.map(camera => ({
      ...camera,
      disabled: isCameraAssigned(camera.id_cam)
    }));
  }, [cameras, isCameraAssigned]);

  const getCamerasForManageDialog = useMemo(() => {
    if (!selectedGroup) return [];
    
    return cameras.map(camera => {
      const isInCurrentGroup = selectedGroup.cameras.some(c => c?.id === camera.id_cam);
      const isAssignedElsewhere = gpuGroups.some(
        group => group.id !== selectedGroup.id && 
        group.cameras.some(c => c?.id === camera.id_cam)
      );
      
      return {
        ...camera,
        disabled: isAssignedElsewhere && !isInCurrentGroup
      };
    });
  }, [cameras, selectedGroup, gpuGroups]);

  const handleAddGroup = useCallback(async () => {
    if (!newGroupName.trim()) {
      setNotification({
        open: true,
        message: "Veuillez entrer un nom pour le groupe",
        severity: "error"
      });
      return;
    }
  
    try {
      const response = await axios.post('/api/gpu-groups/', {
        name: newGroupName.trim(),
        status: newGroupStatus,
        ip_address: newGroupIP,
        login: newGroupLogin,
        password: newGroupPassword
      });
  
      // Si des caméras sont sélectionnées, les ajouter
      if (selectedCameras.length > 0) {
        await Promise.all(selectedCameras.map(camId => 
          axios.post(`/api/gpu-groups/${response.data.id_gpu}/cameras`, { id_camera: camId })
        ));
      }
  
      // Réinitialiser les champs
      setNewGroupName("");
      setNewGroupStatus("actif");
      setNewGroupIP("");
      setNewGroupLogin("");
      setNewGroupPassword("");
      setSelectedCameras([]);
      
      // Recharger les groupes
      await fetchGpuGroups();
      
      setNotification({
        open: true,
        message: `Groupe "${newGroupName}" ajouté avec succès`,
        severity: "success"
      });
      setOpenAddDialog(false);
    } catch (err) {
      console.error("Erreur lors de la création du groupe:", err);
      setNotification({
        open: true,
        message: "Erreur lors de la création du groupe",
        severity: "error"
      });
    }
  }, [newGroupName, newGroupStatus, newGroupIP, newGroupLogin, newGroupPassword, selectedCameras, fetchGpuGroups]);

  const handleDeleteGroup = useCallback(async () => {
    if (!groupToDelete) return;
    
    try {
      await axios.delete(`/api/gpu-groups/${groupToDelete}`);
      
      const groupName = gpuGroups.find(g => g.id === groupToDelete)?.name || '';
      
      // Mettre à jour l'état local après suppression
      setGpuGroups(prev => prev.filter(group => group.id !== groupToDelete));
      
      setNotification({ 
        open: true, 
        message: `Groupe "${groupName}" supprimé`, 
        severity: "info" 
      });
    } catch (err) {
      console.error("Erreur lors de la suppression du groupe:", err);
      setNotification({
        open: true,
        message: "Erreur lors de la suppression du groupe: " + err.message,
        severity: "error"
      });
    } finally {
      setConfirmDeleteDialog(false);
      setGroupToDelete(null);
    }
  }, [groupToDelete, gpuGroups]);

  const handleSaveCameraAssociations = useCallback(async (newSelectedCameras) => {
    if (!selectedGroup) return;
  
    try {
      // Trouver les caméras actuellement assignées
      const currentCameraIds = selectedGroup.cameras.map(cam => cam.id);
      
      // Trouver les caméras à ajouter
      const camerasToAdd = newSelectedCameras.filter(id => !currentCameraIds.includes(id));
      
      // Trouver les caméras à retirer
      const camerasToRemove = currentCameraIds.filter(id => !newSelectedCameras.includes(id));
      
      // Ajouter les nouvelles caméras
      for (const camId of camerasToAdd) {
        await axios.post(`/api/gpu-groups/${selectedGroup.id}/cameras`, { id_camera: camId });
      }
      
      // Retirer les caméras qui ne sont plus sélectionnées
      for (const camId of camerasToRemove) {
        await axios.delete(`/api/gpu-groups/${selectedGroup.id}/cameras/${camId}`);
      }
      
      // Mettre à jour l'état local
      setGpuGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === selectedGroup.id
            ? {
                ...group,
                cameras: newSelectedCameras
                  .map(id => cameras.find(c => c.id_cam === id))
                  .filter(Boolean)
                  .map(cam => ({
                    id: cam.id_cam,
                    name: cam.nom_cam || `Caméra ${cam.id_cam}`,
                    status: cam.is_active ? "active" : "inactive",
                    details: cam
                  }))
              }
            : group
        )
      );
  
      setNotification({
        open: true,
        message: `Caméras mises à jour pour ${selectedGroup.name}`,
        severity: "success"
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour des caméras:", err);
      setNotification({
        open: true,
        message: "Erreur lors de la mise à jour des caméras: " + err.message,
        severity: "error"
      });
    } finally {
      setOpenCameraDialog(false);
    }
  }, [selectedGroup, cameras]);

  const filteredGroups = useMemo(() => {
    return gpuGroups.filter(group => {
      if (!group) return false;
      if (filters.status !== 'all' && group.status !== filters.status) return false;
      if (filters.search && !group.name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.hasCameras === 'with' && (!group.cameras || group.cameras.length === 0)) return false;
      if (filters.hasCameras === 'without' && group.cameras?.length > 0) return false;
      return true;
    });
  }, [gpuGroups, filters]);

  const CameraSelectionDialog = ({ open, onClose, title, cameraList, initialSelected, onSave, groupInfo }) => {
  const [localSelected, setLocalSelected] = useState(initialSelected || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (open && !initialLoadDone) {
      // Filtrer les caméras sélectionnées pour ne garder que celles qui sont valides
      const validSelection = initialSelected?.filter(id => {
        const camera = cameraList?.find(c => c.id_cam === id);
        return camera && !camera.disabled;
      }) || [];
      
      setLocalSelected(validSelection);
      setInitialLoadDone(true);
    } else if (!open) {
      setInitialLoadDone(false);
    }
  }, [open, initialSelected, cameraList]);

  const filteredCameras = useMemo(() => {
    const allCameras = cameraList || [];
    if (!searchTerm) return allCameras;
    
    return allCameras.filter(camera => 
      camera?.nom_cam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camera?.id_cam?.toString().includes(searchTerm) ||
      camera?.IP?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cameraList, searchTerm]);

  const handleSave = () => {
    onSave(localSelected);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {/* Section Informations du GPU */}
        {groupInfo && (
          <Paper elevation={3} sx={{ p: 2, mb: 3, bgcolor: '#1e293b' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Informations du Processeur GPU</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Adresse IP"
                  value={groupInfo.ip || ''}
                  fullWidth
                  margin="dense"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Login"
                  value={groupInfo.login || ''}
                  fullWidth
                  margin="dense"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Mot de passe"
                  type="password"
                  value={groupInfo.password || ''}
                  fullWidth
                  margin="dense"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Section Sélection des caméras */}
        <Typography variant="h6" sx={{ mb: 1 }}>Caméras associées</Typography>
        <TextField
          fullWidth
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ my: 2 }}
          InputProps={{
            startAdornment: <Search />,
          }}
        />
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredCameras.map(camera => (
            <ListItem
              key={camera.id_cam}
              disabled={camera.disabled}
              onClick={() => !camera.disabled && setLocalSelected(prev =>
                prev.includes(camera.id_cam)
                  ? prev.filter(id => id !== camera.id_cam)
                  : [...prev, camera.id_cam]
              )}
            >
              <ListItemIcon>
                <Checkbox
                  checked={localSelected.includes(camera.id_cam)}
                  disabled={camera.disabled}
                />
              </ListItemIcon>
              <ListItemText
                primary={camera.nom_cam || `Caméra ${camera.id_cam}`}
                secondary={
                  <>
                    <span>IP: {camera.IP || 'N/A'}</span>
                    <br />
                    <span>Statut: {camera.is_active ? 'Active' : 'Inactive'}</span>
                  </>
                }
              />
              {camera.disabled && (
                <Chip 
                  label="Déjà assignée" 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1 }}
                />
              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Sauvegarder
        </Button>
      </DialogActions>
    </Dialog>
  );
};

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", color: "text.primary", p: 3 }}>
      <Container maxWidth="xl">
        {/* ★★★ NOUVEAU HEADER STYLISÉ ★★★ */}
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
            Gestion des Processeurs GPU
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Optimisez l'allocation des ressources GPU pour le traitement vidéo
          </Typography>
          
          <Chip 
            label={`${filteredGroups.length} groupe${filteredGroups.length > 1 ? 's' : ''}`} 
            color="primary" 
            variant="outlined"
            sx={{ mb: 3 }}
          />
        </Box>

        {/* ★★★ BARRE D'ACTIONS ★★★ */}
        <Paper elevation={1} sx={{ p: 1.5, mb: 3, borderRadius: 2, bgcolor: '#1e293b' }}>
  <Grid container spacing={1.5} alignItems="center">
    {/* Colonne Ajouter */}
    <Grid item xs={6} sm={4} md={4}>
      <Button
        fullWidth
        variant="contained"
        startIcon={<AddCircleOutline />}
        onClick={() => setOpenAddDialog(true)}
        sx={{ 
          bgcolor: "#1e40af", 
          '&:hover': { bgcolor: "#1e3a8a" },
          height: '40px',
          fontSize: '0.8rem'
        }}
      >
        Nouveau
      </Button>
    </Grid>
    
    {/* Colonne Recherche */}
    <Grid item xs={6} sm={5} md={5}>
      <TextField
        fullWidth
        placeholder="Rechercher..."
        value={filters.search}
        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" color="disabled" />
            </InputAdornment>
          ),
          endAdornment: filters.search && (
            <IconButton
              size="small"
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
            >
              <Clear fontSize="small" />
            </IconButton>
          ),
          sx: { 
            color: 'white',
            height: '40px'
          }
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
          }
        }}
      />
    </Grid>
    
    
    <Grid item xs={6} sm={3} md={3}>
      <Button
        fullWidth
        variant={Boolean(filterAnchorEl) ? "contained" : "outlined"}
        startIcon={<FilterList fontSize="small" />}
        onClick={(e) => setFilterAnchorEl(e.currentTarget)}
        sx={{
          color: 'white',
          borderColor: Boolean(filterAnchorEl) ? 'transparent' : 'rgba(255, 255, 255, 0.23)',
          bgcolor: Boolean(filterAnchorEl) ? '#1e40af' : 'transparent',
          height: '40px',
          fontSize: '0.8rem',
          padding: '0 8px',
          '&:hover': {
            bgcolor: Boolean(filterAnchorEl) ? '#1e3a8a' : 'rgba(255, 255, 255, 0.08)'
          }
        }}
      >
        Filtres
      </Button>
    </Grid>
  </Grid>
</Paper>

        {/* Menu des filtres */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
          sx={{ mt: 1 }}
          PaperProps={{
            sx: { 
              width: 280, 
              p: 1,
              bgcolor: '#1e293b',
              color: 'white'
            }
          }}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Statut</Typography>
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              size="small"
              fullWidth
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="actif">Actif</MenuItem>
              <MenuItem value="inactif">Inactif</MenuItem>
            </Select>
          </Box>
          
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Caméras</Typography>
            <Select
              value={filters.hasCameras}
              onChange={(e) => setFilters(prev => ({ ...prev, hasCameras: e.target.value }))}
              size="small"
              fullWidth
            >
              <MenuItem value="all">Tous les groupes</MenuItem>
              <MenuItem value="with">Avec caméras</MenuItem>
              <MenuItem value="without">Sans caméras</MenuItem>
            </Select>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ p: 1 }}>
            <Button
              fullWidth
              startIcon={<Clear />}
              onClick={() => {
                setFilters({ status: 'all', search: '', hasCameras: 'all' });
                setFilterAnchorEl(null);
              }}
              variant="outlined"
              size="small"
            >
              Réinitialiser
            </Button>
          </Box>
        </Menu>

        {/* Liste des groupes */}
        <Grid container spacing={3}>
          {filteredGroups.map((group) => (
            <Grid item xs={12} md={6} key={group.id}>
              <Paper 
                elevation={3} 
                sx={{ 
                  bgcolor: "#1e293b", 
                  p: 3, 
                  borderLeft: `4px solid ${group.status === "actif" ? "#4caf50" : "#f44336"}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 8
                  }
                }}
              >
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                <TextField
                  defaultValue={group.name}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    input: { color: "white", fontWeight: "bold", fontSize: "1.1rem" },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                      "&.Mui-focused fieldset": { borderColor: "#90caf9" }
                    }
                  }}
                  onBlur={async (e) => {
                    const newName = e.target.value.trim();
                    if (newName && newName !== group.name) {
                      try {
                        // Trouver toutes les informations actuelles du groupe
                        const currentGroup = gpuGroups.find(g => g.id === group.id);
                        if (!currentGroup) return;

                        await axios.put(`/api/gpu-groups/${group.id}`, {
                          name: newName,
                          status: currentGroup.status,
                          ip_address: currentGroup.ip_address || "",
                          login: currentGroup.login || "",
                          password: currentGroup.password || ""
                        });
                        
                        setGpuGroups(prevGroups => 
                          prevGroups.map(g => 
                            g.id === group.id ? { ...g, name: newName } : g
                          )
                        );
                        
                        setNotification({
                          open: true,
                          message: `Nom du groupe modifié avec succès`,
                          severity: "success"
                        });
                      } catch (err) {
                        console.error("Erreur lors de la modification du nom:", err);
                        setNotification({
                          open: true,
                          message: "Erreur lors de la modification du nom",
                          severity: "error"
                        });
                      }
                    }
                  }}
                />
                  <Chip 
                    label={group.status === "actif" ? "Actif" : "Inactif"} 
                    size="small" 
                    sx={{ 
                      ml: 2, 
                      bgcolor: group.status === "actif" ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
                      color: group.status === "actif" ? "#4caf50" : "#f44336",
                      borderRadius: "4px"
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title={group.status === "actif" ? "Désactiver" : "Activer"}>
                    <IconButton 
                      onClick={() => toggleGroupStatus(group.id)}
                      sx={{
                        color: group.status === "actif" ? "#4caf50" : "#f44336",
                        bgcolor: group.status === "actif" ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
                        "&:hover": {
                          bgcolor: group.status === "actif" ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
                        }
                      }}
                    >
                      <PowerSettingsNew />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Gérer les caméras">
                    <IconButton 
                      onClick={() => {
                        setSelectedGroup(group);
                        setSelectedCameras(group.cameras.map(cam => cam.id));
                        setOpenCameraDialog(true);
                      }}
                      sx={{
                        color: "#90caf9",
                        bgcolor: "rgba(144, 202, 249, 0.1)",
                        "&:hover": {
                          bgcolor: "rgba(144, 202, 249, 0.2)",
                        }
                      }}
                    >
                      <Videocam />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer le groupe">
                    <IconButton 
                      onClick={() => {
                        setGroupToDelete(group.id);
                        setConfirmDeleteDialog(true);
                      }}
                      sx={{
                        color: "#f44336",
                        bgcolor: "rgba(244, 67, 54, 0.1)",
                        "&:hover": {
                          bgcolor: "rgba(244, 67, 54, 0.2)",
                        }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              
              {/* Statistiques rapides */}
              <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                mb: 2, 
                p: 1.5, 
                bgcolor: "rgba(0,0,0,0.2)", 
                borderRadius: 1,
                opacity: group.status === "actif" ? 1 : 0.7
              }}>
                <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Caméras
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {group.cameras.length || 0}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Actives
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#4caf50" }}>
                  {group.cameras.filter(cam => cam.status === "active").length || 0}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Inactives
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#f44336" }}>
                  {group.cameras.filter(cam => cam.status === "inactive").length || 0}
                </Typography>
              </Box>
            </Box>
              
              {/* Affichage des caméras du groupe */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                  <Videocam fontSize="small" sx={{ mr: 1 }} />
                  Caméras ({group.cameras.length || 0})
                </Typography>
                {group.cameras.length > 0 ? (
                <Box sx={{ maxHeight: '180px', overflowY: 'auto', pr: 1 }}>
                  {group.cameras.map(camera => (
                    <Box 
                      key={camera.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        mb: 1,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="body2">
                        {camera.name || `Caméra ${camera.id}`}
                      </Typography>
                      <Chip
                        label={camera.status === "active" ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          bgcolor: camera.status === "active" ? "#4caf50" : "#f44336",
                          color: "white"
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                  <Box 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      bgcolor: 'rgba(0,0,0,0.2)', 
                      borderRadius: 1,
                      border: '1px dashed rgba(255,255,255,0.2)'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ color: "rgba(255,255,255,0.6)" }}>
                      Aucune caméra assignée à ce groupe
                    </Typography>
                    <Button 
                      size="small" 
                      startIcon={<Videocam />}
                      onClick={() => {
                        setSelectedGroup(group);
                        setSelectedCameras([]);
                        setOpenCameraDialog(true);
                      }}
                      sx={{ mt: 1 }}
                    >
                      Ajouter des caméras
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
        {/* yacine*/}
        <CameraSelectionDialog
          open={openCameraDialog}
          onClose={() => setOpenCameraDialog(false)}
          title={`Gestion des caméras - ${selectedGroup?.name || ''}`}
          cameraList={getCamerasForManageDialog}
          initialSelected={selectedCameras}
          onSave={handleSaveCameraAssociations}
        />

<Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="sm">
  <DialogTitle>Créer un nouveau groupe GPU</DialogTitle>
  <DialogContent>
    <TextField
      autoFocus
      margin="dense"
      label="Nom du groupe"
      fullWidth
      value={newGroupName}
      onChange={(e) => setNewGroupName(e.target.value)}
      sx={{ mb: 2 }}
    />
    
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6}>
        <TextField
          margin="dense"
          label="Adresse IP"
          fullWidth
          value={newGroupIP}
          onChange={(e) => setNewGroupIP(e.target.value)}
          placeholder="192.168.1.100"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth margin="dense">
          <InputLabel>Statut</InputLabel>
          <Select
            value={newGroupStatus}
            onChange={(e) => setNewGroupStatus(e.target.value)}
            label="Statut"
          >
            <MenuItem value="actif">Actif</MenuItem>
            <MenuItem value="inactif">Inactif</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
    
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6}>
        <TextField
          margin="dense"
          label="Login"
          fullWidth
          value={newGroupLogin}
          onChange={(e) => setNewGroupLogin(e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          margin="dense"
          label="Mot de passe"
          type="password"
          fullWidth
          value={newGroupPassword}
          onChange={(e) => setNewGroupPassword(e.target.value)}
        />
      </Grid>
    </Grid>
    
    <FormControl fullWidth>
      <InputLabel>Caméras</InputLabel>
      <Select
        multiple
        value={selectedCameras}
        onChange={(e) => setSelectedCameras(e.target.value)}
        input={<OutlinedInput label="Caméras" />}
        renderValue={(selected) => selected.map(id => 
          cameras.find(c => c.id_cam === id)?.nom_cam || id
        ).join(', ')}
      >
        {getCamerasForAddDialog.map(camera => (
          <MenuItem key={camera.id_cam} value={camera.id_cam} disabled={camera.disabled}>
            <Checkbox checked={selectedCameras.includes(camera.id_cam)} />
            <ListItemText 
              primary={camera.nom_cam || `Caméra ${camera.id_cam}`} 
              secondary={`${camera.IP || 'N/A'} • ${camera.is_active ? 'Active' : 'Inactive'}`} 
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenAddDialog(false)}>Annuler</Button>
    <Button onClick={handleAddGroup} variant="contained">Créer</Button>
  </DialogActions>
</Dialog>

        <Dialog open={confirmDeleteDialog} onClose={() => setConfirmDeleteDialog(false)}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Voulez-vous vraiment supprimer le groupe "{gpuGroups.find(g => g.id === groupToDelete)?.name}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteDialog(false)}>Annuler</Button>
            <Button onClick={handleDeleteGroup} color="error">Supprimer</Button>
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
      </Container>
    </Box>
  );
};

export default GestionProcesseursGPU;
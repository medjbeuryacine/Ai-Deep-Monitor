import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Grid, 
  Card, 
  CardMedia, 
  Button,
  Paper,
  Alert, 
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  ListItemText,
  Checkbox
} from '@mui/material';
import {
  Person,
  Image,
  CheckBox,
  CheckBoxOutlineBlank,
  CloudUpload
} from '@mui/icons-material';



const ImageManager = () => {
  // ajouter une personne 
  const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
  const [newPersonData, setNewPersonData] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    sexe: "Homme",
    role: "Visiteur",
    niveau_autorisation: "Aucun",
    autorisation: "Non",
    zones_acces: [],
    jours_acces: [],
    limite_acces_jours: false,
    plage_horaire_debut: "",
    plage_horaire_fin: "",
    badge_actif: false,
    photo: null
    });
  const [selectedImageForNewPerson, setSelectedImageForNewPerson] = useState(null);



  // États principaux
  const [activeTab, setActiveTab] = useState(0);
  const [unknownImages, setUnknownImages] = useState([]);
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [personImages, setPersonImages] = useState([]);
  const [loading, setLoading] = useState({
    unknown: true,
    persons: true,
    personImages: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [imagesDir, setImagesDir] = useState('');

  // Charger les images inconnues
  const fetchUnknownImages = async () => {
    try {
      setLoading(prev => ({ ...prev, unknown: true }));
      const response = await fetch("/api/images/inconnu/");
      if (!response.ok) throw new Error('Erreur de chargement des images inconnues');
      const data = await response.json();
      setUnknownImages(data.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, unknown: false }));
    }
  };

  // Charger la liste des personnes
  const fetchPersons = async () => {
    try {
      setLoading(prev => ({ ...prev, persons: true }));
      const response = await fetch("/api/personnes/");
      if (!response.ok) throw new Error('Erreur de chargement des personnes');
      const data = await response.json();
      setPersons(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, persons: false }));
    }
  };

  // Charger les images d'une personne
  const fetchPersonImages = async (personId) => {
    if (!personId) return;
    
    try {
      setLoading(prev => ({ ...prev, personImages: true }));
      const response = await fetch(`/api/personnes/${personId}/images/`);
      if (!response.ok) throw new Error('Erreur de chargement des images de la personne');
      const data = await response.json();
      console.log("Images récupérées pour la personne:", data);
      setPersonImages(data.additional_images || []);
      setImagesDir(data.images_dir || '');
    } catch (err) {
      console.error("Erreur lors du chargement des images:", err);
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, personImages: false }));
    }
  };

  // Initialisation
  useEffect(() => {
    fetchUnknownImages();
    fetchPersons();
  }, []);

  // Gérer la sélection d'une personne
  useEffect(() => {
    if (selectedPerson) {
      fetchPersonImages(selectedPerson);

    }
  }, [selectedPerson]);

  // Gérer le changement d'onglet
  useEffect(() => {
    setSelectedImages([]);
  }, [activeTab]);



  // pour ajouter une personne
  const handleCreateNewPerson = async () => {
    if (!selectedImageForNewPerson || !newPersonData.nom || !newPersonData.prenom) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
  
    try {
      setLoading(prev => ({ ...prev, action: true }));
      
      // Créer d'abord la personne
      const formData = new FormData();
      formData.append('nom', newPersonData.nom);
      formData.append('prenom', newPersonData.prenom);
      formData.append('date_naissance', newPersonData.date_naissance);
      formData.append('sexe', newPersonData.sexe);
      formData.append('role', newPersonData.role);
      formData.append('niveau_autorisation', newPersonData.niveau_autorisation);
      formData.append('autorisation', newPersonData.autorisation);
      formData.append('badge_actif', newPersonData.badge_actif);
      formData.append('limite_acces_jours', newPersonData.limite_acces_jours);
      
      if (newPersonData.plage_horaire_debut) {
        formData.append('plage_horaire_debut', `${newPersonData.plage_horaire_debut}:00`);
      }
      if (newPersonData.plage_horaire_fin) {
        formData.append('plage_horaire_fin', `${newPersonData.plage_horaire_fin}:00`);
      }
      
      formData.append('zones_acces', newPersonData.zones_acces.join(','));
      
      formData.append('jours_acces', 
        newPersonData.limite_acces_jours === false 
          ? "7/7" 
          : newPersonData.jours_acces.join(',')
      );
      
      // Ajouter la photo
      const photoResponse = await fetch(`/api/images/inconnu/${selectedImageForNewPerson}`);
      const photoBlob = await photoResponse.blob();
      formData.append('photo', photoBlob, selectedImageForNewPerson);
  
      const response = await fetch('/api/personnes/', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) throw new Error('Erreur lors de la création de la personne');

        // Mettre à jour l'état local sans recharger toute la liste
        const newPerson = await response.json();

        // Supprimer l'image du dossier inconnu et de l'état local
        setUnknownImages(prevImages => prevImages.filter(img => img !== selectedImageForNewPerson));
        setSelectedImages(prevSelected => prevSelected.filter(img => img !== selectedImageForNewPerson));

        // Ajouter la nouvelle personne à la liste
        setPersons(prevPersons => [...prevPersons, newPerson]);

        setSuccess('Personne créée avec succès');
        setAddPersonModalOpen(false);
        setSelectedImageForNewPerson(null);
        setNewPersonData({
        nom: "",
        prenom: "",
        date_naissance: "",
        sexe: "Homme",
        role: "Visiteur",
        niveau_autorisation: "Aucun",
        autorisation: "Non",
        zones_acces: [],
        jours_acces: [],
        limite_acces_jours: false,
        plage_horaire_debut: "",
        plage_horaire_fin: "",
        badge_actif: false,
        photo: null
        });

        // Supprimer physiquement l'image du serveur
        await fetch(`/api/images/inconnu/${selectedImageForNewPerson}`, {
        method: 'DELETE'
        });
  
      // Recharger les personnes uniquement
      await fetchPersons();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };





  // Gérer la sélection/désélection des images
  const handleImageSelect = (imageName) => {
    setSelectedImages(prev => 
      prev.includes(imageName) 
        ? prev.filter(img => img !== imageName) 
        : [...prev, imageName]
    );
  };

  // Déplacer des images vers une personne
  const moveToPerson = async (imageNames, personId) => {
    try {
      setLoading(prev => ({ ...prev, unknown: true }));
      
      const responses = await Promise.all(
        imageNames.map(imageName => 
          fetch(`/api/images/inconnu/${imageName}/move/${personId}?as_main_photo=false`, { 
            method: "POST" 
          })
        )
      );

      // Vérifier les erreurs
      const errors = responses.filter(response => !response.ok);
      if (errors.length > 0) {
        throw new Error(`${errors.length} image(s) n'ont pas pu être envoyées`);
      }

      // Mettre à jour les états
      setUnknownImages(prev => prev.filter(img => !imageNames.includes(img)));
      setSuccess(`${imageNames.length} image(s) envoyée(s) avec succès`);
      setSelectedImages([]);

      // Recharger les images de la personne si c'est l'onglet actif
      if (personId === selectedPerson) {
        await fetchPersonImages(personId);
      }
      
      // Recharger les images inconnues
      await fetchUnknownImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, unknown: false }));
    }
  };

  // Récupérer des images vers le dossier inconnu
  const recoverToUnknown = async (imageNames, personId) => {
    try {
      setLoading(prev => ({ ...prev, personImages: true }));
      
      const responses = await Promise.all(
        imageNames.map(imageName => 
          fetch(`/api/personnes/${personId}/images/${imageName}/recover`, { 
            method: "POST" 
          })
        )
      );

      // Vérifier les erreurs
      const errors = responses.filter(response => !response.ok);
      if (errors.length > 0) {
        throw new Error(`${errors.length} image(s) n'ont pas pu être récupérées`);
      }

      // Mettre à jour les états
      setPersonImages(prev => prev.filter(img => !imageNames.includes(img)));
      setSuccess(`${imageNames.length} image(s) récupérée(s) avec succès`);
      setSelectedImages([]);

      // Recharger les images inconnues
      await fetchUnknownImages();
      
      // Recharger les images de la personne
      await fetchPersonImages(personId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, personImages: false }));
    }
  };

  // Gérer les actions avec confirmation
  const handleAction = (action) => {
    if (selectedImages.length === 0) {
      setError('Veuillez sélectionner au moins une image');
      return;
    }
    
    if (action === 'move') {
      setCurrentAction(action);
      setConfirmOpen(true);
    } else if (action === 'recover' && selectedPerson) {
      setCurrentAction(action);
      setConfirmOpen(true);
    }
  };

  // Exécuter l'action après confirmation
  const confirmAction = () => {
    setConfirmOpen(false);
    
    if (currentAction === 'move' && selectedImages.length > 0) {
      moveToPerson(selectedImages, selectedPerson);
    } else if (currentAction === 'recover' && selectedImages.length > 0 && selectedPerson) {
      recoverToUnknown(selectedImages, selectedPerson);
    }
  };

  // Fermer les messages d'alerte
  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') return;
    setError(null);
    setSuccess(null);
  };

  // Style commun pour les cartes d'images
  const cardStyle = {
    position: 'relative',
    height: '200px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const cardMediaStyle = {
    height: '100%',
    width: '100%',
    objectFit: 'cover'
  };

  // Gestion des erreurs d'image
  const handleImageError = (e) => {
    console.log("Erreur de chargement d'image, utilisation d'une image par défaut");
    // Utiliser une image par défaut intégrée au lieu d'un chemin externe
    e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22318%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20318%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_158bd1d28ef%20text%20%7B%20fill%3A%23868e96%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A16pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_158bd1d28ef%22%3E%3Crect%20width%3D%22318%22%20height%3D%22180%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22109.203125%22%20y%3D%2297.2%22%3EImage%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 'lg', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Gestion des images
      </Typography>

      {/* Messages d'état */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={handleCloseAlert} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={handleCloseAlert} sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Image fontSize="small" />
                <span>Images inconnues</span>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" />
                <span>Images par personne</span>
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Contenu des onglets */}
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Onglet Images inconnues */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Images non attribuées ({unknownImages.length})
              </Typography>
              
              {selectedImages.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => {
                        if (selectedImages.length !== 1) {
                        setError('Veuillez sélectionner une seule image pour créer une nouvelle personne');
                        return;
                        }
                        setSelectedImageForNewPerson(selectedImages[0]);
                        setAddPersonModalOpen(true);
                    }}
                    >
                    Créer nouvelle personne
                    </Button>
                    
                    <Select
                    size="small"
                    value={selectedPerson}
                    onChange={(e) => {
                        e.stopPropagation();
                        setSelectedPerson(e.target.value);
                    }}
                    displayEmpty
                    sx={{ minWidth: 180 }}
                    onClick={(e) => e.stopPropagation()}
                    >
                    <MenuItem value="" disabled>
                        Attribuer à...
                    </MenuItem>
                    {persons.map(person => (
                        <MenuItem key={person.id_personne} value={person.id_personne}>
                        {person.prenom} {person.nom}
                        </MenuItem>
                    ))}
                    </Select>
                    
                    <Button 
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={!selectedPerson || selectedImages.length === 0}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAction('move');
                    }}
                    >
                    Attribuer ({selectedImages.length})
                    </Button>
                    
                    <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImages([]);
                    }}
                    >
                    Annuler
                    </Button>
                </Box>
                )}
            </Box>
            
            {loading.unknown ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : unknownImages.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                Aucune image dans le dossier inconnu
              </Box>
            ) : (
              <Grid container spacing={2}>
                {unknownImages.map((imageName) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={imageName}>
                    <Card 
                        sx={{ 
                            ...cardStyle,
                            border: selectedImages.includes(imageName) ? '2px solid' : '1px solid',
                            borderColor: selectedImages.includes(imageName) ? 'primary.main' : 'divider',
                        }}
                        onClick={(e) => {
                            // Ne faites rien ici, la sélection se fera uniquement via la checkbox
                        }}
                        >
                        <CardMedia
                            component="img"
                            image={`/api/images/inconnu/${imageName}`}
                            alt={imageName}
                            sx={cardMediaStyle}
                            onError={handleImageError}
                        />
                        <Box 
                            sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8,
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                            p: 0.5,
                            cursor: 'pointer'
                            }}
                            onClick={(e) => {
                            e.stopPropagation();
                            handleImageSelect(imageName);
                            }}
                        >
                            {selectedImages.includes(imageName) ? (
                            <CheckBox color="primary" />
                            ) : (
                            <CheckBoxOutlineBlank color="disabled" />
                            )}
                        </Box>
                        </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Onglet Images par personne */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Select
                fullWidth
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                displayEmpty
                disabled={loading.persons}
                renderValue={(selected) => {
                  if (!selected) {
                    return <em>Sélectionnez une personne...</em>;
                  }
                  const person = persons.find(p => p.id_personne === selected);
                  return person ? `${person.prenom} ${person.nom}` : '';
                }}
              >
                <MenuItem value="" disabled>
                  Sélectionnez une personne...
                </MenuItem>
                {persons.map(person => (
                  <MenuItem key={person.id_personne} value={person.id_personne}>
                    {person.prenom} {person.nom}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {selectedPerson && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                  {personImages.length} image(s) supplémentaire(s)
                </Typography>
                
                {selectedImages.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<CloudUpload />}
                      onClick={() => handleAction('recover')}
                    >
                      Récupérer ({selectedImages.length})
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setSelectedImages([])}
                    >
                      Annuler
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {loading.personImages ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : !selectedPerson ? (
              <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                Sélectionnez une personne pour voir ses images
              </Box>
            ) : personImages.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                Cette personne n'a pas d'images supplémentaires
              </Box>
            ) : (
              <Grid container spacing={2}>
                {personImages.map((imageName) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={imageName}>
                    <Card 
                    sx={{ 
                        ...cardStyle,
                        border: selectedImages.includes(imageName) ? '2px solid' : '1px solid',
                        borderColor: selectedImages.includes(imageName) ? 'primary.main' : 'divider',
                        cursor: 'pointer'
                    }}
                    >
                    <CardMedia
                        component="img"
                        image={`/api/personnes/${selectedPerson}/image/${imageName}`}
                        alt={imageName}
                        sx={{ 
                        ...cardMediaStyle,
                        opacity: selectedImages.includes(imageName) ? 0.7 : 1
                        }}
                        onError={handleImageError}
                        onClick={(e) => {
                        e.stopPropagation();
                        handleImageSelect(imageName);
                        }}
                    />
                    <Box 
                        sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                        p: 0.5
                        }}
                        onClick={(e) => {
                        e.stopPropagation();
                        handleImageSelect(imageName);
                        }}
                    >
                        {selectedImages.includes(imageName) ? (
                        <CheckBox color="primary" />
                        ) : (
                        <CheckBoxOutlineBlank color="disabled" />
                        )}
                    </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      {/* Dialogue de confirmation */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer l'action</DialogTitle>
        <DialogContent>
          <Typography>
            {currentAction === 'move' 
              ? `Voulez-vous vraiment déplacer ${selectedImages.length} image(s) vers cette personne ?`
              : `Voulez-vous vraiment récupérer ${selectedImages.length} image(s) vers le dossier inconnu ?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annuler</Button>
          <Button onClick={confirmAction} color="primary" variant="contained">
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal pour créer une nouvelle personne */}
    <Dialog 
    open={addPersonModalOpen} 
    onClose={() => setAddPersonModalOpen(false)} 
    maxWidth="md" 
    fullWidth
    >
    <DialogTitle>Créer une nouvelle personne</DialogTitle>
    <DialogContent>
        <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar 
            src={selectedImageForNewPerson ? `/api/images/inconnu/${selectedImageForNewPerson}` : null}
            sx={{ 
            height: 140, 
            width: 140,
            border: '3px solid #fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            mb: 2
            }}
        />
        <Typography variant="subtitle1">
            Photo sélectionnée: {selectedImageForNewPerson}
        </Typography>
        </Box>

        <Box display="grid" gap={2} gridTemplateColumns={{ xs: "1fr", sm: "repeat(2, 1fr)" }}>
        <TextField
            fullWidth
            margin="normal"
            name="nom"
            label="Nom"
            value={newPersonData.nom}
            onChange={(e) => setNewPersonData({...newPersonData, nom: e.target.value})}
            required
        />
        <TextField
            fullWidth
            margin="normal"
            name="prenom"
            label="Prénom"
            value={newPersonData.prenom}
            onChange={(e) => setNewPersonData({...newPersonData, prenom: e.target.value})}
            required
        />
        <TextField
            fullWidth
            margin="normal"
            name="date_naissance"
            label="Date de naissance"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={newPersonData.date_naissance}
            onChange={(e) => setNewPersonData({...newPersonData, date_naissance: e.target.value})}
        />
        <FormControl fullWidth margin="normal">
            <InputLabel>Sexe</InputLabel>
            <Select
            name="sexe"
            value={newPersonData.sexe}
            onChange={(e) => setNewPersonData({...newPersonData, sexe: e.target.value})}
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
            value={newPersonData.role}
            onChange={(e) => setNewPersonData({...newPersonData, role: e.target.value})}
        />
        
        <FormControl fullWidth margin="normal">
            <InputLabel>Autorisation</InputLabel>
            <Select
            name="autorisation"
            value={newPersonData.autorisation}
            onChange={(e) => setNewPersonData({...newPersonData, autorisation: e.target.value})}
            >
            <MenuItem value="Oui">Oui</MenuItem>
            <MenuItem value="Non">Non</MenuItem>
            </Select>
        </FormControl>

        {newPersonData.autorisation === "Oui" && (
            <>
            <FormControl fullWidth margin="normal">
                <InputLabel>Niveau d'Autorisation</InputLabel>
                <Select
                name="niveau_autorisation"
                value={newPersonData.niveau_autorisation}
                onChange={(e) => setNewPersonData({...newPersonData, niveau_autorisation: e.target.value})}
                >
                <MenuItem value="Aucun">Aucun</MenuItem>
                <MenuItem value="Accès Basique">Accès Basique</MenuItem>
                <MenuItem value="Accès Avancé">Accès Avancé</MenuItem>
                <MenuItem value="Accès Admin">Accès Admin</MenuItem>
                </Select>
            </FormControl>
            
            <TextField
                fullWidth
                margin="normal"
                name="plage_horaire_debut"
                label="Heure de début"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={newPersonData.plage_horaire_debut}
                onChange={(e) => setNewPersonData({...newPersonData, plage_horaire_debut: e.target.value})}
            />
            
            <TextField
                fullWidth
                margin="normal"
                name="plage_horaire_fin"
                label="Heure de fin"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={newPersonData.plage_horaire_fin}
                onChange={(e) => setNewPersonData({...newPersonData, plage_horaire_fin: e.target.value})}
            />

            <FormControl fullWidth margin="normal">
                <InputLabel>Restriction d'accès</InputLabel>
                <Select
                value={newPersonData.limite_acces_jours ? "limité" : "illimité"}
                onChange={(e) => {
                    const isLimited = e.target.value === "limité";
                    setNewPersonData({
                    ...newPersonData,
                    limite_acces_jours: isLimited,
                    jours_acces: isLimited ? (newPersonData.jours_acces || []) : []
                    });
                }}
                >
                <MenuItem value="illimité">Accès tous les jours (7/7)</MenuItem>
                <MenuItem value="limité">Accès limité à certains jours</MenuItem>
                </Select>
            </FormControl>

            {newPersonData.limite_acces_jours && (
                <FormControl fullWidth margin="normal">
                <InputLabel>Jours d'accès autorisés</InputLabel>
                <Select
                    multiple
                    value={newPersonData.jours_acces}
                    onChange={(e) => {
                    const { value } = e.target;
                    setNewPersonData({...newPersonData, jours_acces: value});
                    }}
                    renderValue={(selected) => selected.join(', ')}
                >
                    {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((jour) => (
                    <MenuItem key={jour} value={jour}>
                        <Checkbox checked={newPersonData.jours_acces.includes(jour)} />
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
            value={newPersonData.badge_actif}
            onChange={(e) => setNewPersonData({...newPersonData, badge_actif: e.target.value})}
            >
            <MenuItem value={true}>Actif</MenuItem>
            <MenuItem value={false}>Inactif</MenuItem>
            </Select>
        </FormControl>
        </Box>

        <FormControl fullWidth margin="normal">
        <InputLabel>Zones d'Accès</InputLabel>
        <Select
            multiple
            name="zones_acces"
            value={newPersonData.zones_acces}
            onChange={(e) => setNewPersonData({...newPersonData, zones_acces: e.target.value})}
            renderValue={selected => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map(value => (
                <Chip key={value} label={value} />
                ))}
            </Box>
            )}
        >
            {["Entrée principale", "Bureaux administratifs", "Laboratoires", "Salles de réunion", "Zone sécurisée", "Cafétéria", "Parking"].map(zone => (
            <MenuItem key={zone} value={zone}>
                {zone}
            </MenuItem>
            ))}
        </Select>
        </FormControl>
        
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setAddPersonModalOpen(false)} color="secondary">
        Annuler
        </Button>
        <Button onClick={handleCreateNewPerson} color="primary" disabled={loading.action}>
        {loading.action ? <CircularProgress size={24} /> : "Créer"}
        </Button>
    </DialogActions>
    </Dialog>    
    </Box>

  );
};

export default ImageManager;
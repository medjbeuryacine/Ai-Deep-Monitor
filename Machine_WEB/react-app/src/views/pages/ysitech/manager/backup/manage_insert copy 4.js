import React, { useState, useEffect } from 'react';
import {
  Grid, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, AlertTitle, Button, Modal, TextField,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogActions,
  DialogContent, DialogTitle
} from '@mui/material';

const DeviceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceList, setDeviceList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Indicate if we are editing a device
  const [selectedDevice, setSelectedDevice] = useState(null); // Device to edit

  const [newDevice, setNewDevice] = useState({
    serial: '',
    name: '',
    ip: '',
    location: '',
    status: 'On',
  });

  // Fonction pour récupérer la liste des dispositifs
  const fetchDeviceList = async () => {
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des dispositifs');
      }
      const data = await response.json();
      setDeviceList(data);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Fonction pour récupérer l'historique des dispositifs
  const fetchHistoryList = async () => {
    try {
      const response = await fetch('/api/device/history');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'historique');
      }
      const data = await response.json();
      setHistoryList(data);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Fonction pour ajouter ou mettre à jour un dispositif
  // Fonction pour ajouter ou mettre à jour un dispositif
const handleAddOrUpdateDevice = async () => {
  try {
    const method = isEditMode ? 'PUT' : 'POST';
    const endpoint = isEditMode ? `/api/devices/${newDevice.serial}` : '/api/devices';
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDevice),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'ajout ou modification du dispositif');
    }

    // Réinitialiser le formulaire et fermer le modal
    setNewDevice({ serial: '', name: '', ip: '', location: '', status: 'On' });
    setOpenModal(false);

    // Réactualiser la liste des dispositifs et l'historique
    fetchDeviceList(); // Récupérer la liste mise à jour des dispositifs
    fetchHistoryList(); // Récupérer l'historique mis à jour après modification
  } catch (error) {
    setErrorMessage(error.message);
  }
};

  // Fonction pour ouvrir le modal en mode édition
  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setNewDevice({
      serial: device.serial,
      name: device.name,
      ip: device.ip,
      location: device.location,
      status: device.status,
    });
    setIsEditMode(true);
    setOpenModal(true);
  };

  // Fonction pour ouvrir le modal en mode ajout
  const handleAddDevice = () => {
    setNewDevice({
      serial: '',
      name: '',
      ip: '',
      location: '',
      status: 'On',
    });
    setIsEditMode(false);
    setOpenModal(true);
  };

  // Utilisation de useEffect pour récupérer les données au montage du composant
  useEffect(() => {
    fetchDeviceList();
    fetchHistoryList();
    setLoading(false); // Données chargées
  }, []);

  // Affichage des données et gestion des erreurs
  return (
    <Box sx={{ padding: 2 }}>
      {/* Affichage des messages d'erreur */}
      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Erreur</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {/* Bouton pour ajouter un Device */}
      <Button variant="contained" color="primary" onClick={handleAddDevice}>
        Ajouter un Device
      </Button>

      {/* Liste des dispositifs */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ padding: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Serial</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Emplacement</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deviceList.length > 0 ? (
                    deviceList.map((device) => (
                      <TableRow key={device.serial}>
                        <TableCell>{device.serial}</TableCell>
                        <TableCell>{device.name}</TableCell>
                        <TableCell>{device.ip}</TableCell>
                        <TableCell>{device.status}</TableCell>
                        <TableCell>{device.location}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleEditDevice(device)}
                          >
                            Modifier
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>Aucun Device trouvé</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Historique des dispositifs */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ padding: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Serial</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Ancienne</TableCell>
                    <TableCell>Nouvelle</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyList.length > 0 ? (
                    historyList.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.serial}</TableCell>
                        <TableCell>{entry.action}</TableCell>
                        <TableCell>{entry.type}</TableCell>
                        <TableCell>{entry.old_value}</TableCell>
                        <TableCell>{entry.new_value}</TableCell>
                        <TableCell>{entry.created_at}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>Aucun historique trouvé</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal pour ajouter ou modifier un dispositif */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>{isEditMode ? 'Modifier un Device' : 'Ajouter un Device'}</DialogTitle>
        <DialogContent>
          {/* Champ Serial (en lecture seule) */}
          <TextField
            label="Serial"
            fullWidth
            margin="normal"
            value={newDevice.serial}
            InputProps={{
              readOnly: true,
            }}
          />
          <TextField
            label="Nom"
            fullWidth
            margin="normal"
            value={newDevice.name}
            onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
          />
          <TextField
            label="IP"
            fullWidth
            margin="normal"
            value={newDevice.ip}
            onChange={(e) => setNewDevice({ ...newDevice, ip: e.target.value })}
          />
          <TextField
            label="Emplacement"
            fullWidth
            margin="normal"
            value={newDevice.location}
            onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Statut</InputLabel>
            <Select
              value={newDevice.status}
              onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
            >
              <MenuItem value="On">On</MenuItem>
              <MenuItem value="Off">Off</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Supprimer">Supprimer</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="secondary">Annuler</Button>
          <Button onClick={handleAddOrUpdateDevice} color="primary">{isEditMode ? 'Modifier' : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceManagement;

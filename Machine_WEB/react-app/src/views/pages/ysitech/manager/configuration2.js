import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
} from "@mui/material";
import { AddCircleOutline, Delete, Edit } from "@mui/icons-material";

const API_BASE_URL = "/api";

// Liste fixe des clés correspondant aux onglets
const TAB_KEYS = ["caméras", "iaDetection", "configurations"];

const ConfigManagement = () => {
  const [activeTab, setActiveTab] = useState(0);

  // État global pour stocker les différentes listes
  const [data, setData] = useState({
    caméras: [],
    iaDetection: [],
    configurations: [],
  });

  // État pour savoir si on est en train d'éditer un élément
  const [editingItem, setEditingItem] = useState(null);

  // État pour stocker l'élément en cours de création/édition
  const [newItem, setNewItem] = useState({});

  // État pour la boîte de dialogue (ouverte/fermée)
  const [openModal, setOpenModal] = useState(false);

  // États de gestion du chargement et d'erreur
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // Récupération de toutes les données
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/caméras`),
        fetch(`${API_BASE_URL}/iaDetection`),
        fetch(`${API_BASE_URL}/configurations`),
      ]);

      responses.forEach((res) => {
        if (!res.ok) {
          throw new Error(`Échec du chargement: ${res.status}`);
        }
      });

      const results = await Promise.all(responses.map((res) => res.json()));

      setData({
        caméras: results[0] || [],
        iaDetection: results[1] || [],
        configurations: results[2] || [],
      });
    } catch (err) {
      console.error("Erreur de récupération des données", err);
      setError("Une erreur est survenue lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  // Changement d'onglet
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setError("");
  };

  // Gestion du formulaire (création/édition)
  const handleChange = (event) => {
    setNewItem({ ...newItem, [event.target.name]: event.target.value });
  };

  // Ajout ou mise à jour d’un élément
  const handleAddOrUpdate = async () => {
    const key = TAB_KEYS[activeTab];
    if (!key) return;

    const method = editingItem ? "PUT" : "POST";
    const url = editingItem
      ? `${API_BASE_URL}/${key}/${editingItem.id}`
      : `${API_BASE_URL}/${key}`;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de l'opération: ${response.status}`);
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      console.error("Erreur lors de l'opération", err);
      setError("Impossible de sauvegarder les modifications.");
    } finally {
      setLoading(false);
    }
  };

  // Suppression d’un élément
  const handleDelete = async (id) => {
    const key = TAB_KEYS[activeTab];
    if (!key) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/${key}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression: ${response.status}`);
      }

      await fetchData();
    } catch (err) {
      console.error("Erreur de suppression", err);
      setError("Impossible de supprimer cet élément.");
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir la boîte de dialogue (mode ajout ou édition)
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setNewItem(item || {});
    setOpenModal(true);
  };

  // Fermer la boîte de dialogue
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingItem(null);
    setNewItem({});
    setError("");
  };

  // Champs du formulaire, selon l'onglet
  const renderFields = () => {
    switch (activeTab) {
      case 0: // Caméras
        return (
          <>
            <TextField
              name="nom"
              label="Nom de la caméra"
              fullWidth
              margin="normal"
              value={newItem.nom || ""}
              onChange={handleChange}
            />
            <TextField
              name="zone"
              label="Zone de surveillance"
              fullWidth
              margin="normal"
              value={newItem.zone || ""}
              onChange={handleChange}
            />
            <Select
              name="type"
              value={newItem.type || ""}
              onChange={handleChange}
              fullWidth
              sx={{ mt: 1, mb: 2 }}
            >
              <MenuItem value="IP">IP</MenuItem>
              <MenuItem value="Analogique">Analogique</MenuItem>
            </Select>
          </>
        );
      case 1: // IA Détection
        return (
          <>
            <TextField
              name="typeDetection"
              label="Type de détection"
              fullWidth
              margin="normal"
              value={newItem.typeDetection || ""}
              onChange={handleChange}
            />
            <TextField
              name="seuils"
              label="Seuils de détection"
              fullWidth
              margin="normal"
              value={newItem.seuils || ""}
              onChange={handleChange}
            />
          </>
        );
      case 2: // Configurations
        return (
          <TextField
            name="configurationName"
            label="Nom de la configuration"
            fullWidth
            margin="normal"
            value={newItem.configurationName || ""}
            onChange={handleChange}
          />
        );
      default:
        return null;
    }
  };

  // Rendu du tableau selon l'onglet
  const renderTable = () => {
    const key = TAB_KEYS[activeTab];
    const currentData = data[key] || [];

    if (currentData.length === 0) {
      return (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Aucune donnée à afficher pour l’onglet sélectionné.
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.nom}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenModal(item)} sx={{ color: "#ffef4a" }}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(item.id)} sx={{ color: "#ff4f4a" }}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Gestion des Caméras, IA de Détection, et Configurations
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Caméras" />
        <Tab label="IA Détection" />
        <Tab label="Configurations" />
      </Tabs>

      <Paper sx={{ p: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={() => handleOpenModal()}
        >
          Ajouter
        </Button>
      </Paper>

      {/* Affichage d'un message d'erreur global s'il existe */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Indicateur de chargement */}
      {loading ? (
        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderTable()
      )}

      {/* Boîte de dialogue (ajout / édition) */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingItem ? "Modifier" : "Ajouter"} un élément
        </DialogTitle>
        <DialogContent>
          {renderFields()}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleAddOrUpdate} color="primary">
            {editingItem ? "Modifier" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigManagement;

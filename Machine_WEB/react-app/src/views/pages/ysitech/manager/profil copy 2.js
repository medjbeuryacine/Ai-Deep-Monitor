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
const TAB_KEYS = ["profils", "seuils", "users", "groupes", "userGroups"];

const ConfigManagement = () => {
  const [activeTab, setActiveTab] = useState(0);

  // État global pour stocker les différentes listes
  const [data, setData] = useState({
    profils: [],
    seuils: [],
    users: [],
    groupes: [],
    userGroups: [],
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
        fetch(`${API_BASE_URL}/profils`),
        fetch(`${API_BASE_URL}/seuils`),
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/groupes`),
        fetch(`${API_BASE_URL}/user-groups`),
      ]);

      responses.forEach((res) => {
        if (!res.ok) {
          throw new Error(`Échec du chargement: ${res.status}`);
        }
      });

      const results = await Promise.all(responses.map((res) => res.json()));

      setData({
        profils: results[0] || [],
        seuils: results[1] || [],
        users: results[2] || [],
        groupes: results[3] || [],
        userGroups: results[4] || [],
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
      // Profils
      case 0:
      // Groupes
      case 3:
        return (
          <TextField
            name="nom"
            label="Nom"
            fullWidth
            margin="normal"
            value={newItem.nom || ""}
            onChange={handleChange}
          />
        );

      // Seuils
      case 1:
        return (
          <>
            <Select
              name="profil_id"
              value={newItem.profil_id || ""}
              onChange={handleChange}
              fullWidth
              sx={{ mt: 1, mb: 2 }}
            >
              {data.profils.map((profil) => (
                <MenuItem key={profil.id} value={profil.id}>
                  {profil.nom}
                </MenuItem>
              ))}
            </Select>

            <Select
              name="niveau"
              value={newItem.niveau || ""}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            >
              <MenuItem value="Mineur">Mineur</MenuItem>
              <MenuItem value="Majeur">Majeur</MenuItem>
              <MenuItem value="Critique">Critique</MenuItem>
            </Select>

            <TextField
              name="valeur_min"
              label="Valeur Min"
              fullWidth
              margin="normal"
              type="number"
              value={newItem.valeur_min || ""}
              onChange={handleChange}
            />
            <TextField
              name="valeur_max"
              label="Valeur Max"
              fullWidth
              margin="normal"
              type="number"
              value={newItem.valeur_max || ""}
              onChange={handleChange}
            />
          </>
        );

      // Utilisateurs
      case 2:
        return (
          <>
            <TextField
              name="nom"
              label="Nom"
              fullWidth
              margin="normal"
              value={newItem.nom || ""}
              onChange={handleChange}
            />
            <TextField
              name="email"
              label="Email"
              fullWidth
              margin="normal"
              value={newItem.email || ""}
              onChange={handleChange}
            />
            <TextField
              name="telephone"
              label="Téléphone"
              fullWidth
              margin="normal"
              value={newItem.telephone || ""}
              onChange={handleChange}
            />
            <TextField
              name="discord_id"
              label="Discord ID"
              fullWidth
              margin="normal"
              value={newItem.discord_id || ""}
              onChange={handleChange}
            />
            {/*
              Si vous n'avez vraiment pas de champ "password" côté serveur,
              retirez simplement celui-ci. Sinon, vous pouvez le laisser
              et ne pas l'afficher dans le tableau.
            */}
            {/* <TextField
              name="password"
              label="Mot de passe"
              fullWidth
              margin="normal"
              type="password"
              value={newItem.password || ""}
              onChange={handleChange}
            /> */}
          </>
        );

      // UserGroups
      case 4:
        return (
          <>
            <Select
              name="user_id"
              value={newItem.user_id || ""}
              onChange={handleChange}
              fullWidth
              sx={{ mt: 1, mb: 2 }}
            >
              {data.users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.nom}
                </MenuItem>
              ))}
            </Select>

            <Select
              name="groupe_id"
              value={newItem.groupe_id || ""}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            >
              {data.groupes.map((groupe) => (
                <MenuItem key={groupe.id} value={groupe.id}>
                  {groupe.nom}
                </MenuItem>
              ))}
            </Select>
          </>
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

    // Cas particulier pour l’onglet "User Groupes"
    if (key === "userGroups") {
      return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Groupe</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentData.map((item) => {
                const user = data.users.find((u) => u.id === item.user_id);
                const groupe = data.groupes.find((g) => g.id === item.groupe_id);

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{user?.nom || "Inconnu"}</TableCell>
                    <TableCell>{groupe?.nom || "Inconnu"}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenModal(item)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(item.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    // Pour les autres onglets, on génère les colonnes de façon générique
    // (Filtrage pour ignorer un éventuel "password" s'il existe)
    const columns = Object.keys(currentData[0]).filter(
      (column) => column !== "password"
    );

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentData.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column}>{item[column]}</TableCell>
                ))}
                <TableCell>
                  <IconButton onClick={() => handleOpenModal(item)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(item.id)}>
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
        Gestion des Profils, Seuils, Utilisateurs et Groupes
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Profils" />
        <Tab label="Seuils" />
        <Tab label="Utilisateurs" />
        <Tab label="Groupes" />
        <Tab label="User Groupes" />
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

import React, { useState, useEffect } from "react";
import {
  Box, Button, Typography, Paper, Tabs, Tab, TextField, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, Dialog, DialogActions, DialogContent, DialogTitle
} from "@mui/material";
import { AddCircleOutline, Delete, Edit } from "@mui/icons-material";

const API_BASE_URL = "/api";

const ConfigManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState({ profils: [], seuils: [], users: [], groupes: [], userGroups: [] });
  const [newItem, setNewItem] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/profils`),
        fetch(`${API_BASE_URL}/seuils`),
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/groupes`),
        fetch(`${API_BASE_URL}/user-groups`),
      ]);
      const results = await Promise.all(responses.map((res) => res.json()));
      setData({ profils: results[0] || [], seuils: results[1] || [], users: results[2] || [], groupes: results[3] || [], userGroups: results[4] || [] });
    } catch (error) {
      console.error("Erreur de récupération des données", error);
    }
  };

  const handleTabChange = (event, newValue) => setActiveTab(newValue);
  const handleChange = (event) => setNewItem({ ...newItem, [event.target.name]: event.target.value });

  const handleAddOrUpdate = async () => {
    const endpoint = Object.keys(data)[activeTab];
    try {
      const method = editingItem ? "PUT" : "POST";
      await fetch(`${API_BASE_URL}/${endpoint}${editingItem ? `/${editingItem.id}` : ""}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error("Erreur lors de l'opération", error);
    }
  };

  const handleDelete = async (id) => {
    const endpoint = Object.keys(data)[activeTab];
    try {
      await fetch(`${API_BASE_URL}/${endpoint}/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Erreur de suppression", error);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setNewItem(item || {});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingItem(null);
    setNewItem({});
  };

  const renderFields = () => {
    switch (activeTab) {
      case 0:
      case 3:
        return (
          <TextField name="nom" label="Nom" fullWidth margin="normal" value={newItem.nom || ""} onChange={handleChange} />
        );
      case 1:
        return (
          <>
            <Select name="profil_id" value={newItem.profil_id || ""} onChange={handleChange} fullWidth>
              {data.profils.map((profil) => (
                <MenuItem key={profil.id} value={profil.id}>{profil.nom}</MenuItem>
              ))}
            </Select>
            <Select name="niveau" value={newItem.niveau || ""} onChange={handleChange} fullWidth>
              <MenuItem value="Mineur">Mineur</MenuItem>
              <MenuItem value="Majeur">Majeur</MenuItem>
              <MenuItem value="Critique">Critique</MenuItem>
            </Select>
            <TextField name="valeur_min" label="Valeur Min" fullWidth margin="normal" type="number" value={newItem.valeur_min || ""} onChange={handleChange} />
            <TextField name="valeur_max" label="Valeur Max" fullWidth margin="normal" type="number" value={newItem.valeur_max || ""} onChange={handleChange} />
          </>
        );
      case 2:
        return (
          <>
            <TextField name="nom" label="Nom" fullWidth margin="normal" value={newItem.nom || ""} onChange={handleChange} />
            <TextField name="email" label="Email" fullWidth margin="normal" value={newItem.email || ""} onChange={handleChange} />
            <TextField name="telephone" label="Téléphone" fullWidth margin="normal" value={newItem.telephone || ""} onChange={handleChange} />
            <TextField name="discord_id" label="Discord ID" fullWidth margin="normal" value={newItem.discord_id || ""} onChange={handleChange} />
            <TextField name="password" label="Mot de passe" fullWidth margin="normal" type="password" value={newItem.password || ""} onChange={handleChange} />
          </>
        );
      case 4:
        return (
          <>
            <Select name="user_id" value={newItem.user_id || ""} onChange={handleChange} fullWidth>
              {data.users.map((user) => (
                <MenuItem key={user.id} value={user.id}>{user.nom}</MenuItem>
              ))}
            </Select>
            <Select name="groupe_id" value={newItem.groupe_id || ""} onChange={handleChange} fullWidth>
              {data.groupes.map((groupe) => (
                <MenuItem key={groupe.id} value={groupe.id}>{groupe.nom}</MenuItem>
              ))}
            </Select>
          </>
        );
      default:
        return null;
    }
  };

  const renderTable = () => {
    const currentData = data[Object.keys(data)[activeTab]];
    const columns = Object.keys(currentData[0] || {});

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
      <Typography variant="h5" gutterBottom>Gestion des Profils, Seuils, Utilisateurs et Groupes</Typography>
      <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
        <Tab label="Profils" />
        <Tab label="Seuils" />
        <Tab label="Utilisateurs" />
        <Tab label="Groupes" />
        <Tab label="User Groupes" />
      </Tabs>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Button variant="contained" color="primary" startIcon={<AddCircleOutline />} onClick={() => handleOpenModal()}>Ajouter</Button>
      </Paper>
      {renderTable()}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>{editingItem ? "Modifier" : "Ajouter"} un élément</DialogTitle>
        <DialogContent>{renderFields()}</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">Annuler</Button>
          <Button onClick={handleAddOrUpdate} color="primary">{editingItem ? "Modifier" : "Ajouter"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigManagement;
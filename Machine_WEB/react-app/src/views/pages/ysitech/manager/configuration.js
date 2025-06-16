import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, IconButton } from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';

const ConfigPage = () => {
  const [config, setConfig] = useState({
    logInterval: 5, // Intervalle en minutes
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    apiKeys: [], // Liste des clés API avec nom et clé
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config', { cache: "no-store" }); // Désactive le cache
      if (!response.ok) {
        throw new Error('Échec de la récupération des paramètres');
      }
      const data = await response.json();
      console.log("🔄 Données reçues de l'API:", data);
      setConfig({
        logInterval: data.log_interval, // Correction du mapping
        smtpHost: data.smtp_host,
        smtpPort: data.smtp_port,
        smtpUser: data.smtp_user,
        smtpPassword: data.smtp_password,
        apiKeys: data.api_keys || []
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      setConfig((prev) => ({ ...prev, apiKeys: [] })); // Définit apiKeys à [] en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApiKeyChange = (index, field, value) => {
    const updatedApiKeys = [...config.apiKeys];
    updatedApiKeys[index][field] = value;
    setConfig((prev) => ({
      ...prev,
      apiKeys: updatedApiKeys,
    }));
  };

  const addApiKey = async () => {
    setLoading(true);
    try {
      const newApiKey = { name: '', key: '' };
      const response = await fetch('/api/config-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiKey),
      });
      if (!response.ok) {
        throw new Error("Échec de l'ajout de la clé API");
      }
      await fetchConfig(); // Rafraîchir après ajout
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeApiKey = async (keyName) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/config-delete/${keyName}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error("Échec de la suppression de la clé API");
      }
      await fetchConfig(); // Rafraîchir après suppression
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error("Échec de la mise à jour des paramètres");
      }
      alert('Configuration mise à jour !');
      await fetchConfig(); // Rafraîchir après mise à jour
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Configuration du Système
      </Typography>
      <Paper sx={{ p: 3 }}>
        <TextField
          label="Intervalle de récolte des logs (Minutes)"
          type="number"
          name="logInterval"
          value={config.logInterval}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Paramètres SMTP
        </Typography>
        <TextField
          label="Adresse du serveur SMTP"
          name="smtpHost"
          value={config.smtpHost}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Port SMTP"
          name="smtpPort"
          type="number"
          value={config.smtpPort}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Utilisateur SMTP"
          name="smtpUser"
          value={config.smtpUser}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Mot de passe SMTP"
          name="smtpPassword"
          type="password"
          value={config.smtpPassword}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Clés API
        </Typography>
        {(config.apiKeys || []).map((apiKey, index) => (
          <Box key={index} display="flex" alignItems="center" gap={1}>
            <TextField
              label="Nom de la clé API"
              value={apiKey.name}
              onChange={(e) => handleApiKeyChange(index, 'name', e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Clé API"
              value={apiKey.key}
              onChange={(e) => handleApiKeyChange(index, 'key', e.target.value)}
              fullWidth
              margin="normal"
            />
            <IconButton onClick={() => removeApiKey(apiKey.name)} color="error">
              <RemoveCircleOutline />
            </IconButton>
          </Box>
        ))}
        <Box display="flex" gap={2} mt={2}>
          <Button startIcon={<AddCircleOutline />} onClick={addApiKey} variant="contained" color="secondary" fullWidth>
            Ajouter une clé API
          </Button>
          <Button variant="contained" color="primary" onClick={saveConfig} fullWidth disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConfigPage;

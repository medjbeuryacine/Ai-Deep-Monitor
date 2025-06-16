import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Alert, AlertTitle, Typography, Paper } from '@mui/material';

const ManageAlertLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const logsEndRef = useRef(null);

  // Fonction pour défiler automatiquement vers le bas
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fonction pour récupérer les logs via l'API
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alert-log');
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        if (response.ok) {
          setLogs(result);
        } else {
          setError(result.message || 'Erreur lors de la récupération des logs.');
        }
      } catch (e) {
        setError('Réponse de l’API non valide : ' + text.substring(0, 200));
      }
    } catch (err) {
      setError('Erreur lors de la requête API : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial et rafraîchissement toutes les 6 minutes
  useEffect(() => {
    fetchLogs();
    const intervalId = setInterval(fetchLogs, 6 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Défilement automatique vers le bas à chaque mise à jour des logs
  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  return (
    <Box p={2}>
      {loading && <CircularProgress />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Erreur</AlertTitle>
          {error}
        </Alert>
      )}
      <Typography variant="h6" gutterBottom>
        Logs
      </Typography>
      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 1,
          p: 2,
          maxHeight: '600px', // Environ 25 lignes selon la taille de police
          overflowY: 'auto'
        }}
      >
        {logs && logs.length > 0 ? (
          logs.map((log) => (
            <Paper key={log.date_alerte} sx={{ p: 1, mb: 1 }}>
              <Typography variant="body1" noWrap>

              {(() => {
                const date = new Date(log.date_alerte);
                const formattedDate = `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR')}`;
                return `${formattedDate} : Message: ${log.message}`;
              })()}
              
              </Typography>
            </Paper>
          ))
        ) : (
          <Typography>Aucun log à afficher</Typography>
        )}
        <div ref={logsEndRef} />
      </Box>
    </Box>
  );
};

export default ManageAlertLog;

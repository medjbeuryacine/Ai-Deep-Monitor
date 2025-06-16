import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const SystemMonitoring = () => {
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch('http://192.168.1.152:8001/system-stats');
        if (response.ok) {
          const data = await response.json();
          setSystemStats(data);
        } else {
          console.error('Erreur lors de la récupération des données:', response.status);
          setSystemStats({}); // Définir un objet vide si l'API échoue
        }
      } catch (error) {
        console.error('Erreur API monitoring:', error);
        setSystemStats({}); // Définir un objet vide en cas d'erreur
      }
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 1000); // Mise à jour toutes les 1 secondes

    return () => clearInterval(interval);
  }, []);

  const textStyle = {
    fontSize: '0.7rem', // Taille de texte cohérente pour tous les champs
    color: 'white',
    marginBottom: '0',
  };

  return (
    <Box
      display="flex"
      flexDirection="row"
      bgcolor="rgba(0, 0, 0, 0.4)"
      padding={0}
      borderRadius={2}
      boxShadow={1}
      marginTop={2}
      justify-content= "center"

    >
      {/* Colonne gauche : Statistiques du système */}
      <Box flex={1} padding={1}>
        <Typography variant="h6" color="white" gutterBottom>
          Performance du Système
        </Typography>

        {/* CPU */}
        <Typography style={textStyle}>
          CPU: {systemStats?.cpu_percent !== undefined ? `${systemStats.cpu_percent}%` : ''}
        </Typography>

        {/* RAM */}
        <Typography style={textStyle}>
          RAM: {systemStats?.ram_used_mb
            ? `${systemStats.ram_used_mb.toFixed(2)} MB / ${systemStats.ram_total_mb.toFixed(2)} MB (${systemStats.ram_percent}%)`
            : ''}
        </Typography>

        {/* GPU */}
        {systemStats?.gpu_info && systemStats.gpu_info.length > 0 && (
          <Box marginTop={1}>
            {systemStats.gpu_info.map((gpu, index) => (
              <Typography key={index} style={textStyle}>
                GPU {gpu.index} ({gpu.name}): {gpu.gpu_utilization} 
                (Mémoire utilisée: {gpu.memory_used_mb} / {gpu.memory_total_mb})
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      {/* Colonne droite : Statistiques du modèle */}
      <Box flex={1} padding={1} borderLeft="1px solid rgba(255, 255, 255, 0.2)">
        <Typography variant="h6" color="white" gutterBottom>
          Performance du Tchat
        </Typography>

        {/* Temps de réponse */}
        <Typography style={textStyle}>
          Temps de réponse : {systemStats?.chat_response_time_ms !== undefined ? `${systemStats.chat_response_time_ms} ms` : ''}
        </Typography>

        {/* Tokens */}
        <Typography style={textStyle}>
          Tokens : {systemStats?.chat_tokens !== undefined ? `${systemStats.chat_tokens}` : ''}
        </Typography>

        {/* Prix d'une requête */}
        <Typography style={textStyle}>
          Prix d'une requête : {systemStats?.chat_request_cost !== undefined ? `${systemStats.chat_request_cost} USD` : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default SystemMonitoring;

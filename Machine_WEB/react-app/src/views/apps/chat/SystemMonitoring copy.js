import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const SystemMonitoring = () => {
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch('http://192.168.1.152:8001/system-stats');
        if (response.ok) {
          const { status, data } = await response.json();
          if (status === 'success') {
            setSystemStats(data);
          }
        }
      } catch (error) {
        console.error('Erreur API monitoring:', error);
      }
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 500); // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    systemStats && (
      <Box
        display="flex"
        flexDirection="column"
        bgcolor="rgba(0, 0, 0, 0.4)"
        padding={2}
        borderRadius={2}
        boxShadow={1}
        marginTop={2}
      >
        <Typography variant="h6" color="white">Performance du Système</Typography>
        <Typography variant="body2" color="white">
          CPU: {systemStats.cpu_percent}%
        </Typography>
        <Typography variant="body2" color="white">
          RAM: {systemStats.ram_used_mb.toFixed(2)} MB / {systemStats.ram_total_mb.toFixed(2)} MB ({systemStats.ram_percent}%)
        </Typography>
        {systemStats.gpu_info && systemStats.gpu_info.length > 0 && (
          <Box marginTop={1}>
            {systemStats.gpu_info.map((gpu, index) => (
              <Typography key={index} variant="body2" color="white">
                GPU {gpu.index} ({gpu.name}): {gpu.gpu_utilization} (Mémoire utilisée: {gpu.memory_used_mb} / {gpu.memory_total_mb})
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    )
  );
};

export default SystemMonitoring;

import React, { useState } from 'react';
import {
  Grid,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  AlertTitle,
  CircularProgress,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Edit, Close } from '@mui/icons-material';

const ManageSnmpWalk = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]); // Les données retournées par l'API
  const [filters, setFilters] = useState({}); // Les filtres dynamiques
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' }); // Tri des données
  const [ipAddress, setIpAddress] = useState(''); // L'adresse IP saisie
  const [oid, setOid] = useState(''); // L'OID à parcourir
  const [error, setError] = useState(null); // Pour gérer les erreurs du formulaire

  // Fonction pour récupérer les données via l'API lorsque le bouton est cliqué
  const fetchData = async () => {
    if (!ipAddress) {
      setError('Veuillez remplir l\'adresse IP.');
      return;
    }

    // Validation simple de l'adresse IP
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipPattern.test(ipAddress)) {
      setError('L\'adresse IP est invalide.');
      return;
    }

    setLoading(true);
    setError(null); // Réinitialiser l'erreur avant de tenter la requête
    try {
      
      if (oid == '' ) {
        const response = await fetch(`/api/snmpwalk?ip=${ipAddress}`);
      }
      else
      {
        const response = await fetch(`/api/snmpwalk?ip=${ipAddress}&oid=${oid}`);
      }
      const result = await response.json();
      if (response.ok) {
        setData(result); // Stocke les données récupérées
        generateFilters(result); // Générer les filtres dynamiques
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression de l\'OID.'); // setError(result.message ); // ||'Erreur lors de la récupération des données.'
      }
    } catch (error) {
      setError('Erreur de requête API : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dynamiser les filtres
  const generateFilters = (data) => {
    const newFilters = {};
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key) => {
        newFilters[key] = '';
      });
    }
    setFilters(newFilters);
  };

  // Dynamiser le tableau en fonction des données
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  // Filtrer les données
  const filteredData = data.filter((row) => {
    return Object.keys(filters).every((key) =>
      row[key].toString().toLowerCase().includes(filters[key].toLowerCase())
    );
  });

  // Trier les données
  const sortedData = filteredData.sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Mettre à jour le filtre
  const handleFilterChange = (event, column) => {
    setFilters({ ...filters, [column]: event.target.value });
  };

  return (
    <Box>
      {/* Formulaire pour l'adresse IP et l'OID */}
      <Box mb={2}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Adresse IP"
              variant="outlined"
              fullWidth
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              error={!!error}
              helperText={error ? 'Entrez une adresse IP valide' : ''}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="OID"
              variant="outlined"
              fullWidth
              value={oid}
              onChange={(e) => setOid(e.target.value)}
              error={!!error}
              helperText={error ? 'Entrez un OID valide' : ''}
            />
          </Grid>
        </Grid>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchData} // On déclenche la requête ici
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Lancer la requête'
            )}
          </Button>
        </Box>
      </Box>

      {/* Affichage de l'erreur */}
      {error && (
        <Alert severity="error">
          <AlertTitle>Erreur</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Table des résultats */}
      {data.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column} onClick={() => requestSort(column)}>
                    {column}
                    {sortConfig.key === column && (
                      sortConfig.direction === 'asc' ? (
                        <ArrowDownward />
                      ) : (
                        <ArrowUpward />
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column}>
                    <TextField
                      size="small"
                      fullWidth
                      label={`Filtrer par ${column}`}
                      value={filters[column] || ''}
                      onChange={(e) => handleFilterChange(e, column)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>{row[column]}</TableCell>
                  ))}
                  <TableCell>
                    <IconButton onClick={() => alert(`Edit ${row.id}`)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => alert(`Delete ${row.id}`)} color="error">
                      <Close />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ManageSnmpWalk;

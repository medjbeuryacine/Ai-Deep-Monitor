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
  CircularProgress,
  Alert,
  AlertTitle,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

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
      const response = await fetch(oid ? `/api/snmpwalk?ip=${ipAddress}&oid=${oid}` : `/api/snmpwalk?ip=${ipAddress}`);
      const result = await response.json();
      console.log(result);
      if (response.ok) {
        // Vérifiez si la réponse contient la clé `results`
        if (Array.isArray(result.results)) {
          const formattedResults = result.results.map(item => {
            const [oid, value] = item;
            return { OID: oid, Value: value };
          });
          setData(formattedResults); // Stocke les données formatées
          generateFilters(formattedResults); // Générer les filtres dynamiques
        } else {
          setError('Les données retournées ne sont pas un tableau.');
        }
      } else {
        throw new Error(result.message || 'Erreur lors de la récupération des données.');
      }
    } catch (error) {
      setError('Erreur de requête API : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dynamiser les filtres
  const generateFilters = (data) => {
    const newFilters = {
      OID: '',
      Value: ''
    };
    setFilters(newFilters);
    console.log(data);
    console.log(newFilters);
  };

  // Filtrer les données
  const filteredData = Array.isArray(data) ? data.filter((row) => {
    return Object.keys(filters).every((key) =>
      row[key]?.toString().toLowerCase().includes(filters[key].toLowerCase())
    );
  }) : [];

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
                <TableCell sx={{ width: '50%' }} onClick={() => requestSort('OID')}>OID
                  {sortConfig.key === 'OID' && (
                    sortConfig.direction === 'asc' ? (
                      <ArrowDownward />
                    ) : (
                      <ArrowUpward />
                    )
                  )}
                </TableCell>
                <TableCell sx={{ width: '50%' }} onClick={() => requestSort('Value')}>Value
                  {sortConfig.key === 'Value' && (
                    sortConfig.direction === 'asc' ? (
                      <ArrowDownward />
                    ) : (
                      <ArrowUpward />
                    )
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    label="Filtrer par OID"
                    value={filters['OID'] || ''}
                    onChange={(e) => handleFilterChange(e, 'OID')}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    label="Filtrer par Value"
                    value={filters['Value'] || ''}
                    onChange={(e) => handleFilterChange(e, 'Value')}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ width: '50%' }}>{row.OID}</TableCell>
                  <TableCell sx={{ width: '50%' }}>{row.Value}</TableCell>
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

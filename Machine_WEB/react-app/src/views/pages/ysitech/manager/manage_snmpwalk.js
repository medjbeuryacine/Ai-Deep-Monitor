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
  TablePagination
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
  const [page, setPage] = useState(0); // Pagination de la table
  const [rowsPerPage, setRowsPerPage] = useState(10); // Nombre de lignes par page

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minutes en millisecondes

    try {
      const response = await fetch(oid ? `/api/snmpwalk?ip=${ipAddress}&oid=${oid}` : `/api/snmpwalk?ip=${ipAddress}`, {
        signal: controller.signal,
        headers: {
          'Connection': 'keep-alive', // Ajout d'un en-tête keep-alive
        },
      });

      // Vérification si la réponse est du HTML
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        if (response.ok) {
          if (Array.isArray(result.results)) {
            const formattedResults = result.results.map(item => {
              const [oid, value, description] = item;  // Ajoutez ici la description si elle est présente
              return { OID: oid, Value: value, Description: description || 'Aucune description' };
            });
            setData(formattedResults);
            generateFilters(formattedResults); // Générer les filtres dynamiques
          } else {
            setError('Les données retournées ne sont pas un tableau.');
          }
        } else {
          setError('Erreur lors de la récupération des données. ' + (result.message || ''));
        }
      } catch (e) {
        // Si le texte n'est pas JSON valide, afficher l'erreur de l'API
        setError('Réponse de l\'API non valide : ' + text.substring(0, 200));
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('La requête a été annulée en raison du dépassement du délai d\'attente.');
      } else {
        setError('Erreur de requête API : ' + error.message);
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId); // Annuler le timeout
    }
  };

  // Dynamiser les filtres
  const generateFilters = (data) => {
    const newFilters = {
      OID: '',
      Value: '',
      Description: ''
    };
    setFilters(newFilters);
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

  // Gérer la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Revenir à la première page lors du changement du nombre de lignes par page
  };

  return (
    <Box>
      {/* Formulaire pour l'adresse IP et l'OID */}
      <Box mb={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
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
            fullWidth
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
          {/* Pagination en haut du tableau */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ marginBottom: 2 }} // Espacement pour la pagination en haut
          />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%' }} align="left" onClick={() => requestSort('OID')}>OID
                  {sortConfig.key === 'OID' && (
                    sortConfig.direction === 'asc' ? (
                      <ArrowDownward />
                    ) : (
                      <ArrowUpward />
                    )
                  )}
                </TableCell>
                <TableCell sx={{ width: '30%' }} align="left" onClick={() => requestSort('Value')}>Value
                  {sortConfig.key === 'Value' && (
                    sortConfig.direction === 'asc' ? (
                      <ArrowDownward />
                    ) : (
                      <ArrowUpward />
                    )
                  )}
                </TableCell>
                <TableCell sx={{ width: '40%' }} align="left" onClick={() => requestSort('Description')}>Description
                  {sortConfig.key === 'Description' && (
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
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    label="Filtrer par Description"
                    value={filters['Description'] || ''}
                    onChange={(e) => handleFilterChange(e, 'Description')}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ width: '30%' }} align="left">{row.OID}</TableCell>
                  <TableCell sx={{ width: '30%' }} align="left">{row.Value}</TableCell>
                  <TableCell sx={{ width: '40%' }} align="left">{row.Description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination en bas du tableau */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ marginTop: 2 }} // Espacement pour la pagination en bas
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default ManageSnmpWalk;

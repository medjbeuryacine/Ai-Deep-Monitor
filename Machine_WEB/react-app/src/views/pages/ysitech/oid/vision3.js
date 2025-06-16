import React, { useState } from 'react';
import { Box, Grid, TextField, Button, Typography, Paper, CircularProgress, List, ListItem, ListItemText } from '@mui/material';

const SearchDoc = () => {
  const [inputText, setInputText] = useState(''); // L'OID que l'utilisateur entre
  const [apiResponse, setApiResponse] = useState(null); // Réponse de l'API (les détails de l'OID)
  const [loading, setLoading] = useState(false); // État de chargement
  const [error, setError] = useState(''); // Erreurs éventuelles

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (event) => {
    event.preventDefault(); // Empêcher le rechargement de la page
    setLoading(true); // Active le chargement pendant l'appel API
    setError(''); // Réinitialiser les erreurs précédentes
    setApiResponse(null); // Réinitialiser la réponse précédente

    try {
      // Faire l'appel API en utilisant GET et ajouter l'OID comme paramètre dans l'URL
      const response = await fetch(`/api/oidweb/?oid=${inputText}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json(); // Supposons que l'API renvoie un JSON avec les informations
        setApiResponse(data.details); // Mettre les détails dans le state
      } else {
        setError('Erreur : impossible de récupérer les informations pour cet OID.');
      }
    } catch (err) {
      console.error('Erreur lors de l\'appel à l\'API:', err);
      setError('Une erreur est survenue lors de l\'appel à l\'API.');
    } finally {
      setLoading(false); // Désactive le chargement après la réponse
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} sm={8}>
          <Paper elevation={3} sx={{ padding: 4 }}>
            <Typography variant="h4" color="primary" align="center" gutterBottom>
            Vision 3
            </Typography>
            <Typography variant="body1" color="textSecondary" align="center" paragraph>
              Entrez l'OID que vous recherchez pour obtenir les informations associées.<br />
              Cette recherche utilise des données provenant d'une source externe (https://cric.grenoble.cnrs.fr).
            </Typography>
            {/* Formulaire de recherche OID */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Entrez un OID"
                variant="outlined"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                required
                sx={{ marginBottom: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ padding: '12px', fontSize: '16px' }}
              >
                {loading ? <CircularProgress size={24} color="secondary" /> : 'Rechercher'}
              </Button>
            </form>
          </Paper>

          {/* Affichage des résultats ou des erreurs */}
          {error && (
            <Typography variant="body1" color="error" align="center" sx={{ marginTop: 2 }}>
              {error}
            </Typography>
          )}

          {apiResponse && (
            <Paper elevation={2} sx={{ padding: 3, marginTop: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Résultats de la Recherche pour OID :
              </Typography>
              {/* Affichage structuré des résultats */}
              <List>
                {apiResponse.map((item, index) => {
                  // On récupère chaque clé et valeur de l'objet item
                  const [label, value] = Object.entries(item)[0];
                  return (
                    <ListItem key={index}>
                      <ListItemText
                        primary={<strong>{label} :</strong>}
                        secondary={value}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchDoc;

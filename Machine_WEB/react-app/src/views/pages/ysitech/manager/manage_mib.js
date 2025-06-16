import React, { useState } from 'react';
import { Button, Box, Typography, Stack, CircularProgress, Alert } from '@mui/material';
import PageContainer from '../../../../components/container/PageContainer';
import Breadcrumb from '../../../../layouts/full/shared/breadcrumb/Breadcrumb';
import ParentCard from '../../../../components/shared/ParentCard';

const FileUploader = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [file, setFile] = useState(null);

  // Gestion du changement de fichier
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Gestion du glisser-déposer (drag and drop)
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  // Envoi du fichier au serveur
  const handleUploadFile = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!file) {
      setErrorMessage('Veuillez sélectionner un fichier avant de soumettre.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Fichier "${data.filename}" uploadé avec succès.`);
      } else {
        throw new Error(data.message || 'Erreur lors de l’upload du fichier.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Uploader un fichier" description="Gérez vos fichiers facilement">
      <Breadcrumb title="Fichiers" subtitle="Uploader un fichier" />

      <ParentCard title="Uploader un fichier">
        <form onSubmit={handleUploadFile}>
          <Box
            sx={{
              border: '2px dashed #1976d2',
              padding: '40px',
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer',
              mb: 3,
              backgroundColor: file ? '#f0f4f8' : '#ffffff',
              '&:hover': {
                backgroundColor: '#e3f2fd',
              },
              transition: 'background-color 0.3s ease',
            }}
            onClick={() => document.getElementById('file-input').click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
              Glissez et déposez un fichier ici, ou cliquez pour sélectionner un fichier
            </Typography>
            <input
              type="file"
              id="file-input"
              hidden
              onChange={handleFileChange}
            />
            {file && (
              <Typography variant="body2" color="primary" mt={2}>
                Fichier sélectionné: {file.name}
              </Typography>
            )}
          </Box>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                display: 'flex',
                alignItems: 'center',
                '&:disabled': {
                  backgroundColor: '#d3d3d3',
                },
              }}
            >
              {loading && <CircularProgress size={24} sx={{ mr: 1 }} />}
              {loading ? 'En cours...' : 'Uploader'}
            </Button>
          </Box>
        </form>

        {/* Alertes pour les messages d'erreur ou de succès */}
        <Stack mt={3}>
          {errorMessage && (
            <Alert variant="filled" severity="error">
              {errorMessage}
            </Alert>
          )}
          {successMessage && (
            <Alert variant="filled" severity="success">
              {successMessage}
            </Alert>
          )}
        </Stack>
      </ParentCard>
    </PageContainer>
  );
};

export default FileUploader;

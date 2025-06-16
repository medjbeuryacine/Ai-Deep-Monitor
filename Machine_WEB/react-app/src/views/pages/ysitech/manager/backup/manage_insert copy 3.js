import React, { useState } from 'react';
import {
  Grid,
  Box,
  FormControlLabel,
  Button,
  Stack,
  RadioGroup,
  Alert,
  AlertTitle,
} from '@mui/material';

import Breadcrumb from '../../../../../layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from '../../../../../components/container/PageContainer';

import CustomTextField from '../../../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../../../components/forms/theme-elements/CustomFormLabel';
import CustomRadio from '../../../../../components/forms/theme-elements/CustomRadio';
import ParentCard from '../../../../../components/shared/ParentCard';

const ManageInsert = () => {
  const [loading, setLoading] = useState(false);
  const [successMessagePDU, setSuccessMessagePDU] = useState('');
  const [errorMessagePDU, setErrorMessagePDU] = useState('');

  // Form state for PDU
  const [ip, setIp] = useState('');
  const [description, setDescription] = useState('');
  const [communication, setCommunication] = useState('public');
  const [version, setVersion] = useState('2');

  const validatePDUForm = () => {
    if (!ip || !description || !communication || !version) {
      setErrorMessagePDU('Tous les champs du formulaire doivent être remplis.');
      return false;
    }
    return true;
  };

  // Submit handler for PDU
  const handleSubmitPDU = async (e) => {
    e.preventDefault();
    if (!validatePDUForm()) return;

    setLoading(true);
    setSuccessMessagePDU('');
    setErrorMessagePDU('');

    console.log({
      ip,
      description,
      communication,
      version,
    });

    try {
      const response = await fetch('/api/addpdu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, description, communication, version }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessagePDU('Device ajouté avec succès.');
      } else {
        throw new Error(data.message || 'Erreur lors de l’ajout du Device.');
      }
    } catch (error) {
      setErrorMessagePDU(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Configuration" description="Device">
      <Breadcrumb title="Configuration" subtitle="Device" />

      {/* Formulaire PDU */}
      <ParentCard title="Ajouter Un Device">
        <form onSubmit={handleSubmitPDU}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel htmlFor="ip">IP Device</CustomFormLabel>
              <CustomTextField
                id="ip"
                placeholder="Entrer l'IP du Device"
                variant="outlined"
                fullWidth
                size="small"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel htmlFor="description">Description Device</CustomFormLabel>
              <CustomTextField
                id="description"
                placeholder="Entrer une description du Device"
                variant="outlined"
                fullWidth
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel>Communication</CustomFormLabel>
              <RadioGroup
                aria-label="communication"
                name="communication"
                value={communication}
                onChange={(e) => setCommunication(e.target.value)}
                row
              >
                <FormControlLabel value="public" control={<CustomRadio />} label="Public" />
                <FormControlLabel value="private" control={<CustomRadio />} label="Privé" />
              </RadioGroup>
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel>Version</CustomFormLabel>
              <RadioGroup
                aria-label="version"
                name="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                row
              >
                <FormControlLabel value="1" control={<CustomRadio />} label="1" />
                <FormControlLabel value="2" control={<CustomRadio />} label="2" />
                <FormControlLabel value="3" control={<CustomRadio />} label="3" />
              </RadioGroup>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button type="submit" variant="contained" color="secondary" disabled={loading}>
                  {loading ? 'En cours...' : 'Ajouter Device'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
        {/* Alert Messages for PDU */}
        <Stack mt={3}>
          {errorMessagePDU && (
            <Alert variant="filled" severity="error">
              <AlertTitle>Erreur</AlertTitle>
              {errorMessagePDU}
            </Alert>
          )}
          {successMessagePDU && (
            <Alert variant="filled" severity="success">
              <AlertTitle>Succès</AlertTitle>
              {successMessagePDU}
            </Alert>
          )}
        </Stack>
      </ParentCard>
    </PageContainer>
  );
};

export default ManageInsert;

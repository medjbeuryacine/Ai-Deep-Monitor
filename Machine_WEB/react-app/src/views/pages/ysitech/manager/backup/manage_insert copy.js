import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Box,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Button,
  Stack,
  Alert,
  AlertTitle,
} from '@mui/material';
import { SliderThumb } from '@mui/material/Slider';

import Breadcrumb from '../../../../layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from '../../../../components/container/PageContainer';

import CustomTextField from '../../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../../components/forms/theme-elements/CustomFormLabel';
import CustomRadio from '../../../../components/forms/theme-elements/CustomRadio';
import ParentCard from '../../../../components/shared/ParentCard';

const ManageInsert = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state for Machine
  const [machineName, setMachineName] = useState('');
  const [machineLocation, setMachineLocation] = useState('');
  const [machineState, setMachineState] = useState('1');



  // Form state for PDU
  const [ip, setIp] = useState('');
  const [description, setDescription] = useState('');
  const [communication, setCommunication] = useState('public');
  const [version, setVersion] = useState('2');

  // Submit handlers
  const handleSubmitMachine = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const response = await fetch('/api/addmachine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineName, machineLocation, machineState: String(machineState) }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Machine ajoutée avec succès.');
      } else {
        throw new Error(data.message || 'Erreur lors de l’ajout de la machine.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPDU = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const response = await fetch('/api/addpdus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, description, communication, version }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('PDU ajouté avec succès.');
      } else {
        throw new Error(data.message || 'Erreur lors de l’ajout du PDU.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Configuration" description="Machine | APC">
      <Breadcrumb title="Configuration" subtitle="Machine | APC" />

      {/* Formulaire Machine */}
      <ParentCard title="Ajouter Une Machine">
        <form onSubmit={handleSubmitMachine}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel htmlFor="machineName">Nom de la machine</CustomFormLabel>
              <CustomTextField
                id="machineName"
                placeholder="Entrer le nom de la machine"
                variant="outlined"
                fullWidth
                size="small"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel htmlFor="machineLocation">Emplacement Machine</CustomFormLabel>
              <CustomTextField
                id="machineLocation"
                placeholder="Entrer la localisation de la machine"
                variant="outlined"
                fullWidth
                size="small"
                value={machineLocation}
                onChange={(e) => setMachineLocation(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel>Etat Machine</CustomFormLabel>
              <RadioGroup
                aria-label="etat_machine"
                name="etatMachine"
                value={machineState} // Synchronisé avec l'état React
                onChange={(e) => setMachineState(e.target.value)}
              >
                <Grid container>
                  <Grid item xs={12} sm={4} lg={4}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="1" control={<CustomRadio />} label="Récolte" />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4} lg={4}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="2" control={<CustomRadio />} label="Arrêtée" />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4} lg={4}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="3" control={<CustomRadio />} label="Maintenance" />
                    </FormControl>
                  </Grid>
                </Grid>
              </RadioGroup>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button type="submit" variant="contained" color="secondary" disabled={loading}>
                  {loading ? 'En cours...' : 'Ajouter Machine'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </ParentCard>

      <br></br>

      {/* Formulaire PDU */}
      <ParentCard title="Ajouter Un PDU">
        <form onSubmit={handleSubmitPDU}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel htmlFor="ip">IP</CustomFormLabel>
              <CustomTextField
                id="ip"
                placeholder="Entrer l'IP du PDU"
                variant="outlined"
                fullWidth
                size="small"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel htmlFor="description">Description</CustomFormLabel>
              <CustomTextField
                id="description"
                placeholder="Entrer une description"
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
                value={communication} // Synchronisé avec l'état React
                onChange={(e) => setCommunication(e.target.value)}
              >
                <Grid container>
                  <Grid item xs={12} sm={6}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="public" control={<CustomRadio />} label="Public" />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="private" control={<CustomRadio />} label="Privé" />
                    </FormControl>
                  </Grid>
                </Grid>
              </RadioGroup>
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <CustomFormLabel>Version</CustomFormLabel>
              <RadioGroup
                aria-label="version"
                name="version"
                value={version} // Synchronisé avec l'état React
                onChange={(e) => setVersion(e.target.value)}
              >
                <Grid container>
                  <Grid item xs={12} sm={4}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="1" control={<CustomRadio />} label="1" />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="2" control={<CustomRadio />} label="2" />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl component="fieldset">
                      <FormControlLabel value="3" control={<CustomRadio />} label="3" />
                    </FormControl>
                  </Grid>
                </Grid>
              </RadioGroup>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button type="submit" variant="contained" color="secondary" disabled={loading}>
                  {loading ? 'En cours...' : 'Ajouter PDU'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </ParentCard>

      {/* Alert Messages */}
      {errorMessage && (
        <Stack mt={3}>
          <Alert variant="filled" severity="error">
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>
        </Stack>
      )}
      {successMessage && (
        <Stack mt={3}>
          <Alert variant="filled" severity="success">
            <AlertTitle>Success</AlertTitle>
            {successMessage}
          </Alert>
        </Stack>
      )}
    </PageContainer>
  );
};

export default ManageInsert;

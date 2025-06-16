import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Button,
  Stack,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Autocomplete,
  TextField,
  IconButton
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Add, Edit, Close } from '@mui/icons-material';  // Importation des icônes

// Importation de vos composants de base
import Breadcrumb from '../../../../layouts/full/shared/breadcrumb/Breadcrumb';
import PageContainer from '../../../../components/container/PageContainer';
import CustomTextField from '../../../../components/forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../../../components/forms/theme-elements/CustomFormLabel';
import ParentCard from '../../../../components/shared/ParentCard';

const ManageOid = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [oidList, setOidList] = useState([]);

  // Form state pour l'ajout ou la mise à jour d'un OID
  const [OID, setOID] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('energie'); // Valeur par défaut
  const [unit, setUnit] = useState('volt'); // Valeur par défaut
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOidId, setCurrentOidId] = useState(null);

  // Options disponibles
  const unitOptions = ['volt', 'ampere', 'watt', 'c', 'kmh'];
  const typeOptions = ['energie', 'fluid', 'temperature'];

  // Etat pour les filtres
  const [filterOid, setFilterOid] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  // Etat pour le tri
  const [sortConfig, setSortConfig] = useState({ key: 'OID', direction: 'asc' });

  // Modal de confirmation pour la suppression
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [oidToDelete, setOidToDelete] = useState(null);

  useEffect(() => {
    const fetchOidList = async () => {
      try {
        const response = await fetch('/api/getoids'); // Endpoint pour récupérer les OID existants
        const data = await response.json();

        if (response.ok) {
          setOidList(data);
        } else {
          throw new Error(data.detail || 'Erreur inconnue');
        }
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    fetchOidList();
  }, []);

  const resetForm = () => {
    setOID('');
    setDescription('');
    setType('energie');
    setUnit('volt');
    setIsEditing(false);
    setCurrentOidId(null);
  };

  const validateForm = () => {
    if (!OID || !description || !type || !unit) {
      setErrorMessage('Tous les champs doivent être remplis.');
      return false;
    }

    if (oidList.some((oid) => oid.OID === OID && oid.id !== currentOidId)) {
      setErrorMessage('Un OID avec cette valeur existe déjà.');
      return false;
    }

    return true;
  };

  const resetAlerts = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleAddOid = async () => {
    if (!validateForm()) return;

    setLoading(true);
    resetAlerts();  // Réinitialiser les alertes
    try {
      const bodyData = { OID, description, type, unit };
      const response = await fetch('/api/addoid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('OID ajouté avec succès.');
        setOidList([...oidList, { id: data.id, ...bodyData }]);
        setOpenModal(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Erreur lors de l\'ajout de l\'OID.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOid = async () => {
    if (!validateForm()) return;

    setLoading(true);
    resetAlerts();  // Réinitialiser les alertes
    try {
      const bodyData = { OID, description, type, unit };
      const response = await fetch(`/api/updateoid/${currentOidId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('OID mis à jour avec succès.');
        setOidList(oidList.map((oid) => (oid.id === currentOidId ? { ...oid, ...bodyData } : oid)));
        setOpenModal(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Erreur lors de la mise à jour de l\'OID.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOid = (oidToDelete) => {
    setOidToDelete(oidToDelete);
    setOpenDeleteModal(true);  // Ouvre la modal de confirmation
  };

  const confirmDelete = async () => {
    setLoading(true);
    resetAlerts();  // Réinitialiser les alertes
    try {
      const response = await fetch('/api/deleteoid', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OID: oidToDelete }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('OID supprimé avec succès.');
        setOidList(oidList.filter((oid) => oid.OID !== oidToDelete));
        setOpenDeleteModal(false);
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression de l\'OID.');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOid = (oid) => {
    setIsEditing(true);
    setOID(oid.OID);
    setDescription(oid.description);
    setType(oid.type);
    setUnit(oid.unit);
    setCurrentOidId(oid.id);
    setOpenModal(true);
  };

  // Filtrer les données
  const filteredOidList = oidList.filter((oid) => {
    return (
      (filterOid ? oid.OID.toLowerCase().includes(filterOid.toLowerCase()) : true) &&
      (filterDescription ? oid.description.toLowerCase().includes(filterDescription.toLowerCase()) : true) &&
      (filterType ? oid.type.toLowerCase().includes(filterType.toLowerCase()) : true) &&
      (filterUnit ? oid.unit.toLowerCase().includes(filterUnit.toLowerCase()) : true)
    );
  });

  // Trier les données
  const sortedOidList = filteredOidList.sort((a, b) => {
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

  return (
    <PageContainer title="Configuration" description="Ajouter une mesure">
      <Breadcrumb title="Configuration" subtitle="Ajouter une mesure" />

      <Stack mt={3}>
        {/* Show alert above the modal */}
        {errorMessage && (
          <Alert variant="filled" severity="error">
            <AlertTitle>Erreur</AlertTitle>
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert variant="filled" severity="success">
            <AlertTitle>Succès</AlertTitle>
            {successMessage}
          </Alert>
        )}
      </Stack>

      <ParentCard title="Gérer les OIDs" content={false}>
        <Stack direction="row" justifyContent="space-between" spacing={2} mb={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setOpenModal(true)}
          >
            Ajouter un OID
          </Button>
        </Stack>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => requestSort('OID')}>
                  OID
                  {sortConfig.key === 'OID' && (sortConfig.direction === 'asc' ? <ArrowDownward /> : <ArrowUpward />)}
                </TableCell>
                <TableCell onClick={() => requestSort('description')}>
                  Description
                  {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? <ArrowDownward /> : <ArrowUpward />)}
                </TableCell>
                <TableCell onClick={() => requestSort('type')}>
                  Type
                  {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? <ArrowDownward /> : <ArrowUpward />)}
                </TableCell>
                <TableCell onClick={() => requestSort('unit')}>
                  Unité
                  {sortConfig.key === 'unit' && (sortConfig.direction === 'asc' ? <ArrowDownward /> : <ArrowUpward />)}
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    label="Filtrer par OID"
                    value={filterOid}
                    onChange={(e) => setFilterOid(e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    label="Filtrer par Description"
                    value={filterDescription}
                    onChange={(e) => setFilterDescription(e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    label="Filtrer par Type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    label="Filtrer par Unité"
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                  />
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOidList.map((oid) => (
                <TableRow key={oid.id}>
                  <TableCell>{oid.OID}</TableCell>
                  <TableCell>{oid.description}</TableCell>
                  <TableCell>{oid.type}</TableCell>
                  <TableCell>{oid.unit}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditOid(oid)}>
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteOid(oid.OID)}
                      color="error"
                    >
                      <Close />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ParentCard>

      {/* Modal pour ajouter/éditer un OID */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>{isEditing ? 'Modifier un OID' : 'Ajouter un OID'}</DialogTitle>
        <DialogContent>
          <CustomFormLabel>OID</CustomFormLabel>
          <CustomTextField
            fullWidth
            value={OID}
            onChange={(e) => setOID(e.target.value)}
            disabled={isEditing}
          />
          <CustomFormLabel>Description</CustomFormLabel>
          <CustomTextField
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <CustomFormLabel>Type</CustomFormLabel>
          <Autocomplete
            options={typeOptions}
            value={type}
            onChange={(e, newValue) => setType(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
          <CustomFormLabel>Unité</CustomFormLabel>
          <Autocomplete
            options={unitOptions}
            value={unit}
            onChange={(e, newValue) => setUnit(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">
            Annuler
          </Button>
          <Button
            onClick={isEditing ? handleUpdateOid : handleAddOid}
            color="primary"
            disabled={loading}
          >
            {loading ? 'En cours...' : isEditing ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmation pour suppression */}
      <Dialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
      >
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          Êtes-vous sûr de vouloir supprimer cet OID ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteModal(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={confirmDelete} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ManageOid;

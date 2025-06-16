import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  IconButton,
  Tooltip,
  InputAdornment,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { 
  Refresh, 
  Search,
  Clear
} from "@mui/icons-material";

const API_BASE_URL = "http://localhost:8000";

const AIModelsManagement = () => {
  // State variables
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [typeFilter, setTypeFilter] = useState("");
  const [modelTypeOptions, setModelTypeOptions] = useState([]);

  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Extract unique model types for filtering
  useEffect(() => {
    if (models.length > 0) {
      const types = [...new Set(models.map(model => model.type))];
      setModelTypeOptions(types);
    }
  }, [models]);

  // Fetch models from API
  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/models/`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      showNotification("Failed to load models. Check if the server is running.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle model activation status
  const toggleModelActive = async (modelId, currentStatus) => {
    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Update local state
      setModels(models.map(model => 
        model.id_modele === modelId 
          ? { ...model, is_active: !currentStatus } 
          : model
      ));

      showNotification(
        `Model ${!currentStatus ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (error) {
      console.error("Failed to update model status:", error);
      showNotification("Failed to update model status", "error");
    }
  };

  // Filter models based on search term and type filter
  const filteredModels = models.filter(model => {
    const matchesSearch = 
      (model.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || '') &&
      (model.type?.toLowerCase().includes(searchTerm.toLowerCase()) || '') &&
      (model.version?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    
    const matchesType = typeFilter === "" || model.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Show notification
  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
  };

  return (
    <Box sx={{ width: '100%', padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            AI Models Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Refresh />} 
            onClick={fetchModels}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Stats summary */}
        {!loading && models.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Chip 
              label={`Total: ${models.length} ${models.length === 1 ? 'model' : 'models'}`} 
              variant="outlined" 
            />
            <Chip 
              label={`Active: ${models.filter(m => m.is_active).length} ${models.filter(m => m.is_active).length === 1 ? 'model' : 'models'}`}
              color="success"
              variant="outlined"
            />
            <Chip 
              label={`Inactive: ${models.filter(m => !m.is_active).length} ${models.filter(m => !m.is_active).length === 1 ? 'model' : 'models'}`}
              color="default"
              variant="outlined"
            />
          </Box>
        )}

        {/* Filters and Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search Models"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Filter by Type"
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              {modelTypeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(searchTerm || typeFilter) && (
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        {/* Models Table */}
        <TableContainer component={Paper} elevation={1}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Training Date</TableCell>
                <TableCell>Precision</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading models...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2">
                      No models found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => (
                  <TableRow key={model.id_modele}>
                    <TableCell>{model.nom}</TableCell>
                    <TableCell>
                      <Chip 
                        label={model.type} 
                        color={
                          model.type === "Visage" ? "primary" :
                          model.type === "Personne" ? "secondary" :
                          model.type === "Anomalie" ? "warning" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{model.version}</TableCell>
                    <TableCell>{model.date_entrainement ? new Date(model.date_entrainement).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell>
                      {model.precision ? `${parseFloat(model.precision).toFixed(2)}%` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={model.is_active ? "Active" : "Inactive"}
                        color={model.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={model.is_active ? "Deactivate Model" : "Activate Model"}>
                        <Switch
                          checked={model.is_active}
                          onChange={() => toggleModelActive(model.id_modele, model.is_active)}
                          color="primary"
                        />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={5000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AIModelsManagement;
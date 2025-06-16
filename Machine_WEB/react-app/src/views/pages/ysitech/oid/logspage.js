import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Modal,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
  TextField,
  Popover,
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
 
const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    person: false,
    face: false,
    object: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Variables pour le calendrier
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const [selectionStep, setSelectionStep] = useState(0); // 0: pas de sélection, 1: début sélectionné, 2: fin sélectionnée
  
  const isCalendarOpen = Boolean(calendarAnchorEl);
 
  useEffect(() => {
    fetchLogs();
  }, []);
 
  useEffect(() => {
    applyFilters();
  }, [logs, filters, searchTerm, sortAsc, startDate, endDate]);
 
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/logs");
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Erreur récupération logs :", error);
    } finally {
      setLoading(false);
    }
  };
 
  const applyFilters = () => {
    const activeFilters = Object.entries(filters)
      .filter(([_, value]) => value)
      .map(([key]) => key);
 
    let filtered = [...logs];
 
    if (activeFilters.length > 0) {
      filtered = filtered.filter((log) =>
        activeFilters.every((filter) => log.detections.includes(filter))
      );
    }
 
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((log) =>
        log.detections.some((det) =>
          det.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
 
    // Filtrage par date
    if (startDate && endDate) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return isWithinInterval(logDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate)
        });
      });
    } else if (startDate) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return isWithinInterval(logDate, {
          start: startOfDay(startDate),
          end: endOfDay(startDate)
        });
      });
    }
 
    setFilteredLogs(sortLogs(filtered));
  };
 
  const sortLogs = (list) => {
    return [...list].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
  };
 
  const handleFilterChange = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
 
  const resetFilters = () => {
    setFilters({
      person: false,
      face: false,
      object: false,
    });
    setSearchTerm("");
    setStartDate(null);
    setEndDate(null);
    setSelectionStep(0);
  };
 
  const handleImageClick = (base64Image) => {
    setSelectedImage(`data:image/jpeg;base64,${base64Image}`);
    setModalOpen(true);
  };
 
  const countByClass = {
    person: logs.filter((log) => log.detections.includes("person")).length,
    face: logs.filter((log) => log.detections.includes("face")).length,
    object: logs.filter(
      (log) => log.detections.some((d) => d !== "person" && d !== "face")
    ).length,
  };
 
  // Fonctions pour le calendrier
  const handleCalendarOpen = (event) => {
    setCalendarAnchorEl(event.currentTarget);
    // Initialiser les dates temporaires avec les valeurs actuelles
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setSelectionStep(startDate ? 1 : 0);
  };
 
  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
    // Réinitialiser les valeurs temporaires si on ferme sans appliquer
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectionStep(0);
  };
 
  const handleDateClick = (date) => {
    if (selectionStep === 0) {
      // Première date sélectionnée
      setTempStartDate(date);
      setTempEndDate(null);
      setSelectionStep(1);
    } else if (selectionStep === 1) {
      // Deuxième date sélectionnée
      if (date < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(date);
      } else {
        setTempEndDate(date);
      }
      setSelectionStep(2);
    }
  };
 
  const handleCalendarReset = (e) => {
    e.stopPropagation();
    setTempStartDate(null);
    setTempEndDate(null);
    setSelectionStep(0);
  };
 
  const handleApplyDates = () => {
    // Appliquer les dates temporaires aux dates réelles utilisées pour le filtrage
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    handleCalendarClose();
  };
 
  const formatDateRangeText = () => {
    if (!startDate && !endDate) return "Sélectionner des dates";
    if (startDate && !endDate) return `${format(startDate, "dd/MM/yyyy")}`;
    return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
  };
 
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        📜 Historique des Logs
      </Typography>
 
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Typography variant="body2">Total logs : {logs.length}</Typography>
        <Typography variant="body2">Logs affichés : {filteredLogs.length}</Typography>
        <Typography variant="body2">👤 Personne : {countByClass.person}</Typography>
        <Typography variant="body2">🧠 Visage : {countByClass.face}</Typography>
        <Typography variant="body2">📦 Objet : {countByClass.object}</Typography>
        
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSortAsc((prev) => !prev)}
        >
          Trier : {sortAsc ? "⬆ Ancien → Récent" : "⬇ Récent → Ancien"}
        </Button>
 
        {/* Sélecteur de date */}
        <Button
          variant="outlined"
          onClick={handleCalendarOpen}
          startIcon={<CalendarMonthIcon />}
          sx={{ minWidth: 220 }}
        >
          {formatDateRangeText()}
        </Button>
        <Popover
          open={isCalendarOpen}
          anchorEl={calendarAnchorEl}
          onClose={handleCalendarClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">
                {selectionStep === 0 ? "Sélectionnez une date" :
                 selectionStep === 1 ? "Sélectionnez une date de fin (optionnel)" :
                 "Période sélectionnée"}
              </Typography>
              <Button size="small" onClick={handleCalendarReset}>
                Réinitialiser
              </Button>
            </Box>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectionStep === 0 ? null : tempStartDate}
                onChange={handleDateClick}
                showDaysOutsideCurrentMonth
              />
            </LocalizationProvider>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="body2">
                {tempStartDate && !tempEndDate && `Date sélectionnée: ${format(tempStartDate, "dd/MM/yyyy")}`}
                {tempStartDate && tempEndDate && `Période: ${format(tempStartDate, "dd/MM/yyyy")} - ${format(tempEndDate, "dd/MM/yyyy")}`}
              </Typography>
              <Button
                variant="contained"
                onClick={handleApplyDates}
                disabled={!tempStartDate}
              >
                Appliquer
              </Button>
            </Box>
          </Box>
        </Popover>
      </Stack>
 
      <FormGroup row sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.person}
              onChange={() => handleFilterChange("person")}
            />
          }
          label="Personne"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.face}
              onChange={() => handleFilterChange("face")}
            />
          }
          label="Visage"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.object}
              onChange={() => handleFilterChange("object")}
            />
          }
          label="Objet"
        />
        <Button onClick={resetFilters} sx={{ ml: 2 }} variant="outlined">
          Réinitialiser
        </Button>
      </FormGroup>
 
      <TextField
        fullWidth
        label="🔍 Rechercher une détection (ex : dog, bottle, person...)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />
 
      {loading && <CircularProgress />}
 
      {!loading && filteredLogs.length === 0 && (
        <Typography>Aucun log ne correspond aux critères.</Typography>
      )}
 
      {!loading &&
        filteredLogs.map((log, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2">
                📅 <strong>{log.timestamp}</strong> — Détections : [{log.detections.join(" | ")}]
              </Typography>
              <Box
                component="img"
                src={`data:image/jpeg;base64,${log.image_base64}`}
                alt="Miniature"
                onClick={() => handleImageClick(log.image_base64)}
                sx={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
                    border: "1px solid #1976d2"
                  }
                }}
              />
            </Box>
          </Paper>
        ))}
 
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            p: 4,
            backgroundColor: "white",
            margin: "auto",
            mt: 10,
            width: "90%",
            maxWidth: "800px",
            borderRadius: 2,
          }}
        >
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Zoom image"
              width="100%"
              style={{ borderRadius: 8 }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};
 
export default LogsPage;
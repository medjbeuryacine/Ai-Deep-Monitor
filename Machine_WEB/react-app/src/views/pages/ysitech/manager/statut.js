import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Grid, Avatar, Stack, Chip, Box } from "@mui/material";
import { IconServer, IconCpu, IconAlertTriangle } from "@tabler/icons";

const getAlertColor = (level) => {
  switch (level) {
    case "Critique":
      return "#b20500"; // Rouge plus vif
    case "Majeur":
      return "#bd6f00"; // Orange plus clair
    case "Mineur":
      return "#5bc0de"; // Bleu clair
    default:
      return "#1b7100"; // Noir foncé pour équipements normaux
  }
};

const DataCenter = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/datacenter");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données");
        }
        const result = await response.json();

        const structuredData = {};
        result.forEach((row) => {
          if (!structuredData[row.id_cube]) {
            structuredData[row.id_cube] = {
              id_cube: row.id_cube,
              cube: row.cube,
              pos_cube: row.pos_cube,
              racks: {},
            };
          }

          if (!structuredData[row.id_cube].racks[row.id_rack]) {
            structuredData[row.id_cube].racks[row.id_rack] = {
              id_rack: row.id_rack,
              rack: row.rack,
              pos_rack: row.pos_rack,
              equipments: [],
            };
          }

          structuredData[row.id_cube].racks[row.id_rack].equipments.push({
            id_equipement: row.id_equipement,
            equipement: row.equipement,
            type_equipement: row.type_equipement,
            type_mesure: row.type_mesure,
            ip_equipement: row.ip_equipement,
            pos_equipement: row.pos_equipement,
            etat_equipement: row.etat_equipement,
            niveau_alerte: row.niveau_alerte || "Aucune alerte",
            derniere_valeur: row.derniere_valeur ?? "-",
          });
        });

        setData(Object.values(structuredData));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Typography align="center">Chargement des données...</Typography>;
  if (error) return <Typography align="center" color="error">Erreur: {error}</Typography>;

  return (
    <Grid container spacing={2} padding={2} justifyContent="center">
      {data.map((cube) => (
        <Grid item xs={12} key={cube.id_cube}>
          <Card sx={{ backgroundColor: "#007bff", color: "white", padding: 2, borderRadius: 2, width: "100%", boxShadow: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ bgcolor: "white", width: 40, height: 40 }}>
                  <IconServer size={22} color="#007bff" />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">{cube.cube} ({cube.pos_cube})</Typography>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>📍 {cube.pos_cube}</Typography>
              <Grid container spacing={2} mt={1} justifyContent="center">
                {Object.values(cube.racks).map((rack) => (
                  <Grid item xs={12} key={rack.id_rack}>
                    <Card sx={{ padding: 1.5, borderRadius: 2, backgroundColor: "#282828", color: "white", width: "100%", boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: "#ffffff" }}>🗄 {rack.rack} ({rack.pos_rack})</Typography>
                        <Grid container spacing={1} mt={1} justifyContent="center">
                          {rack.equipments.map((equip) => (
                            <Grid item xs={6} sm={2} key={equip.id_equipement}>
                              <Card sx={{ padding: 1, borderRadius: 1, textAlign: "center", backgroundColor: getAlertColor(equip.niveau_alerte), color: "white", width: "100%", boxShadow: 2 }}>
                                <CardContent sx={{ padding: 1 }}>
                                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                    <IconCpu size={20} />
                                    <Typography variant="body1" fontWeight="bold" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{equip.equipement}</Typography>
                                  </Stack>
                                  <Typography variant="body2">{equip.type_mesure}</Typography>
                                  <Chip label={equip.derniere_valeur} size="medium" sx={{ mt: 0.5, backgroundColor: "white", color: "black" }} />
                                  {equip.niveau_alerte !== "Aucune alerte" && (
                                    <Box mt={0.5} display="flex" alignItems="center" justifyContent="center">
                                      <IconAlertTriangle size={16} color="red" />
                                      <Typography variant="body2" ml={0.5}>{equip.niveau_alerte}</Typography>
                                    </Box>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default DataCenter;

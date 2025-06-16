import React, { useEffect, useRef, useState } from "react";
import {
  Box, Typography, Button, Stack, ToggleButton, ToggleButtonGroup
} from "@mui/material";

export default function TracageZone() {
  const canvasRef = useRef(null);
  const [frameData, setFrameData] = useState("");
  const [imgSize, setImgSize] = useState({ width: 1280, height: 720 });
  const [points, setPoints] = useState([]);
  const [camera, setCamera] = useState("entree"); // Choix de la caméra

  const fetchLiveFrame = async () => {
    try {
      const res = await fetch(`/api/capture-frame?camera=${camera}`);
      const data = await res.json();

      if (!data.frame_data) throw new Error("Aucune frame reçue");

      setFrameData(data.frame_data);
      setPoints([]); // On réinitialise les points à chaque nouvelle image
    } catch (err) {
      console.error("Erreur de récupération de frame :", err);
      alert("⚠️ Impossible de récupérer une image depuis l'API.");
    }
  };

  useEffect(() => {
    fetchLiveFrame();
  }, [camera]); // Recharge la frame si la caméra change

  useEffect(() => {
    if (!frameData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setImgSize({ width: img.width, height: img.height });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      drawPolygon(ctx);
    };
    img.src = `data:image/jpeg;base64,${frameData}`;
  }, [frameData, points]);

  const drawPolygon = (ctx) => {
    if (!points.length) return;

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.stroke();

    for (let [x, y] of points) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#00ffff";
      ctx.fill();
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setPoints((prev) => [...prev, [x, y]]);
  };

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    setPoints([]);
  };

  const handleSave = async () => {
    try {
      const videoName = camera === "entree" ? "camera_entree_lumi_normal.mp4" : "camera_sortie_lumi_normal.mp4";
      const formData = new URLSearchParams();
      formData.append("video_name", videoName);
      formData.append("points", JSON.stringify(points));

      const res = await fetch("/api/sauver-zone", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const result = await res.json();
      if (result.status === "ok") alert("✅ Zone sauvegardée !");
      else alert("❌ Erreur : " + result.error);
    } catch (err) {
      alert("Erreur lors de la sauvegarde !");
    }
  };

  const handleCameraChange = (event, newCamera) => {
    if (newCamera !== null) {
      setCamera(newCamera);
    }
  };

  return (
    <Box sx={{ px: 2, py: 3 }}>
      <Typography variant="h5" color="white" mb={2}>
        🎥 Traçage de zone sur : {camera === "entree" ? "Caméra d'entrée" : "Caméra de sortie"}
      </Typography>

      <ToggleButtonGroup
        value={camera}
        exclusive
        onChange={handleCameraChange}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="entree">Caméra Entrée</ToggleButton>
        <ToggleButton value="sortie">Caméra Sortie</ToggleButton>
      </ToggleButtonGroup>

      <Box
        sx={{
          border: "2px solid white",
          display: "inline-block",
          backgroundColor: "black",
          maxWidth: "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ width: imgSize.width, height: imgSize.height }}
        />
      </Box>

      <Stack direction="row" spacing={2} mt={2}>
        <Button variant="outlined" color="error" onClick={handleUndo}>
          ⤺ Annuler
        </Button>
        <Button variant="outlined" color="warning" onClick={handleReset}>
          🔄 Réinitialiser
        </Button>
        <Button variant="contained" color="success" onClick={handleSave}>
          💾 Sauvegarder
        </Button>
        <Button variant="outlined" onClick={fetchLiveFrame}>
          🔄 Recharger une frame
        </Button>
      </Stack>
    </Box>
  );
}

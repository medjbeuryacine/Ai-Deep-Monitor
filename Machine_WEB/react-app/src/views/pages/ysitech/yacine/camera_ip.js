import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Box, Tabs, Tab, TextField, Button, Select, MenuItem, FormControl, InputLabel, 
  List, ListItem, ListItemText, Typography, Paper, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import Hls from 'hls.js';

const CameraViewer = () => {
  // State for tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // Camera connection states
  const [rtspUrl, setRtspUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cameraName, setCameraName] = useState('');
  const [processId, setProcessId] = useState(null);
  const [streamStatus, setStreamStatus] = useState('idle');
  
  // Recordings state
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [currentCameraRecordings, setCurrentCameraRecordings] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Video player refs
  const liveVideoRef = useRef(null);
  const recordingVideoRef = useRef(null);
  const hlsLiveRef = useRef(null);
  const hlsRecordingRef = useRef(null);
  
  // Save state to localStorage
  const saveCameraState = () => {
    const state = {
      rtspUrl,
      username,
      password, // Ajouter le mot de passe
      cameraName,
      processId,
      streamStatus,
      activeTab
    };
    localStorage.setItem('cameraPersistentState', JSON.stringify(state));
  };
  
  // Charge l'état sauvegardé
  const loadCameraState = () => {
    const savedState = localStorage.getItem('cameraPersistentState');
    return savedState ? JSON.parse(savedState) : null;
  };
  
  // Load state from localStorage
  const loadStateFromLocalStorage = () => {
    const savedState = localStorage.getItem('cameraPersistentState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    return null;
  };

  // Fetch all camera playlists
  const fetchCameraPlaylists = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/camera-playlists');
      setRecordings(response.data.playlists);
      
      // Update current camera recordings if a camera name is set
      if (cameraName) {
        const cameraRecordings = response.data.playlists.filter(
          rec => rec.camera_name === cameraName
        );
        setCurrentCameraRecordings(cameraRecordings);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch camera recordings');
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start camera stream
  const startCameraStream = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/start-camera', null, {
        params: {
          rtsp_url: rtspUrl,
          username,
          password,
          camera_name: cameraName
        }
      });
      
      setProcessId(response.data.process_id);
      setStreamStatus('streaming');
      saveCameraState();
      
      // Initialize HLS player for live stream
      const hlsPlaylistUrl = `/api/hls/Camera_IP/${cameraName}/playlist.m3u8`;
      
      setTimeout(() => {
        initHlsPlayer(liveVideoRef, hlsLiveRef, hlsPlaylistUrl);
      }, 3000); // Allow some time for the stream to start
      
      // After starting the stream, fetch recordings for this camera
      fetchCameraRecordings(cameraName);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start camera stream');
      setStreamStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recordings for specific camera
  const fetchCameraRecordings = async (camera) => {
    try {
      const response = await axios.get('/api/camera-playlists');
      const allRecordings = response.data.playlists;
      
      // Filter recordings for this specific camera
      const cameraRecordings = allRecordings.filter(rec => rec.camera_name === camera);
      setCurrentCameraRecordings(cameraRecordings);
      
      // If we have recordings for this camera, auto-select the most recent one
      if (cameraRecordings.length > 0) {
        // Sort by last_modified (newest first)
        const sortedRecordings = [...cameraRecordings].sort((a, b) => 
          b.last_modified - a.last_modified
        );
        setSelectedRecording(sortedRecordings[0]);
      }
    } catch (err) {
      console.error('Error fetching camera specific recordings:', err);
    }
  };

  // Stop camera stream
  const stopCameraStream = async () => {
    try {
      setLoading(true);
      
      await axios.get('/api/stop-camera', {
        params: { process_id: processId }
      });
      
      // Réinitialise seulement l'état de connexion
      setStreamStatus('idle');
      setProcessId(null);
      // Supprimer cette ligne: setPassword('');
      destroyHlsPlayer(hlsLiveRef);
      setError(null);
      
      // Sauvegarde l'état (conserve les infos caméra)
      saveCameraState();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to stop camera stream');
    } finally {
      setLoading(false);
    }
  };

  // Initialize HLS.js player
  const initHlsPlayer = (videoRef, hlsRef, streamUrl) => {
    console.log("Initializing HLS player with URL:", streamUrl);
    
    if (!videoRef.current) {
      console.log("Video element not ready, retrying in 300ms");
      setTimeout(() => initHlsPlayer(videoRef, hlsRef, streamUrl), 300);
      return;
    }
    
    console.log("Video element ready, setting up HLS");
    
    if (hlsRef.current) {
      console.log("Destroying existing HLS instance");
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    if (Hls.isSupported()) {
      console.log("HLS is supported, creating new instance");
      const hls = new Hls({
        maxBufferLength: 15, // Augmenté pour permettre un plus grand buffer
        maxMaxBufferLength: 30,
        liveSyncDurationCount: 5, // Augmenté pour avoir plus de segments en buffer
        liveMaxLatencyDurationCount: 10, // Nouveau paramètre pour contrôler la latence maximale
        liveBackBufferLength: 10, // Nouveau paramètre pour garder plus de segments en mémoire
        enableWorker: true,
        debug: false,
        lowLatencyMode: false, // Désactivé pour permettre plus de buffering
        startLevel: -1, // Commence au niveau de qualité le plus bas disponible
        startPosition: -10, // Commence 10 secondes avant la fin (pour le live)
        maxLatencyDuration: 10, // Maximum 10 secondes de latence
        maxLiveSyncPlaybackRate: 1.1 // Taux de lecture légèrement accéléré pour rattraper le retard
      });
      
      hlsRef.current = hls;
      
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("HLS media attached successfully");
        hls.loadSource(streamUrl);
      });
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed, starting playback");
        videoRef.current.controls = true;
        const playPromise = videoRef.current.play();
        if (playPromise) {
          playPromise.catch(e => console.log('Auto-play prevented:', e));
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.log("HLS error:", data.type, data.details);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error encountered, trying to recover');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error encountered, trying to recover');
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable error encountered, destroying player');
              destroyHlsPlayer(hlsRef);
              break;
          }
        }
      });
      
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      console.log("Using native HLS support for Safari");
      videoRef.current.src = streamUrl;
      videoRef.current.controls = true;
      videoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
    }
  };

  // Destroy HLS.js player
  const destroyHlsPlayer = (hlsRef) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  // Load a recorded video
  const loadRecording = (recording) => {
    setSelectedRecording(recording);
    
    // Only load recordings in the Recordings tab
    if (activeTab === 1) {
      destroyHlsPlayer(hlsRecordingRef);
      
      // Ensure the URL contains /api/ before hls
      const playlistUrl = recording.playlist_url.startsWith('/api/') 
        ? recording.playlist_url 
        : `/api${recording.playlist_url}`;
        
      initHlsPlayer(recordingVideoRef, hlsRecordingRef, playlistUrl);
    }
  };

  // Toggle between live stream and recording in Live tab
  const toggleLiveOrRecording = (isLive) => {
    destroyHlsPlayer(hlsLiveRef);
    
    if (isLive && streamStatus === 'streaming') {
      // Switch to live stream
      const hlsPlaylistUrl = `/api/hls/Camera_IP/${cameraName}/playlist.m3u8`;
      initHlsPlayer(liveVideoRef, hlsLiveRef, hlsPlaylistUrl);
    }
    // Supprimer la partie qui permet de basculer vers un enregistrement dans l'onglet Live
  };

  // Effect to fetch recordings when tab changes
  useEffect(() => {
    // Sauvegarde sélection d'enregistrement
    if (selectedRecording) {
      const stateToSave = {
        selectedRecordingUrl: selectedRecording.playlist_url,
        selectedRecordingCamera: selectedRecording.camera_name
      };
      localStorage.setItem('selectedRecordingState', JSON.stringify(stateToSave));
    }
    
    // Restauration de la sélection d'enregistrement
    if (!selectedRecording && recordings.length > 0) {
      const savedRecording = localStorage.getItem('selectedRecordingState');
      if (savedRecording) {
        const parsedState = JSON.parse(savedRecording);
        const recording = recordings.find(r => 
          r.playlist_url === parsedState.selectedRecordingUrl || 
          r.camera_name === parsedState.selectedRecordingCamera
        );
        
        if (recording) {
          setSelectedRecording(recording);
          
          setTimeout(() => {
            const playlistUrl = recording.playlist_url.startsWith('/api/') 
              ? recording.playlist_url 
              : `/api${recording.playlist_url}`;
              
            if (activeTab === 1) {
              initHlsPlayer(recordingVideoRef, hlsRecordingRef, playlistUrl);
            }
          }, 1000);
        }
      }
    }
  }, [recordings, selectedRecording]);

  // Effect to save state when important state changes
  useEffect(() => {
  saveCameraState();
}, [rtspUrl, username, cameraName, processId, streamStatus, activeTab]);

  // Effect when camera name changes
  useEffect(() => {
    if (cameraName) {
      // Filter existing recordings for this camera
      const filtered = recordings.filter(rec => rec.camera_name === cameraName);
      setCurrentCameraRecordings(filtered);
    }
  }, [cameraName, recordings]);

  // Effect to load saved state on initial load
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        // 1. Vérifier d'abord les streams actifs côté serveur
        const response = await axios.get('/api/active-streams');
        const activeStreams = response.data.active_streams;
        
        if (activeStreams?.length > 0) {
          // 2. Si stream actif, restaurer depuis le serveur
          const currentStream = activeStreams[0];
          updateCameraState({
            rtspUrl: currentStream.rtsp_url,
            username: currentStream.username,
            cameraName: currentStream.camera_name,
            processId: currentStream.process_id,
            streamStatus: 'streaming'
          });
          
          // 3. Initialiser le lecteur vidéo
          setTimeout(() => {
            initHlsPlayer(
              liveVideoRef,
              hlsLiveRef,
              `/api/hls/Camera_IP/${currentStream.camera_name}/playlist.m3u8`
            );
          }, 1000);
        } else {
          // 4. Sinon, charger depuis localStorage
          const savedState = loadCameraState();
          if (savedState) {
            updateCameraState(savedState);
          }
        }
        
        // 5. Charger les enregistrements
        await fetchCameraPlaylists();
        
      } catch (err) {
        console.error("Initialization error:", err);
        // Fallback: charger depuis localStorage en cas d'erreur
        const savedState = loadCameraState();
        if (savedState) {
          updateCameraState(savedState);
        }
      }
    };
  
    // Fonction helper pour mettre à jour l'état
    const updateCameraState = (state) => {
      if (state.rtspUrl) setRtspUrl(state.rtspUrl);
      if (state.username) setUsername(state.username);
      if (state.password) setPassword(state.password); // Restaurer le mot de passe
      if (state.cameraName) setCameraName(state.cameraName);
      if (state.processId) setProcessId(state.processId);
      if (state.streamStatus) setStreamStatus(state.streamStatus);
      if (state.activeTab !== undefined) setActiveTab(state.activeTab);
    };
  
    initializeCamera();
  
    return () => {
      destroyHlsPlayer(hlsLiveRef);
      destroyHlsPlayer(hlsRecordingRef);
    };
  }, []);
  
  // Effect to restore selected recording if any
  useEffect(() => {
    const savedState = loadStateFromLocalStorage();
    if (savedState && savedState.selectedRecording && recordings.length > 0) {
      const recording = recordings.find(r => r.camera_name === savedState.selectedRecording);
      if (recording) {
        setSelectedRecording(recording);
        
        // Toujours initialiser le lecteur pour l'onglet recordings, qu'on soit dans cet onglet ou non
        setTimeout(() => {
          // Ensure the URL contains /api/ before hls
          const playlistUrl = recording.playlist_url.startsWith('/api/') 
            ? recording.playlist_url 
            : `/api${recording.playlist_url}`;
            
          if (activeTab === 1) {
            initHlsPlayer(recordingVideoRef, hlsRecordingRef, playlistUrl);
          }
        }, 1000);
      }
    }
  }, [recordings]);


  // Problème 3: Ajoutez un effet pour initialiser le lecteur vidéo quand on sélectionne un enregistrement
// Ajoutez cette nouvelle fonction d'effet à la fin de tous les useEffect:

// Effect to initialize player when activeTab changes to Recordings
  useEffect(() => {
    if (activeTab === 1 && selectedRecording) {
      // Reset and initialize the recordings player
      destroyHlsPlayer(hlsRecordingRef);
      
      setTimeout(() => {
        const playlistUrl = selectedRecording.playlist_url.startsWith('/api/') 
          ? selectedRecording.playlist_url 
          : `/api${selectedRecording.playlist_url}`;
          
        initHlsPlayer(recordingVideoRef, hlsRecordingRef, playlistUrl);
      }, 300);
    }
  }, [activeTab, selectedRecording]);


  // 3. Ajoutez un nouvel effet pour s'assurer que le bon lecteur vidéo est activé quand on change d'onglet
  // Ajoutez cet effet à la fin des useEffect existants:
  useEffect(() => {
    // Si on est dans l'onglet Live et qu'un stream est actif, s'assurer que le lecteur est initialisé
    if (activeTab === 0 && streamStatus === 'streaming' && cameraName) {
      console.log("Tab switched to Live with active stream, initializing player");
      // Un petit délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        destroyHlsPlayer(hlsLiveRef);
        initHlsPlayer(
          liveVideoRef, 
          hlsLiveRef,
          `/api/hls/Camera_IP/${cameraName}/playlist.m3u8`
        );
      }, 300);
    }
  }, [activeTab, streamStatus]);

  // // Reset password on component mount to ensure it's not persisted
  // useEffect(() => {
  //   setPassword('');
  // }, []);

  // Schedule periodic refresh of recordings (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCameraPlaylists();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
        Camera Surveillance System
      </Typography>
      
      <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ 
            backgroundColor: 'primary.light',
            '& .MuiTab-root': { py: 2 }
          }}
        >
          <Tab label="Live Camera" sx={{ fontWeight: 'bold' }} />
          <Tab label="Recordings" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Paper>
      
      {activeTab === 0 ? (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                  Camera Connection
                </Typography>
                
                <Box component="form" sx={{ mb: 3 }}>
                  <TextField
                    label="RTSP URL"
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    placeholder="rtsp://camera-ip:port/stream"
                  />
                  
                  <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                  />
                  
                  <TextField
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    type="password"
                  />
                  
                  <TextField
                    label="Camera Name"
                    value={cameraName}
                    onChange={(e) => setCameraName(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    placeholder="front_door"
                    helperText="Used for identifying this camera in recordings"
                  />
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={startCameraStream}
                      disabled={loading || !rtspUrl || !username || !password || !cameraName || streamStatus === 'streaming'}
                      sx={{ flex: 1 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Connect Camera'}
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="error"
                      onClick={stopCameraStream}
                      disabled={loading || streamStatus !== 'streaming'}
                      sx={{ flex: 1 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Disconnect'}
                    </Button>
                  </Box>
                </Box>
                
                <Card 
                  sx={{ 
                    mt: 2,
                    bgcolor: streamStatus === 'streaming' ? 'success.light' :
                           streamStatus === 'error' ? 'error.light' : 'grey.100',
                    borderLeft: 5,
                    borderColor: streamStatus === 'streaming' ? 'success.main' :
                               streamStatus === 'error' ? 'error.main' : 'grey.500'
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Status: 
                      <Box component="span" sx={{ ml: 1, color: 
                        streamStatus === 'streaming' ? 'success.dark' :
                        streamStatus === 'error' ? 'error.dark' : 'text.secondary'
                      }}>
                        {streamStatus.toUpperCase()}
                      </Box>
                    </Typography>
                    
                    {processId && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Process ID: {processId}
                      </Typography>
                    )}
                    
                    {error && (
                      <Typography color="error" sx={{ mt: 1, fontSize: '0.9rem' }}>
                        {error}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
                
                {/* Camera Recordings Section in Live Tab */}
                {cameraName && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                      Camera Recordings
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchCameraPlaylists}
                      >
                        Refresh Recordings
                      </Button>
                    </Box>
                    
                    <List sx={{ maxHeight: '200px', overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {currentCameraRecordings.length === 0 ? (
                        <ListItem>
                          <ListItemText primary="No recordings found for this camera" />
                        </ListItem>
                      ) : (
                        currentCameraRecordings.map((recording) => (
                          <ListItem
                            key={recording.playlist_url}
                            button
                            selected={selectedRecording?.playlist_url === recording.playlist_url}
                            onClick={() => loadRecording(recording)}
                            sx={{
                              mb: 0.5,
                              borderRadius: 1,
                              '&.Mui-selected': { bgcolor: 'primary.light' }
                            }}
                          >
                            <ListItemText
                              primary={`Recording ${new Date(recording.last_modified * 1000).toLocaleString()}`}
                              secondary={`${recording.segment_count} segments`}
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                Live View
              </Typography>
                
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  {streamStatus === 'streaming' ? (
                    <video
                      ref={liveVideoRef}
                      controls
                      autoPlay
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Typography color="grey.500">
                      {streamStatus === 'error' ? 'Error connecting to camera' : 'No active camera connection'}
                    </Typography>
                  )}
                </Box>
                
                {streamStatus === 'streaming' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Camera:</strong> {cameraName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>URL:</strong> {rtspUrl}
                    </Typography>
                    <Typography variant="body2">
                      <strong>HLS Playlist:</strong> /api/hls/Camera_IP/{cameraName}/playlist.m3u8
                    </Typography>
                  </Box>
                )}
                
                {/* {selectedRecording && activeTab === 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Playing:</strong> Recording from {new Date(selectedRecording.last_modified * 1000).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Segments:</strong> {selectedRecording.segment_count}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Playlist:</strong> {selectedRecording.playlist_url}
                    </Typography>
                  </Box>
                )} */}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                    Available Recordings
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={fetchCameraPlaylists}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Refresh'}
                  </Button>
                </Box>
                
                {error && (
                  <Typography color="error" sx={{ mb: 2, fontSize: '0.9rem' }}>
                    {error}
                  </Typography>
                )}
                
                <List sx={{ overflow: 'auto', flexGrow: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                  {recordings.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No recordings found" />
                    </ListItem>
                  ) : (
                    recordings.map((recording) => (
                      <ListItem
                        key={recording.camera_name + recording.playlist_url}
                        button
                        selected={selectedRecording?.playlist_url === recording.playlist_url}
                        onClick={() => loadRecording(recording)}
                        sx={{
                          mb: 0.5,
                          borderRadius: 1,
                          '&.Mui-selected': { bgcolor: 'primary.light' }
                        }}
                      >
                        <ListItemText
                          primary={recording.camera_name}
                          secondary={`${recording.segment_count} segments · ${new Date(recording.last_modified * 1000).toLocaleString()}`}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                  {selectedRecording ? `Playback: ${selectedRecording.camera_name}` : 'Select a Recording'}
                </Typography>
                
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  {selectedRecording ? (
                    <video
                      ref={recordingVideoRef}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Typography color="grey.500">
                      Select a recording from the list
                    </Typography>
                  )}
                </Box>
                
                {selectedRecording && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Camera:</strong> {selectedRecording.camera_name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Segments:</strong> {selectedRecording.segment_count}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Last Modified:</strong> {new Date(selectedRecording.last_modified * 1000).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Playlist:</strong> {selectedRecording.playlist_url}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default CameraViewer;
// //////////////////////////////// version finalle Youtube URL  ///////////////////////////////////

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Box, Tabs, Tab, TextField, Button, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText, Typography, Paper, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import Hls from 'hls.js';

const FluxVideo = () => {
  // State for the component
  const [activeTab, setActiveTab] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [username, setUsername] = useState('');
  const [detect, setDetect] = useState('all');
  const [quality, setQuality] = useState('hd');
  const [loop, setLoop] = useState(false);
  const [processId, setProcessId] = useState(null);
  const [streamStatus, setStreamStatus] = useState('idle');
  const [recordedVideos, setRecordedVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  // Nouvel état pour gérer les sous-onglets des vidéos enregistrées
  const [recordedVideoType, setRecordedVideoType] = useState('normal_video');
  
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const saveStateToLocalStorage = () => {
    const state = {
      youtubeUrl,
      username,
      detect,
      quality,
      loop,
      processId,
      streamStatus,
      selectedVideo,
      recordedVideoType,
      videoType: selectedVideo?.content_type || (streamStatus === 'streaming' ? 'live' : 'normal')
    };
    localStorage.setItem('videoStreamState', JSON.stringify(state));
  };
  
  // Récupère l'état depuis localStorage
  const loadStateFromLocalStorage = () => {
    const savedState = localStorage.getItem('videoStreamState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    return null;
  };

  // Fetch recorded videos
  const fetchRecordedVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/playlists`);
      setRecordedVideos(response.data.playlists);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch recorded videos');
    } finally {
      setLoading(false);
    }
  };

  // Start streaming
  const startStream = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/start`, {
        params: {
          youtube_url: youtubeUrl,
          username: username,
          detect: detect,
          quality: quality,
          loop: loop
        }
      });
      
      setProcessId(response.data.process_id);
      setStreamStatus('starting');
      
      // Extraire le type de vidéo de la réponse
      const videoType = response.data.video_type || 'normal';
      
      // Attendre 10 secondes avant d'initialiser le lecteur HLS
      setTimeout(() => {
        setStreamStatus('streaming');
        // Utiliser le bon chemin en fonction du type de vidéo
        initHlsPlayer(`/api/hls/${videoType === 'live' ? 'live_video' : 'normal_video'}/${username}/playlist.m3u8`);
      }, 30000); // 30 secondes
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start streaming');
      setStreamStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Stop streaming
  const stopStream = async () => {
    try {
      setLoading(true);
      
      // Essayez d'abord d'arrêter via l'API normale
      try {
        await axios.get(`/api/stop`, {
          params: { process_id: processId }
        });
      } catch (apiError) {
        console.warn('Normal stop failed, trying force stop:', apiError);
        
        // Fallback: appel direct à l'API GPU si l'arrêt normal échoue
        await axios.get(`${GPU_API_URL}/api/stop`);
      }
      
      setStreamStatus('idle');
      setProcessId(null);
      destroyHlsPlayer();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to stop streaming - try refreshing the page');
      console.error('Stop error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize HLS.js player
  const initHlsPlayer = (streamUrl) => {
    if (!videoRef.current) return;
    
    destroyHlsPlayer(); // Clean up any existing player first
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Don't try to autoplay - let the user click play
        videoRef.current.controls = true;
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error encountered, try to recover');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error encountered, try to recover');
              hls.recoverMediaError();
              break;
            default:
              console.error('Unrecoverable error encountered, destroying player');
              destroyHlsPlayer();
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      videoRef.current.src = streamUrl;
      videoRef.current.controls = true;
    }
  };

  // Destroy HLS.js player
  const destroyHlsPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  // Load a recorded video
  const loadRecordedVideo = (video) => {
    setSelectedVideo(video);
    destroyHlsPlayer();
    initHlsPlayer(`/api/hls/${video.content_type}/${video.name}/playlist.m3u8`);
  };

  // Filtrer les vidéos par type
  const filteredVideos = recordedVideos.filter(video => video.content_type === recordedVideoType);

  useEffect(() => {
    if (activeTab === 1) {
      fetchRecordedVideos();
    }
  }, [activeTab]);

  // Clean up on unmount
  useEffect(() => {
    const savedState = loadStateFromLocalStorage();
    if (savedState) {
      setYoutubeUrl(savedState.youtubeUrl);
      setUsername(savedState.username);
      setDetect(savedState.detect);
      setQuality(savedState.quality);
      setLoop(savedState.loop);
      setProcessId(savedState.processId);
      setStreamStatus(savedState.streamStatus);
      if (savedState.recordedVideoType) {
        setRecordedVideoType(savedState.recordedVideoType);
      }
      
      if (savedState.streamStatus === 'streaming' && savedState.username) {
        const videoType = savedState.videoType || 'normal';
        initHlsPlayer(`/api/hls/${videoType === 'live' ? 'live_video' : 'normal_video'}/${savedState.username}/playlist.m3u8`);
      }
      
      if (savedState.selectedVideo) {
        setSelectedVideo(savedState.selectedVideo);
        initHlsPlayer(`/api/hls/${savedState.selectedVideo.content_type}/${savedState.selectedVideo.name}/playlist.m3u8`);
      }
    }

    fetchRecordedVideos();
    
    return () => {
      destroyHlsPlayer();
      if (processId) {
        stopStream().catch(console.error);
      }
    };
  }, []);

  // Fetch recorded videos when tab changes or component mounts
  useEffect(() => {
    saveStateToLocalStorage();
  }, [youtubeUrl, username, detect, quality, loop, processId, streamStatus, selectedVideo, recordedVideoType]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Video Streaming Dashboard
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Live Stream" />
          <Tab label="Recorded Videos" />
        </Tabs>
      </Paper>
      
      {activeTab === 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            Start New Stream
          </Typography>
          
          <Box component="form" sx={{ mb: 3 }}>
            <TextField
              label="YouTube URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            
            <TextField
              label="Username (for HLS directory)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Detection Type</InputLabel>
              <Select
                value={detect}
                onChange={(e) => setDetect(e.target.value)}
                label="Detection Type"
              >
                <MenuItem value="all">All Objects</MenuItem>
                <MenuItem value="person">Person</MenuItem>
                <MenuItem value="face">Face</MenuItem>
                <MenuItem value="phone">Phone</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Quality</InputLabel>
              <Select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                label="Quality"
              >
                <MenuItem value="hd">HD</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={<Switch checked={loop} onChange={(e) => setLoop(e.target.checked)} />}
              label="Loop Video"
              sx={{ mt: 1 }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={startStream}
                disabled={loading || !youtubeUrl || !username || streamStatus === 'streaming'}
              >
                {loading ? <CircularProgress size={24} /> : 'Start Stream'}
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                onClick={stopStream}
                disabled={loading || streamStatus === 'idle'}
              >
                {loading ? <CircularProgress size={24} /> : 'Stop Stream'}
              </Button>
            </Box>
          </Box>
          
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          <Box sx={{ 
            p: 2, 
            mb: 2, 
            border: '1px solid', 
            borderRadius: 1,
            borderColor: streamStatus === 'streaming' ? 'success.main' : 
                        streamStatus === 'starting' ? 'warning.main' :
                        streamStatus === 'error' ? 'error.main' : 'text.secondary',
            backgroundColor: streamStatus === 'streaming' ? 'success.light' : 
                            streamStatus === 'starting' ? 'warning.light' :
                            streamStatus === 'error' ? 'error.light' : 'background.default'
          }}>
            <Typography variant="subtitle1">
              Status: 
              <Box component="span" sx={{ 
                color: streamStatus === 'streaming' ? 'success.main' : 
                      streamStatus === 'starting' ? 'warning.main' :
                      streamStatus === 'error' ? 'error.main' : 'text.secondary',
                fontWeight: 'bold',
                ml: 1
              }}>
                {streamStatus === 'starting' ? 'CHARGEMENT DES SEGMENTS (30s)' : streamStatus.toUpperCase()}
              </Box>
            </Typography>
            
            {processId && (
              <Typography>Process ID: {processId}</Typography>
            )}
            
            {(streamStatus === 'streaming' || streamStatus === 'starting') && username && (
              <Typography>Stream URL: {`/api/hls/${selectedVideo?.content_type || 'normal_video'}/${username}/playlist.m3u8`}</Typography>
            )}
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Video Stream
          </Typography>
          
          <Box sx={{ mb: 3 }}>
          <video
            ref={videoRef}
            controls
            muted
            style={{ width: '100%', maxHeight: '500px', backgroundColor: '#000' }}
          />
          </Box>
          
          {processId && (
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle1">Stream Information</Typography>
              <Typography>Process ID: {processId}</Typography>
              <Typography>Status: {streamStatus}</Typography>
              <Typography>HLS Playlist: {`/api/hls/${username}/playlist.m3u8`}</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Recorded Videos
          </Typography>
          
          <Button
            variant="outlined"
            onClick={fetchRecordedVideos}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Refresh List'}
          </Button>
          
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* Ajout des onglets pour les types de vidéos */}
          <Paper sx={{ mb: 3 }}>
            <Tabs 
              value={recordedVideoType} 
              onChange={(e, newValue) => {
                setRecordedVideoType(newValue);
                setSelectedVideo(null);
              }}
            >
              <Tab label="Normal Videos" value="normal_video" />
              <Tab label="Live Videos" value="live_video" />
            </Tabs>
          </Paper>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Paper sx={{ width: 300, height: '500px', overflow: 'auto' }}>
              <List>
                {filteredVideos.length === 0 ? (
                  <ListItem>
                    <ListItemText primary={`No ${recordedVideoType === 'live_video' ? 'live' : 'normal'} videos found`} />
                  </ListItem>
                ) : (
                  filteredVideos.map((video) => (
                    <ListItem
                      key={video.name}
                      button
                      selected={selectedVideo?.name === video.name}
                      onClick={() => loadRecordedVideo(video)}
                    >
                      <ListItemText
                        primary={video.name}
                        secondary={`${video.segment_count} segments - ${new Date(video.last_modified * 1000).toLocaleString()}`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedVideo ? selectedVideo.name : `Select a ${recordedVideoType === 'live_video' ? 'live' : 'normal'} video`}
              </Typography>
              
              <video
                ref={videoRef}
                controls
                autoPlay
                muted
                style={{ width: '100%', maxHeight: '500px', backgroundColor: '#000' }}
              />
              
              {selectedVideo && (
                <Box sx={{ mt: 2 }}>
                  <Typography>Type: {selectedVideo.content_type === 'live_video' ? 'Live' : 'Normal'}</Typography>
                  <Typography>Segments: {selectedVideo.segment_count}</Typography>
                  <Typography>Last Modified: {new Date(selectedVideo.last_modified * 1000).toLocaleString()}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FluxVideo;
import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Modal } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import Chart from 'react-apexcharts';
import html2canvas from 'html2canvas';

const ChatBoxWithInput = ({ messages, setMessages, input, setInput, loadingText }) => {
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [modalGraphData, setModalGraphData] = useState(null);

  const handleSendMessage = async (message) => {
    if (message.trim() === '') return;

    setMessages((prevMessages) => [...prevMessages, { text: message, sender: 'user', id: Date.now() }]);
    setLoading(true);

    const loadingMessage = { text: loadingText, sender: 'bot', id: 'loading' };
    setMessages((prevMessages) => [...prevMessages, loadingMessage]);

    try {
      const response = await fetch(
        `http://192.168.1.150/api/execute-function?user_request=${encodeURIComponent(message)}`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de la réponse de l'API");
      }

      const data = await response.json();
      const ollamaResponse = data.ollama_response;
      const executionResult = data.execution_result;
      const botmode = data.botmode;

      let botMessage = '';
      if (executionResult) {
        if (executionResult.graphData) {
          botMessage = `Résultat de l'exécution : `;
        } else {
          if (botmode === 'request') {
            botMessage = `Résultat de l'exécution :\n${executionResult}`;
          }else{
            botMessage = `${executionResult}`;
          }
        }
      } else if (ollamaResponse && ollamaResponse.response_content) {
        botMessage = `Fonction à exécuter : ${ollamaResponse.response_content.fonction_a_retourner}\nContexte : ${ollamaResponse.response_content.contexte}`;
      } else {
        botMessage = "Désolé, une réponse valide n'a pas pu être obtenue.";
      }

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter((msg) => msg.id !== 'loading');
        return [...updatedMessages, { text: botMessage, sender: 'bot', id: Date.now() }];
      });

      if (executionResult && executionResult.graphData) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: 'graph', data: executionResult.graphData, sender: 'bot', id: Date.now() },
        ]);
      }
    } catch (error) {
      console.error('Erreur API:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Désolé, une erreur est survenue. Veuillez réessayer.", sender: 'bot', id: Date.now() },
      ]);
    }

    setLoading(false);
    setInput('');
  };

  const handleOpenModal = (graphData) => {
    setModalGraphData(graphData);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalGraphData(null);
  };

  const handleDownloadGraph = async () => {
    const chartElement = document.getElementById('chart-container');
    if (!chartElement) return;

    const canvas = await html2canvas(chartElement);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg');
    link.download = 'graph.jpg';
    link.click();
  };

  return (
    <>
      <Box
        overflow="auto"
        flexGrow={1}
        maxHeight="100%"
        marginBottom={2}
        padding={2}
        bgcolor="rgb(0, 0, 0, 0.4)"
        borderRadius={2}
        boxShadow={1}
        display="flex"
        flexDirection="column"
        width="100%"
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            display="flex"
            flexDirection={message.sender === 'user' ? 'row-reverse' : 'row'}
            marginBottom={2}
            justifyContent={message.sender === 'user' ? 'flex-end' : 'flex-start'}
          >
            {message.type === 'graph' ? (
              <Paper
                elevation={3}
                sx={{
                  padding: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgb(238, 238, 238)',
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenModal(message.data)}
                >
                  Voir le graphique
                </Button>
              </Paper>
            ) : (
              <Paper
                elevation={3}
                sx={{
                  width: 'fit-content',
                  maxWidth: '80%',
                  padding: 1.5,
                  borderRadius: 2,
                  backgroundColor:
                    message.sender === 'user' ? 'rgb(30, 136, 229)' : 'rgb(238, 238, 238)',
                  color: 'black',
                  fontSize: '14px',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {message.text}
              </Paper>
            )}
          </Box>
        ))}
      </Box>

      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
        <TextField
          variant="outlined"
          placeholder="Écrivez un message..."
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage(input)}
          disabled={loading}
          sx={{
            marginRight: 1,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgb(70, 130, 180)',
              },
              '&:hover fieldset': {
                borderColor: 'rgb(70, 130, 180)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgb(70, 130, 180)',
              },
            },
          }}
        />
        <Button
          color="primary"
          variant="contained"
          onClick={() => handleSendMessage(input)}
          disabled={input.trim() === '' || loading}
        >
          <SendIcon />
        </Button>
      </Box>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          id="chart-container"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            bgcolor: 'rgb(42, 52, 71)', // Fond modale
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          {modalGraphData && (
            <Chart
              options={{
                chart: {
                  type: modalGraphData.chart.type,
                  height: modalGraphData.chart.height || 350,
                  foreColor: '#adb0bb',
                },
                xaxis: modalGraphData.xaxis,
                yaxis: {
                  ...modalGraphData.yaxis,
                  title: {
                    ...modalGraphData.yaxis.title,
                    style: { color: '#fff' }, // Titre de l'axe Y en blanc
                  },
                },
                grid: {
                  show: true,
                  borderColor: 'rgba(255, 255, 255, 0.2)', // Lignes de grille discrètes
                  yaxis: {
                    lines: { show: false }, // Désactiver les lignes continues de l'axe Y
                  },
                },
                tooltip: { theme: 'dark' },
              }}
              series={modalGraphData.series}
              type={modalGraphData.chart.type}
              height={modalGraphData.chart.height || 350}
            />
          )}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDownloadGraph}
            sx={{ mt: 2 }}
          >
            Télécharger en JPG
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCloseModal}
            sx={{ mt: 2, ml: 2 }}
          >
            Fermer
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default ChatBoxWithInput;

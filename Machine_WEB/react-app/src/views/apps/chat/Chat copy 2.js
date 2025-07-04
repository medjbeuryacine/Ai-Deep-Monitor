import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Paper } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import AppCard from 'src/components/shared/AppCard';

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Réflexion...');

  const messagesEndRef = useRef(null);

  // Fonction pour envoyer un message
  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    // Ajouter le message de l'utilisateur à la liste des messages
    setMessages((prevMessages) => [...prevMessages, { text: input, sender: 'user' }]);

    // Début de l'animation de chargement
    setLoading(true);

    // Ajouter un message temporaire de "réflexion"
    const loadingMessage = { text: loadingText, sender: 'bot', id: 'loading' };
    setMessages((prevMessages) => [...prevMessages, loadingMessage]);

    try {
      const response = await fetch(`http://192.168.1.150/api/execute-function?user_request=${encodeURIComponent(input)}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: '',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la réponse de l\'API');
      }

      const data = await response.json();
      console.log('Réponse complète de l\'API:', data);

      const ollamaResponse = data.ollama_response;
      const executionResult = data.execution_result;
      const context = data.context;

      let botMessage = '';
      if (executionResult) {
        botMessage = `Résultat de l'exécution : ${executionResult}`;
      } else if (ollamaResponse && ollamaResponse.response_content) {
        botMessage = `Fonction à exécuter : ${ollamaResponse.response_content.fonction_a_retourner}\nContexte : ${ollamaResponse.response_content.contexte}`;
      } else {
        botMessage = 'Désolé, une réponse valide n\'a pas pu être obtenue.';
      }

      // Remplacer le message de réflexion par la réponse
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(msg => msg.id !== 'loading'); // Enlevez le message de réflexion
        return [
          ...updatedMessages,
          { text: botMessage, sender: 'bot' },
        ];
      });

      setLoading(false);
    } catch (error) {
      console.error('Erreur API:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Désolé, une erreur est survenue. Veuillez réessayer.', sender: 'bot' },
      ]);
      setLoading(false);
    }

    setInput('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <AppCard>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="flex-end"
        height="80vh"
        width="100%"
        padding={3}
        position="relative"
        bgcolor="rgba(50, 79, 88, 0.33)"
      >
        {/* Affichage des messages */}
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
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection={message.sender === 'user' ? 'row-reverse' : 'row'}
              marginBottom={2}
              justifyContent={message.sender === 'user' ? 'flex-end' : 'flex-start'}
            >
              <Paper
                elevation={3}
                sx={{
                  maxWidth: '60%',
                  padding: 1.5,
                  borderRadius: 2,
                  backgroundColor: message.sender === 'user' ? 'rgb(30, 136, 229)' : 'rgb(238, 238, 238)',
                  color: message.sender === 'user' ? 'white' : 'black',
                  fontSize: '14px',
                  wordWrap: 'break-word',
                }}
              >
                {message.text}
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Zone de saisie */}
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <TextField
            variant="outlined"
            placeholder="Écrivez un message..."
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            disabled={loading} // Désactive la zone de texte pendant le chargement
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
            onClick={handleSendMessage}
            disabled={input.trim() === '' || loading} // Désactive le bouton pendant le chargement ou si l'input est vide
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </AppCard>
  );
};

export default Chats;

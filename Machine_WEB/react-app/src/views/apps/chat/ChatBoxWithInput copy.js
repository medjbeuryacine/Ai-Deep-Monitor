import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const ChatBoxWithInput = ({ messages, setMessages, input, setInput, loadingText }) => {
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (message) => {
    if (message.trim() === '') return;

    setMessages((prevMessages) => [...prevMessages, { text: message, sender: 'user' }]);
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

      let botMessage = '';
      if (executionResult) {
        botMessage = `Résultat de l'exécution :\n ${executionResult}`;
      } else if (ollamaResponse && ollamaResponse.response_content) {
        botMessage = `Fonction à exécuter : ${ollamaResponse.response_content.fonction_a_retourner}\nContexte : ${ollamaResponse.response_content.contexte}`;
      } else {
        botMessage = "Désolé, une réponse valide n'a pas pu être obtenue.";
      }

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter((msg) => msg.id !== 'loading');
        return [...updatedMessages, { text: botMessage, sender: 'bot' }];
      });
    } catch (error) {
      console.error('Erreur API:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Désolé, une erreur est survenue. Veuillez réessayer.", sender: 'bot' },
      ]);
    }

    setLoading(false);
    setInput('');
  };

  return (
    <>
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
                width: 'fit-content',
                maxWidth: '80%',
                padding: 1.5,
                borderRadius: 2,
                backgroundColor:
                  message.sender === 'user' ? 'rgb(30, 136, 229)' : 'rgb(238, 238, 238)',
                color: message.sender === 'user' ? 'white' : 'black',
                fontSize: '14px',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {message.text}
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Input de message */}
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
    </>
  );
};

export default ChatBoxWithInput;

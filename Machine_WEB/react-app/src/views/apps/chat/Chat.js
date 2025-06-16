import React, { useState } from 'react';
import { Box } from '@mui/material';
import ChatBoxWithInput from 'src/views/apps/chat/ChatBoxWithInput';
import SystemMonitoring from 'src/views/apps/chat/SystemMonitoring';
import AppCard from 'src/components/shared/AppCard';

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingText, setLoadingText] = useState('Réflexion...');

  return (
    <AppCard>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="flex-end"
        height="80vh"
        width="100%"
        padding={1}
        position="relative"
        bgcolor="rgba(50, 79, 88, 0.33)"
      >
        {/* Chat + Message Input */}
        <ChatBoxWithInput
          messages={messages}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          loadingText={loadingText}
        />

        {/* Monitoring System */}
        <SystemMonitoring />
      </Box>
    </AppCard>
  );
};

export default Chats;

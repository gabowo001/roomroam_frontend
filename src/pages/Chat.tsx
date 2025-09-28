import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header, ChatMessages, InputForm } from '../components';
import { WebSocketManager } from '../services/websocketManager';
import { Message } from '../types';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>('');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsManager] = useState<WebSocketManager>(() => new WebSocketManager());

  useEffect(() => {
    // Set a default username
    setUsername(`User_${Math.floor(Math.random() * 1000)}`);
    fetchMessages();
    
    // Set up WebSocket event handlers
    wsManager.onMessage((newMessage: Message) => {
      setMessages(prevMessages => {
        // Check if message already exists to avoid duplicates
        const exists = prevMessages.some(m => m.id === newMessage.id);
        if (!exists) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    });

    wsManager.onStatusChange(setWsConnected);
    
    // Clean up WebSocket on component unmount
    return () => {
      wsManager.disconnect();
    };
  }, [wsManager]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get<{ messages: Message[], count: number }>('/api/messages');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    const messageData: Omit<Message, 'id'> = {
      text: messageText,
      username: username,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await axios.post<{ success: boolean, message: Message, total_messages: number }>('/api/messages', messageData);
      if (response.data.success) {
        // Message will be added via WebSocket, so we don't need to manually add it here
        console.log('Message sent successfully');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add message locally even if backend fails
      setMessages(prev => [...prev, {...messageData, id: prev.length + 1}]);
    }
  };

  return (
    <div className="chat-app">
      <Header isConnected={wsConnected} />
      <ChatMessages messages={messages} currentUsername={username} />
      <InputForm onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Chat;

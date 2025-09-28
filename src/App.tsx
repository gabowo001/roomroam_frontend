import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Define TypeScript interfaces
interface Message {
  text: string;
  username: string;
  timestamp: string;
  id: number;
}

interface WebSocketMessage {
  type: string;
  data: Message;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set a default username
    setUsername(`User_${Math.floor(Math.random() * 1000)}`);
    fetchMessages();
    
    // Set up WebSocket connection for real-time updates
    setupWebSocket();
    
    // Clean up WebSocket on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupWebSocket = () => {
    // Determine the WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'message') {
          setMessages(prevMessages => {
            // Check if message already exists to avoid duplicates
            const exists = prevMessages.some(m => m.id === message.data.id);
            if (!exists) {
              return [...prevMessages, message.data];
            }
            return prevMessages;
          });
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(setupWebSocket, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setWsConnected(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get<{ messages: Message[], count: number }>('/api/messages');
      setMessages(response.data.messages || []);
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsConnected(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData: Omit<Message, 'id'> = {
      text: newMessage,
      username: username,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await axios.post<{ success: boolean, message: Message, total_messages: number }>('/api/messages', messageData);
      if (response.data.success) {
        // Message will be added via WebSocket, so we don't need to manually add it here
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add message locally even if backend fails
      setMessages([...messages, {...messageData, id: messages.length + 1}]);
      setNewMessage('');
    }
  };

  return (
    <div className="chat-app">
      <div className="chat-header">
        <div className="hamburger-menu">
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </div>
        <h2>Group Chat</h2>
        <div className="connection-status">
          <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}></span>
          {wsConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.username === username ? 'own-message' : 'other-message'}`}>
              <div className="message-header">
                <span className="username">{message.username}</span>
                <span className="timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="message-text">{message.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
        />
        <button type="submit" className="send-button">
          <span>→</span>
        </button>
      </form>
    </div>
  );
}

export default App;
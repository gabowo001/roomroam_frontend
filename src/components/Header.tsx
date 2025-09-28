import React from 'react';

interface HeaderProps {
  isConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ isConnected }) => {
  return (
    <div className="chat-header">
      <div className="hamburger-menu">
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </div>
      <h2>Group Chat</h2>
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
        {isConnected ? 'Connected' : 'Connecting...'}
      </div>
    </div>
  );
};

export default Header;

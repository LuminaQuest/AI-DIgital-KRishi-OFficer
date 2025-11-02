import React, { useEffect, useRef } from 'react';
import { Volume2, Loader2, Check, X as XIcon, AlertCircle } from 'lucide-react';

const ChatBubble = ({
  message,
  isDarkMode,
  onReadAloud,
  isLastMessage,
  onSectorSelect,
  activeSector,
}) => {
  const bubbleRef = useRef(null);
  const isUser = message.isUser;
  const isError = message.isError;
  const isPlaying = message.isPlayingAudio;
  const hasSector = message.sectorId;
  
  // Animation for new messages
  useEffect(() => {
    if (bubbleRef.current && isLastMessage) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Add animation class
      bubbleRef.current.classList.add('animate-float-up');
      
      // Remove animation class after it completes
      const timer = setTimeout(() => {
        if (bubbleRef.current) {
          bubbleRef.current.classList.remove('animate-float-up');
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLastMessage]);
  
  // Extract sector mentions and split text
  const renderMessageContent = () => {
    if (!message.text) return null;
    
    // Simple regex to find sector mentions like "Sector 1" or "sector 5"
    const sectorRegex = /(sector\s*\d+)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = sectorRegex.exec(message.text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          text: message.text.substring(lastIndex, match.index),
          isSector: false,
          sectorId: null
        });
      }
      
      // Add the matched sector
      const sectorId = parseInt(match[0].replace(/\D/g, ''), 10);
      parts.push({
        text: match[0], 
        isSector: true,
        sectorId: sectorId
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last match
    if (lastIndex < message.text.length) {
      parts.push({
        text: message.text.substring(lastIndex),
        isSector: false,
        sectorId: null
      });
    }
    
    return parts.map((part, index) => {
      if (part.isSector) {
        return (
          <button
            key={index}
            onClick={() => onSectorSelect && onSectorSelect(part.sectorId)}
            className={`inline-flex items-center px-2 py-0.5 rounded-md mx-0.5 transition-all duration-200 ${
              activeSector === part.sectorId 
                ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' 
                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
            }`}
          >
            {part.text}
            <span className="ml-1 text-xs opacity-70">📍</span>
          </button>
        );
      }
      return <span key={index}>{part.text}</span>;
    });
  };
  
  // Render message status indicator
  const renderStatus = () => {
    if (isUser) {
      return (
        <div className="flex items-center space-x-1">
          <span className="text-xs opacity-70">{message.timestamp}</span>
          {message.isSent && (
            <Check className="w-3 h-3 text-blue-400" />
          )}
          {message.isError && (
            <XIcon className="w-3 h-3 text-red-400" />
          )}
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs opacity-70">{message.timestamp}</span>
        <button
          onClick={() => onReadAloud && onReadAloud(message.text, message.id)}
          className={`p-1 rounded-full transition-colors ${
            isPlaying 
              ? 'text-green-400 bg-green-500/10 animate-pulse' 
              : 'text-gray-400 hover:text-green-400 hover:bg-gray-600/30'
          }`}
          disabled={isPlaying}
          title="Read aloud"
        >
          {isPlaying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Volume2 className="w-3 h-3" />
          )}
        </button>
      </div>
    );
  };
  
  // Base classes
  const baseClasses = `relative max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-lg transition-all duration-300 ${
    isUser 
      ? 'ml-auto rounded-br-sm bg-gradient-to-r from-green-600 to-green-700 text-white' 
      : isError
        ? 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-tl-sm'
        : isDarkMode 
          ? 'bg-gray-700/80 text-gray-100 rounded-tl-sm' 
          : 'bg-white text-gray-800 rounded-tl-sm shadow-md'
  }`;
  
  return (
    <div 
      ref={bubbleRef}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-3`}
    >
      <div className={baseClasses}>
        {/* Message content */}
        <div className={`break-words whitespace-pre-wrap text-sm sm:text-base ${
          isError ? 'flex items-start' : ''
        }`}>
          {isError && (
            <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          )}
          <div>
            {renderMessageContent()}
            
            {/* Image preview if available */}
            {message.image && (
              <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                <img 
                  src={message.image} 
                  alt="Crop diagnosis" 
                  className="w-full max-h-48 object-cover"
                />
              </div>
            )}
            
            {/* Sector indicator */}
            {hasSector && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-black/10">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                  Analyzing Sector {message.sectorId}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Timestamp and status */}
        <div className={`mt-1.5 flex ${isUser ? 'justify-end' : 'justify-between'} items-center`}>
          {renderStatus()}
        </div>
        
        {/* Decorative elements */}
        {!isUser && !isError && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500/30 animate-ping opacity-0"></div>
        )}
      </div>
      
      <style jsx>{`
        .animate-float-up {
          animation: float-up 0.3s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }
        
        @keyframes float-up {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Custom scrollbar for message content */
        .message-content {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? 'rgba(255,255,255,0.2) transparent' : 'rgba(0,0,0,0.1) transparent'};
        }
        
        .message-content::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .message-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .message-content::-webkit-scrollbar-thumb {
          background-color: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default ChatBubble;

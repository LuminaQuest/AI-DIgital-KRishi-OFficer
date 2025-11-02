import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Image, Camera, X, Leaf } from 'lucide-react';

const SeedInput = ({
  value,
  onChange,
  onSend,
  onImageSelect,
  onCameraClick,
  onMicClick,
  isRecording,
  isLoading,
  isDarkMode,
  placeholder,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);
  const inputRef = useRef(null);
  const growTimeout = useRef(null);
  
  // Animation for the seed growing into an input
  useEffect(() => {
    if (isFocused || value) {
      setIsGrowing(true);
    } else {
      growTimeout.current = setTimeout(() => {
        setIsGrowing(false);
      }, 300);
    }
    
    return () => {
      if (growTimeout.current) {
        clearTimeout(growTimeout.current);
      }
    };
  }, [isFocused, value]);
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  
  const handleImageClick = () => {
    if (onImageSelect) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => onImageSelect(e);
      input.click();
    }
  };
  
  return (
    <div className={`relative w-full transition-all duration-300 ${isGrowing ? 'max-w-full' : 'max-w-[60px]'}`}>
      {/* Seed/Input Container */}
      <div 
        className={`relative flex items-center ${isGrowing ? 'bg-white/5' : 'bg-green-600/50'} 
          rounded-full transition-all duration-300 overflow-hidden ${isGrowing ? 'h-14' : 'h-14 w-14'} 
          ${isDarkMode ? 'shadow-lg' : 'shadow-md'}`}
        onClick={() => !isGrowing && inputRef.current?.focus()}
      >
        {/* Seed/Leaf Icon */}
        <div 
          className={`absolute left-4 flex items-center justify-center transition-all duration-300 ${isGrowing ? 'opacity-0 -translate-x-2' : 'opacity-100'}`}
        >
          <Leaf className="w-6 h-6 text-white" />
        </div>
        
        {/* Input Field */}
        <div className={`flex-1 transition-all duration-300 ${isGrowing ? 'opacity-100 px-4' : 'opacity-0 w-0'}`}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full bg-transparent border-0 focus:ring-0 focus:outline-none resize-none py-4 pr-12 
                ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
              rows={1}
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
            
            {/* Action Buttons */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-1 pr-2">
              {value ? (
                <>
                  <button
                    onClick={() => onSend()}
                    disabled={isLoading}
                    className={`p-2 rounded-full ${isDarkMode ? 'text-green-400 hover:bg-white/10' : 'text-green-600 hover:bg-gray-100'} 
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-green-500 rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleImageClick}
                    className={`p-2 rounded-full ${isDarkMode ? 'text-blue-400 hover:bg-white/10' : 'text-blue-600 hover:bg-gray-100'} 
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                    title="Upload Image"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={onCameraClick}
                    className={`p-2 rounded-full ${isDarkMode ? 'text-purple-400 hover:bg-white/10' : 'text-purple-600 hover:bg-gray-100'} 
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                    title="Take Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={onMicClick}
                    className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : isDarkMode 
                          ? 'text-red-400 hover:bg-white/10 focus:ring-red-500/50' 
                          : 'text-red-600 hover:bg-gray-100 focus:ring-red-500/50'
                    }`}
                    title={isRecording ? 'Stop Recording' : 'Voice Input'}
                  >
                    <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Growing Animation Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
        {/* Animated particles that appear when growing */}
        {isGrowing && (
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-green-400/30"
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float-up ${Math.random() * 2 + 1}s ease-out forwards`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
        }
        
        textarea {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? 'rgba(255,255,255,0.2) transparent' : 'rgba(0,0,0,0.1) transparent'};
        }
        
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        
        textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        
        textarea::-webkit-scrollbar-thumb {
          background-color: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default SeedInput;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Leaf, Compass, Thermometer, Droplet, Wind, X, Camera } from 'lucide-react';
import FieldGrid from './FieldGrid';
import SeedInput from './SeedInput';
import ChatBubble from './ChatBubble';
import LoadingAnimation from './LoadingAnimation';

const KrishiOfficerApp = ({
  // Props from main App
  language,
  setLanguage,
  detectedLanguage,
  setDetectedLanguage,
  messages,
  setMessages,
  input,
  setInput,
  weather,
  time,
  isLoading,
  isDiagnosing,
  isRecording,
  isDarkMode,
  setIsDarkMode,
  base64Image,
  setBase64Image,
  imagePreviewUrl,
  setImagePreviewUrl,
  showCamera,
  setShowCamera,
  cameraStream,
  setCameraStream,
  languageLocked,
  setLanguageLocked,
  farmerProfile,
  handleSend,
  handleMicClick,
  handleImageSelect,
  handleCameraClick,
  handleReadAloud,
  handleSectorSelect,
  activeSector,
  videoRef,
  canvasRef,
  capturePhoto,
  stopCamera,
  T
}) => {
  const messagesEndRef = useRef(null);
  const [isFieldGridVisible, setIsFieldGridVisible] = useState(false);
  const [sectorData, setSectorData] = useState(null);
  const [sectorHistory, setSectorHistory] = useState({});
  
  // Weather cards data
  const weatherCards = [
    { icon: <Compass className="w-5 h-5 text-green-300" />, label: `${weather.latitude}°N`, value: T.latitude },
    { icon: <Leaf className="w-5 h-5 text-green-300" />, label: weather.condition, value: T.fieldStatus },
    { icon: <Droplet className="w-5 h-5 text-green-300" />, label: weather.humidity, value: T.humidity },
    { icon: <Thermometer className="w-5 h-5 text-green-300" />, label: weather.temperature, value: T.temp },
  ];
  
  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isDiagnosing, scrollToBottom]);
  
  // Handle sector selection from the field grid
  const handleSectorClick = (sectorId) => {
    setActiveSector(sectorId);
    
    // If we have history for this sector, show it
    if (sectorHistory[sectorId]) {
      setSectorData(sectorHistory[sectorId]);
    } else {
      // Otherwise, analyze the sector
      setSectorData({
        id: sectorId,
        status: 'analyzing',
        health: Math.random() * 0.3 + 0.7, // Random health between 0.7 and 1.0
        lastChecked: new Date().toISOString(),
        issues: []
      });
      
      // Simulate analysis
      setTimeout(() => {
        const issues = [];
        const health = Math.random();
        
        if (health < 0.3) {
          issues.push('Low soil moisture', 'Nutrient deficiency detected');
        } else if (health < 0.6) {
          issues.push('Moderate soil moisture');
        }
        
        const newSectorData = {
          id: sectorId,
          status: 'analyzed',
          health,
          lastChecked: new Date().toISOString(),
          issues
        };
        
        setSectorData(newSectorData);
        setSectorHistory(prev => ({
          ...prev,
          [sectorId]: newSectorData
        }));
        
        // Add a message about the sector analysis
        const sectorMessage = {
          id: Date.now(),
          text: `Sector ${sectorId} analysis complete. ${issues.length > 0 ? 'Issues detected: ' + issues.join(', ') : 'No critical issues found.'}`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          sectorId
        };
        
        setMessages(prev => [...prev, sectorMessage]);
      }, 2000);
    }
  };
  
  // Toggle field grid visibility
  const toggleFieldGrid = () => {
    setIsFieldGridVisible(!isFieldGridVisible);
  };
  
  // Theme variables
  const theme = {
    bg: isDarkMode ? 'bg-gray-950' : 'bg-green-50',
    chatContainer: isDarkMode ? 'rgba(27, 40, 36, 0.4)' : 'rgba(255, 255, 255, 0.7)',
    headerBg: isDarkMode ? 'bg-green-700/50' : 'bg-green-600',
    headerText: isDarkMode ? 'text-white' : 'text-white',
    dashBg: isDarkMode ? 'rgba(50, 75, 59, 0.5)' : 'bg-green-100',
    dashText: isDarkMode ? 'text-white' : 'text-gray-900',
    dashCardBg: isDarkMode ? 'bg-green-700/50' : 'bg-green-500',
    inputText: isDarkMode ? 'text-white' : 'text-gray-900',
    inputBg: isDarkMode ? 'bg-gray-700/70' : 'bg-white',
    placeholder: isDarkMode ? 'placeholder-gray-400' : 'placeholder-gray-600',
    micBg: isDarkMode ? 'bg-gray-700 text-green-500 hover:bg-gray-600' : 'bg-gray-200 text-green-600 hover:bg-gray-300',
    errorBg: isDarkMode ? 'bg-red-800' : 'bg-red-100',
    errorText: isDarkMode ? 'text-white' : 'text-red-800',
    footerBg: isDarkMode ? 'bg-gray-800/80' : 'bg-gray-200',
    footerText: isDarkMode ? 'text-gray-500' : 'text-gray-600',
    scrollbarThumb: isDarkMode ? '#374151' : '#b1d4a0',
  };
  
  return (
    <div className={`min-h-screen ${theme.bg} ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center justify-center p-0 sm:p-4 font-sans safe-area-inset`}>
      {/* Main App Container */}
      <div 
        className="relative w-full max-w-4xl rounded-none sm:rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-screen sm:h-[90vh] max-h-screen overflow-hidden border-0 sm:border border-green-700/50 transition-all duration-500"
        style={{
          backdropFilter: 'blur(10px) saturate(180%)',
          backgroundColor: theme.chatContainer,
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        }}
      >
        {/* Header */}
        <div className={`${theme.headerBg} p-3 sm:p-5 rounded-none sm:rounded-t-2xl sm:rounded-t-3xl flex justify-between items-center shadow-xl transition-all duration-500 flex-shrink-0`}>
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-1 min-w-0">
            <Leaf className="w-5 h-5 sm:w-8 sm:h-8 text-white animate-spin-slow flex-shrink-0" />
            <h1 className={`text-base sm:text-2xl font-extrabold ${theme.headerText} tracking-wide leading-tight truncate ${language !== 'English' ? 'sm:text-3xl' : ''}`}>
              {T.title}
            </h1>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 sm:p-2 rounded-full text-white bg-green-600/70 hover:bg-green-500/80 transition duration-200 active:scale-95"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <div className="flex items-center gap-1">
              <select
                className="bg-green-600/70 text-white text-xs sm:text-base px-2 py-1.5 sm:p-2 rounded-lg sm:rounded-xl cursor-pointer transition duration-200 ease-in-out hover:bg-green-500/80 focus:ring-2 focus:ring-green-400 focus:outline-none"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setLanguageLocked(true);
                  setDetectedLanguage(e.target.value);
                }}
              >
                {Object.keys(TRANSLATIONS).map(lang => (
                  <option key={lang} value={lang}>{TRANSLATIONS[lang].language}</option>
                ))}
              </select>
              {languageLocked && (
                <button
                  onClick={() => setLanguageLocked(false)}
                  className="p-1 rounded-full bg-green-500/50 hover:bg-green-500 text-white text-xs"
                  title="Unlock language (auto-detect)"
                >
                  🔒
                </button>
              )}
            </div>
            
            {/* Field Grid Toggle Button */}
            <button
              onClick={toggleFieldGrid}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                isFieldGridVisible 
                  ? 'bg-green-500 text-white' 
                  : isDarkMode 
                    ? 'bg-gray-700 text-green-400 hover:bg-gray-600' 
                    : 'bg-gray-200 text-green-600 hover:bg-gray-300'
              }`}
              title={isFieldGridVisible ? 'Hide Field Grid' : 'Show Field Grid'}
            >
              <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        
        {/* Field Grid Overlay */}
        {isFieldGridVisible && (
          <div className="absolute inset-0 z-20 bg-black/80 flex flex-col">
            <div className="p-4 flex justify-between items-center bg-gray-900/80 border-b border-green-800/50">
              <h2 className="text-lg font-bold text-green-400">Field Grid View</h2>
              <button
                onClick={() => setIsFieldGridVisible(false)}
                className="p-1.5 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 relative">
              <FieldGrid 
                activeSector={activeSector}
                onSectorClick={handleSectorClick}
                onSectorHover={(sectorId) => {
                  // Handle hover effect if needed
                }}
              />
              
              {/* Sector Info Panel */}
              {sectorData && (
                <div className="absolute bottom-4 left-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 text-white border border-green-800/50 shadow-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-green-400">Sector {sectorData.id}</h3>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        sectorData.health > 0.7 ? 'bg-green-500' : 
                        sectorData.health > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm">
                        {sectorData.health > 0.7 ? 'Healthy' : 
                         sectorData.health > 0.4 ? 'Moderate' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-gray-400">Health</div>
                      <div className="h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${sectorData.health > 0.7 ? 'bg-green-500' : 
                            sectorData.health > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${sectorData.health * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Last Checked</div>
                      <div>{new Date(sectorData.lastChecked).toLocaleString()}</div>
                    </div>
                    
                    {sectorData.issues && sectorData.issues.length > 0 && (
                      <div className="col-span-2">
                        <div className="text-gray-400">Issues</div>
                        <div className="mt-1 space-y-1">
                          {sectorData.issues.map((issue, idx) => (
                            <div key={idx} className="flex items-start">
                              <span className="text-red-400 mr-1">•</span>
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      handleSectorSelect(sectorData.id);
                      setIsFieldGridVisible(false);
                    }}
                    className="mt-3 w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                  >
                    Chat about this sector
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather Dashboard */}
        <div 
          className={`p-2 sm:p-4 shadow-inner border-b border-green-700/50 transition-all duration-500 ${theme.dashBg} ${theme.dashText} flex-shrink-0`}
          style={{
            backdropFilter: 'blur(8px) saturate(150%)',
            WebkitBackdropFilter: 'blur(8px) saturate(150%)',
          }}
        >
          <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-2 sm:mb-3 border-b border-green-700/50 pb-1.5 sm:pb-2">
            <div className="flex items-center space-x-1 text-green-200 min-w-0 flex-1">
              <Compass className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">{weather.location}</span>
            </div>
            <div className="text-green-200 font-mono text-xs sm:text-sm flex-shrink-0 ml-2">{time}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-white text-center">
            {weatherCards.map((card, index) => (
              <div 
                key={index} 
                className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition duration-300 transform hover:scale-[1.02] shadow-md ${theme.dashCardBg} hover:bg-green-600/70`}
              >
                {card.icon}
                <div className="text-sm sm:text-lg font-bold mt-0.5 sm:mt-1 leading-tight">{card.label}</div>
                <div className="text-[10px] sm:text-xs text-green-300 opacity-80">{card.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-transparent via-transparent to-gray-900/10 custom-scrollbar min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="relative w-32 h-32 mb-6">
                <div className="absolute inset-0 bg-green-500/10 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 flex items-center justify-center">
                  <Leaf className="w-16 h-16 text-green-500 animate-bounce-slow" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Welcome to Digital Krishi Officer</h3>
              <p className="text-gray-400 max-w-md">Ask me anything about crops, weather, or upload an image for diagnosis.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["How's the weather today?", "What crops grow best here?", "How to control pests?", "Show field grid"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (suggestion === "Show field grid") {
                        toggleFieldGrid();
                      } else {
                        setInput(suggestion);
                      }
                    }}
                    className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isDarkMode={isDarkMode}
                  onReadAloud={handleReadAloud}
                  isLastMessage={index === messages.length - 1}
                  onSectorSelect={handleSectorSelect}
                  activeSector={activeSector}
                />
              ))}
              
              {(isLoading || isDiagnosing) && (
                <div className="flex justify-start">
                  <div className={`p-4 rounded-xl rounded-tl-sm shadow-lg ${
                    isDarkMode ? 'bg-gray-700/80 text-gray-100' : 'bg-white text-gray-800'
                  }`}>
                    <LoadingAnimation isDiagnosing={isDiagnosing} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input Area */}
        <div className="relative p-3 sm:p-4 bg-gray-800/80 border-t border-gray-700/50 flex-shrink-0 safe-area-bottom">
          {isRecording && (
            <div className="absolute left-0 right-0 -top-8 sm:-top-10 text-center text-xs sm:text-sm font-bold text-red-400 animate-pulse bg-gray-900/90 rounded-t-lg py-1 px-2 z-10">
              {T.recording}
            </div>
          )}
          
          <SeedInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onImageSelect={handleImageSelect}
            onCameraClick={handleCameraClick}
            onMicClick={handleMicClick}
            isRecording={isRecording}
            isLoading={isLoading}
            isDarkMode={isDarkMode}
            placeholder={T.placeholder}
          />
          
          {/* Camera Preview */}
          {showCamera && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={stopCamera}
                      className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="p-4 bg-white rounded-full hover:bg-gray-200 transition shadow-lg"
                    >
                      <div className="w-12 h-12 border-4 border-gray-800 rounded-full"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Language Suggestion */}
          {!languageLocked && detectedLanguage !== language && input.trim() && (
            <div className="absolute bottom-16 left-2 sm:left-4 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 z-20 shadow-lg">
              <span>🌐 {detectedLanguage}</span>
              <button
                onClick={() => {
                  setLanguage(detectedLanguage);
                  setLanguageLocked(true);
                }}
                className="underline hover:no-underline font-semibold"
              >
                Switch & Lock
              </button>
            </div>
          )}
        </div>
        
        {/* Custom Scrollbar and Animations */}
        <style jsx>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 15s linear infinite;
          }
          
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          @media (min-width: 640px) {
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: ${theme.scrollbarThumb};
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background-color: transparent;
          }
          
          .safe-area-inset {
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>
      </div>
    </div>
  );
};

export default KrishiOfficerApp;

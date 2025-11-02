import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Compass, Thermometer, Droplet, Wind, Send, Mic, Loader2, Leaf, Sun, Moon, Image, Volume2, Camera, X } from 'lucide-react';

// --- Firebase Imports (Required for Canvas Environment) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Global variables provided by the Canvas environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- API CONSTANTS ---
// NOTE: Must be empty string. The key is provided at runtime.
const apiKey = "AIzaSyCzRw_d-tHfbdZsDVk_zh-GfSO8Imqdijk"; 
const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
const TTS_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

// --- MOCK DATA & TRANSLATIONS ---

const MOCK_WEATHER_DATA = {
  location: 'Andhrapradesh, India',
  latitude: 20.59,
  longitude: 78.96,
  temperature: '28°C',
  condition: 'Sunny Condition',
  humidity: '65%',
  wind: '12 km/h',
};

const TRANSLATIONS = {
  English: {
    title: 'Digital Krishi Officer',
    welcome: "Hello, Farmer! I am your Digital Krishi Officer. I can provide real-time advice on crops, weather, and government schemes (Krishi Yojana). How can I help you grow today?",
    placeholder: 'Ask about crops, soil health, schemes, or upload a picture...',
    language: 'Language',
    askButton: 'Send',
    micButton: 'Voice Input',
    clearButton: 'Clear Chat',
    typing: 'Krishi Officer is typing',
    latitude: 'Latitude',
    fieldStatus: 'Field Status',
    humidity: 'Humidity',
    temp: 'Temp',
    location: 'Location',
    error: 'An internal communication error occurred. The AI system might be temporarily unavailable.',
    footer: (userId, appId) => `User ID: ${userId} | App ID: ${appId}`,
    recording: 'Recording... Speak now',
    recordingError: "Sorry, your browser doesn't support speech recognition.",
    diagnosing: 'Diagnosing Crop Image...',
    diagnosisTitle: 'Crop Diagnosis',
    voiceIcon: 'Read aloud',
    audioError: 'Could not generate audio. Text is too long or service is unavailable.',
  },
  Telugu: {
    title: 'డిజిటల్ కృషి అధికారి',
    welcome: 'నమస్కారం రైతు సోదరా! నేను మీ డిజిటల్ కృషి అధికారిని. పంటలు, వాతావరణం, ప్రభుత్వ పథకాలపై (కృషి యోజన) నేను మీకు నిజ-సమయ సలహాలు ఇవ్వగలను. ఈ రోజు మీ వ్యవసాయంలో ఎలా సహాయపడగలను?',
    placeholder: 'పంటలు, నేల ఆరోగ్యం, పథకాల గురించి అడగండి, లేదా చిత్రాన్ని అప్‌లోడ్ చేయండి...',
    language: 'భాష',
    askButton: 'పంపండి',
    micButton: 'వాయిస్ ఇన్‌పుట్',
    clearButton: 'చాట్‌ను క్లియర్ చేయండి',
    typing: 'కృషి అధికారి టైప్ చేస్తున్నారు',
    latitude: 'అక్షాంశం',
    fieldStatus: 'క్షేత్ర స్థితి',
    humidity: 'తేమ',
    temp: 'ఉష్ణోగ్రత',
    location: 'ప్రదేశం',
    error: 'అంతర్గత కమ్యూనికేషన్ లోపం సంభవించింది. AI సిస్టమ్ తాత్కాలికంగా అందుబాటులో ఉండకపోవచ్చు.',
    footer: (userId, appId) => `యూజర్ ID: ${userId} | యాప్ ID: ${appId}`,
    recording: 'రికార్డింగ్... ఇప్పుడే మాట్లాడండి',
    recordingError: 'క్షమించండి, మీ బ్రౌజర్ వాయిస్ ఇన్‌పుట్‌కు మద్దతు ఇవ్వడం లేదు.',
    diagnosing: 'పంట చిత్రాన్ని విశ్లేషిస్తోంది...',
    diagnosisTitle: 'పంట నిర్ధారణ',
    voiceIcon: 'బిగ్గరగా చదవండి',
    audioError: 'ఆడియోను రూపొందించలేకపోయింది. టెక్స్ట్ చాలా పొడవుగా ఉంది లేదా సేవ అందుబాటులో లేదు.',
  },
  Hindi: {
    title: 'डिजिटल कृषि अधिकारी',
    welcome: 'नमस्ते किसान भाई! मैं आपका डिजिटल कृषि अधिकारी हूँ। मैं आपको फसलों, मौसम और सरकारी योजनाओं (कृषि योजना) पर वास्तविक समय की सलाह दे सकता हूँ। मैं आज आपके खेती में कैसे मदद कर सकता हूँ?',
    placeholder: 'फसलों, मिट्टी के स्वास्थ्य, योजनाओं के बारे में पूछें, या एक तस्वीर अपलोड करें...',
    language: 'भाषा',
    askButton: 'भेजें',
    micButton: 'आवाज इनपुट',
    clearButton: 'चैट साफ़ करें',
    typing: 'कृषि अधिकारी टाइप कर रहे हैं',
    latitude: 'अक्षांश',
    fieldStatus: 'खेत की स्थिति',
    humidity: 'नमी',
    temp: 'तापमान',
    location: 'स्थान',
    error: 'एक आंतरिक संचार त्रुटि हुई। AI सिस्टम अस्थायी रूप से अनुपलब्ध हो सकता है।',
    footer: (userId, appId) => `यूज़र ID: ${userId} | ऐप ID: ${appId}`,
    recording: 'रिकॉर्डिंग... अब बोलें',
    recordingError: 'क्षमा करें, आपका ब्राउज़र आवाज़ पहचान का समर्थन नहीं करता है।',
    diagnosing: 'फसल की छवि का निदान हो रहा है...',
    diagnosisTitle: 'फसल निदान',
    voiceIcon: 'जोर से पढ़ें',
    audioError: 'ऑडियो उत्पन्न नहीं किया जा सका। पाठ बहुत लंबा है या सेवा अनुपलब्ध है।',
  },
};

const getLanguageCode = (lang) => {
  switch (lang) {
    case 'Telugu': return 'te-IN';
    case 'Hindi': return 'hi-IN';
    case 'English':
    default: return 'en-US';
  }
};

// Language Detection Function
const detectLanguage = (text) => {
  if (!text || text.trim().length === 0) return 'English';
  
  // Telugu script range: 0C00-0C7F
  const teluguRegex = /[\u0C00-\u0C7F]/;
  // Hindi/Devanagari script range: 0900-097F
  const hindiRegex = /[\u0900-\u097F]/;
  
  if (teluguRegex.test(text)) return 'Telugu';
  if (hindiRegex.test(text)) return 'Hindi';
  return 'English';
};

// --- AUDIO UTILITIES (Mandatory for TTS) ---

let currentAudio = null;

const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Generates a WAV file blob from 16-bit PCM audio data
const pcmToWav = (pcm16, sampleRate) => {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm16.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // file length - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // chunk size (16 for PCM)
  view.setUint16(20, 1, true); // format tag (1 for PCM)
  view.setUint16(22, numChannels, true); // channels
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, byteRate, true); // byte rate
  view.setUint16(32, blockAlign, true); // block align
  view.setUint16(34, bytesPerSample * 8, true); // bits per sample
  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // data size

  // Write the PCM data
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(44 + i * 2, pcm16[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
};

/**
 * Plays the provided audio clip, ensuring any previously playing clip is stopped.
 * @param {string} audioUrl - URL of the audio (Object URL).
 * @param {Function} onFinish - Callback when playback finishes.
 */
const playAudio = (audioUrl, onFinish) => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const audio = new Audio(audioUrl);
  audio.onended = () => {
    currentAudio = null;
    URL.revokeObjectURL(audioUrl); // Clean up the object URL
    if (onFinish) onFinish();
  };
  audio.onerror = (e) => {
    console.error("Audio playback error:", e);
    currentAudio = null;
    URL.revokeObjectURL(audioUrl);
    if (onFinish) onFinish();
  };

  currentAudio = audio;
  audio.play().catch(e => console.error("Playback failed:", e));
};

// --- MAIN APP COMPONENT ---

const App = () => {
  const [language, setLanguage] = useState('English');
  const [detectedLanguage, setDetectedLanguage] = useState('English'); // Auto-detected language
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [weather, setWeather] = useState(MOCK_WEATHER_DATA);
  const [time, setTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [base64Image, setBase64Image] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [languageLocked, setLanguageLocked] = useState(false); // Language lock system
  
  // Farmer Profile State with Location
  const [farmerProfile, setFarmerProfile] = useState({
    region: '',
    cropType: '',
    farmSize: '',
    pinCode: '',
    village: '',
    latitude: null,
    longitude: null,
    isOnboarded: false
  });

  const messagesEndRef = useRef(null);
  const recognition = useRef(null);
  const audioContextRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handleSendRef = useRef(null); // Ref to hold handleSend function

  // Get current translations based on selected language
  const T = TRANSLATIONS[language] || TRANSLATIONS.English;

  // --- Real-Time Location Detection ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          setFarmerProfile(prev => ({
            ...prev,
            latitude: lat,
            longitude: lon
          }));

          // Reverse geocoding to get village/town name (using a free API)
          try {
            const geoResponse = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            const geoData = await geoResponse.json();
            
            setFarmerProfile(prev => ({
              ...prev,
              village: geoData.locality || geoData.principalSubdivision || '',
              region: geoData.principalSubdivision || geoData.countryName || 'India',
              pinCode: geoData.postcode || ''
            }));

            // Update weather with real location
            setWeather(prev => ({
              ...prev,
              location: `${geoData.locality || geoData.principalSubdivision || 'India'}, ${geoData.countryName || 'India'}`,
              latitude: lat,
              longitude: lon
            }));
          } catch (error) {
            console.error("Geocoding error:", error);
            setWeather(prev => ({
              ...prev,
              latitude: lat,
              longitude: lon,
              location: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`
            }));
          }

          // TODO: Fetch real weather data (using OpenWeather API)
          // Example: fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=YOUR_API_KEY&units=metric`)
          // Then update: setWeather(prev => ({ ...prev, temperature, condition, humidity, wind }))
          // For now, we use the location data to personalize responses
        },
        (error) => {
          console.error("Location access denied:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // --- Utility: Scroll to Bottom of Chat ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading, isDiagnosing]);

  // --- Utility: Time Update ---
  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // --- Initialization: Set Initial Message based on Language ---
  useEffect(() => {
    setMessages([{
      id: Date.now(),
      text: T.welcome,
      isUser: false,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, [language, T.welcome]); // Reset welcome message when language changes

  // --- Firebase Initialization and Auth (MANDATORY for Canvas) ---
  useEffect(() => {
    try {
        const app = initializeApp(firebaseConfig);
        getFirestore(app);
        const authInstance = getAuth(app);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token.length > 0) {
                    try {
                        await signInWithCustomToken(authInstance, __initial_auth_token);
                        setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
                    } catch (e) {
                        console.error("Custom token sign-in failed, signing in anonymously:", e);
                        await signInAnonymously(authInstance);
                        setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
                    }
                } else {
                    await signInAnonymously(authInstance);
                    setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
                }
            }
        });
        return () => unsubscribe();
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
    }
  }, []);

  // --- Voice Recognition Setup (Improved UX) ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false; // Capture a single utterance
      recognition.current.interimResults = true; // Use interim results to provide feedback
      recognition.current.lang = getLanguageCode(language); 
      
      // Crucial: Give the farmer time to finish speaking. The default timeout is often too fast.
      // We rely on the browser's speech processing (which is much better than manual timers)
      // Setting continuous=false helps here, and we only send on a final result.

      recognition.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update input with interim results for real-time feedback
        if (interimTranscript) {
          setInput(interimTranscript);
        }

        // If we have final results, set it and optionally auto-send
        if (finalTranscript) {
          const fullTranscript = finalTranscript || interimTranscript;
          setInput(fullTranscript);
          setIsRecording(false);
          
          // Auto-send after a short delay using the ref
          setTimeout(() => {
            if (handleSendRef.current) {
              handleSendRef.current(fullTranscript);
            }
          }, 300);
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsRecording(false);
        // Show user-friendly error message
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permissions.');
        } else {
          alert(`Speech recognition error: ${event.error}`);
        }
      };
      
      // Ensures the state is reset even on natural ending (like silence timeout)
      recognition.current.onend = () => {
        setIsRecording(false);
        // Only auto-restart if we were actually recording
        if (recognition.current && recognition.current.continuous) {
          try {
            recognition.current.start();
          } catch (e) {
            // Ignore errors on restart attempts
          }
        }
      };
    }
  }, [language]); // Re-initialize when language changes to update 'lang' setting

  const handleMicClick = () => {
    if (!recognition.current) {
        alert(T.recordingError);
        return;
    }
    
    if (isRecording) {
        // Stop recording manually
        recognition.current.stop();
        setIsRecording(false);
    } else {
        try {
            setInput(''); // Clear input before starting
            // Use locked language or detected language, fallback to selected language
            const langToUse = languageLocked ? language : (detectedLanguage || language);
            recognition.current.lang = getLanguageCode(langToUse);
            recognition.current.start();
            setIsRecording(true);
            console.log('Voice recognition started with language:', langToUse);
        } catch (e) {
            console.error("Error starting recognition:", e);
            setIsRecording(false);
            if (e.name === 'InvalidStateError') {
                alert('Voice recognition is already active. Please wait.');
            } else {
                alert(`Failed to start voice recognition: ${e.message}`);
            }
        }
    }
  };
  
  // --- Image Upload Logic ---
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setBase64Image(null);
      setImagePreviewUrl(null);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = arrayBufferToBase64(e.target.result);
      const mimeType = file.type;
      setBase64Image({ data: base64Data, mimeType });
      setImagePreviewUrl(URL.createObjectURL(file));
    };
    reader.readAsArrayBuffer(file);
  };
  
  const handleImageDiagnosis = useCallback(async () => {
    const currentImage = base64Image;
    const currentPreview = imagePreviewUrl;
    
    if (!currentImage || isDiagnosing) return;

    const userMessage = {
      id: Date.now(),
      text: T.diagnosisTitle,
      image: currentPreview,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(currentMsgs => [...currentMsgs, userMessage]);
    setIsDiagnosing(true);
    setBase64Image(null);
    setImagePreviewUrl(null);

    const lang = languageLocked ? language : (detectedLanguage || language);
    const prompt = `Analyze this crop/plant image and identify any disease, pest, or nutrient deficiency. Provide SHORT, structured advice with emojis and numbered steps. Respond in ${lang}.`;

    const systemPrompt = `You are an expert Agricultural Diagnostic AI Assistant (Digital Krishi Officer).

CRITICAL FORMATTING RULES:
1. Keep response SHORT - maximum 120 words
2. Use emojis: 🌾 🐛 🌱 💧 📊 ✅
3. First identify the issue/problem clearly (disease, pest, deficiency, etc.)
4. Identify the plant/crop species if possible
5. Structure with bullet points and numbered steps (1. 2. 3.)
6. Provide quick, actionable solutions
7. Give region-specific advice when relevant
8. Use simple language farmers can understand
9. ALWAYS respond in ${lang} language (CRITICAL: stay consistent)

RESPONSE FORMAT:
🌾 Plant: [species name if identified]
🐛 Issue: [problem/disease/deficiency]
💡 Quick Fix:
1. [Action 1]
2. [Action 2]
3. [Action 3]
💚 Prevention: [tip]
📊 Note: [optional regional advice]

Total: 100-120 words only`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: currentImage.mimeType,
                            data: currentImage.data
                        }
                    }
                ]
            }
        ],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const result = await withBackoff(() => fetch(TEXT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => res.json()));
        
        const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || T.error;

        const aiResponse = {
            id: Date.now() + 1,
            text: aiText,
            isUser: false,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(currentMsgs => [...currentMsgs, aiResponse]);

    } catch (error) {
        console.error("Image Analysis API call failed:", error);
        const errorMessage = {
            id: Date.now() + 1,
            text: T.error,
            isUser: false,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            isError: true,
        };
        setMessages(currentMsgs => [...currentMsgs, errorMessage]);
    } finally {
        setIsDiagnosing(false);
    }
  }, [base64Image, isDiagnosing, imagePreviewUrl, language, T]); // Added T to dependency array

  // --- Utility: Exponential Backoff for API calls ---
  const withBackoff = async (fn, maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
  };

  // --- TTS Generation and Playback ---
  const handleReadAloud = async (text, msgId) => {
    if (!text) return;
    
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    // Temporarily set the message as playing/loading
    setMessages(msgs => msgs.map(msg => 
      msg.id === msgId ? { ...msg, isPlayingAudio: true } : msg
    ));
    
    // Use 'Kore' as a reliable, firm voice for the officer
    const ttsPayload = {
      contents: [{ parts: [{ text: text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }
          }
        }
      }
    };

    try {
        const response = await withBackoff(() => fetch(TTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ttsPayload)
        }).then(res => res.json()));

        const part = response?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;

            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            const wavBlob = pcmToWav(pcm16, sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);
            
            playAudio(audioUrl, () => {
                // Reset state when audio finishes
                setMessages(msgs => msgs.map(msg => 
                    msg.id === msgId ? { ...msg, isPlayingAudio: false } : msg
                ));
            });

        } else {
            throw new Error("Invalid audio data received.");
        }
    } catch (error) {
        console.error("TTS generation failed:", error);
        alert(T.audioError);
    } finally {
        // If error, reset the loading state
        setMessages(msgs => msgs.map(msg => 
            msg.id === msgId ? { ...msg, isPlayingAudio: false } : msg
        ));
    }
  };

  // --- Gemini API Call Function (optimized - only sends latest message + context) ---
  const fetchAiResponse = async (userPrompt, userLanguage = 'English') => {
    const apiUrl = TEXT_API_URL;
    // Language Lock System: Use locked language if set, otherwise detected language
    const lang = languageLocked ? language : (detectedLanguage || userLanguage || language);

    const systemPrompt = `You are a Digital Krishi Officer - an expert agricultural AI assistant helping farmers across India.

CRITICAL FORMATTING RULES:
1. Keep responses SHORT and BRIEF - maximum 150 words
2. Use bullet points with emojis: • 🌱 • 💧 • 🐛 • 🌾 • 📊
3. Always address the issue/problem first, then quick solutions
4. Use numbered format (1. 2. 3.) for steps
5. Add relevant emojis for visual appeal (🌱🌧️🐛🌾💚)
6. Be precise and actionable - tell farmers exactly what to do
7. Provide region-specific advice when possible
8. Keep language simple - farmers prefer quick, readable points
9. ALWAYS respond in ${lang} language (CRITICAL: stay consistent)
10. Format example:
    🌾 Issue: [problem name]
    💡 Quick Fix:
    1. [Action 1]
    2. [Action 2]
    3. [Action 3]
    💚 Prevention: [tip]

RESPONSE STYLE:
- Brief acknowledgment (1 sentence)
- Issue/problem (with emoji)
- Quick numbered solutions (3-5 points max)
- Prevention tip (optional)
- Total: 100-150 words only

CONTEXT: 
- Location: ${farmerProfile.village || farmerProfile.region || 'India'}
- Region: ${farmerProfile.region || 'India'}
- Crop: ${farmerProfile.cropType || 'various crops'}
- Farm Size: ${farmerProfile.farmSize || 'not specified'}
- Pin Code: ${farmerProfile.pinCode || 'N/A'}
- Coordinates: ${farmerProfile.latitude ? `${farmerProfile.latitude.toFixed(2)}, ${farmerProfile.longitude.toFixed(2)}` : 'N/A'}`;

    // Smart Prompt Optimization: Only send latest message, not full history
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        tools: [{ "google_search": {} }], 
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    const fetchFn = async () => {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        return response.json();
    };

    return withBackoff(fetchFn);
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera
        audio: false 
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          const base64Data = arrayBufferToBase64(e.target.result);
          setBase64Image({ data: base64Data, mimeType: 'image/jpeg' });
          setImagePreviewUrl(canvas.toDataURL('image/jpeg'));
          stopCamera();
        };
        reader.readAsArrayBuffer(blob);
      }, 'image/jpeg', 0.9);
    }
  };

  // Language detection on input change
  useEffect(() => {
    if (input.trim()) {
      const detected = detectLanguage(input);
      setDetectedLanguage(detected);
      // Optionally update UI language if user wants auto-switch
    }
  }, [input]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // --- Core Message Sending Logic ---
  const handleSend = useCallback(async (textOverride = null) => {
    const textToSend = textOverride || input.trim();
    if (textToSend === '' || isLoading || isDiagnosing) return;

    // Language Lock System: If language is locked, don't change it
    if (!languageLocked) {
      const userLang = detectLanguage(textToSend);
      setDetectedLanguage(userLang);
    }

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(currentMsgs => [...currentMsgs, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const result = await fetchAiResponse(userMessage.text, languageLocked ? language : detectedLanguage);
        const candidate = result.candidates?.[0];
        let aiText = T.error;

        if (candidate && candidate.content?.parts?.[0]?.text) {
            aiText = candidate.content.parts[0].text;
        }

        const aiResponse = {
            id: Date.now() + 1,
            text: aiText,
            isUser: false,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };
        
        setMessages(currentMsgs => [...currentMsgs, aiResponse]);

    } catch (error) {
        console.error("Gemini API call failed:", error);
        const errorMessage = {
            id: Date.now() + 1,
            text: T.error,
            isUser: false,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            isError: true,
        };
        setMessages(currentMsgs => [...currentMsgs, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [input, isLoading, isDiagnosing, languageLocked, language, detectedLanguage, T.error]);

  // Update ref whenever handleSend changes
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  // --- Theming Variables ---
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
    scrollbarThumb: isDarkMode ? '#374151' : '#b1d4a0', // Gray-700 or Light Green
  };


  const weatherCards = [
    { icon: <Compass className="w-5 h-5 text-green-300" />, label: `${weather.latitude}°N`, value: T.latitude },
    { icon: <Leaf className="w-5 h-5 text-green-300" />, label: weather.condition, value: T.fieldStatus },
    { icon: <Droplet className="w-5 h-5 text-green-300" />, label: weather.humidity, value: T.humidity },
    { icon: <Thermometer className="w-5 h-5 text-green-300" />, label: weather.temperature, value: T.temp },
  ];

  // Component for an individual chat bubble
  const ChatBubble = ({ msg }) => {
    const bubbleClass = msg.isUser
      ? 'bg-green-600 text-white rounded-br-sm shadow-green-900/50'
      : msg.isError
      ? `${theme.errorBg} ${theme.errorText} rounded-tl-sm shadow-red-900/50`
      : isDarkMode 
      ? 'bg-gray-700 text-gray-100 rounded-tl-sm shadow-gray-900/50'
      : 'bg-gray-100 text-gray-800 rounded-tl-sm shadow-gray-400/50';

    const timestampClass = msg.isUser
      ? 'text-green-200'
      : isDarkMode
      ? 'text-gray-400'
      : 'text-gray-500';

    return (
      <div
        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn w-full`}
      >
        <div
          className={`max-w-[85%] sm:max-w-[70%] p-2.5 sm:p-3 rounded-xl shadow-lg transition-all duration-300 text-sm sm:text-base font-medium ${bubbleClass}`}
        >
            {/* Display Image Preview if it's a diagnosis message */}
            {msg.image && (
              <div className="mb-3">
                <p className="text-sm font-semibold opacity-90 mb-2">{T.diagnosisTitle}:</p>
                <img src={msg.image} alt="Crop to be diagnosed" className="w-full max-h-48 object-cover rounded-lg shadow-md border border-white/20"/>
              </div>
            )}

          <div className={`break-words ${msg.isError ? 'font-bold' : ''} whitespace-pre-line`}>
            {msg.text.split('\n').map((line, idx) => {
              // Check if line starts with a number (numbered list)
              const isNumbered = /^\d+\.\s/.test(line.trim());
              return (
                <div 
                  key={idx} 
                  className={isNumbered ? 'ml-2 my-1' : line.trim() ? 'my-1' : 'h-2'}
                >
                  {line}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs block opacity-70 ${timestampClass}`}>
              {msg.timestamp}
            </span>
            {!msg.isUser && !msg.isError && (
              <button
                title={T.voiceIcon}
                onClick={() => handleReadAloud(msg.text, msg.id)}
                className={`p-1 sm:p-1.5 ml-2 rounded-full transition duration-150 active:scale-95 ${msg.isPlayingAudio ? 'bg-red-500 text-white' : 'bg-green-500/50 text-white hover:bg-green-500'}`}
              >
                {msg.isPlayingAudio ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Component for the Typing Indicator
  const TypingIndicator = ({ isDiagnosing }) => (
    <div className="flex justify-start animate-fadeIn">
      <div className={`flex items-center space-x-1 p-3 rounded-xl rounded-tl-sm shadow-lg ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800'}`}>
        <span className="text-sm font-medium text-green-400">
          {isDiagnosing ? T.diagnosing : T.typing}
        </span>
        <div className="flex space-x-0.5 ml-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );


  return (
    <div className={`min-h-screen ${theme.bg} ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center justify-center p-0 sm:p-4 font-sans safe-area-inset`}>
      
      {/* --- Main App Container (Glassmorphism) --- */}
      <div 
        className="w-full max-w-4xl rounded-none sm:rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-screen sm:h-[90vh] max-h-screen overflow-hidden border-0 sm:border border-green-700/50 transition-all duration-500"
        style={{
          backdropFilter: 'blur(10px) saturate(180%)',
          backgroundColor: theme.chatContainer,
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        }}
      >

        {/* --- Header (Title, Language, Theme Toggle) --- */}
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
                  setLanguageLocked(true); // Lock language when user manually selects
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
          </div>
        </div>

        {/* --- Weather Dashboard (Glassmorphism) --- */}
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
                    <div key={index} className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition duration-300 transform hover:scale-[1.02] shadow-md ${theme.dashCardBg} hover:bg-green-600/70`}>
                        {card.icon}
                        <div className="text-sm sm:text-lg font-bold mt-0.5 sm:mt-1 leading-tight">{card.label}</div>
                        <div className="text-[10px] sm:text-xs text-green-300 opacity-80">{card.value}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- Chat History Area --- */}
        <div className="relative flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-transparent via-transparent to-gray-900/10 custom-scrollbar min-h-0">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <Leaf className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Start chatting with your Digital Krishi Officer</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          {(isLoading || isDiagnosing) && <TypingIndicator isDiagnosing={isDiagnosing} />}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Scrollbar and Animation Styles */}
        <style jsx="true">{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 15s linear infinite;
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
          .mic-active {
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.8), 0 0 5px rgba(239, 68, 68, 1); /* Tailwind red-500 shadow */
          }
          /* Safe area insets for mobile devices */
          .safe-area-inset {
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
          }
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>

        {/* Camera Modal */}
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
                  <div className="w-16"></div> {/* Spacer */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Language Indicator - only show if not locked */}
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

        {/* --- Input Bar --- */}
        <div className="relative p-2 sm:p-4 bg-gray-800/80 border-t border-gray-700/50 flex items-center gap-1.5 sm:gap-3 flex-shrink-0 safe-area-bottom">
          {isRecording && (
              <div className="absolute left-0 right-0 -top-8 sm:-top-10 text-center text-xs sm:text-sm font-bold text-red-400 animate-pulse bg-gray-900/90 rounded-t-lg py-1 px-2 z-10">
                  {T.recording}
              </div>
          )}
          
          {/* Hidden File Input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Camera Button */}
          <button
            title="Take Photo with Camera"
            onClick={startCamera}
            className="p-2 sm:p-4 rounded-full shadow-lg transition duration-150 transform active:scale-95 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-green-500/50 flex-shrink-0 bg-gray-700 text-blue-400 hover:bg-gray-600"
            disabled={isLoading || isRecording || isDiagnosing || showCamera}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Image Upload Button */}
          <button
            title="Upload Crop Image from Gallery"
            onClick={() => imageInputRef.current?.click()}
            className={`p-2 sm:p-4 rounded-full shadow-lg transition duration-150 transform active:scale-95 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-green-500/50 flex-shrink-0 ${base64Image ? 'bg-green-500 text-white' : 'bg-gray-700 text-green-500 hover:bg-gray-600'}`}
            disabled={isLoading || isRecording || isDiagnosing || showCamera}
          >
            <Image className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <input
            type="text"
            className={`flex-1 min-w-0 p-2 sm:p-4 text-sm sm:text-base ${theme.inputBg} ${theme.inputText} ${theme.placeholder} rounded-full focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-green-500/50 transition duration-300 shadow-inner`}
            placeholder={base64Image ? T.diagnosisTitle : T.placeholder}
            value={base64Image ? T.diagnosisTitle : input}
            onChange={(e) => { 
              // Only allow text input if no image is pending
              if (!base64Image) setInput(e.target.value); 
            }}
            onKeyDown={handleKeyPress}
            disabled={isLoading || isRecording || isDiagnosing || !!base64Image}
          />

          <button
            onClick={base64Image ? handleImageDiagnosis : handleSend}
            className="p-2 sm:p-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-500 transition duration-150 ease-in-out transform active:scale-95 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            disabled={(input.trim() === '' && !base64Image) || isLoading || isRecording || isDiagnosing}
          >
            {(isLoading || isDiagnosing) ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          <button
            title={T.micButton}
            onClick={handleMicClick}
            className={`p-2 sm:p-4 rounded-full shadow-lg transition duration-150 transform active:scale-95 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-gray-500/50 flex-shrink-0 ${isRecording ? 'bg-red-500 text-white mic-active' : theme.micBg}`}
            disabled={isLoading || isDiagnosing}
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

        </div>
        
        {/* --- Footer / Attribution --- */}
        <div className={`text-center text-[10px] sm:text-xs p-1.5 sm:p-2 border-t border-gray-700/50 ${theme.footerBg} ${theme.footerText} flex-shrink-0`}>
            {T.footer(userId || 'Authenticating...', appId)}
        </div>
      </div>
    </div>
  );
};

export default App;
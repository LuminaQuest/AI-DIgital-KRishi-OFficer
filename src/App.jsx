import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Compass, Thermometer, Droplet, Wind, Send, Mic, RefreshCw, Loader2, Leaf, Sun, Moon, Image, Volume2 } from 'lucide-react';

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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [weather] = useState(MOCK_WEATHER_DATA);
  const [time, setTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false); // New state for image analysis
  const [userId, setUserId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // New state for theme
  const [base64Image, setBase64Image] = useState(null); // New state for image data
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // New state for image preview

  const messagesEndRef = useRef(null);
  const recognition = useRef(null);
  const audioContextRef = useRef(null); // Audio context for TTS
  const imageInputRef = useRef(null); // Ref for hidden file input

  // Get current translations based on selected language
  const T = TRANSLATIONS[language] || TRANSLATIONS.English;

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
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        setInput(transcript);

        if (result.isFinal) {
          setIsRecording(false);
          // Only send if the final result is confirmed
          setTimeout(() => handleSend(transcript), 100);
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsRecording(false);
      };
      
      // Ensures the state is reset even on natural ending (like silence timeout)
      recognition.current.onend = () => {
        setIsRecording(false);
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
            recognition.current.lang = getLanguageCode(language); // Ensure correct language
            recognition.current.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Error starting recognition:", e);
            setIsRecording(false);
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
    if (!base64Image || isDiagnosing) return;

    const userMessage = {
      id: Date.now(),
      text: T.diagnosisTitle,
      image: imagePreviewUrl,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(currentMsgs => [...currentMsgs, userMessage]);
    setIsDiagnosing(true);
    setBase64Image(null); // Clear image after starting analysis
    setImagePreviewUrl(null);

    const prompt = `Analyze this image of a plant/crop and tell me exactly what's wrong with it and what steps I should take. Please be specific about the possible plant species, disease, pest, or deficiency. Respond in the same language as the app's current interface (${language}).`;

    const systemPrompt = `You are an expert Agricultural Diagnostic AI Assistant (Digital Krishi Officer). Your task is to analyze the provided image of a crop, plant, or field. Identify the plant type (if possible), detect any signs of disease, pest infestation, or nutrient deficiency. Provide a concise but detailed analysis, including the likely problem, its causes, and actionable steps the farmer can take to remedy it. Respond in a very conversational, friendly tone. Do NOT use markdown lists, bold text, or headers, only plain conversational text.`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: base64Image.mimeType,
                            data: base64Image.data
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

  // --- Gemini API Call Function (with strict Persona enforcement) ---
  const fetchAiResponse = async (userPrompt) => {
    const apiUrl = TEXT_API_URL;

    const systemPrompt = `You are a Digital Krishi Officer. Your main user is a farmer.
    RULES:
    1. Respond in a natural, friendly, and conversational tone.
    2. Keep the language short, clear, and simple so any farmer can understand easily.
    3. STRICTLY AVOID using any markdown formatting like bullet points, lists, stars (*), or bold text.
    4. If the farmer asks about a crop, use a guiding and respectful tone.
    5. You must use Google Search grounding for real-time information.
    6. Respond in the same language as the farmer's query (auto-detect the language).`;

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

  // --- Core Message Sending Logic ---
  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || input.trim();
    if (textToSend === '' || isLoading || isDiagnosing) return;

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
        const result = await fetchAiResponse(userMessage.text);
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
  };

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
        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
      >
        <div
          className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl shadow-lg transition-all duration-300 text-base font-medium ${bubbleClass}`}
        >
            {/* Display Image Preview if it's a diagnosis message */}
            {msg.image && (
              <div className="mb-3">
                <p className="text-sm font-semibold opacity-90 mb-2">{T.diagnosisTitle}:</p>
                <img src={msg.image} alt="Crop to be diagnosed" className="w-full max-h-48 object-cover rounded-lg shadow-md border border-white/20"/>
              </div>
            )}

          <p className={`break-words ${msg.isError ? 'font-bold' : ''}`}>{msg.text}</p>
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs block opacity-70 ${timestampClass}`}>
              {msg.timestamp}
            </span>
            {!msg.isUser && !msg.isError && (
              <button
                title={T.voiceIcon}
                onClick={() => handleReadAloud(msg.text, msg.id)}
                className={`p-1 ml-2 rounded-full transition duration-150 ${msg.isPlayingAudio ? 'bg-red-500 text-white' : 'bg-green-500/50 text-white hover:bg-green-500'}`}
              >
                {msg.isPlayingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
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
    <div className={`min-h-screen ${theme.bg} ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center justify-center p-2 sm:p-4 font-sans`}>
      
      {/* --- Main App Container (Glassmorphism) --- */}
      <div 
        className="w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col h-[96vh] sm:h-[90vh] overflow-hidden border border-green-700/50 transition-all duration-500"
        style={{
          backdropFilter: 'blur(10px) saturate(180%)',
          backgroundColor: theme.chatContainer,
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        }}
      >

        {/* --- Header (Title, Language, Theme Toggle) --- */}
        <div className={`${theme.headerBg} p-4 sm:p-5 rounded-t-3xl flex justify-between items-center shadow-xl transition-all duration-500`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-spin-slow" />
            <h1 className={`text-lg sm:text-2xl font-extrabold ${theme.headerText} tracking-wide leading-tight ${language !== 'English' ? 'text-xl sm:text-3xl' : ''}`}>
              {T.title}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full text-white bg-green-600/70 hover:bg-green-500/80 transition duration-200"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <select
              className="bg-green-600/70 text-white text-sm sm:text-base p-2 rounded-xl cursor-pointer transition duration-200 ease-in-out hover:bg-green-500/80 focus:ring-2 focus:ring-green-400 focus:outline-none"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {Object.keys(TRANSLATIONS).map(lang => (
                  <option key={lang} value={lang}>{TRANSLATIONS[lang].language}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Weather Dashboard (Glassmorphism) --- */}
        <div 
          className={`p-3 sm:p-4 shadow-inner border-b border-green-700/50 transition-all duration-500 ${theme.dashBg} ${theme.dashText}`}
          style={{
            backdropFilter: 'blur(8px) saturate(150%)',
            WebkitBackdropFilter: 'blur(8px) saturate(150%)',
          }}
        >
            <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-3 border-b border-green-700/50 pb-2">
                <div className="flex items-center space-x-1 text-green-200">
                    <Compass className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{weather.location}</span>
                </div>
                <div className="text-green-200 font-mono">{time}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-white text-center">
                {weatherCards.map((card, index) => (
                    <div key={index} className={`flex flex-col items-center justify-center p-2 rounded-xl transition duration-300 transform hover:scale-[1.02] shadow-md ${theme.dashCardBg} hover:bg-green-600/70`}>
                        {card.icon}
                        <div className="text-base sm:text-lg font-bold mt-1 leading-tight">{card.label}</div>
                        <div className="text-xs text-green-300 opacity-80">{card.value}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- Chat History Area --- */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-transparent custom-scrollbar">
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
            width: 8px;
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
        `}</style>

        {/* --- Input Bar --- */}
        <div className="relative p-3 sm:p-4 bg-gray-800/80 border-t border-gray-700/50 flex items-center space-x-2 sm:space-x-3">
          {isRecording && (
              <div className="absolute left-0 right-0 -top-10 text-center text-sm font-bold text-red-400 animate-pulse bg-gray-900/90 rounded-t-lg py-1">
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

          {/* Image Upload Button */}
          <button
            title="Upload Crop Image for Diagnosis"
            onClick={() => imageInputRef.current?.click()}
            className={`p-3 sm:p-4 rounded-full shadow-lg transition duration-150 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-500/50 ${base64Image ? 'bg-green-500 text-white' : 'bg-gray-700 text-green-500 hover:bg-gray-600'}`}
            disabled={isLoading || isRecording || isDiagnosing}
          >
            <Image className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            className={`flex-1 p-3 sm:p-4 text-base ${theme.inputBg} ${theme.inputText} ${theme.placeholder} rounded-full focus:outline-none focus:ring-4 focus:ring-green-500/50 transition duration-300 shadow-inner`}
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
            className="p-3 sm:p-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-500 transition duration-150 ease-in-out transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(input.trim() === '' && !base64Image) || isLoading || isRecording || isDiagnosing}
          >
            {(isLoading || isDiagnosing) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
          
          <button
            title={T.micButton}
            onClick={handleMicClick}
            className={`p-3 sm:p-4 rounded-full shadow-lg transition duration-150 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-500/50 ${isRecording ? 'bg-red-500 text-white mic-active' : theme.micBg}`}
            disabled={isLoading || isDiagnosing}
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            title={T.clearButton}
            onClick={() => setMessages([{
                id: Date.now(),
                text: T.welcome,
                isUser: false,
                timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            }])}
            className="p-3 sm:p-4 bg-gray-700 text-red-500 rounded-full shadow-lg hover:bg-gray-600 transition duration-150 transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-500/50"
            disabled={isLoading || isRecording || isDiagnosing}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        {/* --- Footer / Attribution --- */}
        <div className={`text-center text-xs p-2 border-t border-gray-700/50 ${theme.footerBg} ${theme.footerText}`}>
            {T.footer(userId || 'Authenticating...', appId)}
        </div>
      </div>
    </div>
  );
};

export default App;

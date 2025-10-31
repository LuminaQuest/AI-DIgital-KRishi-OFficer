import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// IMPORTANT: These global variables are provided by the hosting environment.
// We check for them and prepare the Firebase configuration object.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Pass the Firebase config to the main App component */}
    <App firebaseConfig={firebaseConfig} />
  </React.StrictMode>,
)

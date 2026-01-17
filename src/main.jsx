import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import './index.css'
import App from './App.jsx'

// Use current window location to construct manifest URL dynamically
// This ensures it works on Localhost, IP, Ngrok, etc. automatically
const manifestUrl = `${window.location.protocol}//${window.location.host}/tonconnect-manifest.json`;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import './index.css'
import App from './App.jsx'

// Use current window location to construct manifest URL dynamically
// This ensures it works on Localhost, IP, Ngrok, etc. automatically
// Use a public manifest to avoid Localtunnel/Ngrok blocking issues
const manifestUrl = 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json';
const testnetWalletList = 'https://ton-connect.github.io/wallets-list/tonconnect-testnet.json';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      walletsListSource={testnetWalletList}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TonConnectUIProvider>
  </StrictMode>,
)

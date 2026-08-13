import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App.jsx'
import { EntraAuthProvider, UnavailableAuthProvider } from './auth/AuthContext'
import { createMsalInstance } from './auth/msalConfig'

const msalInstance = createMsalInstance()

const application = msalInstance ? (
  <MsalProvider instance={msalInstance}>
    <EntraAuthProvider>
      <App />
    </EntraAuthProvider>
  </MsalProvider>
) : (
  <UnavailableAuthProvider>
    <App />
  </UnavailableAuthProvider>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {application}
  </StrictMode>,
)

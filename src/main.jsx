import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import { SiteProvider } from './site/SiteProvider.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <SiteProvider>
        <App />
      </SiteProvider>
    </HelmetProvider>
  </React.StrictMode>,
)

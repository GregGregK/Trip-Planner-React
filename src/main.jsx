// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css' // ajuste o nome se seu CSS global tiver outro nome/caminho

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
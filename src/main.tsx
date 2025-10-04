import './styles/pliiiz-theme.css'; // Thème principal — doit être chargé en premier
import './index.css';               // Base & reset
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

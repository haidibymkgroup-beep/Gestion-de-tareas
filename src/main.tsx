import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/wght.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { ConfigFaltante } from './components/ConfigFaltante';
import { configurado } from './lib/env';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>{configurado ? <App /> : <ConfigFaltante />}</StrictMode>,
);

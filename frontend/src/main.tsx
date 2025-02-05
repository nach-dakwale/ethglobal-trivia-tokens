import { Buffer } from 'buffer';
import process from 'process';

window.global = window;
window.Buffer = Buffer;
window.process = process;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ColorModeScript } from '@chakra-ui/react';
import App from './App';
import theme from './theme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App />
  </React.StrictMode>,
);

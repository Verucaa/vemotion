import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { PenyediaBahasa } from './intl';
import './gaya.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PenyediaBahasa>
      <App />
    </PenyediaBahasa>
  </StrictMode>,
);

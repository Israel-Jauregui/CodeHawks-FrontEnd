import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = document.getElementById('root')!;
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// The production build is prerendered (scripts/prerender.mjs); the dev server's page is not.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}

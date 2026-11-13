import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function main() {
  const ls = window.localStorage;
  console.log('main', ls.getItem('theme'));
  if (ls.getItem('theme')) {
    applyTheme(ls.getItem('theme'));
  }
}

document.addEventListener('DOMContentLoaded', main);

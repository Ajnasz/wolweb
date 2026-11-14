import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeSwitcher } from './ThemeSwitcher.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

createRoot(document.getElementById('theme-switcher')).render(
  <StrictMode>
    <ThemeSwitcher />
  </StrictMode>
);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.removeAttribute('data-color-theme');
  document.documentElement.style.setProperty('--base-color', '');
}

function applyColorTheme(color) {
  document.documentElement.setAttribute('data-color-theme', color);
  document.documentElement.style.setProperty('--base-color', color);
  document.documentElement.removeAttribute('data-theme');
}

function main() {
  const ls = window.localStorage;
  const theme = ls.getItem('theme');
  if (theme === 'custom') {
    applyColorTheme(ls.getItem('color-theme') || '#4f7fd0');
  } else if (theme) {
    applyTheme(theme);
  }
}

document.addEventListener('DOMContentLoaded', main);

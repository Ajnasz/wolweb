import React, { useState, useEffect } from 'react';
export function ThemeSwitcher() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || '');
  const [color, setColor] = useState(localStorage.getItem('color-theme') || '#4f7fd0');
  const [collapsed, setCollapsed] = useState(localStorage.getItem('theme-switcher-collapsed') === 'true');
  const THEMES = [
    'stone',
    'mist',
    'custom',
  ];

  useEffect(() => {
    if (theme === 'custom') {
      document.documentElement.setAttribute('data-color-theme', color);
      document.documentElement.style.setProperty('--base-color', color);
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', theme);
      localStorage.setItem('color-theme', color);
    } else if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.removeAttribute('data-color-theme');
      document.documentElement.style.removeProperty('--base-color');
      localStorage.setItem('theme', theme);
      localStorage.removeItem('color-theme');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-color-theme');
      document.documentElement.style.removeProperty('--base-color');
      localStorage.removeItem('theme');
      localStorage.removeItem('color-theme');
    }
  });

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  }

  const handleColorChange = (event) => {
    setColor(event.target.value);
  }

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('theme-switcher-collapsed', String(!prev));
      return !prev;
    });
  }

  if (collapsed) {
    return (
      <div className="theme-switcher collapsed">
        <button
          className="theme-switcher-toggle"
          onClick={toggleCollapsed}
          title="Show theme switcher"
          aria-label="Show theme switcher"
          aria-expanded="false"
        >
          &#9664;
        </button>
      </div>
    );
  }

  return (
    <div className="theme-switcher flex items-center gap-2 flex-col">
      <div className="theme-select flex items-center gap-2">
        <button
          className="text-sm px-2 py-1 text-page-text border-accent cursor-pointer"
          onClick={toggleCollapsed}
          title="Hide theme switcher"
          aria-label="Hide theme switcher"
          aria-expanded="true"
        >
          &#9654;
        </button>
        <label htmlFor="theme-select">Theme:</label>
        <select id="theme-select" value={theme} onChange={handleThemeChange}
          className="text-sm px-3 py-1 pr-8 border rounded-sm bg-surface text-page-text border-accent cursor-pointer;"
        >
          <option value="">System</option>
          {THEMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      {theme === 'custom' && (
        <input
          id="color-picker"
          className="w-full h-4 md:h-8"
          type="color"
          value={color}
          onChange={handleColorChange}
          aria-label="Base color"
        />
      )}
    </div>
  );
}

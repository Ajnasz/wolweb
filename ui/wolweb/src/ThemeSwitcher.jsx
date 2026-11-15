import React, { useState, useEffect, useCallback } from 'react';

function ThemeSwitcherToggleButton({ toggleCollapsed, expanded }) {
  const className = expanded === "true" ? '' : "opacity-50 hover:opacity-100";
  return <button
    className={`size-10 flex items-center justify-center rounded-full text-xl text-page-text opacity-40 hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100 cursor-pointer transition-opacity focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    onClick={toggleCollapsed}
    title="Hide theme switcher"
    aria-label="Hide theme switcher"
    aria-expanded={expanded}
  >
    &#9680;
  </button>
}
export function ThemeSwitcher() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || '');
  const [color, setColor] = useState(localStorage.getItem('color-theme') || '#4f7fd0');
  const [collapsed, setCollapsed] = useState(true);
  const THEMES = [
    'stone',
    'mist',
    'custom',
  ];
   const escFunction = useCallback((event) => {
    if (event.key === "Escape") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);

    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, [escFunction]);

  useEffect(() => {
    const body = document.documentElement;
    const ls = localStorage;
    if (theme === 'custom') {
      body.setAttribute('data-color-theme', color);
      body.style.setProperty('--base-color', color);
      body.removeAttribute('data-theme');
      ls.setItem('theme', theme);
      ls.setItem('color-theme', color);
    } else if (theme) {
      body.setAttribute('data-theme', theme);
      body.removeAttribute('data-color-theme');
      body.style.removeProperty('--base-color');
      ls.setItem('theme', theme);
    } else {
      body.removeAttribute('data-theme');
      body.removeAttribute('data-color-theme');
      body.style.removeProperty('--base-color');
      ls.removeItem('theme');
    }
  }, [theme, color]);

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  }

  const handleColorChange = (event) => {
    setColor(event.target.value);
  }

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      return !prev;
    });
  }

  if (collapsed) {
    return (
      <div className="theme-switcher collapsed">
        <ThemeSwitcherToggleButton toggleCollapsed={toggleCollapsed} expanded="false" />
      </div>
    );
  }

  return (
    <div className="theme-switcher flex items-center gap-2 flex-col">
      <div className="theme-select flex items-center gap-2">
        <ThemeSwitcherToggleButton toggleCollapsed={toggleCollapsed} expanded="true" />
        <div id="theme-switcher-panel" className="theme-switcher-panel absolute right-0 top-full z-10 mt-1 mr-1 w-56 flex flex-col gap-2 p-3 rounded-md bg-surface ring ring-card-ring shadow-md shadow-card-ring">
          <label htmlFor="theme-select" className="text-sm text-muted">Theme:</label>
          <select id="theme-select" value={theme} onChange={handleThemeChange}
            className="text-sm px-3 py-1 pr-8 border rounded-sm bg-surface text-page-text border-accent cursor-pointer;
            "
          >
            <option value="">System</option>
            {THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
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
      </div>
    </div>
  );
}

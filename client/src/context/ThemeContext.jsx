import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'chat-app-theme';
const EFFECTS_STORAGE_KEY = 'chat-app-ambient-effects';
const AMBIENT_VARIANT_KEY = 'chat-app-ambient-variant';

export const AMBIENT_EFFECTS = [
  {
    id: 'water',
    name: 'Elemental Water',
    description: 'ThreeUI WebGL2 ripples, cyan depth & suspended particles',
    tag: 'WebGL2'
  },
  {
    id: 'aurora',
    name: 'Aurora Glow',
    description: 'Harmonious cosmic light orbs & soft floating stardust',
    tag: 'Canvas 2D'
  }
];

export const THEMES = [
  {
    id: 'light',
    name: 'Light',
    tagline: 'Clean Mint & Slate',
    icon: 'Sun',
    colors: ['#0d9488', '#f0fdfa', '#ffffff'],
    badgeColor: 'text-teal-600 bg-teal-50 border-teal-200'
  },
  {
    id: 'dark',
    name: 'Dark',
    tagline: 'Midnight Emerald',
    icon: 'Moon',
    colors: ['#0d9488', '#072420', '#031714'],
    badgeColor: 'text-teal-400 bg-teal-950/80 border-teal-800'
  },
  {
    id: 'anime',
    name: 'Anime',
    tagline: 'Sakura & Dreamy Lavender',
    icon: 'Sparkles',
    colors: ['#ec4899', '#a855f7', '#180b24'],
    badgeColor: 'text-pink-400 bg-pink-950/80 border-pink-800'
  },
  {
    id: 'nostalgic',
    name: 'Nostalgic',
    tagline: 'Retro Synthwave & Arcade',
    icon: 'Gamepad2',
    colors: ['#f59e0b', '#ec4899', '#06b6d4'],
    badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-800'
  }
];

const VALID_THEMES = THEMES.map((t) => t.id);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (VALID_THEMES.includes(savedTheme)) {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      // Fallback
    }
    return 'dark'; // Default theme
  });

  // Ambient effects state (off by default)
  const [effectsEnabled, setEffectsEnabledState] = useState(() => {
    try {
      return localStorage.getItem(EFFECTS_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Ambient variant state ('water' or 'aurora')
  const [ambientVariant, setAmbientVariantState] = useState(() => {
    try {
      const saved = localStorage.getItem(AMBIENT_VARIANT_KEY);
      if (saved === 'aurora' || saved === 'water') return saved;
    } catch (e) {
      // Fallback
    }
    return 'water';
  });

  // Synchronize <html> root classes, data-theme attribute and localStorage
  useEffect(() => {
    const root = document.documentElement;

    // Set data-theme attribute
    root.setAttribute('data-theme', theme);

    // Clean up theme class names
    VALID_THEMES.forEach((t) => {
      root.classList.remove(`theme-${t}`);
    });
    root.classList.add(`theme-${theme}`);

    // Manage standard dark mode class
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  }, [theme]);

  // Synchronize effects preference with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EFFECTS_STORAGE_KEY, effectsEnabled ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save effects preference:', e);
    }
  }, [effectsEnabled]);

  // Synchronize ambient variant with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AMBIENT_VARIANT_KEY, ambientVariant);
    } catch (e) {
      console.error('Failed to save ambient variant:', e);
    }
  }, [ambientVariant]);

  // Cycle through all 4 themes in order
  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      const currentIndex = VALID_THEMES.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % VALID_THEMES.length;
      return VALID_THEMES[nextIndex];
    });
  };

  const setTheme = (newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const toggleEffects = () => {
    setEffectsEnabledState((prev) => !prev);
  };

  const setEffectsEnabled = (enabled) => {
    setEffectsEnabledState(!!enabled);
  };

  const setAmbientVariant = (variant) => {
    if (variant === 'water' || variant === 'aurora') {
      setAmbientVariantState(variant);
    }
  };

  const isDark = theme !== 'light';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark,
        themes: THEMES,
        effectsEnabled,
        toggleEffects,
        setEffectsEnabled,
        ambientVariant,
        setAmbientVariant,
        ambientEffects: AMBIENT_EFFECTS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

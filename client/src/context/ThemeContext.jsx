import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'chat-app-theme';
const EFFECTS_STORAGE_KEY = 'chat-app-ambient-effects';
const AMBIENT_VARIANT_KEY = 'chat-app-ambient-variant';
const ACCENTS_STORAGE_KEY = 'chat-app-theme-accents';

export const AMBIENT_EFFECTS = [
  {
    id: 'aurora',
    name: 'Aurora Glow',
    description: 'Harmonious cosmic light orbs & soft floating stardust',
    tag: 'Canvas 2D'
  }
];

export const DEFAULT_THEME_ACCENTS = {
  light: '#0d9488',
  dark: '#0d9488',
  anime: '#ec4899',
  nostalgic: '#06b6d4'
};

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
    colors: ['#06b6d4', '#ec4899', '#f59e0b'],
    badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-800'
  }
];

export const CURATED_ACCENTS = [
  { id: 'teal', name: 'Emerald Teal', hex: '#0d9488' },
  { id: 'cyan', name: 'Electric Cyan', hex: '#06b6d4' },
  { id: 'blue', name: 'Royal Sky', hex: '#0284c7' },
  { id: 'indigo', name: 'Indigo Dream', hex: '#6366f1' },
  { id: 'purple', name: 'Mystic Purple', hex: '#8b5cf6' },
  { id: 'pink', name: 'Sakura Pink', hex: '#ec4899' },
  { id: 'rose', name: 'Crimson Rose', hex: '#f43f5e' },
  { id: 'amber', name: 'Amber Gold', hex: '#f59e0b' },
  { id: 'orange', name: 'Sunset Orange', hex: '#f97316' },
  { id: 'emerald', name: 'Neon Green', hex: '#10b981' }
];

const VALID_THEMES = THEMES.map((t) => t.id);

// --- Color & Contrast Utilities ---

/**
 * Converts Hex string to RGB object
 */
export const hexToRgb = (hex) => {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 13, g: 148, b: 136 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

/**
 * Converts RGB to Hex string
 */
export const rgbToHex = (r, g, b) => {
  const clamp = (val) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, '0')).join('');
};

/**
 * Converts RGB to HSL
 */
export const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

/**
 * Converts HSL to Hex
 */
export const hslToHex = (h, s, l) => {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

/**
 * Calculates relative luminance for WCAG contrast checks
 */
export const getRelativeLuminance = ({ r, g, b }) => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Safeguard: Clamps saturation and lightness to ensure WCAG AA contrast for text on accent
 */
export const clampAccentForContrast = (hex, isDarkTheme = true) => {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Saturation clamped to lively range
  const safeS = Math.min(95, Math.max(65, hsl.s));

  // Lightness clamped so white text remains readable (or dark text in light mode)
  // For dark themes: 44% - 58% lightness; for light theme: 36% - 50% lightness
  const minL = isDarkTheme ? 42 : 35;
  const maxL = isDarkTheme ? 58 : 48;
  const safeL = Math.min(maxL, Math.max(minL, hsl.l));

  return hslToHex(hsl.h, safeS, safeL);
};

/**
 * Derives comprehensive palette shades for CSS variables from an accent hex
 */
export const deriveAccentPalette = (hex, isDarkTheme = true) => {
  const safeHex = clampAccentForContrast(hex, isDarkTheme);
  const rgb = hexToRgb(safeHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const lum = getRelativeLuminance(rgb);

  // Hover variant: slightly lighter in dark, slightly darker in light
  const hoverHsl = {
    h: hsl.h,
    s: hsl.s,
    l: isDarkTheme ? Math.min(70, hsl.l + 8) : Math.max(25, hsl.l - 8)
  };
  const hoverHex = hslToHex(hoverHsl.h, hoverHsl.s, hoverHsl.l);

  // Gradient 2 & 3
  const grad2Hsl = { h: (hsl.h + 25) % 360, s: hsl.s, l: hsl.l };
  const grad3Hsl = { h: (hsl.h + 50) % 360, s: Math.min(90, hsl.s + 5), l: Math.min(65, hsl.l + 5) };
  const grad2Hex = hslToHex(grad2Hsl.h, grad2Hsl.s, grad2Hsl.l);
  const grad3Hex = hslToHex(grad3Hsl.h, grad3Hsl.s, grad3Hsl.l);

  // Text contrast on top of accent
  const contrastText = lum > 0.45 ? '#0f172a' : '#ffffff';

  return {
    accent: safeHex,
    accentHover: hoverHex,
    accentMuted: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.16)`,
    accentSubtle: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
    accentBorder: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
    accentGlow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`,
    accentContrast: contrastText,
    grad1: safeHex,
    grad2: grad2Hex,
    grad3: grad3Hex,
    gradGlow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`
  };
};

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

  // Custom accent overrides per theme: { light: hex|null, dark: hex|null, anime: hex|null, nostalgic: hex|null }
  const [themeAccents, setThemeAccentsState] = useState(() => {
    try {
      const saved = localStorage.getItem(ACCENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            light: parsed.light || null,
            dark: parsed.dark || null,
            anime: parsed.anime || null,
            nostalgic: parsed.nostalgic || null
          };
        }
      }
    } catch (e) {
      // Fallback
    }
    return { light: null, dark: null, anime: null, nostalgic: null };
  });

  // Ambient effects state (off by default)
  const [effectsEnabled, setEffectsEnabledState] = useState(() => {
    try {
      return localStorage.getItem(EFFECTS_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Ambient variant state ('aurora')
  const [ambientVariant, setAmbientVariantState] = useState(() => {
    try {
      const saved = localStorage.getItem(AMBIENT_VARIANT_KEY);
      if (saved === 'aurora') return saved;
    } catch (e) {
      // Fallback
    }
    return 'aurora';
  });

  const isDark = theme !== 'light';

  // Current active accent hex (custom override or default built-in for this theme)
  const currentAccent = useMemo(() => {
    return themeAccents[theme] || DEFAULT_THEME_ACCENTS[theme] || '#0d9488';
  }, [theme, themeAccents]);

  const isCustomAccent = Boolean(themeAccents[theme]);

  // Synchronize <html> root classes, data-theme attribute, and localStorage
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

  // Synchronize dynamic CSS custom properties for accent colors on <html>
  useEffect(() => {
    const root = document.documentElement;
    const palette = deriveAccentPalette(currentAccent, isDark);

    root.style.setProperty('--color-accent', palette.accent);
    root.style.setProperty('--color-accent-hover', palette.accentHover);
    root.style.setProperty('--color-accent-muted', palette.accentMuted);
    root.style.setProperty('--color-accent-subtle', palette.accentSubtle);
    root.style.setProperty('--color-accent-border', palette.accentBorder);
    root.style.setProperty('--color-accent-contrast', palette.accentContrast);
    root.style.setProperty('--color-accent-glow', palette.accentGlow);

    root.style.setProperty('--primary', palette.accent);
    root.style.setProperty('--primary-hover', palette.accentHover);
    root.style.setProperty('--grad-1', palette.grad1);
    root.style.setProperty('--grad-2', palette.grad2);
    root.style.setProperty('--grad-3', palette.grad3);
    root.style.setProperty('--grad-glow', palette.gradGlow);
  }, [currentAccent, isDark]);

  // Synchronize theme accents preference with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACCENTS_STORAGE_KEY, JSON.stringify(themeAccents));
    } catch (e) {
      console.error('Failed to save accent preferences:', e);
    }
  }, [themeAccents]);

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

  // Set custom accent override for current (or specified) theme
  const setThemeAccent = (accentHex, targetTheme = theme) => {
    if (!accentHex || !VALID_THEMES.includes(targetTheme)) return;
    setThemeAccentsState((prev) => ({
      ...prev,
      [targetTheme]: accentHex
    }));
  };

  // Reset custom accent override for current (or specified) theme to built-in default
  const resetThemeAccent = (targetTheme = theme) => {
    if (!VALID_THEMES.includes(targetTheme)) return;
    setThemeAccentsState((prev) => ({
      ...prev,
      [targetTheme]: null
    }));
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

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark,
        themes: THEMES,
        themeAccents,
        currentAccent,
        isCustomAccent,
        setThemeAccent,
        resetThemeAccent,
        curatedAccents: CURATED_ACCENTS,
        defaultAccents: DEFAULT_THEME_ACCENTS,
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


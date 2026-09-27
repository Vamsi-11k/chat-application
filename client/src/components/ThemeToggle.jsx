import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Gamepad2,
  Check,
  Palette,
  Wand2,
  RotateCcw,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import {
  useTheme,
  THEMES,
  CURATED_ACCENTS,
  hexToRgb,
  rgbToHsl,
  hslToHex,
  clampAccentForContrast
} from '../context/ThemeContext';

export const ThemeToggle = ({
  className = '',
  size = 18,
  showLabel = false,
  align = 'right', // 'right' | 'left'
  direction = 'bottom' // 'bottom' | 'top'
}) => {
  const {
    theme,
    setTheme,
    isDark,
    currentAccent,
    isCustomAccent,
    setThemeAccent,
    resetThemeAccent,
    curatedAccents = CURATED_ACCENTS,
    defaultAccents,
    effectsEnabled,
    toggleEffects,
    ambientVariant,
    setAmbientVariant
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [showCustomHue, setShowCustomHue] = useState(false);
  const dropdownRef = useRef(null);

  // Derive active hue (0-360) from current accent
  const currentHue = useMemo(() => {
    const rgb = hexToRgb(currentAccent);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.h;
  }, [currentAccent]);

  const [hueValue, setHueValue] = useState(currentHue);

  // Sync internal hue slider when theme or currentAccent changes
  useEffect(() => {
    setHueValue(currentHue);
  }, [currentHue, theme]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const defaultAccentForTheme = defaultAccents?.[theme] || '#0d9488';

  const renderIcon = (iconName, iconSize = size) => {
    switch (iconName) {
      case 'Sun':
        return <Sun size={iconSize} className="text-amber-500 transition-transform duration-200" />;
      case 'Moon':
        return <Moon size={iconSize} className="text-teal-400 transition-transform duration-200" />;
      case 'Sparkles':
        return <Sparkles size={iconSize} className="text-pink-400 transition-transform duration-200 animate-pulse" />;
      case 'Gamepad2':
        return <Gamepad2 size={iconSize} className="text-amber-400 transition-transform duration-200" />;
      default:
        return <Palette size={iconSize} className="text-teal-500" />;
    }
  };

  const handleHueChange = (e) => {
    const newHue = parseInt(e.target.value, 10);
    setHueValue(newHue);
    // Lightness clamped for guaranteed text contrast
    const targetL = isDark ? 52 : 42;
    const rawHex = hslToHex(newHue, 85, targetL);
    const safeHex = clampAccentForContrast(rawHex, isDark);
    setThemeAccent(safeHex);
  };

  const isCurrentAccentInCurated = curatedAccents.some(
    (c) => c.hex.toLowerCase() === currentAccent.toLowerCase()
  );

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Main Toggle / Picker Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Current theme: ${currentThemeObj.name}. Click to change theme, accent color, or effects.`}
        aria-label={`Current theme: ${currentThemeObj.name}. Click to change theme, accent color, or effects.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#092a25] transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${className}`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          {renderIcon(currentThemeObj.icon, size)}
          {effectsEnabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          )}
          {isCustomAccent && !effectsEnabled && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-[#09211d]"
              style={{ backgroundColor: currentAccent }}
            />
          )}
        </div>

        {showLabel && (
          <span className="ml-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-200">
            {currentThemeObj.name}
          </span>
        )}
      </button>

      {/* Floating Theme Selection & Settings Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Theme selector"
          className={`absolute z-50 w-72 sm:w-80 max-h-[85vh] overflow-y-auto p-3 rounded-2xl bg-white/95 dark:bg-[#09211d]/95 backdrop-blur-xl border border-teal-100 dark:border-[#103a33] shadow-2xl shadow-slate-950/20 dark:shadow-black/60 animate-scaleUp scrollbar-thin ${
            direction === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${align === 'left' ? 'left-0' : 'right-0'}`}
        >
          {/* ================================================================= */}
          {/* SECTION 1: THEME STYLE (4 PRESETS)                                */}
          {/* ================================================================= */}
          <div className="px-1 py-1 mb-1 border-b border-slate-100 dark:border-[#133e37] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-teal-400/80 flex items-center space-x-1.5">
              <Palette size={12} className="inline mr-1" />
              Theme Style
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#0d2e28] text-slate-500 dark:text-teal-300 font-medium">
              4 Presets
            </span>
          </div>

          <div className="space-y-1">
            {THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setTheme(t.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 group ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-[#0f3d37] text-teal-900 dark:text-teal-100 font-semibold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0d2a25] font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                        isSelected
                          ? 'bg-teal-600/15 dark:bg-teal-400/15'
                          : 'bg-slate-100 dark:bg-[#071d19]'
                      }`}
                    >
                      {renderIcon(t.icon, 15)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs leading-tight">{t.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal leading-tight">
                        {t.tagline}
                      </span>
                    </div>
                  </div>

                  {/* Swatch dots and active indicator */}
                  <div className="flex items-center space-x-1.5">
                    <div className="flex -space-x-1">
                      {t.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full border border-white dark:border-[#09211d]"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-teal-600 dark:text-teal-400 shrink-0 ml-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ================================================================= */}
          {/* SECTION 2: ACCENT COLOR PERSONALIZATION                           */}
          {/* ================================================================= */}
          <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-[#133e37]">
            <div className="px-1 py-1 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-teal-400/80 flex items-center space-x-1.5">
                <Sliders size={12} className="inline mr-1" />
                Accent Hue
              </span>

              {/* Reset to Default Button */}
              {isCustomAccent ? (
                <button
                  type="button"
                  onClick={() => {
                    resetThemeAccent();
                    setShowCustomHue(false);
                  }}
                  className="text-[10px] text-teal-600 dark:text-teal-300 hover:underline flex items-center space-x-1 font-medium bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded-md transition-colors"
                  title="Revert to preset default accent for this theme"
                >
                  <RotateCcw size={10} className="mr-0.5" />
                  Reset default
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  Default: {defaultAccentForTheme}
                </span>
              )}
            </div>

            {/* Curated Swatches Grid */}
            <div className="grid grid-cols-6 gap-2 px-1 py-1">
              {curatedAccents.map((swatch) => {
                const isSelected =
                  currentAccent.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    title={`${swatch.name} (${swatch.hex})`}
                    aria-label={`Select ${swatch.name} accent`}
                    onClick={() => {
                      setThemeAccent(swatch.hex);
                    }}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 transform hover:scale-115 active:scale-95 shadow-sm ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#09211d] ring-slate-800 dark:ring-white scale-105'
                        : 'hover:opacity-90'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {isSelected && (
                      <Check size={14} className="text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                );
              })}

              {/* Custom Hue Toggle Swatch */}
              <button
                type="button"
                title="Custom Hue Slider"
                aria-label="Open custom hue slider"
                onClick={() => setShowCustomHue((prev) => !prev)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 transform hover:scale-115 active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700 ${
                  showCustomHue || (!isCurrentAccentInCurated && isCustomAccent)
                    ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#09211d] ring-teal-500 scale-105'
                    : ''
                }`}
                style={{
                  background:
                    'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
              >
                <span className="w-5 h-5 rounded-full bg-white dark:bg-[#09211d] flex items-center justify-center shadow-xs">
                  <Sliders size={11} className="text-slate-700 dark:text-slate-200" />
                </span>
              </button>
            </div>

            {/* Custom Hue Slider & Contrast Safeguard Area */}
            {showCustomHue && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#071d19]/80 border border-slate-200/80 dark:border-[#14423a] space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                    <span
                      className="w-3 h-3 rounded-full inline-block mr-1.5 shadow-xs border border-white/50"
                      style={{ backgroundColor: currentAccent }}
                    />
                    Custom Hue ({hueValue}°)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {currentAccent.toUpperCase()}
                  </span>
                </div>

                {/* 0-360° Hue Slider */}
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hueValue}
                  onChange={handleHueChange}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  style={{
                    background:
                      'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                  }}
                />

                {/* Contrast Safeguard Notice */}
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-teal-400/80 pt-0.5">
                  <ShieldCheck size={12} className="text-teal-500 shrink-0" />
                  <span>Auto-clamped for WCAG AA contrast & readability</span>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECTION 3: AMBIENT VISUAL EFFECTS                                 */}
          {/* ================================================================= */}
          <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-[#133e37]">
            <button
              type="button"
              onClick={() => toggleEffects()}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 group ${
                effectsEnabled
                  ? 'bg-teal-50/80 dark:bg-[#0f3d37]/80 text-teal-900 dark:text-teal-100 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0d2a25] font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                    effectsEnabled
                      ? 'bg-teal-600/15 dark:bg-teal-400/15 text-teal-600 dark:text-teal-400'
                      : 'bg-slate-100 dark:bg-[#071d19] text-slate-400'
                  }`}
                >
                  <Wand2 size={15} className={effectsEnabled ? 'animate-pulse' : ''} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs leading-tight">Ambient Aurora Glow</span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {effectsEnabled ? 'Floating orbs active' : 'Decorative animated backdrop'}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <div
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ${
                  effectsEnabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 shadow-xs ${
                    effectsEnabled ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


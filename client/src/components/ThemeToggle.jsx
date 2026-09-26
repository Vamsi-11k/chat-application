import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Sparkles, Gamepad2, Check, Palette, Wand2, Droplets, Flame } from 'lucide-react';
import { useTheme, THEMES, AMBIENT_EFFECTS } from '../context/ThemeContext';

export const ThemeToggle = ({
  className = '',
  size = 18,
  showLabel = false,
  align = 'right', // 'right' | 'left'
  direction = 'bottom' // 'bottom' | 'top'
}) => {
  const { theme, setTheme, effectsEnabled, toggleEffects, ambientVariant, setAmbientVariant, ambientEffects } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
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

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Main Toggle / Picker Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Current theme: ${currentThemeObj.name}. Click to change theme or effects.`}
        aria-label={`Current theme: ${currentThemeObj.name}. Click to change theme or effects.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#092a25] transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${className}`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          {renderIcon(currentThemeObj.icon, size)}
          {effectsEnabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          )}
        </div>

        {showLabel && (
          <span className="ml-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-200">
            {currentThemeObj.name}
          </span>
        )}
      </button>

      {/* Floating Theme Selection & Effects Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Theme selector"
          className={`absolute z-50 w-64 p-2.5 rounded-2xl bg-white/95 dark:bg-[#09211d]/95 backdrop-blur-xl border border-teal-100 dark:border-[#103a33] shadow-2xl shadow-slate-950/20 dark:shadow-black/60 animate-scaleUp ${
            direction === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${align === 'left' ? 'left-0' : 'right-0'}`}
        >
          {/* Theme Section Header */}
          <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-[#133e37] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-teal-400/80 flex items-center space-x-1.5">
              <Palette size={12} className="inline mr-1" />
              Theme Style
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#0d2e28] text-slate-500 dark:text-teal-300 font-medium">
              4 Options
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

          {/* Ambient Effects Section Divider */}
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-[#133e37]">
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
                  <span className="text-xs leading-tight">Ambient Effects</span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {effectsEnabled ? 'Decorative background active' : 'Turn on animated background'}
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

            {/* Sub-options for Ambient Effect Variant when Enabled */}
            {effectsEnabled && (
              <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-[#14423a] space-y-1.5 pl-1 pr-1 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-teal-400/70 px-2">
                  Select Visual Style
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAmbientVariant('water')}
                    className={`flex flex-col p-2 rounded-xl border text-left transition-all duration-150 ${
                      ambientVariant === 'water'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-800 dark:text-teal-200 shadow-xs font-semibold'
                        : 'border-slate-200 dark:border-[#14423a] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0d2a25]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Droplets size={13} className={ambientVariant === 'water' ? 'text-teal-500' : 'text-slate-400'} />
                      <span className="text-[9px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-600 dark:text-teal-300 font-mono">
                        ThreeUI
                      </span>
                    </div>
                    <span className="text-[11px] leading-tight font-medium">Elemental Water</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-400 mt-0.5">WebGL2 Ripples</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAmbientVariant('aurora')}
                    className={`flex flex-col p-2 rounded-xl border text-left transition-all duration-150 ${
                      ambientVariant === 'aurora'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-800 dark:text-teal-200 shadow-xs font-semibold'
                        : 'border-slate-200 dark:border-[#14423a] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0d2a25]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Sparkles size={13} className={ambientVariant === 'aurora' ? 'text-teal-500' : 'text-slate-400'} />
                      <span className="text-[9px] px-1 py-0.2 rounded bg-teal-500/20 text-teal-600 dark:text-teal-300 font-mono">
                        2D
                      </span>
                    </div>
                    <span className="text-[11px] leading-tight font-medium">Aurora Glow</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-400 mt-0.5">Cosmic Orbs</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

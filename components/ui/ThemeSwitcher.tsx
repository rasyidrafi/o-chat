import React, { useState } from 'react';
import { useThemeStore } from '../../lib/theme-store';
import { PREDEFINED_THEMES, extractThemeColors, ThemePreset } from '../../lib/theme-utils';
import { ChevronDown, Palette, Sun, Moon, Check } from '../Icons';

interface ThemeCardProps {
  theme: ThemePreset;
  isSelected: boolean;
  currentMode: 'light' | 'dark';
  onSelect: (theme: ThemePreset) => void;
}

function ThemeCard({ theme, isSelected, currentMode, onSelect }: ThemeCardProps) {
  const colors = extractThemeColors(theme.config, currentMode);
  
  return (
    <button
      onClick={() => onSelect(theme)}
      className={`
        relative w-full p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]
        ${isSelected 
          ? 'border-primary ring-2 ring-primary/20 shadow-lg' 
          : 'border-border hover:border-muted'
        }
        bg-card
      `}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="w-4 h-4 text-primary" size={16} />
        </div>
      )}
      
      <div className="text-left mb-3">
        <h4 className="font-medium text-sm text-foreground">
          {theme.name}
        </h4>
        <p className="text-xs text-foreground/60 mt-1">
          {theme.description}
        </p>
      </div>
      
      <div className="flex h-3 rounded-lg overflow-hidden">
        {colors.map((color, index) => (
          <div
            key={index}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </button>
  );
}

export function ThemeSwitcher() {
  const { themeState, setThemeState, toggleThemeMode } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentTheme = PREDEFINED_THEMES.find(t => t.id === themeState.activeTheme) || PREDEFINED_THEMES[0];
  
  const handleThemeSelect = (theme: ThemePreset) => {
    setThemeState({
      config: theme.config,
      activeTheme: theme.id,
    });
    setIsOpen(false);
  };
  
  return (
    <div className="space-y-4">
      {/* Theme Mode Toggle */}
      <div>
        <h4 className="font-medium text-foreground mb-3">
          Appearance Mode
        </h4>
        <div className="flex gap-2">
          <button
            onClick={toggleThemeMode}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
              ${themeState.currentMode === 'light'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-border text-foreground'
              }
            `}
          >
            <Sun className="w-4 h-4" size={16} />
            Light
          </button>
          
          <button
            onClick={toggleThemeMode}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
              ${themeState.currentMode === 'dark'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-border text-foreground'
              }
            `}
          >
            <Moon className="w-4 h-4" size={16} />
            Dark
          </button>
        </div>
      </div>
      
      {/* Theme Selector */}
      <div>
        <h4 className="font-medium text-foreground mb-3">
          Color Theme
        </h4>
        
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-foreground/60" size={16} />
              <div className="text-left">
                <div className="font-medium text-sm text-foreground">
                  {currentTheme.name}
                </div>
                <div className="text-xs text-foreground/60">
                  {currentTheme.description}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-foreground/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {PREDEFINED_THEMES.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isSelected={theme.id === themeState.activeTheme}
                    currentMode={themeState.currentMode}
                    onSelect={handleThemeSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Colors Section */}
      <div>
        <h4 className="font-medium text-foreground mb-3">
          Border Radius
        </h4>
        <div className="flex gap-2">
          {['0rem', '0.25rem', '0.5rem', '0.75rem', '1rem'].map((radius) => (
            <button
              key={radius}
              onClick={() => setThemeState({
                config: {
                  ...themeState.config,
                  radius,
                }
              })}
              className={`
                px-3 py-2 rounded-lg border text-xs transition-all
                ${themeState.config.radius === radius
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-muted border-border text-foreground'
                }
              `}
            >
              {radius === '0rem' ? 'None' : radius}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
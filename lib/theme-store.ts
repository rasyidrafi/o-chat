import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  destructive: string;
  card: string;
  popover: string;
  input: string;
  ring: string;
}

export interface ThemeConfig {
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  radius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: string;
}

export interface ThemeState {
  currentMode: ThemeMode;
  config: ThemeConfig;
  activeTheme: string;
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colors: {
    light: {
      primary: 'hsl(262.1 83.3% 57.8%)',
      secondary: 'hsl(220 14.3% 95.9%)',
      accent: 'hsl(220 14.3% 95.9%)',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
      muted: 'hsl(220 14.3% 95.9%)',
      border: 'hsl(220 13% 91%)',
      destructive: 'hsl(0 84.2% 60.2%)',
      card: 'hsl(0 0% 100%)',
      popover: 'hsl(0 0% 100%)',
      input: 'hsl(220 13% 91%)',
      ring: 'hsl(262.1 83.3% 57.8%)',
    },
    dark: {
      primary: 'hsl(263.4 70% 50.4%)',
      secondary: 'hsl(215 27.9% 16.9%)',
      accent: 'hsl(215 27.9% 16.9%)',
      background: 'hsl(222.2 84% 4.9%)',
      foreground: 'hsl(210 40% 98%)',
      muted: 'hsl(215 27.9% 16.9%)',
      border: 'hsl(215 27.9% 16.9%)',
      destructive: 'hsl(0 62.8% 30.6%)',
      card: 'hsl(222.2 84% 4.9%)',
      popover: 'hsl(222.2 84% 4.9%)',
      input: 'hsl(215 27.9% 16.9%)',
      ring: 'hsl(263.4 70% 50.4%)',
    },
  },
  radius: '0.5rem',
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  spacing: '0.25rem',
};

const DEFAULT_THEME_STATE: ThemeState = {
  currentMode: 'light',
  config: DEFAULT_THEME_CONFIG,
  activeTheme: 'default',
};

// Simple theme store using localStorage and React state
let themeState = DEFAULT_THEME_STATE;
const listeners: Set<() => void> = new Set();

function loadThemeFromStorage(): ThemeState {
  if (typeof window === 'undefined') return DEFAULT_THEME_STATE;
  
  try {
    const stored = localStorage.getItem('o-chat-theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_THEME_STATE, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load theme from storage:', error);
  }
  
  return DEFAULT_THEME_STATE;
}

function saveThemeToStorage(state: ThemeState) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('o-chat-theme', JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save theme to storage:', error);
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function getThemeState(): ThemeState {
  return themeState;
}

export function setThemeState(newState: Partial<ThemeState>) {
  themeState = { ...themeState, ...newState };
  saveThemeToStorage(themeState);
  applyThemeToDocument(themeState);
  notifyListeners();
}

export function toggleThemeMode() {
  const newMode: ThemeMode = themeState.currentMode === 'light' ? 'dark' : 'light';
  setThemeState({ currentMode: newMode });
}

function applyThemeToDocument(state: ThemeState) {
  if (typeof document === 'undefined') return;
  
  const { currentMode, config } = state;
  const colors = config.colors[currentMode];
  const root = document.documentElement;
  
  // Apply color variables (removing 'hsl(' and ')' wrapper since CSS handles this)
  Object.entries(colors).forEach(([key, value]) => {
    // Convert hsl(x y z) to x y z for CSS variable usage
    const hslValue = value.replace(/^hsl\(/, '').replace(/\)$/, '');
    root.style.setProperty(`--color-${key}`, hslValue);
  });
  
  // Apply other theme variables
  root.style.setProperty('--radius', config.radius);
  root.style.setProperty('--shadow-sm', config.shadows.sm);
  root.style.setProperty('--shadow-md', config.shadows.md);
  root.style.setProperty('--shadow-lg', config.shadows.lg);
  root.style.setProperty('--spacing', config.spacing);
  
  // Update dark class
  if (currentMode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useThemeStore() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    // Initialize theme on first load
    themeState = loadThemeFromStorage();
    applyThemeToDocument(themeState);
    
    const listener = () => forceUpdate({});
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);
  
  return {
    themeState: getThemeState(),
    setThemeState,
    toggleThemeMode,
  };
}

// Initialize theme on import
if (typeof window !== 'undefined') {
  themeState = loadThemeFromStorage();
  applyThemeToDocument(themeState);
}
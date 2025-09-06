import { ThemeConfig } from './theme-store';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  config: ThemeConfig;
}

export const PREDEFINED_THEMES: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and modern default theme',
    config: {
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
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calming blue ocean theme',
    config: {
      colors: {
        light: {
          primary: 'hsl(198 93% 60%)',
          secondary: 'hsl(195 20% 96%)',
          accent: 'hsl(195 20% 92%)',
          background: 'hsl(210 20% 98%)',
          foreground: 'hsl(207 90% 8%)',
          muted: 'hsl(195 20% 92%)',
          border: 'hsl(195 20% 88%)',
          destructive: 'hsl(0 84.2% 60.2%)',
          card: 'hsl(210 20% 98%)',
          popover: 'hsl(210 20% 98%)',
          input: 'hsl(195 20% 88%)',
          ring: 'hsl(198 93% 60%)',
        },
        dark: {
          primary: 'hsl(198 93% 60%)',
          secondary: 'hsl(207 20% 12%)',
          accent: 'hsl(207 20% 15%)',
          background: 'hsl(207 30% 6%)',
          foreground: 'hsl(195 20% 95%)',
          muted: 'hsl(207 20% 15%)',
          border: 'hsl(207 20% 18%)',
          destructive: 'hsl(0 62.8% 30.6%)',
          card: 'hsl(207 30% 8%)',
          popover: 'hsl(207 30% 8%)',
          input: 'hsl(207 20% 18%)',
          ring: 'hsl(198 93% 60%)',
        },
      },
      radius: '0.5rem',
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      spacing: '0.25rem',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green forest theme',
    config: {
      colors: {
        light: {
          primary: 'hsl(142 76% 36%)',
          secondary: 'hsl(138 20% 96%)',
          accent: 'hsl(138 20% 92%)',
          background: 'hsl(135 20% 98%)',
          foreground: 'hsl(140 90% 8%)',
          muted: 'hsl(138 20% 92%)',
          border: 'hsl(138 20% 88%)',
          destructive: 'hsl(0 84.2% 60.2%)',
          card: 'hsl(135 20% 98%)',
          popover: 'hsl(135 20% 98%)',
          input: 'hsl(138 20% 88%)',
          ring: 'hsl(142 76% 36%)',
        },
        dark: {
          primary: 'hsl(142 76% 50%)',
          secondary: 'hsl(140 20% 12%)',
          accent: 'hsl(140 20% 15%)',
          background: 'hsl(140 30% 6%)',
          foreground: 'hsl(138 20% 95%)',
          muted: 'hsl(140 20% 15%)',
          border: 'hsl(140 20% 18%)',
          destructive: 'hsl(0 62.8% 30.6%)',
          card: 'hsl(140 30% 8%)',
          popover: 'hsl(140 30% 8%)',
          input: 'hsl(140 20% 18%)',
          ring: 'hsl(142 76% 50%)',
        },
      },
      radius: '0.5rem',
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      spacing: '0.25rem',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange sunset theme',
    config: {
      colors: {
        light: {
          primary: 'hsl(24 95% 53%)',
          secondary: 'hsl(25 20% 96%)',
          accent: 'hsl(25 20% 92%)',
          background: 'hsl(30 20% 98%)',
          foreground: 'hsl(20 90% 8%)',
          muted: 'hsl(25 20% 92%)',
          border: 'hsl(25 20% 88%)',
          destructive: 'hsl(0 84.2% 60.2%)',
          card: 'hsl(30 20% 98%)',
          popover: 'hsl(30 20% 98%)',
          input: 'hsl(25 20% 88%)',
          ring: 'hsl(24 95% 53%)',
        },
        dark: {
          primary: 'hsl(24 95% 53%)',
          secondary: 'hsl(20 20% 12%)',
          accent: 'hsl(20 20% 15%)',
          background: 'hsl(20 30% 6%)',
          foreground: 'hsl(25 20% 95%)',
          muted: 'hsl(20 20% 15%)',
          border: 'hsl(20 20% 18%)',
          destructive: 'hsl(0 62.8% 30.6%)',
          card: 'hsl(20 30% 8%)',
          popover: 'hsl(20 30% 8%)',
          input: 'hsl(20 20% 18%)',
          ring: 'hsl(24 95% 53%)',
        },
      },
      radius: '0.5rem',
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      spacing: '0.25rem',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Elegant rose pink theme',
    config: {
      colors: {
        light: {
          primary: 'hsl(330 81% 60%)',
          secondary: 'hsl(330 20% 96%)',
          accent: 'hsl(330 20% 92%)',
          background: 'hsl(335 20% 98%)',
          foreground: 'hsl(330 90% 8%)',
          muted: 'hsl(330 20% 92%)',
          border: 'hsl(330 20% 88%)',
          destructive: 'hsl(0 84.2% 60.2%)',
          card: 'hsl(335 20% 98%)',
          popover: 'hsl(335 20% 98%)',
          input: 'hsl(330 20% 88%)',
          ring: 'hsl(330 81% 60%)',
        },
        dark: {
          primary: 'hsl(330 81% 60%)',
          secondary: 'hsl(330 20% 12%)',
          accent: 'hsl(330 20% 15%)',
          background: 'hsl(330 30% 6%)',
          foreground: 'hsl(330 20% 95%)',
          muted: 'hsl(330 20% 15%)',
          border: 'hsl(330 20% 18%)',
          destructive: 'hsl(0 62.8% 30.6%)',
          card: 'hsl(330 30% 8%)',
          popover: 'hsl(330 30% 8%)',
          input: 'hsl(330 20% 18%)',
          ring: 'hsl(330 81% 60%)',
        },
      },
      radius: '0.5rem',
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      spacing: '0.25rem',
    },
  },
];

export function getThemePreset(id: string): ThemePreset | undefined {
  return PREDEFINED_THEMES.find(theme => theme.id === id);
}

export function extractThemeColors(config: ThemeConfig, mode: 'light' | 'dark'): string[] {
  const colors = config.colors[mode];
  return [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.background,
    colors.foreground,
  ];
}

export function hexToHsl(hex: string): string {
  // Remove the hash if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);
  
  return `hsl(${h} ${s}% ${lightness}%)`;
}

export function hslToHex(hsl: string): string {
  // Extract h, s, l from string like "hsl(262.1 83.3% 57.8%)"
  const match = hsl.match(/hsl\(([^)]+)\)/);
  if (!match) return '#000000';
  
  const parts = match[1].split(/\s+/);
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
/**
 * Theme utility functions for O-Chat
 * Provides dynamic color application and theming helpers
 */

import { getThemeById, ThemePalette, BorderRadius } from "../constants/themes";
import { AppSettings } from "../hooks/useSettings";

/**
 * Theme-aware CSS class generator
 */
export class ThemeUtils {
  private theme: ThemePalette;
  private borderRadius: BorderRadius;
  
  constructor(settings: AppSettings) {
    this.theme = getThemeById(settings.themePalette);
    this.borderRadius = settings.borderRadius;
  }

  /**
   * Get primary color classes
   */
  primary = {
    bg: {
      50: "bg-primary-50",
      100: "bg-primary-100", 
      200: "bg-primary-200",
      300: "bg-primary-300",
      400: "bg-primary-400",
      500: "bg-primary-500",
      600: "bg-primary-600",
      700: "bg-primary-700",
      800: "bg-primary-800",
      900: "bg-primary-900",
      950: "bg-primary-950",
    },
    text: {
      50: "text-primary-50",
      100: "text-primary-100",
      200: "text-primary-200", 
      300: "text-primary-300",
      400: "text-primary-400",
      500: "text-primary-500",
      600: "text-primary-600",
      700: "text-primary-700",
      800: "text-primary-800",
      900: "text-primary-900",
      950: "text-primary-950",
    },
    border: {
      50: "border-primary-50",
      100: "border-primary-100",
      200: "border-primary-200",
      300: "border-primary-300", 
      400: "border-primary-400",
      500: "border-primary-500",
      600: "border-primary-600",
      700: "border-primary-700",
      800: "border-primary-800",
      900: "border-primary-900",
      950: "border-primary-950",
    },
    hover: {
      bg: {
        50: "hover:bg-primary-50",
        100: "hover:bg-primary-100",
        200: "hover:bg-primary-200",
        300: "hover:bg-primary-300",
        400: "hover:bg-primary-400",
        500: "hover:bg-primary-500",
        600: "hover:bg-primary-600",
        700: "hover:bg-primary-700",
        800: "hover:bg-primary-800",
        900: "hover:bg-primary-900",
        950: "hover:bg-primary-950",
      },
      text: {
        50: "hover:text-primary-50",
        100: "hover:text-primary-100",
        200: "hover:text-primary-200",
        300: "hover:text-primary-300",
        400: "hover:text-primary-400",
        500: "hover:text-primary-500",
        600: "hover:text-primary-600",
        700: "hover:text-primary-700",
        800: "hover:text-primary-800",
        900: "hover:text-primary-900",
        950: "hover:text-primary-950",
      },
    },
  };

  /**
   * Get secondary color classes
   */
  secondary = {
    bg: {
      50: "bg-secondary-50",
      100: "bg-secondary-100",
      200: "bg-secondary-200",
      300: "bg-secondary-300",
      400: "bg-secondary-400",
      500: "bg-secondary-500",
      600: "bg-secondary-600",
      700: "bg-secondary-700",
      800: "bg-secondary-800",
      900: "bg-secondary-900",
      950: "bg-secondary-950",
    },
    text: {
      50: "text-secondary-50",
      100: "text-secondary-100",
      200: "text-secondary-200",
      300: "text-secondary-300",
      400: "text-secondary-400",
      500: "text-secondary-500",
      600: "text-secondary-600",
      700: "text-secondary-700",
      800: "text-secondary-800",
      900: "text-secondary-900",
      950: "text-secondary-950",
    },
    border: {
      50: "border-secondary-50",
      100: "border-secondary-100",
      200: "border-secondary-200",
      300: "border-secondary-300",
      400: "border-secondary-400",
      500: "border-secondary-500",
      600: "border-secondary-600",
      700: "border-secondary-700",
      800: "border-secondary-800",
      900: "border-secondary-900",
      950: "border-secondary-950",
    },
    hover: {
      bg: {
        50: "hover:bg-secondary-50",
        100: "hover:bg-secondary-100",
        200: "hover:bg-secondary-200",
        300: "hover:bg-secondary-300",
        400: "hover:bg-secondary-400",
        500: "hover:bg-secondary-500",
        600: "hover:bg-secondary-600",
        700: "hover:bg-secondary-700",
        800: "hover:bg-secondary-800",
        900: "hover:bg-secondary-900",
        950: "hover:bg-secondary-950",
      },
      text: {
        50: "hover:text-secondary-50",
        100: "hover:text-secondary-100",
        200: "hover:text-secondary-200",
        300: "hover:text-secondary-300",
        400: "hover:text-secondary-400",
        500: "hover:text-secondary-500",
        600: "hover:text-secondary-600",
        700: "hover:text-secondary-700",
        800: "hover:text-secondary-800",
        900: "hover:text-secondary-900",
        950: "hover:text-secondary-950",
      },
    },
  };

  /**
   * Get neutral color classes
   */
  neutral = {
    bg: {
      50: "bg-neutral-50",
      100: "bg-neutral-100",
      200: "bg-neutral-200",
      300: "bg-neutral-300",
      400: "bg-neutral-400",
      500: "bg-neutral-500",
      600: "bg-neutral-600",
      700: "bg-neutral-700",
      800: "bg-neutral-800",
      900: "bg-neutral-900",
      950: "bg-neutral-950",
    },
    text: {
      50: "text-neutral-50",
      100: "text-neutral-100",
      200: "text-neutral-200",
      300: "text-neutral-300",
      400: "text-neutral-400",
      500: "text-neutral-500",
      600: "text-neutral-600",
      700: "text-neutral-700",
      800: "text-neutral-800",
      900: "text-neutral-900",
      950: "text-neutral-950",
    },
    border: {
      50: "border-neutral-50",
      100: "border-neutral-100",
      200: "border-neutral-200",
      300: "border-neutral-300",
      400: "border-neutral-400",
      500: "border-neutral-500",
      600: "border-neutral-600",
      700: "border-neutral-700",
      800: "border-neutral-800",
      900: "border-neutral-900",
      950: "border-neutral-950",
    },
    hover: {
      bg: {
        50: "hover:bg-neutral-50",
        100: "hover:bg-neutral-100",
        200: "hover:bg-neutral-200",
        300: "hover:bg-neutral-300",
        400: "hover:bg-neutral-400",
        500: "hover:bg-neutral-500",
        600: "hover:bg-neutral-600",
        700: "hover:bg-neutral-700",
        800: "hover:bg-neutral-800",
        900: "hover:bg-neutral-900",
        950: "hover:bg-neutral-950",
      },
      text: {
        50: "hover:text-neutral-50",
        100: "hover:text-neutral-100",
        200: "hover:text-neutral-200",
        300: "hover:text-neutral-300",
        400: "hover:text-neutral-400",
        500: "hover:text-neutral-500",
        600: "hover:text-neutral-600",
        700: "hover:text-neutral-700",
        800: "hover:text-neutral-800",
        900: "hover:text-neutral-900",
        950: "hover:text-neutral-950",
      },
    },
  };

  /**
   * Get accent color classes
   */
  accent = {
    bg: {
      50: "bg-accent-50",
      100: "bg-accent-100",
      200: "bg-accent-200",
      300: "bg-accent-300",
      400: "bg-accent-400",
      500: "bg-accent-500",
      600: "bg-accent-600",
      700: "bg-accent-700",
      800: "bg-accent-800",
      900: "bg-accent-900",
      950: "bg-accent-950",
    },
    text: {
      50: "text-accent-50",
      100: "text-accent-100",
      200: "text-accent-200",
      300: "text-accent-300",
      400: "text-accent-400",
      500: "text-accent-500",
      600: "text-accent-600",
      700: "text-accent-700",
      800: "text-accent-800",
      900: "text-accent-900",
      950: "text-accent-950",
    },
    border: {
      50: "border-accent-50",
      100: "border-accent-100",
      200: "border-accent-200",
      300: "border-accent-300",
      400: "border-accent-400",
      500: "border-accent-500",
      600: "border-accent-600",
      700: "border-accent-700",
      800: "border-accent-800",
      900: "border-accent-900",
      950: "border-accent-950",
    },
    hover: {
      bg: {
        50: "hover:bg-accent-50",
        100: "hover:bg-accent-100",
        200: "hover:bg-accent-200",
        300: "hover:bg-accent-300",
        400: "hover:bg-accent-400",
        500: "hover:bg-accent-500",
        600: "hover:bg-accent-600",
        700: "hover:bg-accent-700",
        800: "hover:bg-accent-800",
        900: "hover:bg-accent-900",
        950: "hover:bg-accent-950",
      },
      text: {
        50: "hover:text-accent-50",
        100: "hover:text-accent-100",
        200: "hover:text-accent-200",
        300: "hover:text-accent-300",
        400: "hover:text-accent-400",
        500: "hover:text-accent-500",
        600: "hover:text-accent-600",
        700: "hover:text-accent-700",
        800: "hover:text-accent-800",
        900: "hover:text-accent-900",
        950: "hover:text-accent-950",
      },
    },
  };

  /**
   * Get border radius classes
   */
  rounded = () => {
    switch (this.borderRadius) {
      case "none": return "rounded-none";
      case "sm": return "rounded-sm";
      case "md": return "rounded-md";
      case "lg": return "rounded-lg";
      case "xl": return "rounded-xl";
      case "2xl": return "rounded-2xl";
      case "3xl": return "rounded-3xl";
      case "full": return "rounded-full";
      default: return "rounded-lg";
    }
  };

  /**
   * Get border radius for specific corners
   */
  roundedVariants = () => ({
    t: this.borderRadius === "none" ? "rounded-t-none" : 
       this.borderRadius === "sm" ? "rounded-t-sm" :
       this.borderRadius === "md" ? "rounded-t-md" :
       this.borderRadius === "lg" ? "rounded-t-lg" :
       this.borderRadius === "xl" ? "rounded-t-xl" :
       this.borderRadius === "2xl" ? "rounded-t-2xl" :
       this.borderRadius === "3xl" ? "rounded-t-3xl" :
       this.borderRadius === "full" ? "rounded-t-full" : "rounded-t-lg",
    
    b: this.borderRadius === "none" ? "rounded-b-none" :
       this.borderRadius === "sm" ? "rounded-b-sm" :
       this.borderRadius === "md" ? "rounded-b-md" :
       this.borderRadius === "lg" ? "rounded-b-lg" :
       this.borderRadius === "xl" ? "rounded-b-xl" :
       this.borderRadius === "2xl" ? "rounded-b-2xl" :
       this.borderRadius === "3xl" ? "rounded-b-3xl" :
       this.borderRadius === "full" ? "rounded-b-full" : "rounded-b-lg",
    
    l: this.borderRadius === "none" ? "rounded-l-none" :
       this.borderRadius === "sm" ? "rounded-l-sm" :
       this.borderRadius === "md" ? "rounded-l-md" :
       this.borderRadius === "lg" ? "rounded-l-lg" :
       this.borderRadius === "xl" ? "rounded-l-xl" :
       this.borderRadius === "2xl" ? "rounded-l-2xl" :
       this.borderRadius === "3xl" ? "rounded-l-3xl" :
       this.borderRadius === "full" ? "rounded-l-full" : "rounded-l-lg",
    
    r: this.borderRadius === "none" ? "rounded-r-none" :
       this.borderRadius === "sm" ? "rounded-r-sm" :
       this.borderRadius === "md" ? "rounded-r-md" :
       this.borderRadius === "lg" ? "rounded-r-lg" :
       this.borderRadius === "xl" ? "rounded-r-xl" :
       this.borderRadius === "2xl" ? "rounded-r-2xl" :
       this.borderRadius === "3xl" ? "rounded-r-3xl" :
       this.borderRadius === "full" ? "rounded-r-full" : "rounded-r-lg",
    
    tl: this.borderRadius === "none" ? "rounded-tl-none" :
        this.borderRadius === "sm" ? "rounded-tl-sm" :
        this.borderRadius === "md" ? "rounded-tl-md" :
        this.borderRadius === "lg" ? "rounded-tl-lg" :
        this.borderRadius === "xl" ? "rounded-tl-xl" :
        this.borderRadius === "2xl" ? "rounded-tl-2xl" :
        this.borderRadius === "3xl" ? "rounded-tl-3xl" :
        this.borderRadius === "full" ? "rounded-tl-full" : "rounded-tl-lg",
    
    tr: this.borderRadius === "none" ? "rounded-tr-none" :
        this.borderRadius === "sm" ? "rounded-tr-sm" :
        this.borderRadius === "md" ? "rounded-tr-md" :
        this.borderRadius === "lg" ? "rounded-tr-lg" :
        this.borderRadius === "xl" ? "rounded-tr-xl" :
        this.borderRadius === "2xl" ? "rounded-tr-2xl" :
        this.borderRadius === "3xl" ? "rounded-tr-3xl" :
        this.borderRadius === "full" ? "rounded-tr-full" : "rounded-tr-lg",
    
    bl: this.borderRadius === "none" ? "rounded-bl-none" :
        this.borderRadius === "sm" ? "rounded-bl-sm" :
        this.borderRadius === "md" ? "rounded-bl-md" :
        this.borderRadius === "lg" ? "rounded-bl-lg" :
        this.borderRadius === "xl" ? "rounded-bl-xl" :
        this.borderRadius === "2xl" ? "rounded-bl-2xl" :
        this.borderRadius === "3xl" ? "rounded-bl-3xl" :
        this.borderRadius === "full" ? "rounded-bl-full" : "rounded-bl-lg",
    
    br: this.borderRadius === "none" ? "rounded-br-none" :
        this.borderRadius === "sm" ? "rounded-br-sm" :
        this.borderRadius === "md" ? "rounded-br-md" :
        this.borderRadius === "lg" ? "rounded-br-lg" :
        this.borderRadius === "xl" ? "rounded-br-xl" :
        this.borderRadius === "2xl" ? "rounded-br-2xl" :
        this.borderRadius === "3xl" ? "rounded-br-3xl" :
        this.borderRadius === "full" ? "rounded-br-full" : "rounded-br-lg",
  });

  /**
   * Get the actual theme data
   */
  getTheme = () => this.theme;

  /**
   * Get border radius value
   */
  getBorderRadius = () => this.borderRadius;
}

/**
 * Initialize theme CSS custom properties
 */
export const initializeThemeProperties = (settings: AppSettings) => {
  const theme = getThemeById(settings.themePalette);
  const root = document.documentElement;

  // Set primary colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    root.style.setProperty(`--color-primary-${key}`, value);
  });

  // Set secondary colors
  Object.entries(theme.colors.secondary).forEach(([key, value]) => {
    root.style.setProperty(`--color-secondary-${key}`, value);
  });

  // Set neutral colors
  Object.entries(theme.colors.neutral).forEach(([key, value]) => {
    root.style.setProperty(`--color-neutral-${key}`, value);
  });

  // Set accent colors
  Object.entries(theme.colors.accent).forEach(([key, value]) => {
    root.style.setProperty(`--color-accent-${key}`, value);
  });

  // Set border radius
  root.style.setProperty(`--border-radius`, settings.borderRadius);
};

/**
 * Create a theme utils instance
 */
export const createThemeUtils = (settings: AppSettings) => new ThemeUtils(settings);
/**
 * Unified Theme System for O-Chat
 * Following Tailwind CSS best practices for theming
 */

export type BorderRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export interface ThemeColors {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  // Secondary colors
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  // Neutral colors for backgrounds and text
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  // Accent colors for special elements
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

// Default theme (Pink/Purple - current colors)
export const DEFAULT_THEME: ThemePalette = {
  id: "default",
  name: "Rose Garden",
  description: "The classic O-Chat theme with pink and purple accents",
  colors: {
    primary: {
      50: "rgb(253 242 248)",
      100: "rgb(252 231 243)",
      200: "rgb(251 207 232)",
      300: "rgb(249 168 212)",
      400: "rgb(244 114 182)",
      500: "rgb(236 72 153)",
      600: "rgb(219 39 119)",
      700: "rgb(190 24 93)",
      800: "rgb(157 23 77)",
      900: "rgb(131 24 67)",
      950: "rgb(80 7 36)",
    },
    secondary: {
      50: "rgb(250 245 255)",
      100: "rgb(243 232 255)",
      200: "rgb(233 213 255)",
      300: "rgb(216 180 254)",
      400: "rgb(196 181 253)",
      500: "rgb(147 51 234)",
      600: "rgb(126 34 206)",
      700: "rgb(107 33 168)",
      800: "rgb(88 28 135)",
      900: "rgb(74 29 121)",
      950: "rgb(49 10 101)",
    },
    neutral: {
      50: "rgb(250 250 250)",
      100: "rgb(244 244 245)",
      200: "rgb(228 228 231)",
      300: "rgb(212 212 216)",
      400: "rgb(161 161 170)",
      500: "rgb(113 113 122)",
      600: "rgb(82 82 91)",
      700: "rgb(63 63 70)",
      800: "rgb(39 39 42)",
      900: "rgb(24 24 27)",
      950: "rgb(9 9 11)",
    },
    accent: {
      50: "rgb(254 242 242)",
      100: "rgb(254 226 226)",
      200: "rgb(252 165 165)",
      300: "rgb(248 113 113)",
      400: "rgb(239 68 68)",
      500: "rgb(220 38 38)",
      600: "rgb(185 28 28)",
      700: "rgb(153 27 27)",
      800: "rgb(127 29 29)",
      900: "rgb(109 40 40)",
      950: "rgb(69 10 10)",
    },
  },
};

// Blue Ocean theme
export const BLUE_THEME: ThemePalette = {
  id: "blue",
  name: "Ocean Breeze",
  description: "Cool blues with teal accents for a calming experience",
  colors: {
    primary: {
      50: "rgb(239 246 255)",
      100: "rgb(219 234 254)",
      200: "rgb(191 219 254)",
      300: "rgb(147 197 253)",
      400: "rgb(96 165 250)",
      500: "rgb(59 130 246)",
      600: "rgb(37 99 235)",
      700: "rgb(29 78 216)",
      800: "rgb(30 64 175)",
      900: "rgb(30 58 138)",
      950: "rgb(23 37 84)",
    },
    secondary: {
      50: "rgb(240 253 250)",
      100: "rgb(204 251 241)",
      200: "rgb(153 246 228)",
      300: "rgb(94 234 212)",
      400: "rgb(45 212 191)",
      500: "rgb(20 184 166)",
      600: "rgb(13 148 136)",
      700: "rgb(15 118 110)",
      800: "rgb(17 94 89)",
      900: "rgb(19 78 74)",
      950: "rgb(4 47 46)",
    },
    neutral: {
      50: "rgb(248 250 252)",
      100: "rgb(241 245 249)",
      200: "rgb(226 232 240)",
      300: "rgb(203 213 225)",
      400: "rgb(148 163 184)",
      500: "rgb(100 116 139)",
      600: "rgb(71 85 105)",
      700: "rgb(51 65 85)",
      800: "rgb(30 41 59)",
      900: "rgb(15 23 42)",
      950: "rgb(2 6 23)",
    },
    accent: {
      50: "rgb(240 249 255)",
      100: "rgb(224 242 254)",
      200: "rgb(186 230 253)",
      300: "rgb(125 211 252)",
      400: "rgb(56 189 248)",
      500: "rgb(14 165 233)",
      600: "rgb(2 132 199)",
      700: "rgb(3 105 161)",
      800: "rgb(7 89 133)",
      900: "rgb(12 74 110)",
      950: "rgb(8 47 73)",
    },
  },
};

// Green Forest theme
export const GREEN_THEME: ThemePalette = {
  id: "green",
  name: "Forest Glade",
  description: "Natural greens with earthy tones for a organic feel",
  colors: {
    primary: {
      50: "rgb(240 253 244)",
      100: "rgb(220 252 231)",
      200: "rgb(187 247 208)",
      300: "rgb(134 239 172)",
      400: "rgb(74 222 128)",
      500: "rgb(34 197 94)",
      600: "rgb(22 163 74)",
      700: "rgb(21 128 61)",
      800: "rgb(22 101 52)",
      900: "rgb(20 83 45)",
      950: "rgb(5 46 22)",
    },
    secondary: {
      50: "rgb(247 254 231)",
      100: "rgb(236 252 203)",
      200: "rgb(217 249 157)",
      300: "rgb(190 242 100)",
      400: "rgb(163 230 53)",
      500: "rgb(132 204 22)",
      600: "rgb(101 163 13)",
      700: "rgb(77 124 15)",
      800: "rgb(63 98 18)",
      900: "rgb(54 83 20)",
      950: "rgb(26 46 5)",
    },
    neutral: {
      50: "rgb(250 250 249)",
      100: "rgb(245 245 244)",
      200: "rgb(231 229 228)",
      300: "rgb(214 211 209)",
      400: "rgb(168 162 158)",
      500: "rgb(120 113 108)",
      600: "rgb(87 83 78)",
      700: "rgb(68 64 60)",
      800: "rgb(41 37 36)",
      900: "rgb(28 25 23)",
      950: "rgb(12 10 9)",
    },
    accent: {
      50: "rgb(254 249 195)",
      100: "rgb(254 240 138)",
      200: "rgb(253 224 71)",
      300: "rgb(250 204 21)",
      400: "rgb(234 179 8)",
      500: "rgb(202 138 4)",
      600: "rgb(161 98 7)",
      700: "rgb(133 77 14)",
      800: "rgb(113 63 18)",
      900: "rgb(99 49 18)",
      950: "rgb(67 20 7)",
    },
  },
};

// Orange Sunset theme
export const ORANGE_THEME: ThemePalette = {
  id: "orange",
  name: "Sunset Glow",
  description: "Warm oranges and reds for an energetic atmosphere",
  colors: {
    primary: {
      50: "rgb(255 247 237)",
      100: "rgb(255 237 213)",
      200: "rgb(254 215 170)",
      300: "rgb(253 186 116)",
      400: "rgb(251 146 60)",
      500: "rgb(249 115 22)",
      600: "rgb(234 88 12)",
      700: "rgb(194 65 12)",
      800: "rgb(154 52 18)",
      900: "rgb(124 45 18)",
      950: "rgb(67 20 7)",
    },
    secondary: {
      50: "rgb(254 242 242)",
      100: "rgb(254 226 226)",
      200: "rgb(252 165 165)",
      300: "rgb(248 113 113)",
      400: "rgb(239 68 68)",
      500: "rgb(220 38 38)",
      600: "rgb(185 28 28)",
      700: "rgb(153 27 27)",
      800: "rgb(127 29 29)",
      900: "rgb(109 40 40)",
      950: "rgb(69 10 10)",
    },
    neutral: {
      50: "rgb(254 252 232)",
      100: "rgb(254 249 195)",
      200: "rgb(254 240 138)",
      300: "rgb(253 224 71)",
      400: "rgb(250 204 21)",
      500: "rgb(234 179 8)",
      600: "rgb(202 138 4)",
      700: "rgb(161 98 7)",
      800: "rgb(133 77 14)",
      900: "rgb(113 63 18)",
      950: "rgb(66 32 6)",
    },
    accent: {
      50: "rgb(255 251 235)",
      100: "rgb(254 243 199)",
      200: "rgb(253 230 138)",
      300: "rgb(252 211 77)",
      400: "rgb(251 191 36)",
      500: "rgb(245 158 11)",
      600: "rgb(217 119 6)",
      700: "rgb(180 83 9)",
      800: "rgb(146 64 14)",
      900: "rgb(120 53 15)",
      950: "rgb(69 26 3)",
    },
  },
};

// Purple Cosmos theme
export const PURPLE_THEME: ThemePalette = {
  id: "purple",
  name: "Cosmic Purple",
  description: "Deep purples with mystical vibes for a sophisticated look",
  colors: {
    primary: {
      50: "rgb(250 245 255)",
      100: "rgb(243 232 255)",
      200: "rgb(233 213 255)",
      300: "rgb(196 181 253)",
      400: "rgb(147 51 234)",
      500: "rgb(126 34 206)",
      600: "rgb(107 33 168)",
      700: "rgb(88 28 135)",
      800: "rgb(74 29 121)",
      900: "rgb(59 7 100)",
      950: "rgb(49 10 101)",
    },
    secondary: {
      50: "rgb(254 240 221)",
      100: "rgb(253 224 71)",
      200: "rgb(252 211 77)",
      300: "rgb(251 191 36)",
      400: "rgb(245 158 11)",
      500: "rgb(217 119 6)",
      600: "rgb(180 83 9)",
      700: "rgb(146 64 14)",
      800: "rgb(120 53 15)",
      900: "rgb(99 49 18)",
      950: "rgb(69 26 3)",
    },
    neutral: {
      50: "rgb(248 250 252)",
      100: "rgb(241 245 249)",
      200: "rgb(226 232 240)",
      300: "rgb(203 213 225)",
      400: "rgb(148 163 184)",
      500: "rgb(100 116 139)",
      600: "rgb(71 85 105)",
      700: "rgb(51 65 85)",
      800: "rgb(30 41 59)",
      900: "rgb(15 23 42)",
      950: "rgb(2 6 23)",
    },
    accent: {
      50: "rgb(253 244 255)",
      100: "rgb(250 232 255)",
      200: "rgb(245 208 254)",
      300: "rgb(240 171 252)",
      400: "rgb(232 121 249)",
      500: "rgb(217 70 239)",
      600: "rgb(192 38 211)",
      700: "rgb(162 28 177)",
      800: "rgb(134 25 143)",
      900: "rgb(112 26 117)",
      950: "rgb(74 4 78)",
    },
  },
};

// Monochrome theme
export const MONOCHROME_THEME: ThemePalette = {
  id: "monochrome",
  name: "Monochrome",
  description: "Classic black and white with gray accents for minimalists",
  colors: {
    primary: {
      50: "rgb(250 250 250)",
      100: "rgb(244 244 245)",
      200: "rgb(228 228 231)",
      300: "rgb(212 212 216)",
      400: "rgb(161 161 170)",
      500: "rgb(113 113 122)",
      600: "rgb(82 82 91)",
      700: "rgb(63 63 70)",
      800: "rgb(39 39 42)",
      900: "rgb(24 24 27)",
      950: "rgb(9 9 11)",
    },
    secondary: {
      50: "rgb(250 250 250)",
      100: "rgb(244 244 245)",
      200: "rgb(228 228 231)",
      300: "rgb(212 212 216)",
      400: "rgb(161 161 170)",
      500: "rgb(113 113 122)",
      600: "rgb(82 82 91)",
      700: "rgb(63 63 70)",
      800: "rgb(39 39 42)",
      900: "rgb(24 24 27)",
      950: "rgb(9 9 11)",
    },
    neutral: {
      50: "rgb(250 250 250)",
      100: "rgb(244 244 245)",
      200: "rgb(228 228 231)",
      300: "rgb(212 212 216)",
      400: "rgb(161 161 170)",
      500: "rgb(113 113 122)",
      600: "rgb(82 82 91)",
      700: "rgb(63 63 70)",
      800: "rgb(39 39 42)",
      900: "rgb(24 24 27)",
      950: "rgb(9 9 11)",
    },
    accent: {
      50: "rgb(250 250 250)",
      100: "rgb(244 244 245)",
      200: "rgb(228 228 231)",
      300: "rgb(212 212 216)",
      400: "rgb(161 161 170)",
      500: "rgb(113 113 122)",
      600: "rgb(82 82 91)",
      700: "rgb(63 63 70)",
      800: "rgb(39 39 42)",
      900: "rgb(24 24 27)",
      950: "rgb(9 9 11)",
    },
  },
};

// Available themes array
export const AVAILABLE_THEMES: ThemePalette[] = [
  DEFAULT_THEME,
  BLUE_THEME,
  GREEN_THEME,
  ORANGE_THEME,
  PURPLE_THEME,
  MONOCHROME_THEME,
];

// Border radius options
export const BORDER_RADIUS_OPTIONS: { value: BorderRadius; label: string; description: string }[] = [
  { value: "none", label: "None", description: "Sharp corners" },
  { value: "sm", label: "Small", description: "Slightly rounded" },
  { value: "md", label: "Medium", description: "Moderately rounded" },
  { value: "lg", label: "Large", description: "Well rounded" },
  { value: "xl", label: "Extra Large", description: "Very rounded" },
  { value: "2xl", label: "2X Large", description: "Extremely rounded" },
  { value: "3xl", label: "3X Large", description: "Super rounded" },
  { value: "full", label: "Full", description: "Completely rounded" },
];

// Utility function to get theme by ID
export const getThemeById = (id: string): ThemePalette => {
  return AVAILABLE_THEMES.find(theme => theme.id === id) || DEFAULT_THEME;
};

// Default border radius
export const DEFAULT_BORDER_RADIUS: BorderRadius = "lg";
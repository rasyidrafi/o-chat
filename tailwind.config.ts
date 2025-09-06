import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--color-primary))",
        secondary: "hsl(var(--color-secondary))", 
        accent: "hsl(var(--color-accent))",
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        muted: "hsl(var(--color-muted))",
        border: "hsl(var(--color-border))",
        destructive: "hsl(var(--color-destructive))",
        card: "hsl(var(--color-card))",
        popover: "hsl(var(--color-popover))",
        input: "hsl(var(--color-input))",
        ring: "hsl(var(--color-ring))",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        "sm": "calc(var(--radius) - 4px)",
        "md": "calc(var(--radius) - 2px)", 
        "lg": "var(--radius)",
        "xl": "calc(var(--radius) + 4px)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      fontFamily: {
        sans: ["var(--font-main)", "Outfit", "sans-serif"],
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
      },
    },
  },
  plugins: [],
} satisfies Config

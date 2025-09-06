// Centralized color constants for the application
export const colors = {
  // Background colors
  backgrounds: {
    // Main backgrounds
    primary: {
      light: '#f9f9f9',
      dark: '#1c1c1c'
    },
    
    // Secondary backgrounds
    secondary: {
      light: '#fcfcfc',
      dark: '#121212'
    },
    
    // Card/Surface backgrounds
    surface: {
      light: '#fbf9f7',
      dark: '#1c1c1c',
      lightTransparent: '#fbf9f7/80',
      darkTransparent: '#1c1c1c/80'
    },
    
    // Input/Interactive backgrounds
    input: {
      light: '#efeae7',
      dark: '#1f1f1f'
    },
    
    // Sidebar specific
    sidebar: {
      light: '#fcfcfc',
      dark: '#171717'
    },
    
    // Sidebar hover states
    sidebarHover: {
      light: '#ededed',
      dark: '#1b1b1b'
    },
    
    // Interactive states
    interactive: {
      light: '#f4f4f4',
      dark: '#252525'
    },
    
    // Message backgrounds
    message: {
      light: '#f2eeec',
      dark: 'zinc-800'
    },
    
    // Placeholder/skeleton backgrounds
    placeholder: {
      light: '#e3dedb',
      dark: 'zinc-800'
    },
    
    // Keyboard key background
    key: {
      light: 'gray-200',
      dark: '#1f1f1f'
    }
  },

  // Text colors
  text: {
    // Primary text
    primary: {
      light: '#202020',
      dark: '#fafafa'
    },
    
    // Secondary text
    secondary: {
      light: '#707070',
      dark: '#898989'
    },
    
    // Muted text
    muted: {
      light: '#9a9a9a',
      dark: '#656565'
    },
    
    // White text for logos/headers
    white: '#fafafa'
  },

  // Border colors
  borders: {
    // Primary borders
    primary: {
      light: '#e7e4e2',
      dark: 'zinc-700/50'
    },
    
    // Secondary borders
    secondary: {
      light: '#dfdfdf',
      dark: '#242424'
    },
    
    // Dialog/modal borders
    dialog: {
      light: 'zinc-200',
      dark: 'zinc-700'
    },
    
    // Key borders
    key: {
      light: 'gray-300',
      dark: 'gray-600'
    }
  },

  // Hover states
  hover: {
    // Background hover states
    backgrounds: {
      primary: {
        light: 'gray-100',
        dark: 'zinc-700'
      },
      
      secondary: {
        light: 'gray-50',
        dark: 'zinc-800'
      },
      
      interactive: {
        light: 'gray-100',
        dark: 'zinc-700'
      },
      
      sidebarItem: {
        light: 'gray-100',
        dark: 'zinc-800'
      },
      
      disabled: {
        light: '#eeece9',
        dark: '#52525b'
      }
    },
    
    // Text hover states
    text: {
      primary: {
        light: '#202020',
        dark: '#fafafa'
      }
    }
  },

  // Special colors
  special: {
    // Disabled states
    disabled: {
      text: {
        light: 'zinc-500',
        dark: 'zinc-400'
      }
    }
  }
};

// Helper function to get color value with theme
export const getColor = (
  colorPath: string,
  theme: 'light' | 'dark' = 'light'
): string => {
  const pathArray = colorPath.split('.');
  let current: any = colors;
  
  for (const key of pathArray) {
    current = current[key];
    if (!current) return '';
  }
  
  return current[theme] || current || '';
};

// Utility functions for common color patterns
export const getBgColor = (
  path: string,
  lightColor?: string,
  darkColor?: string
) => {
  if (lightColor && darkColor) {
    return `bg-[${lightColor}] dark:bg-[${darkColor}]`;
  }
  
  const light = getColor(path, 'light');
  const dark = getColor(path, 'dark');
  
  return `bg-[${light}] dark:bg-[${dark}]`;
};

export const getTextColor = (
  path: string,
  lightColor?: string,
  darkColor?: string
) => {
  if (lightColor && darkColor) {
    return `text-[${lightColor}] dark:text-[${darkColor}]`;
  }
  
  const light = getColor(path, 'light');
  const dark = getColor(path, 'dark');
  
  return `text-[${light}] dark:text-[${dark}]`;
};

export const getBorderColor = (
  path: string,
  lightColor?: string,
  darkColor?: string
) => {
  if (lightColor && darkColor) {
    return `border-[${lightColor}] dark:border-[${darkColor}]`;
  }
  
  const light = getColor(path, 'light');
  const dark = getColor(path, 'dark');
  
  return `border-[${light}] dark:border-[${dark}]`;
};

export const getHoverBgColor = (
  path: string,
  lightColor?: string,
  darkColor?: string
) => {
  if (lightColor && darkColor) {
    return `hover:bg-[${lightColor}] dark:hover:bg-[${darkColor}]`;
  }
  
  const light = getColor(path, 'light');
  const dark = getColor(path, 'dark');
  
  return `hover:bg-[${light}] dark:hover:bg-[${dark}]`;
};

export const getHoverTextColor = (
  path: string,
  lightColor?: string,
  darkColor?: string
) => {
  if (lightColor && darkColor) {
    return `hover:text-[${lightColor}] dark:hover:text-[${darkColor}]`;
  }
  
  const light = getColor(path, 'light');
  const dark = getColor(path, 'dark');
  
  return `hover:text-[${light}] dark:hover:text-[${dark}]`;
};
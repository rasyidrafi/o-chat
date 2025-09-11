// Constants and configuration for SettingsPage component
// Moving constants outside component to prevent re-creation on each render

export const AVATAR_COLORS = [
  'bg-red-500', 
  'bg-blue-500', 
  'bg-green-500', 
  'bg-yellow-500', 
  'bg-purple-500', 
  'bg-pink-500', 
  'bg-indigo-500', 
  'bg-teal-500'
] as const;

export const TABS = [
  'Account', 
  'Customization', 
  'Models', 
  'API Keys', 
  // 'Attachments', // temporary hide
  'Contact Us'
] as const;

export const MOBILE_TABS = [
  'Account', 
  'Customization', 
  'Models', 
  'API Keys', 
  'Attachments', 
  'Contact Us'
] as const;

export const KEYBOARD_SHORTCUTS = [
  {
    label: 'Search',
    keys: ['⌘', 'K'],
    description: 'Open command palette'
  },
  {
    label: 'New Chat',
    keys: ['⌘', 'Shift', 'O'],
    description: 'Start a new conversation'
  },
  {
    label: 'Toggle Sidebar',
    keys: ['⌘', 'B'],
    description: 'Show or hide the sidebar'
  }
] as const;

export const CONTENT_ANIMATION_DURATION = 0.2;

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
  'Attachments', 
  'Contact Us'
] as const;

export const USAGE_METRICS = {
  CONVERSATIONS_SCALE: 30,
  SERVER_MESSAGES_SCALE: 50,
  BYOK_MESSAGES_SCALE: 80,
  MIN_BAR_WIDTH: 20,
  MAX_BAR_WIDTH: 100,
  BASE_WIDTH: 30,
  SCALE_MULTIPLIER: 70
} as const;

export const DEBOUNCE_DELAY = 300;

export const LOADING_ANIMATION_DURATION = 0.3;
export const CONTENT_ANIMATION_DURATION = 0.2;
export const BAR_ANIMATION_DURATION = 0.8;

// Helper function to calculate usage bar width
export const calculateBarWidth = (
  value: number, 
  scale: number, 
  metrics = USAGE_METRICS
): number => {
  return Math.min(
    Math.max(
      (value / scale) * metrics.SCALE_MULTIPLIER + metrics.BASE_WIDTH,
      metrics.MIN_BAR_WIDTH
    ),
    metrics.MAX_BAR_WIDTH
  );
};

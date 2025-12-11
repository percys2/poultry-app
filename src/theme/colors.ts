export const colors = {
  // Primary colors
  primary: '#2D5A27',
  primaryLight: '#4A7C43',
  primaryDark: '#1E3D1A',

  // Background colors
  cream: '#FDF8F3',
  beige: '#F5E6D3',
  sand: '#E8DCC8',
  surface: '#FFFFFF',

  // Accent colors
  earth: '#6B4423',

  // Text colors
  textPrimary: '#2C2C2C',
  textSecondary: '#5C5C5C',
  textMuted: '#8C8C8C',
  textLight: '#FFFFFF',

  // Border colors
  border: '#E8DCC8',

  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#E53935',
  info: '#2196F3',

  // Transparent variants
  primaryTransparent: 'rgba(45, 90, 39, 0.15)',
  errorTransparent: 'rgba(229, 57, 53, 0.15)',
  successTransparent: 'rgba(76, 175, 80, 0.15)',
  warningTransparent: 'rgba(255, 152, 0, 0.15)',
} as const;

export type ColorKey = keyof typeof colors;

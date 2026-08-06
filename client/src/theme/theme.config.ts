import type { ThemeOption } from './types';

export const THEME_STORAGE_KEY = 'nxtgen_academy_theme';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Dark',
    description: 'Sleek dark theme with vibrant orange accents',
    iconName: 'Moon',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Spur+fit inspired soft ice-blue & slate light design system',
    iconName: 'Sun',
  },
  {
    id: 'light_new',
    label: 'Light_new',
    description: 'Marine Voyage theme with teal accents & deep oceanic blue tones',
    iconName: 'Sun',
  },
  {
    id: 'light_green',
    label: 'Light_green',
    description: 'Finovate Modern Sage theme with vibrant lime green accents & warm espresso typography',
    iconName: 'Sun',
  },
  {
    id: 'system',
    label: 'System',
    description: 'Matches your OS dark/light preference',
    iconName: 'Monitor',
  },
];

// Color Palette specifications matching Theme 2, Marine Voyage, and Finovate Sage (theme copy.md)
export const THEME_VARIABLES = {
  dark: {
    '--brand-orange': '#f5820b',
    '--brand-orange-rgb': '245, 130, 11',
    '--bg-canvas': '#0a0a0f',
    '--bg-canvas-rgb': '10, 10, 15',
    '--bg-surface': '#111118',
    '--bg-surface-rgb': '17, 17, 24',
    '--bg-card': '#1a1a24',
    '--bg-card-rgb': '26, 26, 36',
    '--text-primary': '#ffffff',
    '--text-primary-rgb': '255, 255, 255',
    '--text-muted': '#9ca3af',
    '--text-muted-rgb': '156, 163, 175',
    '--border-color': 'rgba(255, 255, 255, 0.08)',
  },
  light: {
    '--brand-orange': '#2563eb',         // Primary Vibrant Blue (#2563EB)
    '--brand-orange-rgb': '37, 99, 235',
    '--bg-canvas': '#f0f4f8',            // Spur+fit Light Ice Slate Base (#F0F4F8)
    '--bg-canvas-rgb': '240, 244, 248',
    '--bg-surface': '#ffffff',           // Pure White Surface (#FFFFFF)
    '--bg-surface-rgb': '255, 255, 255',
    '--bg-card': '#f8fafc',              // Soft Off-White Card Fill (#F8FAFC)
    '--bg-card-rgb': '248, 250, 252',
    '--text-primary': '#0f172a',         // High Contrast Slate 900 Heading (#0F172A)
    '--text-primary-rgb': '15, 23, 42',
    '--text-muted': '#475569',           // Muted Body Text Slate 600 (#475569)
    '--text-muted-rgb': '71, 85, 105',
    '--border-color': '#e2e8f0',         // Divider & Border Light (#E2E8F0)
  },
  light_new: {
    '--brand-orange': '#3d7e88',         // Marine Voyage Teal (#3D7E88)
    '--brand-orange-rgb': '61, 126, 136',
    '--bg-canvas': '#193950',            // Marine Dark Oceanic Blue (#193950)
    '--bg-canvas-rgb': '25, 57, 80',
    '--bg-surface': '#2f5a6a',           // Marine Surface (#2F5A6A)
    '--bg-surface-rgb': '47, 90, 106',
    '--bg-card': '#234958',              // Deep Oceanic Card (#234958)
    '--bg-card-rgb': '35, 73, 88',
    '--text-primary': '#e3e5e7',         // Off-White Primary Heading (#E3E5E7)
    '--text-primary-rgb': '227, 229, 231',
    '--text-muted': '#9eb7ba',           // Light Blue-Grey Muted Text (#9EB7BA)
    '--text-muted-rgb': '158, 183, 186',
    '--border-color': '#717a86',         // Medium Grey Border (#717A86)
  },
  light_green: {
    '--brand-orange': '#addb1c',         // Finovate Lime Green Accent (#ADDB1C)
    '--brand-orange-rgb': '173, 219, 28',
    '--bg-canvas': '#f9f8f7',            // Warm Off-White Canvas Base (#F9F8F7)
    '--bg-canvas-rgb': '249, 248, 247',
    '--bg-surface': '#eef0ea',           // Soft Sage Surface (#EEF0EA)
    '--bg-surface-rgb': '238, 240, 234',
    '--bg-card': '#f1f3ed',              // Light Sage Card Fill (#F1F3ED)
    '--bg-card-rgb': '241, 243, 237',
    '--text-primary': '#302318',         // Rich Dark Espresso Brown Heading (#302318)
    '--text-primary-rgb': '48, 35, 24',
    '--text-muted': '#645039',           // Medium Dark Warm Sage Body Text (#645039)
    '--text-muted-rgb': '100, 80, 57',
    '--border-color': '#c3c6be',         // Light Sage Border (#C3C6BE)
  },
};

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
    id: 'bobbin',
    label: 'Bobbin Theme',
    description: 'Bobbin Award design — Warm espresso canvas with coral crimson accents & sand text',
    iconName: 'Palette',
  },
  {
    id: 'mainline',
    label: 'Mainline Theme',
    description: 'Mainline Next.js design — Electric cyan & deep ocean slate content theme',
    iconName: 'Sparkles',
  },
  {
    id: 'supaste',
    label: 'Supaste Theme (Design+Skill)',
    description: 'Supaste Award design & skill — Structured charcoal marketing theme with crimson tokens',
    iconName: 'Layers',
  },
  {
    id: 'teoro',
    label: 'Teoro Theme (Design+Skill)',
    description: 'Teoro design & skill — Implementation-first content site theme with cyan highlights',
    iconName: 'Sparkles',
  },
  {
    id: 'rebuld',
    label: 'Rebuld Theme (Design+Skill)',
    description: 'Rebuld design & skill — High-contrast obsidian & tech cyan marketing design system',
    iconName: 'Layers',
  },
  {
    id: 'system',
    label: 'System',
    description: 'Matches your OS dark/light preference',
    iconName: 'Monitor',
  },
];

// Color Palette specifications matching Theme 2, Marine Voyage, Finovate Sage, Bobbin, Mainline, Supaste, Teoro, Rebuld
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
  bobbin: {
    '--brand-orange': '#d94f5c',         // Bobbin Coral Crimson Accent (#D94F5C)
    '--brand-orange-rgb': '217, 79, 92',
    '--bg-canvas': '#14100e',            // Deep Warm Espresso Base (#14100E)
    '--bg-canvas-rgb': '20, 16, 14',
    '--bg-surface': '#251d18',           // Dark Warm Coffee Surface (#251D18)
    '--bg-surface-rgb': '37, 29, 24',
    '--bg-card': '#332822',              // Warm Muted Card (#332822)
    '--bg-card-rgb': '51, 40, 34',
    '--text-primary': '#e6dfdb',         // Sand White Primary Text (#E6DFDB)
    '--text-primary-rgb': '230, 223, 219',
    '--text-muted': '#9b816f',           // Warm Taupe Muted Text (#9B816F)
    '--text-muted-rgb': '155, 129, 111',
    '--border-color': 'rgba(217, 79, 92, 0.25)',
  },
  mainline: {
    '--brand-orange': '#11c1f4',         // Mainline Electric Cyan Accent (#11C1F4)
    '--brand-orange-rgb': '17, 193, 244',
    '--bg-canvas': '#0a1017',            // Deep Slate Cyan Canvas (#0A1017)
    '--bg-canvas-rgb': '10, 16, 23',
    '--bg-surface': '#111a24',           // Midnight Cyan Surface (#111A24)
    '--bg-surface-rgb': '17, 26, 36',
    '--bg-card': '#1a2634',              // Cyan Slate Card Fill (#1A2634)
    '--bg-card-rgb': '26, 38, 52',
    '--text-primary': '#f0f6fc',         // Ice White Primary Text (#F0F6FC)
    '--text-primary-rgb': '240, 246, 252',
    '--text-muted': '#7e6858',           // Taupe Slate Muted Text (#7E6858)
    '--text-muted-rgb': '126, 104, 88',
    '--border-color': 'rgba(17, 193, 244, 0.25)',
  },
  supaste: {
    '--brand-orange': '#d94f5c',         // Supaste Crimson Accent (#D94F5C)
    '--brand-orange-rgb': '217, 79, 92',
    '--bg-canvas': '#0d0b0c',            // Charcoal Obsidian Base (#0D0B0C)
    '--bg-canvas-rgb': '13, 11, 12',
    '--bg-surface': '#191517',           // Dark Charcoal Surface (#191517)
    '--bg-surface-rgb': '25, 21, 23',
    '--bg-card': '#241e21',              // Charcoal Rose Card (#241E21)
    '--bg-card-rgb': '36, 30, 33',
    '--text-primary': '#e6dfdb',         // Sand Ivory Text (#E6DFDB)
    '--text-primary-rgb': '230, 223, 219',
    '--text-muted': '#9b816f',           // Warm Muted Taupe (#9B816F)
    '--text-muted-rgb': '155, 129, 111',
    '--border-color': 'rgba(217, 79, 92, 0.3)',
  },
  teoro: {
    '--brand-orange': '#11c1f4',         // Teoro Cyan Accent (#11C1F4)
    '--brand-orange-rgb': '17, 193, 244',
    '--bg-canvas': '#0c1218',            // Night Teal Canvas Base (#0C1218)
    '--bg-canvas-rgb': '12, 18, 24',
    '--bg-surface': '#131c26',           // Teal Slate Surface (#131C26)
    '--bg-surface-rgb': '19, 28, 38',
    '--bg-card': '#1c2836',              // Slate Card (#1C2836)
    '--bg-card-rgb': '28, 40, 54',
    '--text-primary': '#ffffff',         // Pure White Text (#FFFFFF)
    '--text-primary-rgb': '255, 255, 255',
    '--text-muted': '#7e6858',           // Muted Warm Slate (#7E6858)
    '--text-muted-rgb': '126, 104, 88',
    '--border-color': 'rgba(17, 193, 244, 0.25)',
  },
  rebuld: {
    '--brand-orange': '#11c1f4',         // Rebuld Tech Cyan (#11C1F4)
    '--brand-orange-rgb': '17, 193, 244',
    '--bg-canvas': '#070a0e',            // Deep Tech Black Canvas (#070A0E)
    '--bg-canvas-rgb': '7, 10, 14',
    '--bg-surface': '#0f151d',           // Dark Tech Blue Surface (#0F151D)
    '--bg-surface-rgb': '15, 21, 29',
    '--bg-card': '#17202c',              // Tech Blue Card (#17202C)
    '--bg-card-rgb': '23, 32, 44',
    '--text-primary': '#f0f4f8',         // Crisp Tech Text (#F0F4F8)
    '--text-primary-rgb': '240, 244, 248',
    '--text-muted': '#9b816f',           // Warm Tech Muted (#9B816F)
    '--text-muted-rgb': '155, 129, 111',
    '--border-color': 'rgba(17, 193, 244, 0.3)',
  },
};

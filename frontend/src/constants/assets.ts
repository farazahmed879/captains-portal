/**
 * Application Asset Paths
 * Centralized constant references for images, logos, and illustrations
 */

export const ASSETS = {
  /** Official Captain's Portal Steering Helm Logo */
  LOGO: '/images/captains-portal-icon.png',

  /** Editorial Cricket Stadium & Floodlight Illustration */
  CRICKET_HERO: '/images/cricket-hero.jpg',
} as const;

export type AssetKey = keyof typeof ASSETS;

import { colors } from './theme';

export type PuckBand = 'red' | 'amber' | 'green';

export function puckColor(score: number): PuckBand {
  if (score < 50) return 'red';
  if (score < 70) return 'amber';
  return 'green';
}

export function puckHex(score: number): string {
  const band = puckColor(score);
  if (band === 'red') return colors.red;
  if (band === 'amber') return colors.amber;
  return colors.mint;
}

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

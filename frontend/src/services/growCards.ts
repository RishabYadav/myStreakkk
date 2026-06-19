import { GrowCardTemplate } from '../types';
import { MOCK_GROW_CARD_TEMPLATES } from '../mockData/growCardTemplates';

/**
 * Fetch shareable card HTML templates from backend.
 * Currently returns mock data — swap URL when API is ready.
 */
export async function fetchGrowCardTemplates(): Promise<GrowCardTemplate[]> {
  // const base = process.env.EXPO_PUBLIC_API_BASE;
  // const res = await fetch(`${base}/grow/cards`);
  // if (!res.ok) throw new Error('Failed to load grow cards');
  // return res.json() as Promise<GrowCardTemplate[]>;

  await new Promise((r) => setTimeout(r, 120));
  return MOCK_GROW_CARD_TEMPLATES;
}

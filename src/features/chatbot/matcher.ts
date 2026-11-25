// Matcher module. Interface: findAnswer(query) -> string.
// Token-exact matching: "hi" never matches "hire" or "history", and
// Indonesian detection uses whole words only.

import { knowledgeBase, type KnowledgeEntry } from './knowledge-base';

export const FALLBACK_ANSWER =
  'That’s an interesting question! I haven’t programmed an answer for that one yet.';
export const EN_ONLY_ANSWER = 'saat ini saya hanya tersedia dalam bahasa inggris';

// Whole-word Indonesian stopwords. Collision-prone particles
// ("di", "dan", "ya", "halo", "hai", "selamat") are excluded on purpose:
// they appear inside ordinary English queries.
const INDO_STOPS = new Set([
  'apa',
  'siapa',
  'dimana',
  'mana',
  'kapan',
  'kenapa',
  'bagaimana',
  'yang',
  'saya',
  'kamu',
  'bisa',
  'tolong',
  'terima',
  'kasih',
  'adalah',
  'tentang',
  'seperti',
  'dari',
  'tidak',
  'punya',
  'berapa',
]);

export function tokenize(query: string | null | undefined): string[] {
  return (query ?? '').toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

export function findAnswer(
  query: string,
  entries: readonly KnowledgeEntry[] = knowledgeBase,
): string {
  const tokens = new Set(tokenize(query));
  for (const token of tokens) {
    if (INDO_STOPS.has(token)) return EN_ONLY_ANSWER;
  }

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const entry of entries) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const words = keyword.toLowerCase().split(/\s+/);
      if (words.every((w) => tokens.has(w))) score += words.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best ? best.answer : FALLBACK_ANSWER;
}

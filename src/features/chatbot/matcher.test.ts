import { describe, expect, it } from 'vitest';
import { profile } from '@/shared/lib/profile';
import { knowledgeBase } from './knowledge-base';
import { EN_ONLY_ANSWER, FALLBACK_ANSWER, findAnswer, tokenize } from './matcher';

describe('tokenize', () => {
  it('lowercases and splits on non-word characters', () => {
    expect(tokenize("Hello, World's best!")).toEqual(['hello', "world's", 'best']);
  });
  it('handles empty and nullish input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize(null)).toEqual([]);
    expect(tokenize(undefined)).toEqual([]);
  });
});

describe('findAnswer', () => {
  it('greets on whole-word hi', () => {
    expect(findAnswer('hi')).toMatch(/virtual assistant/);
  });

  it('does not treat "hi" inside "hire" or "history" as a greeting', () => {
    expect(findAnswer('hire')).not.toMatch(/virtual assistant/);
    expect(findAnswer('history')).toBe(FALLBACK_ANSWER);
  });

  it('matches multi-word keywords only when every word is present', () => {
    expect(findAnswer('why hire you')).toMatch(/build solutions/);
    expect(findAnswer('why')).toBe(FALLBACK_ANSWER);
  });

  it('prefers the entry with the higher score', () => {
    const kb = [
      { keywords: ['alpha'], answer: 'one' },
      { keywords: ['alpha beta'], answer: 'two' },
    ];
    expect(findAnswer('alpha beta', kb)).toBe('two');
  });

  it('is case-insensitive, including upper-case keywords like MBTI', () => {
    expect(findAnswer('What is your MBTI?')).toMatch(/ISTJ/);
    expect(findAnswer('mbti')).toMatch(/ISTJ/);
  });

  it('answers in English only when the query is Indonesian', () => {
    expect(findAnswer('siapa kamu')).toBe(EN_ONLY_ANSWER);
    expect(findAnswer('apa kabar')).toBe(EN_ONLY_ANSWER);
  });

  it('falls back politely for unknown questions', () => {
    expect(findAnswer('quantum chromodynamics')).toBe(FALLBACK_ANSWER);
    expect(findAnswer('')).toBe(FALLBACK_ANSWER);
  });

  it('serves facts from the shared profile (single source of truth)', () => {
    expect(findAnswer('what is your email')).toContain(profile.email);
    expect(findAnswer('what is your top skill')).toContain('Laravel');
  });

  it('does not claim a stack the owner does not use', () => {
    const all = knowledgeBase.map((e) => e.answer).join(' ');
    expect(all).not.toMatch(/Next\.js|Node\.js|TensorFlow/);
    expect(findAnswer('who are you')).not.toMatch(/AI-powered/i);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './useReducedMotion';

function mockMatchMedia(initial: boolean) {
  let listener: (() => void) | null = null;
  const state = { matches: initial };
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return state.matches;
    },
    addEventListener: (_: string, cb: () => void) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
  })) as unknown as typeof window.matchMedia;
  return {
    set(value: boolean) {
      state.matches = value;
      listener?.();
    },
  };
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reflects the media query and reacts to changes', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => media.set(true));
    expect(result.current).toBe(true);
  });
});

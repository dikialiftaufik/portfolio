import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { profile } from '@/shared/lib/profile';
import { useCvUrl, type CvLinkStore } from './useCvUrl';

const storeWith = (getSettings: CvLinkStore['getSettings']): CvLinkStore => ({ getSettings });
const live = (cvUrl: string) => async () => ({ data: { cvUrl }, source: 'live' as const });

afterEach(() => vi.useRealTimers());

describe('useCvUrl', () => {
  it('starts with the bundled link, then upgrades to the live one', async () => {
    const store = storeWith(live('https://example.com/new-cv'));
    const { result } = renderHook(() => useCvUrl(store));
    expect(result.current).toBe(profile.cvUrl);
    await waitFor(() => expect(result.current).toBe('https://example.com/new-cv'));
  });

  it.each([
    ['the live value is not a safe link', storeWith(live('javascript:alert(1)'))],
    ['the request fails', storeWith(async () => Promise.reject(new Error('boom')))],
  ])('keeps the bundled link when %s', async (_name, store) => {
    vi.useFakeTimers();
    const spy = vi.spyOn(store, 'getSettings');
    const { result } = renderHook(() => useCvUrl(store));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(spy).toHaveBeenCalledOnce();
    expect(result.current).toBe(profile.cvUrl);
  });

  it('does not fetch after it unmounts', async () => {
    vi.useFakeTimers();
    const getSettings = vi.fn(live('https://example.com/new-cv'));
    const store = storeWith(getSettings);
    renderHook(() => useCvUrl(store)).unmount();
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(getSettings).not.toHaveBeenCalled();
  });
});

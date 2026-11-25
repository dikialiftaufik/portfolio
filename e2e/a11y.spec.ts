import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mockLiveBackend, mockOfflineBackend } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  // Readable failure output: rule, impact and the offending selectors.
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
  expect(summary).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  // Entry animations would be scanned mid-fade (false contrast failures); reduced motion is also a supported mode.
  test.use({ reducedMotion: 'reduce' });

  test('home page', async ({ page }) => {
    await mockLiveBackend(page);
    await page.goto('/');
    await expect(page.getByText('Live Project 1')).toBeVisible();
    await scan(page);
  });

  test('home page, certificates tab and modal', async ({ page }) => {
    await mockLiveBackend(page);
    await page.goto('/');
    await page.getByRole('tab', { name: /Certificates/ }).click();
    await page.getByRole('button', { name: /View certificate/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan(page);
  });

  test('home page in Indonesian, seed fallback banner', async ({ page }) => {
    await mockOfflineBackend(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Bahasa Indonesia' }).first().click();
    await expect(page.getByText('Showing cached content')).toBeVisible();
    await scan(page);
  });

  test('admin login', async ({ page }) => {
    await mockLiveBackend(page);
    await page.route('https://e2e.supabase.co/auth/**', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await page.goto('/admin.html');
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await scan(page);
  });
});

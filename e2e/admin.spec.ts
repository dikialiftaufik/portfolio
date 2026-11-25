import { expect, test } from '@playwright/test';
import { API, mockLiveBackend } from './helpers';

test.describe('admin console', () => {
  test('is not indexable and shows the login form when signed out', async ({ page }) => {
    await mockLiveBackend(page);
    await page.goto('/admin.html');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'EMAIL' })).toBeEnabled();
  });

  test('reports a failed sign-in without leaking details', async ({ page }) => {
    await mockLiveBackend(page);
    await page.route(`${API}/auth/v1/token*`, (r) =>
      r.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      }),
    );
    await page.goto('/admin.html');
    await page.getByRole('textbox', { name: 'EMAIL' }).fill('someone@example.com');
    await page.getByLabel('PASSWORD', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText("Couldn't sign in");
  });

  test('the public bundle does not ship admin code', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', (r) => {
      if (r.url().endsWith('.js')) scripts.push(r.url());
    });
    await mockLiveBackend(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    for (const url of scripts) {
      const body = await (await page.request.get(url)).text();
      expect(body).not.toContain('Portfolio console');
    }
  });
});

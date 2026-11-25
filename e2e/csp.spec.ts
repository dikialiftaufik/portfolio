import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { mockLiveBackend } from './helpers';

// `vite preview` does not send the Vercel headers, so the production policy is
// read from vercel.json and attached to the document here.
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const csp = vercel.headers
  .flatMap((rule) => rule.headers)
  .find((header) => header.key === 'Content-Security-Policy')!.value;

for (const path of ['/', '/admin.html']) {
  test(`every font on ${path} loads under the production CSP`, async ({ page }) => {
    await mockLiveBackend(page);
    await page.route(
      (url) => url.pathname === path,
      async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          headers: { ...response.headers(), 'content-security-policy': csp },
        });
      },
    );
    await page.addInitScript(() => {
      const violations: string[] = [];
      Object.assign(window, { cspViolations: violations });
      document.addEventListener('securitypolicyviolation', (event) => {
        if (event.effectiveDirective === 'font-src') violations.push(event.blockedURI);
      });
    });

    const response = await page.goto(path);
    expect(response!.headers()['content-security-policy']).toBe(csp);
    await page.waitForLoadState('networkidle');

    // Browsers fetch a unicode-range subset only when the text needs it, so ask for
    // all of them: otherwise a blocked subset goes unnoticed.
    const fonts = await page.evaluate(async () => {
      const faces = [...document.fonts];
      await Promise.allSettled(faces.map((face) => face.load()));
      return { total: faces.length, failed: faces.filter((f) => f.status !== 'loaded').length };
    });

    expect(fonts.total).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations),
    ).toEqual([]);
    expect(fonts.failed).toBe(0);
  });
}

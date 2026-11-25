import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { profile } from '../src/shared/lib/profile';
import { LIVE_CV_URL, mockLiveBackend, mockOfflineBackend } from './helpers';

test.describe('public site, backend up', () => {
  test('renders live content without the cached-content banner', async ({ page }) => {
    await mockLiveBackend(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Diki Alif Taufik');
    await expect(page.getByText('Live Project 1')).toBeVisible();
    await expect(page.getByText('Showing cached content')).toHaveCount(0);
  });

  test('sends a contact message through the rate-limited RPC', async ({ page }) => {
    const { rpcCalls } = await mockLiveBackend(page);
    await page.goto('/');
    await page.getByRole('textbox', { name: 'NAME' }).fill('Ada Lovelace');
    await page.getByRole('textbox', { name: 'EMAIL' }).fill('ada@example.com');
    await page.getByRole('textbox', { name: 'MESSAGE' }).fill('Hello from the end-to-end test.');
    await page.getByRole('button', { name: 'Send Message', exact: true }).click();

    await expect(page.getByText(/Message sent/)).toBeVisible();
    expect(rpcCalls).toEqual([
      {
        p_name: 'Ada Lovelace',
        p_email: 'ada@example.com',
        p_message: 'Hello from the end-to-end test.',
      },
    ]);
    await expect(page.getByRole('textbox', { name: 'NAME' })).toHaveValue('');
  });
});

test.describe('public site, backend down', () => {
  test.beforeEach(async ({ page }) => {
    await mockOfflineBackend(page);
  });

  test('falls back to the seed with an honest banner and never a blank page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Showing cached content')).toBeVisible();
    await expect(page.getByText('BOLOOO')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('tabs, certificate modal and keyboard behaviour', async ({ page }) => {
    await page.goto('/');
    const projectsTab = page.getByRole('tab', { name: /Projects/ });
    await projectsTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: /Certificates/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const cert = page.getByRole('button', { name: /View certificate: InnovAItion/ });
    await cert.click();
    const dialog = page.getByRole('dialog', { name: /InnovAItion/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('img')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(cert).toBeFocused();
  });

  test('legacy images load as webp and the tech icons render', async ({ page }) => {
    await page.goto('/');
    const img = page.getByAltText('BOLOOO');
    await img.scrollIntoViewIfNeeded(); // images are loading="lazy"
    await expect(img).toBeVisible();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.currentSrc))
      .toMatch(/\.webp$/);
    await page.getByRole('tab', { name: /Tech Stack/ }).click();
    const react = page.locator('img[src="/tech/react.svg"]');
    await react.scrollIntoViewIfNeeded();
    await expect(react).toBeVisible();
    await expect
      .poll(() => react.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
  });

  test('language switch updates copy and <html lang>', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Bahasa Indonesia' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByRole('button', { name: 'Kontak' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bahasa Indonesia' }).first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('chatbot answers from the knowledge base', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Ask about Diki').fill('mbti');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(page.getByRole('log')).toContainText('ISTJ', { timeout: 5000 });
  });

  test('contact form falls back to mailto when the backend is unreachable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'NAME' }).fill('Ada Lovelace');
    await page.getByRole('textbox', { name: 'EMAIL' }).fill('ada@example.com');
    await page.getByRole('textbox', { name: 'MESSAGE' }).fill('Hello from the end-to-end test.');
    await page.getByRole('button', { name: 'Send Message', exact: true }).click();
    // Offline is not "not configured": the message is kept and the error is shown.
    await expect(page.getByRole('status').getByText(/Couldn't reach the server/)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'NAME' })).toHaveValue('Ada Lovelace');
  });
});

test.describe('responsive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile menu works and the page never scrolls horizontally', async ({ page }) => {
    await mockOfflineBackend(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
    await page.getByTestId('mobile-menu').getByRole('button', { name: 'Contact' }).click();
    await expect(page.getByTestId('mobile-menu')).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // Regression: the nowrap chips used to stretch the chat panel past the viewport.
    const box = await page.locator('#about .glass-panel').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows a static role instead of the typing animation', async ({ page }) => {
    await mockOfflineBackend(page);
    await page.goto('/');
    await expect(page.getByText('Junior Web Developer').first()).toBeVisible();
  });
});

test.describe('Download CV link', () => {
  const button = { name: 'Download CV' };

  test('points at the link the admin saved', async ({ page }) => {
    await mockLiveBackend(page);
    await page.goto('/');
    await expect(page.getByRole('link', button)).toHaveAttribute('href', LIVE_CV_URL);
  });

  test('keeps the bundled link when the backend is down', async ({ page }) => {
    await mockOfflineBackend(page);
    await page.goto('/');
    await expect(page.getByText('Showing cached content')).toBeVisible();
    await expect(page.getByRole('link', button)).toHaveAttribute('href', profile.cvUrl);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });

    test('the menu offers the saved link, opens it in a new tab and closes', async ({
      page,
      context,
    }) => {
      await mockLiveBackend(page);
      await context.route('https://files.example.com/**', (r) =>
        r.fulfill({ status: 200, contentType: 'text/html', body: '<title>CV</title>' }),
      );
      await page.goto('/');
      await expect(page.getByText('Live Project 1')).toBeVisible();
      await page.getByRole('button', { name: 'Menu' }).click();
      const link = page.getByTestId('mobile-menu').getByRole('link', button);
      await expect(link).toHaveAttribute('href', LIVE_CV_URL);

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(violations.map((v) => v.id)).toEqual([]);

      const popup = page.waitForEvent('popup');
      await link.click();
      await expect(await popup).toHaveURL(LIVE_CV_URL);
      await expect(page.getByTestId('mobile-menu')).toHaveCount(0);
    });

    test('the menu falls back to the bundled link when the backend is down', async ({ page }) => {
      await mockOfflineBackend(page);
      await page.goto('/');
      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByTestId('mobile-menu').getByRole('link', button)).toHaveAttribute(
        'href',
        profile.cvUrl,
      );
    });
  });
});

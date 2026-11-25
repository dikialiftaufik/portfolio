import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';
import { API } from './helpers';

// Signed-in admin flows against an intercepted backend. supabase-js reads its session from
// localStorage (key sb-<project-ref>-auth-token, ref = first host label = "e2e").
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const SESSION = {
  access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'u1', role: 'authenticated', exp: 4102444800 })}.sig`,
  refresh_token: 'refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 4102444800,
  user: {
    id: 'u1',
    aud: 'authenticated',
    email: 'admin@example.com',
    app_metadata: { role: 'admin' },
  },
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const PROJECT = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Existing Project',
  tagline: 'tag',
  description: 'desc',
  tech: ['React'],
  image: 'https://e2e.supabase.co/x.png',
  github_link: null,
  sort_order: 0,
};
const MESSAGE = {
  id: '00000000-0000-4000-8000-0000000000m1',
  name: 'Grace Hopper',
  email: 'grace@example.com',
  message: 'Loved the portfolio, let us talk.',
  is_read: false,
  created_at: '2026-01-02T10:00:00Z',
};

interface Recorded {
  method: string;
  url: string;
  body: unknown;
}

async function signedIn(page: Page, opts: { denyWrites?: boolean } = {}) {
  const writes: Recorded[] = [];
  await page.addInitScript((s) => {
    localStorage.setItem('sb-e2e-auth-token', JSON.stringify(s));
  }, SESSION);

  const table = (rows: unknown[]) => async (route: Route) => {
    const req = route.request();
    const method = req.method();
    if (method === 'GET') return json(route, rows);
    writes.push({ method, url: req.url(), body: req.postData() ? req.postDataJSON() : null });
    if (opts.denyWrites) {
      return json(
        route,
        { code: '42501', message: 'new row violates row-level security policy' },
        401,
      );
    }
    if (method === 'DELETE') return route.fulfill({ status: 204, body: '' });
    return json(
      route,
      { ...PROJECT, ...(req.postDataJSON() ?? {}) },
      method === 'POST' ? 201 : 200,
    );
  };
  await page.route(`${API}/rest/v1/projects*`, table([PROJECT]));
  await page.route(`${API}/rest/v1/certificates*`, table([]));
  await page.route(`${API}/rest/v1/tech_stack*`, table([]));
  await page.route(`${API}/rest/v1/messages*`, table([MESSAGE]));
  return { writes };
}

test.describe('admin console, signed in', () => {
  test('lists content from the live backend and the inbox', async ({ page }) => {
    await signedIn(page);
    await page.goto('/admin.html');
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
    await expect(page.getByText('Existing Project')).toBeVisible();
    await expect(page.getByText('Live').first()).toBeVisible();
    await expect(page.getByText('Grace Hopper')).toBeVisible();
    await expect(page.getByText('1 unread')).toBeVisible();
  });

  test('has no WCAG 2.2 AA violations (list, edit form, delete dialog)', async ({ page }) => {
    await signedIn(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/admin.html');
    await expect(page.getByText('Existing Project')).toBeVisible();
    const scan = async () => {
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
      ).toEqual([]);
    };
    await scan();
    await page.getByRole('button', { name: 'Edit Existing Project' }).click();
    await expect(page.getByRole('button', { name: 'Save project' })).toBeVisible();
    await scan();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Delete Existing Project' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan();
  });

  test('adds a project: validates first, then maps fields to DB columns', async ({ page }) => {
    const { writes } = await signedIn(page);
    await page.goto('/admin.html');
    await page.getByRole('button', { name: 'Add project' }).click();

    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByText('Keep the title between 3 and 80 characters.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'TITLE' })).toBeFocused();
    expect(writes).toHaveLength(0);

    await page.getByRole('textbox', { name: 'TITLE' }).fill('Brand New Project');
    await page.getByRole('textbox', { name: 'TECH (comma-separated)' }).fill('React, Supabase');
    await page.getByRole('textbox', { name: 'IMAGE URL' }).fill('https://example.com/cover.png');
    await page
      .getByRole('textbox', { name: 'GITHUB (optional)' })
      .fill('https://github.com/me/repo');
    await page.getByRole('button', { name: 'Save project' }).click();

    await expect(page.getByText('Project saved.')).toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0]!.method).toBe('POST');
    expect(writes[0]!.body).toMatchObject({
      title: 'Brand New Project',
      tech: ['React', 'Supabase'],
      image: 'https://example.com/cover.png',
      github_link: 'https://github.com/me/repo',
    });
    expect(writes[0]!.body).not.toHaveProperty('githubLink');
  });

  test('edits a project with PATCH on its id', async ({ page }) => {
    const { writes } = await signedIn(page);
    await page.goto('/admin.html');
    await page.getByRole('button', { name: 'Edit Existing Project' }).click();
    await page.getByRole('textbox', { name: 'TITLE' }).fill('Renamed Project');
    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByText('Project saved.')).toBeVisible();
    expect(writes[0]!.method).toBe('PATCH');
    expect(writes[0]!.url).toContain(`id=eq.${PROJECT.id}`);
  });

  test('delete asks for confirmation, traps focus, and Escape cancels', async ({ page }) => {
    const { writes } = await signedIn(page);
    await page.goto('/admin.html');
    const trigger = page.getByRole('button', { name: 'Delete Existing Project' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Delete project' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused(); // wrapped inside
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(writes).toHaveLength(0);

    await trigger.click();
    await page.getByRole('button', { name: 'Delete project', exact: true }).click();
    await expect(page.getByText('Project deleted.')).toBeVisible();
    expect(writes[0]!.method).toBe('DELETE');
    expect(writes[0]!.url).toContain(`id=eq.${PROJECT.id}`);
  });

  test('marks a message as read', async ({ page }) => {
    const { writes } = await signedIn(page);
    await page.goto('/admin.html');
    await page.getByRole('button', { name: 'Mark as read: message from Grace Hopper' }).click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toMatchObject({ method: 'PATCH', body: { is_read: true } });
  });

  test('tells the admin when the session was rejected (denied write)', async ({ page }) => {
    await signedIn(page, { denyWrites: true });
    await page.goto('/admin.html');
    await page.getByRole('button', { name: 'Edit Existing Project' }).click();
    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByRole('alert')).toContainText('Your session expired. Log in again.');
  });
});

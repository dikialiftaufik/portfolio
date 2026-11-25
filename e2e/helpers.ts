import type { Page, Route } from '@playwright/test';

export const API = 'https://e2e.supabase.co';

const project = (n: number) => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  title: `Live Project ${n}`,
  tagline: 'From the mocked backend',
  description: 'Rendered from an intercepted PostgREST response.',
  tech: ['React', 'Supabase'],
  image: 'https://e2e.supabase.co/storage/v1/object/public/portfolio-media/p.webp',
  github_link: 'https://github.com/example/repo',
  sort_order: n,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

export const LIVE_CV_URL = 'https://files.example.com/live-cv.pdf';

/** PostgREST answers one object when the client asks for one, otherwise an array. */
export const singleRow = (route: Route, row: object) => {
  const one = route.request().headers()['accept']?.includes('vnd.pgrst.object');
  return json(route, one ? row : [row]);
};

/** Backend "up": REST returns fixtures, the contact RPC succeeds (and is recorded). */
export async function mockLiveBackend(page: Page) {
  const rpcCalls: unknown[] = [];
  await page.route(`${API}/rest/v1/projects*`, (r) => json(r, [project(1), project(2)]));
  await page.route(`${API}/rest/v1/certificates*`, (r) =>
    json(r, [
      {
        id: '00000000-0000-4000-8000-0000000000c1',
        title: 'Live Certificate',
        issuer: 'Mock Issuer',
        date_label: 'Jan 2026',
        image: 'https://e2e.supabase.co/storage/v1/object/public/portfolio-media/c.webp',
        sort_order: 0,
      },
    ]),
  );
  await page.route(`${API}/rest/v1/tech_stack*`, (r) =>
    json(r, [{ id: 't1', name: 'React', icon: 'devicon-react-original', sort_order: 0 }]),
  );
  await page.route(`${API}/rest/v1/site_settings*`, (r) => singleRow(r, { cv_url: LIVE_CV_URL }));
  await page.route(`${API}/rest/v1/rpc/submit_message`, async (r) => {
    rpcCalls.push(r.request().postDataJSON());
    await r.fulfill({ status: 204, body: '' });
  });
  // Images from the mocked storage host: a 1x1 transparent png.
  await page.route(`${API}/storage/**`, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64',
      ),
    }),
  );
  return { rpcCalls };
}

/** Backend "down": every request fails at the network layer, so the site must use the seed. */
export async function mockOfflineBackend(page: Page) {
  await page.route(`${API}/**`, (r) => r.abort('failed'));
}

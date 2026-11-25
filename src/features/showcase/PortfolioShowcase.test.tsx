import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { certificatesData, projectsData, techStackData } from '@/content/seed';
import { translations } from '@/shared/lib/locale';
import type { Collection } from '@/shared/lib/store';
import { PortfolioShowcase } from './PortfolioShowcase';
import type { ShowcaseStore } from './useShowcaseData';

const t = translations.en;

const seedFor = (c: Collection) =>
  c === 'projects' ? projectsData : c === 'certificates' ? certificatesData : techStackData;

function makeStore(opts: { source?: 'live' | 'seed'; fail?: Collection[] } = {}): ShowcaseStore {
  return {
    list: vi.fn(async (c: Collection) => {
      if (opts.fail?.includes(c)) throw new Error('boom');
      return { data: seedFor(c), source: opts.source ?? 'live' };
    }),
    subscribe: vi.fn(() => () => {}),
  } as unknown as ShowcaseStore;
}

describe('<PortfolioShowcase />', () => {
  it('shows a loading state, then the projects', async () => {
    render(<PortfolioShowcase t={t} store={makeStore()} />);
    expect(screen.getByText(/Loading projects/)).toBeInTheDocument();
    expect(await screen.findByText(projectsData[0]!.title)).toBeInTheDocument();
    expect(screen.queryByText(/Showing cached content/)).toBeNull();
  });

  it('is honest about seed data and offers a retry', async () => {
    const store = makeStore({ source: 'seed' });
    const user = userEvent.setup();
    render(<PortfolioShowcase t={t} store={store} />);
    expect(await screen.findByText(/Showing cached content/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(store.list).toHaveBeenCalledTimes(6));
  });

  it('keeps working collections visible when one fails, with an alert', async () => {
    render(<PortfolioShowcase t={t} store={makeStore({ fail: ['certificates'] })} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Couldn't load the showcase/);
    expect(screen.getByText(projectsData[0]!.title)).toBeInTheDocument();
  });

  it('implements the tabs pattern with arrow-key navigation', async () => {
    const user = userEvent.setup();
    render(<PortfolioShowcase t={t} store={makeStore()} />);
    await screen.findByText(projectsData[0]!.title);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');

    tabs[0]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-certificates');

    await user.keyboard('{End}');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('opens a certificate in a modal, traps focus, and closes on Escape', async () => {
    const user = userEvent.setup();
    render(<PortfolioShowcase t={t} store={makeStore()} />);
    await screen.findByText(projectsData[0]!.title);
    await user.click(screen.getByRole('tab', { name: /Certificates/ }));

    const trigger = await screen.findByRole('button', {
      name: new RegExp(certificatesData[0]!.title),
    });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: certificatesData[0]!.title });
    const close = screen.getByRole('button', { name: 'Close certificate view' });
    expect(dialog).toBeInTheDocument();
    expect(close).toHaveFocus();

    await user.tab(); // only one focusable element: focus must stay inside
    expect(close).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('renders the tech grid from the data', async () => {
    const user = userEvent.setup();
    render(<PortfolioShowcase t={t} store={makeStore()} />);
    await screen.findByText(projectsData[0]!.title);
    await user.click(screen.getByRole('tab', { name: /Tech Stack/ }));
    expect(await screen.findByText(techStackData[0]!.name)).toBeInTheDocument();
  });
});

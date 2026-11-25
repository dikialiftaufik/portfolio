import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { translations } from '@/shared/lib/locale';
import { StoreError } from '@/shared/lib/store';
import { Contact } from './Contact';

const t = translations.en;

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(t.contact.name), 'Ada Lovelace');
  await user.type(screen.getByLabelText(t.contact.email), 'ada@example.com');
  await user.type(screen.getByLabelText(t.contact.msg), 'Hello there, lovely portfolio!');
}

describe('<Contact />', () => {
  it('sends the message, announces success and clears the form', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Contact t={t} send={send} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: new RegExp(t.contact.btn) }));

    await waitFor(() => expect(screen.getByText(t.contact.sent)).toBeInTheDocument());
    expect(send).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Hello there, lovely portfolio!',
    });
    expect(screen.getByLabelText(t.contact.name)).toHaveValue('');
  });

  it('keeps the typed message and shows the error when sending fails', async () => {
    const send = vi.fn().mockRejectedValue(new StoreError('offline', "Couldn't reach the server."));
    const user = userEvent.setup();
    render(<Contact t={t} send={send} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: new RegExp(t.contact.btn) }));

    expect(await screen.findByText("Couldn't reach the server.")).toBeInTheDocument();
    expect(screen.getByLabelText(t.contact.name)).toHaveValue('Ada Lovelace');
  });

  it('throttles a second send within 30 seconds', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Contact t={t} send={send} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: new RegExp(t.contact.btn) }));
    await screen.findByText(t.contact.sent);

    await fill(user);
    await user.click(screen.getByRole('button', { name: new RegExp(t.contact.btn) }));
    expect(await screen.findByText(t.contact.throttle)).toBeInTheDocument();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('silently drops submissions that fill the honeypot', async () => {
    const send = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Contact t={t} send={send} />);
    await fill(user);
    await user.type(container.querySelector('input[name="company"]')!, 'Spam Inc');
    await user.click(screen.getByRole('button', { name: new RegExp(t.contact.btn) }));
    expect(send).not.toHaveBeenCalled();
  });

  it('falls back to mailto when the backend is not configured', async () => {
    const send = vi.fn().mockRejectedValue(new StoreError('not-configured', 'off'));
    const hrefSetter = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        set href(v: string) {
          hrefSetter(v);
        },
      },
    });
    const user = userEvent.setup();
    render(<Contact t={t} send={send} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: new RegExp(t.contact.btn) }));

    await waitFor(() => expect(hrefSetter).toHaveBeenCalled());
    expect(hrefSetter.mock.calls[0]![0]).toMatch(/^mailto:/);
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });
});

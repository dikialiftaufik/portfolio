import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { translations } from '@/shared/lib/locale';
import { Chatbot } from './Chatbot';

const t = translations.en;

describe('<Chatbot />', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('exposes the conversation as a live log', () => {
    render(<Chatbot t={t} />);
    expect(screen.getByRole('log')).toHaveTextContent(/virtual assistant/);
  });

  it('answers a typed question after the typing delay', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Chatbot t={t} />);
    await user.type(screen.getByLabelText('Ask about Diki'), 'mbti{Enter}');
    expect(screen.getByText('Typing...')).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByRole('log')).toHaveTextContent(/ISTJ/);
    expect(screen.queryByText('Typing...')).toBeNull();
  });

  it('answers quick chips and ignores blank input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Chatbot t={t} />);
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.queryByText('Typing...')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Education?' }));
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByRole('log')).toHaveTextContent(/Telkom University/);
  });
});

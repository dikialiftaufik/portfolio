import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CvLinkForm } from './CvLinkForm';

function setup() {
  const onSubmit = vi.fn();
  render(
    <CvLinkForm
      initial={{ cvUrl: 'https://example.com/current' }}
      busy={false}
      serverError={null}
      onCancel={() => {}}
      onSubmit={onSubmit}
    />,
  );
  const input = screen.getByRole('textbox', { name: 'CV LINK' });
  const save = screen.getByRole('button', { name: 'Save CV link' });
  return { onSubmit, input, save, user: userEvent.setup() };
}

describe('<CvLinkForm />', () => {
  it('starts with the current link', () => {
    expect(setup().input).toHaveValue('https://example.com/current');
  });

  it('blocks a bad link, explains why and focuses the field', async () => {
    const { onSubmit, input, save, user } = setup();
    await user.clear(input);
    await user.type(input, 'http://example.com/cv');
    await user.click(save);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Paste a full https link/);
  });

  it('submits the normalized link', async () => {
    const { onSubmit, input, save, user } = setup();
    await user.clear(input);
    await user.type(input, '  HTTPS://Example.com/cv  ');
    await user.click(save);
    expect(onSubmit).toHaveBeenCalledWith({ cvUrl: 'https://example.com/cv' }, null);
  });
});

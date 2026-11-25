import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MAX_INPUT_BYTES } from '../upload';
import { CertForm } from './CertForm';
import { ProjectForm } from './ProjectForm';
import { TechForm } from './TechForm';

const base = { busy: false, serverError: null, onCancel: () => {} };

const PROJECT = {
  id: 'p1',
  title: 'Existing project',
  tech: ['React'],
  image: 'https://example.com/current.png',
  sort_order: 2,
};
const CERT = {
  id: 'c1',
  title: 'Existing certificate',
  issuer: 'Issuer',
  date: 'Jan 2026',
  image: 'https://example.com/cert.png',
  sort_order: 1,
};

const png = (name = 'cover.png', size = 2048) => {
  const file = new File(['x'], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

let created: string[];
let revoked: string[];

// jsdom implements neither side of object URLs.
beforeEach(() => {
  created = [];
  revoked = [];
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${created.length}`;
    created.push(url);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url);
  });
});
afterEach(() => vi.restoreAllMocks());

const preview = () => screen.queryByRole('img', { name: 'Preview' });
const fileInput = (id: string) => document.getElementById(id) as HTMLInputElement;
// fireEvent skips the `accept` filter, like a user choosing "All files" in the picker.
const pick = (id: string, file: File) =>
  fireEvent.change(fileInput(id), { target: { files: [file] } });

describe.each([
  {
    name: 'ProjectForm',
    inputId: 'pf-image',
    submit: 'Save project',
    current: PROJECT.image,
    renderForm: async (onSubmit = vi.fn()) => {
      const view = render(<ProjectForm {...base} initial={PROJECT} onSubmit={onSubmit} />);
      await userEvent.click(screen.getByRole('radio', { name: /Upload/ }));
      return view;
    },
  },
  {
    name: 'CertForm',
    inputId: 'cf-image',
    submit: 'Save certificate',
    current: CERT.image,
    renderForm: async (onSubmit = vi.fn()) =>
      render(<CertForm {...base} initial={CERT} onSubmit={onSubmit} />),
  },
])('$name image upload', ({ inputId, submit, current, renderForm }) => {
  it('shows the current image until a file is picked', async () => {
    await renderForm();
    expect(preview()).toHaveAttribute('src', current);
    expect(screen.getByText('No file chosen. Current image kept.')).toBeInTheDocument();
  });

  it('previews the picked file and releases each object URL', async () => {
    const { unmount } = await renderForm();
    pick(inputId, png('first.png'));
    expect(preview()).toHaveAttribute('src', 'blob:test/0');
    expect(screen.getByText('first.png · 2 KB')).toBeInTheDocument();

    pick(inputId, png('second.png', 3 * 1024 * 1024));
    expect(preview()).toHaveAttribute('src', 'blob:test/1');
    expect(screen.getByText('second.png · 3.0 MB')).toBeInTheDocument();
    expect(revoked).toEqual(['blob:test/0']);

    unmount();
    expect(revoked).toEqual(created);
  });

  it.each([
    ['an unsupported type', new File(['x'], 'a.gif', { type: 'image/gif' }), /PNG, JPG, or WebP/],
    ['an oversize file', png('big.png', MAX_INPUT_BYTES + 1), /too large/],
  ])('rejects %s as soon as it is picked', async (_label, file, message) => {
    await renderForm();
    pick(inputId, file);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(fileInput(inputId)).toHaveAttribute('aria-invalid', 'true');
    expect(preview()).toHaveAttribute('src', current);
    expect(created).toEqual([]);
  });

  it('drops a file the browser cannot decode', async () => {
    const onSubmit = vi.fn();
    await renderForm(onSubmit);
    pick(inputId, png('broken.png'));
    fireEvent.error(preview()!);
    expect(screen.getByText(/Couldn't preview this image/)).toBeInTheDocument();
    expect(preview()).toHaveAttribute('src', current);
    await userEvent.click(screen.getByRole('button', { name: submit }));
    expect(onSubmit.mock.calls[0]![1]?.file ?? null).toBeNull();
  });

  it('hands the picked file to onSubmit', async () => {
    const onSubmit = vi.fn();
    await renderForm(onSubmit);
    const file = png();
    pick(inputId, file);
    await userEvent.click(screen.getByRole('button', { name: submit }));
    expect(onSubmit.mock.calls[0]![1]).toEqual({ file });
  });
});

describe.each([
  {
    name: 'ProjectForm',
    submit: 'Save project',
    form: (onSubmit: () => void) => <ProjectForm {...base} initial={PROJECT} onSubmit={onSubmit} />,
  },
  {
    name: 'CertForm',
    submit: 'Save certificate',
    form: (onSubmit: () => void) => <CertForm {...base} initial={CERT} onSubmit={onSubmit} />,
  },
  {
    name: 'TechForm',
    submit: 'Save tech',
    form: (onSubmit: () => void) => (
      <TechForm
        {...base}
        initial={{ id: 't1', name: 'React', icon: 'devicon-react-original', sort_order: 4 }}
        onSubmit={onSubmit}
      />
    ),
  },
])('$name ORDER', ({ form, submit }) => {
  const order = () => screen.getByRole('spinbutton', { name: 'ORDER' });

  it.each(['', '-1'])('rejects %j instead of silently sending 0', async (value) => {
    const onSubmit = vi.fn();
    render(form(onSubmit));
    fireEvent.change(order(), { target: { value } });
    await userEvent.click(screen.getByRole('button', { name: submit }));
    expect(screen.getByText('Use a whole number, 0 or higher.')).toBeInTheDocument();
    expect(order()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps a huge position inside the integer column', async () => {
    const onSubmit = vi.fn();
    render(form(onSubmit));
    fireEvent.change(order(), { target: { value: '3000000000' } });
    await userEvent.click(screen.getByRole('button', { name: submit }));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ sort_order: 2147483647 });
  });

  it('sends 0 as position 0', async () => {
    const onSubmit = vi.fn();
    render(form(onSubmit));
    fireEvent.change(order(), { target: { value: '0' } });
    await userEvent.click(screen.getByRole('button', { name: submit }));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ sort_order: 0 });
  });
});

describe('ProjectForm image modes', () => {
  it('never treats unsaved URL text as the current image', async () => {
    const onSubmit = vi.fn();
    render(<ProjectForm {...base} initial={{}} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'IMAGE URL' }), 'foo');
    await userEvent.click(screen.getByRole('radio', { name: /Upload/ }));
    expect(preview()).toBeNull();
    expect(screen.getByText('No file chosen.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save project' }));
    expect(screen.getByText('Choose a file first.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

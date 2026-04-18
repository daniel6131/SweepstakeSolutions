import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Pill } from './Pill';

describe('Pill', () => {
  it('renders children', () => {
    render(<Pill>All Groups</Pill>);
    expect(screen.getByText('All Groups')).toBeTruthy();
  });

  it('renders as a button element', () => {
    const { container } = render(<Pill>Label</Pill>);
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('has role=tab when role="tab" is passed', () => {
    render(<Pill role="tab">Label</Pill>);
    expect(screen.getByRole('tab')).toBeTruthy();
  });

  it('sets aria-pressed=true when active and role=button', () => {
    render(<Pill active>Label</Pill>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets aria-selected=true when active and role=tab', () => {
    render(
      <Pill role="tab" active>
        Label
      </Pill>
    );
    expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onClick when clicked', async () => {
    const handler = vi.fn();
    render(<Pill onClick={handler}>Click me</Pill>);
    await userEvent.click(screen.getByText('Click me'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('is keyboard-activatable with Enter', async () => {
    const handler = vi.fn();
    render(<Pill onClick={handler}>Press Enter</Pill>);
    screen.getByText('Press Enter').focus();
    await userEvent.keyboard('{Enter}');
    expect(handler).toHaveBeenCalledOnce();
  });
});

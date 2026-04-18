import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Dialog } from './Dialog';

// jsdom doesn't implement showModal/close — stub them.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

function renderDialog(overrides: Partial<Parameters<typeof Dialog>[0]> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <Dialog
      open={true}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm action"
      description="Are you sure?"
      {...overrides}
    />
  );
  return { onClose, onConfirm };
}

describe('Dialog', () => {
  it('renders title and description', () => {
    renderDialog();
    expect(screen.getByText('Confirm action')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('has aria-labelledby pointing at the title', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
  });

  it('has aria-describedby pointing at the description', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('aria-describedby', 'dialog-desc');
  });

  it('calls onClose when cancel is clicked', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onConfirm and onClose when confirm is clicked', async () => {
    const { onClose, onConfirm } = renderDialog();
    await userEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders custom confirmLabel', () => {
    renderDialog({ confirmLabel: 'Delete' });
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('calls showModal when open=true', () => {
    renderDialog({ open: true });
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('calls close when open=false', () => {
    renderDialog({ open: false });
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});

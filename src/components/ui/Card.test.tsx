import { render, screen } from '@testing-library/react';

import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('renders as a div by default', () => {
    const { container } = render(<Card>content</Card>);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('renders as the polymorphic `as` element', () => {
    const { container } = render(<Card as="article">content</Card>);
    expect(container.firstElementChild?.tagName).toBe('ARTICLE');
  });

  it('applies interactive class when interactive=true', () => {
    const { container } = render(<Card interactive>content</Card>);
    expect(container.firstElementChild?.className).toContain('cursor-pointer');
  });

  it('does not apply interactive class by default', () => {
    const { container } = render(<Card>content</Card>);
    expect(container.firstElementChild?.className).not.toContain('cursor-pointer');
  });

  it('accepts a custom className', () => {
    const { container } = render(<Card className="custom-class">content</Card>);
    expect(container.firstElementChild?.className).toContain('custom-class');
  });

  it('forwards extra props to the element', () => {
    render(<Card data-testid="card-el">content</Card>);
    expect(screen.getByTestId('card-el')).toBeTruthy();
  });
});

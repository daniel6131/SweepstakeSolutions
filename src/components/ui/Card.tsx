import type { ElementType, ReactNode } from 'react';

type CardVariant = 'surface' | 'raised' | 'outline';

type CardProps<T extends ElementType = 'div'> = {
  as?: T;
  variant?: CardVariant;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  'as' | 'variant' | 'interactive' | 'padding' | 'className' | 'children' | 'style'
>;

const PADDING_CLASS: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-5 md:p-6',
};

const VARIANT_STYLE: Record<CardVariant, React.CSSProperties> = {
  surface: {
    background: 'var(--card-surface)',
    border: '1px solid var(--card-border)',
    boxShadow: 'var(--card-highlight), var(--shadow-card)',
  },
  raised: {
    background: 'var(--card-surface)',
    border: '1px solid var(--card-border-strong)',
    boxShadow: 'var(--card-highlight), var(--shadow-card-lg)',
  },
  outline: {
    background: 'transparent',
    border: '1px solid var(--card-border)',
  },
};

export function Card<T extends ElementType = 'div'>({
  as,
  variant = 'surface',
  interactive = false,
  padding = 'md',
  className = '',
  children,
  style,
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const paddingClass = PADDING_CLASS[padding];
  const interactiveClass = interactive
    ? 'card-lift cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2'
    : '';

  return (
    <Tag
      className={`rounded-xl ${paddingClass} ${interactiveClass} ${className}`}
      style={{ ...VARIANT_STYLE[variant], ...style }}
      {...rest}>
      {children}
    </Tag>
  );
}

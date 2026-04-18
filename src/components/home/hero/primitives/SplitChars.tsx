export function SplitChars({
  text,
  className,
  charStyle,
  stagger = 0.06,
  delay = 0.15,
  animName = 'char-rise',
  duration = '1s',
  easing = 'var(--ease-emphasized)',
}: {
  text: string;
  className?: string;
  charStyle?: React.CSSProperties;
  stagger?: number;
  delay?: number;
  animName?: string;
  duration?: string;
  easing?: string;
}) {
  return (
    <span className={`inline-flex items-baseline justify-center ${className ?? ''}`}>
      {text.split('').map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="inline-block"
          style={{
            opacity: 0,
            animation: `${animName} ${duration} ${easing} both`,
            animationDelay: `${delay + i * stagger}s`,
            ...charStyle,
          }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

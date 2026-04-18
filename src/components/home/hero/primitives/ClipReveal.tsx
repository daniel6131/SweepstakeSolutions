export function ClipReveal({
  children,
  delay,
  duration = '0.9s',
  className,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  duration?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ lineHeight: 1 }}>
      <span
        className={`inline-block ${className ?? ''}`}
        style={{
          opacity: 0,
          animation: `word-clip-up ${duration} var(--ease-emphasized) both`,
          animationDelay: `${delay}s`,
          ...style,
        }}>
        {children}
      </span>
    </span>
  );
}

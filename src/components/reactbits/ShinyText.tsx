'use client';

export interface ShinyTextProps {
  text: string;
  className?: string;
  disabled?: boolean;
  tone?: 'orchid' | 'light';
}

export function ShinyText({
  text,
  className = '',
  disabled = false,
  tone = 'orchid',
}: ShinyTextProps) {
  if (disabled) {
    return <span className={className}>{text}</span>;
  }

  const gradientStyle =
    tone === 'light'
      ? {
          backgroundImage:
            'linear-gradient(115deg, rgba(255,255,255,0.84) 38%, #ffffff 50%, rgba(255,255,255,0.84) 62%)',
        }
      : {
          backgroundImage:
            'linear-gradient(115deg, #442c61 36%, #9c44dc 50%, #442c61 64%)',
        };

  return (
    <span
      style={gradientStyle}
      className={`reactbits-shiny-text inline-block bg-clip-text text-transparent ${className}`}
    >
      {text}
    </span>
  );
}

export default ShinyText;

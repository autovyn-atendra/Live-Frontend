/* eslint-disable-next-line */
export interface SpanProps {
  text?: string;
  className?: string;
}

export function SpanA({ text, className }: SpanProps) {
  return (
    <span className={className} style={{ fontSize: '15px' }}>
      {text}
    </span>
  );
}

export default SpanA;

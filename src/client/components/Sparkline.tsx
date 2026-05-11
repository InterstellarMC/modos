import { useId, useMemo } from 'react';

import { cn } from '../lib/cn';

type Props = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
};

export const Sparkline = ({
  data,
  width = 120,
  height = 36,
  stroke = 'var(--color-modos-accent)',
  className,
}: Props) => {
  const uid = useId().replace(/:/g, '');
  const fillId = `modos-spark-fill-${uid}`;
  const lineGradId = `modos-spark-line-${uid}`;
  const fillUrl = `url(#${fillId})`;
  const { line, area } = useMemo(() => {
    if (!data.length) return { line: '', area: '' };
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const step = width / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => {
      const x = i * step;
      const y = height - ((d - min) / range) * (height - 4) - 2;
      return [x, y] as const;
    });
    const lineStr = pts
      .map(([x, y], i) =>
        `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      )
      .join(' ');
    const areaStr = `${lineStr} L${width},${height} L0,${height} Z`;
    return { line: lineStr, area: areaStr };
  }, [data, width, height]);

  return (
    <div
      className={cn(
        'inline-flex rounded-[var(--radius-md)] bg-modos-bg/80 px-2 py-1 ring-1 ring-modos-border/90',
        className
      )}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        <defs>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,69,0,0.22)" />
            <stop offset="100%" stopColor="rgba(255,69,0,0)" />
          </linearGradient>
          <linearGradient id={lineGradId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(255,69,0,0.55)" />
            <stop offset="100%" stopColor="var(--color-modos-accent)" />
          </linearGradient>
        </defs>
        <path d={area} fill={fillUrl} />
        <path
          d={line}
          stroke={
            stroke === 'var(--color-modos-accent)'
              ? `url(#${lineGradId})`
              : stroke
          }
          strokeWidth={1.35}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

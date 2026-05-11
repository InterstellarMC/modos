import { useMemo } from 'react';

type Props = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export const Sparkline = ({
  data,
  width = 120,
  height = 36,
  stroke = 'var(--color-modos-accent)',
  fill = 'rgba(255,69,0,0.16)',
}: Props) => {
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
    const lineStr = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const areaStr = `${lineStr} L${width},${height} L0,${height} Z`;
    return { line: lineStr, area: areaStr };
  }, [data, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={area} fill={fill} />
      <path d={line} stroke={stroke} strokeWidth={1.4} fill="none" />
    </svg>
  );
};

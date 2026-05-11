import { useMemo } from 'react';
import type { RaidPoint } from '../../shared/types';

type Props = {
  series: RaidPoint[];
};

const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 24;

export const RaidChart = ({ series }: Props) => {
  const { width, height, lines, gridY, gridX, scale } = useMemo(() => {
    const w = 720;
    const h = 240;
    const maxY = Math.max(
      24,
      ...series.flatMap((p) => [p.posts, p.comments, p.reports])
    );
    const minT = series[0]?.t ?? 0;
    const maxT = series[series.length - 1]?.t ?? 1;
    const tRange = maxT - minT || 1;
    const innerW = w - PAD_L - PAD_R;
    const innerH = h - PAD_T - PAD_B;

    const toXY = (t: number, v: number) => {
      const x = PAD_L + ((t - minT) / tRange) * innerW;
      const y = PAD_T + innerH - (v / maxY) * innerH;
      return [x, y] as const;
    };

    const build = (key: 'posts' | 'comments' | 'reports') => {
      return series
        .map((p, i) => {
          const [x, y] = toXY(p.t, p[key]);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    };

    const yTicks = 4;
    const grid: { y: number; label: number }[] = [];
    for (let i = 0; i <= yTicks; i++) {
      const val = (maxY * (yTicks - i)) / yTicks;
      grid.push({
        y: PAD_T + (i / yTicks) * innerH,
        label: Math.round(val),
      });
    }

    const xTickCount = 6;
    const xGrid: { x: number; label: string }[] = [];
    for (let i = 0; i <= xTickCount; i++) {
      const t = minT + (i / xTickCount) * tRange;
      const x = PAD_L + (i / xTickCount) * innerW;
      const mins = Math.round((t - maxT) / 60000);
      const label = mins === 0 ? 'now' : `${mins}m`;
      xGrid.push({ x, label });
    }

    return {
      width: w,
      height: h,
      lines: {
        posts: build('posts'),
        comments: build('comments'),
        reports: build('reports'),
      },
      gridY: grid,
      gridX: xGrid,
      scale: { maxY, toXY },
    };
  }, [series]);

  const toxicityPath = useMemo(() => {
    if (!series.length) return '';
    const innerW = width - PAD_L - PAD_R;
    const innerH = height - PAD_T - PAD_B;
    const minT = series[0]!.t;
    const maxT = series[series.length - 1]!.t;
    const tRange = maxT - minT || 1;
    return series
      .map((p, i) => {
        const x = PAD_L + ((p.t - minT) / tRange) * innerW;
        const y = PAD_T + innerH - p.toxicity * innerH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [series, width, height]);

  const latest = series[series.length - 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        <rect
          x={PAD_L}
          y={PAD_T}
          width={width - PAD_L - PAD_R}
          height={height - PAD_T - PAD_B}
          rx={6}
          fill="rgba(17, 17, 20, 0.4)"
          stroke="var(--color-modos-border)"
          strokeWidth={0.75}
        />
        {gridY.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={width - PAD_R}
              y1={g.y}
              y2={g.y}
              stroke="var(--color-modos-border)"
              strokeDasharray={i === 0 ? '0' : '2 4'}
            />
            <text
              x={PAD_L - 6}
              y={g.y + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--color-modos-subtle)"
              fontFamily="var(--font-mono)"
            >
              {g.label}
            </text>
          </g>
        ))}
        {gridX.map((g, i) => (
          <text
            key={i}
            x={g.x}
            y={height - 6}
            textAnchor="middle"
            fontSize={9}
            fill="var(--color-modos-subtle)"
            fontFamily="var(--font-mono)"
          >
            {g.label}
          </text>
        ))}
        <path
          d={lines.comments}
          fill="none"
          stroke="var(--color-modos-info)"
          strokeWidth={1.4}
        />
        <path
          d={lines.posts}
          fill="none"
          stroke="var(--color-modos-warn)"
          strokeWidth={1.4}
        />
        <path
          d={lines.reports}
          fill="none"
          stroke="var(--color-modos-critical)"
          strokeWidth={1.8}
        />
        <path
          d={toxicityPath}
          fill="none"
          stroke="var(--color-modos-accent)"
          strokeWidth={1.6}
          strokeDasharray="3 3"
        />
        {latest && (
          <g>
            {(['comments', 'posts', 'reports'] as const).map((k) => {
              const [x, y] = scale.toXY(latest.t, latest[k]);
              const c =
                k === 'comments'
                  ? 'var(--color-modos-info)'
                  : k === 'posts'
                    ? 'var(--color-modos-warn)'
                    : 'var(--color-modos-critical)';
              return (
                <circle key={k} cx={x} cy={y} r={2.6} fill={c} />
              );
            })}
          </g>
        )}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-modos-muted">
        <LegendDot color="var(--color-modos-critical)" label="reports" />
        <LegendDot color="var(--color-modos-warn)" label="posts" />
        <LegendDot color="var(--color-modos-info)" label="comments" />
        <LegendDot color="var(--color-modos-accent)" label="toxicity" dashed />
      </div>
    </div>
  );
};

const LegendDot = ({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) => (
  <div className="flex items-center gap-1.5">
    <span
      className="w-4 h-0.5"
      style={{
        background: dashed
          ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
          : color,
      }}
    />
    <span>{label}</span>
  </div>
);

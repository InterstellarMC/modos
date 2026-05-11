import type { RiskLevel } from '../../shared/types';
import { cn } from '../lib/cn';

type Props = {
  level: RiskLevel;
  score: number;
  compact?: boolean;
};

const LEVEL_COLORS: Record<RiskLevel, string> = {
  critical: 'text-modos-critical bg-modos-critical/12 border-modos-critical/30',
  high: 'text-modos-warn bg-modos-warn/12 border-modos-warn/30',
  medium: 'text-modos-info bg-modos-info/12 border-modos-info/30',
  low: 'text-modos-ok bg-modos-ok/12 border-modos-ok/30',
};

const LEVEL_LABEL: Record<RiskLevel, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

export const RiskBadge = ({ level, score, compact }: Props) => (
  <div
    className={cn(
      'inline-flex items-center gap-2 rounded-md border px-2 py-1 font-mono tabular-nums',
      compact ? 'text-[10px] tracking-wider' : 'text-[11px] tracking-wider',
      LEVEL_COLORS[level]
    )}
  >
    <span className="font-semibold">{LEVEL_LABEL[level]}</span>
    {!compact && <span className="opacity-80">{score.toFixed(2)}</span>}
  </div>
);

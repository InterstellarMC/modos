import { relativeTime } from '../lib/format';
import { useStore } from '../state/store';
import type { ActivityEvent } from '../state/store';
import {
  IconBolt,
  IconCheck,
  IconFlag,
  IconShield,
  IconUser,
  IconWand,
} from '../lib/icons';
import { cn } from '../lib/cn';

const iconMap: Record<ActivityEvent['icon'], typeof IconBolt> = {
  bolt: IconBolt,
  check: IconCheck,
  flag: IconFlag,
  shield: IconShield,
  user: IconUser,
  wand: IconWand,
};

const toneColor: Record<ActivityEvent['tone'], string> = {
  ok: 'text-modos-ok',
  warn: 'text-modos-warn',
  info: 'text-modos-info',
  critical: 'text-modos-critical',
  accent: 'text-modos-accent',
};

export const ActivityFeed = () => {
  const feed = useStore((s) => s.activityFeed);
  const checksPerSec = useStore((s) => s.aiChecksPerSec);

  return (
    <div className="panel p-5 h-full flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Live activity
        </h2>
        <span className="text-[11px] text-modos-muted font-mono tabular-nums">
          {checksPerSec} checks/s
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {[...feed].reverse().map((evt) => {
          const Icon = iconMap[evt.icon];
          return (
            <div
              key={evt.id}
              className="flex items-start gap-2 text-[12px] leading-snug fade-in"
            >
              <Icon
                width={13}
                height={13}
                className={cn('shrink-0 mt-0.5', toneColor[evt.tone])}
              />
              <span className="flex-1 text-modos-muted min-w-0">
                {evt.message}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-modos-subtle tabular-nums">
                {relativeTime(evt.ts)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

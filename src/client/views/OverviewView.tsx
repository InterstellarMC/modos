import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { formatDuration, formatNumber } from '../lib/format';
import { setView, useStore } from '../state/store';
import { Sparkline } from '../components/Sparkline';
import { ActivityFeed } from '../components/ActivityFeed';
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconShield,
} from '../lib/icons';
import { RiskBadge } from '../components/RiskBadge';

export const OverviewView = () => {
  const overview = useStore((s) => s.overview);
  const queue = useStore((s) => s.queue);
  const username = useStore((s) => s.username);
  const subreddit = useStore((s) => s.subreddit);
  const aiChecksPerSec = useStore((s) => s.aiChecksPerSec);
  const top = queue.filter((q) => q.status === 'pending').slice(0, 5);

  const weekly = overview.weeklyVolume.map((d) => d.total);

  return (
    <div className="px-6 py-6 max-w-[1180px] mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-[0.16em] text-modos-muted">
            Mission control · {subreddit}
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight mt-1">
            Good evening, u/{username}. MODOS is on watch.
          </h1>
          <p className="text-[13.5px] text-modos-muted mt-1.5">
            {overview.raid.summary}
          </p>
        </div>
        <button
          onClick={() => setView('raid')}
          className="flex items-center gap-2 text-[12.5px] px-3 py-1.5 rounded-lg bg-modos-critical/15 border border-modos-critical/30 text-modos-critical hover:bg-modos-critical/25 transition"
        >
          <span
            className="size-1.5 rounded-full pulse-dot"
            style={{ background: 'currentColor' }}
          />
          Open Raid Radar
          <IconArrowRight />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Metric
          label="Pending review"
          value={overview.pending.toString()}
          delta="real-time"
          icon={<IconShield className="text-modos-accent" />}
        />
        <Metric
          label="Resolved today"
          value={overview.resolvedToday.toString()}
          delta="+12% vs yesterday"
          icon={<IconCheck className="text-modos-ok" />}
        />
        <Metric
          label="Time saved"
          value={formatDuration(overview.timeSavedMinutes)}
          delta="vs manual triage"
          icon={<IconClock className="text-modos-info" />}
        />
        <Metric
          label="Reasoning engine"
          value={`${aiChecksPerSec}`}
          delta="checks/s · local · 0 ms latency"
          icon={<IconBolt className="text-modos-warn" />}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="panel p-5 col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">
              Weekly moderation volume
            </h2>
            <p className="text-[11.5px] text-modos-muted">
              {formatNumber(weekly.reduce((a, b) => a + b, 0))} actions ·{' '}
              {overview.subreddit.modCount} moderators
            </p>
          </div>
          <div className="mt-4 flex items-end gap-2 h-44">
            {overview.weeklyVolume.map((d) => {
              const max = Math.max(...overview.weeklyVolume.map((x) => x.total));
              const totalHeight = (d.total / max) * 100;
              const removedHeight = (d.removed / d.total) * totalHeight;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col-reverse h-40 rounded-md overflow-hidden bg-modos-bg-elev relative">
                    <div
                      className="w-full bg-modos-info/40"
                      style={{ height: `${totalHeight - removedHeight}%` }}
                    />
                    <div
                      className="w-full bg-modos-critical/70"
                      style={{ height: `${removedHeight}%` }}
                    />
                  </div>
                  <div className="text-[10.5px] text-modos-muted mt-1">
                    {d.day}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-modos-muted">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-modos-info/40" /> approved
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-modos-critical/70" />{' '}
              removed
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">
              Risk distribution
            </h2>
            <p className="text-[11.5px] text-modos-muted">live</p>
          </div>
          <div className="mt-4 space-y-2">
            {(['critical', 'high', 'medium', 'low'] as const).map((lvl) => {
              const count = overview.queueByLevel[lvl];
              const total = Object.values(overview.queueByLevel).reduce(
                (a, b) => a + b,
                0
              );
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={lvl} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <RiskBadge level={lvl} score={pct / 100} compact />
                    <span className="text-modos-muted tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-modos-bg-elev overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        lvl === 'critical' && 'bg-modos-critical',
                        lvl === 'high' && 'bg-modos-warn',
                        lvl === 'medium' && 'bg-modos-info',
                        lvl === 'low' && 'bg-modos-ok'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-modos-border">
            <div className="text-[11px] uppercase tracking-[0.16em] text-modos-muted mb-2">
              Top signals
            </div>
            <div className="space-y-1.5 text-[12.5px]">
              {overview.topSignals.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span>{s.label}</span>
                  <span className="font-mono text-modos-muted">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="panel p-5 col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold tracking-tight">
                Highest-risk items
              </h2>
              <p className="text-[11.5px] text-modos-muted mt-0.5">
                MODOS prioritized {top.length} items that need a decision now.
              </p>
            </div>
            <button
              onClick={() => setView('queue')}
              className="flex items-center gap-1.5 text-[12px] text-modos-muted hover:text-modos-text transition"
            >
              Open queue
              <IconArrowRight />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {top.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setView('queue');
                }}
                className="text-left rounded-lg border border-modos-border bg-modos-bg-elev/60 hover:bg-modos-panel transition p-3 grid grid-cols-[80px_1fr_120px_24px] gap-3 items-center"
              >
                <RiskBadge level={q.risk.level} score={q.risk.score} compact />
                <div className="min-w-0">
                  <div className="text-[13px] text-modos-text truncate">
                    {q.title ?? q.body.slice(0, 80)}
                  </div>
                  <div className="text-[11.5px] text-modos-muted truncate">
                    u/{q.author.username} · {q.risk.primaryReason}
                  </div>
                </div>
                <div className="text-right">
                  <Sparkline
                    data={Array.from({ length: 8 }, (_, i) =>
                      Math.sin((q.risk.score + i) * 1.4) * 4 + q.risk.score * 8 + i
                    )}
                    width={100}
                    height={28}
                  />
                </div>
                <IconArrowRight className="text-modos-subtle" />
              </button>
            ))}
          </div>
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
};

const Metric = ({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: ReactNode;
}) => (
  <div className="panel p-4 relative overflow-hidden">
    <div className="absolute top-3 right-3 opacity-60">{icon}</div>
    <div className="text-[11px] uppercase tracking-[0.16em] text-modos-muted">
      {label}
    </div>
    <div className="text-[24px] font-semibold mt-1 tabular-nums tracking-tight">
      {value}
    </div>
    <div className="text-[11.5px] text-modos-subtle mt-1">{delta}</div>
  </div>
);

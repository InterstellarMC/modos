import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { formatDuration, formatNumber } from '../lib/format';
import { setView, useStore } from '../state/store';
import { Sparkline } from '../components/Sparkline';
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconRadar,
  IconShield,
} from '../lib/icons';
import { RiskBadge } from '../components/RiskBadge';

export const OverviewView = () => {
  const overview = useStore((s) => s.overview);
  const queue = useStore((s) => s.queue);
  const username = useStore((s) => s.username);
  const subreddit = useStore((s) => s.subreddit);
  const incidentStatus = useStore((s) => s.incident.status);
  const top = queue.slice(0, 5);

  const weekly = overview.weeklyVolume.map((d) => d.total);
  const raidActive = incidentStatus === 'critical' || incidentStatus === 'elevated';

  const displaySub = subreddit.startsWith('r/') ? subreddit : `r/${subreddit}`;

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="route-shell space-y-6 sm:space-y-8">
      <section className="hero-surface motion-default overflow-hidden sm:p-8 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-kicker text-modos-subtle">Overview</span>
              <span className="rounded-md bg-modos-bg-elev px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-modos-muted ring-1 ring-modos-border">
                {displaySub}
              </span>
            </div>
            <h1 className="t-h1 mt-3 max-w-[22ch] text-balance text-modos-text sm:max-w-2xl">
              {greet}, u/{username}.{' '}
              <span className="text-modos-muted">
                MODOS has the watch.
              </span>
            </h1>
            <p className="t-body mt-3 max-w-2xl text-modos-muted">
              {overview.raid.summary}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setView('queue')}
              className="motion-default motion-press rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev px-4 py-2 text-[12.5px] font-semibold text-modos-text hover:border-modos-border-strong hover:bg-modos-panel"
            >
              Open queue
              <IconArrowRight className="ml-2 inline opacity-70" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setView('raid')}
              className={cn(
                'motion-default motion-press inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2 text-[12.5px] font-semibold',
                raidActive
                  ? 'border-modos-critical/40 bg-modos-critical/12 text-modos-critical hover:bg-modos-critical/18'
                  : 'border-modos-border-strong bg-modos-panel text-modos-text hover:bg-modos-bg-elev'
              )}
            >
              {raidActive ? (
                <span
                  className="size-1.5 rounded-full pulse-dot bg-modos-critical text-modos-critical"
                  aria-hidden
                />
              ) : (
                <IconRadar className="size-4 text-modos-muted" aria-hidden />
              )}
              Raid Radar
              <IconArrowRight className="size-4 opacity-60" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Pending review"
          value={overview.pending.toString()}
          delta="Queued for triage"
          icon={<IconShield className="text-modos-accent" aria-hidden />}
        />
        <Metric
          label="Resolved today"
          value={overview.resolvedToday.toString()}
          delta="vs trailing day"
          icon={<IconCheck className="text-modos-ok" aria-hidden />}
        />
        <Metric
          label="Time saved"
          value={formatDuration(overview.timeSavedMinutes)}
          delta="estimated vs manual review"
          icon={<IconClock className="text-modos-info" aria-hidden />}
        />
        <Metric
          label="Reasoning stack"
          value="v0.1"
          delta="deterministic playground"
          icon={<IconBolt className="text-modos-warn" aria-hidden />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel motion-default flex flex-col p-5 lg:col-span-2 lg:p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="t-h3 text-modos-text">Weekly volume</h2>
            <p className="text-[11.5px] text-modos-muted">
              <span className="font-medium text-modos-text tabular-nums">
                {formatNumber(weekly.reduce((a, b) => a + b, 0))}
              </span>{' '}
              actions · {overview.subreddit.modCount} moderators
            </p>
          </div>
          <div className="panel-inset p-3 sm:p-4">
            <div className="flex h-40 items-end gap-1.5 sm:h-44 sm:gap-2">
              {overview.weeklyVolume.map((d) => {
                const max = Math.max(
                  ...overview.weeklyVolume.map((x) => x.total),
                  1
                );
                const totalHeight = (d.total / max) * 100;
                const removedFrac = d.total > 0 ? d.removed / d.total : 0;
                const removedHeight = removedFrac * totalHeight;
                const keptHeight = Math.max(0, totalHeight - removedHeight);
                return (
                  <div
                    key={d.day}
                    className="flex min-w-0 flex-1 flex-col items-center"
                  >
                    <div className="flex h-[132px] w-full flex-col-reverse overflow-hidden rounded-t-[var(--radius-sm)] bg-modos-bg sm:h-40">
                      <div
                        className="motion-default w-full bg-modos-info/40"
                        style={{ height: `${keptHeight}%` }}
                      />
                      <div
                        className="motion-default w-full bg-modos-critical/65"
                        style={{ height: `${removedHeight}%` }}
                      />
                    </div>
                    <span className="mt-2 text-[10.5px] font-medium uppercase tracking-wide text-modos-muted sm:text-[11px]">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-modos-muted">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-[2px] bg-modos-info/45" aria-hidden />{' '}
              Cleared / approved
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-[2px] bg-modos-critical/65" aria-hidden />{' '}
              Removed
            </div>
          </div>
        </div>

        <div className="panel motion-default p-5 lg:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="t-h3 text-modos-text">Risk mix</h2>
            <span className="rounded-full border border-modos-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-modos-muted">
              Live queue
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {(['critical', 'high', 'medium', 'low'] as const).map((lvl) => {
              const count = overview.queueByLevel[lvl];
              const total = Object.values(overview.queueByLevel).reduce(
                (a, b) => a + b,
                0
              );
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={lvl} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <RiskBadge level={lvl} score={pct / 100} compact />
                    <span className="tabular-nums text-modos-muted">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-modos-bg-elev">
                    <div
                      className={cn(
                        'motion-default h-full rounded-full',
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
          <div className="mt-6 border-t border-modos-border pt-5">
            <h3 className="t-kicker mb-3 text-[10px] text-modos-subtle">
              Top signals
            </h3>
            <div className="space-y-2.5">
              {overview.topSignals.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] text-modos-text">{s.label}</span>
                  <span className="font-mono text-[12px] text-modos-muted tabular-nums">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel motion-default overflow-hidden p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="t-h3 text-modos-text">Needs attention</h2>
            <p className="t-meta mt-1 text-modos-muted">
              Highest composite risk from the active queue—these surface first on
              open.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('queue')}
            className="motion-default inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] text-[12px] font-semibold text-modos-muted hover:text-modos-text"
          >
            Full queue
            <IconArrowRight className="size-4 opacity-70" aria-hidden />
          </button>
        </div>
        {!top.length ? (
          <div className="empty-well">
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-[var(--radius-md)] border border-modos-border bg-modos-panel">
              <IconCheck className="text-modos-ok" aria-hidden />
            </div>
            <p className="t-h3 font-medium text-modos-text">Queue is clear</p>
            <p className="t-body mx-auto mt-2 max-w-sm text-modos-muted">
              Nothing critical is waiting—MODOS will repopulate here as new
              signals cross threshold.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {top.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setView('queue');
                }}
                className="motion-default motion-press grid grid-cols-1 items-center gap-3 rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev/55 p-3 text-left sm:grid-cols-[minmax(0,92px)_1fr_auto] sm:gap-4 sm:p-4 md:grid-cols-[minmax(0,96px)_1fr_auto_24px]"
              >
                <RiskBadge level={q.risk.level} score={q.risk.score} compact />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium leading-snug text-modos-text">
                    {q.title ?? q.body.slice(0, 80)}
                  </div>
                  <div className="mt-1 truncate text-[11.5px] text-modos-muted">
                    u/{q.author.username} · {q.risk.primaryReason}
                  </div>
                </div>
                <div className="hidden text-right md:block md:justify-self-end">
                  <Sparkline
                    data={Array.from({ length: 8 }, (_, i) =>
                      Math.sin((q.risk.score + i) * 1.4) * 4 +
                      q.risk.score * 8 +
                      i
                    )}
                    width={100}
                    height={28}
                  />
                </div>
                <IconArrowRight
                  className="hidden justify-self-end text-modos-subtle md:inline"
                  aria-hidden
                />
              </button>
            ))}
          </div>
        )}
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
  <div className="panel motion-default relative overflow-hidden p-4 hover:border-modos-border-strong sm:p-5">
    <div className="pointer-events-none absolute right-3 top-3 opacity-55 sm:right-4 sm:top-4">
      {icon}
    </div>
    <div className="t-kicker text-[10px] text-modos-subtle">{label}</div>
    <div className="mt-2 text-[21px] font-semibold tabular-nums tracking-tight text-modos-text sm:text-[23px]">
      {value}
    </div>
    <div className="mt-2 text-[11px] leading-snug text-modos-muted">{delta}</div>
  </div>
);

import { useEffect, useMemo } from 'react';
import { cn } from '../lib/cn';
import { relativeTime } from '../lib/format';
import {
  enterCrisis,
  exitCrisis,
  toast,
  useStore,
} from '../state/store';
import { RaidChart } from '../components/RaidChart';
import {
  IconAlert,
  IconBolt,
  IconCheck,
  IconRadar,
  IconShield,
  IconUser,
} from '../lib/icons';
import type { RaidEvent } from '../../shared/types';

const eventIcon: Record<RaidEvent['kind'], typeof IconAlert> = {
  spike: IconBolt,
  coordination: IconUser,
  toxicity: IconAlert,
  newaccount: IconUser,
  mod: IconShield,
  system: IconCheck,
};

const eventTone: Record<RaidEvent['kind'], string> = {
  spike: 'text-modos-warn',
  coordination: 'text-modos-info',
  toxicity: 'text-modos-critical',
  newaccount: 'text-modos-warn',
  mod: 'text-modos-accent',
  system: 'text-modos-ok',
};

export const RaidView = () => {
  const incident = useStore((s) => s.incident);
  const crisis = useStore((s) => s.crisisMode);

  const latest = incident.series[incident.series.length - 1];

  const totals = useMemo(() => {
    let posts = 0;
    let comments = 0;
    let reports = 0;
    let toxicityAvg = 0;
    for (const p of incident.series) {
      posts += p.posts;
      comments += p.comments;
      reports += p.reports;
      toxicityAvg += p.toxicity;
    }
    return {
      posts,
      comments,
      reports,
      toxicity: incident.series.length
        ? toxicityAvg / incident.series.length
        : 0,
      peak: incident.series.reduce((m, p) => Math.max(m, p.comments), 0),
    };
  }, [incident.series]);

  useEffect(() => {
    if (incident.status === 'critical' && !crisis) {
      // align state if user resets
      enterCrisis();
    }
  }, [incident.status, crisis]);

  return (
    <div className="mx-auto max-w-[1180px] space-y-8 px-6 py-8">
      <section
        className={cn(
          'panel motion-default overflow-hidden p-6 sm:p-7',
          crisis &&
            'ring-1 ring-modos-critical/25 border-modos-critical/35'
        )}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-modos-subtle">
              <IconRadar className="shrink-0" aria-hidden />
              <span className="t-kicker tracking-[0.14em]">Raid radar</span>
            </div>
            <h1 className="t-h1 mt-2 text-modos-text">
              {incident.trigger}
            </h1>
            <p className="t-body mt-3 max-w-2xl text-modos-muted">
              Started {relativeTime(incident.startedAt)} ·{' '}
              <span className="text-modos-text">
                {incident.affectedUsers} accounts
              </span>{' '}
              in scope. MODOS is holding new-account posts while you confirm
              coordination.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {crisis ? (
              <button
                type="button"
                onClick={() => {
                  exitCrisis();
                }}
                className="motion-default motion-press inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-modos-ok/35 bg-modos-ok/12 px-4 py-2.5 text-[12.5px] font-semibold text-modos-ok hover:bg-modos-ok/18"
              >
                <IconCheck aria-hidden /> Stand down
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  enterCrisis();
                  toast('Crisis mode engaged · throttling new accounts', 'warn');
                }}
                className="motion-default motion-press inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-modos-critical/35 bg-modos-critical/12 px-4 py-2.5 text-[12.5px] font-semibold text-modos-critical hover:bg-modos-critical/18"
              >
                <span
                  className="size-1.5 rounded-full bg-modos-critical"
                  aria-hidden
                />
                Engage crisis mode
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Comments (30m)"
          value={totals.comments.toString()}
          tone="info"
        />
        <Stat
          label="Reports (30m)"
          value={totals.reports.toString()}
          tone="critical"
        />
        <Stat
          label="Peak velocity"
          value={`${totals.peak}/min`}
          tone="warn"
        />
        <Stat
          label="Avg toxicity"
          value={`${(totals.toxicity * 100).toFixed(0)}%`}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel col-span-1 flex flex-col p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="t-h3 text-modos-text">Live signal</h2>
            <div className="font-mono text-[11px] text-modos-muted tabular-nums">
              {latest
                ? `${latest.posts} posts · ${latest.comments} comments · ${latest.reports} reports · ${(latest.toxicity * 100).toFixed(0)}% tox`
                : 'No samples yet'}
            </div>
          </div>
          <div className="panel-inset grow p-4 motion-default">
            <RaidChart series={incident.series} />
          </div>
        </div>

        <div className="panel flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="t-h3 text-modos-text">Playbook</h2>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]',
                crisis
                  ? 'border-modos-accent/35 bg-modos-accent/10 text-modos-accent'
                  : 'border-modos-border text-modos-muted'
              )}
            >
              {crisis ? 'Active' : 'Standby'}
            </span>
          </div>
          <ul className="space-y-3 text-[12.5px] text-modos-muted">
            <Step
              active={crisis}
              label="Hold new-account posts for review"
              detail="< 7d accounts queued instead of published"
            />
            <Step
              active={crisis}
              label="Highlight inbound referrer brigading"
              detail="Cross-sub coordination flagged in mod log"
            />
            <Step
              active={crisis}
              label="Auto-draft removal responses"
              detail="Removal Assistant pre-fills polished replies"
            />
            <Step
              active={crisis}
              label="Slow mode on contested threads"
              detail="2-minute minimum between comments"
            />
            <Step
              active={crisis}
              label="Page humans on critical escalations"
              detail="ModMail alert + Discord webhook (configurable)"
            />
          </ul>
        </div>
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t-h3 text-modos-text">Incident timeline</h2>
          <div className="text-[11.5px] text-modos-subtle">
            Replayable forensic log
          </div>
        </div>
        <ol className="relative space-y-0 pl-0 before:pointer-events-none before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-modos-border sm:pl-10 sm:before:left-[15px]">
          {incident.events.map((e) => {
            const Icon = eventIcon[e.kind];
            return (
              <li
                key={e.id}
                className="relative border-b border-modos-border/60 py-3.5 last:border-b-0"
              >
                <span
                  className={cn(
                    'absolute left-0 top-[18px] z-[1] grid size-7 place-items-center rounded-full border bg-modos-bg-elev sm:left-4 sm:size-8',
                    'border-modos-border',
                    eventTone[e.kind]
                  )}
                >
                  <Icon width={12} height={12} aria-hidden />
                </span>
                <div className="ml-11 flex flex-col gap-1 sm:ml-14 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <p className="t-body flex-1 text-modos-text sm:pt-0.5">
                    {e.message}
                  </p>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
                    <span className="font-mono text-[11px] text-modos-subtle tabular-nums">
                      {relativeTime(e.ts)}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        e.severity === 'critical' &&
                          'bg-modos-critical/12 text-modos-critical ring-1 ring-modos-critical/25',
                        e.severity === 'high' &&
                          'bg-modos-warn/12 text-modos-warn ring-1 ring-modos-warn/25',
                        e.severity === 'medium' &&
                          'bg-modos-info/12 text-modos-info ring-1 ring-modos-info/25',
                        e.severity === 'low' &&
                          'bg-modos-ok/12 text-modos-ok ring-1 ring-modos-ok/20'
                      )}
                    >
                      {e.severity}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'info' | 'critical' | 'warn' | 'accent';
}) => (
  <div className="panel motion-default p-4 hover:border-modos-border-strong">
    <div className="t-kicker text-[10px] text-modos-subtle">{label}</div>
    <div
      className={cn(
        'mt-2 text-[22px] font-semibold tabular-nums tracking-tight sm:text-[24px]',
        tone === 'critical' && 'text-modos-critical',
        tone === 'warn' && 'text-modos-warn',
        tone === 'info' && 'text-modos-info',
        tone === 'accent' && 'text-modos-accent'
      )}
    >
      {value}
    </div>
  </div>
);

const Step = ({
  active,
  label,
  detail,
}: {
  active: boolean;
  label: string;
  detail: string;
}) => (
  <li className="flex items-start gap-3">
    <span
      className={cn(
        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border motion-default',
        active
          ? 'border-modos-accent/40 bg-modos-accent text-white'
          : 'border-modos-border bg-modos-bg-elev text-modos-subtle'
      )}
    >
      {active ? <IconCheck width={10} height={10} aria-hidden /> : null}
    </span>
    <div className={cn('min-w-0 flex-1', !active && 'opacity-55')}>
      <div className="text-[12.5px] font-medium leading-snug text-modos-text">
        {label}
      </div>
      <div className="mt-0.5 text-[11.5px] leading-relaxed text-modos-subtle">
        {detail}
      </div>
    </div>
  </li>
);

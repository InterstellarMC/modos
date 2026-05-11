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
    <div className="px-6 py-6 max-w-[1180px] mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[12px] uppercase tracking-[0.16em] text-modos-muted flex items-center gap-2">
            <IconRadar />
            Raid &amp; Brigade Radar
          </div>
          <h1 className="text-[24px] font-semibold tracking-tight mt-1">
            Incident · {incident.trigger}
          </h1>
          <p className="text-[13px] text-modos-muted mt-1.5">
            Started {relativeTime(incident.startedAt)} ·{' '}
            {incident.affectedUsers} accounts involved · MODOS recommends
            holding all new-account posts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {crisis ? (
            <button
              onClick={() => {
                exitCrisis();
              }}
              className="flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-lg bg-modos-ok/15 border border-modos-ok/30 text-modos-ok hover:bg-modos-ok/25 transition"
            >
              <IconCheck /> Stand down · resume normal flow
            </button>
          ) : (
            <button
              onClick={() => {
                enterCrisis();
                toast('Crisis mode engaged · throttling new accounts', 'warn');
              }}
              className="flex items-center gap-2 text-[12.5px] px-3 py-2 rounded-lg bg-modos-critical/15 border border-modos-critical/30 text-modos-critical hover:bg-modos-critical/25 transition"
            >
              <span className="pulse-dot size-1.5 rounded-full bg-modos-critical" />
              Re-engage crisis mode
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Stat
          label="Comments (last 30m)"
          value={totals.comments.toString()}
          tone="info"
        />
        <Stat
          label="Reports (last 30m)"
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

      <div className="grid grid-cols-3 gap-4">
        <div className="panel p-5 col-span-2">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[14px] font-semibold tracking-tight">
              Live signal
            </h2>
            <div className="text-[11.5px] text-modos-muted">
              latest:{' '}
              {latest
                ? `${latest.posts}p · ${latest.comments}c · ${latest.reports}r · toxicity ${(latest.toxicity * 100).toFixed(0)}%`
                : '—'}
            </div>
          </div>
          <RaidChart series={incident.series} />
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold tracking-tight">
              MODOS auto-response
            </h2>
            <span className="text-[11px] uppercase tracking-wider text-modos-accent">
              {crisis ? 'active' : 'standby'}
            </span>
          </div>
          <ul className="space-y-2 text-[12.5px] text-modos-muted">
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

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold tracking-tight">
            Incident timeline
          </h2>
          <div className="text-[11.5px] text-modos-muted">
            replayable forensics
          </div>
        </div>
        <ol className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-1 before:bottom-1 before:w-px before:bg-modos-border">
          {incident.events.map((e) => {
            const Icon = eventIcon[e.kind];
            return (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    'absolute left-[-22px] top-0.5 size-5 rounded-full bg-modos-bg-elev border border-modos-border grid place-items-center',
                    eventTone[e.kind]
                  )}
                >
                  <Icon width={11} height={11} />
                </span>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="font-mono text-modos-subtle tabular-nums">
                    {relativeTime(e.ts)}
                  </span>
                  <span className="text-modos-text">{e.message}</span>
                  <span
                    className={cn(
                      'ml-auto text-[10.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-md',
                      e.severity === 'critical' &&
                        'bg-modos-critical/15 text-modos-critical',
                      e.severity === 'high' && 'bg-modos-warn/15 text-modos-warn',
                      e.severity === 'medium' &&
                        'bg-modos-info/15 text-modos-info',
                      e.severity === 'low' && 'bg-modos-ok/15 text-modos-ok'
                    )}
                  >
                    {e.severity}
                  </span>
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
  <div className="panel p-4">
    <div className="text-[11px] uppercase tracking-[0.16em] text-modos-muted">
      {label}
    </div>
    <div
      className={cn(
        'text-[24px] font-semibold mt-1 tabular-nums tracking-tight',
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
  <li className="flex items-start gap-2.5">
    <span
      className={cn(
        'mt-0.5 size-4 rounded-full grid place-items-center',
        active
          ? 'bg-modos-accent text-white'
          : 'bg-modos-bg-elev border border-modos-border text-modos-subtle'
      )}
    >
      {active ? <IconCheck width={10} height={10} /> : null}
    </span>
    <div className={cn('flex-1', !active && 'opacity-60')}>
      <div className="text-modos-text">{label}</div>
      <div className="text-[11.5px] text-modos-subtle">{detail}</div>
    </div>
  </li>
);

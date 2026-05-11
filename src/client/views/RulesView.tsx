import { useState } from 'react';

import type { ModRule } from '../../shared/types';
import {
  compileNaturalRule,
  toggleRuleEnabled,
  useStore,
} from '../state/store';
import { cn } from '../lib/cn';
import { relativeTime } from '../lib/format';
import { IconBolt, IconCheck, IconWand } from '../lib/icons';

const SAMPLE_PROMPTS = [
  'Flag posts from accounts under 7 days old with toxic language or coordinated reports.',
  'Auto-review posts with airdrop, NFT, or crypto promotion keywords.',
  'Highlight political posts with toxicity above 0.5 and at least 2 reports.',
  'Mark likely ban-evasion attempts from accounts created in the last 30 days with prior mod actions.',
];

export const RulesView = () => {
  const rules = useStore((s) => s.rules);
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastMatches, setLastMatches] = useState<
    { itemId: string; reason: string }[]
  >([]);
  const [lastRule, setLastRule] = useState<ModRule | null>(null);

  const submit = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    const result = await compileNaturalRule(
      name.trim() ||
        prompt.trim().split(' ').slice(0, 4).join(' ').replace(/[.,]$/, ''),
      prompt.trim()
    );
    setLastRule(result.rule);
    setLastMatches(result.matches);
    setBusy(false);
    setPrompt('');
    setName('');
  };

  return (
    <div className="route-shell flex min-h-0 flex-1 flex-col space-y-6 sm:space-y-8">
      <section className="hero-surface motion-default p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] border border-modos-border-strong bg-modos-panel shadow-[var(--shadow-panel)]">
              <IconWand className="text-modos-accent" aria-hidden />
            </span>
            <div className="min-w-0">
              <span className="t-kicker text-modos-subtle">Natural language rules</span>
              <h1 className="t-h1 mt-2 text-modos-text text-balance">
                Describe policy. MODOS turns it into live signals.
              </h1>
              <p className="t-body mt-2 max-w-2xl text-modos-muted">
                Write once in plain English. We compile deterministic checks locally—ideal
                for demos and playbook iteration without regex surgery.
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-modos-border bg-modos-bg-elev px-3 py-1.5 font-mono text-[11px] text-modos-muted">
            local compile · 0&nbsp;ms
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px] lg:gap-6">
        <div className="panel motion-default overflow-hidden p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="t-h3 text-modos-text">Compose</h2>
            <span className="text-[11px] text-modos-subtle">
              Matches evaluate against queued items instantly
            </span>
          </div>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Working title (optional)"
              className="input-chrome w-full px-3 py-2.5 text-[13px] bg-modos-bg"
            />
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: escalate coordinated reports on political threads where toxicity clears 0.55 and reporters share the same referrer."
              className="input-chrome w-full resize-none px-3 py-3 text-[13.5px] leading-relaxed bg-modos-bg sm:py-3.5 min-h-[120px]"
            />
          </div>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              <span className="w-full text-[10px] font-semibold uppercase tracking-[0.12em] text-modos-muted sm:hidden">
                Starters
              </span>
              {SAMPLE_PROMPTS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="motion-default rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev/80 px-2.5 py-1.5 text-left text-[11px] leading-snug text-modos-muted hover:border-modos-border-strong hover:bg-modos-panel hover:text-modos-text"
                >
                  {s.split(' ').slice(0, 8).join(' ')}…
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => submit()}
              disabled={!prompt.trim() || busy}
              className={cn(
                'motion-default motion-press inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-[13px] font-semibold',
                !prompt.trim() || busy ? 'opacity-50' : '',
                'bg-modos-accent text-white hover:bg-orange-600'
              )}
            >
              {busy ? (
                <span
                  className="size-[14px] shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white opacity-90"
                  aria-hidden
                />
              ) : (
                <IconBolt width={14} height={14} aria-hidden />
              )}
              {busy ? 'Compiling…' : 'Compile & match'}
            </button>
          </div>
          {busy ? (
            <p className="mt-3 text-[11.5px] text-modos-subtle">
              Running matchers locally — no outbound requests from this playground.
            </p>
          ) : null}

          {lastRule ? (
            <div className="mt-5 rounded-[var(--radius-lg)] border border-modos-ok/30 bg-modos-ok/[0.08] px-4 py-3.5 fade-in">
              <div className="flex flex-wrap items-start gap-2.5">
                <IconCheck className="mt-0.5 shrink-0 text-modos-ok" aria-hidden />
                <div className="min-w-0 flex-1 text-[13px] leading-snug text-modos-text">
                  <strong className="font-semibold">{lastRule.name}</strong> is live-ready in
                  playground mode. Matches{' '}
                  <span className="tabular-nums text-modos-accent">
                    {lastMatches.length}
                  </span>{' '}
                  pending {lastMatches.length === 1 ? 'row' : 'rows'} today.
                </div>
              </div>
              {lastMatches.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-modos-border/70 pt-3 text-[11.5px] text-modos-muted">
                  {lastMatches.slice(0, 4).map((m, i) => (
                    <div key={i} className="flex flex-wrap items-start gap-2 gap-y-1">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-modos-accent opacity-75" aria-hidden />
                      <span className="font-mono text-modos-subtle">{m.itemId}</span>
                      <span className="min-w-[60%] text-modos-muted sm:min-w-0">{m.reason}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
          <div className="t-kicker text-[10px] text-modos-subtle">Shortcuts</div>
          <div className="rounded-[var(--radius-lg)] border border-modos-border bg-modos-bg-elev/60 px-4 py-4 shadow-[var(--shadow-panel)]">
            <p className="text-[11.5px] leading-snug text-modos-muted">
              Need inspiration? Paste a playbook sentence you already emailed your mod Discord—MODOS preserves phrasing verbatim.
            </p>
          </div>
          <div className="space-y-2">
            {SAMPLE_PROMPTS.slice(3).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(s)}
                className="motion-default block w-full rounded-[var(--radius-md)] border border-dashed border-modos-border-strong bg-transparent px-3 py-2 text-left text-[11.5px] leading-snug text-modos-muted hover:bg-modos-panel hover:text-modos-text"
              >
                {s}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="panel motion-default p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="t-h3 text-modos-text">Active playbook</h2>
          <span className="font-mono text-[11.5px] text-modos-muted tabular-nums">
            {rules.length} rul{rules.length === 1 ? 'e' : 'es'} ·{' '}
            {rules.filter((r) => r.enabled).length} enforcing
          </span>
        </div>
        {!rules.length ? (
          <div className="empty-well">
            <p className="t-h3 font-medium text-modos-text">
              Compile your first directive
            </p>
            <p className="t-body mx-auto mt-2 max-w-md text-modos-muted">
              Rules land here immediately after compose—perfect for Judges watching you ship in under a minute.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 lg:gap-3">
            {rules.map((r) => (
              <RuleCard key={r.id} rule={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RuleCard = ({ rule }: { rule: ModRule }) => (
  <div className="grid grid-cols-1 gap-4 rounded-[var(--radius-lg)] border border-modos-border bg-modos-bg-elev/55 p-4 shadow-[var(--shadow-panel)] md:grid-cols-[1fr_auto] md:items-start md:p-5">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <h3 className="text-[15px] font-semibold leading-snug text-modos-text">
          {rule.name}
        </h3>
        <span className="rounded-md border border-modos-border bg-modos-panel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-modos-muted">
          {relativeTime(rule.createdAt)}
        </span>
        <span className="text-[10.5px] text-modos-subtle">
          authored u/{rule.author}
        </span>
      </div>
      <p className="t-body mt-2 text-modos-muted">{rule.prompt}</p>
      {rule.preview.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {rule.preview.map((p, i) => (
            <span
              key={i}
              className="rounded-md border border-modos-border bg-modos-panel px-1.5 py-0.5 text-[10.5px] font-mono leading-none text-modos-subtle"
            >
              {p}
            </span>
          ))}
        </div>
      ) : null}
    </div>
    <button
      type="button"
      onClick={() => toggleRuleEnabled(rule.id)}
      className={cn(
        'motion-default shrink-0 self-start rounded-[var(--radius-md)] border px-3 py-2 text-[12px] font-semibold justify-self-start md:justify-self-end',
        rule.enabled
          ? 'border-modos-ok/40 bg-modos-ok/14 text-modos-ok hover:bg-modos-ok/20'
          : 'border-modos-border bg-modos-bg text-modos-muted hover:border-modos-border-strong hover:text-modos-text'
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            rule.enabled ? 'bg-modos-ok' : 'bg-modos-subtle'
          )}
        />
        {rule.enabled ? 'Enforcing' : 'Paused'} ·{' '}
        <span className="tabular-nums">{rule.matched}</span> hits
      </span>
    </button>
  </div>
);

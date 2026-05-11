import { useState } from 'react';
import { cn } from '../lib/cn';
import { relativeTime } from '../lib/format';
import {
  compileNaturalRule,
  toggleRuleEnabled,
  useStore,
} from '../state/store';
import { IconBolt, IconCheck, IconWand } from '../lib/icons';
import type { ModRule } from '../../shared/types';

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
    <div className="px-6 py-6 max-w-[1180px] mx-auto space-y-6">
      <div>
        <div className="text-[12px] uppercase tracking-[0.16em] text-modos-muted flex items-center gap-2">
          <IconWand /> Natural-Language Moderation
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight mt-1">
          Describe how your community should be moderated.
        </h1>
        <p className="text-[13.5px] text-modos-muted mt-1.5">
          Type a rule in plain English. MODOS compiles it into a queryable
          signal — no YAML, no regex.
        </p>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold tracking-tight">Compose</h2>
          <span className="text-[11px] text-modos-muted">
            compiled locally · 0 ms latency
          </span>
        </div>
        <div className="space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rule name (optional)"
            className="w-full bg-modos-bg-elev border border-modos-border rounded-lg px-3 py-2 text-[13px] placeholder:text-modos-subtle outline-none focus:border-modos-border-strong transition"
          />
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Flag repeated toxicity from new accounts. Auto-review high-karma users separately."
            className="w-full bg-modos-bg-elev border border-modos-border rounded-lg px-3 py-2.5 text-[13.5px] placeholder:text-modos-subtle outline-none focus:border-modos-border-strong transition resize-none leading-snug"
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-[11.5px] px-2 py-1 rounded-md border border-modos-border text-modos-muted hover:text-modos-text hover:bg-modos-panel transition"
                >
                  {s.split(' ').slice(0, 5).join(' ')}…
                </button>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={!prompt.trim() || busy}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition',
                'bg-modos-accent text-white hover:bg-orange-500'
              )}
            >
              {busy ? (
                <span className="size-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <IconBolt />
              )}
              Compile rule
            </button>
          </div>
        </div>
        {lastRule && (
          <div className="mt-4 panel-inset p-3.5 fade-in">
            <div className="flex items-center gap-2">
              <IconCheck className="text-modos-ok" />
              <span className="text-[12.5px] text-modos-text">
                Rule “<span className="font-medium">{lastRule.name}</span>”
                compiled · matched{' '}
                <span className="text-modos-accent">
                  {lastMatches.length}
                </span>{' '}
                pending {lastMatches.length === 1 ? 'item' : 'items'}.
              </span>
            </div>
            {lastMatches.length > 0 && (
              <div className="mt-2.5 space-y-1 text-[12px] text-modos-muted">
                {lastMatches.slice(0, 4).map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="size-1 rounded-full bg-modos-accent" />
                    <span className="font-mono text-modos-subtle">
                      {m.itemId}
                    </span>
                    <span>{m.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold tracking-tight">
            Active rules
          </h2>
          <span className="text-[11.5px] text-modos-muted">
            {rules.length} total · {rules.filter((r) => r.enabled).length}{' '}
            enabled
          </span>
        </div>
        <div className="space-y-2">
          {rules.map((r) => (
            <RuleCard key={r.id} rule={r} />
          ))}
        </div>
      </div>
    </div>
  );
};

const RuleCard = ({ rule }: { rule: ModRule }) => (
  <div className="grid grid-cols-[1fr_auto] gap-4 items-start panel-inset p-3.5">
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-[14px] font-medium">{rule.name}</h3>
        <span className="text-[10.5px] uppercase tracking-wider rounded-md px-1.5 py-0.5 bg-modos-bg border border-modos-border text-modos-muted">
          {rule.matched} matched · {relativeTime(rule.createdAt)} · u/
          {rule.author}
        </span>
      </div>
      <p className="text-[13px] text-modos-muted mt-1 leading-snug">
        {rule.prompt}
      </p>
      {rule.preview.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {rule.preview.map((p, i) => (
            <span
              key={i}
              className="text-[10.5px] rounded-md px-1.5 py-0.5 bg-modos-bg border border-modos-border text-modos-subtle"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
    <button
      onClick={() => toggleRuleEnabled(rule.id)}
      className={cn(
        'shrink-0 flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-md border transition',
        rule.enabled
          ? 'bg-modos-ok/15 border-modos-ok/30 text-modos-ok'
          : 'border-modos-border text-modos-muted hover:text-modos-text'
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          rule.enabled ? 'bg-modos-ok pulse-dot' : 'bg-modos-subtle'
        )}
      />
      {rule.enabled ? 'enabled' : 'paused'}
    </button>
  </div>
);

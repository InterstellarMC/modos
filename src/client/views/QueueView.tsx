import { useMemo, useState } from 'react';
import { cn } from '../lib/cn';
import { relativeTime, truncate } from '../lib/format';
import {
  bulkActionByLevel,
  generateDraft,
  performAction,
  setSelectedItem,
  setSelectedUser,
  setView,
  useSelectedItem,
  useStore,
  clearDraft,
} from '../state/store';
import { RiskBadge } from '../components/RiskBadge';
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconFlag,
  IconUser,
  IconWand,
  IconX,
} from '../lib/icons';
import type { QueueItem, RiskLevel } from '../../shared/types';

type Filter = 'all' | RiskLevel;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

export const QueueView = () => {
  const queue = useStore((s) => s.queue);
  const selectedId = useStore((s) => s.selectedItemId);
  const [filter, setFilter] = useState<Filter>('all');

  const pending = useMemo(
    () =>
      queue
        .filter((q) => q.status === 'pending')
        .filter((q) => filter === 'all' || q.risk.level === filter),
    [queue, filter]
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,420px)] h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex flex-col border-r border-modos-border">
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h1 className="text-[20px] font-semibold tracking-tight">
                AI Triage Queue
              </h1>
              <p className="text-[12.5px] text-modos-muted mt-0.5">
                MODOS scored, sorted, and explained {pending.length} pending{' '}
                {pending.length === 1 ? 'item' : 'items'}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkActionByLevel('low', 'approve')}
                className="text-[12px] px-3 py-1.5 panel-inset hover:border-modos-border-strong text-modos-muted hover:text-modos-text transition"
              >
                Approve all low
              </button>
              <button
                onClick={() => bulkActionByLevel('critical', 'remove')}
                className="text-[12px] px-3 py-1.5 rounded-lg bg-modos-critical/15 border border-modos-critical/40 text-modos-critical hover:bg-modos-critical/25 transition"
              >
                Remove all critical
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => {
              const count =
                f.id === 'all'
                  ? queue.filter((q) => q.status === 'pending').length
                  : queue.filter(
                      (q) => q.status === 'pending' && q.risk.level === f.id
                    ).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'text-[12px] px-2.5 py-1 rounded-md border transition',
                    filter === f.id
                      ? 'bg-modos-panel border-modos-border-strong text-modos-text'
                      : 'border-transparent text-modos-muted hover:text-modos-text hover:bg-modos-panel/50'
                  )}
                >
                  {f.label}
                  <span className="ml-1.5 text-modos-subtle tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1.5">
          {pending.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={() => setSelectedItem(item.id)}
            />
          ))}
          {!pending.length && <EmptyState />}
        </div>
      </div>
      <DetailPanel />
    </div>
  );
};

const QueueCard = ({
  item,
  selected,
  onSelect,
}: {
  item: QueueItem;
  selected: boolean;
  onSelect: () => void;
}) => {
  const positive = item.risk.signals
    .filter((s) => s.weight > 0)
    .slice(0, 3);
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border bg-modos-panel/50 hover:bg-modos-panel transition p-3.5 group',
        selected
          ? 'border-modos-border-strong ring-1 ring-modos-accent/30 bg-modos-panel'
          : 'border-modos-border'
      )}
    >
      <div className="flex items-start gap-3">
        <RiskBadge level={item.risk.level} score={item.risk.score} compact />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11.5px] text-modos-muted">
            <span className="font-mono">u/{item.author.username}</span>
            <span className="text-modos-subtle">·</span>
            <span>
              {item.kind === 'post' ? 'post' : 'comment'} in {item.subreddit}
            </span>
            <span className="text-modos-subtle">·</span>
            <span>{relativeTime(item.createdAt)}</span>
            {item.reportCount > 0 && (
              <>
                <span className="text-modos-subtle">·</span>
                <span className="text-modos-warn flex items-center gap-1">
                  <IconFlag width={10} height={10} /> {item.reportCount}
                </span>
              </>
            )}
            {item.groupId && (
              <span className="ml-1 text-[10px] uppercase tracking-wider rounded-md px-1.5 py-0.5 bg-modos-info/12 text-modos-info">
                grouped
              </span>
            )}
          </div>
          {item.title && (
            <h3 className="mt-1 text-[14px] font-medium text-modos-text leading-snug">
              {item.title}
            </h3>
          )}
          <p className="mt-1 text-[12.5px] text-modos-muted leading-snug">
            {truncate(item.body, 220)}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {positive.map((s, i) => (
              <span
                key={i}
                className="text-[10.5px] uppercase tracking-wider rounded-md px-1.5 py-0.5 bg-modos-bg-elev border border-modos-border text-modos-muted"
              >
                {s.label}
              </span>
            ))}
            {item.risk.isLikelyFalsePositive && (
              <span className="text-[10.5px] uppercase tracking-wider rounded-md px-1.5 py-0.5 bg-modos-ok/12 text-modos-ok">
                likely false positive
              </span>
            )}
          </div>
        </div>
        <IconArrowRight className="text-modos-subtle opacity-0 group-hover:opacity-100 transition mt-1" />
      </div>
    </button>
  );
};

const DetailPanel = () => {
  const item = useSelectedItem();
  const draft = useStore((s) => s.draft);
  const tone = useStore((s) => s.pendingTone);

  if (!item) {
    return (
      <div className="grid place-items-center text-modos-muted text-[13px] p-10">
        <div className="text-center max-w-xs">
          <div className="size-12 rounded-full bg-modos-panel border border-modos-border mx-auto grid place-items-center mb-3">
            <IconWand className="text-modos-accent" />
          </div>
          <p>
            Select an item to see MODOS reasoning, generate a response, and act
            in one click.
          </p>
        </div>
      </div>
    );
  }

  const onAction = async (action: 'approve' | 'remove' | 'escalate') => {
    await performAction(item.id, action);
    setSelectedItem(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-modos-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <RiskBadge level={item.risk.level} score={item.risk.score} />
            <span className="text-[11px] text-modos-muted">
              confidence {(item.risk.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <h2 className="text-[15px] font-semibold leading-snug">
            {item.title ?? `Comment by u/${item.author.username}`}
          </h2>
          <div className="text-[11.5px] text-modos-muted mt-1 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedUser(item.author.username);
                setView('memory');
              }}
              className="font-mono hover:text-modos-text transition"
            >
              u/{item.author.username}
            </button>
            <span className="text-modos-subtle">·</span>
            <span>{item.author.accountAgeDays}d old</span>
            <span className="text-modos-subtle">·</span>
            <span>{item.author.karma} karma</span>
            <span className="text-modos-subtle">·</span>
            <span>trust {item.author.trustScore}/100</span>
            <span className="text-modos-subtle">·</span>
            <span className="flex items-center gap-1">
              <IconClock width={10} height={10} />
              {relativeTime(item.createdAt)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedItem(null)}
          className="p-1 text-modos-muted hover:text-modos-text rounded-md hover:bg-modos-panel transition"
        >
          <IconX />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <section className="panel-inset p-3.5">
          <p className="text-[13.5px] leading-snug text-modos-text">
            {item.body}
          </p>
          {item.reportReasons.length > 0 && (
            <div className="mt-3 pt-3 border-t border-modos-border text-[11.5px] text-modos-muted">
              <div className="text-modos-text font-medium text-[11px] uppercase tracking-wider mb-1.5">
                Reports
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.reportReasons.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-md px-1.5 py-0.5 bg-modos-panel border border-modos-border"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-modos-muted">
              MODOS Reasoning
            </h3>
            <span className="text-[11px] text-modos-subtle">
              recommends <strong className="text-modos-text">{item.risk.recommendedAction}</strong>
            </span>
          </div>
          <p className="text-[13px] text-modos-text mb-3 leading-snug">
            <span className="text-modos-accent font-medium">
              {item.risk.primaryReason}
            </span>{' '}
            drives the score. {item.risk.isLikelyFalsePositive
              ? 'However, trust signals suggest this may be a false positive — review carefully.'
              : 'Action recommended based on the combined signal weight below.'}
          </p>
          <div className="space-y-1.5">
            {item.risk.signals.map((s, i) => {
              const positive = s.weight > 0;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_56px] items-center gap-3 text-[12px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'size-1.5 rounded-full shrink-0',
                        positive ? 'bg-modos-warn' : 'bg-modos-ok'
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-modos-text">{s.label}</div>
                      <div className="truncate text-modos-subtle text-[11px]">
                        {s.evidence}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-modos-muted tabular-nums">
                    {positive ? '+' : ''}
                    {s.weight.toFixed(2)}
                  </div>
                  <div className="h-1 rounded-full bg-modos-border overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        positive ? 'bg-modos-warn' : 'bg-modos-ok'
                      )}
                      style={{
                        width: `${Math.min(100, Math.abs(s.weight) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-modos-muted">
              Removal Assistant
            </h3>
            <div className="flex items-center gap-1 text-[11px]">
              {(['firm', 'neutral', 'friendly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => generateDraft(item.id, t)}
                  className={cn(
                    'px-2 py-0.5 rounded-md border capitalize transition',
                    tone === t && draft
                      ? 'border-modos-border-strong text-modos-text bg-modos-panel'
                      : 'border-transparent text-modos-muted hover:text-modos-text'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {!draft ? (
            <button
              onClick={() => generateDraft(item.id, 'neutral')}
              className="w-full panel-inset hover:border-modos-border-strong transition p-3 text-left text-[12.5px] text-modos-muted hover:text-modos-text relative overflow-hidden scanline"
            >
              <div className="flex items-center gap-2">
                <IconWand className="text-modos-accent" />
                Generate a polished removal response in one click.
              </div>
            </button>
          ) : (
            <div className="panel-inset p-3.5 space-y-2.5 fade-in">
              <p className="text-[13px] text-modos-text leading-snug whitespace-pre-line">
                {draft.publicReply}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-modos-muted">
                <span className="font-mono">{draft.modlogNote}</span>
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(draft.publicReply);
                  }}
                  className="ml-auto text-modos-info hover:text-modos-text"
                >
                  Copy
                </button>
                <button
                  onClick={() => clearDraft()}
                  className="text-modos-muted hover:text-modos-text"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="border-t border-modos-border p-3.5 flex items-center gap-2 bg-modos-bg-elev">
        <button
          onClick={() => onAction('approve')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-modos-ok/15 text-modos-ok hover:bg-modos-ok/25 transition text-[13px] font-medium"
        >
          <IconCheck /> Approve
        </button>
        <button
          onClick={() => onAction('escalate')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-modos-info/15 text-modos-info hover:bg-modos-info/25 transition text-[13px] font-medium"
        >
          <IconUser /> Escalate
        </button>
        <button
          onClick={() => onAction('remove')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-modos-critical/15 text-modos-critical hover:bg-modos-critical/25 transition text-[13px] font-medium"
        >
          <IconX /> Remove
        </button>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="grid place-items-center py-24">
    <div className="text-center max-w-sm">
      <div className="size-12 rounded-full bg-modos-panel border border-modos-border mx-auto grid place-items-center mb-3">
        <IconCheck className="text-modos-ok" />
      </div>
      <h3 className="text-[14px] text-modos-text">Queue is clear</h3>
      <p className="text-[12.5px] text-modos-muted mt-1">
        MODOS will surface new items here the moment a signal crosses
        threshold.
      </p>
    </div>
  </div>
);

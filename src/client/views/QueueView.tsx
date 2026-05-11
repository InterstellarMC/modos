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
    <div className="grid h-[calc(100vh-3.25rem)] grid-cols-[minmax(0,1fr)_minmax(320px,440px)] overflow-hidden bg-modos-bg/40">
      <div className="flex min-h-0 flex-col border-r border-modos-border bg-modos-bg">
        <div className="shrink-0 border-b border-modos-border px-6 pb-4 pt-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="t-kicker text-modos-subtle">Triage</p>
              <h1 className="t-h2 mt-1 text-modos-text">AI queue</h1>
              <p className="t-body mt-1.5 max-w-xl text-modos-muted">
                {pending.length} pending{' '}
                {pending.length === 1 ? 'decision' : 'decisions'}. Highest
                risk first—open the inspector to resolve.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => bulkActionByLevel('low', 'approve')}
                className="motion-default motion-press rounded-[var(--radius-md)] border border-modos-border bg-modos-panel/50 px-3 py-2 text-[12px] font-medium text-modos-muted hover:border-modos-border-strong hover:bg-modos-panel hover:text-modos-text"
              >
                Approve low
              </button>
              <button
                type="button"
                onClick={() => bulkActionByLevel('critical', 'remove')}
                className="motion-default motion-press rounded-[var(--radius-md)] border border-modos-critical/35 bg-modos-critical/12 px-3 py-2 text-[12px] font-medium text-modos-critical hover:bg-modos-critical/18"
              >
                Remove critical
              </button>
            </div>
          </div>
          <div
            role="tablist"
            aria-label="Queue risk filter"
            className="inline-flex flex-wrap gap-0.5 rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev p-1"
          >
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
                  role="tab"
                  type="button"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'motion-default rounded-[10px] px-2.5 py-1.5 text-[12px] font-medium',
                    filter === f.id
                      ? 'bg-modos-panel text-modos-text shadow-[var(--shadow-panel)] ring-1 ring-modos-border-strong'
                      : 'text-modos-muted hover:bg-modos-panel/40 hover:text-modos-text'
                  )}
                >
                  {f.label}
                  <span className="ml-1.5 tabular-nums text-modos-subtle">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
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

const riskAccent: Record<RiskLevel, string> = {
  critical: 'border-l-modos-critical',
  high: 'border-l-modos-warn',
  medium: 'border-l-modos-info',
  low: 'border-l-transparent',
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
      type="button"
      onClick={onSelect}
      className={cn(
        'group motion-default w-full rounded-[var(--radius-lg)] border border-modos-border bg-modos-panel/35 p-3.5 text-left',
        'hover:border-modos-border-strong hover:bg-modos-panel/70',
        'focus-visible:z-[1]',
        riskAccent[item.risk.level],
        'border-l-[3px]',
        selected
          ? 'border-modos-border-strong bg-modos-panel shadow-[var(--shadow-panel)] ring-1 ring-modos-accent/20'
          : ''
      )}
    >
      <div className="flex items-start gap-3">
        <RiskBadge level={item.risk.level} score={item.risk.score} compact />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-modos-muted">
            <span className="font-mono text-modos-muted">
              u/{item.author.username}
            </span>
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
              <span className="ml-1 rounded-md bg-modos-bg-elev px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-modos-info ring-1 ring-modos-info/20">
                Grouped
              </span>
            )}
          </div>
          {item.title && (
            <h3 className="mt-1.5 t-h3 font-medium text-modos-text">
              {item.title}
            </h3>
          )}
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-modos-muted">
            {truncate(item.body, 200)}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {positive.map((s, i) => (
              <span
                key={i}
                className="rounded-md border border-modos-border bg-modos-bg-elev/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-modos-muted"
              >
                {s.label}
              </span>
            ))}
            {item.risk.isLikelyFalsePositive && (
              <span className="rounded-md bg-modos-ok/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-modos-ok ring-1 ring-modos-ok/20">
                Likely benign
              </span>
            )}
          </div>
        </div>
        <IconArrowRight className="mt-1 shrink-0 text-modos-subtle opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100" />
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
      <div className="grid place-items-center border-l border-modos-border bg-modos-bg-elev/35 p-10 text-modos-muted">
        <div className="max-w-[280px] text-center">
          <div className="mx-auto mb-4 grid size-11 place-items-center rounded-[var(--radius-lg)] border border-modos-border bg-modos-panel shadow-[var(--shadow-panel)]">
            <IconWand className="text-modos-accent" aria-hidden />
          </div>
          <p className="t-body text-modos-muted">
            Select a row to open the inspector—reasoning, removal draft, and
            actions stay in one column.
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-modos-border bg-modos-bg">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-modos-border px-5 py-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <RiskBadge level={item.risk.level} score={item.risk.score} />
            <span className="rounded-md bg-modos-bg-elev px-2 py-0.5 font-mono text-[11px] text-modos-muted tabular-nums ring-1 ring-modos-border">
              {(item.risk.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <h2 className="t-h3 text-[15px] font-semibold leading-snug text-modos-text">
            {item.title ?? `Comment by u/${item.author.username}`}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-modos-muted">
            <button
              type="button"
              onClick={() => {
                setSelectedUser(item.author.username);
                setView('memory');
              }}
              className="motion-default rounded-md font-mono text-modos-muted underline-offset-2 hover:bg-modos-bg-elev hover:text-modos-text"
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
          type="button"
          onClick={() => setSelectedItem(null)}
          aria-label="Close inspector"
          className="motion-default rounded-[var(--radius-md)] p-2 text-modos-muted hover:bg-modos-panel hover:text-modos-text"
        >
          <IconX />
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <section className="panel-inset p-4 shadow-[var(--shadow-panel)]">
          <p className="t-body text-modos-text">{item.body}</p>
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

        <section className="rounded-[var(--radius-lg)] border border-modos-border bg-modos-panel/30 p-4 shadow-[var(--shadow-panel)]">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="t-kicker text-modos-subtle">Reasoning</h3>
            <span className="text-[11.5px] text-modos-muted">
              Suggested{' '}
              <span className="font-medium text-modos-text">
                {item.risk.recommendedAction}
              </span>
            </span>
          </div>
          <p className="mb-4 t-body text-modos-text">
            <span className="font-medium text-modos-text">
              {item.risk.primaryReason}
            </span>{' '}
            {item.risk.isLikelyFalsePositive
              ? 'Trust signals lean benign—confirm before you remove.'
              : 'Weighted evidence below supports the score.'}
          </p>
          <div className="space-y-2">
            {item.risk.signals.map((s, i) => {
              const positive = s.weight > 0;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_52px] items-center gap-3 rounded-[var(--radius-md)] border border-modos-border/70 bg-modos-bg-elev/50 px-2.5 py-2 text-[12px]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        positive ? 'bg-modos-warn' : 'bg-modos-ok'
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-modos-text">
                        {s.label}
                      </div>
                      <div className="truncate text-[11px] leading-snug text-modos-subtle">
                        {s.evidence}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-modos-muted tabular-nums">
                    {positive ? '+' : ''}
                    {s.weight.toFixed(2)}
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-modos-border">
                    <div
                      className={cn(
                        'h-full rounded-full motion-default',
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="t-kicker text-modos-subtle">Removal assistant</h3>
            <div
              className="inline-flex rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev p-0.5"
              role="group"
              aria-label="Draft tone"
            >
              {(['firm', 'neutral', 'friendly'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => generateDraft(item.id, t)}
                  className={cn(
                    'motion-default rounded-[10px] px-2.5 py-1 text-[11px] font-medium capitalize',
                    tone === t && draft
                      ? 'bg-modos-panel text-modos-text shadow-[var(--shadow-panel)] ring-1 ring-modos-border-strong'
                      : 'text-modos-muted hover:text-modos-text'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {!draft ? (
            <button
              type="button"
              onClick={() => generateDraft(item.id, 'neutral')}
              className="sheen-hover motion-default motion-press w-full rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev p-3.5 text-left text-[12.5px] text-modos-muted hover:border-modos-border-strong hover:text-modos-text"
            >
              <div className="relative z-[1] flex items-center gap-2.5">
                <IconWand className="shrink-0 text-modos-accent" aria-hidden />
                <span>Generate a removal-ready reply and mod note.</span>
              </div>
            </button>
          ) : (
            <div className="panel-inset space-y-3 p-4 fade-in shadow-[var(--shadow-panel)]">
              <p className="t-body whitespace-pre-line text-modos-text">
                {draft.publicReply}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-modos-muted">
                <span className="font-mono">{draft.modlogNote}</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(draft.publicReply);
                  }}
                  className="motion-default ml-auto font-medium text-modos-info hover:text-modos-text"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => clearDraft()}
                  className="motion-default font-medium text-modos-muted hover:text-modos-text"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t border-modos-border bg-modos-bg-elev/90 p-3.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onAction('approve')}
          className="motion-default motion-press flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-modos-ok/12 py-2.5 text-[13px] font-semibold text-modos-ok ring-1 ring-modos-ok/25 hover:bg-modos-ok/18"
        >
          <IconCheck /> Approve
        </button>
        <button
          type="button"
          onClick={() => onAction('escalate')}
          className="motion-default motion-press flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-modos-info/12 py-2.5 text-[13px] font-semibold text-modos-info ring-1 ring-modos-info/25 hover:bg-modos-info/18"
        >
          <IconUser /> Escalate
        </button>
        <button
          type="button"
          onClick={() => onAction('remove')}
          className="motion-default motion-press flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-modos-critical/12 py-2.5 text-[13px] font-semibold text-modos-critical ring-1 ring-modos-critical/30 hover:bg-modos-critical/18"
        >
          <IconX /> Remove
        </button>
      </footer>
    </div>
  );
};

const EmptyState = () => (
  <div className="grid place-items-center py-16 md:py-20">
    <div className="empty-well mx-2 max-w-md sm:mx-0">
      <div className="mx-auto mb-4 grid size-11 place-items-center rounded-[var(--radius-lg)] border border-modos-border bg-modos-panel shadow-[var(--shadow-panel)]">
        <IconCheck className="text-modos-ok" aria-hidden />
      </div>
      <h3 className="t-h3 font-medium text-modos-text">
        Nothing in this filter
      </h3>
      <p className="t-body mx-auto mt-2 max-w-sm text-modos-muted">
        Try another risk band—or breathe. Signals repopulate the instant they
        clear threshold again.
      </p>
    </div>
  </div>
);

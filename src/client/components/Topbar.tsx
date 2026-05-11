import { setPaletteOpen, useStore } from '../state/store';
import { cn } from '../lib/cn';
import { IconSearch, IconBolt, IconCommand } from '../lib/icons';
import { formatNumber } from '../lib/format';

export const Topbar = () => {
  const subreddit = useStore((s) => s.subreddit);
  const username = useStore((s) => s.username);
  const incidentStatus = useStore((s) => s.incident.status);
  const subscribers = useStore((s) => s.overview.subreddit.subscribers);
  const modCount = useStore((s) => s.overview.subreddit.modCount);
  const online = useStore((s) => s.online);

  const statusBadge =
    incidentStatus === 'critical'
      ? {
          label: 'Crisis · brigade detected',
          color: 'text-modos-critical',
          bg: 'bg-modos-critical/15',
        }
      : incidentStatus === 'elevated'
        ? {
            label: 'Elevated',
            color: 'text-modos-warn',
            bg: 'bg-modos-warn/15',
          }
        : {
            label: 'Calm',
            color: 'text-modos-ok',
            bg: 'bg-modos-ok/15',
          };

  return (
    <header className="h-[52px] px-6 flex items-center justify-between gap-6 border-b border-modos-border bg-modos-bg-elev/80 backdrop-blur-md backdrop-saturate-150 sticky top-0 z-10">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-baseline gap-2.5 min-w-0 text-[13px] leading-snug">
          <span className="text-modos-subtle shrink-0 tabular-nums t-kicker">
            Community
          </span>
          <span className="font-semibold text-modos-text truncate">
            {subreddit.startsWith('r/') ? subreddit : `r/${subreddit}`}
          </span>
          <span className="text-modos-subtle hidden sm:inline" aria-hidden>
            ·
          </span>
          <span className="text-modos-muted hidden sm:inline truncate">
            {formatNumber(subscribers)} members · {modCount} mods
          </span>
        </div>
        <div
          className={cn(
            'motion-default shrink-0 flex items-center gap-2 rounded-full border border-modos-border/80 px-2.5 py-1 text-[12px] font-medium',
            statusBadge.bg,
            statusBadge.color
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              incidentStatus === 'critical' && 'pulse-dot',
              incidentStatus !== 'critical' && 'opacity-90'
            )}
            style={{ background: 'currentColor' }}
          />
          <span className="whitespace-nowrap">{statusBadge.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className={cn(
            'motion-default motion-press flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-1.5 panel-inset',
            'border-modos-border text-[12.5px] text-modos-muted',
            'hover:border-modos-border-strong hover:bg-modos-panel/40 hover:text-modos-text',
            'active:bg-modos-panel/60'
          )}
        >
          <IconSearch className="text-modos-subtle shrink-0" />
          <span className="hidden md:inline truncate">Search, jump, actions</span>
          <span className="kbd ml-1 hidden sm:flex shrink-0 items-center gap-1">
            <IconCommand width={10} height={10} aria-hidden /> K
          </span>
        </button>
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-modos-border bg-modos-panel/35 px-2.5 py-1.5 text-[12.5px] motion-default hover:border-modos-border-strong hover:bg-modos-panel/50">
          <div className="size-6 shrink-0 rounded-full border border-modos-border-strong bg-modos-accent/90 grid place-items-center text-[11px] font-semibold text-white">
            {username.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-modos-text truncate max-[520px]:hidden">
            u/{username}
          </span>
          <div
            className={cn(
              'motion-default ml-1 flex items-center gap-1 border-l border-modos-border pl-2 text-[10.5px] font-medium uppercase tracking-[0.08em]',
              online ? 'text-modos-ok' : 'text-modos-muted'
            )}
          >
            <IconBolt
              width={10}
              height={10}
              className={online ? 'text-modos-ok' : 'text-modos-muted'}
            />
            {online ? 'Live' : 'Demo'}
          </div>
        </div>
      </div>
    </header>
  );
};

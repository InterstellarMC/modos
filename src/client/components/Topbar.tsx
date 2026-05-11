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
    <header className="h-14 px-5 flex items-center justify-between border-b border-modos-border bg-modos-bg/70 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-modos-muted">subreddit</span>
          <span className="font-medium tabular-nums">{subreddit}</span>
          <span className="text-modos-subtle">·</span>
          <span className="text-modos-muted">
            {formatNumber(subscribers)} subs · {modCount} mods
          </span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-wider',
            statusBadge.bg,
            statusBadge.color
          )}
        >
          <span
            className="size-1.5 rounded-full pulse-dot"
            style={{ background: 'currentColor' }}
          />
          {statusBadge.label}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 panel-inset hover:border-modos-border-strong text-[12.5px] text-modos-muted hover:text-modos-text transition"
        >
          <IconSearch className="text-modos-subtle" />
          <span>Search · jump · run</span>
          <span className="ml-3 kbd flex items-center gap-1">
            <IconCommand width={10} height={10} /> K
          </span>
        </button>
        <div className="flex items-center gap-2 panel-inset px-2.5 py-1.5 text-[12.5px]">
          <div className="size-5 rounded-full bg-gradient-to-br from-modos-accent to-orange-700 grid place-items-center text-[10px] font-semibold">
            {username.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-modos-text">u/{username}</span>
          <div
            className={cn(
              'flex items-center gap-1 text-[10.5px] uppercase tracking-wide',
              online ? 'text-modos-ok' : 'text-modos-muted'
            )}
          >
            <IconBolt
              width={10}
              height={10}
              className={online ? 'text-modos-ok' : 'text-modos-muted'}
            />
            {online ? 'live' : 'demo'}
          </div>
        </div>
      </div>
    </header>
  );
};

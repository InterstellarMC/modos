import { useStore, setView } from '../state/store';
import { cn } from '../lib/cn';
import {
  IconHome,
  IconQueue,
  IconRadar,
  IconRules,
  IconMemory,
} from '../lib/icons';
import type { ComponentType, SVGProps } from 'react';

type View = 'overview' | 'queue' | 'raid' | 'rules' | 'memory';

type NavItem = {
  id: View;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  shortcut: string;
  badge?: number;
};

export const Sidebar = () => {
  const view = useStore((s) => s.view);
  const queue = useStore((s) => s.queue);
  const incident = useStore((s) => s.incident);

  const pending = queue.filter((q) => q.status === 'pending').length;
  const critical = queue.filter(
    (q) => q.status === 'pending' && q.risk.level === 'critical'
  ).length;

  const items: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: IconHome, shortcut: 'G O' },
    {
      id: 'queue',
      label: 'AI Queue',
      icon: IconQueue,
      shortcut: 'G Q',
      badge: pending,
    },
    {
      id: 'raid',
      label: 'Raid Radar',
      icon: IconRadar,
      shortcut: 'G R',
      badge: incident.status === 'critical' ? 1 : 0,
    },
    { id: 'rules', label: 'NL Rules', icon: IconRules, shortcut: 'G N' },
    { id: 'memory', label: 'Mod Memory', icon: IconMemory, shortcut: 'G M' },
  ];

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-modos-border bg-modos-bg">
      <div className="border-b border-modos-border/80 px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="relative grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)] border border-modos-border-strong bg-modos-panel shadow-[var(--shadow-panel)]">
            <div className="size-6 rounded-[6px] bg-gradient-to-br from-modos-accent to-orange-800/95" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-semibold tracking-tight text-modos-text">
              MODOS
            </div>
            <div className="t-kicker mt-1 text-[10px] tracking-[0.12em] text-modos-subtle">
              Moderation OS
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-px px-2.5 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                'group motion-default relative flex w-full items-center gap-2.5 rounded-[var(--radius-md)] py-2 pr-2 text-[13px] font-medium text-left',
                active
                  ? 'bg-modos-panel pl-3 text-modos-text shadow-[var(--shadow-panel)] ring-1 ring-modos-border-strong sm:pl-3.5'
                  : 'border border-transparent pl-2.5 text-modos-muted hover:border-modos-border hover:bg-modos-bg-elev hover:text-modos-text'
              )}
            >
              {active ? (
                <span className="absolute left-1.5 top-1/2 hidden h-[18px] w-px -translate-y-1/2 bg-modos-accent sm:block" />
              ) : null}
              <Icon
                className={cn(
                  'shrink-0 transition-colors duration-[var(--dur-fast)]',
                  active ? 'text-modos-text' : 'text-modos-subtle group-hover:text-modos-muted'
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'text-[10px] rounded-md px-1.5 py-0.5 font-medium tabular-nums',
                    item.id === 'queue' && critical > 0
                      ? 'bg-modos-critical/20 text-modos-critical'
                      : 'bg-modos-border text-modos-muted'
                  )}
                >
                  {item.id === 'queue' && critical > 0 ? critical : item.badge}
                </span>
              )}
              <span className="hidden kbd opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:inline-block group-hover:opacity-100">
                {item.shortcut}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="rounded-[var(--radius-md)] border border-modos-border bg-modos-panel/40 p-3.5 shadow-[var(--shadow-panel)]">
          <div className="flex items-center gap-2 mb-1 text-[11.5px] font-medium text-modos-text">
            <span
              className="size-1.5 shrink-0 rounded-full bg-modos-ok"
              aria-hidden
            />
            <span>Engine</span>
            <span className="ml-auto rounded-md bg-modos-bg-elev px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-modos-muted">
              v0.1
            </span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-modos-muted">
            Local inference · deterministic checks in this playground.
          </p>
        </div>
      </div>
    </aside>
  );
};

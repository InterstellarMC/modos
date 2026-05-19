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
import type { View } from '../state/store';

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
  const aiChecksPerSec = useStore((s) => s.aiChecksPerSec);

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
    <aside className="w-[232px] shrink-0 border-r border-modos-border bg-modos-bg-elev flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative size-7 rounded-lg bg-gradient-to-br from-modos-accent to-orange-700 grid place-items-center shadow-[0_0_24px_-6px_rgba(255,69,0,0.7)]">
            <div className="size-2.5 rounded-sm bg-white/95" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">MODOS</div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-modos-subtle">
              Moderation OS
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors',
                active
                  ? 'bg-modos-panel text-modos-text border border-modos-border-strong'
                  : 'text-modos-muted hover:text-modos-text hover:bg-modos-panel/50 border border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'shrink-0',
                  active ? 'text-modos-accent' : 'text-modos-muted'
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
              <span className="hidden group-hover:inline-block kbd">
                {item.shortcut}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <div className="panel-inset p-3 text-[11.5px] text-modos-muted leading-snug">
          <div className="flex items-center gap-1.5 mb-1.5 text-modos-text font-medium">
            <span
              className="size-1.5 rounded-full text-modos-ok pulse-dot"
              style={{ background: 'var(--color-modos-ok)' }}
            />
            <span>MODOS Engine</span>
          </div>
          <p>
            Reasoning v0.1 ·{' '}
            <span className="font-mono tabular-nums">{aiChecksPerSec}</span>{' '}
            checks/s · local
          </p>
        </div>
      </div>
    </aside>
  );
};

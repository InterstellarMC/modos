import { useEffect, useMemo, useRef, useState } from 'react';

import {
  bulkActionByLevel,
  enterCrisis,
  exitCrisis,
  setPaletteOpen,
  setView,
  toast,
  useStore,
} from '../state/store';
import { cn } from '../lib/cn';
import {
  IconArrowRight,
  IconHome,
  IconQueue,
  IconRadar,
  IconRules,
  IconMemory,
  IconShield,
  IconWand,
  IconBolt,
} from '../lib/icons';

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: typeof IconHome;
  run: () => void | Promise<void>;
};

export const CommandPalette = () => {
  const open = useStore((s) => s.paletteOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const commands = useMemo<Cmd[]>(
    () => [
      {
        id: 'go-overview',
        label: 'Go to Overview',
        hint: 'G O',
        group: 'Navigate',
        icon: IconHome,
        run: () => setView('overview'),
      },
      {
        id: 'go-queue',
        label: 'Open AI Queue',
        hint: 'G Q',
        group: 'Navigate',
        icon: IconQueue,
        run: () => setView('queue'),
      },
      {
        id: 'go-raid',
        label: 'Open Raid Radar',
        hint: 'G R',
        group: 'Navigate',
        icon: IconRadar,
        run: () => setView('raid'),
      },
      {
        id: 'go-rules',
        label: 'Open Natural-Language Rules',
        hint: 'G N',
        group: 'Navigate',
        icon: IconRules,
        run: () => setView('rules'),
      },
      {
        id: 'go-memory',
        label: 'Open Mod Memory',
        hint: 'G M',
        group: 'Navigate',
        icon: IconMemory,
        run: () => setView('memory'),
      },
      {
        id: 'bulk-remove-critical',
        label: 'Triage · Remove all CRITICAL items',
        group: 'Triage',
        icon: IconShield,
        run: async () => {
          await bulkActionByLevel('critical', 'remove');
          toast('Bulk removed all critical-risk items', 'warn');
        },
      },
      {
        id: 'bulk-approve-low',
        label: 'Triage · Approve all LOW-risk items',
        group: 'Triage',
        icon: IconShield,
        run: async () => {
          await bulkActionByLevel('low', 'approve');
          toast('Approved all low-risk items', 'ok');
        },
      },
      {
        id: 'crisis-on',
        label: 'Activate Crisis Mode',
        group: 'Incident',
        icon: IconBolt,
        run: () => {
          enterCrisis();
          toast('Crisis Mode engaged · new accounts throttled', 'warn');
        },
      },
      {
        id: 'crisis-off',
        label: 'Stand down Crisis Mode',
        group: 'Incident',
        icon: IconBolt,
        run: () => exitCrisis(),
      },
      {
        id: 'compose-rule',
        label: 'Compose a new rule in natural language',
        group: 'Create',
        icon: IconWand,
        run: () => setView('rules'),
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
    );
  }, [query, commands]);

  const [prevQuery, setPrevQuery] = useState(query);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevQuery !== query || prevOpen !== open) {
    setPrevQuery(query);
    setPrevOpen(open);
    setActive(0);
  }

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const run = (cmd: Cmd) => {
    void cmd.run();
    setPaletteOpen(false);
    setQuery('');
  };

  const grouped = filtered.reduce<Record<string, Cmd[]>>((acc, c) => {
    if (!acc[c.group]) acc[c.group] = [];
    acc[c.group]!.push(c);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-start pt-24 bg-black/60 backdrop-blur-sm fade-in"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl mx-auto glass rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(filtered.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const cmd = filtered[active];
              if (cmd) run(cmd);
            }
          }}
          placeholder="Search MODOS · Navigate · Run action"
          className="w-full bg-transparent px-5 py-4 text-[14.5px] outline-none border-b border-modos-border placeholder:text-modos-subtle"
        />
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group}>
              <div className="px-5 py-1.5 text-[10.5px] uppercase tracking-[0.16em] text-modos-subtle">
                {group}
              </div>
              {cmds.map((cmd) => {
                const isActive = filtered[active]?.id === cmd.id;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => run(cmd)}
                    onMouseEnter={() =>
                      setActive(filtered.findIndex((c) => c.id === cmd.id))
                    }
                    className={cn(
                      'group w-full flex items-center gap-3 px-5 py-2.5 text-[13.5px] transition-colors',
                      isActive ? 'bg-modos-panel/80' : 'hover:bg-modos-panel/40'
                    )}
                  >
                    <Icon
                      className={cn(
                        isActive ? 'text-modos-accent' : 'text-modos-muted'
                      )}
                    />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.hint && <span className="kbd">{cmd.hint}</span>}
                    <IconArrowRight
                      className={cn(
                        'opacity-0 group-hover:opacity-100 transition',
                        'text-modos-subtle'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          ))}
          {!filtered.length && (
            <div className="px-5 py-8 text-center text-[13px] text-modos-muted">
              No matching commands
            </div>
          )}
        </div>
        <div className="px-5 py-2 border-t border-modos-border flex items-center justify-between text-[11px] text-modos-subtle">
          <span className="flex items-center gap-2">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span>
            navigate
          </span>
          <span className="flex items-center gap-2">
            <span className="kbd">↵</span>
            run
            <span className="kbd ml-3">esc</span>
            close
          </span>
        </div>
      </div>
    </div>
  );
};

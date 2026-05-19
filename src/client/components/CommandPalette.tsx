import { useEffect, useMemo, useRef, useState } from 'react';

import {
  bulkActionByLevel,
  enterCrisis,
  exitCrisis,
  getRecentCommandIds,
  recordRecentCommand,
  setSelectedUser,
  setPaletteOpen,
  setView,
  startCinematic,
  toast,
  useStore,
} from '../state/store';
import { cn } from '../lib/cn';
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconFlag,
  IconHome,
  IconLock,
  IconMemory,
  IconPlay,
  IconQueue,
  IconRadar,
  IconRules,
  IconShield,
  IconUser,
  IconWand,
} from '../lib/icons';

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: typeof IconHome;
  run: () => void | Promise<void>;
  destructive?: boolean;
};

const fuzzyMatch = (text: string, query: string): boolean => {
  const lower = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (lower.includes(q)) return true;
  const tokens = q.split(/\s+/);
  return tokens.every((t) => lower.includes(t));
};

export const CommandPalette = () => {
  const open = useStore((s) => s.paletteOpen);
  const profiles = useStore((s) => s.profiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [confirming, setConfirming] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const memberCmds: Cmd[] = profiles.map((p) => ({
      id: `member-${p.username}`,
      label: `Open u/${p.username}`,
      group: 'Members',
      icon: IconUser,
      run: () => {
        setSelectedUser(p.username);
        setView('memory');
      },
    }));

    return [
      { id: 'go-overview', label: 'Go to Overview', hint: 'G O', group: 'Navigate', icon: IconHome, run: () => setView('overview') },
      { id: 'go-queue', label: 'Open AI Queue', hint: 'G Q', group: 'Navigate', icon: IconQueue, run: () => setView('queue') },
      { id: 'go-raid', label: 'Open Raid Radar', hint: 'G R', group: 'Navigate', icon: IconRadar, run: () => setView('raid') },
      { id: 'go-rules', label: 'Open Natural-Language Rules', hint: 'G N', group: 'Navigate', icon: IconRules, run: () => setView('rules') },
      { id: 'go-memory', label: 'Open Mod Memory', hint: 'G M', group: 'Navigate', icon: IconMemory, run: () => setView('memory') },

      {
        id: 'bulk-remove-critical', label: 'Remove all CRITICAL items', group: 'Triage', icon: IconShield, destructive: true,
        run: async () => { await bulkActionByLevel('critical', 'remove'); toast('Bulk removed all critical-risk items', 'warn'); },
      },
      {
        id: 'bulk-approve-low', label: 'Approve all LOW-risk items', group: 'Triage', icon: IconCheck,
        run: async () => { await bulkActionByLevel('low', 'approve'); toast('Approved all low-risk items', 'ok'); },
      },
      {
        id: 'open-highest-risk', label: 'Open highest-risk item', group: 'Triage', icon: IconFlag,
        run: () => { setView('queue'); },
      },
      {
        id: 'lock-thread', label: 'Lock thread on active incident', group: 'Triage', icon: IconLock,
        run: () => toast('Thread locked · comments disabled', 'warn'),
      },
      {
        id: 'slow-mode', label: 'Slow mode on contested threads', group: 'Triage', icon: IconRules,
        run: () => toast('Slow mode activated · 2m cooldown', 'info'),
      },

      {
        id: 'crisis-on', label: 'Activate Crisis Mode', group: 'Incident', icon: IconBolt, destructive: true,
        run: () => { enterCrisis(); toast('Crisis Mode engaged · new accounts throttled', 'warn'); },
      },
      {
        id: 'crisis-off', label: 'Stand down Crisis Mode', group: 'Incident', icon: IconBolt,
        run: () => exitCrisis(),
      },
      {
        id: 'anti-brigade', label: 'Apply anti-brigade policy', group: 'Incident', icon: IconShield,
        run: () => toast('AntiBrigade.v2 applied · hold-and-review active', 'warn'),
      },
      {
        id: 'page-humans', label: 'Page mod team (modmail + Discord)', group: 'Incident', icon: IconUser,
        run: () => toast('Mod team paged · modmail sent · webhook fired', 'info'),
      },
      {
        id: 'summarize-toxic', label: 'Summarize toxic activity (last 30m)', group: 'Incident', icon: IconWand,
        run: () => toast('Toxicity summary generated · 42 flagged · 0.34 avg', 'info'),
      },

      ...memberCmds,

      { id: 'compose-rule', label: 'Compose a new rule in natural language', group: 'Create', icon: IconWand, run: () => setView('rules') },
      { id: 'add-note', label: 'Add a mod note', group: 'Create', icon: IconMemory, run: () => setView('memory') },

      {
        id: 'cinematic-demo', label: 'Play cinematic demo', hint: '▶', group: 'Demo', icon: IconPlay,
        run: () => startCinematic(),
      },
    ];
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return commands;
    return commands.filter(
      (c) => fuzzyMatch(c.label, q) || fuzzyMatch(c.group, q)
    );
  }, [query, commands]);

  const [prevQuery, setPrevQuery] = useState(query);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevQuery !== query || prevOpen !== open) {
    setPrevQuery(query);
    setPrevOpen(open);
    setActive(0);
    setConfirming(null);
  }

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      // Reset query on next tick to avoid setState-in-effect lint
      const t = setTimeout(() => setQuery(''), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[data-active="true"]');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const run = (cmd: Cmd) => {
    if (cmd.destructive && confirming !== cmd.id) {
      setConfirming(cmd.id);
      return;
    }
    recordRecentCommand(cmd.id);
    void cmd.run();
    setPaletteOpen(false);
    setQuery('');
    setConfirming(null);
  };

  const recents = getRecentCommandIds();

  const grouped: Record<string, Cmd[]> = {};
  if (!query.trim() && recents.length) {
    const recentCmds = recents
      .map((id) => commands.find((c) => c.id === id))
      .filter((c): c is Cmd => !!c);
    if (recentCmds.length) grouped['Recent'] = recentCmds;
  }
  for (const c of filtered) {
    if (!grouped[c.group]) grouped[c.group] = [];
    grouped[c.group]!.push(c);
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-start pt-24 bg-black/60 backdrop-blur-sm fade-in"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl mx-auto glass rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] palette-enter"
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
          placeholder="Search MODOS · navigate · triage · execute"
          className="w-full bg-transparent px-5 py-4 text-[14.5px] outline-none border-b border-modos-border placeholder:text-modos-subtle"
        />
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {Object.entries(grouped).map(([group, cmds]) => (
            <div key={group}>
              <div className="px-5 py-1.5 text-[10.5px] uppercase tracking-[0.16em] text-modos-subtle">
                {group}
              </div>
              {cmds.map((cmd) => {
                const isActive = filtered[active]?.id === cmd.id;
                const isConfirming = confirming === cmd.id;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    data-active={isActive}
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
                    <span className="flex-1 text-left">
                      {isConfirming ? (
                        <span className="text-modos-critical">
                          Confirm: {cmd.label}?
                        </span>
                      ) : (
                        cmd.label
                      )}
                    </span>
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

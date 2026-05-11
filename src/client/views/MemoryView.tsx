import { useMemo, useState } from 'react';
import { cn } from '../lib/cn';
import { relativeTime } from '../lib/format';
import {
  addUserNote,
  setSelectedUser,
  useSelectedUserProfile,
  useStore,
} from '../state/store';
import { Sparkline } from '../components/Sparkline';
import { IconMemory, IconPin, IconUser } from '../lib/icons';

export const MemoryView = () => {
  const profiles = useStore((s) => s.profiles);
  const notes = useStore((s) => s.notes);
  const selectedUser = useStore((s) => s.selectedUser);
  const profile = useSelectedUserProfile();
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        p.notes.some((n) => n.body.toLowerCase().includes(q))
    );
  }, [profiles, query]);

  const allNotes = useMemo(
    () => [...notes].sort((a, b) => b.createdAt - a.createdAt),
    [notes]
  );

  return (
    <div className="px-6 py-6 max-w-[1180px] mx-auto space-y-6">
      <div>
        <div className="text-[12px] uppercase tracking-[0.16em] text-modos-muted flex items-center gap-2">
          <IconMemory /> Moderator Memory
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight mt-1">
          A shared brain for your mod team.
        </h1>
        <p className="text-[13.5px] text-modos-muted mt-1.5">
          Decisions, context, and warning history — always one click away when
          reviewing a user.
        </p>
      </div>

      <div className="grid grid-cols-[280px_1fr_360px] gap-4 h-[calc(100vh-220px)]">
        <div className="panel p-3 flex flex-col">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users or notes"
            className="bg-modos-bg-elev border border-modos-border rounded-lg px-3 py-2 text-[12.5px] placeholder:text-modos-subtle outline-none focus:border-modos-border-strong transition mb-2"
          />
          <div className="flex-1 overflow-y-auto space-y-1">
            {matches.map((p) => (
              <button
                key={p.username}
                onClick={() => setSelectedUser(p.username)}
                className={cn(
                  'w-full text-left p-2.5 rounded-lg border transition',
                  selectedUser === p.username
                    ? 'border-modos-border-strong bg-modos-panel'
                    : 'border-transparent hover:bg-modos-panel/50 hover:border-modos-border'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium">u/{p.username}</div>
                  <div className="text-[10.5px] text-modos-subtle">
                    {relativeTime(p.lastSeen)}
                  </div>
                </div>
                <div className="text-[11.5px] text-modos-muted mt-0.5">
                  {p.accountAgeDays}d · {p.karma} karma · {p.warningCount}{' '}
                  warning{p.warningCount === 1 ? '' : 's'} ·{' '}
                  {p.banCount > 0 && (
                    <span className="text-modos-critical">
                      {p.banCount} prior ban{p.banCount === 1 ? '' : 's'}
                    </span>
                  )}
                  {p.banCount === 0 && (
                    <span>
                      {(p.removalRate * 100).toFixed(0)}% removal rate
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-5 overflow-y-auto">
          {!profile ? (
            <div className="text-modos-muted text-[13px] grid place-items-center h-full">
              Select a user to view their MODOS memory.
            </div>
          ) : (
            <ProfileDetail key={profile.username} />
          )}
        </div>

        <div className="panel p-3 flex flex-col">
          <div className="px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-modos-muted">
            All mod notes
          </div>
          <div className="flex-1 overflow-y-auto px-1 space-y-2">
            {allNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedUser(n.username)}
                className="w-full text-left p-2.5 rounded-lg border border-modos-border bg-modos-bg-elev/60 hover:bg-modos-panel transition"
              >
                <div className="flex items-center gap-2 text-[11.5px] text-modos-muted">
                  {n.pinned && (
                    <IconPin className="text-modos-warn" width={11} height={11} />
                  )}
                  <span className="font-mono text-modos-text">u/{n.username}</span>
                  <span className="text-modos-subtle">·</span>
                  <span>u/{n.author}</span>
                  <span className="text-modos-subtle">·</span>
                  <span>{relativeTime(n.createdAt)}</span>
                </div>
                <p className="text-[12.5px] text-modos-text mt-1 leading-snug">
                  {n.body}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileDetail = () => {
  const profile = useSelectedUserProfile()!;
  const notes = useStore((s) => s.notes).filter(
    (n) => n.username === profile.username
  );
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');

  const add = async () => {
    if (!body.trim()) return;
    await addUserNote(
      profile.username,
      body.trim(),
      tag
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    );
    setBody('');
    setTag('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-full bg-gradient-to-br from-modos-accent to-orange-700 grid place-items-center">
              <IconUser className="text-white" />
            </div>
            <div>
              <div className="text-[18px] font-semibold leading-tight">
                u/{profile.username}
              </div>
              <div className="text-[11.5px] text-modos-muted">
                seen {relativeTime(profile.lastSeen)} · {profile.accountAgeDays}{' '}
                day account · {profile.karma} karma
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-modos-muted">
            Toxicity trend (7d)
          </div>
          <Sparkline
            data={profile.toxicityTrend.map((v) => v * 100)}
            width={140}
            height={36}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Removal rate" value={`${(profile.removalRate * 100).toFixed(0)}%`} />
        <Stat label="Warnings" value={profile.warningCount.toString()} />
        <Stat
          label="Prior bans"
          value={profile.banCount.toString()}
          tone={profile.banCount > 0 ? 'critical' : 'default'}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13.5px] font-medium">Notes &amp; history</h3>
          <span className="text-[11px] text-modos-muted">
            {notes.length} {notes.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="panel-inset p-3 flex items-start gap-3"
            >
              {n.pinned && (
                <IconPin
                  className="text-modos-warn mt-0.5"
                  width={12}
                  height={12}
                />
              )}
              <div className="flex-1">
                <div className="text-[11px] text-modos-muted flex items-center gap-2">
                  <span>u/{n.author}</span>
                  <span className="text-modos-subtle">·</span>
                  <span>{relativeTime(n.createdAt)}</span>
                </div>
                <p className="text-[13px] text-modos-text mt-1 leading-snug">
                  {n.body}
                </p>
                {n.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {n.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10.5px] uppercase tracking-wider rounded-md px-1.5 py-0.5 bg-modos-bg border border-modos-border text-modos-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!notes.length && (
            <p className="text-[12.5px] text-modos-muted italic">
              No notes yet for this user.
            </p>
          )}
        </div>
      </div>

      <div className="panel-inset p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-[0.16em] text-modos-muted">
          Add a note
        </div>
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What should future mods know about this user?"
          className="w-full bg-modos-bg border border-modos-border rounded-lg px-3 py-2 text-[13px] placeholder:text-modos-subtle outline-none focus:border-modos-border-strong resize-none"
        />
        <div className="flex gap-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="tags · comma separated"
            className="flex-1 bg-modos-bg border border-modos-border rounded-lg px-3 py-1.5 text-[12.5px] placeholder:text-modos-subtle outline-none focus:border-modos-border-strong"
          />
          <button
            onClick={add}
            disabled={!body.trim()}
            className="px-3 py-1.5 rounded-lg bg-modos-accent text-white text-[12.5px] hover:bg-orange-500 transition"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'critical';
}) => (
  <div className="panel-inset p-3">
    <div className="text-[11px] uppercase tracking-[0.16em] text-modos-muted">
      {label}
    </div>
    <div
      className={cn(
        'text-[20px] font-semibold mt-1 tabular-nums',
        tone === 'critical' && 'text-modos-critical'
      )}
    >
      {value}
    </div>
  </div>
);

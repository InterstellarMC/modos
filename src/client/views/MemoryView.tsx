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
    <div className="route-shell flex min-h-0 flex-1 flex-col space-y-6 sm:space-y-8">
      <section className="hero-surface motion-default p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-modos-border-strong bg-modos-panel text-modos-accent shadow-[var(--shadow-panel)]">
              <IconMemory width={18} height={18} aria-hidden />
            </span>
            <div>
              <span className="t-kicker text-modos-subtle">Mod memory</span>
              <h1 className="t-h1 mt-2 text-modos-text">
                Shared context for decisions
              </h1>
              <p className="t-body mt-2 max-w-2xl text-modos-muted">
                User history, mod notes, and trust signals—surfaced where you
                triage, without tab sprawl.
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev px-3 py-2 text-center sm:text-left">
            <div className="t-kicker text-[10px] text-modos-subtle">Coverage</div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[12px] text-modos-text tabular-nums sm:justify-start">
              <span>{profiles.length} profiles</span>
              <span className="text-modos-subtle">·</span>
              <span>{notes.length} notes</span>
            </div>
          </div>
        </div>
      </section>

      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,300px)] xl:gap-5',
          'xl:max-h-[min(720px,calc(100dvh-12rem))] xl:overflow-hidden'
        )}
      >
        <div className="panel motion-default flex max-h-[420px] flex-col overflow-hidden p-3 sm:p-4 xl:max-h-none">
          <label
            className="t-kicker mb-2 block text-[10px] text-modos-subtle"
            htmlFor="memory-search"
          >
            Directory
          </label>
          <input
            id="memory-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users or note text…"
            className="input-chrome mb-3 w-full px-3 py-2.5 text-[13px]"
          />
          <div className="-mr-1 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {!matches.length ? (
              <div className="empty-well py-8">
                <p className="t-h3 font-medium text-modos-text">No profiles</p>
                <p className="t-body mx-auto mt-2 max-w-xs text-modos-muted">
                  {query.trim()
                    ? 'Nothing matches your search—try broader terms.'
                    : 'Moderator-created notes will populate this directory.'}
                </p>
              </div>
            ) : (
              matches.map((p) => (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => setSelectedUser(p.username)}
                  className={cn(
                    'motion-default w-full rounded-[var(--radius-md)] border px-2.5 py-2 text-left text-[13px]',
                    selectedUser === p.username
                      ? 'border-modos-border-strong bg-modos-panel shadow-[var(--shadow-panel)] ring-1 ring-modos-accent/15'
                      : 'border-transparent hover:border-modos-border hover:bg-modos-bg-elev'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">
                      u/{p.username}
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px] text-modos-subtle tabular-nums">
                      {relativeTime(p.lastSeen)}
                    </span>
                  </div>
                  <div className="mt-1 text-[11.5px] leading-snug text-modos-muted">
                    {p.accountAgeDays}d · {formatKarma(p.karma)} karma ·{' '}
                    {p.warningCount} warn ·{' '}
                    {p.banCount > 0 ? (
                      <span className="font-medium text-modos-critical">
                        {p.banCount} ban{p.banCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span>{(p.removalRate * 100).toFixed(0)}% removals</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="panel motion-default flex min-h-[280px] max-h-[480px] flex-col overflow-hidden p-5 sm:p-6 xl:max-h-none xl:min-h-0 xl:flex-1">
          {!profile ? (
            <div className="empty-well grid flex-1 place-items-center py-14">
              <div>
                <div className="mx-auto mb-3 grid size-10 place-items-center rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev">
                  <IconUser className="text-modos-subtle" aria-hidden />
                </div>
                <p className="t-h3 text-center font-medium text-modos-text">
                  Pick a profile
                </p>
                <p className="t-body mx-auto mt-2 max-w-xs text-center text-modos-muted">
                  Inspect behavioral trend, bans, and the note trail mods left
                  over time.
                </p>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ProfileDetail key={profile.username} />
            </div>
          )}
        </div>

        <div className="panel motion-default flex max-h-[440px] flex-col overflow-hidden p-3 sm:p-4 xl:max-h-none">
          <h2 className="t-kicker border-b border-modos-border pb-2 text-[10px] text-modos-subtle">
            Ledger · all notes
          </h2>
          <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
            {!allNotes.length ? (
              <div className="empty-well py-8">
                <p className="text-[13px] font-medium text-modos-text">
                  No ledger entries yet
                </p>
                <p className="mt-2 text-[12px] text-modos-muted">
                  Compose a profile note and it appears here chronologically for
                  the whole team.
                </p>
              </div>
            ) : (
              allNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelectedUser(n.username)}
                  className="motion-default motion-press w-full rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev/65 p-2.5 text-left hover:border-modos-border-strong hover:bg-modos-panel/80"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-modos-muted">
                    {n.pinned && (
                      <IconPin
                        className="text-modos-warn"
                        width={11}
                        height={11}
                        aria-hidden
                      />
                    )}
                    <span className="font-mono text-[11.5px] text-modos-text">
                      u/{n.username}
                    </span>
                    <span className="text-modos-subtle">→</span>
                    <span>u/{n.author}</span>
                    <span className="font-mono text-modos-subtle tabular-nums">
                      · {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-snug text-modos-text line-clamp-4">
                    {n.body}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatKarma(k: number) {
  return k >= 1000 ? `${(k / 1000).toFixed(1)}k` : `${k}`;
}

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
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full border border-modos-border-strong bg-modos-panel shadow-[var(--shadow-panel)]">
            <IconUser className="text-modos-accent" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[20px] font-semibold tracking-tight text-modos-text">
              u/{profile.username}
            </div>
            <p className="t-meta mt-1 text-modos-muted">
              Seen {relativeTime(profile.lastSeen)} · {profile.accountAgeDays}d
              account · {formatKarma(profile.karma)} karma
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-[var(--radius-md)] border border-modos-border bg-modos-bg/80 px-3 py-2">
          <div className="t-kicker mb-2 text-[10px] text-modos-muted">
            Toxicity (7d)
          </div>
          <Sparkline
            data={profile.toxicityTrend.map((v) => v * 100)}
            width={140}
            height={38}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Removal rate" value={`${(profile.removalRate * 100).toFixed(0)}%`} />
        <Stat label="Warnings" value={profile.warningCount.toString()} />
        <Stat
          label="Prior bans"
          value={profile.banCount.toString()}
          tone={profile.banCount > 0 ? 'critical' : 'default'}
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="t-h3 text-[14px] text-modos-text">Notes timeline</h3>
          <span className="font-mono text-[11px] text-modos-muted tabular-nums">
            {notes.length} entr{notes.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
        <div className="space-y-2">
          {notes.map((n) => (
            <article
              key={n.id}
              className="rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev/50 px-3 py-3 shadow-[var(--shadow-panel)]"
            >
              <div className="flex gap-3">
                {n.pinned && (
                  <IconPin className="mt-1 shrink-0 text-modos-warn" width={12} height={12} aria-label="Pinned" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-modos-muted">
                    <span>u/{n.author}</span>
                    <span className="font-mono text-modos-subtle tabular-nums">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="t-body mt-1 text-modos-text">{n.body}</p>
                  {n.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {n.tags.map((t, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-modos-border bg-modos-panel px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-modos-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {!notes.length ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-modos-border bg-modos-bg-elev/35 px-4 py-8 text-center">
              <p className="text-[13px] text-modos-muted">
                No notes indexed for this user yet—baseline from queue actions
                will appear alongside what you capture below.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-modos-border bg-modos-panel/30 p-4 shadow-[var(--shadow-panel)]">
        <label className="t-kicker text-[10px] text-modos-muted" htmlFor="new-note-body">
          Add moderator note
        </label>
        <textarea
          id="new-note-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Facts the next moderator should inherit—timeouts, brigade links, apology quality…"
          className="input-chrome mt-3 w-full resize-none px-3 py-2.5 text-[13px] leading-relaxed bg-modos-bg sm:py-3"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tags — comma separated"
            className="input-chrome flex-1 px-3 py-2 text-[13px] bg-modos-bg"
          />
          <button
            type="button"
            onClick={add}
            disabled={!body.trim()}
            className="motion-default motion-press shrink-0 rounded-[var(--radius-md)] bg-modos-accent px-5 py-2 text-[13px] font-semibold text-white hover:bg-orange-600"
          >
            Save to ledger
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
  <div className="rounded-[var(--radius-md)] border border-modos-border bg-modos-bg-elev/65 px-3 py-3 shadow-[var(--shadow-panel)] sm:px-4 sm:py-3.5">
    <div className="t-kicker text-[10px] text-modos-muted">{label}</div>
    <div
      className={cn(
        'mt-1.5 text-[20px] font-semibold tabular-nums text-modos-text',
        tone === 'critical' && 'text-modos-critical'
      )}
    >
      {value}
    </div>
  </div>
);

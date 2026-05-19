import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { buildSeed } from '../../shared/seed';
import {
  draftRemoval,
  matchRule as matchRuleSync,
} from '../../shared/reasoning';
import type {
  InitResponse,
  MemoryNote,
  ModRule,
  QueueItem,
  RaidIncident,
  RaidPoint,
  RemovalDraft,
  UserProfile,
} from '../../shared/types';

type AppData = Omit<InitResponse, 'type'>;

export type View =
  | 'overview'
  | 'queue'
  | 'raid'
  | 'rules'
  | 'memory'
  | 'onboarding';

type Toast = {
  id: number;
  text: string;
  tone: 'ok' | 'warn' | 'info';
};

export type ActivityEvent = {
  id: string;
  ts: number;
  icon: 'flag' | 'check' | 'shield' | 'bolt' | 'user' | 'wand';
  message: string;
  tone: 'ok' | 'warn' | 'info' | 'critical' | 'accent';
};

export type AppState = AppData & {
  loading: boolean;
  online: boolean;
  view: View;
  selectedItemId: string | null;
  selectedUser: string | null;
  paletteOpen: boolean;
  toasts: Toast[];
  crisisMode: boolean;
  draft: RemovalDraft | null;
  pendingTone: RemovalDraft['tone'];
  activityFeed: ActivityEvent[];
  aiChecksPerSec: number;
  telemetryTick: number;
  cinematicActive: boolean;
  cinematicStep: number;
  cinematicSubtitle: string;
};

const FALLBACK_SUB = 'r/example';

const now = Date.now();
const INITIAL_ACTIVITY: ActivityEvent[] = [
  { id: 'a0', ts: now - 12000, icon: 'bolt', message: 'MODOS reasoning engine initialized · all signals online', tone: 'ok' },
  { id: 'a1', ts: now - 8000, icon: 'shield', message: 'Crisis policy AntiBrigade.v2 activated · new-account posts held', tone: 'warn' },
  { id: 'a2', ts: now - 3000, icon: 'flag', message: 'u/midnight_owl42 flagged · matched brigading heuristic', tone: 'critical' },
];

const initialState = (): AppState => {
  const seed = buildSeed(FALLBACK_SUB);
  return {
    loading: true,
    online: false,
    view: 'overview',
    selectedItemId: null,
    selectedUser: null,
    paletteOpen: false,
    toasts: [],
    crisisMode: true,
    draft: null,
    pendingTone: 'neutral',
    postId: null,
    username: 'moderator',
    subreddit: FALLBACK_SUB,
    overview: seed.overview,
    queue: seed.queue,
    incident: seed.incident,
    rules: seed.rules,
    notes: seed.notes,
    profiles: seed.profiles,
    activityFeed: INITIAL_ACTIVITY,
    aiChecksPerSec: 142,
    telemetryTick: 0,
    cinematicActive: false,
    cinematicStep: 0,
    cinematicSubtitle: '',
  };
};

let state: AppState = initialState();
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const setState = (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
  const next = typeof partial === 'function' ? partial(state) : partial;
  state = { ...state, ...next };
  emit();
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = (): AppState => state;

export const useStore = <T,>(selector: (s: AppState) => T): T =>
  useSyncExternalStore(subscribe, () => selector(state), () => selector(state));

let toastCounter = 0;

export const toast = (text: string, tone: Toast['tone'] = 'info'): void => {
  const id = ++toastCounter;
  setState((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
  setTimeout(() => {
    setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  }, 3000);
};

export const setView = (view: View): void => {
  setState({ view });
};

export const setSelectedItem = (id: string | null): void => {
  setState({ selectedItemId: id, draft: null });
};

export const setSelectedUser = (username: string | null): void => {
  setState({ selectedUser: username });
};

export const setPaletteOpen = (open: boolean): void => {
  setState({ paletteOpen: open });
};

export const setCrisisMode = (active: boolean): void => {
  setState({ crisisMode: active });
};

const tryFetch = async (path: string, init?: RequestInit) => {
  try {
    const res = await fetch(path, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

export const initApp = async (): Promise<void> => {
  const data = (await tryFetch('/api/init')) as InitResponse | null;
  if (data && data.type === 'init') {
    setState({
      loading: false,
      online: true,
      postId: data.postId,
      username: data.username,
      subreddit: data.subreddit,
      overview: data.overview,
      queue: data.queue,
      incident: data.incident,
      rules: data.rules,
      notes: data.notes,
      profiles: data.profiles,
    });
    return;
  }
  setState({ loading: false, online: false });
  toast('Running in offline demo mode', 'info');
};

export const performAction = async (
  itemId: string,
  action: 'approve' | 'remove' | 'escalate'
): Promise<void> => {
  setState((s) => ({
    queue: s.queue.map((q) =>
      q.id === itemId
        ? {
            ...q,
            status:
              action === 'approve'
                ? 'approved'
                : action === 'remove'
                  ? 'removed'
                  : 'escalated',
          }
        : q
    ),
    overview: {
      ...s.overview,
      pending: Math.max(0, s.overview.pending - 1),
      resolvedToday: s.overview.resolvedToday + 1,
      timeSavedMinutes: s.overview.timeSavedMinutes + 2,
    },
  }));
  toast(
    action === 'approve'
      ? 'Approved'
      : action === 'remove'
        ? 'Removed · response sent'
        : 'Escalated to mod team',
    action === 'remove' ? 'warn' : 'ok'
  );

  if (state.online) {
    await tryFetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, action }),
    });
  }
};

export const bulkActionByLevel = async (
  level: 'critical' | 'high' | 'medium' | 'low',
  action: 'approve' | 'remove' | 'escalate'
): Promise<void> => {
  const targets = state.queue.filter(
    (q) => q.risk.level === level && q.status === 'pending'
  );
  for (const t of targets) await performAction(t.id, action);
};

export const generateDraft = async (
  itemId: string,
  tone: RemovalDraft['tone']
): Promise<void> => {
  setState({ pendingTone: tone });
  const item = state.queue.find((q) => q.id === itemId);
  if (!item) return;
  const fallback = draftRemoval(item, tone);
  if (!state.online) {
    setState({ draft: fallback });
    return;
  }
  const res = await tryFetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, tone }),
  });
  setState({ draft: (res?.draft as RemovalDraft | undefined) ?? fallback });
};

export const clearDraft = (): void => {
  setState({ draft: null });
};

export const compileNaturalRule = async (
  name: string,
  prompt: string
): Promise<{ rule: ModRule; matches: { itemId: string; reason: string }[] }> => {
  const matches = matchRuleSync(prompt, state.queue);
  const rule: ModRule = {
    id: `rule_${Date.now().toString(36)}`,
    name,
    prompt,
    enabled: true,
    matched: matches.length,
    createdAt: Date.now(),
    author: state.username,
    preview: matches.slice(0, 3).map((m) => m.reason),
  };
  setState((s) => ({ rules: [rule, ...s.rules] }));

  if (state.online) {
    const res = await tryFetch('/api/rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, name }),
    });
    if (res?.rule) {
      setState((s) => ({
        rules: s.rules.map((r) => (r.id === rule.id ? (res.rule as ModRule) : r)),
      }));
      return { rule: res.rule as ModRule, matches: res.matches ?? matches };
    }
  }
  return { rule, matches };
};

export const toggleRuleEnabled = async (ruleId: string): Promise<void> => {
  let nextEnabled = false;
  setState((s) => ({
    rules: s.rules.map((r) => {
      if (r.id !== ruleId) return r;
      nextEnabled = !r.enabled;
      return { ...r, enabled: nextEnabled };
    }),
  }));
  if (state.online) {
    await tryFetch('/api/rule/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId, enabled: nextEnabled }),
    });
  }
};

export const addUserNote = async (
  username: string,
  body: string,
  tags: string[]
): Promise<void> => {
  const note: MemoryNote = {
    id: `note_${Date.now().toString(36)}`,
    username,
    body,
    pinned: false,
    author: state.username,
    createdAt: Date.now(),
    tags,
  };
  setState((s) => ({ notes: [note, ...s.notes] }));
  toast('Note saved to mod memory', 'ok');
  if (state.online) {
    await tryFetch('/api/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, body, tags }),
    });
  }
};

export const useSelectedItem = (): QueueItem | null => {
  const id = useStore((s) => s.selectedItemId);
  const queue = useStore((s) => s.queue);
  return useMemo(() => queue.find((q) => q.id === id) ?? null, [queue, id]);
};

export const useSelectedUserProfile = (): UserProfile | null => {
  const username = useStore((s) => s.selectedUser);
  const profiles = useStore((s) => s.profiles);
  return useMemo(
    () => profiles.find((p) => p.username === username) ?? null,
    [profiles, username]
  );
};

export const useIncident = (): RaidIncident => useStore((s) => s.incident);

export const enterCrisis = (): void => setState({ crisisMode: true });
export const exitCrisis = (): void => {
  setState((s) => ({
    crisisMode: false,
    incident: { ...s.incident, status: 'elevated' },
  }));
  toast('Crisis stabilized · ratelimits relaxed', 'ok');
};

export const useToasts = (): Toast[] => useStore((s) => s.toasts);

export const useKeyboardShortcuts = (): void => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setState((s) => ({ paletteOpen: !s.paletteOpen }));
      }
      if (e.key === 'Escape') {
        setState({ paletteOpen: false, selectedItemId: null });
      }
      if (!isMeta && e.key.toLowerCase() === 'g') {
        const next = (ev: KeyboardEvent) => {
          if (ev.key === 'q') setView('queue');
          else if (ev.key === 'r') setView('raid');
          else if (ev.key === 'n') setView('rules');
          else if (ev.key === 'm') setView('memory');
          else if (ev.key === 'o') setView('overview');
          window.removeEventListener('keydown', next);
        };
        window.addEventListener('keydown', next, { once: true });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
};

/* =====================================================
   LIVE TELEMETRY
   ===================================================== */

const ACTIVITY_POOL: Omit<ActivityEvent, 'id' | 'ts'>[] = [
  { icon: 'check', message: 'u/pixelpilgrim approved · trusted contributor · 0 signals', tone: 'ok' },
  { icon: 'flag', message: 'u/newaccount_2026 flagged · ban-evasion fingerprint match', tone: 'critical' },
  { icon: 'shield', message: 'AutoMod held 3 items for review · AntiBrigade.v2', tone: 'warn' },
  { icon: 'wand', message: 'NL rule "Crypto self-promo" matched 2 new items', tone: 'accent' },
  { icon: 'bolt', message: 'Toxicity index declining · 0.38 → 0.29 over 2m', tone: 'info' },
  { icon: 'user', message: 'u/definitely_not_alt behavioral match · alt detection confidence 84%', tone: 'warn' },
  { icon: 'check', message: 'u/gentle_giant approved · retaliatory reports dismissed', tone: 'ok' },
  { icon: 'shield', message: 'Inbound referrer traffic from r/example_brigade subsiding', tone: 'info' },
  { icon: 'flag', message: 'u/crypto_chad_42 flagged · 4th promo link this hour', tone: 'warn' },
  { icon: 'bolt', message: 'Reasoning engine processed 847 signals in 6s', tone: 'ok' },
  { icon: 'wand', message: 'Rule "Brigading from new accounts" auto-escalated 1 item', tone: 'accent' },
  { icon: 'shield', message: 'Slow mode active on 2 contested threads · 2m cooldown', tone: 'info' },
  { icon: 'check', message: 'u/lurker_4_life approved · long-time contributor', tone: 'ok' },
  { icon: 'flag', message: 'Comment velocity spike in megathread · +180% above baseline', tone: 'critical' },
  { icon: 'bolt', message: 'External referrer count dropping · 4 → 1 in 3m', tone: 'ok' },
  { icon: 'user', message: 'u/rage_qu1t last seen 8m ago · toxicity trend escalating', tone: 'warn' },
];

const RECOVERY_POINTS: Omit<RaidPoint, 't'>[] = [
  { posts: 6, comments: 11, reports: 3, toxicity: 0.28 },
  { posts: 5, comments: 9, reports: 2, toxicity: 0.24 },
  { posts: 7, comments: 10, reports: 2, toxicity: 0.21 },
  { posts: 4, comments: 8, reports: 1, toxicity: 0.19 },
  { posts: 5, comments: 7, reports: 1, toxicity: 0.17 },
  { posts: 3, comments: 6, reports: 1, toxicity: 0.15 },
  { posts: 4, comments: 7, reports: 0, toxicity: 0.14 },
  { posts: 5, comments: 8, reports: 1, toxicity: 0.13 },
];

const LIVE_EVENTS: Omit<RaidIncident['events'][0], 'id' | 'ts'>[] = [
  { kind: 'system', message: 'External referrer traffic diminished (4 → 1).', severity: 'low' },
  { kind: 'mod', message: 'MODOS released 6 held items — risk below threshold.', severity: 'low' },
  { kind: 'toxicity', message: 'Toxicity index 0.24 (declining steadily).', severity: 'medium' },
  { kind: 'system', message: 'Auto-throttle relaxing · new-account filter narrowed.', severity: 'low' },
  { kind: 'mod', message: 'Slow mode deactivated on 1 thread — velocity normalized.', severity: 'low' },
];

let activityIdx = 0;
let recoveryIdx = 0;
let liveEventIdx = 0;
let telemetryTimer: ReturnType<typeof setInterval> | null = null;

const telemetryTick = () => {
  const tick = state.telemetryTick + 1;

  const checksBase = 138 + Math.sin(tick * 0.7) * 12 + Math.cos(tick * 0.3) * 8;
  const aiChecksPerSec = Math.round(checksBase);

  const partial: Partial<AppState> = { telemetryTick: tick, aiChecksPerSec };

  if (tick % 3 === 0) {
    partial.overview = {
      ...state.overview,
      resolvedToday: state.overview.resolvedToday + 1,
      timeSavedMinutes: state.overview.timeSavedMinutes + 1,
    };
  }

  if (tick % 4 === 0) {
    const rp = RECOVERY_POINTS[recoveryIdx % RECOVERY_POINTS.length]!;
    recoveryIdx++;
    const newPoint: RaidPoint = { ...rp, t: Date.now() };
    const series = [...state.incident.series.slice(1), newPoint];
    partial.incident = { ...state.incident, series };
  }

  if (tick % 6 === 0) {
    const pool = ACTIVITY_POOL[activityIdx % ACTIVITY_POOL.length]!;
    activityIdx++;
    const evt: ActivityEvent = { ...pool, id: `ae_${tick}`, ts: Date.now() };
    partial.activityFeed = [...(state.activityFeed ?? []).slice(-11), evt];
  }

  if (tick % 10 === 0 && liveEventIdx < LIVE_EVENTS.length) {
    const le = LIVE_EVENTS[liveEventIdx]!;
    liveEventIdx++;
    const newEvent = { ...le, id: `le_${tick}`, ts: Date.now() };
    partial.incident = {
      ...(partial.incident ?? state.incident),
      events: [...(partial.incident ?? state.incident).events, newEvent],
    };
  }

  setState(partial);
};

export const startTelemetry = (): void => {
  if (telemetryTimer) return;
  telemetryTimer = setInterval(telemetryTick, 1000);
};

export const stopTelemetry = (): void => {
  if (telemetryTimer) {
    clearInterval(telemetryTimer);
    telemetryTimer = null;
  }
};

/* =====================================================
   CINEMATIC DEMO MODE
   ===================================================== */

type CinematicBeat = {
  subtitle: string;
  durationMs: number;
  action: () => void;
};

const CINEMATIC_SCRIPT: CinematicBeat[] = [
  {
    subtitle: 'MODOS — The AI-native operating system for Reddit moderation.',
    durationMs: 4000,
    action: () => setView('overview'),
  },
  {
    subtitle: 'A coordinated brigade just hit r/example. MODOS is already on it.',
    durationMs: 4000,
    action: () => {},
  },
  {
    subtitle: 'AI Queue surfaces the highest-risk items first — with reasoning.',
    durationMs: 4500,
    action: () => {
      setView('queue');
      setTimeout(() => {
        const first = state.queue.find((q) => q.status === 'pending');
        if (first) setSelectedItem(first.id);
      }, 800);
    },
  },
  {
    subtitle: 'One-click removal drafts — firm, neutral, or friendly tone.',
    durationMs: 4000,
    action: () => {
      const item = state.queue.find((q) => q.status === 'pending');
      if (item) void generateDraft(item.id, 'firm');
    },
  },
  {
    subtitle: 'Raid Radar: live telemetry, anomaly detection, crisis playbook.',
    durationMs: 5000,
    action: () => {
      setView('raid');
      setSelectedItem(null);
    },
  },
  {
    subtitle: 'Natural-language rules — write moderation policy in plain English.',
    durationMs: 4000,
    action: () => setView('rules'),
  },
  {
    subtitle: 'Mod Memory — institutional knowledge that persists across shifts.',
    durationMs: 3500,
    action: () => {
      setView('memory');
      setSelectedUser('rage_qu1t');
    },
  },
  {
    subtitle: '⌘K — the operational brain. Navigate, triage, execute.',
    durationMs: 3500,
    action: () => setPaletteOpen(true),
  },
  {
    subtitle: 'MODOS. The future of community moderation infrastructure.',
    durationMs: 4000,
    action: () => {
      setPaletteOpen(false);
      setView('overview');
    },
  },
];

export const CINEMATIC_STEP_COUNT = CINEMATIC_SCRIPT.length;

let cinematicTimeouts: ReturnType<typeof setTimeout>[] = [];

export const startCinematic = (): void => {
  stopCinematic();
  setState({ cinematicActive: true, cinematicStep: 0, cinematicSubtitle: '' });

  let delay = 500;
  CINEMATIC_SCRIPT.forEach((beat, i) => {
    const d = delay;
    cinematicTimeouts.push(
      setTimeout(() => {
        setState({ cinematicStep: i, cinematicSubtitle: beat.subtitle });
        beat.action();
      }, d)
    );
    delay += beat.durationMs;
  });

  cinematicTimeouts.push(
    setTimeout(() => {
      setState({ cinematicActive: false, cinematicStep: 0, cinematicSubtitle: '' });
    }, delay)
  );
};

export const stopCinematic = (): void => {
  for (const t of cinematicTimeouts) clearTimeout(t);
  cinematicTimeouts = [];
  setState({ cinematicActive: false, cinematicStep: 0, cinematicSubtitle: '' });
};

/* =====================================================
   PALETTE RECENT COMMANDS
   ===================================================== */

let recentCommandIds: string[] = [];

export const recordRecentCommand = (id: string): void => {
  recentCommandIds = [id, ...recentCommandIds.filter((r) => r !== id)].slice(0, 3);
};

export const getRecentCommandIds = (): string[] => recentCommandIds;

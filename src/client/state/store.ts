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
  RemovalDraft,
  UserProfile,
} from '../../shared/types';

type AppData = Omit<InitResponse, 'type'>;

type View =
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
};

const FALLBACK_SUB = 'r/example';

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

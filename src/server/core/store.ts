import { redis } from '@devvit/web/server';
import { buildSeed } from '../../shared/seed';
import { assessItem, draftRemoval, matchRule } from '../../shared/reasoning';
import type {
  InitResponse,
  MemoryNote,
  ModRule,
  QueueItem,
  RaidIncident,
  RemovalDraft,
  RuleCompileResponse,
  UserProfile,
} from '../../shared/types';

const KEY_QUEUE = 'modos:queue';
const KEY_RULES = 'modos:rules';
const KEY_NOTES = 'modos:notes';
const KEY_PROFILES = 'modos:profiles';
const KEY_INCIDENT = 'modos:incident';
const KEY_OVERVIEW = 'modos:overview';
const KEY_TIMESAVED = 'modos:timesaved';

const safeJSON = <T,>(value: string | undefined | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const seedStore = async (subreddit: string): Promise<void> => {
  const data = buildSeed(subreddit);
  await Promise.all([
    redis.set(KEY_QUEUE, JSON.stringify(data.queue)),
    redis.set(KEY_RULES, JSON.stringify(data.rules)),
    redis.set(KEY_NOTES, JSON.stringify(data.notes)),
    redis.set(KEY_PROFILES, JSON.stringify(data.profiles)),
    redis.set(KEY_INCIDENT, JSON.stringify(data.incident)),
    redis.set(KEY_OVERVIEW, JSON.stringify(data.overview)),
    redis.set(KEY_TIMESAVED, String(data.overview.timeSavedMinutes)),
  ]);
};

export const ensureSeeded = async (subreddit: string): Promise<void> => {
  const existing = await redis.get(KEY_QUEUE);
  if (!existing) await seedStore(subreddit);
};

export const loadInit = async (
  subreddit: string,
  username: string,
  postId: string | null
): Promise<InitResponse> => {
  await ensureSeeded(subreddit);
  const [queueRaw, rulesRaw, notesRaw, profilesRaw, incidentRaw, overviewRaw] =
    await Promise.all([
      redis.get(KEY_QUEUE),
      redis.get(KEY_RULES),
      redis.get(KEY_NOTES),
      redis.get(KEY_PROFILES),
      redis.get(KEY_INCIDENT),
      redis.get(KEY_OVERVIEW),
    ]);
  const fallback = buildSeed(subreddit);
  return {
    type: 'init',
    postId,
    username,
    subreddit,
    overview: safeJSON(overviewRaw, fallback.overview),
    queue: safeJSON(queueRaw, fallback.queue),
    incident: safeJSON(incidentRaw, fallback.incident),
    rules: safeJSON(rulesRaw, fallback.rules),
    notes: safeJSON(notesRaw, fallback.notes),
    profiles: safeJSON(profilesRaw, fallback.profiles),
  };
};

const loadQueue = async (subreddit: string): Promise<QueueItem[]> => {
  const raw = await redis.get(KEY_QUEUE);
  return safeJSON(raw, buildSeed(subreddit).queue);
};

const saveQueue = async (queue: QueueItem[]): Promise<void> => {
  await redis.set(KEY_QUEUE, JSON.stringify(queue));
};

export const applyAction = async (
  subreddit: string,
  itemId: string,
  action: 'approve' | 'remove' | 'escalate'
): Promise<{ queue: QueueItem[]; timeSavedMinutes: number }> => {
  const queue = await loadQueue(subreddit);
  const next = queue.map((q) =>
    q.id === itemId
      ? {
          ...q,
          status:
            action === 'approve'
              ? ('approved' as const)
              : action === 'remove'
                ? ('removed' as const)
                : ('escalated' as const),
        }
      : q
  );
  await saveQueue(next);
  const saved = await redis.incrBy(KEY_TIMESAVED, 2);
  return { queue: next, timeSavedMinutes: saved };
};

export const draftFor = async (
  subreddit: string,
  itemId: string,
  tone: RemovalDraft['tone']
): Promise<RemovalDraft | null> => {
  const queue = await loadQueue(subreddit);
  const item = queue.find((q) => q.id === itemId);
  if (!item) return null;
  return draftRemoval(item, tone);
};

export const scoreText = (body: string, reportReasons: string[] = []): {
  score: number;
  level: string;
  primaryReason: string;
} => {
  const synthetic = {
    username: 'preview',
    accountAgeDays: 30,
    karma: 100,
    isNew: false,
    priorActions: 0,
    trustScore: 50,
  };
  const r = assessItem(body, synthetic, reportReasons);
  return { score: r.score, level: r.level, primaryReason: r.primaryReason };
};

export const compileRule = async (
  subreddit: string,
  prompt: string,
  name: string,
  author: string
): Promise<RuleCompileResponse> => {
  const queue = await loadQueue(subreddit);
  const matches = matchRule(prompt, queue);
  const rule: ModRule = {
    id: `rule_${Date.now().toString(36)}`,
    name,
    prompt,
    enabled: true,
    matched: matches.length,
    createdAt: Date.now(),
    author,
    preview: matches.slice(0, 3).map((m) => m.reason),
  };
  const existingRaw = await redis.get(KEY_RULES);
  const existing = safeJSON<ModRule[]>(existingRaw, []);
  await redis.set(KEY_RULES, JSON.stringify([rule, ...existing]));
  return { rule, matches };
};

export const toggleRule = async (
  ruleId: string,
  enabled: boolean
): Promise<ModRule[]> => {
  const existingRaw = await redis.get(KEY_RULES);
  const existing = safeJSON<ModRule[]>(existingRaw, []);
  const next = existing.map((r) =>
    r.id === ruleId ? { ...r, enabled } : r
  );
  await redis.set(KEY_RULES, JSON.stringify(next));
  return next;
};

export const addNote = async (
  username: string,
  body: string,
  author: string,
  tags: string[]
): Promise<MemoryNote[]> => {
  const existingRaw = await redis.get(KEY_NOTES);
  const existing = safeJSON<MemoryNote[]>(existingRaw, []);
  const note: MemoryNote = {
    id: `note_${Date.now().toString(36)}`,
    username,
    body,
    pinned: false,
    author,
    createdAt: Date.now(),
    tags,
  };
  const next = [note, ...existing];
  await redis.set(KEY_NOTES, JSON.stringify(next));
  return next;
};

export const loadIncident = async (subreddit: string): Promise<RaidIncident> => {
  const raw = await redis.get(KEY_INCIDENT);
  return safeJSON(raw, buildSeed(subreddit).incident);
};

export const loadProfiles = async (subreddit: string): Promise<UserProfile[]> => {
  const raw = await redis.get(KEY_PROFILES);
  return safeJSON(raw, buildSeed(subreddit).profiles);
};

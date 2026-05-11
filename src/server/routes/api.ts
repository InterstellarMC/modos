import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import {
  addNote,
  applyAction,
  compileRule,
  draftFor,
  loadInit,
  loadIncident,
  loadProfiles,
  scoreText,
  toggleRule,
} from '../core/store';
import type { ActionResponse } from '../../shared/types';

export const api = new Hono();

const subredditOf = (): string =>
  context.subredditName ? `r/${context.subredditName}` : 'r/example';

api.get('/init', async (c) => {
  const postId = context.postId ?? null;
  const subreddit = subredditOf();
  let username = 'moderator';
  try {
    const u = await reddit.getCurrentUsername();
    username = u ?? 'moderator';
  } catch {
    // running outside of devvit; fall back
  }
  const data = await loadInit(subreddit, username, postId);
  return c.json(data);
});

api.post('/action', async (c) => {
  const { itemId, action } = await c.req.json<{
    itemId: string;
    action: 'approve' | 'remove' | 'escalate';
  }>();
  const result = await applyAction(subredditOf(), itemId, action);
  return c.json({ ok: true, ...result } satisfies ActionResponse & {
    queue: unknown;
    timeSavedMinutes: number;
  });
});

api.post('/draft', async (c) => {
  const { itemId, tone } = await c.req.json<{
    itemId: string;
    tone: 'firm' | 'friendly' | 'neutral';
  }>();
  const draft = await draftFor(subredditOf(), itemId, tone);
  if (!draft) return c.json({ ok: false, message: 'Item not found' }, 404);
  return c.json({ draft });
});

api.post('/score', async (c) => {
  const { body, reasons } = await c.req.json<{ body: string; reasons?: string[] }>();
  return c.json(scoreText(body, reasons ?? []));
});

api.post('/rule', async (c) => {
  const { prompt, name } = await c.req.json<{ prompt: string; name: string }>();
  let author = 'moderator';
  try {
    author = (await reddit.getCurrentUsername()) ?? 'moderator';
  } catch {
    // ignore
  }
  const result = await compileRule(subredditOf(), prompt, name, author);
  return c.json(result);
});

api.post('/rule/toggle', async (c) => {
  const { ruleId, enabled } = await c.req.json<{ ruleId: string; enabled: boolean }>();
  const rules = await toggleRule(ruleId, enabled);
  return c.json({ rules });
});

api.post('/note', async (c) => {
  const { username, body, tags } = await c.req.json<{
    username: string;
    body: string;
    tags?: string[];
  }>();
  let author = 'moderator';
  try {
    author = (await reddit.getCurrentUsername()) ?? 'moderator';
  } catch {
    // ignore
  }
  const notes = await addNote(username, body, author, tags ?? []);
  return c.json({ notes });
});

api.get('/incident', async (c) => {
  const incident = await loadIncident(subredditOf());
  return c.json({ incident });
});

api.get('/profiles', async (c) => {
  const profiles = await loadProfiles(subredditOf());
  return c.json({ profiles });
});

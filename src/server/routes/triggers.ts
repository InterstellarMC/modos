import { Hono } from 'hono';
import type { OnAppInstallRequest, TriggerResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createConsolePost } from '../core/post';
import { seedStore } from '../core/store';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  try {
    const sub = context.subredditName ? `r/${context.subredditName}` : 'r/example';
    await seedStore(sub);
    const post = await createConsolePost();
    const input = await c.req.json<OnAppInstallRequest>();
    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `MODOS installed in ${sub} · post ${post.id} · trigger ${input.type}`,
      },
      200
    );
  } catch (error) {
    console.error(`MODOS install error: ${error}`);
    return c.json<TriggerResponse>(
      { status: 'error', message: 'Failed to bootstrap MODOS' },
      400
    );
  }
});

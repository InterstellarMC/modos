import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createConsolePost } from '../core/post';
import { seedStore } from '../core/store';

export const menu = new Hono();

menu.post('/open-console', async (c) => {
  try {
    const post = await createConsolePost();
    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}?playtest=modos`,
      },
      200
    );
  } catch (error) {
    console.error(`Error opening console: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to open MODOS console' }, 400);
  }
});

menu.post('/seed-demo', async (c) => {
  try {
    const sub = context.subredditName ? `r/${context.subredditName}` : 'r/example';
    await seedStore(sub);
    return c.json<UiResponse>(
      { showToast: 'MODOS demo data refreshed — open the console.' },
      200
    );
  } catch (error) {
    console.error(`Error seeding demo: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to seed demo data' }, 400);
  }
});

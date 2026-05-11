import { reddit } from '@devvit/web/server';

export const createConsolePost = async () => {
  return await reddit.submitCustomPost({
    title: 'MODOS · Moderation Console',
  });
};

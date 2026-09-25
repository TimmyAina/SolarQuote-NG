import { calls } from './cap-filesystem.mjs';

export const Share = {
  share: async (opts) => {
    calls.shared = opts;
    return { activityType: 'com.whatsapp' };
  }
};

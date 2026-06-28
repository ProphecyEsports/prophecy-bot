import axios from 'axios';

let cachedConfig = null;

const defaultConfig = {
  default_channel: '#prophecy-announcements',
  notifications: {
    scrims:      { enabled: true, channel: '#scrims',      remind: '1hour' },
    events:      { enabled: true, channel: '#events',      remind: '30min' },
    tournaments: { enabled: true, channel: '#tournaments', remind: '1day'  },
  },
  manager_roles: [],
};

export async function refreshConfig() {
  try {
    const { data } = await axios.get(`${process.env.WP_API_URL}/bot-config`, {
      headers: { Authorization: `Bearer ${process.env.BOT_API_SECRET}` },
      params:  { guild_id: process.env.GUILD_ID },
      timeout: 8000,
    });
    cachedConfig = { ...defaultConfig, ...data };
    console.log('[config] Refreshed bot config from WordPress.');
  } catch (err) {
    console.warn('[config] Could not fetch config from WordPress:', err.message);
    if (!cachedConfig) cachedConfig = { ...defaultConfig };
  }
  return cachedConfig;
}

export function getConfig() {
  return cachedConfig ?? { ...defaultConfig };
}

// Auto-refresh every 10 minutes.
setInterval(refreshConfig, 10 * 60 * 1000);

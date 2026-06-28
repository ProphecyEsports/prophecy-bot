import cron from 'node-cron';
import { getConfig } from '../utils/config.js';
import { getScrims } from '../utils/wpApi.js';
import { scrimAnnouncementEmbed } from '../utils/embeds.js';

const sentReminders = new Set();

function minutesUntil(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const dt = new Date(`${dateStr}T${timeStr}:00+10:00`);
  return Math.round((dt.getTime() - Date.now()) / 60_000);
}

function shouldFire(mins, remind) {
  if (mins === null) return false;
  switch (remind) {
    case 'start':  return mins >= -2  && mins <= 5;
    case '30min':  return mins >= 28  && mins <= 32;
    case '1hour':  return mins >= 58  && mins <= 62;
    case '1day':   return mins >= 1438 && mins <= 1442;
    default:       return false;
  }
}

function resolveChannel(guild, channelName) {
  const name = channelName?.replace(/^#/, '');
  return guild.channels.cache.find((c) => c.name === name && c.isTextBased());
}

export function startScrimReminders(client) {
  cron.schedule('*/5 * * * *', async () => {
    const config = getConfig();
    if (!config?.notifications?.scrims?.enabled) return;

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const channel = resolveChannel(guild, config.notifications.scrims.channel);
    if (!channel) return;

    try {
      const { data: scrims } = await getScrims({ status: 'accepted' });
      if (!scrims?.length) return;

      const remind = config.notifications.scrims.remind ?? '1hour';

      for (const scrim of scrims) {
        const mins = minutesUntil(scrim._pcy_scheduled_date, scrim._pcy_scheduled_time);
        if (!shouldFire(mins, remind)) continue;

        const key = `${scrim.id}-${remind}`;
        if (sentReminders.has(key)) continue;

        sentReminders.add(key);
        await channel.send({ embeds: [scrimAnnouncementEmbed(scrim, 'accepted')] });
      }
    } catch (err) {
      console.error('[scrimReminders] Cron error:', err.message);
    }
  });

  console.log('[scrimReminders] Cron started (*/5 * * * *)');
}

export async function handleScrimWebhook(payload, client) {
  const { status, scrim_data: scrim } = payload;
  if (!scrim) return;

  const config  = getConfig();
  const guild   = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const channel = resolveChannel(guild, config?.notifications?.scrims?.channel);
  if (!channel) return;

  const type = status === 'requested' ? 'requested'
             : status === 'accepted'  ? 'accepted'
             : status === 'completed' ? 'completed'
             : null;

  if (!type) return;

  await channel.send({ embeds: [scrimAnnouncementEmbed(scrim, type)] });
}

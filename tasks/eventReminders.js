import cron from 'node-cron';
import { getConfig } from '../utils/config.js';
import { getEvents } from '../utils/wpApi.js';
import { eventReminderEmbed } from '../utils/embeds.js';

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

export function startEventReminders(client) {
  cron.schedule('*/5 * * * *', async () => {
    const config = getConfig();
    if (!config?.notifications?.events?.enabled) return;

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const channel = resolveChannel(guild, config.notifications.events.channel);
    if (!channel) return;

    try {
      const { data: events } = await getEvents({ upcoming: 1 });
      if (!events?.length) return;

      const remind = config.notifications.events.remind ?? '30min';

      for (const event of events) {
        const mins = minutesUntil(event._pcy_event_date, event._pcy_event_time);
        if (!shouldFire(mins, remind)) continue;

        const key = `${event.id}-${remind}`;
        if (sentReminders.has(key)) continue;

        sentReminders.add(key);
        await channel.send({ embeds: [eventReminderEmbed(event, mins <= 5 ? 0 : mins)] });
      }
    } catch (err) {
      console.error('[eventReminders] Cron error:', err.message);
    }
  });

  console.log('[eventReminders] Cron started (*/5 * * * *)');
}

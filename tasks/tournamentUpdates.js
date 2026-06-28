import cron from 'node-cron';
import { getConfig } from '../utils/config.js';
import { getTournaments } from '../utils/wpApi.js';
import { tournamentEmbed } from '../utils/embeds.js';

const sentReminders = new Set();

function minutesUntil(dateStr) {
  if (!dateStr) return null;
  const dt = new Date(dateStr);
  return Math.round((dt.getTime() - Date.now()) / 60_000);
}

function resolveChannel(guild, channelName) {
  const name = channelName?.replace(/^#/, '');
  return guild.channels.cache.find((c) => c.name === name && c.isTextBased());
}

export function startTournamentReminders(client) {
  cron.schedule('*/30 * * * *', async () => {
    const config = getConfig();
    if (!config?.notifications?.tournaments?.enabled) return;

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const channel = resolveChannel(guild, config.notifications.tournaments.channel);
    if (!channel) return;

    try {
      const { data: tournaments } = await getTournaments({ status: 'registration' });
      if (!tournaments?.length) return;

      const remind = config.notifications.tournaments.remind ?? '1day';

      for (const t of tournaments) {
        const mins = minutesUntil(t.start_date);

        const inWindow =
          (remind === '1day'  && mins >= 1438 && mins <= 1442) ||
          (remind === '1hour' && mins >= 58   && mins <= 62)   ||
          (remind === '30min' && mins >= 28   && mins <= 32);

        if (!inWindow) continue;

        const key = `tournament-${t.id}-${remind}`;
        if (sentReminders.has(key)) continue;

        sentReminders.add(key);
        const payload = tournamentEmbed(t, 'registration_open');
        await channel.send(payload);
      }
    } catch (err) {
      console.error('[tournamentUpdates] Cron error:', err.message);
    }
  });

  console.log('[tournamentUpdates] Registration reminder cron started (*/30 * * * *)');
}

export async function handleTournamentWebhook(payload, client) {
  const { type, tournament_data: tournament, match_data: matchData } = payload;
  if (!tournament) return;

  const config  = getConfig();
  const guild   = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const channel = resolveChannel(guild, config?.notifications?.tournaments?.channel);
  if (!channel) return;

  const validTypes = ['registration_open', 'bracket_live', 'match_result', 'champion'];
  if (!validTypes.includes(type)) return;

  const payload_ = tournamentEmbed(tournament, type, matchData ?? null);
  await channel.send(payload_);
}

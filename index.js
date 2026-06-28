import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import express from 'express';

import * as readyEvent           from './events/ready.js';
import * as interactionEvent     from './events/interactionCreate.js';
import * as guildMemberAddEvent  from './events/guildMemberAdd.js';
import * as guildCreateEvent     from './events/guildCreate.js';

import * as pingCmd       from './commands/ping.js';
import * as scrimCmd      from './commands/scrim.js';
import * as tournamentCmd from './commands/tournament.js';
import * as setupCmd      from './commands/setup.js';

import { startScrimReminders, handleScrimWebhook }           from './tasks/scrimReminders.js';
import { startEventReminders }                               from './tasks/eventReminders.js';
import { startTournamentReminders, handleTournamentWebhook } from './tasks/tournamentUpdates.js';

import { syncMembershipRole }  from './utils/roles.js';
import { membershipRoleEmbed } from './utils/embeds.js';
import { refreshConfig, getConfig } from './utils/config.js';

// ── Discord client ─────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ── Command registry ───────────────────────────────────────────────────────────

const commands = new Collection();
for (const cmd of [pingCmd, scrimCmd, tournamentCmd, setupCmd]) {
  commands.set(cmd.data.name, cmd);
}

// ── Register events ────────────────────────────────────────────────────────────

for (const event of [readyEvent, interactionEvent, guildMemberAddEvent, guildCreateEvent]) {
  const handler = event.name === 'interactionCreate'
    ? (...args) => event.execute(...args, commands)
    : (...args) => event.execute(...args);

  if (event.once) {
    client.once(event.name, handler);
  } else {
    client.on(event.name, handler);
  }
}

// ── Express webhook server ─────────────────────────────────────────────────────

const app = express();
app.use(express.json());

function authMiddleware(req, res, next) {
  const expected = `Bearer ${process.env.BOT_API_SECRET}`;
  if (req.headers.authorization !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use('/webhook', authMiddleware);

app.post('/webhook/scrim', async (req, res) => {
  try {
    await handleScrimWebhook(req.body, client);
    res.json({ ok: true });
  } catch (err) {
    console.error('[webhook/scrim]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook/tournament', async (req, res) => {
  try {
    await handleTournamentWebhook(req.body, client);
    res.json({ ok: true });
  } catch (err) {
    console.error('[webhook/tournament]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook/membership', async (req, res) => {
  try {
    const { discord_id, membership_level: tier, action } = req.body;

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    await syncMembershipRole(guild, discord_id, tier, action);

    if (action === 'add') {
      const config    = getConfig();
      const chanName  = config?.default_channel?.replace(/^#/, '');
      const channel   = guild?.channels.cache.find((c) => c.name === chanName && c.isTextBased());

      if (channel) {
        const memberData = await guild.members.fetch(discord_id).catch(() => null);
        const username   = memberData?.user?.username ?? discord_id;
        await channel.send({ embeds: [membershipRoleEmbed(username, tier)] });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[webhook/membership]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook/config', async (req, res) => {
  try {
    await refreshConfig();
    res.json({ ok: true, message: 'Config refreshed.' });
  } catch (err) {
    console.error('[webhook/config]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', bot: client.user?.tag ?? 'not ready' });
});

// ── Boot ───────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => console.log(`[express] Webhook server listening on port ${PORT}`));

client.once('ready', (c) => {
  startScrimReminders(c);
  startEventReminders(c);
  startTournamentReminders(c);
});

client.login(process.env.BOT_TOKEN);

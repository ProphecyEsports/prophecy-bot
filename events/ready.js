import { REST, Routes } from 'discord.js';
import axios from 'axios';
import { ensureMembershipRoles } from '../utils/roles.js';
import { refreshConfig } from '../utils/config.js';
import * as ping       from '../commands/ping.js';
import * as scrim      from '../commands/scrim.js';
import * as tournament from '../commands/tournament.js';
import * as setup      from '../commands/setup.js';

export const name = 'ready';
export const once = true;

export async function execute(client) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  console.log(`[ready] Prophecy Bot online — connected to ${guild?.name ?? 'unknown guild'}`);
  console.log(`[ready] Logged in as ${client.user.tag}`);

  // Register this server with WordPress so the admin panel shows bot controls.
  if (guild) {
    try {
      await axios.post(
        `${process.env.WP_API_URL}/bot-servers`,
        {
          guild_id:   guild.id,
          guild_name: guild.name,
          icon_url:   guild.iconURL() ?? '',
        },
        { headers: { Authorization: `Bearer ${process.env.BOT_API_SECRET}` }, timeout: 8000 }
      );
      console.log(`[ready] Registered server "${guild.name}" with WordPress.`);
    } catch (err) {
      console.warn('[ready] Could not register server with WordPress:', err.message);
    }
  }

  await refreshConfig();
  console.log('[ready] Bot config loaded.');

  if (guild) {
    await ensureMembershipRoles(guild);
    console.log('[ready] Membership roles verified.');
  }

  await registerSlashCommands();
  console.log('[ready] Slash commands registered.');
}

async function registerSlashCommands() {
  const commands = [ping, scrim, tournament, setup].map((cmd) => cmd.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
}

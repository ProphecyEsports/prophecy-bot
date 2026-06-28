import axios from 'axios';

export const name = 'guildCreate';
export const once = false;

export async function execute(guild) {
  console.log(`[guildCreate] Bot added to "${guild.name}" (${guild.id})`);

  try {
    await axios.post(
      `${process.env.WP_API_URL}/bot-servers`,
      {
        guild_id:   guild.id,
        guild_name: guild.name,
        icon_url:   guild.iconURL() ?? '',
      },
      {
        headers: { Authorization: `Bearer ${process.env.BOT_API_SECRET}` },
        timeout: 8000,
      }
    );
    console.log(`[guildCreate] Registered "${guild.name}" with WordPress.`);
  } catch (err) {
    console.warn(`[guildCreate] Could not register server with WordPress: ${err.message}`);
  }
}

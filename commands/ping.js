import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot status and latency.');

export async function execute(interaction) {
  const latency = Date.now() - interaction.createdTimestamp;
  await interaction.reply(`Pong! ✅ Bot is online. Latency: **${latency}ms**`);
}

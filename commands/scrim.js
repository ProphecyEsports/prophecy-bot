import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getScrims } from '../utils/wpApi.js';

export const data = new SlashCommandBuilder()
  .setName('scrim')
  .setDescription('Scrim commands.')
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('List upcoming accepted scrims.')
  );

export async function execute(interaction) {
  if (interaction.options.getSubcommand() !== 'list') return;

  await interaction.deferReply();

  try {
    const { data: scrims } = await getScrims({ status: 'accepted', limit: 5 });

    if (!scrims?.length) {
      await interaction.editReply('No upcoming scrims scheduled.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFF000)
      .setTitle('⚔️ Upcoming Scrims')
      .setFooter({ text: 'Prophecy Esports · prophecyesports.com' })
      .setTimestamp();

    for (const scrim of scrims) {
      embed.addFields({
        name: `${scrim.team1} vs ${scrim.team2}`,
        value: `📅 ${scrim.date} · ⏰ ${scrim.time} AEST · 🎮 ${scrim.game} · BO${scrim.format}`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply('❌ Could not fetch scrims. Please try again later.');
  }
}

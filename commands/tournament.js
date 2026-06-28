import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTournaments } from '../utils/wpApi.js';

const STATUS_LABELS = {
  active:       '🟢 Active',
  registration: '📝 Registration Open',
  completed:    '✅ Completed',
  draft:        '📋 Draft',
};

export const data = new SlashCommandBuilder()
  .setName('tournament')
  .setDescription('Tournament commands.')
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('List active and upcoming tournaments.')
  );

export async function execute(interaction) {
  if (interaction.options.getSubcommand() !== 'list') return;

  await interaction.deferReply();

  try {
    const { data: tournaments } = await getTournaments({ status: 'active,registration' });

    if (!tournaments?.length) {
      await interaction.editReply('No active or upcoming tournaments.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFF000)
      .setTitle('🏆 Tournaments')
      .setFooter({ text: 'Prophecy Esports · prophecyesports.com' })
      .setTimestamp();

    for (const t of tournaments) {
      const statusLabel = STATUS_LABELS[t.status] ?? t.status;
      embed.addFields({
        name: t.name,
        value: `${statusLabel} · Starts ${t.start_date ?? 'TBD'} · Prize: ${t.prize_pool ?? 'TBD'}`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply('❌ Could not fetch tournaments. Please try again later.');
  }
}

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { syncBotConfig, getBotConfig } from '../utils/wpApi.js';
import { getConfig, refreshConfig } from '../utils/config.js';

const NOTIFICATION_TYPES = ['scrims', 'events', 'tournaments', 'default'];
const REMIND_TIMINGS     = ['start', '30min', '1hour', '1day'];

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configure Prophecy Bot (admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName('channel')
      .setDescription('Set the Discord channel for a notification type.')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Notification type')
          .setRequired(true)
          .addChoices(...NOTIFICATION_TYPES.map((t) => ({ name: t, value: t })))
      )
      .addChannelOption((opt) =>
        opt.setName('channel').setDescription('Target channel').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('remind')
      .setDescription('Set the reminder timing for a notification type.')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Notification type')
          .setRequired(true)
          .addChoices(
            { name: 'scrims', value: 'scrims' },
            { name: 'events', value: 'events' },
            { name: 'tournaments', value: 'tournaments' },
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('timing')
          .setDescription('How far in advance to send the reminder')
          .setRequired(true)
          .addChoices(...REMIND_TIMINGS.map((t) => ({ name: t, value: t })))
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('toggle')
      .setDescription('Enable or disable a notification type.')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Notification type')
          .setRequired(true)
          .addChoices(
            { name: 'scrims', value: 'scrims' },
            { name: 'events', value: 'events' },
            { name: 'tournaments', value: 'tournaments' },
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('state')
          .setDescription('on or off')
          .setRequired(true)
          .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' })
      )
  );

async function isManagerRole(interaction) {
  const config = getConfig();
  const managerRoles = config?.manager_roles ?? [];

  if (!managerRoles.length) return true;

  const memberRoleIds = interaction.member.roles.cache.map((r) => r.id);
  return managerRoles.some((roleId) => memberRoleIds.includes(roleId));
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  if (!(await isManagerRole(interaction))) {
    await interaction.editReply('❌ You do not have permission to use this command.');
    return;
  }

  const sub = interaction.options.getSubcommand();

  try {
    if (sub === 'channel') {
      const type    = interaction.options.getString('type');
      const channel = interaction.options.getChannel('channel');
      const key     = type === 'default' ? 'default_channel' : `notifications.${type}.channel`;

      // guild_id is injected automatically by syncBotConfig via wpApi.js
      await syncBotConfig({ key, value: `#${channel.name}` });
      await refreshConfig();

      await interaction.editReply(
        `✅ **${type}** notifications will now post to <#${channel.id}>.`
      );
    }

    if (sub === 'remind') {
      const type   = interaction.options.getString('type');
      const timing = interaction.options.getString('timing');

      await syncBotConfig({ key: `notifications.${type}.remind`, value: timing });
      await refreshConfig();

      await interaction.editReply(
        `✅ **${type}** reminders set to **${timing}** before start.`
      );
    }

    if (sub === 'toggle') {
      const type    = interaction.options.getString('type');
      const enabled = interaction.options.getString('state') === 'on';

      await syncBotConfig({ key: `notifications.${type}.enabled`, value: enabled });
      await refreshConfig();

      await interaction.editReply(
        `✅ **${type}** notifications are now **${enabled ? 'enabled' : 'disabled'}**.`
      );
    }
  } catch (err) {
    await interaction.editReply(`❌ Failed to save setting: ${err.message}`);
  }
}

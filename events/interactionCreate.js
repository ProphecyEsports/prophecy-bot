export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, commands) {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[interactionCreate] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[interactionCreate] Error in /${interaction.commandName}:`, err);

    const errPayload = { content: '❌ An error occurred while running this command.', ephemeral: true };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errPayload).catch(() => {});
    } else {
      await interaction.reply(errPayload).catch(() => {});
    }
  }
}

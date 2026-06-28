export const name = 'guildMemberAdd';
export const once = false;

export async function execute(member) {
  const message = [
    `👋 Welcome to Prophecy Esports, **${member.user.username}**!`,
    '',
    'Link your account at https://prophecyesports.com/login',
    'to unlock XP, tournaments, scrims and team features.',
    '',
    'See you on the battlefield! ⚡',
  ].join('\n');

  try {
    await member.send(message);
  } catch {
    // DMs closed — silently skip.
  }
}

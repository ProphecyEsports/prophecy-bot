import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

const BRAND_COLOR  = 0xFFF000;
const FOOTER_TEXT  = 'Prophecy Esports · prophecyesports.com';
const brandFooter  = () => ({ text: FOOTER_TEXT });
const nowTimestamp = () => new Date();

// ── Scrim ──────────────────────────────────────────────────────────────────────

export function scrimAnnouncementEmbed(scrim, type) {
  const { team1, team2, game, format, date, time, winner, score } = scrim;
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setFooter(brandFooter())
    .setTimestamp(nowTimestamp());

  switch (type) {
    case 'requested':
      embed
        .setTitle(`⚔️ Scrim Requested — ${team1} vs ${team2}`)
        .setDescription('A new scrim has been posted. Waiting for the opposing team to accept.')
        .addFields(
          { name: 'Game',         value: game ?? 'TBD',          inline: true },
          { name: 'Format',       value: `BO${format ?? '?'}`,   inline: true },
          { name: '​',       value: '​',               inline: true },
          { name: 'Date',         value: date ?? 'TBD',          inline: true },
          { name: 'Time',         value: `${time ?? 'TBD'} AEST`,inline: true },
          { name: '​',       value: '​',               inline: true },
          { name: 'Requested by', value: team1,                  inline: true },
          { name: 'Status',       value: 'Pending ⏳',           inline: true },
        );
      break;

    case 'accepted':
      embed
        .setTitle(`⚔️ Scrim Accepted — ${team1} vs ${team2}`)
        .setDescription('Both teams confirmed. Get ready!')
        .addFields(
          { name: 'Game',   value: game ?? 'TBD',          inline: true },
          { name: 'Format', value: `BO${format ?? '?'}`,   inline: true },
          { name: '​', value: '​',               inline: true },
          { name: 'Date',   value: date ?? 'TBD',          inline: true },
          { name: 'Time',   value: `${time ?? 'TBD'} AEST`,inline: true },
        );
      break;

    case 'completed':
      embed
        .setTitle(`⚔️ Scrim Complete — ${team1} vs ${team2}`)
        .setDescription('Staff-approved result. Scrim leaderboard updated.')
        .addFields(
          { name: 'Winner', value: winner ?? 'TBD',          inline: true },
          { name: 'Score',  value: score  ?? 'TBD',          inline: true },
          { name: '​', value: '​',                 inline: true },
          { name: 'Format', value: `BO${format ?? '?'}`,     inline: true },
          { name: 'Date',   value: `${date ?? 'TBD'} · ${time ?? ''} AEST`, inline: true },
        );
      break;

    default:
      embed.setTitle(`⚔️ Scrim — ${team1} vs ${team2}`);
  }

  return embed;
}

// ── Event reminder ─────────────────────────────────────────────────────────────

export function eventReminderEmbed(event, minutesBefore) {
  const prefix = minutesBefore === 0 ? '📅 Starting Now —' : `📅 Match in ${formatMinutes(minutesBefore)} —`;

  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(`${prefix} ${event.title}`)
    .setDescription(event.description ?? '')
    .addFields(
      { name: 'Time',       value: `${event.time ?? 'TBD'} AEST`, inline: true },
      { name: 'Tournament', value: event.tournament ?? 'N/A',      inline: true },
    )
    .setFooter(brandFooter())
    .setTimestamp(nowTimestamp());
}

function formatMinutes(mins) {
  if (mins < 60)  return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

// ── Tournament ─────────────────────────────────────────────────────────────────

export function tournamentEmbed(tournament, type, matchData = null) {
  const { name: tName, start_date, max_teams, entry_fee, prize_pool, format, url } = tournament;

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setFooter(brandFooter())
    .setTimestamp(nowTimestamp());

  switch (type) {
    case 'registration_open': {
      embed
        .setTitle(`🏆 Tournament Open — ${tName}`)
        .setDescription(
          `Registration is now open. **${prize_pool ?? 'TBD'}** prize pool. First come, first served.`
        )
        .addFields(
          { name: 'Starts',     value: start_date  ?? 'TBD', inline: true },
          { name: 'Max Teams',  value: String(max_teams ?? 'TBD'), inline: true },
          { name: '​',     value: '​',              inline: true },
          { name: 'Entry Fee',  value: entry_fee   ?? 'Free', inline: true },
          { name: 'Prize Pool', value: prize_pool  ?? 'TBD',  inline: true },
        );

      if (url) {
        const btn = new ButtonBuilder()
          .setLabel('Register Now')
          .setStyle(ButtonStyle.Link)
          .setURL(url);
        const row = new ActionRowBuilder().addComponents(btn);
        return { embeds: [embed], components: [row] };
      }
      break;
    }

    case 'bracket_live':
      embed
        .setTitle(`🏆 Bracket Live — ${tName}`)
        .setDescription('The bracket has been set. Check your match schedule.')
        .addFields(
          { name: 'Teams',  value: String(tournament.team_count ?? 'TBD'), inline: true },
          { name: 'Format', value: format ?? 'TBD',                        inline: true },
          ...(url ? [{ name: 'View Bracket', value: url, inline: false }] : []),
        );
      break;

    case 'match_result': {
      const { winner, score, round, next_match } = matchData ?? {};
      embed
        .setTitle(`🏆 Match Result — ${tName}`)
        .addFields(
          { name: 'Winner',     value: winner     ?? 'TBD', inline: true },
          { name: 'Score',      value: score      ?? 'TBD', inline: true },
          { name: '​',     value: '​',            inline: true },
          { name: 'Round',      value: round      ?? 'TBD', inline: true },
          { name: 'Next Match', value: next_match ?? 'TBD', inline: true },
        );
      break;
    }

    case 'champion': {
      const winnerTeam  = matchData?.winner  ?? 'Unknown';
      const runnerUp    = matchData?.runner_up ?? 'Unknown';
      embed
        .setTitle(`🏆 Champion Crowned — ${tName}`)
        .setDescription(`👑 **${winnerTeam}** wins the **${tName}**!`)
        .addFields(
          { name: 'Prize Pool', value: prize_pool ?? 'TBD', inline: true },
          { name: 'Runner Up',  value: runnerUp,             inline: true },
        );
      break;
    }

    default:
      embed.setTitle(`🏆 Tournament Update — ${tName}`);
  }

  return { embeds: [embed] };
}

// ── Membership ─────────────────────────────────────────────────────────────────

export function membershipRoleEmbed(username, tier) {
  const tierColors = { Gold: 0xF5D060, Silver: 0xB8C4CC, Bronze: 0xCD7F32 };
  const color = tierColors[tier] ?? BRAND_COLOR;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`⭐ New ${tier} Member — ${username}`)
    .setDescription(`**${username}** has upgraded to **${tier}** membership.`)
    .setFooter(brandFooter())
    .setTimestamp(nowTimestamp());
}

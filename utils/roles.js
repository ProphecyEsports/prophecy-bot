const ROLE_NAMES  = { Bronze: 'Bronze', Silver: 'Silver', Gold: 'Gold' };
const ROLE_COLORS = { Bronze: 0xCD7F32, Silver: 0xB8C4CC, Gold: 0xF5D060 };

const roleIdCache = new Map();

export async function ensureMembershipRoles(guild) {
  if (!guild) return;

  for (const [tier, name] of Object.entries(ROLE_NAMES)) {
    const existing = guild.roles.cache.find((r) => r.name === name);

    if (existing) {
      roleIdCache.set(tier, existing.id);
      continue;
    }

    try {
      const created = await guild.roles.create({
        name,
        color: ROLE_COLORS[tier],
        reason: 'Prophecy Bot — membership tier role',
      });
      roleIdCache.set(tier, created.id);
      console.log(`[roles] Created role: ${name}`);
    } catch (err) {
      console.error(`[roles] Could not create role "${name}":`, err.message);
    }
  }
}

export async function syncMembershipRole(guild, discordId, tier, action) {
  if (!guild) return;

  let member;
  try {
    member = await guild.members.fetch(discordId);
  } catch {
    console.warn(`[roles] Member ${discordId} not found in guild.`);
    return;
  }

  const allTierRoleIds = [...roleIdCache.values()];

  if (action === 'remove') {
    const toRemove = member.roles.cache.filter((r) => allTierRoleIds.includes(r.id));
    if (toRemove.size) await member.roles.remove(toRemove);
    console.log(`[roles] Removed all tier roles from ${member.user.tag}`);
    return;
  }

  if (action === 'add') {
    // Strip existing tier roles first.
    const toRemove = member.roles.cache.filter((r) => allTierRoleIds.includes(r.id));
    if (toRemove.size) await member.roles.remove(toRemove);

    const roleId = roleIdCache.get(tier);
    if (!roleId) {
      console.warn(`[roles] No cached role ID for tier "${tier}". Did ensureMembershipRoles run?`);
      return;
    }

    await member.roles.add(roleId);
    console.log(`[roles] Assigned ${tier} role to ${member.user.tag}`);
  }
}

const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

const OWNER_ID = '1264008617586069586';

function hasAnyRole(member, roleIds) {
  return (roleIds || []).some(roleId => member.roles.cache.has(roleId));
}

function isOwner(userId) {
  return userId === OWNER_ID;
}

function canUseAdminCommands(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  return hasAnyRole(member, config.commandRoleIds);
}

function canManageAllianceAndSanctions(member) {
  if (!member) return false;
  if (canUseAdminCommands(member)) return true;
  return hasAnyRole(member, config.allianceSanctionRoleIds);
}

module.exports = { canUseAdminCommands, canManageAllianceAndSanctions, isOwner };

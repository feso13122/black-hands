const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

function hasAnyRole(member, roleIds) {
  return (roleIds || []).some(roleId => member.roles.cache.has(roleId));
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

module.exports = { canUseAdminCommands, canManageAllianceAndSanctions };

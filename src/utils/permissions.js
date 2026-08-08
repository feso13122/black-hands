const { PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

function canUseAdminCommands(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;

  const allowedRoleIds = config.commandRoleIds || [];
  return allowedRoleIds.some(roleId => member.roles.cache.has(roleId));
}

module.exports = { canUseAdminCommands };

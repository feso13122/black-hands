const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole) {
    const changes = [];
    if (oldRole.name !== newRole.name) {
      changes.push({ name: 'Name', value: `${oldRole.name} → ${newRole.name}`, inline: false });
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push({ name: 'Farbe', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: false });
    }
    if (oldRole.hoist !== newRole.hoist) {
      changes.push({ name: 'Separat angezeigt', value: `${oldRole.hoist} → ${newRole.hoist}`, inline: false });
    }
    if (oldRole.mentionable !== newRole.mentionable) {
      changes.push({ name: 'Erwähnbar', value: `${oldRole.mentionable} → ${newRole.mentionable}`, inline: false });
    }
    if (!oldRole.permissions.equals(newRole.permissions)) {
      changes.push({ name: 'Berechtigungen', value: 'Geändert', inline: false });
    }

    if (changes.length === 0) return;

    const embed = baseEmbed(newRole.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Rolle bearbeitet')
      .addFields(
        { name: 'Rolle', value: `${newRole}`, inline: false },
        ...changes,
        { name: 'ID', value: `${newRole.id}`, inline: false }
      );

    await sendLog(newRole.client, embed);
  }
};

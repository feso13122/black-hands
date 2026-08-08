const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    if (addedRoles.size === 0 && removedRoles.size === 0) return;

    const embed = baseEmbed(newMember.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Rollen aktualisiert')
      .setThumbnail(newMember.user.displayAvatarURL({ size: 128 }))
      .addFields({ name: 'Nutzer', value: `${newMember.user} (${newMember.user.tag})`, inline: false });

    if (addedRoles.size > 0) {
      embed.addFields({ name: 'Hinzugefügt', value: addedRoles.map(r => r.toString()).join(', '), inline: false });
    }
    if (removedRoles.size > 0) {
      embed.addFields({ name: 'Entfernt', value: removedRoles.map(r => r.toString()).join(', '), inline: false });
    }

    await sendLog(newMember.client, embed);
  }
};

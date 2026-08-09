const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    const nicknameChanged = oldMember.nickname !== newMember.nickname;
    const timeoutChanged = oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp;

    if (addedRoles.size === 0 && removedRoles.size === 0 && !nicknameChanged && !timeoutChanged) return;

    const embed = baseEmbed(newMember.client)
      .setColor('#FEE75C')
      .setTitle('🔧 Mitglied aktualisiert')
      .setThumbnail(newMember.user.displayAvatarURL({ size: 128 }))
      .addFields({ name: 'Nutzer', value: `${newMember.user} (${newMember.user.tag})`, inline: false });

    if (addedRoles.size > 0) {
      embed.addFields({ name: 'Rollen hinzugefügt', value: addedRoles.map(r => r.toString()).join(', '), inline: false });
    }
    if (removedRoles.size > 0) {
      embed.addFields({ name: 'Rollen entfernt', value: removedRoles.map(r => r.toString()).join(', '), inline: false });
    }
    if (nicknameChanged) {
      embed.addFields({
        name: 'Nickname',
        value: `${oldMember.nickname || '*Keiner*'} → ${newMember.nickname || '*Keiner*'}`,
        inline: false
      });
    }
    if (timeoutChanged) {
      const until = newMember.communicationDisabledUntilTimestamp;
      embed.addFields({
        name: 'Timeout',
        value: until ? `Bis <t:${Math.floor(until / 1000)}:f>` : 'Aufgehoben',
        inline: false
      });
    }

    await sendLog(newMember.client, embed);
  }
};

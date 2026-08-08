const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban) {
    const embed = baseEmbed(ban.client)
      .setColor('#57F287')
      .setTitle('🔓 Bann aufgehoben')
      .setThumbnail(ban.user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Nutzer', value: `${ban.user.tag}`, inline: false },
        { name: 'ID', value: `${ban.user.id}`, inline: false }
      );

    await sendLog(ban.client, embed);
  }
};

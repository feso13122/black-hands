const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildBanRemove',
  async execute(ban) {
    const embed = baseEmbed()
      .setColor('#57F287')
      .setTitle('🔓 Bann aufgehoben')
      .setThumbnail(ban.user.displayAvatarURL({ size: 128 }))
      .addFields({ name: 'Nutzer', value: `${ban.user.tag}`, inline: false })
      .setFooter({ text: `ID: ${ban.user.id}` });

    await sendLog(ban.client, embed);
  }
};

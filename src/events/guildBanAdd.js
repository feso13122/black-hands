const { baseEmbed } = require('../utils/embeds');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    const embed = baseEmbed()
      .setColor('#ED4245')
      .setTitle('🔨 Mitglied gebannt')
      .setThumbnail(ban.user.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: 'Nutzer', value: `${ban.user.tag}`, inline: false },
        { name: 'Grund', value: ban.reason || 'Kein Grund angegeben', inline: false }
      )
      .setFooter({ text: `ID: ${ban.user.id}` });

    await sendLog(ban.client, embed);
  }
};

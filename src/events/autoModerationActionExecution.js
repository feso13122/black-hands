const { baseEmbed } = require('../utils/embeds');
const { sendCategoryLog } = require('../utils/logger');

module.exports = {
  name: 'autoModerationActionExecution',
  async execute(autoModerationActionExecution) {
    const { client, user, channel, action, ruleId, content } = autoModerationActionExecution;

    const embed = baseEmbed(client)
      .setColor('#ED4245')
      .setTitle('🛡️ AutoMod-Aktion ausgeführt')
      .addFields(
        { name: 'Nutzer', value: user ? `${user} (${user.tag})` : 'Unbekannt', inline: false },
        { name: 'Channel', value: channel ? `${channel}` : 'Unbekannt', inline: false },
        { name: 'Regel-ID', value: `${ruleId}`, inline: false },
        { name: 'Aktion', value: `${action?.type ?? 'Unbekannt'}`, inline: false }
      );

    if (content) {
      embed.addFields({ name: 'Inhalt', value: content.slice(0, 1024) });
    }

    await sendCategoryLog(client, 'logAutoMod', embed);
  }
};
